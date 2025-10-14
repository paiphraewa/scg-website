// app/api/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { stat } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Construct the full file path
    const filePath = path.join(process.cwd(), 'uploads', ...params.path)
    
    console.log('Looking for file at:', filePath)
    console.log('Params path:', params.path)
    console.log('Process CWD:', process.cwd())

    // Check if file exists
    try {
      const fileStats = await stat(filePath)
      console.log('File exists, stats:', fileStats)
    } catch (error) {
      console.log('File not found error:', error)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase()
    const contentType = getContentType(ext)
    
    // Return the file with appropriate headers
    return new NextResponse(new Blob([new Uint8Array(fileBuffer)]), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}

function getContentType(ext: string): string {
  const types: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
  }
  return types[ext] || 'application/octet-stream'
}