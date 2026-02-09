'use client'

import { useState } from 'react'
import { createSession } from '@/lib/actions/session-actions'
import { useRouter } from 'next/navigation'

export default function NewSessionPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        venue: '',
        max_players: '14',
        cost: '500.00',
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'
        text: string
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        const result = await createSession({
            date: formData.date,
            time: formData.time || undefined,
            venue: formData.venue || undefined,
            max_players: parseInt(formData.max_players),
            cost: parseFloat(formData.cost),
        })

        if (result.success) {
            setMessage({
                type: 'success',
                text: '✅ Session created successfully!',
            })

            // Redirect to the new session page after 1.5 seconds
            setTimeout(() => {
                if (result.data?.sessionId) {
                    router.push(`/admin/sessions/${result.data.sessionId}`)
                } else {
                    // Fallback if ID is missing (shouldn't happen)
                    router.push('/admin/dashboard')
                }
            }, 1500)
        } else {
            setMessage({
                type: 'error',
                text: result.error || 'Failed to create session. Please try again.',
            })
        }

        setIsSubmitting(false)
    }

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0]

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                padding: '2rem 1rem',
            }}
        >
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <a
                        href="/sessions"
                        style={{
                            color: '#94a3b8',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            display: 'inline-block',
                            marginBottom: '1rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#10b981')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                        ← Back to Sessions
                    </a>
                    <h1
                        style={{
                            color: 'white',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Create New Session
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Set up a new football session for players to register
                    </p>
                </div>

                {/* Form Card */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        padding: '2rem',
                        borderRadius: '12px',
                        border: '2px solid #334155',
                    }}
                >
                    {/* Success/Error Message */}
                    {message && (
                        <div
                            style={{
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                backgroundColor:
                                    message.type === 'success' ? '#10b98120' : '#ef444420',
                                border:
                                    message.type === 'success'
                                        ? '1px solid #10b981'
                                        : '1px solid #ef4444',
                                color: message.type === 'success' ? '#10b981' : '#ef4444',
                            }}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Date Field */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="date"
                                style={{
                                    display: 'block',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Session Date *
                            </label>
                            <input
                                type="date"
                                id="date"
                                required
                                min={today}
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                            />
                            <p
                                style={{
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Select the date for this session
                            </p>
                        </div>

                        {/* Time Field */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="time"
                                style={{
                                    display: 'block',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Start Time (Optional)
                            </label>
                            <input
                                type="time"
                                id="time"
                                value={formData.time}
                                onChange={(e) =>
                                    setFormData({ ...formData, time: e.target.value })
                                }
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                            />
                        </div>

                        {/* Venue Field */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="venue"
                                style={{
                                    display: 'block',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Venue (Optional)
                            </label>
                            <input
                                type="text"
                                id="venue"
                                value={formData.venue}
                                onChange={(e) =>
                                    setFormData({ ...formData, venue: e.target.value })
                                }
                                placeholder="e.g., Powerleague Arena"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                            />
                        </div>

                        {/* Max Players Field */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="max_players"
                                style={{
                                    display: 'block',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Maximum Players
                            </label>
                            <input
                                type="number"
                                id="max_players"
                                required
                                min="6"
                                max="30"
                                value={formData.max_players}
                                onChange={(e) =>
                                    setFormData({ ...formData, max_players: e.target.value })
                                }
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                            />
                            <p
                                style={{
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Default: 14 players
                            </p>
                        </div>

                        {/* Cost Field */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label
                                htmlFor="cost"
                                style={{
                                    display: 'block',
                                    color: '#cbd5e1',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Session Fee (₦) *
                            </label>
                            <input
                                type="number"
                                id="cost"
                                required
                                min="0"
                                step="50"
                                value={formData.cost}
                                onChange={(e) =>
                                    setFormData({ ...formData, cost: e.target.value })
                                }
                                placeholder="500"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                            />
                            <p
                                style={{
                                    color: '#64748b',
                                    fontSize: '0.75rem',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Cost per player for this session
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isSubmitting ? '#059669' : '#10b981',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.backgroundColor = '#059669'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.backgroundColor = '#10b981'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }
                            }}
                        >
                            {isSubmitting ? 'Creating Session...' : 'Create Session'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
