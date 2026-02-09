'use client'

import { useEffect, useState } from 'react'
import { getAllSessions } from '@/lib/actions/session-actions'
import type { Session } from '@/lib/supabase/types'
import LogOutButton from '@/components/LogOutButton'

export default function AdminDashboardPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [stats, setStats] = useState({
        activeSessions: 0,
        totalPlayers: 0,
        totalPurse: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        const sessionsData = await getAllSessions()

        const activeSessions = sessionsData.filter(
            (s) => s.status === 'OPEN' || s.status === 'LOCKED' || s.status === 'IN_PROGRESS'
        ).length

        setSessions(sessionsData)
        setStats({
            activeSessions,
            totalPlayers: 0,
            totalPurse: 0,
        })
        setIsLoading(false)
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
                <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading dashboard...</div>
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
                {/* Header with Logout */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1
                            style={{
                                color: 'white',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Admin Dashboard
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Manage your football league
                        </p>
                    </div>
                    <LogOutButton />
                </div>
                {/* Quick Actions */}
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <a
                        href="/portal"
                        target="_blank"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                        }}
                    >
                        ⚽ Player Portal
                    </a>
                    <a
                        href="/admin/purse"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                        }}
                    >
                        💰 Main Purse
                    </a>
                </div>

                {/* Stats Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem',
                    }}
                >
                    {/* Active Sessions */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚽</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            Active Sessions
                        </div>
                        <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                            {stats.activeSessions}
                        </div>
                    </div>

                    {/* Total Players */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            Total Players
                        </div>
                        <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                            {stats.totalPlayers}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Coming soon
                        </div>
                    </div>

                    {/* Total Purse */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            Total Purse
                        </div>
                        <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
                            ₦{stats.totalPurse.toFixed(2)}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Coming soon
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2
                        style={{
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                        }}
                    >
                        Quick Actions
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        <a
                            href="/admin/sessions/new"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.5rem',
                                backgroundColor: '#1e293b',
                                border: '2px solid #334155',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.3s',
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
                            <div style={{ fontSize: '2.5rem' }}>➕</div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>
                                    Create Session
                                </h3>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                                    Schedule a new game
                                </p>
                            </div>
                        </a>

                        <a
                            href="/admin/sessions"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.5rem',
                                backgroundColor: '#1e293b',
                                border: '2px solid #334155',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.3s',
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
                            <div style={{ fontSize: '2.5rem' }}>📋</div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>
                                    Manage Sessions
                                </h3>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                                    View all sessions
                                </p>
                            </div>
                        </a>

                        <a
                            href="/admin/stats"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1.5rem',
                                backgroundColor: '#1e293b',
                                border: '2px solid #334155',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#34d399'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#334155'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <div style={{ fontSize: '2.5rem' }}>📊</div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>
                                    Lifetime Stats
                                </h3>
                                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                                    View player rankings
                                </p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div>
                    <h2
                        style={{
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1rem',
                        }}
                    >
                        Recent Sessions
                    </h2>
                    {sessions.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                                textAlign: 'center',
                                color: '#94a3b8',
                            }}
                        >
                            No sessions created yet
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {sessions.slice(0, 5).map((session) => {
                                const date = new Date(session.date)
                                const formattedDate = date.toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })

                                return (
                                    <a
                                        key={session.id}
                                        href={`/admin/sessions/${session.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1.5rem',
                                            backgroundColor: '#1e293b',
                                            border: '2px solid #334155',
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#10b981'
                                            e.currentTarget.style.transform = 'translateX(4px)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#334155'
                                            e.currentTarget.style.transform = 'translateX(0)'
                                        }}
                                    >
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                {formattedDate}
                                            </div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                {session.venue || 'No venue set'} • ₦{session.cost.toFixed(2)}
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor:
                                                    session.status === 'OPEN'
                                                        ? '#10b98120'
                                                        : session.status === 'LOCKED'
                                                            ? '#f59e0b20'
                                                            : '#6366f120',
                                                color:
                                                    session.status === 'OPEN'
                                                        ? '#10b981'
                                                        : session.status === 'LOCKED'
                                                            ? '#f59e0b'
                                                            : '#6366f1',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {session.status}
                                        </span>
                                    </a>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
