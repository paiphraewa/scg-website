import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'anthropic/claude-3.5-sonnet'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    // For now, accept only images (JPG/PNG). PDFs need rasterization first.
    const mime = file.type || ''
    if (!/^image\//i.test(mime)) {
      return NextResponse.json({ error: 'Please upload a JPG/PNG image of the passport.' }, { status: 415 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`

    // Build an OpenAI-compatible request for OpenRouter
    const payload = {
      model: MODEL,
      // Force strict JSON so we can parse safely
      response_format: { type: 'json_object' as const },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
`You are reading a passport image. Extract these fields and return ONLY a JSON object:

- nationality (ISO country name if visible, else 3-letter MRZ code)
- passportNumber
- dateOfBirth (YYYY-MM-DD)
- passportExpiryDate (YYYY-MM-DD)

If a field is not visible, omit it. Do not include extra keys.`
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl }
            }
          ]
        }
      ]
    }

    // Use a timeout so requests never hang forever
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 90_000)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch((e) => {
      throw new Error(`OpenRouter request failed: ${e?.message || e}`)
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`OpenRouter error (${res.status}): ${errText}`)
    }

    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content

    let fields: any = {}
    try {
      // content is forced JSON because response_format=json_object
      fields = typeof content === 'string' ? JSON.parse(content) : (content || {})
    } catch {
      fields = {}
    }

    // Normalize keys defensively
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

    console.error('[OCR via OpenRouter] error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function normDate(s?: string) {
  if (!s) return undefined
  // Accept common formats and coerce to YYYY-MM-DD
  const m = String(s).trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (m) {
    const [_, y, mo, d] = m
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  // YYMMDD (MRZ style)
  const m2 = String(s).trim().match(/^(\d{2})(\d{2})(\d{2})$/)
  if (m2) {
    let yy = parseInt(m2[1], 10)
    const year = yy >= 30 ? 1900 + yy : 2000 + yy
    return `${year}-${m2[2]}-${m2[3]}`
  }
  return s // fall through if model already gave ISO
}
