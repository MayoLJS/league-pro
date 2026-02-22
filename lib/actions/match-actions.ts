/**
 * Match Management Actions
 * 
 * Server Actions for managing matches, scoring, and queue system.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface MatchQueueTeam {
    id: string
    name: string
    team_number: number
    wins: number
    draws: number
    losses: number
    points: number
}

/**
 * Get match queue for a session (teams in order)
 */
export async function getMatchQueue(sessionId: string): Promise<MatchQueueTeam[]> {
    const supabase = await createClient()

    const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, team_number, wins, draws, losses, points, queue_position')
        .eq('session_id', sessionId)
        .order('queue_position', { ascending: true })

    if (error) {
        console.error('Error fetching match queue:', error)
        return []
    }

    return teams as MatchQueueTeam[]
}

/**
 * Get current active match for a session
 */
export async function getActiveMatch(sessionId: string) {
    const supabase = await createClient()

    const { data: match, error } = await supabase
        .from('matches')
        .select(`
            id,
            team_home_id,
            team_away_id,
            home_score,
            away_score,
            status,
            team_home:team_home_id (id, name),
            team_away:team_away_id (id, name)
        `)
        .eq('session_id', sessionId)
        .eq('status', 'IN_PROGRESS')
        .single()

    if (error) {
        return null
    }

    return match
}

/**
 * Start a new match (first two teams in queue)
 */
