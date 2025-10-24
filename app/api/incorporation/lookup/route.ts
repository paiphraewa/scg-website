// app/api/incorporation/lookup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const jurisdiction = (searchParams.get('jurisdiction') || 'bvi').toLowerCase()

  // Map slug -> token used in DB (you can expand later)
  const slugToToken: Record<string, string> = {
    bvi: 'BVI',
    cayman: 'CAYMAN',
    panama: 'PANAMA',
    hongkong: 'HONGKONG',
    singapore: 'SINGAPORE',
  }
  const token = slugToToken[jurisdiction] || 'BVI'

  // Find the most recent incorporation in this jurisdiction for the user
  const inc = await prisma.companyIncorporation.findFirst({
    where: {
      jurisdiction: token,
      onboarding: { userId: session.user.id },
    },
    orderBy: { updatedAt: 'desc' },
    select: { onboardingId: true, status: true, jurisdiction: true },
  })

  if (!inc) {
    return NextResponse.json({ found: false, token })
  }

  return NextResponse.json({
    found: true,
    status: inc.status,           // 'draft' | 'submitted' | 'paid' | ...
    onboardingId: inc.onboardingId,
    token,                        // for convenience in client redirect
  })
}
