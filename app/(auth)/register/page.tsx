'use client'

import { useState } from 'react'
import { signUp } from '@/lib/actions/auth-actions'
import { useRouter } from 'next/navigation'
import type { Position } from '@/lib/supabase/types'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        preferred_position: 'MID' as Position,
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [position, setPosition] = useState<string>('MID')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.')
            setIsSubmitting(false)
            return
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.')
            setIsSubmitting(false)
            return
        }

        // Log form data to verify position format
        console.log('🔍 Form data before submit:', {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            preferred_position: formData.preferred_position,
            positionType: typeof formData.preferred_position,
        })

        const result = await signUp({
            phone: formData.phone,
            password: formData.password,
            name: formData.name,
            email: formData.email || undefined,
            preferred_position: formData.preferred_position,
        })

        if (result.success) {
            // Redirect to portal after successful registration
            setTimeout(() => {
                router.push('/portal')
            }, 1000)
        } else {
            setError(result.error || 'Registration failed. Please try again.')
            setIsSubmitting(false)
        }
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
                    maxWidth: '500px',
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
                        Player Registration
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        Create your account to join League Pro
                    </p>
                </div>

                {/* Error/Success Message */}
                {error && (
                    <div
                        style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #ef4444',
                            color: '#991b1b',
                            marginBottom: '1.25rem',
                            textAlign: 'center',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label
                            htmlFor="name"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Enter your full name"
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

                    {/* Phone Field */}
                    <div style={{ marginBottom: '1.25rem' }}>
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
                            Mobile Number *
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
                        <p
                            style={{
                                color: '#64748b',
                                fontSize: '0.75rem',
                                marginTop: '0.25rem',
                            }}
                        >
                            Your unique identifier (must be unique)
                        </p>
                    </div>

                    {/* Email Field */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="your.email@example.com"
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
                    <div style={{ marginBottom: '1.25rem' }}>
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
                            Password *
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            placeholder="At least 6 characters"
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

                    {/* Confirm Password Field */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label
                            htmlFor="confirmPassword"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            placeholder="Re-enter your password"
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

                    {/* Position Field */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label
                            htmlFor="position"
                            style={{
                                display: 'block',
                                color: '#cbd5e1',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Preferred Position *
                        </label>
                        <select
                            id="position"
                            required
                            value={formData.preferred_position}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    preferred_position: e.target.value as Position,
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #334155',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                            onBlur={(e) => (e.target.style.borderColor = '#334155')}
                        >
                            <option value="DEF">Defender (DEF)</option>
                            <option value="MID">Midfielder (MID)</option>
                            <option value="ATT">Attacker (ATT)</option>
                        </select>
                        <p
                            style={{
                                color: '#64748b',
                                fontSize: '0.75rem',
                                marginTop: '0.25rem',
                            }}
                        >
                            Used for team balancing
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: isSubmitting ? '#6b7280' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                {/* Footer Links */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Already have an account?{' '}
                        <a
                            href="/login"
                            style={{
                                color: '#10b981',
                                textDecoration: 'none',
                                fontWeight: '500',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                            Sign In
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
        </div >
    )
}
