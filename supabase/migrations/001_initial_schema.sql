-- ============================================================================
-- League Pro - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================
-- 
-- Description: Creates the base tables from the friday-league-pro project
--              with updates for League Pro requirements.
--
-- Key Changes from Original:
-- - Position constraint updated to DEF/MID/ATT only (NO GK)
-- - Added auth_user_id for Supabase Auth integration
-- - Added role field to players table
-- - Enhanced sessions table with more configuration options
-- - Team assignments structure preserved from original
--
-- Run this in: Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. PLAYERS TABLE
-- ============================================================================
-- Central registry of all players in the system
-- Linked to Supabase Auth for authentication

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Authentication Link
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile Information
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  
  -- Football Profile (OUTFIELD ONLY - NO GK)
  preferred_position TEXT NOT NULL CHECK (preferred_position IN ('DEF', 'MID', 'ATT')),
  
  -- Player Stats (from old project)
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 10),
  caps INTEGER DEFAULT 0,
  man_of_the_match_count INTEGER DEFAULT 0,
  
  -- Role Management
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_auth_user_id ON public.players(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_players_phone ON public.players(phone);
CREATE INDEX IF NOT EXISTS idx_players_role ON public.players(role);
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(preferred_position);

-- ============================================================================
-- 2. SESSIONS TABLE
-- ============================================================================
-- Individual football sessions/events

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Session Details
  date DATE NOT NULL,
  time TIME,
  venue TEXT,
  
  -- Status Management
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  
  -- Configuration
  max_players INTEGER DEFAULT 14 CHECK (max_players > 0),
  cost NUMERIC DEFAULT 500.00 CHECK (cost >= 0),
  
  -- Financial Tracking
  purse_balance NUMERIC DEFAULT 0,
  
  -- Creator
  created_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_session_date UNIQUE(date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON public.sessions(created_by);

-- ============================================================================
-- 3. REGISTRATIONS TABLE
-- ============================================================================
-- Player sign-ups for sessions (First-come, first-served)

CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relationships
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Payment Status
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'WAIVED', 'REFUNDED')),
  paid_at TIMESTAMPTZ,
  
  -- Registration Order (for first-come, first-served)
  registration_order INTEGER,
  
  -- Attendance Tracking
  attended BOOLEAN DEFAULT NULL,
  
  CONSTRAINT unique_player_session UNIQUE(player_id, session_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_player_id ON public.registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_registrations_session_id ON public.registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_registrations_order ON public.registrations(session_id, registration_order);

-- ============================================================================
-- 4. TEAMS TABLE
-- ============================================================================
-- Generated teams for each session

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relationships
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Team Info
  name TEXT NOT NULL,
  color TEXT,
  team_number INTEGER,
  
  -- Position Counts (for balance tracking)
  defenders_count INTEGER DEFAULT 0,
  midfielders_count INTEGER DEFAULT 0,
  attackers_count INTEGER DEFAULT 0,
  
  CONSTRAINT unique_session_team_number UNIQUE(session_id, team_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_session_id ON public.teams(session_id);

-- ============================================================================
-- 5. TEAM ASSIGNMENTS TABLE
-- ============================================================================
-- Maps players to teams for a specific session

CREATE TABLE IF NOT EXISTS public.team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relationships
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  
  -- Captain Flag
  is_captain BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT unique_team_player UNIQUE(team_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_assignments_team_id ON public.team_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_player_id ON public.team_assignments(player_id);

-- ============================================================================
-- 6. MATCHES TABLE
-- ============================================================================
-- Match results for each session

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relationships
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  team_home_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_away_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- Match Info
  match_number INTEGER,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  
  -- Scores
  home_score INTEGER DEFAULT 0 CHECK (home_score >= 0),
  away_score INTEGER DEFAULT 0 CHECK (away_score >= 0),
  
  -- Winner
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  
  -- Timing
  match_start TIMESTAMPTZ,
  match_end TIMESTAMPTZ,
  
  CONSTRAINT unique_session_match_number UNIQUE(session_id, match_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_session_id ON public.matches(session_id);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON public.matches(team_home_id, team_away_id);

-- ============================================================================
-- 7. LEDGER TABLE
-- ============================================================================
-- Financial transactions (Income and Expenses)

CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Transaction Details
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  
  -- Type and Amount
  type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  
  -- Optional Relationships
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.players(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_transaction_date ON public.ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger(type);
CREATE INDEX IF NOT EXISTS idx_ledger_session_id ON public.ledger(session_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Security policies will be added in migration 005_rls_policies.sql

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- INITIAL SETUP COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run migration 002_add_stats_table.sql for lifetime statistics
-- 2. Run migration 003_add_match_events.sql for temporary match data
-- 3. Run migration 004_enhanced_finance.sql for detailed finance tracking
-- 4. Run migration 005_rls_policies.sql for security policies
-- ============================================================================
