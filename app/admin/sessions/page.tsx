'use client'

import { useEffect, useState } from 'react'
import { getAllSessions } from '@/lib/actions/session-actions'
import type { Session } from '@/lib/supabase/types'

export default function AdminSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadSessions()
    }, [])

    const loadSessions = async () => {
        const data = await getAllSessions()
        setSessions(data)
        setIsLoading(false)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return '#10b981'
            case 'LOCKED':
                return '#f59e0b'
            case 'IN_PROGRESS':
                return '#3b82f6'
            case 'COMPLETED':
                return '#6366f1'
            case 'CANCELLED':
                return '#ef4444'
            default:
                return '#64748b'
        }
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
                <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading sessions...</div>
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
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Back Button */}
                <a
                    href="/admin/dashboard"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#334155',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                    }}
                >
                    ← Back to Dashboard
                </a>

                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                color: 'white',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Manage Sessions
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Create and manage football sessions
                        </p>
                    </div>
                    <a
                        href="/admin/sessions/new"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '1rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        + Create Session
                    </a>
                </div>

                {/* Sessions List */}
                {sessions.length === 0 ? (
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '3rem 2rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
                        <h2
                            style={{
                                color: 'white',
                                fontSize: '1.5rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            No Sessions Yet
                        </h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Create your first session to get started
                        </p>
                        <a
                            href="/admin/sessions/new"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600',
                            }}
                        >
                            Create Session
                        </a>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                style={{
                                    backgroundColor: '#1e293b',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: '2px solid #334155',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#10b981'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#334155'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '1rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3
                                                style={{
                                                    color: 'white',
                                                    fontSize: '1.25rem',
                                                    fontWeight: '600',
                                                    margin: 0,
                                                }}
                                            >
                                                {formatDate(session.date)}
                                            </h3>
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: `${getStatusColor(session.status)}20`,
                                                    color: getStatusColor(session.status),
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {session.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                            {session.time && (
                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                                    🕐 {session.time}
                                                </div>
                                            )}
                                            {session.venue && (
                                                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                                    📍 {session.venue}
                                                </div>
                                            )}
                                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                                👥 Max {session.max_players} players
                                            </div>
                                            <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>
                                                ₦{session.cost.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`/admin/sessions/${session.id}`}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#334155',
                                            color: 'white',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                                    >
                                        View Details →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
