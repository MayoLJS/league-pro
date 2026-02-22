-- ============================================================================
-- League Pro - RLS Policies for Players Table + Caps Backfill
-- Migration: 009_rls_players_policy.sql
-- ============================================================================
--
-- Description:
--   1. Adds Row Level Security policies to the players table so that:
--        - Any visitor (anon/authenticated) can READ player profiles
--        - A newly-signed-up user can INSERT their own player row
--        - A user can UPDATE only their own player row
--        - Only admins can DELETE player rows
--   2. Backfills the `caps` column with the true count of completed matches
--      each player has participated in (via team_assignments -> matches).
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- PART 1: RLS POLICIES FOR public.players
-- ============================================================================

-- Drop any pre-existing policies to avoid conflicts
DROP POLICY IF EXISTS "players_select_public"  ON public.players;
DROP POLICY IF EXISTS "players_insert_own"     ON public.players;
DROP POLICY IF EXISTS "players_update_own"     ON public.players;
DROP POLICY IF EXISTS "players_delete_admin"   ON public.players;

-- Allow everyone (anon and authenticated) to read all player profiles
CREATE POLICY "players_select_public"
  ON public.players
  FOR SELECT
  USING (true);

-- Allow INSERT when:
--   a) auth_user_id matches the caller (standard authenticated signup), OR
--   b) auth_user_id IS NULL (admin-created placeholder players without an auth account)
-- The service-role key bypasses RLS entirely, so this policy mainly covers
-- edge cases where the session has propagated before the insert.
CREATE POLICY "players_insert_own"
  ON public.players
  FOR INSERT
  WITH CHECK (
    auth.uid() = auth_user_id
    OR auth_user_id IS NULL
  );

-- Allow authenticated users to update only their own row
CREATE POLICY "players_update_own"
  ON public.players
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Allow DELETE only for users who have the 'admin' role in this same table
CREATE POLICY "players_delete_admin"
  ON public.players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.players AS admin_check
      WHERE admin_check.auth_user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
  );


-- ============================================================================
-- PART 2: BACKFILL caps FROM ACTUAL MATCH PARTICIPATION
-- ============================================================================
-- Sets players.caps to the count of COMPLETED matches their team took part in.
-- This fixes all historical records that were created before the
-- increment_player_caps trigger was in place.

UPDATE public.players p
SET caps = (
  SELECT COUNT(DISTINCT m.id)
  FROM public.team_assignments ta
  JOIN public.teams t         ON ta.team_id = t.id
  JOIN public.matches m       ON (m.team_home_id = t.id OR m.team_away_id = t.id)
  WHERE ta.player_id = p.id
    AND m.status = 'COMPLETED'
);


-- ============================================================================
-- PART 3: GRANT EXECUTE PERMISSIONS (safety net)
-- ============================================================================

-- Authenticated users can call the registration helper
GRANT EXECUTE ON FUNCTION register_player_atomic(UUID, UUID, INTEGER) TO authenticated;

-- Service role (used in our signUp Server Action) must bypass RLS —
-- this is automatic for service_role in Supabase; no explicit grant needed.
