'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
    totalPlayers: number
    purseBalance: number
}

/**
 * Get high-level dashboard stats:
 * - Total registered players
 * - Current main purse balance (PURSE credits - DEBIT expenses)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    const [playersResult, ledgerResult] = await Promise.all([
        // Count all active players
        supabase
            .from('players')
            .select('id', { count: 'exact', head: true }),

        // Fetch all PURSE and DEBIT entries to compute running balance
        supabase
            .from('ledger')
            .select('type, amount')
            .in('type', ['PURSE', 'DEBIT']),
    ])

    const totalPlayers = playersResult.count ?? 0

    const purseBalance = (ledgerResult.data ?? []).reduce((sum, entry) => {
        return entry.type === 'PURSE'
            ? sum + (entry.amount ?? 0)
            : sum - (entry.amount ?? 0)
    }, 0)

    return { totalPlayers, purseBalance }
}

export interface PlayerStats {
    id: string
    name: string
    caps: number
    motm: number
    goals: number
    goalsPerGame: number
    assists: number
    assistsPerGame: number
}

/**
 * Get lifetime stats for all players
 */
export async function getLifetimeStats(): Promise<PlayerStats[]> {
    const supabase = await createClient()

    // 1. Fetch all players
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, man_of_the_match_count')
        .order('name')

    if (playersError || !players) {
        console.error('Error fetching players for stats:', playersError)
        return []
    }

    // 2. Count completed-match appearances per player via team_assignments
    //    A "cap" = one COMPLETED match the player's team participated in.
    const { data: capsRows, error: capsError } = await supabase
        .from('team_assignments')
        .select('player_id, teams!inner(matches_home:matches!team_home_id(id, status), matches_away:matches!team_away_id(id, status))')

    // Build a caps map from the raw response
    const capsMap = new Map<string, Set<string>>()

    if (!capsError && capsRows) {
        for (const row of capsRows as any[]) {
            const playerId: string = row.player_id
            if (!capsMap.has(playerId)) capsMap.set(playerId, new Set())
            const matchSet = capsMap.get(playerId)!

            const home: any[] = row.teams?.matches_home ?? []
            const away: any[] = row.teams?.matches_away ?? []
                ;[...home, ...away].forEach((m: any) => {
                    if (m.status === 'COMPLETED') matchSet.add(m.id)
                })
        }
    } else if (capsError) {
        console.warn('Could not fetch caps from matches, falling back to players.caps:', capsError.message)
    }

    const { data: goals, error: goalsError } = await supabase
        .from('match_events')
        .select('player_id, assisted_by')
        .eq('event_type', 'GOAL')

    if (goalsError) {
        console.error('Error fetching goals for stats:', goalsError)
        // Return stats without goals if this fails
        return players.map(p => ({
            id: p.id,
            name: p.name,
            caps: capsMap.get(p.id)?.size ?? 0,
            motm: p.man_of_the_match_count,
            goals: 0,
            goalsPerGame: 0,
            assists: 0,
            assistsPerGame: 0
        }))
    }

    // 3. Aggregate goals and assists by player
    const goalCounts = new Map<string, number>()
    const assistCounts = new Map<string, number>()

    goals?.forEach((goal: any) => {
        // Count goals
        if (goal.player_id) {
            goalCounts.set(goal.player_id, (goalCounts.get(goal.player_id) || 0) + 1)
        }
        // Count assists (from assisted_by field)
        if (goal.assisted_by) {
            assistCounts.set(goal.assisted_by, (assistCounts.get(goal.assisted_by) || 0) + 1)
        }
    })

    // 5. Combine data
    return players.map(p => {
        const goalCount = goalCounts.get(p.id) || 0
        const assistCount = assistCounts.get(p.id) || 0
        const caps = capsMap.get(p.id)?.size ?? 0
        return {
            id: p.id,
            name: p.name,
            caps: caps,
            motm: p.man_of_the_match_count || 0,
            goals: goalCount,
            goalsPerGame: caps > 0 ? Number((goalCount / caps).toFixed(2)) : 0,
            assists: assistCount,
            assistsPerGame: caps > 0 ? Number((assistCount / caps).toFixed(2)) : 0
        }
    }).sort((a, b) => {
        // Default sort: Total Goals descending, then Assists, then MOTM, then Caps
        if (b.goals !== a.goals) return b.goals - a.goals
        if (b.assists !== a.assists) return b.assists - a.assists
        if (b.motm !== a.motm) return b.motm - a.motm
        return b.caps - a.caps
    })
}
