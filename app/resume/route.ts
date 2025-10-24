// app/resume/route.ts
import { NextResponse } from 'next/server'
import { handleResumeFlow } from '@/lib/redirectFlow'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  // Parse form data (so the homepage form can send preferredJurisdiction)
  const formData = await req.formData().catch(() => null)
  const preferred = (formData?.get('preferredJurisdiction') as string | null) ?? 'bvi'

  const session = await auth()
  if (!session?.user?.id) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/login?callbackUrl=/', base))
  }

  // Jurisdiction-aware redirect
  await handleResumeFlow(preferred as any)
}
