// app/company-incorporation/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CompanyIncorporationForm } from '@/components/company-incorporation-form'
import { Card, CardContent } from '@/components/ui/card'

export default function CompanyIncorporationPage() {
  const [onboardingId, setOnboardingId] = useState<string | null>(null)
  const [jurisdiction, setJurisdiction] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    const onboardingIdParam = searchParams.get('onboardingId')
    const jurisdictionParam = searchParams.get('jurisdiction')

    if (!onboardingIdParam) {
      alert('Missing onboarding information. Please complete client registration first.')
      router.push('/client-register')
      return
    }

    setOnboardingId(onboardingIdParam)
    setJurisdiction(jurisdictionParam)
  }, [session, status, router, searchParams])

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!onboardingId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <p>Redirecting to client registration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <CompanyIncorporationForm 
        onboardingId={onboardingId}
        jurisdiction={jurisdiction}
      />
    </div>
  )
}