'use client'

import { useState } from 'react'
import { closeVoting } from '@/lib/actions/session-actions'
import { useRouter } from 'next/navigation'

interface AdminVotingDashboardProps {
    sessionId: string
}

export default function AdminVotingDashboard({ sessionId }: AdminVotingDashboardProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCloseVoting = async () => {
        if (!confirm('Are you sure you want to close voting? This will calculate the winner and complete the session.')) {
            return
        }

        setIsSubmitting(true)
        const result = await closeVoting(sessionId)

        if (result.success) {
            alert('Voting closed! Man of the Match determined.')
            // Force a reload to ensure we see the updated COMPLETED state
            window.location.reload()
        } else {
            alert(result.error || 'Failed to close voting')
            setIsSubmitting(false)
        }
    }

    return (
        <div style={{ textAlign: 'center', color: 'white' }}>
            <h2
                style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: '#f59e0b',
                }}
            >
                🗳️ Voting In Progress
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.125rem' }}>
                Players are currently casting their votes for Man of the Match via the Player Portal.
            </p>

            <div
                style={{
                    maxWidth: '500px',
                    margin: '0 auto',
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '2px solid #f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                }}
            >
                <div style={{ fontSize: '3rem' }}>⏳</div>

                <div style={{ color: '#cbd5e1' }}>
                    When you are ready to reveal the winner, click the button below.
                </div>

                <button
                    onClick={handleCloseVoting}
                    disabled={isSubmitting}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.6 : 1,
                        transition: 'all 0.2s',
                        width: '100%',
                    }}
                >
                    {isSubmitting ? 'Closing...' : '🛑 Close Voting & Reveal Winner'}
                </button>
            </div>
        </div>
    )
}
