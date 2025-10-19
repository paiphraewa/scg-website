// app/api/company-incorporation/draft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { onboardingId, status = 'draft', ...formData } = data

    if (!onboardingId) {
      return NextResponse.json(
        { error: 'onboardingId is required' },
        { status: 400 }
      )
    }

    // Extract individual columns from form data
    const {
      // Individual columns (will be stored separately)
      signatureType,
      signatureFilePath,
      signatureFileName,
      completedByName,
      signedAt,
      ipAddress, 
      userAgent,
      // The rest goes to JSON
      ...formDataForJson
    } = formData

    const prismaData = {
      // All form data (except individual columns) as JSON
      ...formDataForJson,
      
      // Individual columns
      ...(signatureType && { signatureType }),
      ...(signatureFilePath && { signatureFilePath }),
      ...(signatureFileName && { signatureFileName }),
      ...(completedByName && { completedByName }),
      
      // Verification fields as individual columns
      signedAt: signedAt || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      
      status: status,
      updatedAt: new Date()
    }

    // Check if draft already exists
    const existingDraft = await prisma.companyIncorporation.findUnique({
      where: { onboardingId }
    })

    if (existingDraft) {
      const updated = await prisma.companyIncorporation.update({
        where: { onboardingId },
        data: prismaData
      })
      return NextResponse.json(updated)
    } else {
      const newDraft = await prisma.companyIncorporation.create({
        data: {
          onboardingId,
          ...prismaData
        }
      })
      return NextResponse.json(newDraft)
    }
  } catch (error) {
    console.error('Save draft error:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}

// ADD THE GET METHOD HERE - in the same file
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const onboardingId = searchParams.get('onboardingId')

    if (!onboardingId) {
      return NextResponse.json(
        { error: 'onboardingId is required' },
        { status: 400 }
      )
    }

    const draft = await prisma.companyIncorporation.findUnique({
      where: { onboardingId }
    })

    return NextResponse.json(draft || null)

  } catch (error) {
    console.error('Load draft error:', error)
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    )
  }
}