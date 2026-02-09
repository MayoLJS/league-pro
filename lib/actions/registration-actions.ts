/**
 * Registration Management Actions
 * 
 * Server Actions for player registration and payment tracking.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Register a player for a session
 */
export async function registerForSession(
    sessionId: string
): Promise<ActionResult<{ registrationId: string }>> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to register for a session.',
            }
        }

        // Get the player record
        const { data: player } = await supabase
            .from('players')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

        if (!player) {
            return {
                success: false,
                error: 'Player profile not found.',
            }
        }

        // Check if session exists and is OPEN
        const { data: session } = await supabase
            .from('sessions')
            .select('id, status, max_players')
            .eq('id', sessionId)
            .single()

        if (!session) {
            return {
                success: false,
                error: 'Session not found.',
            }
        }

        if (session.status !== 'OPEN') {
            return {
                success: false,
                error: 'This session is no longer accepting registrations.',
            }
        }

        // Check if player is already registered
        const { data: existingReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('session_id', sessionId)
            .eq('player_id', player.id)
            .single()

        if (existingReg) {
            return {
                success: false,
                error: 'You are already registered for this session.',
            }
        }

        // Get current registration count
        const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)

        const currentCount = count || 0

        if (currentCount >= session.max_players) {
            return {
                success: false,
                error: 'This session is full.',
            }
        }

        // Create registration with order
        const { data: registration, error } = await supabase
            .from('registrations')
            .insert({
                player_id: player.id,
                session_id: sessionId,
                payment_status: 'PENDING',
                registration_order: currentCount + 1,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Database error creating registration:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            })
            return {
                success: false,
                error: `Database error: ${error.message}${error.hint ? ` (Hint: ${error.hint})` : ''}`,
            }
        }

        revalidatePath(`/sessions/${sessionId}`)
        revalidatePath('/sessions')
        revalidatePath('/portal')

        return {
            success: true,
            data: { registrationId: registration.id },
        }
    } catch (error) {
        console.error('Unexpected error in registerForSession:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
            success: false,
            error: `Unexpected error: ${errorMessage}`,
        }
    }
}

/**
 * Toggle payment status for a registration
 * Updates registrations table and creates ledger entry
 */
export async function togglePaymentStatus(
    registrationId: string
): Promise<ActionResult<{ newStatus: string }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return {
                success: false,
                error: 'You must be logged in.',
            }
        }

        // Verify admin role
        const { data: admin } = await supabase
            .from('players')
            .select('id, role')
            .eq('auth_user_id', user.id)
            .single()

        if (!admin || admin.role !== 'admin') {
            return {
                success: false,
                error: 'You must be an admin to manage payments.',
            }
        }

        // Get the registration with player and session info
        const { data: registration } = await supabase
            .from('registrations')
            .select(`
                id,
                payment_status,
                paid_at,
                player_id,
                session_id,
                players:player_id (name),
                sessions:session_id (cost, date)
            `)
            .eq('id', registrationId)
            .single()

        if (!registration) {
            return {
                success: false,
                error: 'Registration not found.',
            }
        }

        const isPaid = registration.payment_status === 'PAID'
        const newStatus = isPaid ? 'PENDING' : 'PAID'

        // Update registration status
        const { error: updateError } = await supabase
            .from('registrations')
            .update({
                payment_status: newStatus,
                paid_at: newStatus === 'PAID' ? new Date().toISOString() : null,
            })
            .eq('id', registrationId)

        if (updateError) {
            console.error('Error updating registration:', updateError)
            return {
                success: false,
                error: 'Failed to update payment status.',
            }
        }

        // Create or remove ledger entry
        if (newStatus === 'PAID') {
            // Create CREDIT entry in ledger
            const playerName = (registration.players as any)?.name || 'Unknown Player'
            const sessionDate = (registration.sessions as any)?.date || ''
            const sessionCost = (registration.sessions as any)?.cost || 0

            const { error: ledgerError } = await supabase
                .from('ledger')
                .insert({
                    transaction_date: new Date().toISOString().split('T')[0],
                    description: `Payment from ${playerName} for session on ${sessionDate}`,
                    type: 'CREDIT',
                    amount: sessionCost,
                    player_id: registration.player_id,
                    session_id: registration.session_id,
                    created_by: admin.id,
                })

            if (ledgerError) {
                console.error('Error creating ledger entry:', ledgerError)
                // Rollback registration update
                await supabase
                    .from('registrations')
                    .update({
                        payment_status: 'PENDING',
                        paid_at: null,
                    })
                    .eq('id', registrationId)

                return {
                    success: false,
                    error: 'Failed to record payment in ledger.',
                }
            }
        } else {
            // Remove ledger entry (mark as PAID -> PENDING)
            await supabase
                .from('ledger')
                .delete()
                .eq('player_id', registration.player_id)
                .eq('session_id', registration.session_id)
                .eq('type', 'CREDIT')
        }

        revalidatePath(`/sessions/${registration.session_id}`)
        revalidatePath('/dashboard')

        return {
            success: true,
            data: { newStatus },
        }
    } catch (error) {
        console.error('Unexpected error in togglePaymentStatus:', error)
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        }
    }
}

/**
 * Get all registrations for a session with player details
 */
export async function getSessionRegistrations(sessionId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('registrations')
        .select(`
            id,
            payment_status,
            paid_at,
            registration_order,
            attended,
            players:player_id (
                id,
                name,
                phone,
                preferred_position,
                rating
            )
        `)
        .eq('session_id', sessionId)
        .order('registration_order', { ascending: true })

    if (error) {
        console.error('Error fetching registrations:', error)
        return []
    }

    return data
}
