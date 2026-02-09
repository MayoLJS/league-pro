/**
 * Match Engine Component
 * 
 * Winner Stays On match management with live league table.
 */

'use client'

import { useState, useEffect } from 'react'
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

interface MatchEngineProps {
    sessionId: string
    teams: any[]
}

export default function MatchEngine({ sessionId, teams }: MatchEngineProps) {
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

        if (!confirm('End this match and apply Winner Stays On logic?')) {
            return
        }

        setIsLoading(true)
        const result = await endMatch(activeMatch.id, sessionId)

        if (result.success) {
            await loadMatchData()
            setSelectedTeam('')
            setSelectedScorer('')
            setSelectedAssister('')
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
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        Team
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>
                                        Goals
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
                                            <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                                {scorer.teamName || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                                                {scorer.goals}
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
                            disabled={isLoading || queue.length < 2}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: queue.length < 2 ? '#334155' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: queue.length < 2 || isLoading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? 'Starting...' : '▶ Start Match'}
                        </button>

                        <button
                            onClick={handleEndSession}
                            disabled={isLoading}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                                opacity: isLoading ? 0.6 : 1,
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
                                <>
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
                                </>
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

                    {/* End Match Button */}
                    <button
                        onClick={handleEndMatch}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: isLoading ? 0.6 : 1,
                        }}
                    >
                        {isLoading ? 'Ending...' : '🏁 End Match'}
                    </button>
                </div>
            )}
        </div>
    )
}
