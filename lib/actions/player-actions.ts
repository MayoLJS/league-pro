/**
 * Player Registration Actions
 * 
 * Server Actions for player registration functionality.
 * These run on the server and can safely interact with the database.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { PlayerInsert } from '@/lib/supabase/types'

export interface RegisterPlayerInput {
    name: string
    phone: string
    email?: string
    preferred_position: 'DEF' | 'MID' | 'ATT'
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Register a new player
 * Creates a player record in the database
 */
export async function registerPlayer(
    input: RegisterPlayerInput
): Promise<ActionResult<{ playerId: string }>> {
    try {
        const supabase = await createClient()

        // Check if phone number already exists
        const { data: existingPlayer } = await supabase
            .from('players')
            .select('id')
            .eq('phone', input.phone)
            .single()

        if (existingPlayer) {
            return {
                success: false,
                error: 'This phone number is already registered. Please use a different number.',
            }
        }

        // Create the player record
        const playerData: PlayerInsert = {
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            preferred_position: input.preferred_position,
            caps: 0,
            man_of_the_match_count: 0,
            role: 'player',
            is_active: true,
            auth_user_id: null, // Will be linked later when they log in
        }

        const { data, error } = await supabase
            .from('players')
            .insert(playerData)
            .select('id')
            .single()

        if (error) {
            console.error('Error creating player:', error)
            return {
                success: false,
                error: 'Failed to register player. Please try again.',
            }
        }

        // Revalidate relevant paths
        revalidatePath('/register')
        revalidatePath('/admin/players')

        return {
            success: true,
            data: { playerId: data.id },
        }
    } catch (error) {
        console.error('Unexpected error in registerPlayer:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Check if a phone number is available
 */
export async function checkPhoneAvailability(
    phone: string
): Promise<ActionResult<{ available: boolean }>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('players')
            .select('id')
            .eq('phone', phone)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (phone is available)
            console.error('Error checking phone availability:', error)
            return {
                success: false,
                error: 'Failed to check phone availability.',
            }
        }

        return {
            success: true,
            data: { available: !data },
        }
    } catch (error) {
        console.error('Unexpected error in checkPhoneAvailability:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Get a player by ID
 */
export async function getPlayerById(playerId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('players')
        .select('id, name, preferred_position, man_of_the_match_count, caps')
        .eq('id', playerId)
        .single()

    if (error) {
        console.error('Error fetching player:', error)
        return null
    }

    return data
}

/**
 * Update a player's preferred position.
 * Uses service-role client so it works for cookie-auth (name-login) players too.
 */
export async function updatePlayerPosition(
    playerId: string,
    position: 'DEF' | 'MID' | 'ATT'
): Promise<ActionResult> {
    if (!playerId) return { success: false, error: 'No player ID provided.' }

    const validPositions = ['DEF', 'MID', 'ATT']
    if (!validPositions.includes(position)) {
        return { success: false, error: `Invalid position: ${position}` }
    }

    try {
        const serviceClient = createServiceRoleClient()

        const { error } = await serviceClient
            .from('players')
            .update({
                preferred_position: position,
                updated_at: new Date().toISOString(),
            })
            .eq('id', playerId)

        if (error) {
            console.error('updatePlayerPosition error:', error)
            return { success: false, error: 'Failed to update position.' }
        }

        return { success: true }
    } catch (err) {
        console.error('Unexpected error in updatePlayerPosition:', err)
        return { success: false, error: 'An unexpected error occurred.' }
    }
}
