-- Migration: Add function to increment player caps
-- Description: Batch increment caps for players who participated in a completed match

CREATE OR REPLACE FUNCTION increment_player_caps(p_player_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE players
    SET caps = COALESCE(caps, 0) + 1
    WHERE id = ANY(p_player_ids);
END;
$$;

COMMENT ON FUNCTION increment_player_caps IS 'Increment caps (appearances) for an array of player IDs';
