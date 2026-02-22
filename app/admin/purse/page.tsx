'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMainLedger, addPurchaseEntry, type LedgerEntry } from '@/lib/actions/ledger-actions'

export default function MainPursePage() {
    const router = useRouter()
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [total, setTotal] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [purchaseDescription, setPurchaseDescription] = useState('')
    const [purchaseAmount, setPurchaseAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadPurseData()
    }, [])

    const loadPurseData = async () => {
        const result = await getMainLedger()

        if (result.success && result.data) {
            setEntries(result.data.entries)
            setTotal(result.data.total)
        } else {
            setError(result.error || 'Failed to load purse data')
        }

        setIsLoading(false)
    }

    const handlePurchaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const amount = parseFloat(purchaseAmount)
        const result = await addPurchaseEntry(purchaseDescription, amount)

        if (result.success) {
            // Reset form and close modal
            setPurchaseDescription('')
            setPurchaseAmount('')
            setShowPurchaseModal(false)
            // Reload data
            await loadPurseData()
        } else {
            alert(result.error || 'Failed to add purchase')
        }

        setIsSubmitting(false)
    }

    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading purse data...</div>
            </div>
        )
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                padding: '2rem 1rem',
            }}
        >
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Back Button */}
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#334155',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    ← Back to Dashboard
                </button>

                {error && (
                    <div
                        style={{
                            color: '#ef4444',
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: '#ef444420',
                            borderRadius: '8px',
                            border: '1px solid #ef4444',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Header Card */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        padding: '2rem',
                        borderRadius: '16px',
                        border: '2px solid #8b5cf6',
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                            }}
                        >
                            💰 Main Purse
                        </h1>
                        <p style={{ color: '#94a3b8' }}>
                            Accumulated funds from all sessions
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Total Balance
                            </div>
                            <div style={{ color: '#10b981', fontSize: '3rem', fontWeight: 'bold' }}>
                                ₦{total.toFixed(2)}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPurchaseModal(true)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            🛒 Record Purchase
                        </button>
                    </div>
                </div>

                {/* History Table */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                            Transaction History
                        </h2>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            {entries.length} transactions
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            No purse transactions found yet.
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '150px 1fr 120px 150px',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#0f172a50',
                                    borderBottom: '1px solid #334155',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                }}
                            >
                                <div>Date</div>
                                <div>Description</div>
                                <div>Type</div>
                                <div style={{ textAlign: 'right' }}>Amount</div>
                            </div>

                            {/* Table Rows */}
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '150px 1fr 120px 150px',
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid #334155',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {new Date(entry.transaction_date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div style={{ color: 'white' }}>
                                        {entry.description}
                                    </div>
                                    <div>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: entry.type === 'PURSE' ? '#10b98120' : '#ef444420',
                                                color: entry.type === 'PURSE' ? '#10b981' : '#ef4444',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {entry.type === 'PURSE' ? 'CREDIT' : 'EXPENSE'}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            color: entry.type === 'PURSE' ? '#10b981' : '#ef4444',
                                            fontWeight: '600',
                                            fontSize: '1.1rem',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {entry.type === 'PURSE' ? '+' : '-'}₦{entry.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Purchase Entry Modal */}
                {showPurchaseModal && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                        }}
                        onClick={() => setShowPurchaseModal(false)}
                    >
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #ef4444',
                                maxWidth: '500px',
                                width: '90%',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                                🛒 Record Purchase
                            </h2>
                            <form onSubmit={handlePurchaseSubmit}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={purchaseDescription}
                                        onChange={(e) => setPurchaseDescription(e.target.value)}
                                        required
                                        placeholder="e.g., Footballs, Jerseys, Equipment"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            backgroundColor: '#0f172a',
                                            border: '2px solid #334155',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem',
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                        Amount (₦)
                                    </label>
                                    <input
                                        type="number"
                                        value={purchaseAmount}
                                        onChange={(e) => setPurchaseAmount(e.target.value)}
                                        required
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            backgroundColor: '#0f172a',
                                            border: '2px solid #334155',
                                            borderRadius: '8px',
                                            color: 'white',
                                            fontSize: '1rem',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPurchaseModal(false)}
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#334155',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Purchase'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
