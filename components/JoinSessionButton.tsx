'use client'

import { registerForSession } from '@/lib/actions/registration-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type JoinSessionButtonProps = {
    sessionId: string
    isRegistered: boolean
}

export default function JoinSessionButton({ sessionId, isRegistered }: JoinSessionButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleJoin = async () => {
        setIsLoading(true)
        setError(null)

        const result = await registerForSession(sessionId)

        if (result.success) {
            router.refresh()
        } else {
            setError(result.error || 'Failed to join session')
            setIsLoading(false)
        }
    }

    if (isRegistered) {
        return (
            <div
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: '2px solid #10b981',
                    textAlign: 'center',
                }}
            >
                ✓ Registered
            </div>
        )
    }

    return (
        <div>
            <button
                onClick={handleJoin}
                disabled={isLoading}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isLoading ? '#059669' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? 'Joining...' : '⚽ Join Session'}
            </button>
            {error && (
                <div
                    style={{
                        marginTop: '0.5rem',
                        color: '#ef4444',
                        fontSize: '0.875rem',
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    )
}
