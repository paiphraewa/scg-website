// app/company-incorporation/actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
export const runtime = 'nodejs'

/** ---------- Types that match your Prisma schema ---------- **/

// JSON column shapes (you can tweak keys to match the UI)
type CompanyNamesJSON = { names: string[] }
type RelevantIndividualsJSON = { people: Array<Record<string, any>> }
type SourceOfFundsJSON = {
  totalAmount: string
  compositionDetails: string
}
type RecordsLocationJSON = {
  registersLocation: string
  registersMaintainedBy: string
  financialRecordsLocation: string
  financialRecordsMaintainedBy: string
}
type DeclarationJSON = {
  authorizedToInstruct: boolean
  authorizedInstructorsDetails: string
  pepDetailsAdditional: string
  completedByName: string
  signature: string
}
type ShareholdersJSON = { list: Array<Record<string, any>> }
type DirectorsJSON = { list: Array<Record<string, any>> }

// Everything your form can send (make keys optional for draft)
export type CompanyDraftPayload = Partial<{
  // JSON columns
  companyNames: CompanyNamesJSON
  relevantIndividuals: RelevantIndividualsJSON
  sourceOfFunds: SourceOfFundsJSON
  recordsLocation: RecordsLocationJSON
  declaration: DeclarationJSON
  shareholders: ShareholdersJSON
  directors: DirectorsJSON

  // Simple columns
  purposeOfCompany: string | null
  geographicProfile: string | null
  authorizedShares: string | null
  sharesParValue: string | null
  currency: string | null
  customShares: string | null
  customParValue: string | null
  complexStructureNotes: string | null
  orderSeal: boolean | null
  sealQuantity: string | null

  // Signature + meta (optional during draft)
  signatureType: 'drawn' | 'uploaded' | null
  signatureFilePath: string | null
  signatureFileName: string | null
  completedByName: string | null
  ipAddress: string | null
  userAgent: string | null
}>

// On submit we typically expect more data, but we'll keep it flexible.
// You can narrow this later if you want stricter validation.
export type CompanyFinalPayload = CompanyDraftPayload

/** ---------- Helpers ---------- **/

// Make sure the current user owns this onboarding
async function assertOwner(onboardingId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')

  const ob = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: { userId: true },
  })

  if (!ob || ob.userId !== session.user.id) {
    throw new Error('Forbidden')
  }
}

// Super small deep-merge for JSON columns (objects/arrays only where used)
function deepMerge<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  const out = { ...base }
  for (const key of Object.keys(patch)) {
    const v = (patch as any)[key]
    if (v === undefined) continue
    if (Array.isArray(v)) {
      (out as any)[key] = v // replace arrays
    } else if (v && typeof v === 'object') {
      (out as any)[key] = deepMerge((out as any)[key] ?? {}, v)
    } else {
      (out as any)[key] = v
    }
  }
  return out
}

// Ensure JSON columns are never null and always valid objects
function withDefaults(row: any) {
  return {
    companyNames:        (row?.companyNames ?? { names: [] }) as CompanyNamesJSON,
    relevantIndividuals: (row?.relevantIndividuals ?? { people: [] }) as RelevantIndividualsJSON,
    sourceOfFunds:       (row?.sourceOfFunds ?? { totalAmount: '', compositionDetails: '' }) as SourceOfFundsJSON,
    recordsLocation:     (row?.recordsLocation ?? { registersLocation: '', registersMaintainedBy: '', financialRecordsLocation: '', financialRecordsMaintainedBy: '' }) as RecordsLocationJSON,
    declaration:         (row?.declaration ?? { authorizedToInstruct: false, authorizedInstructorsDetails: '', pepDetailsAdditional: '', completedByName: '', signature: '' }) as DeclarationJSON,
    shareholders:        (row?.shareholders ?? { list: [] }) as ShareholdersJSON,
    directors:           (row?.directors ?? { list: [] }) as DirectorsJSON,
  }
}

/** ---------- Server actions you call from the form ---------- **/

