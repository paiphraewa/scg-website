// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
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
    const maxSize = 10 * 1024 * 1024 // 10MB
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
      'image/webp'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP, PDF' 
      }, { status: 400 })
    }

    // Sanitize document type for filename
    const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9-_]/g, '_')
    
    // Create unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    const originalName = path.parse(file.name).name
    const fileExtension = path.extname(file.name) || '.bin'
    
    // Create filename: documentType_timestamp_random_originalName.extension
    const fileName = `${sanitizedDocType}_${timestamp}_${random}_${originalName}${fileExtension}`
      .replace(/\s+/g, '_')
      .toLowerCase()
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', onboardingId)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    console.log(`File uploaded successfully: ${filePath}`)

    // Return file information
    return NextResponse.json({ 
      success: true, 
      filePath: `/api/uploads/${onboardingId}/${fileName}`,
      fileName,
      originalFileName: file.name,
      documentType,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed. Please try again.' 
    }, { status: 500 })
  }
}

// Optional: Add OPTIONS handler for CORS if needed
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