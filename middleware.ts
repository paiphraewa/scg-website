// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  // Restrict to the few routes that truly need auth
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/company-incorporation/:path*',
  ],
}

export function middleware(req: NextRequest) {
  // Read session cookies (NextAuth names often differ in prod vs dev)
  const sessionCookie =
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value

  if (sessionCookie) {
    return NextResponse.next()
  }

  const url = new URL('/login', req.url)
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}
