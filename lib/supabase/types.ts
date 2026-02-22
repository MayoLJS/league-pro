/**
 * Database Type Definitions
 * 
 * These types are manually defined based on the database schema.
 * In a production app, you would generate these automatically using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 */

export type Position = 'DEF' | 'MID' | 'ATT'

export type SessionStatus = 'OPEN' | 'LOCKED' | 'IN_PROGRESS' | 'VOTING' | 'COMPLETED' | 'CANCELLED'

export type PaymentStatus = 'PAID' | 'PENDING' | 'WAIVED' | 'REFUNDED'

export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type LedgerType = 'CREDIT' | 'DEBIT'

export type UserRole = 'player' | 'admin'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Player {
    id: string
    created_at: string
    updated_at: string
    auth_user_id: string | null
    name: string
    phone: string | null
    email: string | null
    preferred_position: Position
    caps: number
    man_of_the_match_count: number
    role: UserRole
    is_active: boolean
}

export interface Session {
    id: string
    created_at: string
    updated_at: string
    date: string
    time: string | null
    venue: string | null
    status: SessionStatus
    max_players: number
    cost: number
    purse_balance: number
    man_of_the_match_id: string | null
    created_by: string | null
}

export interface Registration {
    id: string
    created_at: string
    updated_at: string
    player_id: string
    session_id: string
    payment_status: PaymentStatus
    paid_at: string | null
    registration_order: number | null
    attended: boolean | null
}

export interface Team {
    id: string
    created_at: string
    session_id: string
    name: string
    color: string | null
    team_number: number | null
    defenders_count: number
    midfielders_count: number
    attackers_count: number
    wins: number
    draws: number
    losses: number
    points: number
    queue_position: number | null
}

export interface TeamAssignment {
    id: string
    created_at: string
    team_id: string
    player_id: string
    is_captain: boolean
}

export interface Match {
    id: string
    created_at: string
    updated_at: string
    session_id: string
    team_home_id: string | null
    team_away_id: string | null
    match_number: number | null
    status: MatchStatus
    home_score: number
    away_score: number
    winner_team_id: string | null
    match_start: string | null
    match_end: string | null
}

export interface LedgerEntry {
    id: string
    created_at: string
    transaction_date: string
    description: string
    type: LedgerType
    amount: number
    player_id: string | null
    session_id: string | null
    notes: string | null
    created_by: string | null
}

// ============================================================================
// JOINED TYPES (for queries with relationships)
// ============================================================================

export interface RegistrationWithPlayer extends Registration {
    players: Player
}

export interface RegistrationWithSession extends Registration {
    sessions: Session
}

export interface TeamWithPlayers extends Team {
    team_assignments: (TeamAssignment & {
        players: Player
    })[]
}

export interface MatchWithTeams extends Match {
    team_home: Team | null
    team_away: Team | null
    winner_team: Team | null
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type PlayerInsert = Omit<Player, 'id' | 'created_at' | 'updated_at'>

export type SessionInsert = Omit<Session, 'id' | 'created_at' | 'updated_at'>

export type RegistrationInsert = Omit<Registration, 'id' | 'created_at' | 'updated_at'>

export type TeamInsert = Omit<Team, 'id' | 'created_at'>

export type TeamAssignmentInsert = Omit<TeamAssignment, 'id' | 'created_at'>

// ============================================================================
// UPDATE TYPES (for updating records)
// ============================================================================

export type PlayerUpdate = Partial<Omit<Player, 'id' | 'created_at'>>

export type SessionUpdate = Partial<Omit<Session, 'id' | 'created_at'>>

export type RegistrationUpdate = Partial<Omit<Registration, 'id' | 'created_at'>>
