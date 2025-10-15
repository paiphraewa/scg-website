// app/company-incorporation/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CompanyIncorporationForm } from '@/components/company-incorporation-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CompanyIncorporationPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [hasDraft, setHasDraft] = useState(false)
  const [draftData, setDraftData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  const onboardingIdParam = searchParams.get('onboardingId')
  const jurisdictionParam = searchParams.get('jurisdiction')

  useEffect(() => {
    const checkForDraft = async () => {
      if (status === 'loading') return
      
      if (!session) {
        console.log('🚫 No session, redirecting to login')
        router.push('/login')
        return
      }

      // If we already have URL params, we don't need to check for drafts
      if (onboardingIdParam) {
        console.log('📍 Has URL params, showing form directly')
        setLoading(false)
        return
      }

      try {
        console.log('🔍 Checking for existing drafts...')
        const response = await fetch('/api/company-incorporation/check-draft')
        const data = await response.json()
        
        console.log('📨 Draft check API response:', data)
        
        if (response.ok) {
          setHasDraft(data.hasDraft)
          setDraftData(data.draft)
          
          // If draft found but no URL params, redirect to show the draft
          if (data.hasDraft && data.draft && !redirecting) {
            console.log('🎯 Draft found, redirecting to:', data.draft.onboardingId)
            setRedirecting(true)
            router.push(`/company-incorporation?onboardingId=${data.draft.onboardingId}&jurisdiction=${data.draft.jurisdiction || 'BVI'}`)
            return
          }
          
          // If NO draft found and no URL params, redirect to client registration
          if (!data.hasDraft && !onboardingIdParam && !redirecting) {
            console.log('❌ No draft found, redirecting to client registration')
            setRedirecting(true)
            router.push('/client-register')
            return
          }
        } else {
          console.error('🚨 Draft check failed:', data.error)
        }
      } catch (error) {
        console.error('💥 Error checking draft:', error)
      } finally {
        setLoading(false)
      }
    }

    checkForDraft()
  }, [session, status, router, onboardingIdParam, redirecting])

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Checking for existing drafts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we have onboardingId in URL, show the form directly
  if (onboardingIdParam) {
    console.log('🎨 Rendering form with onboardingId:', onboardingIdParam)
    return (
      <div className="container mx-auto py-8">
        <CompanyIncorporationForm 
          onboardingId={onboardingIdParam}
          jurisdiction={jurisdictionParam}
        />
      </div>
    )
  }

  // If we're still here, something went wrong with redirects
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <p>Something went wrong with the redirect.</p>
            <div className="space-y-2 mt-4">
              <Button 
                onClick={() => window.location.href = `/company-incorporation?onboardingId=${draftData?.onboardingId}&jurisdiction=${draftData?.jurisdiction || 'BVI'}`}
                className="w-full"
              >
                Continue Your Draft (Force Redirect)
              </Button>
              <Button 
                onClick={() => router.push('/client-register')}
                variant="outline"
                className="w-full"
              >
                Start New Application
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}