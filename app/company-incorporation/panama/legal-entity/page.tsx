// app/company-incorporation/panama/legal-entity/page.tsx

import { PanamaIncorporationForm } from '@/components/panama-incorporation-form'

type PageProps = {
  searchParams: {
    onboardingId?: string
    jurisdiction?: string
  }
}

export default function PanamaLegalEntityPage({ searchParams }: PageProps) {
  const onboardingId = searchParams.onboardingId
  const jurisdiction = searchParams.jurisdiction ?? 'panama'

  if (!onboardingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Missing onboarding ID</p>
          <p className="text-sm text-muted-foreground">
            Please start again from the company selection page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PanamaIncorporationForm
      onboardingId={onboardingId}
      jurisdiction={jurisdiction}
    />
  )
}
