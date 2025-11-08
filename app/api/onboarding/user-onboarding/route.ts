import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching user onboarding records...')
    
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      console.log('❌ User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('🔍 Fetching onboarding records for user:', user.id)

    // Get ALL user's onboarding records (including completed ones without company incorporation)
    const userOnboarding = await prisma.clientOnboarding.findMany({
      where: {
        userId: user.id,
      },
      include: {
        companyIncorporations: {
          select: {
            id: true,
            jurisdiction: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            purposeOfCompany: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Found onboarding records:', userOnboarding.length)

    // Transform data - include ALL records, not just drafts
    const onboardingData = userOnboarding.map(onboarding => {
      const companyInc = onboarding.companyIncorporations[0]
      
      return {
        id: onboarding.id,
        jurisdiction: companyInc?.jurisdiction || null,
        status: onboarding.status,
        companyIncorporationId: companyInc?.id || null,
        companyIncorporationStatus: companyInc?.status || 'none',
        hasCompanyDraft: companyInc?.status === 'draft',
        hasCompanyIncorporation: !!companyInc,
        hasContent: !!companyInc?.purposeOfCompany,
        createdAt: onboarding.createdAt,
        updatedAt: onboarding.updatedAt
      }
    })

    console.log('📊 All onboarding records:', onboardingData)
    
    return NextResponse.json(onboardingData)

  } catch (error) {
    console.error('💥 Error fetching user onboarding records:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}