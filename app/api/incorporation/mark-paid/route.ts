// app/api/incorporation/mark-paid/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { markOrderPaidByOnboarding } from '@/lib/orders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { onboardingId } = await req.json().catch(() => ({} as any))
  if (!onboardingId) {
    return NextResponse.json({ error: 'Missing onboardingId' }, { status: 400 })
  }

  // Verify the onboarding belongs to the caller
  const ob = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: { userId: true },
  })
  if (!ob || ob.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 1) Flip the pending order → paid
  const updatedOrder = await markOrderPaidByOnboarding(onboardingId)
  if (!updatedOrder) {
    // No pending order exists for this onboarding
    return NextResponse.json(
      { error: 'No pending order to mark paid' },
      { status: 400 }
    )
  }

  // 2) Mark the incorporation record as paid (if it exists)
  // Use updateMany to avoid throwing if the record doesn't exist yet
  await prisma.companyIncorporation.updateMany({
    where: { onboardingId },
    data: { status: 'paid' },
  })

  return NextResponse.json({ ok: true })
}
