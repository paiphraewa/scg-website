// components/admin-onboarding-view.tsx
'use client'

import { useState, useEffect } from 'react'
import { FileViewer } from './file-viewer'

interface OnboardingData {
  id: string
  projectName: string
  personalEmail: string
  passportCopy: string | null
  proofOfAddress: string | null
  bankStatement: string | null
  status: string
  createdAt: string
}

export function AdminOnboardingView() {
  const [onboardings, setOnboardings] = useState<OnboardingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOnboardings()
  }, [])

  const fetchOnboardings = async () => {
    try {
      const response = await fetch('/api/client-onboarding')
      const data = await response.json()
      if (data.success) {
        setOnboardings(data.data)
      }
    } catch (error) {
      console.error('Error fetching onboardings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Client Onboarding Submissions</h2>
      
      {onboardings.map((onboarding) => (
        <div key={onboarding.id} className="border rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{onboarding.projectName}</h3>
              <p className="text-gray-600">{onboarding.personalEmail}</p>
              <p className="text-sm text-gray-500">
                Submitted: {new Date(onboarding.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              onboarding.status === 'PENDING' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {onboarding.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onboarding.passportCopy && (
              <FileViewer
                filePath={onboarding.passportCopy}
                fileName="passport.pdf"
                documentType="passportCopy"
              />
            )}
            {onboarding.proofOfAddress && (
              <FileViewer
                filePath={onboarding.proofOfAddress}
                fileName="proof_of_address.pdf"
                documentType="proofOfAddress"
              />
            )}
            {onboarding.bankStatement && (
              <FileViewer
                filePath={onboarding.bankStatement}
                fileName="bank_statement.pdf"
                documentType="bankStatement"
              />
            )}
          </div>

          {!onboarding.passportCopy && !onboarding.proofOfAddress && !onboarding.bankStatement && (
            <p className="text-gray-500 italic">No files uploaded</p>
          )}
        </div>
      ))}
    </div>
  )
}