// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const onboardingId = formData.get('onboardingId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }
    if (!onboardingId) {
      return NextResponse.json({ error: 'Onboarding ID is required' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'image/webp',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, PDF' },
        { status: 400 }
      )
    }

    // Build a safe file name for storage
    const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-_]/g, '_')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || 'bin'
    const blobPath = `uploads/${onboardingId}/${sanitizedDocType}_${timestamp}_${random}.${ext}`

    // Upload to Vercel Blob
    const { url } = await put(blobPath, file, { access: 'public' })

    return NextResponse.json({
      success: true,
      url,               // public Blob URL
      fileName: blobPath,
      originalFileName: file.name,
      documentType,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

// Optional CORS preflight
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
