-- ============================================================================
-- Batch Queue Position Updates
-- Migration: 007_batch_queue_updates.sql
-- ============================================================================
-- 
-- Purpose: Optimize team queue updates after match completion
-- - Replaces N+1 query pattern with single batch update
-- - Improves performance for sessions with many teams
--
-- ============================================================================

-- Function to shift queue positions for multiple teams at once
CREATE OR REPLACE FUNCTION shift_queue_positions(
    p_session_id UUID,
    p_excluded_ids UUID[],
    p_shift_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_rows_updated INTEGER;
BEGIN
    -- Update all teams except excluded ones
    UPDATE teams
    SET queue_position = queue_position + p_shift_amount
    WHERE session_id = p_session_id
      AND id != ALL(p_excluded_ids)
      AND queue_position > 1;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    RETURN v_rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION shift_queue_positions(UUID, UUID[], INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION shift_queue_positions IS 
'Batch update queue positions after match completion to avoid N+1 queries';
