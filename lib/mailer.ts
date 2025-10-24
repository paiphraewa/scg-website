// lib/mailer.ts
type OrderEmailParams = {
  to: string
  from?: string
  subject: string
  html: string
}

// Simple switch: if RESEND_API_KEY + FROM are present, you'd plug Resend later.
// For now, we simulate (log + return ok: true).
export async function sendEmail(params: OrderEmailParams) {
  const hasResend = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM

  if (!hasResend) {
    // SIMULATE: log the email payload for local testing
    console.log('[simulate email] --------')
    console.log('TO:', params.to)
    console.log('FROM:', params.from || 'no-reply@example.com')
    console.log('SUBJECT:', params.subject)
    console.log('HTML:', params.html)
    console.log('-------------------------')
    return { ok: true, simulated: true }
  }

  // REAL SEND (when you later have a domain + RESEND_API_KEY):
  // const resend = new Resend(process.env.RESEND_API_KEY!)
  // await resend.emails.send({
  //   from: process.env.EMAIL_FROM!,
  //   to: params.to,
  //   subject: params.subject,
  //   html: params.html,
  // })
  // return { ok: true, simulated: false }

  // For now, just simulate.
  return { ok: true, simulated: true }
}
