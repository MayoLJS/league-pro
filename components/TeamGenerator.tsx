/**
 * Team Generator Component
 * 
 * Generates balanced teams from paid registrations and allows preview/confirmation.
 */

'use client'

import { useState } from 'react'
import { generateTeamsForSession, saveTeamsToDatabase, type GeneratedTeam } from '@/lib/actions/team-actions'

interface TeamGeneratorProps {
    sessionId: string
    paidPlayersCount: number
    onTeamsSaved: () => void
    savedTeams?: any[]
}

export default function TeamGenerator({ sessionId, paidPlayersCount, onTeamsSaved, savedTeams = [] }: TeamGeneratorProps) {
    const [generatedTeams, setGeneratedTeams] = useState<GeneratedTeam[] | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [playersPerTeam, setPlayersPerTeam] = useState<number>(7)

    const handleGenerateTeams = async () => {
        setIsGenerating(true)
        setError(null)

        const result = await generateTeamsForSession(sessionId, playersPerTeam)

        if (result.success && result.data) {
            setGeneratedTeams(result.data.teams)
        } else {
            setError(result.error || 'Failed to generate teams')
        }

        setIsGenerating(false)
    }

    const handleSaveTeams = async () => {
        if (!generatedTeams) return

        setIsSaving(true)
        setError(null)

        const result = await saveTeamsToDatabase(sessionId, generatedTeams)

        if (result.success) {
            alert('Teams saved successfully!')
            onTeamsSaved()
        } else {
            setError(result.error || 'Failed to save teams')
        }

        setIsSaving(false)
    }

    const handleRegenerateTeams = () => {
        setGeneratedTeams(null)
        setError(null)
    }

    // If teams are already saved in the DB, show the locked view
    if (savedTeams.length > 0) {
        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1rem',
                        backgroundColor: '#10b98115',
                        border: '1px solid #10b98140',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '600' }}>✓ Teams locked — {savedTeams.length} teams saved</span>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '1.5rem',
                    }}
                >
                    {savedTeams.map((team: any) => {
                        const captain = team.team_assignments?.find((a: any) => a.is_captain)
                        const squad = team.team_assignments?.filter((a: any) => !a.is_captain) ?? []
                        return (
                            <div
                                key={team.id}
                                style={{
                                    backgroundColor: '#0f172a',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: '2px solid #10b981',
                                }}
                            >
                                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    {team.name}
                                </h3>
                                {captain && (
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#f59e0b20',
                                            border: '2px solid #f59e0b',
                                            borderRadius: '8px',
                                            marginBottom: '0.75rem',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '600' }}>👑 {captain.players?.name}</div>
                                                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '600' }}>CAPTAIN</div>
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{captain.players?.preferred_position}</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '600' }}>SQUAD</div>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {squad.map((a: any) => (
                                        <div
                                            key={a.players?.id}
                                            style={{
                                                padding: '0.5rem',
                                                backgroundColor: '#1e293b',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ color: 'white', fontSize: '0.875rem' }}>{a.players?.name}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{a.players?.preferred_position}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (paidPlayersCount < 4) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Need at least 4 paid players to generate teams.
                <br />
                <small>Current paid players: {paidPlayersCount}</small>
            </div>
        )
    }

    if (!generatedTeams) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                {error && (
                    <div
                        style={{
                            color: '#ef4444',
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#ef444420',
                            borderRadius: '6px',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Team Size Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label
                        htmlFor="playersPerTeam"
                        style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Players Per Team
                    </label>
                    <select
                        id="playersPerTeam"
                        value={playersPerTeam}
                        onChange={(e) => setPlayersPerTeam(Number(e.target.value))}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            border: '2px solid #334155',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            minWidth: '200px',
                        }}
                    >
                        <option value={5}>5 Players</option>
                        <option value={6}>6 Players</option>
                        <option value={7}>7 Players</option>
                        <option value={8}>8 Players</option>
                        <option value={9}>9 Players</option>
                        <option value={10}>10 Players</option>
                    </select>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        {Math.floor(paidPlayersCount / playersPerTeam)} teams will be created
                    </div>
                </div>

                <button
                    onClick={handleGenerateTeams}
                    disabled={isGenerating}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        opacity: isGenerating ? 0.6 : 1,
                    }}
                >
                    {isGenerating ? 'Generating Teams...' : '⚽ Generate Balanced Teams'}
                </button>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Using {paidPlayersCount} paid players
                </div>
            </div>
        )
    }

    return (
        <div>
            {error && (
                <div
                    style={{
                        color: '#ef4444',
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#ef444420',
                        borderRadius: '6px',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Teams Display */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                }}
            >
                {generatedTeams.map((team, index) => (
                    <div
                        key={index}
                        style={{
                            backgroundColor: '#0f172a',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #10b981',
                        }}
                    >
                        {/* Team Header */}
                        <div style={{ marginBottom: '1rem' }}>
                            <h3
                                style={{
                                    color: 'white',
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {team.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                                <span style={{ color: '#94a3b8' }}>DEF: {team.positionCounts.DEF}</span>
                                <span style={{ color: '#94a3b8' }}>MID: {team.positionCounts.MID}</span>
                                <span style={{ color: '#94a3b8' }}>ATT: {team.positionCounts.ATT}</span>
                            </div>
                        </div>

                        {/* Captain */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#f59e0b20',
                                    border: '2px solid #f59e0b',
                                    borderRadius: '8px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '600' }}>
                                            👑 {team.captain.name}
                                        </div>
                                        <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '600' }}>
                                            CAPTAIN
                                        </div>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {team.captain.position}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Players */}
                        <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                                SQUAD
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {team.players.map((player) => (
                                    <div
                                        key={player.id}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: '#1e293b',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ color: 'white', fontSize: '0.875rem' }}>
                                            {player.name}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                            {player.position}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={handleRegenerateTeams}
                    disabled={isSaving}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#334155',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: isSaving ? 0.6 : 1,
                    }}
                >
                    ↻ Regenerate
                </button>
                <button
                    onClick={handleSaveTeams}
                    disabled={isSaving}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: isSaving ? 0.6 : 1,
                    }}
                >
                    {isSaving ? 'Saving...' : '✓ Confirm Teams'}
                </button>
            </div>
        </div>
    )
}
