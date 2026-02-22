-- Quick check and fix for session cost
-- Replace 'YOUR_SESSION_ID' with your actual session ID

-- 1. Check current cost
SELECT id, date, cost, max_players 
FROM sessions 
WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796';

-- 2. If cost is 0 or NULL, update it:
UPDATE sessions 
SET cost = 500  -- Set to your desired amount
WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796';

-- 3. Verify the update
SELECT id, date, cost, max_players 
FROM sessions 
WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796';
