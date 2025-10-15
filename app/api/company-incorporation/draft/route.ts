import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {prisma} from '@/lib/prisma'

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

    // Extract verification fields to keep as individual columns
    const {
      signedAt,
      ipAddress, 
      userAgent,
      // The rest goes to JSON
      ...formDataForJson
    } = formData

    const prismaData = {
      // All form data (except verification fields) as JSON
      ...formDataForJson,
      
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