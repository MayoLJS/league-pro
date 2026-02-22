-- Diagnostic query to check if goals are being recorded for this session
-- Run this in Supabase SQL Editor

-- 1. Check if there are any matches for this session
SELECT 
    m.id,
    m.status,
    m.home_score,
    m.away_score,
    t1.name as home_team,
    t2.name as away_team
FROM matches m
LEFT JOIN teams t1 ON t1.id = m.team_home_id
LEFT JOIN teams t2 ON t2.id = m.team_away_id  
WHERE m.session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796'
ORDER BY m.created_at DESC;

-- 2. Check if there are any match_events (goals) for this session's matches
SELECT 
    me.id,
    me.match_id,
    me.event_type,
    me.player_id,
    me.assister_id,
    p.name as scorer_name,
    p2.name as assister_name,
    t.name as team_name,
    me.created_at
FROM match_events me
LEFT JOIN players p ON p.id = me.player_id
LEFT JOIN players p2 ON p2.id = me.assister_id
LEFT JOIN teams t ON t.id = me.team_id
WHERE me.match_id IN (
    SELECT id FROM matches WHERE session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796'
)
ORDER BY me.created_at DESC;

-- 3. Count goals per player for this session
SELECT 
    p.name as player_name,
    COUNT(*) as goals,
    t.name as team_name
FROM match_events me
JOIN players p ON p.id = me.player_id
LEFT JOIN teams t ON t.id = me.team_id
WHERE me.match_id IN (
    SELECT id FROM matches WHERE session_id = '17f8bacf-02ba-4837-8f4d-ba540977f796'
)
AND me.event_type = 'GOAL'
GROUP BY p.id, p.name, t.name
ORDER BY goals DESC;
