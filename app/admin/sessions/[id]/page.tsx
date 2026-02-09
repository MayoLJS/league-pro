'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSessionById } from '@/lib/actions/session-actions'
import { getSessionRegistrations, togglePaymentStatus } from '@/lib/actions/registration-actions'
import { getSessionTeams } from '@/lib/actions/team-actions'
import TeamGenerator from '@/components/TeamGenerator'

import MatchEngine from '@/components/MatchEngine'
import SessionLedger from '@/components/SessionLedger'
import AdminVotingDashboard from '@/components/AdminVotingDashboard'
import type { Session, Player } from '@/lib/supabase/types'
import { getPlayerById } from '@/lib/actions/player-actions'

interface Registration {
    id: string
    payment_status: string
    paid_at: string | null
    registration_order: number
    attended: boolean | null
    players: {
        id: string
        name: string
        phone: string
        preferred_position: string
        rating: number
    }
}

export default function SessionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params.id as string

    const [session, setSession] = useState<Session | null>(null)
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingPayment, setProcessingPayment] = useState<string | null>(null)
    const [manOfTheMatch, setManOfTheMatch] = useState<any | null>(null)

    useEffect(() => {
        loadSessionData()
    }, [sessionId])

    const loadSessionData = async () => {
        const [sessionData, registrationsData, teamsData] = await Promise.all([
            getSessionById(sessionId),
            getSessionRegistrations(sessionId),
            getSessionTeams(sessionId),
        ])

        setSession(sessionData)
        setRegistrations(registrationsData as unknown as Registration[])
        setTeams((teamsData as any) || [])

        if (sessionData && sessionData.status === 'COMPLETED' && sessionData.man_of_the_match_id) {
            const player = await getPlayerById(sessionData.man_of_the_match_id)
            setManOfTheMatch(player)
        }

        setIsLoading(false)
    }

    const handlePaymentToggle = async (registrationId: string) => {
        setProcessingPayment(registrationId)

        const result = await togglePaymentStatus(registrationId)

        if (result.success) {
            // Reload data to reflect changes
            await loadSessionData()
        } else {
            alert(result.error || 'Failed to update payment status')
        }

        setProcessingPayment(null)
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

    const paidCount = registrations.filter((r) => r.payment_status === 'PAID').length
    const totalRevenue = registrations
        .filter((r) => r.payment_status === 'PAID')
        .reduce((sum) => sum + (session?.cost || 0), 0)

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
                <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading session...</div>
            </div>
        )
    }

    if (!session) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    backgroundColor: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Session not found
                    </div>
                    <button
                        onClick={() => router.push('/admin/sessions')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                        }}
                    >
                        Back to Sessions
                    </button>
                </div>
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
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => router.push('/admin/sessions')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#334155',
                            color: '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                        }}
                    >
                        ← Back to Sessions
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h1
                                style={{
                                    color: 'white',
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {formatDate(session.date)}
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>{session.venue || 'No venue set'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: `${getStatusColor(session.status)}20`,
                                    color: getStatusColor(session.status),
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {session.status}
                            </span>
                            {teams.length > 0 && (
                                <button
                                    onClick={() => router.push(`/admin/sessions/${sessionId}/match-engine`)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        backgroundColor: '#6366f1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ⚽ Match Engine
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                            }}
                        >
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Registered
                            </div>
                            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                                {registrations.length}/{session.max_players}
                            </div>
                        </div>
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                            }}
                        >
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Paid
                            </div>
                            <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
                                {paidCount}/{registrations.length}
                            </div>
                        </div>
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                            }}
                        >
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Revenue
                            </div>
                            <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
                                ₦{totalRevenue.toFixed(2)}
                            </div>
                        </div>
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                            }}
                        >
                            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                Session Fee
                            </div>
                            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                                ₦{session.cost.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Registered Players */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                            marginBottom: '2rem',
                        }}
                    >
                        <h2
                            style={{
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                            }}
                        >
                            Registered Players ({registrations.length})
                        </h2>

                        {registrations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                No players registered yet
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {registrations.map((reg, index) => (
                                    <div
                                        key={reg.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            backgroundColor: '#0f172a',
                                            borderRadius: '8px',
                                            border: `2px solid ${reg.payment_status === 'PAID' ? '#10b981' : '#334155'}`,
                                            gap: '1rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <div
                                                style={{
                                                    backgroundColor: '#334155',
                                                    color: '#94a3b8',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: '600',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                #{reg.registration_order}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                    {reg.players.name}
                                                    {index < 2 && (
                                                        <span
                                                            style={{
                                                                marginLeft: '0.5rem',
                                                                padding: '0.125rem 0.5rem',
                                                                backgroundColor: '#f59e0b20',
                                                                color: '#f59e0b',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            CAPTAIN
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                                    {reg.players.preferred_position} • Rating: {reg.players.rating}/10 • {reg.players.phone}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePaymentToggle(reg.id)}
                                            disabled={processingPayment === reg.id}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: reg.payment_status === 'PAID' ? '#10b981' : '#334155',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: processingPayment === reg.id ? 'not-allowed' : 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.875rem',
                                                opacity: processingPayment === reg.id ? 0.6 : 1,
                                            }}
                                        >
                                            {processingPayment === reg.id
                                                ? '...'
                                                : reg.payment_status === 'PAID'
                                                    ? '✓ PAID'
                                                    : 'Mark as PAID'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Session Ledger */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                            marginBottom: '2rem',
                        }}
                    >
                        <h2
                            style={{
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1.5rem',
                            }}
                        >
                            💰 Session Ledger
                        </h2>
                        <SessionLedger sessionId={sessionId} initialPurseBalance={session.purse_balance || 0} />
                    </div>

                    {/* Team Generation Section */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <h2
                            style={{
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '1rem',
                            }}
                        >
                            Team Generation
                        </h2>
                        <TeamGenerator
                            sessionId={sessionId}
                            paidPlayersCount={paidCount}
                            onTeamsSaved={loadSessionData}
                        />
                    </div>

                    {/* Match Engine Section */}
                    {teams.length > 0 && session.status !== 'VOTING' && (
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #334155',
                                marginTop: '2rem',
                            }}
                        >
                            <h2
                                style={{
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1rem',
                                }}
                            >
                                🏆 Match Engine - Winner Stays On
                            </h2>
                            <MatchEngine sessionId={sessionId} teams={teams} />
                        </div>
                    )}

                    {/* Voting Section */}
                    {teams.length > 0 && session.status === 'VOTING' && (
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid #f59e0b',
                                marginTop: '2rem',
                            }}
                        >
                            <AdminVotingDashboard sessionId={sessionId} />
                        </div>
                    )}

                    {/* Man of the Match Display (Completed Session) */}
                    {session.status === 'COMPLETED' && manOfTheMatch && (
                        <div
                            style={{
                                backgroundColor: '#1e293b',
                                padding: '2rem',
                                borderRadius: '12px',
                                border: '2px solid #f59e0b',
                                marginTop: '2rem',
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            }}
                        >
                            <h2
                                style={{
                                    color: '#f59e0b',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1rem',
                                }}
                            >
                                🏆 Man of the Match
                            </h2>
                            <div
                                style={{
                                    fontSize: '3rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {manOfTheMatch.name}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                                {manOfTheMatch.preferred_position} • {manOfTheMatch.rating}/10 Rating
                            </div>
                            <div
                                style={{
                                    display: 'inline-block',
                                    padding: '0.5rem 1.5rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                    color: '#f59e0b',
                                    borderRadius: '9999px',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                }}
                            >
                                Total MOTM Awards: {manOfTheMatch.man_of_the_match_count}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
