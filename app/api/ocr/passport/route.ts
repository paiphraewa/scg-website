// app/api/ocr/passport/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'anthropic/claude-3.5-sonnet'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function normDate(s?: string) {
  if (!s) return undefined
  const m = String(s).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  const m2 = String(s).trim().match(/^(\d{2})(\d{2})(\d{2})$/)
  if (m2) {
    const yy = parseInt(m2[1], 10)
    const year = yy >= 30 ? 1900 + yy : 2000 + yy
    return `${year}-${m2[2]}-${m2[3]}`
  }
  return s
}

export async function POST(req: Request) {
  try {
    const apiKeyRaw = process.env.OPENROUTER_API_KEY
    const apiKey = apiKeyRaw?.trim() || ''
    if (!apiKey) {
      console.error('[OCR] Missing OPENROUTER_API_KEY env')
      return NextResponse.json({ error: 'OCR is not configured' }, { status: 500 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const mime = file.type || ''
    if (!/^image\/(jpe?g|png|webp)$/i.test(mime)) {
      return NextResponse.json({ error: 'Please upload a JPG/PNG/WEBP image.' }, { status: 415 })
    }

    const maxBytes = 6 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Image too large. Max 6MB.' }, { status: 413 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get('origin') ||
      'https://scg-website-sigma.vercel.app'

    const payload = {
      model: MODEL,
      response_format: { type: 'json_object' as const },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text:
`You are reading a passport image. Extract these fields and return ONLY a JSON object:
- nationality (country name or 3-letter MRZ code)
- passportNumber
- dateOfBirth (YYYY-MM-DD)
- passportExpiryDate (YYYY-MM-DD)
If a field is not visible, omit it. No extra keys.`,
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
    }

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 90_000)

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter recommends these; include both forms
        'HTTP-Referer': origin,
        Referer: origin,
        'X-Title': 'SCG Passport OCR',
      },
      body: JSON.stringify(payload),
    }).finally(() => clearTimeout(timer))

    const raw = await res.text().catch(() => '')
    let json: any = {}
    try { json = raw ? JSON.parse(raw) : {} } catch {}

    if (!res.ok) {
      console.error('[OCR] OpenRouter error:', res.status, raw)
      // Temporarily return the provider message to see exact cause
      const msg = json?.error?.message || json?.message || raw || 'OpenRouter error'
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    const content = json?.choices?.[0]?.message?.content
    let fields: any = {}
    try { fields = typeof content === 'string' ? JSON.parse(content) : (content || {}) } catch {}

    const out = {
      nationality:        fields.nationality ?? undefined,
      passportNumber:     fields.passportNumber ?? fields.passport_no ?? fields.passport ?? undefined,
      dateOfBirth:        normDate(fields.dateOfBirth || fields.birthDate),
      passportExpiryDate: normDate(fields.passportExpiryDate || fields.expiryDate || fields.passportExpiry),
    }

    return NextResponse.json(out, { status: 200 })
  } catch (err: any) {
    const msg = err?.name === 'AbortError'
      ? 'Passport reading timed out. Try a clearer/smaller image.'
      : (err?.message || 'Server error while reading passport')
    console.error('[OCR] Fatal error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}