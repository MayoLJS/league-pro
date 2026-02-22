'use client'

import { useState } from 'react'
import { signUp } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'
import type { Position } from '@/lib/supabase/types'

/**
 * Admin-Only: Create New Staff / Admin Account
 *
 * This page is protected by middleware — only authenticated admins can access it.
 * Use it to onboard a new admin colleague without exposing a public signup form.
 */
export default function CreateAdminPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        preferred_position: 'MID' as Position,
        role: 'admin' as 'admin' | 'player',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' })
            setIsSubmitting(false)
            return
        }
        if (formData.password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
            setIsSubmitting(false)
            return
        }

        const result = await signUp({
            phone: formData.phone,
            password: formData.password,
            name: formData.name,
            email: formData.email || undefined,
            preferred_position: formData.preferred_position,
        })

        if (result.success) {
            setMessage({
                type: 'success',
                text: `✅ Account created for ${formData.name}. They can now log in via the Admin tab at /login.`,
            })
            setFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '', preferred_position: 'MID', role: 'admin' })
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to create account.' })
        }
        setIsSubmitting(false)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.8rem 1rem',
        borderRadius: '8px',
        border: '1px solid #334155',
        backgroundColor: '#0f172a',
        color: 'white',
        fontSize: '0.95rem',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        color: '#94a3b8',
        fontSize: '0.8rem',
        fontWeight: '500',
        marginBottom: '0.4rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto' }}>

                {/* Back Link */}
                <a
                    href="/admin/dashboard"
                    style={{ color: '#475569', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
                >
                    ← Back to Dashboard
                </a>

                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.75rem' }}>🔐</span>
                        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                            Create Admin Account
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                        This form is only accessible to existing admins. New accounts are created with the <strong style={{ color: '#94a3b8' }}>admin</strong> role.
                    </p>
                </div>

                {/* Info Box */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #6366f140',
                        borderLeft: '3px solid #6366f1',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        color: '#94a3b8',
                        lineHeight: 1.6,
                    }}
                >
                    <strong style={{ color: '#a5b4fc' }}>How to add a new Admin (3 steps):</strong>
                    <ol style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
                        <li>Fill in their name, phone, and a temporary password below</li>
                        <li>Hit <strong style={{ color: 'white' }}>Create Account</strong> — this registers them in Supabase Auth and marks their role as <code style={{ backgroundColor: '#0f172a', padding: '0 4px', borderRadius: '4px' }}>admin</code></li>
                        <li>Share the phone number + temp password with them — they log in via the <strong style={{ color: 'white' }}>Admin tab</strong> at <code style={{ backgroundColor: '#0f172a', padding: '0 4px', borderRadius: '4px' }}>/login</code></li>
                    </ol>
                </div>

                {/* Message */}
                {message && (
                    <div
                        style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.25rem',
                            backgroundColor: message.type === 'success' ? '#10b98118' : '#ef444418',
                            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                            fontSize: '0.9rem',
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Form */}
                <div
                    style={{
                        backgroundColor: '#1e293b',
                        border: '2px solid #334155',
                        borderRadius: '16px',
                        padding: '1.75rem',
                    }}
                >
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input type="text" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Sarah Admin" style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')} />
                        </div>
                        <div>
                            <label style={labelStyle}>Mobile Number *</label>
                            <input type="tel" required value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+44 7123 456789" style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email (Optional)</label>
                            <input type="email" value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="admin@example.com" style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')} />
                        </div>
                        <div>
                            <label style={labelStyle}>Temporary Password *</label>
                            <input type="password" required minLength={6} value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="At least 6 characters" style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm Password *</label>
                            <input type="password" required value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Re-enter password" style={inputStyle}
                                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                                onBlur={(e) => (e.target.style.borderColor = '#334155')} />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                padding: '0.9rem',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: isSubmitting ? '#4f46e5' : '#6366f1',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                            }}
                        >
                            {isSubmitting ? 'Creating Account...' : '🔐 Create Admin Account'}
                        </button>
                    </form>
                </div>

                <p style={{ color: '#334155', fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' }}>
                    To add a <strong>player</strong> without auth, use the name-login on the home page — their profile is created automatically.
                </p>
            </div>
        </div>
    )
}
