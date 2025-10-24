// app/api/client-onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // If onboardingId is present, we UPDATE that row; otherwise we CREATE a new one.
    const {
      onboardingId,

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
    } = body

    // === Validation rules ===
    // For CREATE: enforce required fields (your current behavior).
    // For UPDATE: allow partial updates so we don't block uploads/patches.
    if (!onboardingId) {
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
        projectEmail,
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
    }

    // Common payload (only include keys that are present to allow partial updates on PATCH-like usage)
    const data: any = {
      // Personal
      ...(gender !== undefined && { gender }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(personalEmail !== undefined && { personalEmail }),
      ...(residentialAddress !== undefined && { residentialAddress }),
      ...(nationality !== undefined && { nationality }),
      ...(passportNumber !== undefined && { passportNumber }),
      ...(passportExpiryDate !== undefined && { passportExpiryDate }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(taxResidency !== undefined && { taxResidency }),
      ...(taxIdentificationNumber !== undefined && { taxIdentificationNumber }),

      // Project
      ...(projectName !== undefined && { projectName }),
      ...(projectEmail !== undefined && { projectEmail }),
    }

    let record

    if (onboardingId) {
      // ✅ UPDATE existing onboarding (prevents duplicate rows)
      record = await prisma.clientOnboarding.update({
        where: { id: onboardingId },
        data,
      })
    } else {
      // ✅ CREATE new onboarding (first-time submit)
      record = await prisma.clientOnboarding.create({
        data: {
          ...data,
          userId: session.user.id,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: onboardingId
          ? 'Client onboarding updated successfully'
          : 'Client onboarding submitted successfully',
        data: {
          id: record.id, // onboardingId
          ...record,
        },
      },
      { status: onboardingId ? 200 : 201 }
    )
  } catch (error) {
    console.error('Client onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
