// lib/flow.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PLACEHOLDER = 'TBD'
const PLACEHOLDER_EMAIL = 'placeholder@example.com'

// Minimal valid JSON for your JSON columns
function minimalIncorpJSON() {
  return {
    companyNames:        { names: [] },
    relevantIndividuals: { people: [] },
    sourceOfFunds:       { totalAmount: '', compositionDetails: '' },
    recordsLocation:     { registersLocation: '', registersMaintainedBy: '', financialRecordsLocation: '', financialRecordsMaintainedBy: '' },
    declaration:         { authorizedToInstruct: false, authorizedInstructorsDetails: '', pepDetailsAdditional: '', completedByName: '', signature: '' },
    shareholders:        { list: [] },
    directors:           { list: [] },
  }
}

/**
 * Ensures:
 *  1) a ClientOnboarding (with placeholder values for required fields)
 *  2) a CompanyIncorporation row linked to it (status='draft', jurisdiction='BVI')
 * Returns { onboardingId, incorporationId }.
 */
export async function ensureBviOnboardingAndDraft() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')
  const userId = session.user.id

  // Find latest onboarding for this user (you can later filter by jurisdiction if you add that field)
  let onboarding = await prisma.clientOnboarding.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // If none, create one with placeholder values to satisfy non-optional schema
  if (!onboarding) {
    onboarding = await prisma.clientOnboarding.create({
      data: {
        userId,
        status: 'PENDING',
        gender: PLACEHOLDER,
        phoneNumber: PLACEHOLDER,
        personalEmail: PLACEHOLDER_EMAIL,
        residentialAddress: PLACEHOLDER,
        nationality: PLACEHOLDER,
        passportNumber: PLACEHOLDER,
        passportExpiryDate: PLACEHOLDER,
        dateOfBirth: PLACEHOLDER,
        taxResidency: PLACEHOLDER,
        taxIdentificationNumber: PLACEHOLDER,
        projectName: PLACEHOLDER,
        projectEmail: PLACEHOLDER_EMAIL,
        // KYC file paths are optional so we can leave them null
      },
    })
  }

  // Ensure one-to-one company incorporation exists for this onboarding
  let incorporation = await prisma.companyIncorporation.findUnique({
    where: { onboardingId: onboarding.id },
  })

  if (!incorporation) {
    const base = minimalIncorpJSON()
    incorporation = await prisma.companyIncorporation.create({
      data: {
        onboardingId: onboarding.id,
        jurisdiction: 'BVI',
        // JSON columns
        companyNames: base.companyNames,
        relevantIndividuals: base.relevantIndividuals,
        sourceOfFunds: base.sourceOfFunds,
        recordsLocation: base.recordsLocation,
        declaration: base.declaration,
        shareholders: base.shareholders,
        directors: base.directors,
        // Simple fields with defaults in your schema are fine as-is
        status: 'draft',
      },
    })
  }

  return { onboardingId: onboarding.id, incorporationId: incorporation.id }
}
