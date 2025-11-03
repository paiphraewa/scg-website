// lib/prospects.ts
import { prisma } from '@/lib/prisma'

export function normalizeCompanyName(raw: string): string {
  if (!raw) return ''
  // Example normalization: upper, trim, strip spaces & punctuation commonly found in names
  return raw
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '')       // remove all whitespace
    .replace(/[^\w]/g, '')     // remove non-alphanumerics/underscore
}

type UpsertProspectInput = {
  userId: string
  rawName: string
  jurisdiction?: string | null
  onboardingId?: string | null
  notes?: string | null
}

export async function upsertProspect(input: UpsertProspectInput) {
  const { userId, rawName, jurisdiction, onboardingId, notes } = input
  const normalizedName = normalizeCompanyName(rawName)
  const j = jurisdiction || null

  if (!userId || !normalizedName) return null

  try {
    const prospect = await prisma.prospect.upsert({
      where: {
        // Prisma requires a named unique constraint; match your @@unique:
        userId_normalizedName_jurisdiction: {
          userId,
          normalizedName,
          jurisdiction: j ?? undefined, // undefined when unique field allows null; adjust if needed
        },
      },
      create: {
        userId,
        rawName: rawName.trim(),
        normalizedName,
        jurisdiction: j,
        onboardingId: onboardingId ?? null,
        status: 'new',
        notes: notes ?? null,
      },
      update: {
        rawName: rawName.trim(),
        onboardingId: onboardingId ?? null,
        jurisdiction: j,
        notes: notes ?? undefined,
      },
    })
    return prospect
  } catch (err: any) {
    // If the "undefined for null unique" is touchy, we can fallback to find + update:
    if (err?.code === 'P2002') {
      const found = await prisma.prospect.findFirst({
        where: { userId, normalizedName, jurisdiction: j },
      })
      if (found) {
        return prisma.prospect.update({
          where: { id: found.id },
          data: {
            rawName: rawName.trim(),
            onboardingId: onboardingId ?? null,
            notes: notes ?? undefined,
          },
        })
      }
    }
    console.warn('[upsertProspect] warning:', err)
    return null
  }
}
