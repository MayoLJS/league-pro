'use client'

import { useState } from 'react'
import { castVote } from '@/lib/actions/session-actions'
import { useRouter } from 'next/navigation'

interface PlayerVotingInterfaceProps {
    sessionId: string
    teams: any[] // Using any for simplicity as structure matches SessionDetailPage
}

export default function PlayerVotingInterface({ sessionId, teams }: PlayerVotingInterfaceProps) {
    const router = useRouter()
    const [selectedPlayer, setSelectedPlayer] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasVoted, setHasVoted] = useState(false)

    // Flatten all players from all teams into a single list
    const allPlayers = teams.flatMap((team) =>
        team.team_assignments.map((assignment: any) => ({
            id: assignment.players.id,
            name: assignment.players.name,
            teamName: team.name,
        }))
    ).sort((a, b) => a.name.localeCompare(b.name))

    const handleVote = async () => {
        if (!selectedPlayer) return

        setIsSubmitting(true)
        const result = await castVote(sessionId, selectedPlayer)

        if (result.success) {
            setHasVoted(true)
            alert('Vote cast successfully!')
            router.refresh()
        } else {
            alert(result.error || 'Failed to cast vote')
        }
        setIsSubmitting(false)
    }

    if (hasVoted) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>✅ Vote Recorded</h3>
                <p>Thank you for voting! The results will be announced shortly.</p>
            </div>
        )
    }

    return (
        <div style={{ textAlign: 'center', color: 'white' }}>
            <h2
                style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: '#f59e0b',
                }}
            >
                🗳️ Cast Your Vote
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                Who was the Man of the Match?
            </p>

            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                    }}
                >
                    <option value="">-- Select Player --</option>
                    {allPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                            {player.name} ({player.teamName})
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleVote}
                    disabled={!selectedPlayer || isSubmitting}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: !selectedPlayer || isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: !selectedPlayer || isSubmitting ? 0.6 : 1,
                    }}
                >
                    {isSubmitting ? 'Submitting...' : 'Vote'}
                </button>
            </div>
        </div>
    )
}
