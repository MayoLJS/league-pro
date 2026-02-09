import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware to protect admin routes
 * 
 * Checks if user has admin role before allowing access to /admin/* routes
 * Uses createServerClient to properly handle Supabase auth cookies
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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

    // Refresh session if expired - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected Routes Handler
    const { pathname } = request.nextUrl

    // Only protect admin routes
    if (pathname.startsWith('/admin')) {
        if (!user) {
            // Not authenticated - redirect to login
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        try {
            // Check if user has admin role
            const { data: player, error } = await supabase
                .from('players')
                .select('role')
                .eq('auth_user_id', user.id)
                .single()

            if (error || !player || player.role !== 'admin') {
                // Not an admin or error fetching role - redirect to portal
                const url = request.nextUrl.clone()
                url.pathname = '/portal'
                return NextResponse.redirect(url)
            }

            // User is admin - allow access (return the response with updated cookies)
            return response
        } catch (error) {
            console.error('Middleware role check error:', error)
            const url = request.nextUrl.clone()
            url.pathname = '/portal'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/admin/:path*',
    ],
}
