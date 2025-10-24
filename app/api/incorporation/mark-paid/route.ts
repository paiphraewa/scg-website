import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { onboardingId } = await req.json()
  if (!onboardingId)
    return NextResponse.json({ error: 'Missing onboardingId' }, { status: 400 })

  // Confirm this onboarding belongs to the current user
  const ob = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: { userId: true },
  })
  if (!ob || ob.userId !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Mark incorporation as "paid"
  await prisma.companyIncorporation.update({
    where: { onboardingId },
    data: { status: 'paid' },
  })

  return NextResponse.json({ ok: true })
}
