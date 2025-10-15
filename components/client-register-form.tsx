// components/client-register-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ClientRegisterFormProps {
  jurisdiction: string | null
}

export function ClientRegisterForm({ jurisdiction }: ClientRegisterFormProps) {
  const [formData, setFormData] = useState({
    // Personal Information
    gender: '',
    phoneNumber: '',
    personalEmail: '',
    residentialAddress: '',
    nationality: '',
    passportNumber: '',
    passportExpiryDate: '',
    dateOfBirth: '',
    taxResidency: '',
    taxIdentificationNumber: '',
    
    // Project Information
    projectName: '',
    projectEmail: '',
  })

  const [files, setFiles] = useState({
    passportCopy: null as File | null,
    proofOfAddress: null as File | null,
    bankStatement: null as File | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get jurisdiction from props OR URL search params
  const effectiveJurisdiction = jurisdiction || searchParams.get('jurisdiction')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      const callbackUrl = effectiveJurisdiction 
        ? `/client-register?jurisdiction=${effectiveJurisdiction}`
        : '/client-register'
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }, [session, status, router, effectiveJurisdiction])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (error) setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }))
    }
  }

  // Helper function to upload files
  const uploadFile = async (file: File, documentType: string, onboardingId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    formData.append('onboardingId', onboardingId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload ${documentType}`)
    }

    return response.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (status === 'loading') return
      if (!session) {
        const callbackUrl = effectiveJurisdiction 
          ? `/client-register?jurisdiction=${effectiveJurisdiction}`
          : '/client-register'
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }

      // Validate required fields
      const requiredFields = {
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        personalEmail: formData.personalEmail,
        residentialAddress: formData.residentialAddress,
        nationality: formData.nationality,
        passportNumber: formData.passportNumber,
        passportExpiryDate: formData.passportExpiryDate,
        dateOfBirth: formData.dateOfBirth,
        taxResidency: formData.taxResidency,
        taxIdentificationNumber: formData.taxIdentificationNumber,
        projectName: formData.projectName,
        projectEmail: formData.projectEmail,
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key)

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
        return
      }

      // First, submit the form data to create the onboarding record
      console.log('Submitting form data...')
      const response = await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit onboarding form')
      }

      // ✅ CORRECTLY ACCESS onboardingId from the response
      const onboardingId = data.data.id
      console.log('Onboarding created with ID:', onboardingId)

      if (!onboardingId) {
        throw new Error('No onboarding ID received from server')
      }

      // Then, upload files if any
      if (files.passportCopy || files.proofOfAddress || files.bankStatement) {
        console.log('Starting file uploads...')
        const uploadPromises = []

        if (files.passportCopy) {
          console.log('Uploading passport copy...')
          uploadPromises.push(uploadFile(files.passportCopy, 'passportCopy', onboardingId))
        }
        if (files.proofOfAddress) {
          console.log('Uploading proof of address...')
          uploadPromises.push(uploadFile(files.proofOfAddress, 'proofOfAddress', onboardingId))
        }
        if (files.bankStatement) {
          console.log('Uploading bank statement...')
          uploadPromises.push(uploadFile(files.bankStatement, 'bankStatement', onboardingId))
        }

        // Wait for all uploads to complete
        if (uploadPromises.length > 0) {
          const uploadResults = await Promise.all(uploadPromises)
          console.log('All uploads completed:', uploadResults)
          
          // Update the onboarding record with file paths
          const filePaths = {
            passportCopy: uploadResults.find(r => r.documentType === 'passportCopy')?.filePath || null,
            proofOfAddress: uploadResults.find(r => r.documentType === 'proofOfAddress')?.filePath || null,
            bankStatement: uploadResults.find(r => r.documentType === 'bankStatement')?.filePath || null,
          }

          // Update the onboarding record with file paths
          const updateResponse = await fetch(`/api/client-onboarding/${onboardingId}/files`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(filePaths),
          })

          if (!updateResponse.ok) {
            console.warn('Failed to update file paths, but form was submitted successfully')
          }
        }
      } else {
        console.log('No files to upload')
      }

      alert('Onboarding submitted successfully!')
      console.log('Redirecting to company incorporation form...')
      
      // ✅ REDIRECT TO COMPANY INCORPORATION WITH onboardingId (Step 6)
      router.push(`/company-incorporation?onboardingId=${onboardingId}&jurisdiction=${effectiveJurisdiction}`)

    } catch (error) {
      console.error('Form submission error:', error)
      setError(error instanceof Error ? error.message : 'Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <p>Redirecting to login...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const jurisdictionName = getJurisdictionName(effectiveJurisdiction)

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Client Onboarding - {jurisdictionName}</CardTitle>
        <CardDescription>
          Complete the form to onboard your client in {jurisdictionName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (including area code) *</Label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 8888 8888"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email *</Label>
              <input
                type="email"
                id="personalEmail"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                placeholder="Enter your personal email"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialAddress">Residential Address *</Label>
              <input
                type="text"
                id="residentialAddress"
                name="residentialAddress"
                value={formData.residentialAddress}
                onChange={handleChange}
                placeholder="Enter your residential address"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <input
                type="text"
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Enter your nationality"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Passport Number *</Label>
              <input
                type="text"
                id="passportNumber"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                placeholder="Enter your passport number"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passportExpiryDate">Passport Expiry Date *</Label>
              <input
                type="date"
                id="passportExpiryDate"
                name="passportExpiryDate"
                value={formData.passportExpiryDate}
                onChange={handleChange}
                placeholder="dd/mm/yyyy"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                placeholder="dd/mm/yyyy"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxResidency">Tax Residency *</Label>
              <input
                type="text"
                id="taxResidency"
                name="taxResidency"
                value={formData.taxResidency}
                onChange={handleChange}
                placeholder="Enter your tax residency"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="taxIdentificationNumber">Tax Identification Number *</Label>
              <input
                type="text"
                id="taxIdentificationNumber"
                name="taxIdentificationNumber"
                value={formData.taxIdentificationNumber}
                onChange={handleChange}
                placeholder="Enter your tax identification number"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Project Information Section */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <input
                type="text"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="Enter your project name"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-sm text-muted-foreground">
                Please insert your project name. If you are looking to create an entity for personal use, e.g. for investment vehicle purposes, please insert your personal name.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectEmail">Your Official Project Email *</Label>
              <input
                type="email"
                id="projectEmail"
                name="projectEmail"
                value={formData.projectEmail}
                onChange={handleChange}
                placeholder="example@domain.com"
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-sm text-muted-foreground">
                For multiple email addresses, separate them with a comma and a space (e.g., example1@domain.com, example2@domain.com). Please insert your personal email if there is no project.
              </p>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">KYC Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide us with a certified or notarised copy of each project founder&apos;s / shareholder&apos;s / director&apos;s (01) passport, (02) proof of address (dated within 3 months from today&apos;s date) and (03) bank statement (dated within 3 months from today&apos;s date).
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Note: We can assist with the certification process if you do not have a lawyer readily available for this process.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passportCopy">01. Passport Copy</Label>
                <input
                  id="passportCopy"
                  name="passportCopy"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-muted-foreground">(certified or notarised copy)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proofOfAddress">02. Proof of Address</Label>
                <input
                  id="proofOfAddress"
                  name="proofOfAddress"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-muted-foreground">(certified or notarised copy dated within 3 months)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankStatement">03. Bank Statement Copy</Label>
                <input
                  id="bankStatement"
                  name="bankStatement"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-muted-foreground">
                  Bank statement to reflect the address in 02. (certified or notarised copy dated within 3 months)
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Proceed to Company Incorporation Form'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Helper function to get jurisdiction display name
function getJurisdictionName(jurisdictionCode: string | null): string {
  if (!jurisdictionCode) return 'Company'
  
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
  
  return jurisdictions[jurisdictionCode] || jurisdictionCode
}