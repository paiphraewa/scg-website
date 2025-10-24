// app/api/orders/remind-due/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mailer' // already simulates if no RESEND_API_KEY
import { auth } from '@/lib/auth'

/**
 * Sends reminder emails for orders still in `pending_payment`
 * that haven’t been emailed in the last 24h.
 * Secured by either:
 *  - Logged-in admin (easy placeholder), or
 *  - CRON_SECRET header for scheduled jobs.
 */
export async function POST(req: NextRequest) {
  // --- simple auth gate ---
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('x-cron-secret')
  const session = await auth()

  const isCron = cronSecret && headerSecret && headerSecret === cronSecret
  const isAdmin = !!session?.user?.email && session.user.email.endsWith('@scg.local') // tweak however you want

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // orders that are still pending and haven’t been emailed in 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const orders = await prisma.order.findMany({
    where: {
      status: 'pending_payment',
      OR: [
        { lastEmailAt: null },
        { lastEmailAt: { lt: cutoff } },
      ],
    },
    include: {
      onboarding: {
        select: { userId: true, projectName: true, projectEmail: true, user: { select: { email: true } } },
      },
    },
    take: 50, // safety cap
  })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'

  const results: Array<{ id: string; ok: boolean }> = []

  for (const o of orders) {
    const to =
      o.onboarding?.user?.email ||
      o.onboarding?.projectEmail ||
      process.env.EMAIL_FALLBACK ||
      'test@example.com' // sim fallback

    const pricingUrl = `${appUrl}/pricing?onboardingId=${o.onboardingId}`

    const html = `
      <div style="font-family: system-ui, sans-serif; line-height:1.6">
        <h2>Reminder: Complete your order</h2>
        <p>Order Code: <strong>${o.orderCode}</strong></p>
        <p>Jurisdiction: <strong>${o.jurisdiction}</strong></p>
        <p>Please complete your payment:</p>
        <p><a href="${pricingUrl}" target="_blank" rel="noopener">Go to payment</a></p>
      </div>
    `

    try {
      await sendEmail({
        to,
        from: process.env.EMAIL_FROM, // fine if undefined in simulation
        subject: `Reminder — Order ${o.orderCode}`,
        html,
      })

      await prisma.order.update({
        where: { id: o.id },
        data: { lastEmailAt: new Date() },
      })

      results.push({ id: o.id, ok: true })
    } catch {
      results.push({ id: o.id, ok: false })
    }
  }

  return NextResponse.json({
    sent: results.filter(r => r.ok).length,
    skipped: results.length - results.filter(r => r.ok).length,
    totalMatched: orders.length,
    simulation: !process.env.RESEND_API_KEY,
  })
}
