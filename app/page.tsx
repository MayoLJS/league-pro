'use client'

export default function HomePage() {
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
            <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                {/* Header */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚽</div>
                    <h1
                        style={{
                            fontSize: '3.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '1rem',
                        }}
                    >
                        League Pro
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.25rem' }}>
                        Football Session Management Platform
                    </p>
                </div>

                {/* Entry Buttons */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        marginBottom: '2rem',
                    }}
                >
                    {/* Player Button */}
                    <a
                        href="/register"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1.5rem',
                            padding: '3rem 2rem',
                            backgroundColor: '#1e293b',
                            border: '2px solid #334155',
                            borderRadius: '16px',
                            textDecoration: 'none',
                            transition: 'all 0.3s',
                            minHeight: '280px',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#10b981'
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow =
                                '0 12px 24px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#334155'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <div style={{ fontSize: '4rem' }}>👤</div>
                        <div>
                            <h2
                                style={{
                                    color: 'white',
                                    fontSize: '1.75rem',
                                    fontWeight: '700',
                                    margin: '0 0 0.5rem 0',
                                }}
                            >
                                Player
                            </h2>
                            <p style={{ color: '#94a3b8', margin: 0 }}>
                                Register and join sessions
                            </p>
                        </div>
                    </a>

                    {/* Admin Button */}
                    <a
                        href="/admin/dashboard"
                        className="flex flex-col items-center gap-6 p-12 bg-slate-800 border-2 border-slate-700 rounded-2xl no-underline transition-all duration-300 min-h-[280px] hover:border-amber-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20"
                    >
                        <div style={{ fontSize: '4rem' }}>⚙️</div>
                        <div>
                            <h2
                                style={{
                                    color: 'white',
                                    fontSize: '1.75rem',
                                    fontWeight: '700',
                                    margin: '0 0 0.5rem 0',
                                }}
                            >
                                Admin
                            </h2>
                            <p style={{ color: '#94a3b8', margin: 0 }}>
                                Manage sessions and teams
                            </p>
                        </div>
                    </a>
                </div>

                {/* Footer */}
                <p
                    style={{
                        color: '#64748b',
                        fontSize: '0.875rem',
                        marginTop: '2rem',
                    }}
                >
                    Built with Next.js 15 & Supabase
                </p>
            </div>
        </div >
    )
}
