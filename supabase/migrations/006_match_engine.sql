-- Migration: Add Match Engine Tables
-- Description: Tables for matches, match events, and team queue management

-- Add queue_position to teams table
ALTER TABLE teams
ADD COLUMN queue_position INTEGER DEFAULT 1,
ADD COLUMN wins INTEGER DEFAULT 0,
ADD COLUMN draws INTEGER DEFAULT 0,
ADD COLUMN losses INTEGER DEFAULT 0,
ADD COLUMN points INTEGER DEFAULT 0;

-- Create matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_a_score INTEGER DEFAULT 0,
    team_b_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES teams(id),
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create match_events table (goals, cards, etc.)
CREATE TABLE match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('GOAL', 'YELLOW_CARD', 'RED_CARD')),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    assisted_by UUID REFERENCES players(id),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_matches_session ON matches(session_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_teams_queue ON teams(session_id, queue_position);

-- Comments
COMMENT ON TABLE matches IS 'Individual matches within a session';
COMMENT ON TABLE match_events IS 'Events that occur during matches (goals, cards, etc.)';
COMMENT ON COLUMN teams.queue_position IS 'Position in Winner Stays On queue';
COMMENT ON COLUMN teams.wins IS 'Number of wins in current session';
COMMENT ON COLUMN teams.draws IS 'Number of draws in current session';
COMMENT ON COLUMN teams.losses IS 'Number of losses in current session';
COMMENT ON COLUMN teams.points IS 'Points in current session (3 per win, 1 per draw)';
