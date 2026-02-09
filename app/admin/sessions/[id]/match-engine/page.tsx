import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveMatch, getMatchQueue, startMatch } from '@/lib/actions/match-actions'
import MatchEntryForm from '@/components/MatchEntryForm'

type PageProps = {
    params: Promise<{ id: string }>
}

type MatchDetails = {
    id: string
    team_a_score: number
    team_b_score: number
    teamA: {
        id: string
        name: string
        players: { id: string; name: string }[]
    }
    teamB: {
        id: string
        name: string
        players: { id: string; name: string }[]
    }
}

export default async function MatchEnginePage({ params }: PageProps) {
    const { id: sessionId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get player role
    const { data: player } = await supabase
        .from('players')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

    if (!player || player.role !== 'admin') {
        redirect('/portal')
    }

    // Get session details
    const { data: session } = await supabase
        .from('sessions')
        .select('id, date, venue, status')
        .eq('id', sessionId)
        .single()

    if (!session) {
        redirect('/dashboard')
    }

    // Get active match
    const activeMatch = await getActiveMatch(sessionId)

    // Get team queue
    const queue = await getMatchQueue(sessionId)

    // Get match with team details if active
    let matchDetails: MatchDetails | null = null
    if (activeMatch) {
        const { data } = await supabase
            .from('matches')
            .select(`
                id,
                team_a_score,
                team_b_score,
                team_a:team_a_id (
                    id,
                    name,
                    players:team_assignments (
                        player:player_id (
                            id,
                            name
                        )
                    )
                ),
                team_b:team_b_id (
                    id,
                    name,
                    players:team_assignments (
                        player:player_id (
                            id,
                            name
                        )
                    )
                )
            `)
            .eq('id', activeMatch.id)
            .single()

        if (data) {
            matchDetails = {
                id: data.id,
                team_a_score: data.team_a_score,
                team_b_score: data.team_b_score,
                teamA: {
                    id: (data.team_a as any).id,
                    name: (data.team_a as any).name,
                    players: ((data.team_a as any).players || []).map((p: any) => ({
                        id: p.player.id,
                        name: p.player.name,
                    })),
                },
                teamB: {
                    id: (data.team_b as any).id,
                    name: (data.team_b as any).name,
                    players: ((data.team_b as any).players || []).map((p: any) => ({
                        id: p.player.id,
                        name: p.player.name,
                    })),
                },
            } satisfies MatchDetails
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                padding: '2rem 1rem',
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <a
                        href={`/sessions/${sessionId}`}
                        style={{
                            color: '#10b981',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                            display: 'inline-block',
                        }}
                    >
                        ← Back to Session
                    </a>
                    <h1
                        style={{
                            color: 'white',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                        }}
                    >
                        ⚽ Match Engine
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        {session.venue} • {new Date(session.date).toLocaleDateString('en-GB')}
                    </p>
                </div>

                {/* Active Match or Start Button */}
                {matchDetails ? (
                    <div style={{ marginBottom: '3rem' }}>
                        <h2
                            style={{
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                            }}
                        >
                            🔴 Live Match
                        </h2>
                        <MatchEntryForm
                            match={matchDetails}
                            teamA={matchDetails.teamA}
                            teamB={matchDetails.teamB}
                            sessionId={sessionId}
                        />
                    </div>
                ) : queue.length >= 2 ? (
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                            marginBottom: '3rem',
                            textAlign: 'center',
                        }}
                    >
                        <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>
                            Ready to Start Match
                        </h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Next Match: {queue[0]?.name} vs {queue[1]?.name}
                        </p>
                        <form
                            action={async () => {
                                'use server'
                                await startMatch(sessionId)
                            }}
                        >
                            <button
                                type="submit"
                                style={{
                                    padding: '1rem 2rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                            >
                                🏁 Start Match
                            </button>
                        </form>
                    </div>
                ) : (
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '2rem',
                            borderRadius: '12px',
                            border: '2px solid #f59e0b',
                            marginBottom: '3rem',
                            textAlign: 'center',
                        }}
                    >
                        <h3 style={{ color: '#f59e0b', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                            ⚠️ Not Enough Teams
                        </h3>
                        <p style={{ color: '#94a3b8' }}>
                            Need at least 2 teams in the queue to start a match.
                        </p>
                    </div>
                )}

                {/* Team Queue */}
                <div>
                    <h2
                        style={{
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1.5rem',
                        }}
                    >
                        📋 Team Queue
                    </h2>
                    {queue.length === 0 ? (
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
                            No teams in queue
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {queue.map((team, index) => (
                                <div
                                    key={team.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1.5rem',
                                        backgroundColor: index < 2 ? '#10b98120' : '#1e293b',
                                        border: index < 2 ? '2px solid #10b981' : '2px solid #334155',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                backgroundColor: '#334155',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '600' }}>{team.name}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                W: {team.wins} • D: {team.draws} • L: {team.losses}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#334155',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {team.points} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
