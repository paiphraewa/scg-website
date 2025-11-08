// app/api/incorporation/mark-paid/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markOrderPaidByOnboarding } from '@/lib/orders'

// Prisma needs Node runtime (not Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const onboardingId = body?.onboardingId
  if (!onboardingId) {
    return NextResponse.json({ error: 'onboardingId is required' }, { status: 400 })
  }

  // Try mark paid
  const updated = await markOrderPaidByOnboarding(onboardingId)
  if (!updated) {
    return NextResponse.json({ error: 'No pending order to mark paid' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, orderId: updated.id, status: updated.status })
}
