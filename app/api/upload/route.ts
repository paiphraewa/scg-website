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

    if (!file || !documentType || !onboardingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create unique filename using timestamp
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const fileExtension = path.extname(file.name)
    const fileName = `${documentType}_${timestamp}_${random}${fileExtension}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', onboardingId)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Return file path - UPDATED THIS LINE
    return NextResponse.json({ 
      success: true, 
      filePath: `/api/uploads/${onboardingId}/${fileName}`, // Changed from /uploads/ to /api/uploads/
      fileName,
      documentType
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}