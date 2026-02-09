'use client'

import { useState } from 'react'
import { signIn } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'
        text: string
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        const result = await signIn({
            phone: formData.phone,
            password: formData.password,
        })

        if (result.success) {
            setMessage({
                type: 'success',
                text: '✅ Login successful! Redirecting...',
            })

            // Redirect to portal after 1 second
            setTimeout(() => {
                router.push('/portal')
            }, 1000)
        } else {
            setMessage({
                type: 'error',
                text: result.error || 'Login failed. Please try again.',
            })
        }

        setIsSubmitting(false)
    }

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
                    maxWidth: '450px',
                    width: '100%',
                    backgroundColor: '#1e293b',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '2px solid #334155',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
                    <h1
                        style={{
                            color: 'white',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                        }}
                    >
                        Player Sign In
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        Welcome back to League Pro
                    </p>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div
                        style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            backgroundColor:
                                message.type === 'success' ? '#10b98120' : '#ef444420',
                            border:
                                message.type === 'success'
                                    ? '1px solid #10b981'
                                    : '1px solid #ef4444',
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Phone Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label
                            htmlFor="phone"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            required
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="e.g., +44 7123 456789"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.target.style.borderColor = '#334155')}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder="Enter your password"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.target.style.borderColor = '#334155')}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isSubmitting ? '#059669' : '#10b981',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.backgroundColor = '#059669'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.backgroundColor = '#10b981'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }
                        }}
                    >
                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Links */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Don't have an account?{' '}
                        <a
                            href="/register"
                            style={{
                                color: '#10b981',
                                textDecoration: 'none',
                                fontWeight: '500',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                            Register Now
                        </a>
                    </p>
                    <a
                        href="/"
                        style={{
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            display: 'inline-block',
                            marginTop: '0.5rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#10b981')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        </div>
    )
}
