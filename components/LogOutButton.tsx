'use client'

import { signOut } from '@/lib/actions/auth-actions'

export default function LogOutButton() {
    return (
        <form action={signOut}>
            <button
                type="submit"
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
                🚪 Logout
            </button>
        </form>
    )
}
