/**
 * Ledger Management Actions
 * 
 * Server Actions for managing ledger entries and session purse balances.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface LedgerEntry {
    id: string
    transaction_date: string
    description: string
    type: 'CREDIT' | 'DEBIT' | 'PURSE'
    amount: number
    player_id: string | null
    player_name: string | null
    session_id: string | null
    created_at: string
}

/**
 * Get all ledger entries for a specific session
 */
export async function getSessionLedger(
    sessionId: string
): Promise<ActionResult<{ entries: LedgerEntry[]; total: number }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to view ledger.',
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
                error: 'You must be an admin to view ledger.',
            }
        }

        // Fetch all CREDIT entries for this session
        const { data: entries, error } = await supabase
            .from('ledger')
            .select(`
                id,
                transaction_date,
                description,
                type,
                amount,
                player_id,
                session_id,
                created_at,
                players:player_id (name)
            `)
            .eq('session_id', sessionId)
            .eq('type', 'CREDIT')
            .order('transaction_date', { ascending: true })

        if (error) {
            console.error('Error fetching session ledger:', error)
            return {
                success: false,
                error: 'Failed to fetch ledger entries.',
            }
        }

        // Format entries with player names
        const formattedEntries: LedgerEntry[] = (entries || []).map((entry: any) => ({
            id: entry.id,
            transaction_date: entry.transaction_date,
            description: entry.description,
            type: entry.type,
            amount: entry.amount,
            player_id: entry.player_id,
            player_name: (entry.players as any)?.name || null,
            session_id: entry.session_id,
            created_at: entry.created_at,
        }))

        // Calculate total
        const total = formattedEntries.reduce((sum, entry) => sum + entry.amount, 0)

        return {
            success: true,
            data: {
                entries: formattedEntries,
                total,
            },
        }
    } catch (error) {
        console.error('Unexpected error in getSessionLedger:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Post session total to main purse
 * Creates a PURSE type entry and updates session purse_balance
 */
export async function postSessionToPurse(
    sessionId: string
): Promise<ActionResult<{ purseBalance: number }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to post to purse.',
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
                error: 'You must be an admin to post to purse.',
            }
        }

        // Get session details
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('id, date, purse_balance')
            .eq('id', sessionId)
            .single()

        if (sessionError || !session) {
            console.error('Error fetching session:', sessionError)
            return {
                success: false,
                error: 'Session not found.',
            }
        }

        // Check if already posted
        if (session.purse_balance && session.purse_balance > 0) {
            return {
                success: false,
                error: 'Session has already been posted to purse.',
            }
        }

        // Calculate total from CREDIT entries
        const ledgerResult = await getSessionLedger(sessionId)
        if (!ledgerResult.success || !ledgerResult.data) {
            return {
                success: false,
                error: 'Failed to calculate session total.',
            }
        }

        const total = ledgerResult.data.total

        if (total <= 0) {
            return {
                success: false,
                error: 'No payments to post. Total is zero.',
            }
        }

        // Create PURSE entry in ledger
        const { error: purseError } = await supabase
            .from('ledger')
            .insert({
                transaction_date: new Date().toISOString().split('T')[0],
                description: `Session total posted to purse for ${session.date}`,
                type: 'PURSE',
                amount: total,
                player_id: null,
                session_id: sessionId,
                created_by: admin.id,
            })

        if (purseError) {
            console.error('Database error creating purse entry:', purseError)
            console.error('Error details:', {
                message: purseError.message,
                code: purseError.code,
                details: purseError.details,
                hint: purseError.hint,
            })
            return {
                success: false,
                error: `Failed to create purse entry: ${purseError.message}${purseError.hint ? ` (Hint: ${purseError.hint})` : ''}`,
            }
        }

        // Update session purse_balance
        const { error: updateError } = await supabase
            .from('sessions')
            .update({ purse_balance: total })
            .eq('id', sessionId)

        if (updateError) {
            console.error('Error updating purse balance:', updateError)
            return {
                success: false,
                error: 'Failed to update purse balance.',
            }
        }

        revalidatePath(`/sessions/${sessionId}`)
        revalidatePath('/sessions')

        return {
            success: true,
            data: { purseBalance: total },
        }
    } catch (error) {
        console.error('Unexpected error in postSessionToPurse:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Get the main purse ledger (all PURSE entries)
 */
export async function getMainLedger(): Promise<ActionResult<{ entries: LedgerEntry[]; total: number }>> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to view ledger.',
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
                error: 'You must be an admin to view ledger.',
            }
        }

        // Fetch all PURSE and DEBIT entries
        const { data: entries, error } = await supabase
            .from('ledger')
            .select(`
                id,
                transaction_date,
                description,
                type,
                amount,
                player_id,
                session_id,
                created_at,
                session:session_id (date, venue)
            `)
            .in('type', ['PURSE', 'DEBIT'])
            .order('transaction_date', { ascending: false })

        if (error) {
            console.error('Error fetching main ledger:', error)
            return {
                success: false,
                error: 'Failed to fetch ledger entries.',
            }
        }

        // Format entries
        const formattedEntries: LedgerEntry[] = (entries || []).map((entry: any) => ({
            id: entry.id,
            transaction_date: entry.transaction_date,
            description: entry.description,
            type: entry.type,
            amount: entry.amount,
            player_id: entry.player_id,
            player_name: null,
            session_id: entry.session_id,
            created_at: entry.created_at,
        }))

        // Calculate total (PURSE credits - DEBIT expenses)
        const total = formattedEntries.reduce((sum, entry) => {
            return entry.type === 'PURSE' ? sum + entry.amount : sum - entry.amount
        }, 0)

        return {
            success: true,
            data: {
                entries: formattedEntries,
                total,
            },
        }
    } catch (error) {
        console.error('Unexpected error in getMainLedger:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}

/**
 * Add a purchase/expense entry to the main purse
 * Creates a DEBIT type entry that reduces the purse balance
 */
export async function addPurchaseEntry(
    description: string,
    amount: number
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get the current user (must be admin)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'You must be logged in to add purchases.',
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
                error: 'You must be an admin to add purchases.',
            }
        }

        // Validate inputs
        if (!description || description.trim().length === 0) {
            return {
                success: false,
                error: 'Description is required.',
            }
        }

        if (!amount || amount <= 0) {
            return {
                success: false,
                error: 'Amount must be greater than zero.',
            }
        }

        // Create DEBIT entry in ledger
        const { error: debitError } = await supabase
            .from('ledger')
            .insert({
                transaction_date: new Date().toISOString().split('T')[0],
                description: description.trim(),
                type: 'DEBIT',
                amount: amount,
                player_id: null,
                session_id: null,  // Purchases are at purse level, not session level
                created_by: admin.id,
            })

        if (debitError) {
            console.error('Database error creating debit entry:', debitError)
            return {
                success: false,
                error: `Failed to create purchase entry: ${debitError.message}`,
            }
        }

        revalidatePath('/admin/purse')

        return {
            success: true,
        }
    } catch (error) {
        console.error('Unexpected error in addPurchaseEntry:', error)
        return {
            success: false,
            error: 'An unexpected error occurred.',
        }
    }
}
