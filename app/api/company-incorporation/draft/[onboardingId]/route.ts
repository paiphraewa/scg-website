// app/api/company-incorporation/draft/[onboardingId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { onboardingId: string } }
) {
  try {
    console.log('📥 Loading draft for onboardingId:', params.onboardingId)
    
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate onboardingId
    if (!params.onboardingId || params.onboardingId === 'undefined') {
      console.log('❌ Invalid onboardingId:', params.onboardingId)
      return NextResponse.json(
        { error: 'Valid onboardingId is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Searching for draft with onboardingId:', params.onboardingId)
    
    const draft = await prisma.companyIncorporation.findUnique({
      where: { onboardingId: params.onboardingId }
    })

    console.log('📦 Draft found:', !!draft)
    
    if (!draft) {
      console.log('❌ Draft not found for onboardingId:', params.onboardingId)
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Verify the draft belongs to the current user
    const onboarding = await prisma.clientOnboarding.findUnique({
      where: { id: params.onboardingId },
      include: { user: true }
    })

    if (!onboarding || onboarding.user.email !== session.user.email) {
      console.log('❌ Draft access denied - user mismatch')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('✅ Draft loaded successfully:', draft.id)
    return NextResponse.json(draft)
  } catch (error) {
    console.error('❌ Get draft error:', error)
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    )
  }
}