export async function startMatch(sessionId: string): Promise<ActionResult<{ matchId: string }>> {
    try {
        const supabase = await createClient()

        // Authorization: Admin only
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'You must be logged in.' }
        }

        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return { success: false, error: 'Admin access required.' }
        }

        // Get first two teams in queue
        const { data: teams } = await supabase
            .from('teams')
            .select('id, name, queue_position')
            .eq('session_id', sessionId)
            .order('queue_position', { ascending: true })
            .limit(2)

        if (!teams || teams.length < 2) {
            return {
                success: false,
                error: 'Need at least 2 teams to start a match.',
            }
        }

        // Create match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
                session_id: sessionId,
                team_home_id: teams[0].id,
                team_away_id: teams[1].id,
                home_score: 0,
                away_score: 0,
                status: 'IN_PROGRESS',
            })
            .select('id')
            .single()

        if (matchError) {
            console.error('Error creating match:', matchError)
            return {
                success: false,
                error: 'Failed to start match.',
            }
        }

        revalidatePath(`/sessions/${sessionId}`)

        return {
            success: true,
            data: { matchId: match.id },
        }
    } catch (error) {
        console.error('Unexpected error in startMatch:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Record a goal in the current match
 */
export async function recordGoal(
    matchId: string,
    teamId: string,
    scorerId: string,
    assisterId: string | null,
    sessionId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Authorization: Admin only
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'You must be logged in.' }
        }

        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return { success: false, error: 'Admin access required.' }
        }

        // Get current match
        const { data: match } = await supabase
            .from('matches')
            .select('id, team_home_id, team_away_id, home_score, away_score')
            .eq('id', matchId)
            .single()

        if (!match) {
            return {
                success: false,
                error: 'Match not found.',
            }
        }

        // Determine which team scored
        const isHome = teamId === match.team_home_id
        const newHomeScore = isHome ? match.home_score + 1 : match.home_score
        const newAwayScore = !isHome ? match.away_score + 1 : match.away_score

        // Update match score
        const { error: updateError } = await supabase
            .from('matches')
            .update({
                home_score: newHomeScore,
                away_score: newAwayScore,
            })
            .eq('id', matchId)

        if (updateError) {
            console.error('Error updating match:', updateError)
            return {
                success: false,
                error: 'Failed to record goal.',
            }
        }

        // Record goal event
        await supabase.from('match_events').insert({
            match_id: matchId,
            event_type: 'GOAL',
            player_id: scorerId,
            assisted_by: assisterId,
            team_id: teamId,
        })

        revalidatePath(`/sessions/${sessionId}`)

        return {
            success: true,
        }
    } catch (error) {
        console.error('Unexpected error in recordGoal:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * End current match and apply Winner Stays On logic
 */
export async function endMatch(
    matchId: string,
    sessionId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Authorization: Admin only
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'You must be logged in.' }
        }

        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return { success: false, error: 'Admin access required.' }
        }

        // Get match details
        const { data: match } = await supabase
            .from('matches')
            .select('id, team_home_id, team_away_id, home_score, away_score')
            .eq('id', matchId)
            .single()

        if (!match) {
            return {
                success: false,
                error: 'Match not found.',
            }
        }

        const homeScore = match.home_score
        const awayScore = match.away_score

        // Determine result
        let winnerId: string | null = null
        let isDraw = false

        if (homeScore > awayScore) {
            winnerId = match.team_home_id
        } else if (awayScore > homeScore) {
            winnerId = match.team_away_id
        } else {
            isDraw = true
        }

        // Update match status
        await supabase
            .from('matches')
            .update({
                status: 'COMPLETED',
                winner_team_id: winnerId,
            })
            .eq('id', matchId)

        // Increment caps (appearances) for all players in both teams
        const { data: teamAssignments } = await supabase
            .from('team_assignments')
            .select('player_id')
            .in('team_id', [match.team_home_id, match.team_away_id])

        if (teamAssignments && teamAssignments.length > 0) {
            const playerIds = teamAssignments.map(ta => ta.player_id)

            // Increment caps for all players in one query
            await supabase.rpc('increment_player_caps', {
                p_player_ids: playerIds
            })
        }

        // Get all teams to reorder queue
        const { data: teams } = await supabase
            .from('teams')
            .select('id, queue_position, wins, draws, losses, points')
            .eq('session_id', sessionId)
            .order('queue_position', { ascending: true })

        if (!teams) {
            return {
                success: false,
                error: 'Failed to fetch teams.',
            }
        }

        // Apply Winner Stays On logic
        if (isDraw) {
            // DRAW: Both teams go to back of queue (contiguous positions)
            const homeUpdate = teams.find((t) => t.id === match.team_home_id)!
            const awayUpdate = teams.find((t) => t.id === match.team_away_id)!
            const maxPosition = teams.length

            // Update home team to second-to-last position
            await supabase
                .from('teams')
                .update({
                    draws: homeUpdate.draws + 1,
                    points: homeUpdate.points + 1,
                    queue_position: maxPosition - 1,
                })
                .eq('id', match.team_home_id)

            // Update away team to last position
            await supabase
                .from('teams')
                .update({
                    draws: awayUpdate.draws + 1,
                    points: awayUpdate.points + 1,
                    queue_position: maxPosition,
                })
                .eq('id', match.team_away_id)

            // Shift all other teams forward by 2 positions using batch update
            await supabase.rpc('shift_queue_positions', {
                p_session_id: sessionId,
                p_excluded_ids: [match.team_home_id, match.team_away_id],
                p_shift_amount: -2
            })
        } else {
            // WIN: Winner stays at position 1, loser goes to back
            const loserId = winnerId === match.team_home_id ? match.team_away_id : match.team_home_id
            const winnerUpdate = teams.find((t) => t.id === winnerId)!
            const loserUpdate = teams.find((t) => t.id === loserId)!

            // Update winner stats (stays at front)
            const { error: winnerError } = await supabase
                .from('teams')
                .update({
                    wins: winnerUpdate.wins + 1,
                    points: winnerUpdate.points + 3,
                    queue_position: 1,
                })
                .eq('id', winnerId)

            if (winnerError) {
                console.error('Error updating winner stats:', winnerError)
                throw winnerError
            }

            // Update loser stats (goes to back)
            const { error: loserError } = await supabase
                .from('teams')
                .update({
                    losses: loserUpdate.losses + 1,
                    queue_position: teams.length,
                })
                .eq('id', loserId)

            if (loserError) {
                console.error('Error updating loser stats:', loserError)
                throw loserError
            }

            // Shift remaining teams using batch update
            await supabase.rpc('shift_queue_positions', {
                p_session_id: sessionId,
                p_excluded_ids: [winnerId, loserId],
                p_shift_amount: -1
            })
        }

        revalidatePath(`/sessions/${sessionId}`)

        return {
            success: true,
        }
    } catch (error) {
        console.error('Unexpected error in endMatch:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

export interface TopScorer {
    playerId: string
    name: string
    goals: number
    assists: number
    teamName?: string
}

/**
 * Get top scorers for a session.
 * Assisters who never scored are resolved via a secondary name lookup.
 */
export async function getTopScorers(sessionId: string): Promise<TopScorer[]> {
    const supabase = await createClient()

    // 1. Get match IDs for this session
    const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .eq('session_id', sessionId)

    if (!matches || matches.length === 0) {
        return []
    }

    const matchIds = matches.map(m => m.id)

    // 2. Get all goal events with scorer name/team and assister id
    const { data: events, error } = await supabase
        .from('match_events')
        .select(`
            player_id,
            assisted_by,
            event_type,
            players!player_id (name),
            teams (name)
        `)
        .in('match_id', matchIds)
        .eq('event_type', 'GOAL')

    if (error) {
        console.error('Error fetching top scorers:', error)
        return []
    }

    if (!events) return []

    // Aggregate goals and assists
    const scorerMap = new Map<string, TopScorer>()

    events.forEach((event: any) => {
        // Count goals
        const playerId = event.player_id
        if (playerId) {
            if (!scorerMap.has(playerId)) {
                scorerMap.set(playerId, {
                    playerId,
                    name: event.players?.name || 'Unknown',
                    goals: 0,
                    assists: 0,
                    teamName: event.teams?.name,
                })
            }
            scorerMap.get(playerId)!.goals++
        }

        // Count assists (name resolved below for assister-only players)
        const assisterId = event.assisted_by
        if (assisterId) {
            if (!scorerMap.has(assisterId)) {
                scorerMap.set(assisterId, {
                    playerId: assisterId,
                    name: '__PENDING__',
                    goals: 0,
                    assists: 0,
                    teamName: undefined,
                })
            }
            scorerMap.get(assisterId)!.assists++
        }
    })

    // 3. Resolve names for assisters who never scored (batch lookup)
    const unresolvedIds = Array.from(scorerMap.values())
        .filter(p => p.name === '__PENDING__')
        .map(p => p.playerId)

    if (unresolvedIds.length > 0) {
        const { data: players } = await supabase
            .from('players')
            .select('id, name')
            .in('id', unresolvedIds)

        if (players) {
            players.forEach(p => {
                const entry = scorerMap.get(p.id)
                if (entry) entry.name = p.name
            })
        }
    }

    // 4. Return sorted by goals desc, then assists desc
    return Array.from(scorerMap.values())
        .filter(p => p.goals > 0 || p.assists > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
}
