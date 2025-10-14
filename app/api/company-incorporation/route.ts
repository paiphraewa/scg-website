// app/api/company-incorporation/route.ts - With basic validation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { onboardingId, jurisdiction, ...formData } = body

    // Basic validation
    if (!onboardingId) {
      return NextResponse.json({ error: 'Onboarding ID is required' }, { status: 400 })
    }

    // Verify the onboarding record exists
    const onboarding = await prisma.clientOnboarding.findUnique({
      where: {
        id: onboardingId
      }
    })

    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    // Create company incorporation record
    const companyIncorporation = await prisma.companyIncorporation.create({
      data: {
        onboardingId,
        jurisdiction,
        companyNames: formData.companyNames,
        purposeOfCompany: formData.purposeOfCompany,
        geographicProfile: formData.geographicProfile,
        authorizedShares: formData.authorizedShares,
        sharesParValue: formData.sharesParValue,
        currency: formData.currency,
        customShares: formData.customShares,
        customParValue: formData.customParValue,
        orderSeal: formData.orderSeal,
        sealQuantity: parseInt(formData.sealQuantity) || 1,
        relevantIndividuals: formData.relevantIndividuals,
        status: 'submitted'
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: companyIncorporation 
    })

  } catch (error) {
    console.error('Company incorporation submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}