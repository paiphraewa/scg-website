// app/api/client-onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      // Personal Information
      gender,
      phoneNumber,
      personalEmail,
      residentialAddress,
      nationality,
      passportNumber,
      passportExpiryDate,
      dateOfBirth,
      taxResidency,
      taxIdentificationNumber,
      
      // Project Information
      projectName,
      projectEmail,
    } = await request.json()

    // Validate required fields
    const requiredFields = {
      gender,
      phoneNumber, 
      personalEmail,
      residentialAddress,
      nationality,
      passportNumber,
      passportExpiryDate,
      dateOfBirth,
      taxResidency,
      taxIdentificationNumber,
      projectName,
      projectEmail
    }

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Create client onboarding in database
    const clientOnboarding = await prisma.clientOnboarding.create({
      data: {
        // Personal Information
        gender,
        phoneNumber,
        personalEmail,
        residentialAddress,
        nationality,
        passportNumber,
        passportExpiryDate,
        dateOfBirth,
        taxResidency,
        taxIdentificationNumber,
        
        // Project Information
        projectName,
        projectEmail,
        
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Client onboarding submitted successfully',
        data: clientOnboarding 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Client onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}