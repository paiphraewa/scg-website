// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
  ],
}

export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith('/api/')
  const sessionCookie =
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value

  if (sessionCookie) return NextResponse.next()

  if (isApi) {
    // ↩️ API must return JSON, not HTML
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL('/login', req.url)
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}
