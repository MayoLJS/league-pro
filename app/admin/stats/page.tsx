'use client'

import { useEffect, useState } from 'react'
import { getLifetimeStats, type PlayerStats } from '@/lib/actions/stats-actions'
import Link from 'next/link'

export default function LifetimeStatsPage() {
    const [stats, setStats] = useState<PlayerStats[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            const data = await getLifetimeStats()
            setStats(data)
            setIsLoading(false)
        }

        loadStats()
    }, [])

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.25rem'
            }}>
                Loading Stats...
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            padding: '2rem 1rem'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Link href="/admin/dashboard" style={{
                            color: '#94a3b8',
                            textDecoration: 'none',
                            marginBottom: '1rem',
                            display: 'inline-block',
                            fontSize: '0.875rem'
                        }}>
                            ← Back to Dashboard
                        </Link>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0
                        }}>
                            Lifetime Stats
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                            Hall of Fame & All-Time Records
                        </p>
                    </div>
                </div>

                {/* Stats Table */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    overflow: 'hidden'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0f172a' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>Rank</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>Player</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Caps</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>MOTM 🏅</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Goals ⚽</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>G/G</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Assists 🎯</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>A/G</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((player, index) => (
                                    <tr key={player.id} style={{
                                        borderTop: '1px solid #334155',
                                        backgroundColor: index < 3 ? '#33415520' : 'transparent'
                                    }}>
                                        <td style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>
                                            {index + 1}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: 'white' }}>{player.name}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#cbd5e1' }}>
                                            {player.caps}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#f59e0b', fontWeight: 'bold' }}>
                                            {player.motm > 0 ? player.motm : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '1.125rem' }}>
                                            {player.goals}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                                            {player.goalsPerGame}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold', fontSize: '1.125rem' }}>
                                            {player.assists}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                                            {player.assistsPerGame}
                                        </td>
                                    </tr>
                                ))}
                                {stats.length === 0 && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                            No stats recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
