/**
 * Supabase Service Role Client
 *
 * Uses the service_role key which bypasses Row Level Security.
 * ONLY use this in Server Actions / Route Handlers — NEVER in client components.
 *
 * Required env var: SUPABASE_SERVICE_ROLE_KEY (secret, not prefixed with NEXT_PUBLIC_)
 */

import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
            'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local — find it in ' +
            'Supabase Dashboard → Project Settings → API → service_role key.'
        )
    }

    return createClient(url, key, {
        auth: {
            // Disable auto-refresh and session persistence — this is a server-only client
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
