// app/api/company-incorporation/draft/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensurePendingOrder } from '@/lib/orders'
import { upsertProspect } from '@/lib/prospects'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function asDateOrNull(v: unknown) {
  if (!v) return null
  if (v instanceof Date) return v
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}
function jsonOr<T>(defaultVal: T) {
  return (val: any): T => (val === undefined ? defaultVal : val)
}
const jsonOrObj = jsonOr<Record<string, any>>({})
const jsonOrArr = jsonOr<any[]>([])

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

    // Ensure the onboarding exists (prevents FK errors)
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

    // Pull out scalars / JSON
    const {
      caymanEntityInstruction,
      caymanDueDiligence,
      caymanBoDeclaration,
      // signature / verification
      signatureType,
      signatureFilePath,
      signatureFileName,
      completedByName,
      signedAt,
      ipAddress,
      userAgent,

      // simple scalars
      jurisdiction,
      purposeOfCompany,
      geographicProfile,
      authorizedShares,
      sharesParValue,
      currency,
      customShares,
      customParValue,
      complexStructureNotes,
      requiresNomineeShareholder,
      requiresNomineeDirector,

      // JSON-like
      companyNames,
      relevantIndividuals,
      sourceOfFunds,
      recordsLocation,
      declaration,
      shareholders,
      directors,

      // Hong Kong
      companySecretary,
      registeredOffice,
      shareCapital,
      businessNature,

      // ignore unknown keys safely
      ..._restIgnored
    } = formData

    // derive runtime client info if not sent
    const inferredIp =
      ipAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null
    const inferredUA = userAgent || request.headers.get('user-agent') || null

    // server-side signedAt: if there’s a signature and no timestamp, stamp now
    const signedAtServer =
      asDateOrNull(signedAt) ?? (signatureType ? new Date() : null)

    // Build safe data for Prisma (never write undefined into JSON columns)
    const prismaData = {
      // JSON columns
      companyNames: jsonOrObj(companyNames),
      relevantIndividuals: jsonOrArr(relevantIndividuals),
      sourceOfFunds: jsonOrObj(sourceOfFunds),
      recordsLocation: jsonOrObj(recordsLocation),
      declaration: jsonOrObj(declaration),

      // arrays / booleans
      requiresNomineeShareholder: !!requiresNomineeShareholder,
      shareholders: jsonOrArr(shareholders),
      requiresNomineeDirector: !!requiresNomineeDirector,
      directors: jsonOrArr(directors),

      // Hong Kong
      companySecretary: companySecretary ? jsonOrObj(companySecretary) : undefined,
      registeredOffice: registeredOffice ? jsonOrObj(registeredOffice) : undefined,
      shareCapital: shareCapital ? jsonOrObj(shareCapital) : undefined,
      businessNature: businessNature ?? "",

      // Simple fields with fallbacks
      purposeOfCompany: purposeOfCompany ?? '',
      geographicProfile: geographicProfile ?? '',
      authorizedShares: authorizedShares ?? '50000',
      sharesParValue: sharesParValue ?? '1.00',
      currency: currency ?? 'USD',
      customShares: customShares ?? '',
      customParValue: customParValue ?? '',
      complexStructureNotes: complexStructureNotes ?? '',
      jurisdiction: jurisdiction ?? 'BVI',

      // Signature / verification
      completedByName: completedByName ?? null,
      signatureType: signatureType ?? null,
      signatureFilePath: signatureFilePath ?? null,
      signatureFileName: signatureFileName ?? null,
      signedAt: signedAtServer,
      ipAddress: inferredIp,
      userAgent: inferredUA,

      caymanEntityInstruction: caymanEntityInstruction
        ? jsonOrObj(caymanEntityInstruction)
        : undefined,
      caymanDueDiligence: caymanDueDiligence
        ? jsonOrObj(caymanDueDiligence)
        : undefined,

      caymanBoDeclaration: caymanBoDeclaration
        ? jsonOrObj(caymanBoDeclaration)
        : undefined,
        
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

    // ---- Prospect + email side-effects (non-fatal) ----
    let didProspect = false
    let didEmail = false

    try {
      // Prefer body’s firstPref (latest), fallback to DB snapshot
      const bodyFirstPref =
        companyNames && typeof companyNames === 'object'
          ? (companyNames as any)?.firstPreference
          : undefined

      const dbFirstPref =
        draft.companyNames && typeof draft.companyNames === 'object'
          ? (draft.companyNames as any)?.firstPreference
          : undefined

      const firstPref = (bodyFirstPref || dbFirstPref)?.toString()?.trim()

      console.log('[draft] companyNames incoming =', companyNames)
      console.log('[draft] companyNames stored   =', draft.companyNames)
      console.log('[draft] extracted firstPref  =', firstPref)

      if (firstPref) {
        // 1) Upsert Prospect
        await upsertProspect({
          userId: onboarding.userId,
          onboardingId: draft.onboardingId,
          jurisdiction: draft.jurisdiction || 'BVI',
          rawName: firstPref,
        })
        didProspect = true
        console.log('[draft] upsertProspect OK')

        // 2) Ensure pending order + (simulate) email
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXTAUTH_URL ||
          'http://localhost:3000'
        const pricingUrl = `${appUrl}/pricing?onboardingId=${draft.onboardingId}`

        const emailRes = await ensurePendingOrder({
          userId: onboarding.userId,
          userEmail: session.user.email!,
          onboardingId: draft.onboardingId,
          jurisdiction: draft.jurisdiction || 'BVI',
          companyNames: draft.companyNames as any,
          pricingUrl,
        })

        didEmail = true
        console.log('[draft] ensurePendingOrder OK', emailRes)
      } else {
        console.log('[draft] firstPreference missing — Prospect & email skipped.')
      }
    } catch (sideFxErr) {
      console.warn('[draft] side-effects warning (prospect/email):', sideFxErr)
    }

    return NextResponse.json({ ok: true, data: draft, didProspect, didEmail })
  } catch (err: any) {
    const code = err?.code
    if (code === 'P2003') {
      return NextResponse.json(
        { error: 'Foreign key constraint failed. Check onboardingId.' },
        { status: 400 }
      )
    }
    if (code === 'P2002') {
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
      where: { onboardingId },
    })

    return NextResponse.json({ ok: true, data: draft || null })
  } catch (error) {
    console.error('Load draft error:', error)
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
}
