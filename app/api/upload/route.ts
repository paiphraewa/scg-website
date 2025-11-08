// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge'               // ✅ Blob works great on Edge
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const documentType = String(formData.get('documentType') || '')
    const onboardingId = String(formData.get('onboardingId') || '')

    if (!file)         return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!documentType) return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    if (!onboardingId) return NextResponse.json({ error: 'Onboarding ID is required' }, { status: 400 })

    // Allow images + PDFs up to 15 MB (bank statements are often large)
    const MAX = 15 * 1024 * 1024
    if (file.size > MAX) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 })
    }

    const allowed = /^(image\/(png|jpe?g|gif|webp)|application\/pdf)$/i
    if (!allowed.test(file.type || '')) {
      return NextResponse.json({ error: 'Invalid type (allow: jpg/png/gif/webp/pdf)' }, { status: 415 })
    }

    // deterministic, readable key
    const ts = Date.now()
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const key = `uploads/${onboardingId}/${documentType}_${ts}.${ext}`

    // Upload to Vercel Blob (returns a public URL)
    const { url } = await put(key, file, { access: 'public' })

    // ⚠️ Return shape that your client expects (documentType + filePath)
    return NextResponse.json({
      success: true,
      documentType,            // <-- your client reads this
      filePath: url,           // <-- your client calls this "filePath"
      fileName: key.split('/').pop(),
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      // also include raw url for convenience
      url,
      key,
    })
  } catch (err) {
    console.error('[upload] error:', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

// Optional: preflight (only if you ever call from another origin)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
