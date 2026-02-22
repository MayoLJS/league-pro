'use client'

import { playerLogout } from '@/lib/actions/auth-actions'

export default function PlayerLogOutButton() {
    return (
        <form action={playerLogout}>
            <button
                type="submit"
                style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444'
                    e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155'
                    e.currentTarget.style.color = '#94a3b8'
                }}
            >
                Sign Out
            </button>
        </form>
    )
}
