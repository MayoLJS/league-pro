'use client'

import { useState } from 'react'
import { playerNameLogin } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'

/** Normalize to Title Case: "joHN dOE" → "John Doe" */
function toTitleCase(str: string): string {
    return str
        .split(' ')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.substring(1).toLowerCase() : ''))
        .join(' ')
}

export default function HomePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleEnter = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const result = await playerNameLogin(name)

        if (result.success) {
            router.push('/portal')
        } else {
            setError(result.error || 'Something went wrong. Try again.')
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
            }}
        >
            <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

                {/* Logo & Title */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>⚽</div>
                    <h1
                        style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: '0 0 0.5rem 0',
                        }}
                    >
                        League Pro
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                        Football Session Management
                    </p>
                </div>

                {/* Player Name Entry Card */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        border: '2px solid #334155',
                        borderRadius: '20px',
                        padding: '2rem',
                        marginBottom: '1.5rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    }}
                >
                    <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.375rem' }}>
                        Welcome, Player
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Enter your name to access the portal
                    </p>

                    {error && (
                        <div
                            style={{
                                backgroundColor: '#ef444420',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                fontSize: '0.875rem',
                                marginBottom: '1rem',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleEnter} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(toTitleCase(e.target.value))}
                            placeholder="Your exact name (e.g. Marcus Johnson)"
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                borderRadius: '10px',
                                border: '1.5px solid #334155',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.target.style.borderColor = '#334155')}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: loading ? '#059669' : '#10b981',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.75 : 1,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#059669' }}
                            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#10b981' }}
                        >
                            {loading ? 'Loading your profile...' : 'Enter Portal →'}
                        </button>
                    </form>
                </div>

                {/* Admin link — subtle, not prominent */}
                <p style={{ color: '#334155', fontSize: '0.8rem' }}>
                    Admin?{' '}
                    <a
                        href="/login"
                        style={{ color: '#475569', textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                    >
                        Sign in here
                    </a>
                </p>
            </div>
        </div>
    )
}
