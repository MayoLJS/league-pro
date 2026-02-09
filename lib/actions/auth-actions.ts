/**
 * Authentication Actions
 * 
 * Server Actions for Supabase Auth operations including signup, signin, and signout.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Position } from '@/lib/supabase/types'

export interface SignUpInput {
    phone: string
    password: string
    name: string
    preferred_position: Position
    email?: string
}

export interface SignInInput {
    phone: string
    password: string
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Sign up a new player with Supabase Auth
 * Creates auth user and corresponding player record in database
 */
export async function signUp(input: SignUpInput): Promise<ActionResult<{ userId: string }>> {
    try {
        const supabase = await createClient()

        // Sign up with Supabase Auth using phone
        // For MVP, we'll use email/password but store phone as username
        const email = input.email || `${input.phone.replace(/\D/g, '')}@example.com`

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: input.password,
            options: {
                data: {
                    phone: input.phone,
                    name: input.name,
                    preferred_position: input.preferred_position,
                },
            },
        })

        if (authError) {
            console.error('Auth signup error:', authError)
            return {
                success: false,
                error: authError.message || 'Failed to create account. Please try again.',
            }
        }

        if (!authData.user) {
            return {
                success: false,
                error: 'Failed to create account. Please try again.',
            }
        }

        // Use UPSERT to handle race conditions and duplicate phones gracefully
        // If phone already exists, it will update instead of throwing error
        console.log('📝 Upserting player record for user:', authData.user.id)

        const { error: playerError } = await supabase
            .from('players')
            .upsert(
                {
                    auth_user_id: authData.user.id,
                    name: input.name,
                    phone: input.phone,
                    email: input.email || null,
                    preferred_position: input.preferred_position,
                    rating: 5,
                    caps: 0,
                    man_of_the_match_count: 0,
                    role: 'player',
                    is_active: true,
                },
                {
                    onConflict: 'phone',
                    ignoreDuplicates: false, // Update the record if it exists
                }
            )

        // Even if there's a duplicate, we treat it as success
        // The user can log in with the existing account
        if (playerError) {
            console.log('⚠️ Player upsert note:', playerError.message)
            // If it's a duplicate, it's actually fine - treat as successful registration
            if (playerError.code === '23505' || playerError.message.includes('duplicate key')) {
                console.log('✅ Player already exists, treating as successful registration')
                return {
                    success: true,
                    data: { userId: authData.user.id },
                }
            }

            // For other errors, log and return error
            console.error('❌ Player creation error:', {
                message: playerError.message,
                code: playerError.code,
            })

            return {
                success: false,
                error: `Database error: ${playerError.message}`,
            }
        }

        console.log('✅ Player record created/updated successfully!')

        revalidatePath('/register')

        return {
            success: true,
            data: { userId: authData.user.id },
        }
    } catch (error) {
        console.error('Unexpected error in signUp:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Sign in an existing player
 */
export async function signIn(input: SignInInput): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get player email from phone number
        const { data: player } = await supabase
            .from('players')
            .select('email')
            .eq('phone', input.phone)
            .single()

        if (!player) {
            return {
                success: false,
                error: 'No account found with this phone number.',
            }
        }

        const email = player.email || `${input.phone.replace(/\D/g, '')}@example.com`

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: input.password,
        })

        if (error) {
            return {
                success: false,
                error: 'Invalid credentials. Please try again.',
            }
        }

        revalidatePath('/')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Unexpected error in signIn:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Sign out the current user
 */
export async function signOut(_formData?: FormData): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/login')
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Get player data
    const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    return player
}
