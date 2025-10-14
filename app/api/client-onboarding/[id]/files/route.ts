// app/api/client-onboarding/[id]/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { passportCopy, proofOfAddress, bankStatement } = await request.json()
    
    const updatedOnboarding = await prisma.clientOnboarding.update({
      where: { id: params.id },
      data: {
        ...(passportCopy && { passportCopy }),
        ...(proofOfAddress && { proofOfAddress }),
        ...(bankStatement && { bankStatement }),
      },
    })

    return NextResponse.json({ success: true, data: updatedOnboarding })
  } catch (error) {
    console.error('Update files error:', error)
    return NextResponse.json({ error: 'Failed to update files' }, { status: 500 })
  }
}