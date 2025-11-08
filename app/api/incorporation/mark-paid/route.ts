// app/api/incorporation/mark-paid/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { markOrderPaidByOnboarding } from '@/lib/orders'
import { sendEmail } from '@/lib/mailer'   // ✅ optional: send confirmation safely

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { onboardingId } = await req.json().catch(() => ({} as any))
    if (!onboardingId) {
      return NextResponse.json({ error: 'Missing onboardingId' }, { status: 400 })
    }

    // ✅ Verify the onboarding belongs to the caller
    const ob = await prisma.clientOnboarding.findUnique({
      where: { id: onboardingId },
      select: { userId: true },
    })
    if (!ob || ob.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ Flip the pending order → paid
    const updatedOrder = await markOrderPaidByOnboarding(onboardingId).catch((e) => {
      console.error('[mark-paid] markOrderPaidByOnboarding failed:', e)
      return null
    })

    if (!updatedOrder) {
      // ✅ No pending order exists for this onboarding
      return NextResponse.json(
        { error: 'No pending order to mark paid' },
        { status: 400 }
      )
    }

    // ✅ Mark the incorporation record as paid (if it exists)
    await prisma.companyIncorporation.updateMany({
      where: { onboardingId },
      data: { status: 'paid' },
    })

    // ✅ Optional: send confirmation email (safe even if no provider)
    try {
      await sendEmail({
        to: session.user.email!,
        subject: 'Order marked as paid',
        html: `<p>Your order for ${updatedOrder.jurisdiction || 'your company'} has been marked as paid.</p>`,
      })
    } catch (err) {
      console.warn('[mark-paid] Email send failed, continuing:', err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mark-paid] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
