// lib/mailer.ts
import { Resend } from 'resend'

/**
 * Email sending with safe console fallback.
 * - Uses EMAIL_FROM if set (keeps consistent with other modules), then RESEND_FROM, then a default
 * - If RESEND_API_KEY missing or sending fails, logs a full email preview to console and returns success
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.RESEND_FROM || 'no-reply@example.test'
const IS_SIMULATE = !RESEND_API_KEY

if (IS_SIMULATE) {
  console.warn(
    '[mailer] Running in simulation mode — no RESEND_API_KEY found. Emails will be logged to console only.'
  )
}

let resend: Resend | null = null
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
}

type EmailInput = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  // you can extend later with cc/bcc/replyTo if needed
}

function logEmailPreview(tag: string, payload: Required<Pick<EmailInput, 'to' | 'subject'>> & Partial<EmailInput>) {
  // Single place for console previews
  console.log(`--- EMAIL (${tag}) ---`)
  console.log('From:', payload.from || EMAIL_FROM)
  console.log('To:', Array.isArray(payload.to) ? payload.to.join(', ') : payload.to)
  console.log('Subject:', payload.subject)
  if (payload.text) console.log('Text:', payload.text)
  if (payload.html) console.log('HTML:', payload.html)
  console.log('----------------------')
}

export async function sendEmail({ to, subject, text, html, from }: EmailInput) {
  const payload = { to, subject, text, html, from }

  // Guard: basic validation for "to"
  if (!to || (Array.isArray(to) && to.length === 0)) {
    console.warn('[sendEmail] Missing recipient "to" — skipping send.')
    return { id: 'skipped-no-recipient', success: false }
  }

  // Simulate if no API key
  if (IS_SIMULATE || !resend) {
    logEmailPreview('console-fallback', payload)
    return { id: 'console-fallback', success: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || EMAIL_FROM,
      to,
      subject,
      text,
      html,
    })
    if (error) throw error
    return { id: data?.id || 'resend', success: true }
  } catch (err) {
    // Don’t crash the app on email failure; print full preview and proceed
    console.warn('[sendEmail] Resend failed, falling back to console preview:', err)
    logEmailPreview('fallback-on-error', payload)
    return { id: 'fallback-on-error', success: true }
  }
}
