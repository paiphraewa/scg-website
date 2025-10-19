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
    const { onboardingId, ...formData } = data

    if (!onboardingId) {
      return NextResponse.json(
        { error: 'onboardingId is required' },
        { status: 400 }
      )
    }

    // Extract individual columns from form data (same structure as main API)
    const {
      // Individual columns (will be stored separately)
      signatureType,
      signatureFilePath,
      signatureFileName,
      completedByName,
      signedAt,
      ipAddress,
      userAgent,
      
      // JSON fields (will be stored as JSON)
      companyNames,
      relevantIndividuals,
      sourceOfFunds,
      recordsLocation,
      declaration,
      requiresNomineeShareholder,
      shareholders,
      requiresNomineeDirector,
      directors,
      purposeOfCompany,
      geographicProfile,
      authorizedShares,
      sharesParValue,
      currency,
      customShares,
      customParValue,
      complexStructureNotes,
      orderSeal,
      sealQuantity,
      jurisdiction,
      status = 'draft'
    } = formData

    // Prepare data for Prisma - same structure as main API but with draft status
    const prismaData: any = {
      // Individual columns
      ...(signatureType && { signatureType }),
      ...(signatureFilePath && { signatureFilePath }),
      ...(signatureFileName && { signatureFileName }),
      ...(completedByName && { completedByName }),
      ...(signedAt && { signedAt: new Date(signedAt) }),
      ...(ipAddress && { ipAddress }),
      ...(userAgent && { userAgent }),
      
      // JSON fields
      ...(companyNames && { companyNames }),
      ...(relevantIndividuals && { relevantIndividuals }),
      ...(sourceOfFunds && { sourceOfFunds }),
      ...(recordsLocation && { recordsLocation }),
      ...(declaration && { declaration }),
      ...(shareholders && { shareholders }),
      ...(directors && { directors }),
      
      // Simple fields
      ...(jurisdiction && { jurisdiction }),
      ...(purposeOfCompany && { purposeOfCompany }),
      ...(geographicProfile && { geographicProfile }),
      ...(authorizedShares && { authorizedShares }),
      ...(sharesParValue && { sharesParValue }),
      ...(currency && { currency }),
      ...(customShares && { customShares }),
      ...(customParValue && { customParValue }),
      ...(complexStructureNotes && { complexStructureNotes }),
      ...(orderSeal !== undefined && { orderSeal }),
      ...(sealQuantity && { sealQuantity }),
      ...(requiresNomineeShareholder !== undefined && { requiresNomineeShareholder }),
      ...(requiresNomineeDirector !== undefined && { requiresNomineeDirector }),
      
      status,
      updatedAt: new Date()
    }

    // Check if record exists
    const existingRecord = await prisma.companyIncorporation.findUnique({
      where: { onboardingId }
    })

    let result;
    if (existingRecord) {
      // Update existing record
      result = await prisma.companyIncorporation.update({
        where: { onboardingId },
        data: prismaData
      })
    } else {
      // Create new record
      result = await prisma.companyIncorporation.create({
        data: {
          onboardingId,
          ...prismaData
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Save draft error:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}

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

    if (!draft) {
      return NextResponse.json({ 
        success: true,
        data: null 
      })
    }

    return NextResponse.json({
      success: true,
      data: draft
    })

  } catch (error) {
    console.error('Load draft error:', error)
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Check if record exists
    const existingRecord = await prisma.companyIncorporation.findUnique({
      where: { onboardingId }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Delete the draft
    await prisma.companyIncorporation.delete({
      where: { onboardingId }
    })

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })

  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}