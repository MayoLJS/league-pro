-- ============================================================================
-- League Pro - Case-Insensitive Name Identity
-- Migration: 011_case_insensitive_name.sql
-- ============================================================================
--
-- Description:
--   1. Replaces the exact-match UNIQUE constraint on players.name with a
--      case-insensitive UNIQUE INDEX on LOWER(name), so "john doe" and
--      "John Doe" are treated as the same identity.
--   2. Updates find_or_create_player_by_name() to:
--        a) Store new names in Title Case (via PostgreSQL initcap())
--        b) Look up existing names using LOWER() comparison
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- STEP 1: Replace exact unique constraint with case-insensitive unique index
-- ============================================================================

-- Drop the exact-match constraint added in migration 010
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_name_unique;

-- Add a functional unique index on LOWER(name) instead.
-- This means "John Doe", "john doe", "JOHN DOE" all collide correctly.
CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_idx
  ON public.players (LOWER(name));


-- ============================================================================
-- STEP 2: Update RPC to normalize name to Title Case + case-insensitive lookup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.find_or_create_player_by_name(p_name TEXT)
RETURNS TABLE (
    player_id         UUID,
    player_name       TEXT,
    player_role       TEXT,
    player_position   TEXT,
    is_new_player     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_player    RECORD;
    v_created   BOOLEAN := FALSE;
    v_normalized TEXT;
BEGIN
    -- Validate: name must not be blank
    IF trim(p_name) = '' THEN
        RAISE EXCEPTION 'Name cannot be empty';
    END IF;

    -- Normalize to Title Case (e.g. "joHN dOE" → "John Doe")
    -- initcap() capitalizes the first letter of each word
    v_normalized := initcap(trim(p_name));

    -- Case-insensitive lookup: find existing player regardless of how name was stored
    SELECT id, name, role, preferred_position
    INTO v_player
    FROM public.players
    WHERE LOWER(name) = LOWER(trim(p_name))
    LIMIT 1;

    -- If not found, create a new player with the normalized (Title Case) name
    IF NOT FOUND THEN
        INSERT INTO public.players (
            name,
            preferred_position,
            caps,
            man_of_the_match_count,
            role,
            is_active
        ) VALUES (
            v_normalized,    -- Always stored as Title Case
            'MID',
            0,
            0,
            'player',
            TRUE
        )
        RETURNING id, name, role, preferred_position
        INTO v_player;

        v_created := TRUE;
    END IF;

    -- Return the player record
    RETURN QUERY SELECT
        v_player.id,
        v_player.name,
        v_player.role,
        v_player.preferred_position,
        v_created;
END;
$$;

-- Re-grant execute permissions (required after OR REPLACE)
GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO authenticated;


-- ============================================================================
-- STEP 3: Normalize all existing names to Title Case
-- ============================================================================
-- Fixes any inconsistently cased names already in the database.

UPDATE public.players
SET name = initcap(name)
WHERE name != initcap(name);
