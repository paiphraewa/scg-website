// app/api/client-onboarding/[id]/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { passportCopy, proofOfAddress, bankStatement } = await request.json()

    const data: any = {}
    if (passportCopy) data.passportCopy = passportCopy
    if (proofOfAddress) data.proofOfAddress = proofOfAddress
    if (bankStatement) data.bankStatement = bankStatement

    // Check if all documents exist (mark status = COMPLETED)
    const onboarding = await prisma.clientOnboarding.findUnique({
      where: { id: params.id },
      select: { passportCopy: true, proofOfAddress: true, bankStatement: true },
    })

    const allDocs = [passportCopy || onboarding?.passportCopy, proofOfAddress || onboarding?.proofOfAddress, bankStatement || onboarding?.bankStatement]
    const isAllUploaded = allDocs.every(Boolean)

    if (isAllUploaded) {
      data.status = 'COMPLETED'
    }

    const updatedOnboarding = await prisma.clientOnboarding.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ success: true, data: updatedOnboarding })
  } catch (error) {
    console.error('Update files error:', error)
    return NextResponse.json({ error: 'Failed to update files' }, { status: 500 })
  }
}