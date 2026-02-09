'use client'

import { useState } from 'react'
import { recordGoal, endMatch } from '@/lib/actions/match-actions'

type Player = {
    id: string
    name: string
}

type Team = {
    id: string
    name: string
    players: Player[]
}

type MatchDisplayProps = {
    match: {
        id: string
        team_a_score: number
        team_b_score: number
    }
    teamA: Team
    teamB: Team
    sessionId: string
}

export default function MatchEntryForm({ match, teamA, teamB, sessionId }: MatchDisplayProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>(teamA.id)
    const [selectedScorer, setSelectedScorer] = useState<string>('')
    const [selectedAssister, setSelectedAssister] = useState<string>('')
    const [isRecording, setIsRecording] = useState(false)
    const [isEnding, setIsEnding] = useState(false)

    const currentTeam = selectedTeam === teamA.id ? teamA : teamB
    const currentPlayers = currentTeam.players

    const handleRecordGoal = async () => {
        if (!selectedScorer) {
            alert('Please select a scorer')
            return
        }

        setIsRecording(true)

        const result = await recordGoal(
            match.id,
            selectedTeam,
            selectedScorer,
            selectedAssister || null,
            sessionId
        )

        if (!result.success) {
            alert(result.error || 'Failed to record goal')
        } else {
            // Reset form
            setSelectedScorer('')
            setSelectedAssister('')
        }

        setIsRecording(false)
    }

    const handleEndMatch = async () => {
        if (!confirm('Are you sure you want to end this match?')) {
            return
        }

        setIsEnding(true)

        const result = await endMatch(match.id, sessionId)

        if (!result.success) {
            alert(result.error || 'Failed to end match')
        }

        setIsEnding(false)
    }

    return (
        <div>
            {/* Live Score Display */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '2rem',
                    alignItems: 'center',
                    marginBottom: '3rem',
                    padding: '2rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '2px solid #334155',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {teamA.name}
                    </div>
                    <div style={{ fontSize: '4rem', color: 'white', fontWeight: 'bold' }}>
                        {match.team_a_score}
                    </div>
                </div>

                <div style={{ fontSize: '2rem', color: '#94a3b8' }}>VS</div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {teamB.name}
                    </div>
                    <div style={{ fontSize: '4rem', color: 'white', fontWeight: 'bold' }}>
                        {match.team_b_score}
                    </div>
                </div>
            </div>

            {/* Goal Entry Form */}
            <div
                style={{
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '2px solid #334155',
                    marginBottom: '2rem',
                }}
            >
                <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1.5rem' }}>⚽ Record Goal</h3>

                {/* Team Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Scoring Team
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setSelectedTeam(teamA.id)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                backgroundColor: selectedTeam === teamA.id ? '#10b981' : '#334155',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {teamA.name}
                        </button>
                        <button
                            onClick={() => setSelectedTeam(teamB.id)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                backgroundColor: selectedTeam === teamB.id ? '#6366f1' : '#334155',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {teamB.name}
                        </button>
                    </div>
                </div>

                {/* Scorer Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Scorer *
                    </label>
                    <select
                        value={selectedScorer}
                        onChange={(e) => setSelectedScorer(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#334155',
                            color: 'white',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">Select Scorer</option>
                        {currentPlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Assister Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Assister (Optional)
                    </label>
                    <select
                        value={selectedAssister}
                        onChange={(e) => setSelectedAssister(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#334155',
                            color: 'white',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">No Assister</option>
                        {currentPlayers
                            .filter((p) => p.id !== selectedScorer)
                            .map((player) => (
                                <option key={player.id} value={player.id}>
                                    {player.name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Record Button */}
                <button
                    onClick={handleRecordGoal}
                    disabled={isRecording || !selectedScorer}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: isRecording || !selectedScorer ? '#475569' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: isRecording || !selectedScorer ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        if (!isRecording && selectedScorer) {
                            e.currentTarget.style.backgroundColor = '#059669'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isRecording && selectedScorer) {
                            e.currentTarget.style.backgroundColor = '#10b981'
                        }
                    }}
                >
                    {isRecording ? 'Recording...' : '⚽ Record Goal'}
                </button>
            </div>

            {/* End Match Button */}
            <button
                onClick={handleEndMatch}
                disabled={isEnding}
                style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: isEnding ? '#475569' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isEnding ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                    if (!isEnding) {
                        e.currentTarget.style.backgroundColor = '#dc2626'
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isEnding) {
                        e.currentTarget.style.backgroundColor = '#ef4444'
                    }
                }}
            >
                {isEnding ? 'Ending Match...' : '🏁 End Match & Apply Rotation'}
            </button>
        </div>
    )
}
