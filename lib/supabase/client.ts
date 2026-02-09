/**
 * Supabase Browser Client
 * 
 * Use this client for Client Components and client-side interactions.
 * This creates a Supabase client that works in the browser and manages
 * cookies for authentication persistence.
 * 
 * DO NOT use this in Server Components - use lib/supabase/server.ts instead
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
