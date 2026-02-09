'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TeamStanding = {
    id: string
    name: string
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    points: number
}

type LiveStandingsProps = {
    sessionId: string
}

export default function LiveStandings({ sessionId }: LiveStandingsProps) {
    const [standings, setStandings] = useState<TeamStanding[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStandings()

        // Refresh every 10 seconds
        const interval = setInterval(loadStandings, 10000)
        return () => clearInterval(interval)
    }, [sessionId])

    const loadStandings = async () => {
        const supabase = createClient()

        // Get all teams for this session
        const { data: teams } = await supabase
            .from('teams')
            .select('id, name, wins, draws, losses, points')
            .eq('session_id', sessionId)

        if (!teams) {
            setIsLoading(false)
            return
        }

        // Get all matches for calculating goals
        const { data: matches } = await supabase
            .from('matches')
            .select('team_a_id, team_b_id, team_a_score, team_b_score, status')
            .eq('session_id', sessionId)
            .in('status', ['COMPLETED', 'IN_PROGRESS'])

        // Calculate standings
        const standingsData: TeamStanding[] = teams.map((team) => {
            let goalsFor = 0
            let goalsAgainst = 0
            let played = 0

            matches?.forEach((match) => {
                if (match.team_a_id === team.id) {
                    goalsFor += match.team_a_score
                    goalsAgainst += match.team_b_score
                    played++
                } else if (match.team_b_id === team.id) {
                    goalsFor += match.team_b_score
                    goalsAgainst += match.team_a_score
                    played++
                }
            })

            return {
                id: team.id,
                name: team.name,
                played,
                wins: team.wins,
                draws: team.draws,
                losses: team.losses,
                goalsFor,
                goalsAgainst,
                goalDifference: goalsFor - goalsAgainst,
                points: team.points,
            }
        })

        // Sort by: Points DESC, Goal Difference DESC, Goals For DESC
        standingsData.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            return b.goalsFor - a.goalsFor
        })

        setStandings(standingsData)
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div
                style={{
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '2px solid #334155',
                    textAlign: 'center',
                    color: '#94a3b8',
                }}
            >
                Loading standings...
            </div>
        )
    }

    if (standings.length === 0) {
        return (
            <div
                style={{
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '2px solid #334155',
                    textAlign: 'center',
                    color: '#94a3b8',
                }}
            >
                No teams yet
            </div>
        )
    }

    return (
        <div
            style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '2px solid #334155',
                overflow: 'hidden',
            }}
        >
            {/* Table Header */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 50px 50px 50px 50px',
                    gap: '0.5rem',
                    padding: '1rem',
                    backgroundColor: '#334155',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                }}
            >
                <div>#</div>
                <div>Team</div>
                <div style={{ textAlign: 'center' }}>P</div>
                <div style={{ textAlign: 'center' }}>W</div>
                <div style={{ textAlign: 'center' }}>D</div>
                <div style={{ textAlign: 'center' }}>L</div>
                <div style={{ textAlign: 'center' }}>GF</div>
                <div style={{ textAlign: 'center' }}>GA</div>
                <div style={{ textAlign: 'center' }}>GD</div>
                <div style={{ textAlign: 'center' }}>Pts</div>
            </div>

            {/* Table Body */}
            {standings.map((team, index) => (
                <div
                    key={team.id}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 40px 40px 40px 40px 50px 50px 50px 50px',
                        gap: '0.5rem',
                        padding: '1rem',
                        borderBottom: index < standings.length - 1 ? '1px solid #334155' : 'none',
                        backgroundColor: index === 0 ? '#10b98110' : 'transparent',
                    }}
                >
                    <div
                        style={{
                            color: index === 0 ? '#10b981' : 'white',
                            fontWeight: '600',
                        }}
                    >
                        {index + 1}
                    </div>
                    <div
                        style={{
                            color: 'white',
                            fontWeight: '600',
                        }}
                    >
                        {team.name}
                    </div>
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>{team.played}</div>
                    <div style={{ textAlign: 'center', color: '#10b981' }}>{team.wins}</div>
                    <div style={{ textAlign: 'center', color: '#f59e0b' }}>{team.draws}</div>
                    <div style={{ textAlign: 'center', color: '#ef4444' }}>{team.losses}</div>
                    <div style={{ textAlign: 'center', color: 'white' }}>{team.goalsFor}</div>
                    <div style={{ textAlign: 'center', color: 'white' }}>{team.goalsAgainst}</div>
                    <div
                        style={{
                            textAlign: 'center',
                            color: team.goalDifference > 0 ? '#10b981' : team.goalDifference < 0 ? '#ef4444' : '#94a3b8',
                        }}
                    >
                        {team.goalDifference > 0 ? '+' : ''}
                        {team.goalDifference}
                    </div>
                    <div
                        style={{
                            textAlign: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                        }}
                    >
                        {team.points}
                    </div>
                </div>
            ))}
        </div>
    )
}
