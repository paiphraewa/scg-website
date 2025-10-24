// lib/orders.ts
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendEmail } from '@/lib/mailer'

/** Build a readable order code, e.g. SCG-BVI-20251021-0007 */
export async function generateOrderCode(jurisdiction: string) {
  const j = (jurisdiction || 'BVI').toUpperCase()
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')

  // Count how many orders exist today to create a sequence number
  const start = new Date(Date.UTC(y, today.getMonth(), today.getDate(), 0, 0, 0))
  const end = new Date(Date.UTC(y, today.getMonth(), today.getDate() + 1, 0, 0, 0))

  const countToday = await prisma.order.count({
    where: { createdAt: { gte: start, lt: end } },
  })

  const seq = String(countToday + 1).padStart(4, '0')
  return `SCG-${j}-${y}${m}${d}-${seq}`
}

/** Send order email — skipped automatically if RESEND_API_KEY missing */
export async function sendOrderEmail(params: {
  to: string
  orderCode: string
  jurisdiction: string
  companyNames?: { firstPreference?: string; secondPreference?: string; thirdPreference?: string; chosenEnding?: string }
  pricingUrl: string
  isReminder?: boolean
}) {
  const { to, orderCode, jurisdiction, companyNames, pricingUrl, isReminder } = params

  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'no-reply@example.com'

  // ⚠️ Skip sending if no API key
  if (!resendKey) {
    console.warn('[sendOrderEmail] RESEND_API_KEY not set — skipping email send.')
    console.log('Simulated email data:', { to, orderCode, jurisdiction, pricingUrl })
    return
  }

  const resend = new Resend(resendKey)
  const subject = isReminder
    ? `Reminder: Complete Payment — Order ${orderCode}`
    : `Your Order ${orderCode} — Complete Payment`

  const preferred =
    companyNames?.firstPreference
      ? `${companyNames.firstPreference}${companyNames?.chosenEnding ? ' ' + companyNames.chosenEnding : ''}`
      : '—'

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6">
      <h2>${subject}</h2>
      <p>Jurisdiction: <strong>${jurisdiction}</strong></p>
      <p>Requested Company Name (1st pref): <strong>${preferred}</strong></p>
      <p>Your Order ID: <strong>${orderCode}</strong></p>
      <p>Please complete your payment to proceed.</p>
      <p><a href="${pricingUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Resume & Pay</a></p>
      <hr/>
      <small>Synergy Consulting Group</small>
    </div>
  `

  await resend.emails.send({ from, to, subject, html })
}

/**
 * Ensure there is one pending order for this onboarding.
 * If none exists, create one and send email (skipped now).
 */
export async function ensurePendingOrder(opts: {
  userId: string
  userEmail: string
  onboardingId: string
  jurisdiction: string
  companyNames?: any
  pricingUrl: string
}) {
  const { userId, userEmail, onboardingId, jurisdiction, companyNames, pricingUrl } = opts

  // 1) find or create pending order
  let order = await prisma.order.findFirst({
    where: { onboardingId, status: 'pending_payment' },
  })

  if (!order) {
    const today = new Date()
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '')
    // Simple code generator: SCG-BVI-YYYYMMDD-xxxx (your choice)
    const suffix = Math.floor(1000 + Math.random() * 9000).toString()
    const orderCode = `SCG-${(jurisdiction || 'BVI').toUpperCase()}-${yyyymmdd}-${suffix}`

    order = await prisma.order.create({
      data: {
        userId,
        onboardingId,
        jurisdiction: jurisdiction || 'BVI',
        orderCode,
        status: 'pending_payment',
      },
    })
  }

  // 2) Send (or simulate) the email
  const firstPref = companyNames?.firstPreference || 'Your company'
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height:1.6">
      <h2>Complete your order</h2>
      <p>Order Code: <strong>${order.orderCode}</strong></p>
      <p>Jurisdiction: <strong>${jurisdiction}</strong></p>
      <p>Company name (first preference): <strong>${firstPref}</strong></p>
      <p>Please complete your payment to proceed:</p>
      <p><a href="${pricingUrl}" target="_blank" rel="noopener">Go to payment</a></p>
      <hr/>
      <p>If you already paid, you can ignore this email.</p>
    </div>
  `

  const res = await sendEmail({
    to: userEmail,
    from: process.env.EMAIL_FROM, // safe if undefined in simulate mode
    subject: `SCG — Complete your order ${order.orderCode}`,
    html,
  })

  // 3) Record the send time (even for simulated sends)
  await prisma.order.update({
    where: { id: order.id },
    data: { lastEmailAt: new Date() },
  })

  return { order, email: res }
}

export async function markOrderPaidByOnboarding(onboardingId: string) {
  // find the current pending order tied to this onboarding
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