// lib/orders.ts
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mailer' // single mail path with console fallback

/** Build a readable order code, e.g. SCG-BVI-20251021-0007 (date + daily sequence) */
export async function generateOrderCode(jurisdiction: string) {
  const j = (jurisdiction || 'BVI').toUpperCase()
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')

  // Count today's orders to create a sequence number
  const start = new Date(Date.UTC(y, today.getMonth(), today.getDate(), 0, 0, 0))
  const end = new Date(Date.UTC(y, today.getMonth(), today.getDate() + 1, 0, 0, 0))
  const countToday = await prisma.order.count({
    where: { createdAt: { gte: start, lt: end } },
  })

  const seq = String(countToday + 1).padStart(4, '0')
  return `SCG-${j}-${y}${m}${d}-${seq}`
}

/**
 * Ensure there is one pending order for this onboarding.
 * If none exists, create one and send (or simulate) the email.
 * This function must NOT throw if email fails.
 */
export async function ensurePendingOrder(opts: {
  userId: string
  userEmail: string
  onboardingId: string
  jurisdiction: string
  companyNames?: { firstPreference?: string; chosenEnding?: string } | any
  pricingUrl: string
}) {
  const { userId, userEmail, onboardingId, jurisdiction, companyNames, pricingUrl } = opts

  // 1) Find existing pending order
  let order = await prisma.order.findFirst({
    where: { onboardingId, status: 'pending_payment' },
  })

  // 2) Create if not found
  if (!order) {
    order = await prisma.order.create({
      data: {
        userId,
        onboardingId,
        jurisdiction: jurisdiction || 'BVI',
        orderCode: await generateOrderCode(jurisdiction),
        status: 'pending_payment',
      },
    })
  }

  // 3) Email (console fallback is inside sendEmail)
  const preferred =
    companyNames?.firstPreference
      ? `${companyNames.firstPreference}${companyNames?.chosenEnding ? ' ' + companyNames.chosenEnding : ''}`
      : 'your company'

  const subject = `SCG — Complete your order ${order.orderCode}`
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.6">
      <h2>Complete your order</h2>
      <p>Order Code: <strong>${order.orderCode}</strong></p>
      <p>Jurisdiction: <strong>${(jurisdiction || 'BVI').toUpperCase()}</strong></p>
      <p>Company name (first preference): <strong>${preferred}</strong></p>
      <p>Please complete your payment to proceed:</p>
      <p><a href="${pricingUrl}" target="_blank" rel="noopener">Go to payment</a></p>
      <hr/>
      <p>If you already paid, you can ignore this email.</p>
    </div>
  `

  try {
    await sendEmail({
      to: userEmail,
      from: process.env.EMAIL_FROM, // ok if undefined; sendEmail prints to console without creds
      subject,
      html,
    })
  } catch (e) {
    // Never block order creation on email failure
    console.warn('[ensurePendingOrder] email send failed, continuing:', e)
  }

  // 4) Record lastEmailAt (even if sendEmail only printed to console)
  await prisma.order.update({
    where: { id: order.id },
    data: { lastEmailAt: new Date() },
  })

  return order
}

/** Mark as paid by onboardingId (used by /pricing page) */
export async function markOrderPaidByOnboarding(onboardingId: string) {
  const order = await prisma.order.findFirst({
    where: { onboardingId, status: 'pending_payment' },
  })
  if (!order) return null

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'paid' },
  })
  return updated
}
