import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import JoinSessionButton from '@/components/JoinSessionButton'
import PlayerVotingInterface from '@/components/PlayerVotingInterface'
import { getSessionTeams } from '@/lib/actions/team-actions'
import LogOutButton from '@/components/LogOutButton'
import PlayerLogOutButton from '@/components/PlayerLogOutButton'
import PositionSelector from '@/components/PositionSelector'

export default async function PlayerPortalPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()

    // ── Auth check: Supabase session (admins) OR player_id cookie (players) ──
    const {
        data: { user },
    } = await supabase.auth.getUser()

    let player: {
        id: string
        name: string
        role: string
        caps: number
        man_of_the_match_count: number
        preferred_position: string
    } | null = null

    let isAdminSession = false

    if (user) {
        // Admin path: authenticated via Supabase Auth
        const { data } = await supabase
            .from('players')
            .select('id, name, role, caps, man_of_the_match_count, preferred_position')
            .eq('auth_user_id', user.id)
            .single()
        player = data
        isAdminSession = player?.role === 'admin'
    } else {
        // Player path: look up by player_id cookie
        const playerIdCookie = cookieStore.get('player_id')
        if (playerIdCookie?.value) {
            const serviceClient = createServiceRoleClient()
            const { data } = await serviceClient
                .from('players')
                .select('id, name, role, caps, man_of_the_match_count, preferred_position')
                .eq('id', playerIdCookie.value)
                .single()
            player = data
        }
    }

    if (!player) {
        redirect('/login')
    }

    const isAdmin = player.role === 'admin'

    // ── Choose the right client for data fetches ──
    // Cookie-only players have no Supabase Auth session, so the regular client
    // falls back to 'anon' role. Using serviceClient for them bypasses RLS entirely
    // and guarantees visibility.
    const dataClient = user ? supabase : createServiceRoleClient()

    // ── Fetch session data ──
    const today = new Date().toISOString().split('T')[0]
    const { data: sessions } = await dataClient
        .from('sessions')
        .select('id, date, time, venue, cost, max_players, status')
        .eq('status', 'OPEN')
        .gte('date', today)
        .order('date', { ascending: true })

    const { data: playerRegistrations } = await dataClient
        .from('registrations')
        .select('session_id, payment_status')
        .eq('player_id', player.id)

    const registeredSessionIds = new Set(playerRegistrations?.map((r) => r.session_id) || [])

    const { data: votingSession } = await dataClient
        .from('sessions')
        .select('id, status')
        .eq('status', 'VOTING')
        .order('date', { ascending: false })
        .limit(1)
        .single()

    let votingTeams: any[] = []
    if (votingSession) {
        votingTeams = (await getSessionTeams(votingSession.id)) || []
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
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            Welcome, {player.name}!
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {isAdmin ? 'Admin Portal' : 'Player Portal'}
                        </p>
                    </div>
                    {/* Show right logout button depending on auth method */}
                    {isAdminSession ? <LogOutButton /> : <PlayerLogOutButton />}
                </div>

                {/* Admin quick access */}
                {isAdmin && (
                    <div
                        style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#1e293b',
                            border: '2px solid #10b981',
                            borderRadius: '12px',
                        }}
                    >
                        <a
                            href="/admin/dashboard"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '1.125rem',
                            }}
                        >
                            🎯 Admin Command Center
                        </a>
                    </div>
                )}

                {/* Player Stats */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                    }}
                >
                    {/* Interactive Position Selector */}
                    <PositionSelector
                        playerId={player.id}
                        initialPosition={player.preferred_position as 'DEF' | 'MID' | 'ATT'}
                    />

                    {/* Caps */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Caps</div>
                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{player.caps}</div>
                    </div>

                    {/* MOTM */}
                    <div
                        style={{
                            backgroundColor: '#1e293b',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '2px solid #334155',
                        }}
                    >
                        <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>MOTM Awards</div>
                        <div style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold' }}>{player.man_of_the_match_count}</div>
                    </div>
                </div>

                {/* Available Sessions */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '2px solid #334155',
                        marginBottom: '2rem',
                    }}
                >
                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Available Sessions
                    </h2>
                    {!sessions || sessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            📅 No upcoming sessions found.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {sessions.map((session) => {
                                const isRegistered = registeredSessionIds.has(session.id)
                                return (
                                    <div
                                        key={session.id}
                                        style={{
                                            backgroundColor: '#0f172a',
                                            padding: '1.5rem',
                                            borderRadius: '8px',
                                            border: '2px solid #334155',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '1rem',
                                            }}
                                        >
                                            <div>
                                                <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                    {new Date(session.date).toLocaleDateString('en-GB', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                                {session.time && (
                                                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                        ⏰ {session.time}
                                                    </div>
                                                )}
                                                {session.venue && (
                                                    <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                        📍 {session.venue}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    backgroundColor: '#334155',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    color: '#10b981',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                ₦{session.cost.toFixed(2)}
                                            </div>
                                        </div>
                                        <JoinSessionButton sessionId={session.id} isRegistered={isRegistered} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Vote Section */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '2px solid #334155',
                    }}
                >
                    {votingSession ? (
                        <PlayerVotingInterface sessionId={votingSession.id} teams={votingTeams} />
                    ) : (
                        <>
                            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                Vote for MOTM
                            </h2>
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                Voting opens after each session...
                            </div>
                        </>
                    )}
                </div>
            </div >
        </div >
    )
}
