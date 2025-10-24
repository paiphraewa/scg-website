// components/client-register-form.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { countries } from '@/lib/countries'

interface ClientRegisterFormProps {
  jurisdiction: string | null
}

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Information', required: true },
  { id: 'project', title: 'Project Information', required: true },
  { id: 'kyc', title: 'KYC Documents', required: false },
  { id: 'review', title: 'Review & Submit', required: true },
] as const

export function ClientRegisterForm({ jurisdiction }: ClientRegisterFormProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const effectiveJurisdiction = useMemo(
    () => jurisdiction || searchParams.get('jurisdiction'),
    [jurisdiction, searchParams]
  )

  // Step state
  const [currentStep, setCurrentStep] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    gender: '',
    phoneNumber: '',
    countryCode: '',
    expectedLength: 10,
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

  const phoneInvalid =
  formData.expectedLength &&
  String(formData.phoneNumber).replace(/\D/g, '').length !== formData.expectedLength

  // Files
  const [files, setFiles] = useState<{
    passportCopy: File | null
    proofOfAddress: File | null
    bankStatement: File | null
  }>({
    passportCopy: null,
    proofOfAddress: null,
    bankStatement: null,
  })

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auth guard → redirect to login with callback
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      const callbackUrl = effectiveJurisdiction
        ? `/client-register?jurisdiction=${effectiveJurisdiction}`
        : '/client-register'
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }, [session, status, router, effectiveJurisdiction])

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fl } = e.target
    if (fl && fl[0]) {
      setFiles(prev => ({ ...prev, [name]: fl[0] }))
    }
  }

  // Upload helper
  const uploadFile = async (file: File, documentType: string, onboardingId: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('documentType', documentType)
    fd.append('onboardingId', onboardingId)

    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`Failed to upload ${documentType}`)
    return res.json()
  }

  // Validation per-step
  const validateStep = (stepIdx: number) => {
    const id = FORM_STEPS[stepIdx].id
    switch (id) {
      case 'personal': {
        const required = [
          'gender',
          'countryCode',
          'phoneNumber',
          'personalEmail',
          'residentialAddress',
          'nationality',
          'passportNumber',
          'passportExpiryDate',
          'dateOfBirth',
          'taxResidency',
          'taxIdentificationNumber',
        ] as const

        // basic missing check (except phone length, we do below)
        const missing = required.filter((k) => !String((formData as any)[k] ?? '').trim())
        if (missing.length) {
          setError(`Please fill in all required fields: ${missing.join(', ')}`)
          return false
        }

        // phone length check (digits only)
        const digits = String(formData.phoneNumber).replace(/\D/g, '')
        const expected = Number(formData.expectedLength || 0)
        if (!expected || digits.length !== expected) {
          const selected = countries.find(c => c.phoneCode === formData.countryCode)
          const label = selected ? `${selected.name} (${selected.phoneCode})` : 'the selected country'
          setError(`Phone number must be exactly ${expected} digits for ${label}.`)
          return false
        }

        return true
      }

      case 'project': {
        const required = ['projectName', 'projectEmail'] as const
        const missing = required.filter((k) => !String((formData as any)[k] ?? '').trim())
        if (missing.length) {
          setError(`Please fill in all required fields: ${missing.join(', ')}`)
          return false
        }
        return true
      }
      case 'kyc':
        return true
      case 'review':
        return true
      default:
        return true
    }
  }


  const nextStep = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(s => s + 1)
      setError('')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1)
      setError('')
    }
  }

  // Submit (only on final step)
  const handleSubmit = async (source: 'button', e?: React.SyntheticEvent) => {
    // Only allow if called from our button on the Review step
    if (source !== 'button') return

    const REVIEW_INDEX = FORM_STEPS.findIndex(s => s.id === 'review')
    if (currentStep !== REVIEW_INDEX) return

    if (!validateStep(currentStep)) return
    if (isSubmitting) return

    setError('')
    setIsSubmitting(true)

    try {
      // Create Onboarding
      const res = await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit onboarding form')

      const onboardingId = data?.data?.id
      if (!onboardingId) throw new Error('No onboarding ID received from server')

      // Upload files (optional)
      const uploadJobs: Promise<any>[] = []
      if (files.passportCopy) uploadJobs.push(uploadFile(files.passportCopy, 'passportCopy', onboardingId))
      if (files.proofOfAddress) uploadJobs.push(uploadFile(files.proofOfAddress, 'proofOfAddress', onboardingId))
      if (files.bankStatement) uploadJobs.push(uploadFile(files.bankStatement, 'bankStatement', onboardingId))

      if (uploadJobs.length) {
        const uploaded = await Promise.all(uploadJobs)
        const filePaths = {
          passportCopy: uploaded.find(u => u.documentType === 'passportCopy')?.filePath || null,
          proofOfAddress: uploaded.find(u => u.documentType === 'proofOfAddress')?.filePath || null,
          bankStatement: uploaded.find(u => u.documentType === 'bankStatement')?.filePath || null,
        }

        // Patch onboarding with uploaded file paths (non-fatal if it fails)
        const patch = await fetch(`/api/client-onboarding/${onboardingId}/files`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filePaths),
        })
        if (!patch.ok) console.warn('Failed to update file paths, but form submission succeeded')
      }

      alert('Onboarding submitted successfully!')
      router.push('/success')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }


  // --- Prevent auto-submit unless user is on Review step ---
  const REVIEW_INDEX = FORM_STEPS.findIndex(s => s.id === 'review')

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    const isReview = currentStep === REVIEW_INDEX
    if (!isReview) {
      // Block accidental submits (e.g., hitting Enter on earlier steps)
      e.preventDefault()
      return
    }
    // Only submit on the Review step
    handleSubmit(e as any)
  }

  // Progress
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100
  const jurisdictionName = getJurisdictionName(effectiveJurisdiction)

  // Loading & auth states
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

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Client Onboarding - {jurisdictionName}</CardTitle>
        <CardDescription>
          Complete the form to onboard your client in {jurisdictionName}
        </CardDescription>

        {/* Progress */}
        <div className="space-y-2 mt-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {FORM_STEPS.length}</span>
            <span>{FORM_STEPS[currentStep].title}</span>
          </div>
        </div>

        {/* Step pills */}
        <div className="flex overflow-x-auto pb-2 gap-2 mt-2">
          {FORM_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={`flex-shrink-0 px-3 py-1 text-sm rounded-full border ${
                i === currentStep
                  ? 'bg-blue-600 text-white border-blue-600'
                  : i < currentStep
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => e.preventDefault()}  // 👈 block implicit submits
          onKeyDown={(e) => {
            const REVIEW_INDEX = FORM_STEPS.findIndex(s => s.id === 'review')
            if (e.key === 'Enter' && currentStep !== REVIEW_INDEX) e.preventDefault()
          }}
          className="space-y-8"
        >
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Step 1: Personal */}
          {currentStep === 0 && (
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
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <div className="flex gap-2">
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={formData.countryCode || ''}
                    onChange={(e) => {
                      const selected = countries.find(c => c.phoneCode === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        countryCode: e.target.value,
                        expectedLength: selected?.phoneLength || 10,
                      }))
                    }}
                    disabled={isSubmitting}
                    className="w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Code</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.phoneCode}>
                        {c.name} ({c.phoneCode})
                      </option>
                    ))}
                  </select>

                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '')
                      const expected = formData.expectedLength || 0

                      if (expected && digitsOnly.length > expected) {
                        // Optional: warn or prevent typing more
                        setError(`Phone number for this country must be exactly ${expected} digits.`)
                        return
                      }

                      setFormData(prev => ({ ...prev, phoneNumber: digitsOnly }))
                      if (error) setError('')
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Expected length: {formData.expectedLength || '—'} digits
                </p>
              </div>

              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail">Personal Email *</Label>
                <Input
                  type="email"
                  id="personalEmail"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  placeholder="Enter your personal email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="residentialAddress">Residential Address *</Label>
                <Input
                  id="residentialAddress"
                  name="residentialAddress"
                  value={formData.residentialAddress}
                  onChange={handleChange}
                  placeholder="Enter your residential address"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <select
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select your nationality</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportNumber">Passport Number *</Label>
                <Input
                  id="passportNumber"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  placeholder="Enter your passport number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passportExpiryDate">Passport Expiry Date *</Label>
                <Input
                  type="date"
                  id="passportExpiryDate"
                  name="passportExpiryDate"
                  value={formData.passportExpiryDate}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxResidency">Tax Residency *</Label>
                <select
                  id="taxResidency"
                  name="taxResidency"
                  value={formData.taxResidency}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select your tax residency</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
</select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxIdentificationNumber">Tax Identification Number *</Label>
                <Input
                  id="taxIdentificationNumber"
                  name="taxIdentificationNumber"
                  value={formData.taxIdentificationNumber}
                  onChange={handleChange}
                  placeholder="Enter your tax identification number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Step 2: Project */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Project Information</h3>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="Enter your project name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  If you’re incorporating for personal/investment purposes, you can use your personal name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectEmail">Your Official Project Email *</Label>
                <Input
                  type="email"
                  id="projectEmail"
                  name="projectEmail"
                  value={formData.projectEmail}
                  onChange={handleChange}
                  placeholder="example@domain.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  For multiple emails, separate with a comma and a space (e.g. a@x.com, b@y.com).
                </p>
              </div>
            </div>
          )}

          {/* Step 3: KYC */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">KYC Documents</h3>
              <p className="text-sm text-muted-foreground">
                Upload certified/notarised copies (dated within 3 months). We can help with certification if needed.
              </p>

              <div className="space-y-2">
                <Label htmlFor="passportCopy">01. Passport Copy</Label>
                <input
                  id="passportCopy"
                  name="passportCopy"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.passportCopy && (
                  <p className="text-xs text-green-600 mt-1">✓ Selected: {files.passportCopy.name}</p>
                )}
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
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.proofOfAddress && (
                  <p className="text-xs text-green-600 mt-1">✓ Selected: {files.proofOfAddress.name}</p>
                )}
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
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.bankStatement && (
                  <p className="text-xs text-green-600 mt-1">✓ Selected: {files.bankStatement.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review & Submit</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Personal</h4>
                  <SummaryRow label="Gender" value={formData.gender} />
                  <SummaryRow label="Phone" value={ formData.countryCode
                        ? `${formData.countryCode} ${formData.phoneNumber}`
                        : formData.phoneNumber
                    }
                  />
                  <SummaryRow label="Personal Email" value={formData.personalEmail} />
                  <SummaryRow label="Address" value={formData.residentialAddress} />
                  <SummaryRow label="Nationality" value={formData.nationality} />
                  <SummaryRow label="Passport #" value={formData.passportNumber} />
                  <SummaryRow label="Passport Expiry" value={formData.passportExpiryDate} />
                  <SummaryRow label="Date of Birth" value={formData.dateOfBirth} />
                  <SummaryRow label="Tax Residency" value={formData.taxResidency} />
                  <SummaryRow label="Tax ID" value={formData.taxIdentificationNumber} />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Project</h4>
                  <SummaryRow label="Project Name" value={formData.projectName} />
                  <SummaryRow label="Project Email" value={formData.projectEmail} />

                  <h4 className="font-medium mt-6">KYC Files</h4>
                  <SummaryRow label="Passport Copy" value={files.passportCopy?.name || '—'} />
                  <SummaryRow label="Proof of Address" value={files.proofOfAddress?.name || '—'} />
                  <SummaryRow label="Bank Statement" value={files.bankStatement?.name || '—'} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Make sure everything looks good. You can go back to edit before submitting.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t">
            {currentStep > 0 && (
              <Button type="button" onClick={prevStep} variant="outline">
                Previous
              </Button>
            )}

            <div className="ml-auto flex gap-4">
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={isSubmitting || phoneInvalid}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit('button', e)}
                  disabled={isSubmitting || phoneInvalid}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Onboarding Form'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{value || '—'}</span>
    </div>
  )
}

// Helper function to get jurisdiction display name
function getJurisdictionName(jurisdictionCode: string | null): string {
  if (!jurisdictionCode) return 'Company'
  const jurisdictions: Record<string, string> = {
    bvi: 'British Virgin Islands (BVI)',
    cayman: 'Cayman Islands',
    hongkong: 'Hong Kong',
    singapore: 'Singapore',
    panama: 'Panama',
    BVI: 'British Virgin Islands (BVI)',
    KY: 'Cayman Islands',
    HK: 'Hong Kong',
    SG: 'Singapore',
    PA: 'Panama',
  }
  return jurisdictions[jurisdictionCode] || jurisdictionCode
}