// PARTIAL SAVE (draft)
export async function saveCompanyDraft(onboardingId: string, payload: CompanyDraftPayload) {
  await assertOwner(onboardingId)

  // Load existing to merge JSON fields safely
  const current = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
    select: {
      companyNames: true,
      relevantIndividuals: true,
      sourceOfFunds: true,
      recordsLocation: true,
      declaration: true,
      shareholders: true,
      directors: true,
      purposeOfCompany: true,
      geographicProfile: true,
      authorizedShares: true,
      sharesParValue: true,
      currency: true,
      customShares: true,
      customParValue: true,
      complexStructureNotes: true,
      orderSeal: true,
      sealQuantity: true,
      signatureType: true,
      signatureFilePath: true,
      signatureFileName: true,
      completedByName: true,
      ipAddress: true,
      userAgent: true,
    },
  })

  if (!current) throw new Error('Company incorporation row not found')

  const json = withDefaults(current)

  // Build the update object (only include provided keys)
  const data: any = { status: 'draft' }

  if (payload.companyNames)
    data.companyNames = deepMerge(json.companyNames, payload.companyNames)
  if (payload.relevantIndividuals)
    data.relevantIndividuals = deepMerge(json.relevantIndividuals, payload.relevantIndividuals)
  if (payload.sourceOfFunds)
    data.sourceOfFunds = deepMerge(json.sourceOfFunds, payload.sourceOfFunds)
  if (payload.recordsLocation)
    data.recordsLocation = deepMerge(json.recordsLocation, payload.recordsLocation)
  if (payload.declaration)
    data.declaration = deepMerge(json.declaration, payload.declaration)
  if (payload.shareholders)
    data.shareholders = deepMerge(json.shareholders, payload.shareholders)
  if (payload.directors)
    data.directors = deepMerge(json.directors, payload.directors)

  // Simple fields (only set if provided; do NOT overwrite with undefined)
  const simpleKeys: (keyof CompanyDraftPayload)[] = [
    'purposeOfCompany', 'geographicProfile',
    'authorizedShares', 'sharesParValue', 'currency',
    'customShares', 'customParValue', 'complexStructureNotes',
    'orderSeal', 'sealQuantity',
    'signatureType', 'signatureFilePath', 'signatureFileName', 'completedByName',
    'ipAddress', 'userAgent',
  ]
  for (const k of simpleKeys) {
    if (k in payload && payload[k] !== undefined) {
      (data as any)[k] = payload[k]
    }
  }

  await prisma.companyIncorporation.update({
    where: { onboardingId },
    data,
  })

  // Optional: revalidate
  revalidatePath('/company-incorporation')
}

// FINAL SUBMIT (go to Pricing)
export async function submitCompany(onboardingId: string, payload: CompanyFinalPayload) {
  await assertOwner(onboardingId)

  // Merge JSON the same way (in case final screen includes them)
  const current = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
    select: {
      companyNames: true,
      relevantIndividuals: true,
      sourceOfFunds: true,
      recordsLocation: true,
      declaration: true,
      shareholders: true,
      directors: true,
    },
  })
  if (!current) throw new Error('Company incorporation row not found')

  const json = withDefaults(current)

  const data: any = {
    status: 'submitted',          // ← marks company form finished
    signedAt: new Date(),
  }

  if (payload.companyNames)
    data.companyNames = deepMerge(json.companyNames, payload.companyNames)
  if (payload.relevantIndividuals)
    data.relevantIndividuals = deepMerge(json.relevantIndividuals, payload.relevantIndividuals)
  if (payload.sourceOfFunds)
    data.sourceOfFunds = deepMerge(json.sourceOfFunds, payload.sourceOfFunds)
  if (payload.recordsLocation)
    data.recordsLocation = deepMerge(json.recordsLocation, payload.recordsLocation)
  if (payload.declaration)
    data.declaration = deepMerge(json.declaration, payload.declaration)
  if (payload.shareholders)
    data.shareholders = deepMerge(json.shareholders, payload.shareholders)
  if (payload.directors)
    data.directors = deepMerge(json.directors, payload.directors)

  // Copy over any simple fields provided on the last step too
  const simpleKeys: (keyof CompanyFinalPayload)[] = [
    'purposeOfCompany', 'geographicProfile',
    'authorizedShares', 'sharesParValue', 'currency',
    'customShares', 'customParValue', 'complexStructureNotes',
    'orderSeal', 'sealQuantity',
    'signatureType', 'signatureFilePath', 'signatureFileName', 'completedByName',
    'ipAddress', 'userAgent',
  ]
  for (const k of simpleKeys) {
    if (k in payload && payload[k] !== undefined) {
      (data as any)[k] = payload[k]
    }
  }

  await prisma.companyIncorporation.update({
    where: { onboardingId },
    data,
  })

  return { next: `/pricing?onboardingId=${onboardingId}` }
}
