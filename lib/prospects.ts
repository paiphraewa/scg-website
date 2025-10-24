// lib/prospects.ts
import { prisma } from '@/lib/prisma'

/**
 * Normalize a company name for dedup/search.
 * - trims
 * - uppercases
 * - collapses multiple spaces to one
 * - strips punctuation except spaces/word chars
 */
export function normalizeName(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w ]/g, '')
}

/**
 * Upsert a Prospect row keyed by (userId, normalizedName, jurisdiction).
 * If it already exists, update rawName / onboardingId; otherwise create it.
 */
export async function upsertProspect(opts: {
  userId: string
  rawName: string
  onboardingId?: string | null
  jurisdiction?: string | null
}) {
  const { userId, rawName, onboardingId = null, jurisdiction = null } = opts

  // ignore empty
  const trimmed = (rawName || '').trim()
  if (!trimmed) return null

  const normalized = normalizeName(trimmed)

  // Uses your Prisma composite UNIQUE constraint:
  // @@unique([userId, normalizedName, jurisdiction]) in model Prospect
  return prisma.prospect.upsert({
    where: {
      userId_normalizedName_jurisdiction: {
        userId,
        normalizedName: normalized,
        jurisdiction, // can be null
      },
    },
    update: {
      rawName: trimmed,
      // only update onboardingId if provided (don’t force null)
      ...(onboardingId !== null ? { onboardingId } : {}),
      status: 'new',
    },
    create: {
      userId,
      onboardingId,
      jurisdiction,
      rawName: trimmed,
      normalizedName: normalized,
      status: 'new',
    },
  })
}
