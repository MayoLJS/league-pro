-- ============================================================================
-- Fix Registration Race Condition
-- Migration: 004_fix_registration_race.sql
-- ============================================================================
-- 
-- Purpose: Prevent concurrent registration race conditions
-- - Adds unique constraint on (session_id, registration_order)
-- - Creates atomic registration function with row-level locking
-- - Ensures only one player can claim last spot
--
-- ============================================================================

-- Add unique constraint to prevent duplicate registration orders
ALTER TABLE registrations 
ADD CONSTRAINT unique_session_registration_order 
UNIQUE (session_id, registration_order);

-- Add check constraint to ensure registration_order is positive
ALTER TABLE registrations 
ADD CONSTRAINT positive_registration_order 
CHECK (registration_order > 0);

-- ============================================================================
-- Atomic Registration Function
-- ============================================================================
-- This function handles registration with proper locking to prevent race conditions

CREATE OR REPLACE FUNCTION register_player_atomic(
    p_player_id UUID,
    p_session_id UUID,
    p_max_players INTEGER
) RETURNS TABLE(reg_id UUID, reg_order INTEGER) AS $$
DECLARE
    v_current_count INTEGER;
    v_new_registration UUID;
    v_new_order INTEGER;
BEGIN
    -- Lock the session row to prevent concurrent registrations
    PERFORM id FROM sessions WHERE id = p_session_id FOR UPDATE;
    
    -- Get current registration count
    SELECT COUNT(*) INTO v_current_count
    FROM registrations
    WHERE session_id = p_session_id;
    
    -- Check if session is full
    IF v_current_count >= p_max_players THEN
        RAISE EXCEPTION 'Session is full (% / %)', v_current_count, p_max_players;
    END IF;
    
    -- Calculate new order
    v_new_order := v_current_count + 1;
    
    -- Insert with atomic counter
    INSERT INTO registrations (player_id, session_id, payment_status, registration_order)
    VALUES (p_player_id, p_session_id, 'PENDING', v_new_order)
    RETURNING id INTO v_new_registration;
    
    -- Return the new registration
    RETURN QUERY SELECT v_new_registration AS reg_id, v_new_order AS reg_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION register_player_atomic(UUID, UUID, INTEGER) TO authenticated;
