// app/incorporate/[jurisdiction]/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {ClientRegisterForm } from '@/components/client-register-form' // default export in your file
import { ensureBviOnboardingAndDraft } from '@/lib/flow'

interface IncorporationPageProps {
  params: {
    jurisdiction: string
  }
}

export default async function IncorporationPage({ params }: IncorporationPageProps) {
  const session = await auth()
  const j = params.jurisdiction.toLowerCase()

  // Server-side protection - redirect if not logged in
  if (!session) {
    redirect(`/login?callbackUrl=/incorporate/${j}`)
  }

  // NEW FLOW: BVI goes to company-incorporation first
  if (j === 'bvi') {
    const { onboardingId } = await ensureBviOnboardingAndDraft()
    redirect(`/company-incorporation?onboardingId=${onboardingId}&jurisdiction=BVI`)
  }

  // OLD FLOW (kept for other jurisdictions)
  const jurisdictionName = getJurisdictionName(j)
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Onboarding - {jurisdictionName}</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.email}! Complete client onboarding form below.
        </p>
      </div>
      <ClientRegisterForm jurisdiction={j} />
    </div>
  )
}

// Helper function to get jurisdiction display name
function getJurisdictionName(jurisdictionId: string): string {
  const jurisdictions: Record<string, string> = {
    bvi: 'British Virgin Islands (BVI)',
    cayman: 'Cayman Islands',
    hongkong: 'Hong Kong',
    singapore: 'Singapore',
    panama: 'Panama',
  }
  return jurisdictions[jurisdictionId] || jurisdictionId.toUpperCase()
}
