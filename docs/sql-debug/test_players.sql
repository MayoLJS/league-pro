-- ============================================================================
-- Test Players for Session 17f8bacf-02ba-4837-8f4d-ba540977f796
-- ============================================================================
-- Creates 20 random players and registers them for testing

-- Insert 20 test players
INSERT INTO players (id, name, preferred_position, caps, man_of_the_match_count, role, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Marcus Johnson', 'ATT', 0, 0, 'player', true),
('22222222-2222-2222-2222-222222222222', 'David Silva', 'MID', 0, 0, 'player', true),
('33333333-3333-3333-3333-333333333333', 'Ryan Thompson', 'DEF', 0, 0, 'player', true),
('44444444-4444-4444-4444-444444444444', 'James Martinez', 'ATT', 0, 0, 'player', true),
('55555555-5555-5555-5555-555555555555', 'Oliver Brown', 'MID', 0, 0, 'player', true),
('66666666-6666-6666-6666-666666666666', 'Lucas Anderson', 'DEF', 0, 0, 'player', true),
('77777777-7777-7777-7777-777777777777', 'Ethan Wilson', 'ATT', 0, 0, 'player', true),
('88888888-8888-8888-8888-888888888888', 'Daniel Garcia', 'MID', 0, 0, 'player', true),
('99999999-9999-9999-9999-999999999999', 'Mason Davis', 'DEF', 0, 0, 'player', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Logan Rodriguez', 'ATT', 0, 0, 'player', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Noah White', 'MID', 0, 0, 'player', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Alexander Lee', 'DEF', 0, 0, 'player', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sebastian Harris', 'ATT', 0, 0, 'player', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Gabriel Clark', 'MID', 0, 0, 'player', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Matthew Walker', 'DEF', 0, 0, 'player', true),
('10101010-1010-1010-1010-101010101010', 'Benjamin Hall', 'ATT', 0, 0, 'player', true),
('20202020-2020-2020-2020-202020202020', 'Samuel Allen', 'MID', 0, 0, 'player', true),
('30303030-3030-3030-3030-303030303030', 'Jackson Young', 'DEF', 0, 0, 'player', true),
('40404040-4040-4040-4040-404040404040', 'Henry King', 'MID', 0, 0, 'player', true),
('50505050-5050-5050-5050-505050505050', 'William Scott', 'ATT', 0, 0, 'player', true)
ON CONFLICT (id) DO NOTHING;

-- Register all 20 players for the session
INSERT INTO registrations (player_id, session_id, payment_status, registration_order) VALUES
('11111111-1111-1111-1111-111111111111', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 1),
('22222222-2222-2222-2222-222222222222', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 2),
('33333333-3333-3333-3333-333333333333', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 3),
('44444444-4444-4444-4444-444444444444', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 4),
('55555555-5555-5555-5555-555555555555', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 5),
('66666666-6666-6666-6666-666666666666', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 6),
('77777777-7777-7777-7777-777777777777', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 7),
('88888888-8888-8888-8888-888888888888', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 8),
('99999999-9999-9999-9999-999999999999', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 9),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 10),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 11),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 12),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 13),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 14),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 15),
('10101010-1010-1010-1010-101010101010', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 16),
('20202020-2020-2020-2020-202020202020', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 17),
('30303030-3030-3030-3030-303030303030', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 18),
('40404040-4040-4040-4040-404040404040', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 19),
('50505050-5050-5050-5050-505050505050', '17f8bacf-02ba-4837-8f4d-ba540977f796', 'PENDING', 20)
ON CONFLICT (player_id, session_id) DO NOTHING;
