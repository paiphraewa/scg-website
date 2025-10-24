// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth' // <-- v5 helper, works in middleware

// All routes in this list require auth
const PROTECTED = [
  '/company-incorporation',
  '/pricing',
  '/client-register',
  '/onboarding',
  '/success',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard protected routes
  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Ask NextAuth for the session (works on edge/middleware with v5 helpers)
  const session = await auth()
  if (!session?.user?.id) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', req.nextUrl.href) // send them back after login
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/company-incorporation/:path*',
    '/pricing/:path*',
    '/client-register/:path*',
    '/onboarding/:path*',
    '/success/:path*',
  ],
}
