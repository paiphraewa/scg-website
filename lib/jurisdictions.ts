// lib/jurisdictions.ts
export type JurisdictionSlug = 'bvi' | 'cayman' | 'hongkong' | 'singapore' | 'panama'
export type JurisdictionToken = 'BVI' | 'CAYMAN' | 'HONGKONG' | 'SINGAPORE' | 'PANAMA'

export const JURISDICTIONS: Array<{ slug: JurisdictionSlug; token: JurisdictionToken; label: string }> = [
  { slug: 'bvi',      token: 'BVI',       label: 'British Virgin Islands (BVI)' },
  { slug: 'cayman',   token: 'CAYMAN',    label: 'Cayman Islands' },
  { slug: 'hongkong', token: 'HONGKONG',  label: 'Hong Kong' },
  { slug: 'singapore',token: 'SINGAPORE', label: 'Singapore' },
  { slug: 'panama',   token: 'PANAMA',    label: 'Panama' },
]

export function labelFor(slugOrToken?: string | null) {
  if (!slugOrToken) return 'Company'
  const s = slugOrToken.toLowerCase()
  const found = JURISDICTIONS.find(j => j.slug === s) || JURISDICTIONS.find(j => j.token.toLowerCase() === s)
  return found?.label ?? slugOrToken
}

export function tokenFor(slug: JurisdictionSlug): JurisdictionToken {
  return (JURISDICTIONS.find(j => j.slug === slug) ?? JURISDICTIONS[0]).token
}
