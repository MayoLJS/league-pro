/**
 * Match Engine Component
 * 
 * Winner Stays On match management with live league table.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    getMatchQueue,
    getActiveMatch,
    startMatch,
    recordGoal,
    endMatch,
    getTopScorers,
    type MatchQueueTeam,
    type TopScorer,
} from '@/lib/actions/match-actions'
import { endSession } from '@/lib/actions/session-actions'
import { createClient } from '@/lib/supabase/client'

interface MatchEngineProps {
    sessionId: string
    teams: any[]
    isReadOnly?: boolean
}

export default function MatchEngine({ sessionId, teams, isReadOnly = false }: MatchEngineProps) {
    const [queue, setQueue] = useState<MatchQueueTeam[]>([])
    const [topScorers, setTopScorers] = useState<TopScorer[]>([])
    const [activeMatch, setActiveMatch] = useState<any>(null)
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [selectedScorer, setSelectedScorer] = useState<string>('')
    const [selectedAssister, setSelectedAssister] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadMatchData()
    }, [sessionId])

    // Supabase Realtime: re-fetch top scorers whenever a goal event is inserted
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`match_events:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'match_events',
                },
                async () => {
                    // Re-fetch scorers + queue on every goal event
                    const [queueData, scorersData] = await Promise.all([
                        getMatchQueue(sessionId),
                        getTopScorers(sessionId),
                    ])
                    setQueue(queueData)
                    setTopScorers(scorersData)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId])

    // Derived: leader cards with tie-break info
    const topScorerCard = useMemo(() => {
        if (topScorers.length === 0) return null
        const max = topScorers[0].goals
        if (max === 0) return null
        const tied = topScorers.filter(s => s.goals === max)
        return { player: tied[0], tiedCount: tied.length }
    }, [topScorers])

    const topAssisterCard = useMemo(() => {
        if (topScorers.length === 0) return null
        const byAssists = [...topScorers].sort((a, b) => b.assists - a.assists)
        const max = byAssists[0].assists
        if (max === 0) return null
        const tied = byAssists.filter(s => s.assists === max)
        return { player: tied[0], tiedCount: tied.length }
    }, [topScorers])

    const loadMatchData = async () => {
        const [queueData, matchData, scorersData] = await Promise.all([
            getMatchQueue(sessionId),
            getActiveMatch(sessionId),
            getTopScorers(sessionId),
        ])

        setQueue(queueData)
        setActiveMatch(matchData)
        setTopScorers(scorersData)
    }

    const handleStartMatch = async () => {
        setIsLoading(true)
        const result = await startMatch(sessionId)

        if (result.success) {
            await loadMatchData()
        } else {
            alert(result.error || 'Failed to start match')
        }

        setIsLoading(false)
    }

    const handleRecordGoal = async () => {
        if (!activeMatch || !selectedTeam || !selectedScorer) {
            alert('Please select team and scorer')
            return
        }

        setIsLoading(true)
        const result = await recordGoal(
            activeMatch.id,
            selectedTeam,
            selectedScorer,
            selectedAssister || null,
            sessionId
        )

        if (result.success) {
            await loadMatchData()
            setSelectedScorer('')
            setSelectedAssister('')
        } else {
            alert(result.error || 'Failed to record goal')
        }

        setIsLoading(false)
    }

    const handleEndMatch = async () => {
        if (!activeMatch) return

        if (!confirm('End this match and start the next one?')) {
            return
        }

        setIsLoading(true)
        const result = await endMatch(activeMatch.id, sessionId)

        if (result.success) {
            // Reload data to get updated queue
            await loadMatchData()
            setSelectedTeam('')
            setSelectedScorer('')
            setSelectedAssister('')

            // Automatically start the next match if there are at least 2 teams
            const queueResult = await getMatchQueue(sessionId)
            if (queueResult.length >= 2) {
                const startResult = await startMatch(sessionId)
                if (startResult.success) {
                    await loadMatchData()
                } else {
                    alert(startResult.error || 'Failed to start next match')
                }
            }
        } else {
            alert(result.error || 'Failed to end match')
        }

        setIsLoading(false)
    }

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end the session? This will move to the voting phase.')) {
            return
        }

        setIsLoading(true)
        const result = await endSession(sessionId)

        if (result.success) {
            // The page will revalidate and likely redirect or change state
            // But we should reload data just in case
            window.location.reload()
        } else {
            alert(result.error || 'Failed to end session')
            setIsLoading(false)
        }
    }

    if (teams.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Generate teams first to start matches
            </div>
        )
    }

    return (
        <div>
            {/* Read-only banner for completed sessions */}
            {isReadOnly && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        backgroundColor: '#6366f115',
                        border: '1px solid #6366f140',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.875rem', color: '#6366f1', fontWeight: '600' }}>🔒 Session completed — match controls are locked</span>
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* League Table */}
                <div>
                    <h3
                        style={{
                            color: 'white',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                        }}
                    >
                        Live League Table
                    </h3>
                    <div
                        style={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #334155',
                        }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e293b' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        Pos
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        Team
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        P
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        W
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        D
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        L
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>
                                        PTS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue
                                    .sort((a, b) => b.points - a.points || b.wins - a.wins)
                                    .map((team, index) => (
                                        <tr
                                            key={team.id}
                                            style={{
                                                borderTop: '1px solid #334155',
                                                backgroundColor: index === 0 ? '#10b98110' : 'transparent',
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem', color: 'white', fontWeight: '600' }}>
                                                {index + 1}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'white' }}>{team.name}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>
                                                {team.wins + team.draws + team.losses}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981' }}>
                                                {team.wins}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b' }}>
                                                {team.draws}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#ef4444' }}>
                                                {team.losses}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'white', fontWeight: '600' }}>
                                                {team.points}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Scorers Table */}
                <div>
                    <h3
                        style={{
                            color: 'white',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                        }}
                    >
                        Top Scorers ⚽
                    </h3>

                    {/* Leader Stat Cards */}
                    {(topScorerCard || topAssisterCard) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            {topScorerCard && (
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#10b98115',
                                        border: '1px solid #10b98140',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Top Scorer</div>
                                    <div style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem' }}>
                                        {topScorerCard.player.name}
                                        {topScorerCard.tiedCount > 1 && (
                                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '400', marginLeft: '0.35rem' }}>
                                                +{topScorerCard.tiedCount - 1} tied
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                                        {topScorerCard.player.goals} goal{topScorerCard.player.goals !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}
                            {topAssisterCard && (
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#3b82f615',
                                        border: '1px solid #3b82f640',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Top Assister</div>
                                    <div style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem' }}>
                                        {topAssisterCard.player.name}
                                        {topAssisterCard.tiedCount > 1 && (
                                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '400', marginLeft: '0.35rem' }}>
                                                +{topAssisterCard.tiedCount - 1} tied
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                                        {topAssisterCard.player.assists} assist{topAssisterCard.player.assists !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #334155',
                            height: 'fit-content',
                        }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e293b' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        Player
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>
                                        Goals
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        Assists
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {topScorers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                            No goals yet
                                        </td>
                                    </tr>
                                ) : (
                                    topScorers.map((scorer, index) => (
                                        <tr
                                            key={scorer.playerId}
                                            style={{
                                                borderTop: '1px solid #334155',
                                                backgroundColor: index === 0 ? '#f59e0b10' : 'transparent',
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem', color: 'white', fontWeight: '600' }}>
                                                {scorer.name}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                                                {scorer.goals}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
                                                {scorer.assists || 0}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Active Match or Start Button */}
            {!activeMatch ? (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={handleStartMatch}
                            disabled={isLoading || queue.length < 2 || isReadOnly}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: queue.length < 2 || isReadOnly ? '#334155' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading || queue.length < 2 || isReadOnly ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading || isReadOnly ? 0.4 : 1,
                            }}
                        >
                            {isLoading ? 'Starting...' : '▶ Start Match'}
                        </button>

                        <button
                            onClick={handleEndSession}
                            disabled={isLoading || isReadOnly}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading || isReadOnly ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading || isReadOnly ? 0.4 : 1,
                            }}
                        >
                            {isLoading ? 'Ending...' : '🏁 End Session'}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Match Scoreboard */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            gap: '1rem',
                            alignItems: 'center',
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: '2px solid #10b981',
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {activeMatch.team_home.name}
                            </div>
                            <div style={{ color: '#10b981', fontSize: '3rem', fontWeight: 'bold' }}>
                                {activeMatch.home_score}
                            </div>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '2rem', fontWeight: 'bold' }}>VS</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {activeMatch.team_away.name}
                            </div>
                            <div style={{ color: '#10b981', fontSize: '3rem', fontWeight: 'bold' }}>
                                {activeMatch.away_score}
                            </div>
                        </div>
                    </div>

                    {/* Goal Recording Form */}
                    <div
                        style={{
                            padding: '1.5rem',
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                            marginBottom: '1rem',
                        }}
                    >
                        <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Record Goal
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <select
                                value={selectedTeam}
                                onChange={(e) => {
                                    setSelectedTeam(e.target.value)
                                    setSelectedScorer('')
                                    setSelectedAssister('')
                                }}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    border: '2px solid #334155',
                                    borderRadius: '6px',
                                }}
                            >
                                <option value="">Select Team</option>
                                <option value={activeMatch.team_home_id}>{activeMatch.team_home.name}</option>
                                <option value={activeMatch.team_away_id}>{activeMatch.team_away.name}</option>
                            </select>

                            {selectedTeam && (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <select
                                        value={selectedScorer}
                                        onChange={(e) => setSelectedScorer(e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#1e293b',
                                            color: 'white',
                                            border: '2px solid #334155',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        <option value="">Select Scorer</option>
                                        {teams
                                            .find((t) => t.id === selectedTeam)
                                            ?.team_assignments.map((assignment: any) => (
                                                <option key={assignment.players.id} value={assignment.players.id}>
                                                    {assignment.players.name}
                                                </option>
                                            ))}
                                    </select>

                                    <select
                                        value={selectedAssister}
                                        onChange={(e) => setSelectedAssister(e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#1e293b',
                                            color: 'white',
                                            border: '2px solid #334155',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        <option value="">Select Assister (Optional)</option>
                                        {teams
                                            .find((t) => t.id === selectedTeam)
                                            ?.team_assignments.map((assignment: any) => (
                                                <option key={assignment.players.id} value={assignment.players.id}>
                                                    {assignment.players.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleRecordGoal}
                                disabled={isLoading || !selectedTeam || !selectedScorer}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isLoading || !selectedTeam || !selectedScorer ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    opacity: isLoading || !selectedTeam || !selectedScorer ? 0.6 : 1,
                                }}
                            >
                                {isLoading ? 'Recording...' : '⚽ Record Goal'}
                            </button>
                        </div>
                    </div>

                    {/* Match Control Buttons */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleEndMatch}
                            disabled={isLoading || isReadOnly}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                backgroundColor: isReadOnly ? '#334155' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading || isReadOnly ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading || isReadOnly ? 0.4 : 1,
                            }}
                        >
                            {isLoading ? 'Loading...' : '⏭️ Next Match'}
                        </button>

                        <button
                            onClick={handleEndSession}
                            disabled={isLoading || isReadOnly}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                backgroundColor: isReadOnly ? '#334155' : '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading || isReadOnly ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading || isReadOnly ? 0.4 : 1,
                            }}
                        >
                            {isLoading ? 'Ending...' : '🏁 End Session'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
