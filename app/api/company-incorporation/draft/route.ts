// app/api/company-incorporation/draft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensurePendingOrder } from '@/lib/orders'
import { upsertProspect } from '@/lib/prospects'

function asDateOrNull(v: unknown) {
  if (!v) return null
  if (v instanceof Date) return v
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

function jsonOr(defaultVal: any) {
  // Ensure we never write undefined into JSON columns
  return (val: any) => (val === undefined ? defaultVal : val)
}
const jsonOrObj = jsonOr({})
const jsonOrArr = jsonOr([])

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { onboardingId, status = 'draft', ...formData } = body
    if (!onboardingId) {
      return NextResponse.json({ error: 'onboardingId is required' }, { status: 400 })
    }

    // ✅ Ensure the onboarding exists to avoid FK errors
    const onboarding = await prisma.clientOnboarding.findUnique({
      where: { id: onboardingId },
      select: { id: true, userId: true },
    })
    if (!onboarding) {
      return NextResponse.json(
        { error: 'Invalid onboardingId (not found)' },
        { status: 400 }
      )
    }

    // Pull out scalars that map to individual columns
    const {
      signatureType,
      signatureFilePath,
      signatureFileName,
      completedByName,
      signedAt,
      ipAddress,
      userAgent,
      jurisdiction,
      // everything else (JSON)
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
      // ...ignore unknown keys safely
      ...restIgnored
    } = formData

    const needsRegisteredOffice = Boolean(sourceOfFunds?.needsRegisteredOffice)
    const officeLocation = needsRegisteredOffice ? null : (sourceOfFunds?.officeLocation ?? null)
    const registeredOfficeFeeHKD = needsRegisteredOffice ? 1500 : 0

    // ✅ Build safe data for Prisma (no undefined in JSON columns; correct Date type)
    const prismaData = {
      // JSON columns (always objects/arrays, never undefined)
      companyNames: jsonOrObj(companyNames),
      relevantIndividuals: jsonOrArr(relevantIndividuals),
      sourceOfFunds: jsonOrObj(sourceOfFunds),
      recordsLocation: jsonOrObj(recordsLocation),
      declaration: jsonOrObj(declaration),

      // Booleans/arrays
      requiresNomineeShareholder: !!requiresNomineeShareholder,
      shareholders: jsonOrArr(shareholders),
      requiresNomineeDirector: !!requiresNomineeDirector,
      directors: jsonOrArr(directors),

      // Simple fields with fallbacks
      purposeOfCompany: purposeOfCompany ?? '',
      geographicProfile: geographicProfile ?? '',
      authorizedShares: authorizedShares ?? '50000',
      sharesParValue: sharesParValue ?? '1.00',
      currency: currency ?? 'USD',
      customShares: customShares ?? '',
      customParValue: customParValue ?? '',
      complexStructureNotes: complexStructureNotes ?? '',
      orderSeal: orderSeal ?? true,
      sealQuantity: sealQuantity ?? '1',
      jurisdiction: jurisdiction ?? 'BVI',
      needsRegisteredOffice,
      officeLocation,
      registeredOfficeFeeHKD,

      // Signature / verification
      completedByName: completedByName ?? null,
      signatureType: signatureType ?? null,
      signatureFilePath: signatureFilePath ?? null,
      signatureFileName: signatureFileName ?? null,
      signedAt: asDateOrNull(signedAt),           // ✅ convert string → Date or null
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,

      status,
      updatedAt: new Date(),
    }

    // Upsert by onboardingId
    const draft = await prisma.companyIncorporation.upsert({
      where: { onboardingId },
      create: { onboardingId, ...prismaData },
      update: prismaData,
      select: {
        onboardingId: true,
        jurisdiction: true,
        companyNames: true,
        signedAt: true, 
      },
    })

    // ✅ Auto-save prospect (capture company name as Prospect for name-check workflow)
    try {
      // Safely extract firstPreference from JSON
      const firstPref =
        (draft.companyNames as any)?.firstPreference ??
        (typeof draft.companyNames === 'object' ? (draft.companyNames as any)?.firstPreference : null)

      if (firstPref) {
        await upsertProspect({
          userId: onboarding.userId,                    // from the onboarding we fetched earlier
          onboardingId: draft.onboardingId,            // link prospect to this onboarding when available
          jurisdiction: draft.jurisdiction || 'BVI',   // or pass null if you prefer to keep it unset
          rawName: firstPref,
        })
      }
    } catch (prospectError) {
      console.warn('[draft] upsertProspect warning:', prospectError)
    }

    // Optional: create/ensure pending order once a name exists
    try {
      const firstPref = draft.companyNames && (draft.companyNames as any).firstPreference
      if (firstPref) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXTAUTH_URL ||
          'http://localhost:3000'
        const pricingUrl = `${appUrl}/pricing?onboardingId=${draft.onboardingId}`

        // This call safely no-ops email if RESEND_API_KEY is missing
        await ensurePendingOrder({
          userId: onboarding.userId,
          userEmail: session.user.email!,
          onboardingId: draft.onboardingId,
          jurisdiction: draft.jurisdiction || 'BVI',
          companyNames: draft.companyNames as any,
          pricingUrl,
        })
      }
    } catch (e) {
      // Don’t fail the draft save if order/email logic fails
      console.warn('[draft] ensurePendingOrder warning:', e)
    }

    return NextResponse.json({ ok: true, data: draft })
  } catch (err: any) {
    // Try to make the error actionable
    const code = err?.code
    if (code === 'P2003') {
      // FK violation (e.g., onboardingId not found)
      return NextResponse.json(
        { error: 'Foreign key constraint failed. Check onboardingId.' },
        { status: 400 }
      )
    }
    if (code === 'P2002') {
      // Unique constraint
      return NextResponse.json(
        { error: 'Unique constraint failed.' },
        { status: 400 }
      )
    }
    console.error('[Save draft] Unhandled error:', err)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
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
      return NextResponse.json({ error: 'onboardingId is required' }, { status: 400 })
    }

    const draft = await prisma.companyIncorporation.findUnique({
      where: { onboardingId }
    })

    return NextResponse.json(draft || null)
  } catch (error) {
    console.error('Load draft error:', error)
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
}
