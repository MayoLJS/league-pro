/**
 * Team Management Actions
 * 
 * Server Actions for generating and persisting balanced teams.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateBalancedTeams } from '@/lib/utils/teamBalancing'

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface GeneratedTeam {
    name: string
    captain: {
        id: string
        name: string
        position: string
    }
    players: Array<{
        id: string
        name: string
        position: string
    }>
    positionCounts: {
        DEF: number
        MID: number
        ATT: number
    }
}

/**
 * Generate balanced teams from paid registrations
 */
export async function generateTeamsForSession(
    sessionId: string,
    playersPerTeam: number = 7
): Promise<ActionResult<{ teams: GeneratedTeam[] }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                error: 'You must be logged in.',
            }
        }

        // Verify admin role
        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return {
                success: false,
                error: 'You must be an admin to generate teams.',
            }
        }

        // Get all PAID registrations in registration order
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
                id,
                registration_order,
                players:player_id (
                    id,
                    name,
                    preferred_position
                )
            `)
            .eq('session_id', sessionId)
            .eq('payment_status', 'PAID')
            .order('registration_order', { ascending: true })

        if (regError) {
            console.error('Error fetching registrations:', regError)
            return {
                success: false,
                error: 'Failed to fetch registrations.',
            }
        }

        if (!registrations || registrations.length < 4) {
            return {
                success: false,
                error: 'Need at least 4 paid players to generate teams.',
            }
        }

        // Convert to player format for teamBalancing utility
        const allPlayers = registrations.map((reg: any) => ({
            id: reg.players.id,
            name: reg.players.name,
            preferred_position: reg.players.preferred_position as 'DEF' | 'MID' | 'ATT',
        }))

        // Use the team balancing utility (captains auto-assigned to first player in each team)
        const balancedTeams = generateBalancedTeams(allPlayers, {
            playersPerTeam,
        })

        // Format teams with captain info and separate players
        const formattedTeams: GeneratedTeam[] = balancedTeams.map((team) => {
            // Find the captain in this team
            const captain = team.players.find((p) => p.isCaptain)

            if (!captain) {
                throw new Error(`No captain found in ${team.name}`)
            }

            // Get non-captain players
            const teamPlayers = team.players.filter((p) => !p.isCaptain)

            return {
                name: team.name,
                captain: {
                    id: captain.id,
                    name: captain.name,
                    position: captain.preferred_position,
                },
                players: teamPlayers.map((p) => ({
                    id: p.id,
                    name: p.name,
                    position: p.preferred_position,
                })),
                positionCounts: team.positionCounts,
            }
        })

        return {
            success: true,
            data: { teams: formattedTeams },
        }
    } catch (error) {
        console.error('Unexpected error in generateTeamsForSession:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Save generated teams to database
 */
export async function saveTeamsToDatabase(
    sessionId: string,
    teams: GeneratedTeam[]
): Promise<ActionResult<{ teamIds: string[] }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                error: 'You must be logged in.',
            }
        }

        // Verify admin role
        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return {
                success: false,
                error: 'You must be an admin to save teams.',
            }
        }

        // Delete existing teams for this session (allow regeneration)
        await supabase
            .from('teams')
            .delete()
            .eq('session_id', sessionId)

        // Create team records
        const teamRecords = teams.map((team, index) => ({
            session_id: sessionId,
            name: team.name,
            team_number: index + 1,
            defenders_count: team.positionCounts.DEF,
            midfielders_count: team.positionCounts.MID,
            attackers_count: team.positionCounts.ATT,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            queue_position: index + 1,
        }))

        const { data: createdTeams, error: teamError } = await supabase
            .from('teams')
            .insert(teamRecords)
            .select('id, team_number')

        if (teamError) {
            console.error('Error creating teams:', teamError)
            return {
                success: false,
                error: 'Failed to create teams.',
            }
        }

        // Create team assignments
        const assignments = []
        for (let i = 0; i < teams.length; i++) {
            const team = teams[i]
            const teamId = createdTeams.find((t) => t.team_number === i + 1)!.id

            // Add captain
            assignments.push({
                team_id: teamId,
                player_id: team.captain.id,
                is_captain: true,
            })

            // Add other players
            for (const player of team.players) {
                assignments.push({
                    team_id: teamId,
                    player_id: player.id,
                    is_captain: false,
                })
            }
        }

        const { error: assignmentError } = await supabase
            .from('team_assignments')
            .insert(assignments)

        if (assignmentError) {
            console.error('Error creating team assignments:', assignmentError)
            // Rollback teams
            await supabase
                .from('teams')
                .delete()
                .eq('session_id', sessionId)

            return {
                success: false,
                error: 'Failed to create team assignments.',
            }
        }

        revalidatePath(`/sessions/${sessionId}`)

        return {
            success: true,
            data: { teamIds: createdTeams.map((t) => t.id) },
        }
    } catch (error) {
        console.error('Unexpected error in saveTeamsToDatabase:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Get saved teams for a session
 */
export async function getSessionTeams(sessionId: string) {
    const supabase = await createClient()

    const { data: teams, error } = await supabase
        .from('teams')
        .select(`
            id,
            name,
            team_number,
            defenders_count,
            midfielders_count,
            attackers_count,
            team_assignments (
                is_captain,
                players:player_id (
                    id,
                    name,
                    preferred_position
                )
            )
        `)
        .eq('session_id', sessionId)
        .order('team_number', { ascending: true })

    if (error) {
        console.error('Error fetching teams:', error)
        return []
    }

    return teams
}
