-- ============================================================================
-- League Pro - Name-Based Player Identity
-- Migration: 010_name_identity.sql
-- ============================================================================
--
-- Description:
--   1. Adds a UNIQUE constraint on players.name so each name maps to exactly
--      one player record (names become the player's login identity).
--   2. Creates find_or_create_player_by_name() — a SECURITY DEFINER RPC
--      that can be called by the `anon` role (unauthenticated visitors).
--      It atomically finds an existing player by name or creates a new one.
--
-- ⚠️  BEFORE RUNNING: check for duplicate names with:
--      SELECT name, COUNT(*) FROM players GROUP BY name HAVING COUNT(*) > 1;
--   If any duplicates exist, resolve them first.
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- STEP 1: Add UNIQUE constraint on name
-- ============================================================================

ALTER TABLE public.players
  ADD CONSTRAINT players_name_unique UNIQUE (name);


-- ============================================================================
-- STEP 2: find_or_create_player_by_name RPC
-- ============================================================================
-- SECURITY DEFINER means this function runs with the privileges of its owner
-- (postgres/service role), bypassing RLS entirely. This lets anonymous
-- visitors call it safely without exposing the full players table.

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
    v_player RECORD;
    v_created BOOLEAN := FALSE;
BEGIN
    -- Validate: name must not be blank
    IF trim(p_name) = '' THEN
        RAISE EXCEPTION 'Name cannot be empty';
    END IF;

    -- Try to find an existing player with this exact name (case-insensitive)
    SELECT id, name, role, preferred_position
    INTO v_player
    FROM public.players
    WHERE lower(name) = lower(trim(p_name))
    LIMIT 1;

    -- If not found, create a new player
    IF NOT FOUND THEN
        INSERT INTO public.players (
            name,
            preferred_position,
            caps,
            man_of_the_match_count,
            role,
            is_active
        ) VALUES (
            trim(p_name),
            'MID',          -- default position, can be updated in profile
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


-- ============================================================================
-- STEP 3: Grant execute permission to anonymous (unauthenticated) users
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO authenticated;
