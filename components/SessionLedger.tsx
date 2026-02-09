/**
 * Session Ledger Component
 * 
 * Displays payment ledger for a session and allows posting to main purse.
 */

'use client'

import { useState, useEffect } from 'react'
import { getSessionLedger, postSessionToPurse, type LedgerEntry } from '@/lib/actions/ledger-actions'

interface SessionLedgerProps {
    sessionId: string
    initialPurseBalance: number
}

export default function SessionLedger({ sessionId, initialPurseBalance }: SessionLedgerProps) {
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [total, setTotal] = useState<number>(0)
    const [purseBalance, setPurseBalance] = useState<number>(initialPurseBalance)
    const [isLoading, setIsLoading] = useState(true)
    const [isPosting, setIsPosting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadLedger()
    }, [sessionId])

    const loadLedger = async () => {
        setIsLoading(true)
        setError(null)

        const result = await getSessionLedger(sessionId)

        if (result.success && result.data) {
            setEntries(result.data.entries)
            setTotal(result.data.total)
        } else {
            setError(result.error || 'Failed to load ledger')
        }

        setIsLoading(false)
    }

    const handlePostToPurse = async () => {
        setIsPosting(true)
        setError(null)

        const result = await postSessionToPurse(sessionId)

        if (result.success && result.data) {
            setPurseBalance(result.data.purseBalance)
            alert(`Successfully posted ₦${result.data.purseBalance.toFixed(2)} to purse!`)
        } else {
            setError(result.error || 'Failed to post to purse')
        }

        setIsPosting(false)
    }

    const isPosted = purseBalance > 0

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                Loading ledger...
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

            {/* Ledger Summary Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: '2px solid #334155',
                }}
            >
                <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Paid Players
                    </div>
                    <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {entries.length}
                    </div>
                </div>

                <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        Total Collected
                    </div>
                    <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        ₦{total.toFixed(2)}
                    </div>
                </div>

                {isPosted ? (
                    <div
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#10b98120',
                            color: '#10b981',
                            borderRadius: '8px',
                            fontWeight: '600',
                            border: '2px solid #10b981',
                        }}
                    >
                        ✓ Posted to Purse
                    </div>
                ) : (
                    <button
                        onClick={handlePostToPurse}
                        disabled={isPosting || total === 0}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: total === 0 ? '#334155' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: total === 0 || isPosting ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: total === 0 || isPosting ? 0.6 : 1,
                        }}
                    >
                        {isPosting ? 'Posting...' : '💰 Post to Purse'}
                    </button>
                )}
            </div>
        </div>
    )
}

