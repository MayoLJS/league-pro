-- ============================================================================
-- League Pro - Public RLS Policies for Sessions & Registrations
-- Migration: 012_public_rls_sessions_registrations.sql
-- ============================================================================
--
-- Problem:
--   Name-login players have no Supabase Auth session (auth.uid() = NULL).
--   The sessions and registrations tables have RLS enabled but NO policies
--   for unauthenticated (anon) reads, so these queries return empty results.
--
-- Fix:
--   1. Add SELECT policies on sessions and registrations that allow anon reads.
--   2. Add INSERT policy on registrations so name-login players can join.
--   3. Grant the anon role EXECUTE on register_player_atomic so the join RPC works.
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================================


-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

-- Make sure RLS is on
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies first
DROP POLICY IF EXISTS "sessions_select_public"  ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_admin"   ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_admin"   ON public.sessions;
DROP POLICY IF EXISTS "sessions_delete_admin"   ON public.sessions;

-- Anyone (anon + authenticated) can read sessions
CREATE POLICY "sessions_select_public"
  ON public.sessions
  FOR SELECT
  USING (true);

-- Only authenticated admins can create sessions
CREATE POLICY "sessions_insert_admin"
  ON public.sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Only authenticated admins can update sessions
CREATE POLICY "sessions_update_admin"
  ON public.sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Only authenticated admins can delete sessions
CREATE POLICY "sessions_delete_admin"
  ON public.sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================================
-- REGISTRATIONS TABLE
-- ============================================================================

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies first
DROP POLICY IF EXISTS "registrations_select_public"        ON public.registrations;
DROP POLICY IF EXISTS "registrations_insert_player"        ON public.registrations;
DROP POLICY IF EXISTS "registrations_update_admin"         ON public.registrations;
DROP POLICY IF EXISTS "registrations_delete_admin"         ON public.registrations;

-- Anyone can read registrations (needed to show registration counts/status)
CREATE POLICY "registrations_select_public"
  ON public.registrations
  FOR SELECT
  USING (true);

-- A player can create their own registration.
-- name-login players have no auth.uid(), so we allow INSERT when player_id
-- matches a real player row (service-role bypasses this anyway via RPC).
CREATE POLICY "registrations_insert_player"
  ON public.registrations
  FOR INSERT
  WITH CHECK (
    -- Authenticated user registering via their own account
    EXISTS (
      SELECT 1 FROM public.players
      WHERE id = player_id
        AND auth_user_id = auth.uid()
    )
    OR
    -- Name-login player (no auth session) — player_id must exist in players table.
    -- The actual join goes through the register_player_atomic RPC with SECURITY DEFINER,
    -- so this policy is a belt-and-suspenders fallback.
    EXISTS (
      SELECT 1 FROM public.players
      WHERE id = player_id
    )
  );

-- Only admins can update registration records (e.g. payment status)
CREATE POLICY "registrations_update_admin"
  ON public.registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Only admins can delete registrations
CREATE POLICY "registrations_delete_admin"
  ON public.registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================================
-- GRANT RPC ACCESS TO ANON
-- ============================================================================
-- register_player_atomic is SECURITY DEFINER, so it runs as the function owner
-- (bypassing RLS). We just need anon to be able to call it.

GRANT EXECUTE ON FUNCTION public.register_player_atomic(UUID, UUID, INTEGER) TO anon;

-- Confirm the find_or_create grant is still present
GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_player_by_name(TEXT) TO authenticated;
