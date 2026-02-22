import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware — Route Protection
 *
 * /admin/*   → requires Supabase Auth + role = 'admin'
 * /register  → requires Supabase Auth + role = 'admin'  (admin-only tool)
 * /portal    → open (player_id cookie checked at page level)
 * /          → open (name login embedded on page)
 * /login     → open
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ── Helper: redirect unauthenticated users ──
    const redirectTo = (path: string) => {
        const url = request.nextUrl.clone()
        url.pathname = path
        return NextResponse.redirect(url)
    }

    // ── Protect /admin/* ──
    if (pathname.startsWith('/admin')) {
        if (!user) return redirectTo('/login')

        try {
            const { data: player, error } = await supabase
                .from('players')
                .select('role')
                .eq('auth_user_id', user.id)
                .single()

            if (error || !player || player.role !== 'admin') {
                return redirectTo('/portal')
            }
        } catch {
            return redirectTo('/portal')
        }

        return response
    }

    // ── Protect /register — admin-only tool ──
    if (pathname.startsWith('/register')) {
        if (!user) return redirectTo('/login')

        try {
            const { data: player, error } = await supabase
                .from('players')
                .select('role')
                .eq('auth_user_id', user.id)
                .single()

            if (error || !player || player.role !== 'admin') {
                // Non-admins trying to access /register → back to portal
                return redirectTo('/portal')
            }
        } catch {
            return redirectTo('/login')
        }

        return response
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/register/:path*', '/register'],
}
