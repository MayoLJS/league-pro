import { signOut } from '@/lib/actions/auth-actions'
import { NextResponse } from 'next/server'

export async function GET() {
    await signOut()
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
