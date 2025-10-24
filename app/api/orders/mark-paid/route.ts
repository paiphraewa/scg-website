import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markOrderPaidByOnboarding } from '@/lib/orders'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Require auth (so random folks can’t flip orders)
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { onboardingId } = await req.json().catch(() => ({}))
  if (!onboardingId) {
    return NextResponse.json({ error: 'onboardingId is required' }, { status: 400 })
  }

  // Optional: sanity check that this onboarding belongs to the current user
  const onboarding = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: { userId: true },
  })
  if (!onboarding || onboarding.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await markOrderPaidByOnboarding(onboardingId)
  if (!updated) {
    return NextResponse.json({ error: 'No pending order to mark paid' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, order: updated })
}
