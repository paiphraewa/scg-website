// app/api/company-incorporation/check-draft/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Checking drafts for user:', session.user.email)

    // Find user's latest draft
    const draft = await prisma.companyIncorporation.findFirst({
      where: {
        onboarding: {
          user: {
            email: session.user.email
          }
        },
        status: 'draft'
      },
      include: {
        onboarding: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    console.log('Found draft:', draft ? draft.id : 'No draft found')

    return NextResponse.json({
      hasDraft: !!draft,
      draft: draft ? {
        id: draft.id,
        onboardingId: draft.onboardingId,
        jurisdiction: draft.jurisdiction,
        status: draft.status,
        updatedAt: draft.updatedAt,
        createdAt: draft.createdAt
      } : null
    })
  } catch (error) {
    console.error('Check draft error:', error)
    return NextResponse.json({ 
      hasDraft: false,
      draft: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}