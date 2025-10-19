// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Validate path parameters
    if (!params.path || params.path.length === 0) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Construct the full file path
    const filePath = path.join(process.cwd(), 'uploads', ...params.path)
    
    // Security check: ensure the path is within uploads directory
    const normalizedPath = path.normalize(filePath)
    const uploadsDir = path.join(process.cwd(), 'uploads')
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      console.error('Security violation: Attempted access outside uploads directory')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if file exists and get file stats
    let fileStats
    try {
      fileStats = await stat(filePath)
    } catch (error) {
      console.error('File not found:', filePath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if it's a directory
    if (fileStats.isDirectory()) {
      return NextResponse.json({ error: 'Cannot access directory' }, { status: 400 })
    }

    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase()
    const contentType = getContentType(ext)
    
    // Get filename for Content-Disposition
    const fileName = path.basename(filePath)
    
    // Set appropriate headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    }

    // For images and PDFs, use inline disposition to display in browser
    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      headers['Content-Disposition'] = `inline; filename="${fileName}"`
    } else {
      headers['Content-Disposition'] = `attachment; filename="${fileName}"`
    }

    // FIX: Convert Buffer to Uint8Array and create Blob
    const uint8Array = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8Array], { type: contentType });

    // Return the file as Blob
    return new NextResponse(blob, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ 
      error: 'Failed to serve file' 
    }, { status: 500 })
  }
}

function getContentType(ext: string): string {
  const types: { [key: string]: string } = {
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    
    // Text
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.css': 'text/css',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    
    // Default
    '.bin': 'application/octet-stream',
  }
  
  return types[ext] || 'application/octet-stream'
}

// Optional: Add OPTIONS handler for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}