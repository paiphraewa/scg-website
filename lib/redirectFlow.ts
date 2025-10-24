// lib/redirectFlow.ts
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Jurisdiction support
 * - slug: URL-friendly (used in /incorporate/<slug>)
 * - token: what your forms/pages expect in the ?jurisdiction=... query (e.g., 'BVI')
 *
 * Add more entries as you roll out new jurisdictions.
 */
type JurisdictionSlug = 'bvi' | 'cayman' | 'hongkong' | 'singapore' | 'panama'
type JurisdictionToken = 'BVI' | 'CAYMAN' | 'HONGKONG' | 'SINGAPORE' | 'PANAMA'

const JURISDICTIONS: Record<JurisdictionSlug, JurisdictionToken> = {
  bvi: 'BVI',
  cayman: 'CAYMAN',
  hongkong: 'HONGKONG',
  singapore: 'SINGAPORE',
  panama: 'PANAMA',
}

/** Normalize any free-text jurisdiction to a known slug; default to 'bvi' */
function normalizeSlug(input?: string | null): JurisdictionSlug {
  const s = (input ?? '').toLowerCase().trim()
  if ((Object.keys(JURISDICTIONS) as JurisdictionSlug[]).includes(s as JurisdictionSlug)) {
    return s as JurisdictionSlug
  }
  if (s.includes('bvi')) return 'bvi'
  if (s.includes('cay')) return 'cayman'
  if (s.includes('hong')) return 'hongkong'
  if (s.includes('sing')) return 'singapore'
  if (s.includes('pan')) return 'panama'
  return 'bvi'
}

/** Map slug → token your forms expect */
function tokenFor(slug: JurisdictionSlug): JurisdictionToken {
  return JURISDICTIONS[slug]
}

/**
 * Redirect the current user to the correct step based on their most recent incorporation.
 *
 * @param preferredJurisdiction slug to start with if the user has no records yet (default 'bvi')
 *
 * Status routing:
 *   - no incorporation yet        → /incorporate/<slug>
 *   - 'draft'                     → /company-incorporation?onboardingId=...&jurisdiction=<TOKEN>
 *   - 'submitted'                 → /pricing?onboardingId=...
 *   - 'paid'                      → /client-register?onboardingId=...&jurisdiction=<TOKEN>
 *   - onboarding.status=COMPLETED → /success
 */
export async function handleResumeFlow(preferredJurisdiction: JurisdictionSlug = 'bvi') {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // Find the most recently updated incorporation across ALL of this user's onboardings
  const inc = await prisma.companyIncorporation.findFirst({
    where: { onboarding: { userId } },
    orderBy: { updatedAt: 'desc' },
    select: {
      onboardingId: true,
      status: true,           // 'draft' | 'submitted' | 'paid' (using your single status column)
      jurisdiction: true,     // may be null; we normalize
    },
  })

  // If no incorporation exists yet, start the chosen (or default) jurisdiction
  if (!inc) {
    const startSlug = normalizeSlug(preferredJurisdiction)
    redirect(`/incorporate/${startSlug}`)
  }

  const slug = normalizeSlug(inc.jurisdiction)
  const token = tokenFor(slug)
  const onboardingId = inc.onboardingId

  // Also check onboarding completion for final step
  const onboarding = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: { status: true }, // 'PENDING' | 'COMPLETED'
  })

  // Route by incorporation status
  if (inc.status === 'draft') {
    redirect(`/company-incorporation?onboardingId=${onboardingId}&jurisdiction=${token}`)
  }

  if (inc.status === 'submitted') {
    redirect(`/pricing?onboardingId=${onboardingId}`)
  }

  if (inc.status === 'paid') {
    redirect(`/client-register?onboardingId=${onboardingId}&jurisdiction=${token}`)
  }

  // Onboarding finished
  if (onboarding?.status === 'COMPLETED') {
    redirect('/success')
  }

  // Fallback (rare): restart the same jurisdiction flow
  redirect(`/incorporate/${slug}`)
}
