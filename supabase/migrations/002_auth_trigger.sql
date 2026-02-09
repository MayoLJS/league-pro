-- ============================================================================
-- League Pro - Auth User to Player Sync Trigger
-- Migration: 002_auth_trigger.sql
-- ============================================================================
-- 
-- Description: Creates a PostgreSQL trigger to automatically create a player
--              record when a new user signs up via Supabase Auth.
--              This ensures auth.users are always synchronized with public.players.
--
-- Note: This is an ALTERNATIVE approach to the Server Action sync.
--       You can use EITHER this trigger OR the Server Action in auth-actions.ts
--       Currently, we're using the Server Action approach for more control.
--       This file is provided for reference if you prefer database-level sync.
--
-- Run this in: Supabase SQL Editor (OPTIONAL)
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new player record when a user signs up
  INSERT INTO public.players (
    auth_user_id,
    name,
    phone,
    email,
    preferred_position,
    rating,
    caps,
    man_of_the_match_count,
    role,
    is_active
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Player'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_position', 'MID'),
    5, -- Default rating
    0, -- Initial caps
    0, -- Initial MOTM count
    'player', -- Default role
    TRUE -- Active by default
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- OPTIONAL: Function to handle user deletion
-- ============================================================================
-- Automatically delete player record when auth user is deleted

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.players WHERE auth_user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. If using this trigger, you can simplify the signUp function in 
--    auth-actions.ts by removing the manual player insert.
-- 2. The trigger approach is more fault-tolerant but gives less control
--    over error handling compared to Server Actions.
-- 3. Current implementation uses Server Action approach for better error messages.
-- ============================================================================
