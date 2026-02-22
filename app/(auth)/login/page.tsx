'use client'

import { useState } from 'react'
import { signIn, playerNameLogin } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'

/** Normalize to Title Case: "joHN dOE" → "John Doe" */
function toTitleCase(str: string): string {
    return str
        .split(' ')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.substring(1).toLowerCase() : ''))
        .join(' ')
}

type Tab = 'player' | 'admin'

export default function LoginPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('player')

    // Player tab state
    const [playerName, setPlayerName] = useState('')
    const [playerSubmitting, setPlayerSubmitting] = useState(false)
    const [playerMessage, setPlayerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

    // Admin tab state
    const [adminForm, setAdminForm] = useState({ phone: '', password: '' })
    const [adminSubmitting, setAdminSubmitting] = useState(false)
    const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handlePlayerLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setPlayerSubmitting(true)
        setPlayerMessage(null)

        const result = await playerNameLogin(playerName)

        if (result.success && result.data) {
            const isNew = false // RPC returns is_new_player but not exposed here; treat all as welcome
            setPlayerMessage({
                type: 'success',
                text: `✅ Welcome, ${result.data.playerName}! Taking you to the portal...`,
            })
            setTimeout(() => router.push('/portal'), 1000)
        } else {
            setPlayerMessage({
                type: 'error',
                text: result.error || 'Could not access portal. Please try again.',
            })
            setPlayerSubmitting(false)
        }
    }

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setAdminSubmitting(true)
        setAdminMessage(null)

        const result = await signIn({
            phone: adminForm.phone,
            password: adminForm.password,
        })

        if (result.success) {
            setAdminMessage({ type: 'success', text: '✅ Login successful! Redirecting...' })
            setTimeout(() => router.push('/admin/dashboard'), 1000)
        } else {
            setAdminMessage({
                type: 'error',
                text: result.error || 'Login failed. Please try again.',
            })
            setAdminSubmitting(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.875rem 1rem',
        borderRadius: '10px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        color: '#cbd5e1',
        fontSize: '0.875rem',
        fontWeight: '500',
        marginBottom: '0.5rem',
    }

    const btnStyle = (disabled: boolean, color = '#10b981'): React.CSSProperties => ({
        width: '100%',
        padding: '1rem',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: disabled ? '#374151' : color,
        color: 'white',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s',
    })

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
            }}
        >
            <div
                style={{
                    maxWidth: '460px',
                    width: '100%',
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '20px',
                    border: '2px solid #334155',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚽</div>
                    <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                        League Pro
                    </h1>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        padding: '4px',
                        marginBottom: '1.75rem',
                    }}
                >
                    {(['player', 'admin'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.625rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: activeTab === tab ? '#1e293b' : 'transparent',
                                color: activeTab === tab ? 'white' : '#64748b',
                                fontWeight: activeTab === tab ? '600' : '400',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tab === 'player' ? '🏃 Player' : '🔐 Admin'}
                        </button>
                    ))}
                </div>

                {/* ── PLAYER TAB ── */}
                {activeTab === 'player' && (
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Enter your <strong style={{ color: 'white' }}>exact name</strong> as registered by your admin. First time? A profile will be created for you.
                        </p>

                        {playerMessage && (
                            <div
                                style={{
                                    padding: '0.875rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.25rem',
                                    backgroundColor:
                                        playerMessage.type === 'success' ? '#10b98120' :
                                            playerMessage.type === 'info' ? '#3b82f620' : '#ef444420',
                                    border: `1px solid ${playerMessage.type === 'success' ? '#10b981' :
                                        playerMessage.type === 'info' ? '#3b82f6' : '#ef4444'
                                        }`,
                                    color:
                                        playerMessage.type === 'success' ? '#10b981' :
                                            playerMessage.type === 'info' ? '#93c5fd' : '#ef4444',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {playerMessage.text}
                            </div>
                        )}

                        <form onSubmit={handlePlayerLogin}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label htmlFor="playerName" style={labelStyle}>
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    id="playerName"
                                    required
                                    autoFocus
                                    value={playerName}
                                    onChange={(e) => setPlayerName(toTitleCase(e.target.value))}
                                    placeholder="e.g. Marcus Johnson"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                                />
                            </div>

                            <button type="submit" disabled={playerSubmitting} style={btnStyle(playerSubmitting)}>
                                {playerSubmitting ? 'Looking you up...' : 'Enter Portal →'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ── ADMIN TAB ── */}
                {activeTab === 'admin' && (
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Admin access only. Use your registered credentials.
                        </p>

                        {adminMessage && (
                            <div
                                style={{
                                    padding: '0.875rem',
                                    borderRadius: '8px',
                                    marginBottom: '1.25rem',
                                    backgroundColor: adminMessage.type === 'success' ? '#10b98120' : '#ef444420',
                                    border: `1px solid ${adminMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
                                    color: adminMessage.type === 'success' ? '#10b981' : '#ef4444',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {adminMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleAdminLogin}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label htmlFor="adminPhone" style={labelStyle}>
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    id="adminPhone"
                                    required
                                    value={adminForm.phone}
                                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                                    placeholder="+44 7123 456789"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label htmlFor="adminPassword" style={labelStyle}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="adminPassword"
                                    required
                                    value={adminForm.password}
                                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                                    placeholder="Enter password"
                                    style={inputStyle}
                                    onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                    onBlur={(e) => (e.target.style.borderColor = '#334155')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={adminSubmitting}
                                style={btnStyle(adminSubmitting, '#6366f1')}
                            >
                                {adminSubmitting ? 'Signing In...' : '🔐 Admin Sign In'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a
                        href="/"
                        style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    )
}
