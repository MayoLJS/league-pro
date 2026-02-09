/**
 * Session Management Actions
 * 
 * Server Actions for creating and managing football sessions.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface CreateSessionInput {
    date: string // YYYY-MM-DD format
    time?: string // HH:MM format
    venue?: string
    max_players?: number
    cost: number
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Create a new football session
 */
export async function createSession(
    input: CreateSessionInput
): Promise<ActionResult<{ sessionId: string }>> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to create a session.',
            }
        }

        // Get the player record to verify admin role
        const { data: player } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!player || player.role !== 'admin') {
            return {
                success: false,
                error: 'You must be an admin to create sessions.',
            }
        }

        // Check if a session already exists for this date
        const { data: existingSession } = await supabase
            .from('sessions')
            .select('id')
            .eq('date', input.date)
            .single()

        if (existingSession) {
            return {
                success: false,
                error: 'A session already exists for this date.',
            }
        }

        // Create the session
        const { data, error } = await supabase
            .from('sessions')
            .insert({
                date: input.date,
                time: input.time || null,
                venue: input.venue || null,
                max_players: input.max_players || 14,
                cost: input.cost,
                status: 'OPEN',
                purse_balance: 0,
                created_by: player.id,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Database error creating session:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            })
            return {
                success: false,
                error: `Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`,
            }
        }

        revalidatePath('/sessions')
        revalidatePath('/portal')

        return {
            success: true,
            data: { sessionId: data.id },
        }
    } catch (error) {
        console.error('Unexpected error in createSession:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
            success: false,
            error: `Unexpected error: ${errorMessage}`,
        }
    }
}

/**
 * Get all sessions
 */
export async function getAllSessions() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching sessions:', error)
        return []
    }

    return data
}

/**
 * Get a single session by ID
 */
export async function getSessionById(sessionId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (error) {
        console.error('Error fetching session:', error)
        return null
    }

    return data
}

/**
 * End a session and start voting
 */
export async function endSession(sessionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const { data: player } = await supabase
            .from('players')
            .select('role')
            .eq('auth_user_id', user.id)
            .single()

        if (!player || player.role !== 'admin') {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('sessions')
            .update({ status: 'VOTING' })
            .eq('id', sessionId)

        if (error) throw error

        revalidatePath(`/admin/sessions/${sessionId}`)
        return { success: true }
    } catch (error) {
        console.error('Error ending session:', error)
        return { success: false, error: 'Failed to end session' }
    }
}

/**
 * Cast a vote for Man of the Match
 */
export async function castVote(
    sessionId: string,
    votedForId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Get player ID
        const { data: player } = await supabase
            .from('players')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

        if (!player) return { success: false, error: 'Player profile not found' }

        // Check if session is in VOTING state
        const { data: session } = await supabase
            .from('sessions')
            .select('status')
            .eq('id', sessionId)
            .single()

        if (session?.status !== 'VOTING') {
            return { success: false, error: 'Voting is not open for this session' }
        }

        // Insert vote
        const { error } = await supabase
            .from('votes')
            .insert({
                session_id: sessionId,
                voter_id: player.id,
                voted_for_id: votedForId,
            })

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'You have already voted' }
            }
            throw error
        }

        revalidatePath(`/portal`)
        revalidatePath(`/admin/sessions/${sessionId}`)
        return { success: true }
    } catch (error) {
        console.error('Error casting vote:', error)
        return { success: false, error: 'Failed to cast vote' }
    }
}

/**
 * Close voting and determine the winner
 */
export async function closeVoting(sessionId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const { data: admin } = await supabase
            .from('players')
            .select('role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return { success: false, error: 'Unauthorized' }
        }

        // Count votes
        const { data: votes, error: votesError } = await supabase
            .from('votes')
            .select('voted_for_id')
            .eq('session_id', sessionId)

        if (votesError) throw votesError

        // Determine winner(s)
        const voteCounts: Record<string, number> = {}
        votes?.forEach((vote) => {
            voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1
        })

        let winnerId: string | null = null
        let maxVotes = 0

        // Simple winner determination (first one found if tie)
        // TODO: Handle ties better if needed
        for (const [playerId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count
                winnerId = playerId
            }
        }

        // If no votes, winnerId remains null

        // Update session
        const { error: sessionError } = await supabase
            .from('sessions')
            .update({
                status: 'COMPLETED',
                man_of_the_match_id: winnerId,
            })
            .eq('id', sessionId)

        if (sessionError) throw sessionError

        // Increment player's MOTM count if there is a winner
        if (winnerId) {
            const { data: winner } = await supabase
                .from('players')
                .select('man_of_the_match_count')
                .eq('id', winnerId)
                .single()

            if (winner) {
                await supabase
                    .from('players')
                    .update({
                        man_of_the_match_count: (winner.man_of_the_match_count || 0) + 1,
                    })
                    .eq('id', winnerId)
            }
        }

        revalidatePath(`/admin/sessions/${sessionId}`)
        return { success: true }
    } catch (error) {
        console.error('Error closing voting:', error)
        return { success: false, error: 'Failed to close voting' }
    }
}
