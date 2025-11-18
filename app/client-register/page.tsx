import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClientRegisterForm } from '@/components/client-register-form'

export default async function ClientRegisterPage({
  searchParams,
}: {
  searchParams: { onboardingId?: string }
}) {
  const session = await auth()

  // Must be logged in
  if (!session) redirect('/login?callbackUrl=/client-register')

  // Must have onboardingId
  const onboardingId = searchParams.onboardingId
  if (!onboardingId) redirect('/incorporate/bvi')

  // Fetch onboarding and related incorporation
  const onboarding = await prisma.clientOnboarding.findUnique({
    where: { id: onboardingId },
    select: {
      companyIncorporations: {
        select: { jurisdiction: true },
      },
    },
  })

  // Extract jurisdiction
  const jurisdiction =
    onboarding?.companyIncorporations?.[0]?.jurisdiction || 'BVI'

  const jurisdictionName = getJurisdictionName(jurisdiction)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Client Onboarding – {jurisdictionName}
        </h1>

        <p className="text-muted-foreground">
          Welcome back, {session.user?.email}! Complete client onboarding form below.
        </p>
      </div>

      <ClientRegisterForm jurisdiction={jurisdiction} />
    </div>
  )
}

function getJurisdictionName(j: string): string {
  const map: Record<string, string> = {
    BVI: 'British Virgin Islands (BVI)',
    PANAMA: 'Panama',
    SINGAPORE: 'Singapore',
    HONGKONG: 'Hong Kong',
    CAYMAN: 'Cayman Islands',
  }
  return map[j] || j
}
