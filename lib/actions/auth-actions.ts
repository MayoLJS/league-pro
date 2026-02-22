/**
 * Authentication Actions
 * 
 * Server Actions for Supabase Auth operations including signup, signin, and signout.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
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

        // Use the service-role client for the player upsert so that RLS never
        // blocks this operation. The user's auth session may not have propagated
        // to the server cookie yet at this point in the signup flow.
        const serviceClient = createServiceRoleClient()

        const { error: playerError } = await serviceClient
            .from('players')
            .upsert(
                {
                    auth_user_id: authData.user.id,
                    name: input.name,
                    phone: input.phone,
                    email: input.email || null,
                    preferred_position: input.preferred_position,
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
 * Player name-only login (no Supabase Auth required)
 * Finds or creates a player by name, sets a player_id cookie.
 */
export async function playerNameLogin(
    name: string
): Promise<ActionResult<{ playerId: string; playerName: string; role: string }>> {
    try {
        if (!name || name.trim().length < 2) {
            return { success: false, error: 'Please enter your full name (at least 2 characters).' }
        }

        // Normalize to Title Case on the server as a safety net
        // e.g. "joHN dOE" → "John Doe"
        const normalized = name
            .trim()
            .split(' ')
            .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.substring(1).toLowerCase() : ''))
            .join(' ')

        const serviceClient = createServiceRoleClient()

        const { data, error } = await serviceClient.rpc('find_or_create_player_by_name', {
            p_name: normalized,
        })

        if (error) {
            console.error('playerNameLogin RPC error:', error)
            return { success: false, error: 'Could not find or create your profile. Please try again.' }
        }

        const player = Array.isArray(data) ? data[0] : data
        if (!player) {
            return { success: false, error: 'Unexpected error — no player returned.' }
        }

        // Set HTTP-only cookie valid for 7 days
        const cookieStore = await cookies()
        cookieStore.set('player_id', player.player_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return {
            success: true,
            data: {
                playerId: player.player_id,
                playerName: player.player_name,
                role: player.player_role,
            },
        }
    } catch (error) {
        console.error('Unexpected error in playerNameLogin:', error)
        return { success: false, error: 'An unexpected error occurred.' }
    }
}

/**
 * Clear the player name-login cookie (player logout)
 */
export async function playerLogout(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('player_id')
    redirect('/login')
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
