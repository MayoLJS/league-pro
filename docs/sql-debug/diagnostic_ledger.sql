-- Check the session configuration and ledger entries
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check the session details
SELECT id, date, location, time, cost, max_players, status
FROM sessions
WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796';

-- 2. Check registrations and their payment status
SELECT 
    r.id,
    r.registration_order,
    r.payment_status,
    r.paid_at,
    p.name as player_name
FROM registrations r
JOIN players p ON p.id = r.player_id
WHERE r.session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796'
ORDER BY r.registration_order;

-- 3. Check if any ledger entries were created
SELECT 
    l.id,
    l.transaction_date,
    l.description,
    l.type,
    l.amount,
    p.name as player_name
FROM ledger l
LEFT JOIN players p ON p.id = l.player_id
WHERE l.session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796'
ORDER BY l.created_at DESC;

-- 4. Check total that should be collected
SELECT 
    COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_count,
    (SELECT cost FROM sessions WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796') as session_cost,
    COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) * 
    (SELECT cost FROM sessions WHERE id = '17f8bacf-02ba-4837-8f4d-ba540977f796') as expected_total
FROM registrations
WHERE session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796';
