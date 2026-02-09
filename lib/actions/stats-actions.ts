'use server'

import { createClient } from '@/lib/supabase/server'

export interface PlayerStats {
    id: string
    name: string
    caps: number
    motm: number
    rating: number
    goals: number
    goalsPerGame: number
}

/**
 * Get lifetime stats for all players
 */
export async function getLifetimeStats(): Promise<PlayerStats[]> {
    const supabase = await createClient()

    // 1. Fetch all players
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name, caps, man_of_the_match_count, rating')
        .order('name')

    if (playersError || !players) {
        console.error('Error fetching players for stats:', playersError)
        return []
    }

    // 2. Fetch all goal events
    const { data: goals, error: goalsError } = await supabase
        .from('match_events')
        .select('player_id')
        .eq('event_type', 'GOAL')

    if (goalsError) {
        console.error('Error fetching goals for stats:', goalsError)
        // Return stats without goals if this fails
        return players.map(p => ({
            id: p.id,
            name: p.name,
            caps: p.caps,
            motm: p.man_of_the_match_count,
            rating: p.rating,
            goals: 0,
            goalsPerGame: 0
        }))
    }

    // 3. Aggregate goals by player
    const goalCounts = new Map<string, number>()
    goals?.forEach((goal: any) => {
        if (goal.player_id) {
            goalCounts.set(goal.player_id, (goalCounts.get(goal.player_id) || 0) + 1)
        }
    })

    // 4. Combine data
    return players.map(p => {
        const goalCount = goalCounts.get(p.id) || 0
        const caps = p.caps || 0
        return {
            id: p.id,
            name: p.name,
            caps: caps,
            motm: p.man_of_the_match_count || 0,
            rating: p.rating || 5.0,
            goals: goalCount,
            goalsPerGame: caps > 0 ? Number((goalCount / caps).toFixed(2)) : 0
        }
    }).sort((a, b) => {
        // Default sort: Total Goals descending, then MOTM, then Caps
        if (b.goals !== a.goals) return b.goals - a.goals
        if (b.motm !== a.motm) return b.motm - a.motm
        return b.caps - a.caps
    })
}
