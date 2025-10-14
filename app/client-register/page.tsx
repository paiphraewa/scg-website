// app/client-register/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClientRegisterForm } from '@/components/client-register-form'

export default async function ClientRegisterPage({
  searchParams,
}: {
  searchParams: { jurisdiction?: string }
}) {
  const session = await auth()

  // Server-side protection - redirect if not logged in
  if (!session) {
    redirect('/login?callbackUrl=/client-register')
  }

  const jurisdiction = searchParams.jurisdiction || 'BVI'
  const jurisdictionName = getJurisdictionName(jurisdiction)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Onboarding - {jurisdictionName}</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.email}! Complete client onboarding form below.
        </p>
      </div>
      
      <ClientRegisterForm jurisdiction={jurisdiction} />
    </div>
  )
}

// Helper function to get jurisdiction display name
function getJurisdictionName(jurisdictionId: string): string {
  const jurisdictions: { [key: string]: string } = {
    'bvi': 'British Virgin Islands (BVI)',
    'cayman': 'Cayman Islands',
    'hongkong': 'Hong Kong',
    'singapore': 'Singapore',
    'panama': 'Panama',
    'BVI': 'British Virgin Islands (BVI)',
    'KY': 'Cayman Islands', 
    'HK': 'Hong Kong',
    'SG': 'Singapore',
    'PA': 'Panama',
  }
  
  return jurisdictions[jurisdictionId] || jurisdictionId.toUpperCase()
}