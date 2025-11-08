// components/company-incorporation-form.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { countries } from '@/lib/countries'

function SummaryRow({ label, value }: { label: string; value?: string | number | boolean }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{(value ?? value === 0) ? String(value) : '—'}</span>
    </div>
  )
}

function toArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value
  if (value && Array.isArray(value.list)) return value.list
  return []
}

function orObject<T extends object>(value: any, fallback: T): T {
  return (value && typeof value === 'object') ? value : fallback
}

function norm(s: string) {
  return (s || '').trim().toLowerCase()
}

interface CompanyIncorporationFormProps {
  onboardingId: string
  jurisdiction: string | null
}

interface CompanyName {
  firstPreference: string
  secondPreference: string
  thirdPreference: string
  chosenEnding: string
}

interface Shareholder {
  id: number
  fullName: string
  sharesPercentage: string
  address: string
}

interface Director {
  id: number
  fullName: string
  isShareholder: boolean
  selectedShareholderId: number | null
}

interface RelevantIndividual {
  id: number
  isUBO: boolean
  isShareholder: boolean
  isDirector: boolean
  sharesToBeIssued: string
  dateOfBirth: string
  lastName: string
  firstName: string
  passportNumber: string
  nationality: string
  occupation: string
  companyName: string
  companyNumber: string
  physicalAddress: string
  city: string
  state: string
  country: string
  zipCode: string
  isUSCitizen: boolean
  tin: string
  citizenshipCountry: string
  isPoliticallyExposed: boolean
  pepDetails: string
}

interface Declaration {
  authorizedToInstruct: boolean
  authorizedInstructorsDetails: string
  pepDetailsAdditional: string
  completedByName: string
  signature: string
  signatureType: 'drawn' | 'uploaded' | null
  signatureFile?: File | null
  signatureDataUrl?: string
  signatureFileName?: string
  declarationDate: string
  signedAt: string
  ipAddress: string
  userAgent: string
}

// Define steps for the wizard
const FORM_STEPS = [
  { id: 'company-name', title: 'Company Name', required: true },
  { id: 'purpose', title: 'Purpose', required: true },
  { id: 'shareholders', title: 'Shareholders', required: true },
  { id: 'directors', title: 'Directors', required: true },
  { id: 'geography', title: 'Geography', required: false },
  { id: 'share-capital', title: 'Share Capital', required: true },
  { id: 'seals', title: 'Seals', required: true },
  { id: 'individuals', title: 'Individuals', required: false },
  { id: 'source-funds', title: 'Source of Funds', required: true },
  { id: 'records', title: 'Records Location', required: true },
  { id: 'declaration', title: 'Declaration', required: true },
  { id: 'review', title: 'Review & Submit', required: true },
]

function SearchableCountrySelect({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a country",
  showPhoneCode = false,
  hideLabel = false,
  className = "",
}: {
  label: string
  value: string
  onChange: (newVal: string, meta?: { phoneCode?: string; phoneLength?: number }) => void
  disabled?: boolean
  placeholder?: string
  showPhoneCode?: boolean
  hideLabel?: boolean
  className?: string
}) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.code.toLowerCase().includes(query.toLowerCase()) ||
    (c.phoneCode && c.phoneCode.toLowerCase().includes(query.toLowerCase()))
  )

  const selected = showPhoneCode
    ? countries.find((c) => c.phoneCode === value)
    : countries.find((c) => c.name === value)

  return (
    <div className={`space-y-2 relative w-full ${className}`}>
      {!hideLabel && <Label>{label}</Label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className="relative flex h-10 w-full items-center rounded-md border border-input bg-background 
                   px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex-1 text-left truncate">
          {selected
            ? showPhoneCode
              ? `${selected.name} (${selected.phoneCode})`
              : selected.name
            : placeholder}
        </span>
        <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b border-border bg-popover px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            placeholder="Search..."
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  if (showPhoneCode) {
                    onChange(c.phoneCode, {
                      phoneCode: c.phoneCode,
                      phoneLength: c.phoneLength,
                    })
                  } else {
                    onChange(c.name)
                  }
                  setIsOpen(false)
                  setQuery("")
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CompanyIncorporationForm({ onboardingId, jurisdiction }: CompanyIncorporationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    companyNames: {
      firstPreference: '',
      secondPreference: '',
      thirdPreference: '',
      chosenEnding: ''
    } as CompanyName,
    purposeOfCompany: '',
    requiresNomineeShareholder: false, 
    shareholders: [] as Shareholder[],
    requiresNomineeDirector: false,
    directors: [] as Director[],
    geographicProfile: '',
    authorizedShares: '50000',
    sharesParValue: '1.00',
    currency: 'USD',
    customShares: '',
    customParValue: '',
    complexStructureNotes: '',
    orderSeal: true,
    sealQuantity: '1',
    relevantIndividuals: [] as RelevantIndividual[],
    sourceOfFunds: {
      totalAmount: '',
      compositionDetails: '',
      needsRegisteredOffice: false,
      officeLocation: '',
    },
    recordsLocation: {
      registersLocation: '',
      registersMaintainedBy: '',
      financialRecordsLocation: '',
      financialRecordsMaintainedBy: ''
    },
    declaration: {
    authorizedToInstruct: false,
    authorizedInstructorsDetails: '',
    pepDetailsAdditional: '',
    completedByName: '',
    signature: '',
    signatureType: null as 'drawn' | 'uploaded' | null,
    signatureFile: null as File | null,
    signatureDataUrl: '',
    signatureFileName: '',
    declarationDate: '',
    signedAt: '',
    ipAddress: '',
    userAgent: '',
    },
    signedAt: '',
    onboardingId,
  })

  const { status } = useSession()

  const lastSentFirstPrefRef = useRef<string>('')

  useEffect(() => {
      // 1) Do nothing until the user is logged in
      if (status !== 'authenticated') return

      const firstPref = formData?.companyNames?.firstPreference || ''
      const changed = norm(firstPref) !== norm(lastSentFirstPrefRef.current)

      // 2) Must have an onboardingId (server validates and links the draft)
      if (!onboardingId) {
        if (firstPref.trim()) {
          console.warn('[debounce] No onboardingId yet; skipping save for firstPref:', firstPref)
        }
        return
      }

      // 3) Don’t hit the API if empty or unchanged
      if (!firstPref.trim() || !changed) return

      const t = setTimeout(async () => {
        try {
          const res = await fetch('/api/company-incorporation/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              onboardingId,
              status: 'draft',
              jurisdiction: jurisdiction || 'BVI',
              companyNames: {
                ...formData.companyNames,
                firstPreference: firstPref,
              },
            }),
          })

          // helpful diagnostics while you test
          console.log('[debounce] status:', res.status, res.statusText)
          console.log('[debounce] content-type:', res.headers.get('content-type') || 'n/a')

          // some infra might still deliver HTML on error—defensively parse
          let payload: any = null
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            payload = await res.json().catch(() => ({}))
          } else {
            const text = await res.text().catch(() => '')
            console.log('[debounce] non-JSON response payload:', text.slice(0, 300))
          }

          if (!res.ok || !payload?.ok) {
            console.error('[debounce] draft save failed. Payload:', payload)
            return
          }

          console.log('[debounce] draft save OK:', payload)
          lastSentFirstPrefRef.current = firstPref
        } catch (err) {
          console.error('[debounce] network error saving firstPref:', err)
        }
      }, 600)

      return () => clearTimeout(t)
    }, [
      status,                                 
      formData?.companyNames?.firstPreference,
      onboardingId,
      jurisdiction,
    ])


  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasAdditionalIndividuals, setHasAdditionalIndividuals] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload' | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string>('')

  // Load draft data when component mounts
  useEffect(() => {
    const loadDraft = async () => {
      if (!onboardingId) return
      
      setIsLoadingDraft(true)
      try {
        // Use the draft endpoint with query parameter
        const response = await fetch(
          `/api/company-incorporation/draft?onboardingId=${onboardingId}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        )
        if (response.ok) {
          const draftData = await response.json()
          if (draftData) {
            setFormData(prev => ({
              ...prev,

              // arrays → ensure arrays
              shareholders: toArray(draftData.shareholders),
              directors: toArray(draftData.directors),
              relevantIndividuals: toArray(draftData.relevantIndividuals),

              // objects → ensure shape
              companyNames: orObject(draftData.companyNames, {
                firstPreference: '', secondPreference: '', thirdPreference: '', chosenEnding: ''
              }),
              sourceOfFunds: orObject(draftData.sourceOfFunds, { totalAmount: '', compositionDetails: '', needsRegisteredOffice: false, officeLocation: '', }),
              recordsLocation: orObject(draftData.recordsLocation, {
                registersLocation: '', registersMaintainedBy: '',
                financialRecordsLocation: '', financialRecordsMaintainedBy: ''
              }),
              declaration: orObject(draftData.declaration, {
                authorizedToInstruct: false,
                authorizedInstructorsDetails: '',
                pepDetailsAdditional: '',
                completedByName: '',
                signature: '',
                signatureType: null,
                signatureFile: null,
                signatureDataUrl: '',
                signatureFileName: '',
                declarationDate: '',
                signedAt: '',
                ipAddress: '',
                userAgent: ''
              }),

              // simple fields with fallbacks
              requiresNomineeShareholder: Boolean(draftData.requiresNomineeShareholder),
              requiresNomineeDirector: Boolean(draftData.requiresNomineeDirector),
              purposeOfCompany: draftData.purposeOfCompany ?? prev.purposeOfCompany,
              geographicProfile: draftData.geographicProfile ?? prev.geographicProfile,
              authorizedShares: draftData.authorizedShares ?? prev.authorizedShares,
              sharesParValue: draftData.sharesParValue ?? prev.sharesParValue,
              currency: draftData.currency ?? prev.currency,
              customShares: draftData.customShares ?? prev.customShares,
              customParValue: draftData.customParValue ?? prev.customParValue,
              complexStructureNotes: draftData.complexStructureNotes ?? prev.complexStructureNotes,
              orderSeal: draftData.orderSeal ?? prev.orderSeal,
              sealQuantity: draftData.sealQuantity ?? prev.sealQuantity,
            }))
          
            // Load signature data from individual columns
            if (draftData.signatureType) {
              setFormData(prev => ({
                ...prev,
                declaration: {
                  ...prev.declaration,
                  signatureType: draftData.signatureType,
                  signature: draftData.signatureFilePath,
                  signatureFileName: draftData.signatureFileName,
                  completedByName: draftData.completedByName,
                  signedAt: draftData.signedAt,
                  ipAddress: draftData.ipAddress,
                  userAgent: draftData.userAgent
                }
              }))
            }
            
            setSuccess('Draft loaded successfully!')
            setTimeout(() => setSuccess(''), 3000)
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      } finally {
        setIsLoadingDraft(false)
      }
    }

    loadDraft()
  }, [onboardingId])

  const lastSavedFirstPrefRef = useRef<string>('')

  const saveDraft = async () => {
    setIsSavingDraft(true)
    setError('')

    try {
      const normalizedData = {
        ...formData,
        shareholders: Array.isArray(formData.shareholders)
          ? formData.shareholders
          : toArray(formData.shareholders),
        directors: Array.isArray(formData.directors)
          ? formData.directors
          : toArray(formData.directors),
        relevantIndividuals: Array.isArray(formData.relevantIndividuals)
          ? formData.relevantIndividuals
          : toArray(formData.relevantIndividuals),
      }

      const draftData = {
        ...normalizedData,
        completedByName: formData.declaration.completedByName,
        signatureType: formData.declaration.signatureType,
        signatureFilePath: formData.declaration.signature,
        signatureFileName: formData.declaration.signatureFileName,
        signedAt: formData.declaration.signedAt || null,
        ipAddress: formData.declaration.ipAddress || null,
        userAgent: formData.declaration.userAgent || null,
      }

      if (!onboardingId || !jurisdiction) {
        console.warn('Missing onboardingId or jurisdiction')
        return
      }

      const response = await fetch('/api/company-incorporation/draft', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingId,                    // 👈 from props
          jurisdiction: jurisdiction || 'BVI',
          status: 'draft',
          ...normalizedData,
          // flatten declaration so your API can store in columns
          completedByName: formData.declaration.completedByName,
          signatureType: formData.declaration.signatureType,
          signatureFilePath: formData.declaration.signature,
          signatureFileName: formData.declaration.signatureFileName,
          signedAt: formData.declaration.signedAt || null,
          ipAddress: formData.declaration.ipAddress || null,
          userAgent: formData.declaration.userAgent || null,
        }),
      })

      const json = await response.json().catch(() => null)

      if (response.ok) {
        if (json?.data?.signedAt) {
          setFormData(prev => ({
            ...prev,
            declaration: {
              ...prev.declaration,
              signedAt: json.data.signedAt,
            },
          }))
        }
        setSuccess('Draft saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        console.error('Draft save failed:', json)
        setError(json?.error || 'Failed to save draft')
      }
    } catch (err) {
      console.error('Error saving draft:', err)
      setError('Error saving draft. Please try again.')
    } finally {
      setIsSavingDraft(false)
    }
  }



  // --- Debounce-save when firstPreference changes ---
  useEffect(() => {
    const current = formData.companyNames?.firstPreference || ''
    const prev = lastSavedFirstPrefRef.current

    // Skip if empty or unchanged (case/space-insensitive)
    if (!current.trim() || norm(current) === norm(prev)) return

    // Debounce 600ms
    const t = setTimeout(async () => {
      try {
        await saveDraft()
        // on successful save, remember what we saved
        lastSavedFirstPrefRef.current = current
      } catch {
        // ignore – saveDraft already handles UI errors
      }
    }, 600)

    return () => clearTimeout(t)
  }, [formData.companyNames.firstPreference])  // <-- ONLY firstPreference triggers this

  // Auto-save draft when form changes
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (Object.values(formData).some(value => {
        if (typeof value === 'object') {
          return Object.values(value).some(subValue => subValue !== '')
        }
        return value !== ''
      })) {
        saveDraft()
      }
    }, 5000)

    return () => clearTimeout(autoSave)
  }, [formData, onboardingId, jurisdiction])

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
        setError('')
      }
    } else {
      setError(`Please complete all required fields in the ${FORM_STEPS[currentStep].title} section`)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setError('')
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
    setError('')
  }

  // Validation for current step
  const validateCurrentStep = () => {
    const currentStepConfig = FORM_STEPS[currentStep]
    
    if (!currentStepConfig.required) return true

    switch (currentStepConfig.id) {
      case 'company-name':
        return formData.companyNames.firstPreference && formData.companyNames.chosenEnding
      case 'purpose':
        return formData.purposeOfCompany.trim().length > 0
      case 'shareholders':
        if (formData.requiresNomineeShareholder) {
          return true // Valid if they choose nominee
        }
      // If no nominee, must have shareholders and total must be 100%
        return formData.shareholders.length > 0 && 
             formData.shareholders.every(sh => sh.fullName && sh.sharesPercentage && sh.address) &&
             getTotalSharesPercentage() === 100
      case 'directors':
        if (formData.requiresNomineeDirector) {
          return true // Valid if they choose nominee
        }
        // If no nominee, must have at least one director with name
        return formData.directors.length > 0 && 
              formData.directors.every(dir => dir.fullName)      
      case 'share-capital':
        return formData.authorizedShares === '50000' || 
               (formData.authorizedShares === 'custom' && formData.customShares && formData.customParValue)
      case 'seals':
        return true // Always valid since it has default values
      case 'source-funds': {
        const { totalAmount, compositionDetails, needsRegisteredOffice, officeLocation } =
          formData.sourceOfFunds
        const hasBase = Boolean(totalAmount?.trim() && compositionDetails?.trim())
        const hasOfficeOk = needsRegisteredOffice ? true : Boolean(officeLocation?.trim())
        return hasBase && hasOfficeOk}
      case 'records':
        return formData.recordsLocation.registersLocation && 
               formData.recordsLocation.registersMaintainedBy &&
               formData.recordsLocation.financialRecordsLocation &&
               formData.recordsLocation.financialRecordsMaintainedBy
      case 'declaration':
        return formData.declaration.completedByName && 
               formData.declaration.signature
      default:
        return true
    }
  }

    // Add shareholder functions
  const addShareholder = () => {
    setFormData(prev => ({
      ...prev,
      shareholders: [
        ...prev.shareholders,
        {
          id: prev.shareholders.length + 1,
          fullName: '',
          sharesPercentage: '',
          address: ''
        }
      ]
    }))
  }

  const removeShareholder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index)
    }))
  }

  const handleShareholderChange = (index: number, field: keyof Shareholder, value: string) => {
    setFormData(prev => ({
      ...prev,
      shareholders: prev.shareholders.map((shareholder, i) => 
        i === index ? { ...shareholder, [field]: value } : shareholder
      )
    }))
  }

  const getTotalSharesPercentage = () => {
    return formData.shareholders.reduce((total, shareholder) => {
      return total + (parseFloat(shareholder.sharesPercentage) || 0)
    }, 0)
  }

  const addDirector = () => {
    setFormData(prev => ({
      ...prev,
      directors: [
        ...prev.directors,
        {
          id: Date.now(),
          fullName: '',
          isShareholder: false,
          selectedShareholderId: null
        }
      ]
    }))
  }

  const removeDirector = (index: number) => {
    setFormData(prev => ({
      ...prev,
      directors: prev.directors.filter((_, i) => i !== index)
    }))
  }

  const handleDirectorChange = (index: number, field: keyof Director, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      directors: prev.directors.map((director, i) => 
        i === index ? { ...director, [field]: value } : director
      )
    }))
  }  


  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef) return
    
    const canvas = canvasRef
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef) return

    const canvas = canvasRef
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
  if (!canvasRef) return
  
  const canvas = canvasRef
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.closePath()
    setIsDrawing(false)
    
    // Update signature preview
    const dataUrl = canvas.toDataURL()
    setSignaturePreview(dataUrl)
  }

  const clearSignature = () => {
    if (!canvasRef) return
    
    const canvas = canvasRef
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignaturePreview('')
    setFormData(prev => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        signatureType: null,
        signatureDataUrl: '',
        signature: ''
      }
    }))
    setSignatureMethod(null)
  }

  async function saveDrawnSignature() {
    if (!canvasRef) return

    const onboardingId =
      formData?.onboardingId ||
      searchParams.get('onboardingId') ||
      ''

    if (!onboardingId) {
      setError('Missing onboardingId; cannot upload signature yet.')
      return
    }

    // Convert the canvas to a real PNG Blob (more reliable than fetch(dataURL))
    const blob: Blob | null = await new Promise((resolve) =>
      canvasRef.toBlob((b) => resolve(b), 'image/png')
    )
    if (!blob) {
      setError('Could not read signature from canvas. Please draw again.')
      return
    }

    // Make a File so FormData carries a filename + type
    const file = new File([blob], 'signature.png', { type: 'image/png' })

    try {
      const filePath = await uploadSignatureFile(onboardingId, file)

      // Keep a dataURL preview for the UI only
      const reader = new FileReader()
      reader.onload = () => setSignaturePreview(String(reader.result || ''))
      reader.readAsDataURL(file)

      setFormData(prev => ({
        ...prev,
        declaration: {
          ...prev.declaration,
          signatureType: 'drawn',
          signature: filePath,                          // use the returned path/url
          signatureFileName: 'signature.png',
          signatureDataUrl: '',                         // optional, we keep preview separately
        },
        signedAt: prev.signedAt || new Date().toISOString(),
      }))
      setSignatureMethod(null)
    } catch (err: any) {
      console.error('signature upload error:', err)
      setError(err?.message || 'Failed to upload signature')
    }
  }


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF) or PDF')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setFormData(prev => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        signatureType: 'uploaded',
        signatureFile: file,
        signature: `Uploaded signature - ${file.name}`,
        signatureFileName: file.name
      }
    }))

  // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSignaturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setSignaturePreview('') // No preview for PDFs
    }
  }

  const removeUploadedSignature = () => {
    setFormData(prev => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        signatureType: null,
        signatureFile: null,
        signature: '',
        signatureFileName: ''
      }
    }))
    setSignaturePreview('')
    setSignatureMethod(null)
    // Reset file input
    const fileInput = document.getElementById('signatureUpload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCompanyNameChange = (field: keyof CompanyName, value: string) => {
    setFormData(prev => ({
      ...prev,
      companyNames: {
        ...prev.companyNames,
        [field]: value
      }
    }))
  }

  const handleIndividualChange = (index: number, field: keyof RelevantIndividual, value: any) => {
    setFormData(prev => ({
      ...prev,
      relevantIndividuals: prev.relevantIndividuals.map((individual, i) => 
        i === index ? { ...individual, [field]: value } : individual
      )
    }))
  }

  const handleCheckboxChange = (index: number, field: 'isUBO' | 'isShareholder' | 'isDirector' | 'isUSCitizen' | 'isPoliticallyExposed', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      relevantIndividuals: prev.relevantIndividuals.map((individual, i) => 
        i === index ? { ...individual, [field]: checked } : individual
      )
    }))
  }

  const handleSourceOfFundsChange = (field: keyof typeof formData.sourceOfFunds, value: string) => {
    setFormData(prev => ({
      ...prev,
      sourceOfFunds: {
        ...prev.sourceOfFunds,
        [field]: value
      }
    }))
  }

  const handleRecordsLocationChange = (field: keyof typeof formData.recordsLocation, value: string) => {
    setFormData(prev => ({
      ...prev,
      recordsLocation: {
        ...prev.recordsLocation,
        [field]: value
      }
    }))
  }

  const handleDeclarationChange = (field: keyof typeof formData.declaration, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      declaration: {
        ...prev.declaration,
        [field]: value
      }
    }))
  }

  async function uploadSignatureFile(onboardingId: string, file: File) {
    const fd = new FormData()
    fd.append('file', file, file.name)
    fd.append('documentType', 'signature')
    fd.append('onboardingId', onboardingId)

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })

    const json = await uploadRes.json().catch(() => ({}))
    if (!uploadRes.ok) {
      throw new Error(json?.error || 'Failed to upload signature')
    }

    // In your route you return { filePath, fileName, ... }
    return (json.filePath as string) || ''
  }


  const addRelevantIndividual = () => {
    setFormData(prev => ({
      ...prev,
      relevantIndividuals: [
        ...prev.relevantIndividuals,
        {
          id: prev.relevantIndividuals.length + 1,
          isUBO: false,
          isShareholder: false,
          isDirector: false,
          sharesToBeIssued: '',
          dateOfBirth: '',
          lastName: '',
          firstName: '',
          passportNumber: '',
          nationality: '',
          occupation: '',
          companyName: '',
          companyNumber: '',
          physicalAddress: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
          isUSCitizen: false,
          tin: '',
          citizenshipCountry: '',
          isPoliticallyExposed: false,
          pepDetails: ''
        }
      ]
    }))
  }

  const removeRelevantIndividual = (index: number) => {
    setFormData(prev => ({
      ...prev,
      relevantIndividuals: prev.relevantIndividuals.filter((_, i) => i !== index)
    }))
  }

  const toggleAdditionalIndividuals = (hasIndividuals: boolean) => {
    setHasAdditionalIndividuals(hasIndividuals)
    if (hasIndividuals && formData.relevantIndividuals.length === 0) {
      addRelevantIndividual()
    } else if (!hasIndividuals) {
      setFormData(prev => ({
        ...prev,
        relevantIndividuals: []
      }))
    }
  }

  const handleSubmit = async (source: 'button', e?: React.SyntheticEvent) => {
    // Only allow if the call came from our Submit button
    if (source !== 'button') return;
    e?.preventDefault();

    // Must be on Review step
    const REVIEW_INDEX = FORM_STEPS.findIndex(s => s.id === 'review');
    if (currentStep !== REVIEW_INDEX) return;

    // Validate current step if required
    if (FORM_STEPS[currentStep]?.required && !validateCurrentStep()) {
      setError(`Please complete all required fields in ${FORM_STEPS[currentStep].title} section`);
      return;
    }

    // Require signature
    if (!formData.declaration.signatureType) {
      setError('Please provide your signature using either drawing pad or file upload');
      return;
    }

    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    try {
      const normalizedData = {
        ...formData,
        shareholders: Array.isArray(formData.shareholders) ? formData.shareholders : toArray(formData.shareholders),
        directors: Array.isArray(formData.directors) ? formData.directors : toArray(formData.directors),
        relevantIndividuals: Array.isArray(formData.relevantIndividuals) ? formData.relevantIndividuals : toArray(formData.relevantIndividuals),
      };

      const submissionData = {
        onboardingId,
        jurisdiction,
        status: 'submitted',
        ...normalizedData,
        completedByName: formData.declaration.completedByName,
        signatureType: formData.declaration.signatureType,
        signatureFilePath: formData.declaration.signature,
        signatureFileName: formData.declaration.signatureFileName,
        signedAt: formData.declaration.signedAt || new Date().toISOString(),
        ipAddress: formData.declaration.ipAddress || null,
        userAgent: formData.declaration.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      };

      const res = await fetch('/api/company-incorporation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to submit company incorporation form');

      alert('Company incorporation form submitted successfully!');
      router.push(`/pricing?onboardingId=${onboardingId}`);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err?.message || 'Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  // --- Prevent auto-submit unless user is on Review step ---
  const REVIEW_INDEX = FORM_STEPS.findIndex(s => s.id === 'review')

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    const isReview = currentStep === REVIEW_INDEX
    if (!isReview) {
      e.preventDefault() // block submits on all earlier steps
      return
    }
    handleSubmit(e as any) // only submit on the Review step
  }

  useEffect(() => {
    const captureVerificationData = async () => {
      if (formData.declaration.signature && !formData.declaration.signedAt) {
        handleDeclarationChange('signedAt', new Date().toISOString());
        try {
          const ipResponse = await fetch('/api/ip-address');
          const ipData = await ipResponse.json();
          handleDeclarationChange('ipAddress', ipData.ip || 'Unknown');
        } catch (error) {
          handleDeclarationChange('ipAddress', 'Unknown');
        }
        handleDeclarationChange('userAgent', navigator.userAgent);
      }
    };

    captureVerificationData();
  }, [formData.declaration.signature]);

  // Safe arrays for summary / mapping
  const shareholdersArr = Array.isArray(formData.shareholders)
    ? formData.shareholders
    : toArray(formData.shareholders)

  const directorsArr = Array.isArray(formData.directors)
    ? formData.directors
    : toArray(formData.directors)

  const individualsArr = Array.isArray(formData.relevantIndividuals)
    ? formData.relevantIndividuals
    : toArray(formData.relevantIndividuals)

  // Calculate progress percentage
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100

  if (isLoadingDraft) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your draft...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const jurisdictionName = getJurisdictionName(jurisdiction)

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="!text-2xl !font-bold">Company Incorporation Form - {jurisdictionName}</CardTitle>
        <CardDescription>
          Complete the company incorporation details for your business in {jurisdictionName}
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {FORM_STEPS.length}</span>
            <span>{FORM_STEPS[currentStep].title}</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex overflow-x-auto pb-2 gap-2">
          {FORM_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 px-3 py-1 text-sm rounded-full border ${
                index === currentStep
                  ? 'bg-blue-600 text-white border-blue-600'
                  : index < currentStep
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {step.title}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <form
          onSubmit={(e) => e.preventDefault()}  // ← block any implicit/natural submits
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
          
          {success && (
            <div className="bg-green-500/15 text-green-600 text-sm p-3 rounded-md">
              {success}
            </div>
          )}

          {/* Step 1: Company Name */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Company Name</h3>
              <p className="text-sm text-muted-foreground">
                Please list three names for the company in order of preference. We will use the first name that is approved. Please also
                insert your desired ending which must be chosen from the word(s) "Limited"," Corporation"," Incorporated","Societe Anonyme",
                "Sociedad Anonima"; the abbreviations "Ltd", "Corp", "Inc", "S.A." or such other word(s) or abbreviations thereof.
              </p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="firstPreference">First preference *</Label>
                  <Input
                    id="firstPreference"
                    value={formData.companyNames.firstPreference}
                    onChange={(e) => handleCompanyNameChange('firstPreference', e.target.value)}
                    placeholder="Enter first preference company name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondPreference">Second preference</Label>
                  <Input
                    id="secondPreference"
                    value={formData.companyNames.secondPreference}
                    onChange={(e) => handleCompanyNameChange('secondPreference', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter second preference company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thirdPreference">Third preference</Label>
                  <Input
                    id="thirdPreference"
                    value={formData.companyNames.thirdPreference}
                    onChange={(e) => handleCompanyNameChange('thirdPreference', e.target.value)}
                    placeholder="Enter third preference company name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chosenEnding">Chosen Ending *</Label>
                  <select
                    id="chosenEnding"
                    value={formData.companyNames.chosenEnding}
                    onChange={(e) => handleCompanyNameChange('chosenEnding', e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select ending</option>
                    <option value="Limited">Limited</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Incorporated">Incorporated</option>
                    <option value="Societe Anonyme">Societe Anonyme</option>
                    <option value="Sociedad Anonima">Sociedad Anonima</option>
                    <option value="Ltd">Ltd</option>
                    <option value="Corp">Corp</option>
                    <option value="Inc">Inc</option>
                    <option value="S.A.">S.A.</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 : Purpose of Company */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Purpose of Company</h3>
              <p className="text-sm text-muted-foreground">
                BVI Legislation and International Standards dictates that we must have a full understanding of the company's activities.
                Please explain in detail the purpose, intended activities and typical assets. See examples below for guidance.
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                <li>For an Investment Holding Company, please specify the type of investments it will be holding, such as bonds, privately held shares in XYZ Limited (detailing the activity of XYZ Limited), or publicly traded securities (detailing custodian and value).</li>
                <li>For a consultancy or professional services company, please detail the typical services and customers.</li>
                <li>For a property holding company, please advise whether commercial or residential and provide the address.</li>
              </ul>
              
              <div className="space-y-2">
                <Label htmlFor="purposeOfCompany">Company Purpose and Activities *</Label>
                <textarea
                  id="purposeOfCompany"
                  name="purposeOfCompany"
                  value={formData.purposeOfCompany}
                  onChange={handleChange}
                  placeholder="Describe the company's purpose, activities, and typical assets in detail..."
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={6}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Shareholder Information */}
          {currentStep === 2 && (
            (() => {
              // Normalize once, reuse everywhere in this section
              const shareholdersArr =
                Array.isArray(formData.shareholders)
                  ? formData.shareholders
                  : toArray(formData.shareholders)

              const totalPct = shareholdersArr.reduce(
                (t, s) => t + (parseFloat(s.sharesPercentage) || 0),
                0
              )

              return (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Shareholder Information</h3>

                  {/* Nominee Shareholder Question */}
                  <div className="border rounded-lg p-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Do you require Nominee Shareholder?</h4>
                      <p className="text-sm text-muted-foreground">
                        If yes, we will provide nominee services for 1,500 HKD. If no, please provide shareholder details below.
                      </p>

                      <div className="flex space-x-6">
                        {/* Yes = use nominee, clear manual list */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="nomineeYes"
                            name="nomineeShareholder"
                            checked={formData.requiresNomineeShareholder}
                            onChange={() =>
                              setFormData(prev => ({
                                ...prev,
                                requiresNomineeShareholder: true,
                                shareholders: [], // clear manual entries
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="nomineeYes" className="text-sm font-medium leading-none">
                            Yes (1,500 HKD)
                          </Label>
                        </div>

                        {/* No = manual shareholders; seed first row if empty */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="nomineeNo"
                            name="nomineeShareholder"
                            checked={!formData.requiresNomineeShareholder}
                            onChange={() =>
                              setFormData(prev => ({
                                ...prev,
                                requiresNomineeShareholder: false,
                                shareholders:
                                  Array.isArray(prev.shareholders) && prev.shareholders.length > 0
                                    ? prev.shareholders
                                    : [
                                        {
                                          id: 1,
                                          fullName: '',
                                          sharesPercentage: '',
                                          address: '',
                                        },
                                      ],
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="nomineeNo" className="text-sm font-medium leading-none">
                            No
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shareholder Details - Only show if they select "No" */}
                  {!formData.requiresNomineeShareholder && (
                    <>
                      {shareholdersArr.map((shareholder, index) => (
                        <div key={shareholder?.id ?? index} className="border rounded-lg p-6 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Shareholder #{index + 1}</h4>

                            {shareholdersArr.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeShareholder(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`shareholder-name-${index}`}>Full Name *</Label>
                              <Input
                                id={`shareholder-name-${index}`}
                                value={shareholder.fullName}
                                onChange={(e) => handleShareholderChange(index, 'fullName', e.target.value)}
                                placeholder="Full legal name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`shares-percentage-${index}`}>Shares Percentage *</Label>
                              <Input
                                id={`shares-percentage-${index}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={shareholder.sharesPercentage}
                                onChange={(e) => handleShareholderChange(index, 'sharesPercentage', e.target.value)}
                                placeholder="e.g., 50.00"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`shareholder-address-${index}`}>Address *</Label>
                            <Textarea
                              id={`shareholder-address-${index}`}
                              value={shareholder.address}
                              onChange={(e) => handleShareholderChange(index, 'address', e.target.value)}
                              placeholder="Full residential address"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              rows={3}
                              required
                            />
                          </div>
                        </div>
                      ))}

                      <Button type="button" variant="outline" onClick={addShareholder}>
                        Add Another Shareholder
                      </Button>

                      {/* Total Percentage Validation */}
                      {shareholdersArr.length > 0 && (
                        <div
                          className={`p-4 rounded-lg ${
                            totalPct === 100 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                          }`}
                        >
                          <p className={`text-sm ${totalPct === 100 ? 'text-green-800' : 'text-yellow-800'}`}>
                            <strong>
                              {totalPct === 100
                                ? '✓ Total shares percentage: 100% - Valid'
                                : `Total shares percentage: ${totalPct}% - Must equal 100% to proceed`}
                            </strong>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()
          )}


          {/* Step 4: Directors Information */}
          {currentStep === 3 && (
            (() => {
              // ✅ Normalize once, reuse
              const shareholdersArr =
                Array.isArray(formData.shareholders) ? formData.shareholders : toArray(formData.shareholders)

              const directorsArr =
                Array.isArray(formData.directors) ? formData.directors : toArray(formData.directors)

              return (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Director Information</h3>

                  {/* Nominee Director Question */}
                  <div className="border rounded-lg p-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Do you require Nominee Director?</h4>
                      <p className="text-sm text-muted-foreground">
                        If yes, we will provide nominee director services for 1,000 HKD. If no, please provide director details below.
                      </p>

                      <div className="flex space-x-6">
                        {/* Yes → clear manual directors */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="directorYes"
                            name="nomineeDirector"
                            checked={formData.requiresNomineeDirector}
                            onChange={() =>
                              setFormData(prev => ({
                                ...prev,
                                requiresNomineeDirector: true,
                                directors: [], // clear when using nominee
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="directorYes" className="text-sm font-medium leading-none">
                            Yes (1,000 HKD)
                          </Label>
                        </div>

                        {/* No → seed one empty director if list is empty */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="directorNo"
                            name="nomineeDirector"
                            checked={!formData.requiresNomineeDirector}
                            onChange={() =>
                              setFormData(prev => ({
                                ...prev,
                                requiresNomineeDirector: false,
                                directors:
                                  Array.isArray(prev.directors) && prev.directors.length > 0
                                    ? prev.directors
                                    : [
                                        {
                                          id: 1,
                                          fullName: '',
                                          isShareholder: false,
                                          selectedShareholderId: null,
                                        } as Director,
                                      ],
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="directorNo" className="text-sm font-medium leading-none">
                            No
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Director Details - Only show if they select "No" */}
                  {!formData.requiresNomineeDirector && (
                    <>
                      {/* Shareholder Selection Section */}
                      {shareholdersArr.length > 0 && (
                        <div className="border rounded-lg p-6">
                          <h4 className="font-medium mb-4">Select shareholders who will also be directors:</h4>
                          <div className="space-y-3">
                            {shareholdersArr.map((shareholder) => {
                              const isSelected = directorsArr.some(
                                dir => dir.selectedShareholderId === shareholder.id
                              )

                              return (
                                <div key={shareholder?.id ?? shareholder?.fullName ?? crypto.randomUUID()} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`shareholder-director-${shareholder?.id ?? 'x'}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Add as director (shareholder→director)
                                        const newDirector: Director = {
                                          id: Date.now(),
                                          fullName: shareholder.fullName,
                                          isShareholder: true,
                                          selectedShareholderId: shareholder.id,
                                        }
                                        setFormData(prev => ({
                                          ...prev,
                                          directors: [...(Array.isArray(prev.directors) ? prev.directors : toArray(prev.directors)), newDirector],
                                        }))
                                      } else {
                                        // Remove from directors by selectedShareholderId
                                        setFormData(prev => ({
                                          ...prev,
                                          directors: (Array.isArray(prev.directors) ? prev.directors : toArray(prev.directors))
                                            .filter(dir => dir.selectedShareholderId !== shareholder.id),
                                        }))
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`shareholder-director-${shareholder?.id ?? 'x'}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {shareholder.fullName} ({shareholder.sharesPercentage}% shares)
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                          <p className="text-sm text-muted-foreground mt-3">
                            ✓ Selected shareholders will be automatically added as directors
                          </p>
                        </div>
                      )}

                      {/* Additional Directors Section (not shareholders) */}
                      <div className="border rounded-lg p-6">
                        <h4 className="font-medium mb-4">Additional Directors (not shareholders)</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add directors who are not shareholders from the list above.
                        </p>

                        {directorsArr
                          .filter(director => !director.isShareholder)
                          .map((director) => (
                            <div key={director?.id ?? director?.fullName ?? crypto.randomUUID()} className="border rounded-lg p-4 space-y-3 mb-4">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium">Additional Director</h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setFormData(prev => ({
                                      ...prev,
                                      directors: (Array.isArray(prev.directors) ? prev.directors : toArray(prev.directors))
                                        .filter(d => d.id !== director.id),
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`director-name-${director?.id ?? 'x'}`}>Full Name *</Label>
                                <Input
                                  id={`director-name-${director?.id ?? 'x'}`}
                                  value={director.fullName}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      directors: (Array.isArray(prev.directors) ? prev.directors : toArray(prev.directors))
                                        .map(d => (d.id === director.id ? { ...d, fullName: e.target.value } : d)),
                                    }))
                                  }}
                                  placeholder="Full legal name"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  required
                                />
                              </div>
                            </div>
                          ))}

                        <Button type="button" variant="outline" onClick={addDirector}>
                          + Add Additional Director
                        </Button>
                      </div>

                      {/* Summary */}
                      {directorsArr.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">Selected Directors:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {directorsArr.map((director, index) => (
                              <li key={director?.id ?? index}>
                                • {director.fullName}
                                {director.isShareholder ? (
                                  <span className="text-green-600">
                                    {' '}
                                    (Shareholder - {shareholdersArr.find(sh => sh.id === director.selectedShareholderId)?.sharesPercentage}% shares)
                                  </span>
                                ) : (
                                  <span className="text-gray-600"> (Director only)</span>
                                )}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-blue-600 mt-2">Total directors: {directorsArr.length}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()
          )}
        
          {/* Step 5: Geography (country selection) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Geographic Profile</h3>

              <div className="space-y-2">
                <Label htmlFor="geographicProfile">Geographic Profile *</Label>
                <SearchableCountrySelect
                  label="Geographic Profile"
                  hideLabel
                  value={formData.geographicProfile || ""}
                  onChange={(newVal) => {
                    setFormData((prev) => ({
                      ...prev,
                      geographicProfile: newVal,
                    }))
                  }}
                  placeholder="Select country / region"
                />
              </div>
            </div>
          )}


          {/* Step 6: Share Capital */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4. Share Capital</h3>
              <p className="text-sm text-muted-foreground">
                If authorized shares are 50,000 or less, the annual licence fee is $450.00. If authorized shares exceed 50,000 the annual licence fee is $1,200.00. Please indicate desired capital structure.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      50,000 shares of $1.00 par value
                    </Label>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="standardSharesYes"
                          name="standardShares"
                          checked={formData.authorizedShares === '50000'}
                          onChange={(e) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              authorizedShares: '50000',
                              sharesParValue: '1.00',
                              currency: 'USD'
                            }))
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="standardSharesYes" className="text-sm font-medium leading-none">
                          Yes
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="standardSharesNo"
                          name="standardShares"
                          checked={formData.authorizedShares === 'custom'}
                          onChange={(e) => setFormData(prev => ({ ...prev, authorizedShares: 'custom' }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="standardSharesNo" className="text-sm font-medium leading-none">
                          No
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {formData.authorizedShares === 'custom' && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customShares">Number of shares</Label>
                        <Input
                          id="customShares"
                          name="customShares"
                          value={formData.customShares}
                          onChange={handleChange}
                          placeholder="e.g., 100000"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customParValue">Par value</Label>
                        <Input
                          id="customParValue"
                          name="customParValue"
                          value={formData.customParValue}
                          onChange={handleChange}
                          placeholder='e.g., "1.00" or "NO"'
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Insert "NO" if no par value shares desired
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          placeholder="e.g., USD"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Please state desired currency
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="complexStructureNotes">Complex Structure Notes</Label>
                      <textarea
                        id="complexStructureNotes"
                        name="complexStructureNotes"
                        value={formData.complexStructureNotes || ''}
                        onChange={handleChange}
                        placeholder="Should you have a complex structure please indicate below or advise in separate communication..."
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note: Shares will not be issued to persons under the age of 18. Shares can be issued to a parent, guardian, or legal representative in trust for someone under the age of 18.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Seals */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">5. Seals</h3>
              <p className="text-sm text-muted-foreground">
                It is a requirement for all BVI companies to have a company seal. Would you like us to order the company seal?
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="orderSealYes"
                      name="orderSeal"
                      checked={formData.orderSeal}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderSeal: true }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="orderSealYes" className="text-sm font-medium leading-none">
                      Yes
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="orderSealNo"
                      name="orderSeal"
                      checked={!formData.orderSeal}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderSeal: false }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="orderSealNo" className="text-sm font-medium leading-none">
                      No*
                    </Label>
                  </div>
                </div>
                
                {formData.orderSeal && (
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="sealQuantity" className="text-sm font-medium leading-none whitespace-nowrap">
                      How many?
                    </Label>
                    <Input
                      id="sealQuantity"
                      name="sealQuantity"
                      value={formData.sealQuantity}
                      onChange={handleChange}
                      type="number"
                      min="1"
                      className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
                
                {!formData.orderSeal && (
                  <p className="text-sm text-muted-foreground italic">
                    *If you do not want us to order a company seal you will need to send us an imprint of the seal once obtained.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Additional Relevant Individuals */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">6. Additional Relevant Individuals</h3>
              <p className="text-sm text-muted-foreground">
                Do you have any additional Ultimate Beneficial Owners (UBO), Shareholders, Directors or Other Connected Persons besides yourself?
              </p>

              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium mb-2">Additional Relevant Individuals?</h4>
                    <p className="text-sm text-muted-foreground">
                      Your information is already included from the previous registration. Select "Yes" only if you have additional UBOs, shareholders, or directors.
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={hasAdditionalIndividuals ? "default" : "outline"}
                      onClick={() => toggleAdditionalIndividuals(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={!hasAdditionalIndividuals ? "default" : "outline"}
                      onClick={() => toggleAdditionalIndividuals(false)}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>

              {hasAdditionalIndividuals && (
                <>
                  {formData.relevantIndividuals.map((individual, index) => (
                    <div key={individual.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Additional Relevant Individual #{index + 1}</h4>
                        {formData.relevantIndividuals.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRelevantIndividual(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={individual.isUBO}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isUBO', checked as boolean)}
                              />
                              <Label>UBO</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={individual.isShareholder}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isShareholder', checked as boolean)}
                              />
                              <Label>Shareholder</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={individual.isDirector}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isDirector', checked as boolean)}
                              />
                              <Label>Director</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`shares-${index}`}>Shares to be issued</Label>
                          <Input
                            id={`shares-${index}`}
                            value={individual.sharesToBeIssued}
                            onChange={(e) => handleIndividualChange(index, 'sharesToBeIssued', e.target.value)}
                            placeholder="Number of shares"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`dob-${index}`}>Date of Birth (dd/mm/yyyy)</Label>
                          <Input
                            id={`dob-${index}`}
                            value={individual.dateOfBirth}
                            onChange={(e) => handleIndividualChange(index, 'dateOfBirth', e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                          <Input
                            id={`lastName-${index}`}
                            value={individual.lastName}
                            onChange={(e) => handleIndividualChange(index, 'lastName', e.target.value)}
                            placeholder="Last name"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`firstName-${index}`}>First Name(s)</Label>
                          <Input
                            id={`firstName-${index}`}
                            value={individual.firstName}
                            onChange={(e) => handleIndividualChange(index, 'firstName', e.target.value)}
                            placeholder="First name(s)"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`passport-${index}`}>Passport #</Label>
                          <Input
                            id={`passport-${index}`}
                            value={individual.passportNumber}
                            onChange={(e) => handleIndividualChange(index, 'passportNumber', e.target.value)}
                            placeholder="Passport number"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`nationality-${index}`}>Nationality</Label>
                          <Input
                            id={`nationality-${index}`}
                            value={individual.nationality}
                            onChange={(e) => handleIndividualChange(index, 'nationality', e.target.value)}
                            placeholder="Nationality"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`occupation-${index}`}>Occupation</Label>
                          <Input
                            id={`occupation-${index}`}
                            value={individual.occupation}
                            onChange={(e) => handleIndividualChange(index, 'occupation', e.target.value)}
                            placeholder="Occupation"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>US Citizen?</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={individual.isUSCitizen}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isUSCitizen', checked as boolean)}
                              />
                              <Label>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={!individual.isUSCitizen}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isUSCitizen', !checked)}
                              />
                              <Label>No</Label>
                            </div>
                          </div>
                          
                          {individual.isUSCitizen && (
                            <Input
                              value={individual.tin}
                              onChange={(e) => handleIndividualChange(index, 'tin', e.target.value)}
                              placeholder="TIN"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          )}
                          
                          {!individual.isUSCitizen && (
                            <div className="space-y-2">
                              <Input
                                value={individual.citizenshipCountry}
                                onChange={(e) => handleIndividualChange(index, 'citizenshipCountry', e.target.value)}
                                placeholder="Country of Citizenship"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <Input
                                value={individual.tin}
                                onChange={(e) => handleIndividualChange(index, 'tin', e.target.value)}
                                placeholder="Tax Identification Number (TIN)"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Politically Exposed Person?</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={individual.isPoliticallyExposed}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isPoliticallyExposed', checked as boolean)}
                              />
                              <Label>Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={!individual.isPoliticallyExposed}
                                onCheckedChange={(checked) => handleCheckboxChange(index, 'isPoliticallyExposed', !checked)}
                              />
                              <Label>No</Label>
                            </div>
                          </div>
                          
                          {individual.isPoliticallyExposed && (
                            <Input
                              value={individual.pepDetails}
                              onChange={(e) => handleIndividualChange(index, 'pepDetails', e.target.value)}
                              placeholder="Provide details of PEP status"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRelevantIndividual}
                  >
                    Add Another Relevant Individual
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 9: Source of Funds */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">7. General Source of Funds</h3>
              <p className="text-sm text-muted-foreground">
                BVI legislation mandates that we fully understand the source of funds. Please advise the total amount of funds expected to be injected into the company by all UBO's and give a general synopsis in the freeform box below. Note that each UBO is required to complete and submit a "Supplementary Source of Funds and Tax Residence Declaration".
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFundsAmount">Total amount of funds *</Label>
                  <Input
                    id="totalFundsAmount"
                    value={formData.sourceOfFunds.totalAmount}
                    onChange={(e) => handleSourceOfFundsChange('totalAmount', e.target.value)}
                    placeholder="e.g., $500,000 USD"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundsCompositionDetails">
                    Provide details of the overall composition of the funds to be injected into the company *
                  </Label>
                  <Textarea
                    id="fundsCompositionDetails"
                    value={formData.sourceOfFunds.compositionDetails}
                    onChange={(e) => handleSourceOfFundsChange('compositionDetails', e.target.value)}
                    placeholder="Please provide detailed information about the source and composition of funds (e.g., personal savings, business profits, investments, inheritance, etc.)..."
                    className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={6}
                    required
                  />
                </div>

                {/* Additional Question: Do you need a registered office? */}
                <div className="space-y-3 mt-6 border-t pt-4">
                  <Label className="font-medium">Do you need a registered office?</Label>
                  <p className="text-sm text-muted-foreground">
                    If yes, we will provide a registered office for <strong>HKD 1,500</strong>. If no, please provide your office address.
                  </p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="needsRegisteredOfficeYes"
                      name="needsRegisteredOffice"
                      checked={formData.sourceOfFunds.needsRegisteredOffice}
                      onChange={() =>
                        setFormData(prev => ({
                          ...prev,
                          sourceOfFunds: {
                            ...prev.sourceOfFunds,
                            needsRegisteredOffice: true,
                            officeLocation: '',
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="needsRegisteredOfficeYes"
                      className="text-sm font-medium leading-none"
                    >
                      Yes (add HKD 1,500)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="needsRegisteredOfficeNo"
                      name="needsRegisteredOffice"
                      checked={!formData.sourceOfFunds.needsRegisteredOffice}
                      onChange={() =>
                        setFormData(prev => ({
                          ...prev,
                          sourceOfFunds: {
                            ...prev.sourceOfFunds,
                            needsRegisteredOffice: false,
                          },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="needsRegisteredOfficeNo"
                      className="text-sm font-medium leading-none"
                    >
                      No, I have my own office
                    </Label>
                  </div>
                </div>


                  {!formData.sourceOfFunds.needsRegisteredOffice && (
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="officeLocation">Your Office Location *</Label>
                      <Input
                        id="officeLocation"
                        value={formData.sourceOfFunds.officeLocation}
                        onChange={(e) => handleSourceOfFundsChange('officeLocation', e.target.value)}
                        placeholder="Enter your office address"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note: Each UBO is required to complete and submit a "Supplementary Source of Funds and Tax Residence Declaration" form separately.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Step 10: Records Location */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">8. Location of Registers and Financial Records</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">8.1 Register of Directors/Members Location</h4>
                  <p className="text-sm text-muted-foreground">
                    Please provide the physical address where the original register of directors/members will be maintained and the name of the person who will maintain the records.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="registersLocation">
                        Physical address where registers will be maintained *
                      </Label>
                      <Textarea
                        id="registersLocation"
                        value={formData.recordsLocation.registersLocation}
                        onChange={(e) => handleRecordsLocationChange('registersLocation', e.target.value)}
                        placeholder='e.g., "At RO/RA" or provide full physical address'
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registersMaintainedBy">
                        Name of person who will maintain the records *
                      </Label>
                      <Input
                        id="registersMaintainedBy"
                        value={formData.recordsLocation.registersMaintainedBy}
                        onChange={(e) => handleRecordsLocationChange('registersMaintainedBy', e.target.value)}
                        placeholder="Full name of responsible person"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note: Insert "At RO/RA" if original records will be maintained at our offices. Please note that if the original registers are not maintained at our offices we must be notified of any change to a register within 15 days of the change. We must also be notified of any change in the location within 14 days of the change.</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">8.2 Financial Records Location</h4>
                  <p className="text-sm text-muted-foreground">
                    Please provide the physical address where the financial records will be maintained and the name of the person who will maintain the records.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="financialRecordsLocation">
                        Physical address where financial records will be maintained *
                      </Label>
                      <Textarea
                        id="financialRecordsLocation"
                        value={formData.recordsLocation.financialRecordsLocation}
                        onChange={(e) => handleRecordsLocationChange('financialRecordsLocation', e.target.value)}
                        placeholder='e.g., "At RO/RA" or provide full physical address'
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="financialRecordsMaintainedBy">
                        Name of person who will maintain the records *
                      </Label>
                      <Input
                        id="financialRecordsMaintainedBy"
                        value={formData.recordsLocation.financialRecordsMaintainedBy}
                        onChange={(e) => handleRecordsLocationChange('financialRecordsMaintainedBy', e.target.value)}
                        placeholder="Full name of responsible person"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Note: Insert "At RO/RA" if original records will be maintained at our offices (additional fees will apply). If not maintained at our office, if the location at which the original financial records are maintained changes we must be notified of the new location within 14 days of the change.</strong>
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Important: All company records must be maintained for a minimum of five (5) years after the completion of the transaction or the termination of the business relationship to which they relate.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 11: Declaration */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">9. Declaration / Signatures</h3>
              
              <div className="space-y-6 border rounded-lg p-6">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>NOTE: Each UBO MUST submit a Supplementary Source of Funds and Tax Residence Declaration.</strong>
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="font-medium">
                        Are there any other individuals or firms who are authorized to instruct CCP or request information about the company?
                      </Label>
                      <div className="flex space-x-6">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="authorizedYes"
                            name="authorizedToInstruct"
                            checked={formData.declaration.authorizedToInstruct}
                            onChange={(e) => handleDeclarationChange('authorizedToInstruct', true)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="authorizedYes" className="text-sm font-medium leading-none">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="authorizedNo"
                            name="authorizedToInstruct"
                            checked={!formData.declaration.authorizedToInstruct}
                            onChange={(e) => handleDeclarationChange('authorizedToInstruct', false)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="authorizedNo" className="text-sm font-medium leading-none">
                            No
                          </Label>
                        </div>
                      </div>
                      
                      {formData.declaration.authorizedToInstruct && (
                        <div className="space-y-2">
                          <Label htmlFor="authorizedInstructorsDetails">Provide Details Below</Label>
                          <Textarea
                            id="authorizedInstructorsDetails"
                            value={formData.declaration.authorizedInstructorsDetails}
                            onChange={(e) => handleDeclarationChange('authorizedInstructorsDetails', e.target.value)}
                            placeholder="Please provide details of authorized individuals or firms (In addition please note that you will be considered an 'Other Connected Person' and required to produce the due diligence as outlined in item 6 above.)"
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pepDetailsAdditional">
                        Please provide details of any Relevant Individuals who are Politically Exposed Persons in this area
                      </Label>
                      <Textarea
                        id="pepDetailsAdditional"
                        value={formData.declaration.pepDetailsAdditional}
                        onChange={(e) => handleDeclarationChange('pepDetailsAdditional', e.target.value)}
                        placeholder="Provide any additional PEP details not covered in previous sections..."
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>Declaration: I/We declare and affirm that the information provided herein is true and correct to the best of my/our knowledge and that the assets to be introduced into the Company do not derive from any criminal, illegal, money-laundering, terrorist, sanctions busting or other nefarious activities. I/We are aware that anti-money laundering legislation has been passed in the BVI and that I am/We are bound by the statements given herein. I confirm that if requested to do so, I/We will provide CCP with any further evidence as may be required in relation to the verification of the identity or activities of the Relevant Individuals and will promptly inform CCP of any changes in the shareholding, directors, officers or ultimate beneficial owners of the Company. I/We have read, accepted, and hereby agree to execute and be bound by CCP's Standard Terms of Business and pay all invoices rendered pursuant to the standard or agreed fee schedule.</strong>
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Completed by (a UBO or Authorized Person)</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completedByName">Full Name *</Label>
                    <Input
                      value={formData.declaration.completedByName}
                      onChange={(e) => handleDeclarationChange('completedByName', e.target.value)}
                      placeholder="Type your full legal name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="font-medium">Signature Method *</Label>
                    
                    {/* Signature Method Selection */}
                    {!formData.declaration.signatureType && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSignatureMethod('draw')}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                        >
                          <div className="text-blue-600 mb-2">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <span className="font-medium">Draw Signature</span>
                          <p className="text-sm text-muted-foreground mt-1">Use your mouse to draw your signature</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignatureMethod('upload')}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                        >
                          <div className="text-blue-600 mb-2">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <span className="font-medium">Upload Signature</span>
                          <p className="text-sm text-muted-foreground mt-1">Upload an image of your signature</p>
                        </button>
                      </div>
                    )}

                    {/* Drawing Pad */}
                    {signatureMethod === 'draw' && !formData.declaration.signatureType && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>Draw your signature below</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearSignature}
                          >
                            Clear
                          </Button>
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                          <canvas
                            ref={setCanvasRef}
                            width={600}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full h-50 cursor-crosshair touch-none"
                            style={{ touchAction: 'none' }}
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            onClick={() => setSignatureMethod(null)}
                            variant="outline"
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={saveDrawnSignature}
                            disabled={!signaturePreview}
                          >
                            Save Signature
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Draw your signature in the box above. Click "Save Signature" when finished.
                        </p>
                      </div>
                    )}

                    {/* File Upload */}
                    {signatureMethod === 'upload' && !formData.declaration.signatureType && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <Label>Upload your signature file</Label>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            id="signatureUpload"
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="signatureUpload"
                            className="cursor-pointer block"
                          >
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB, or PDF
                            </p>
                          </label>
                        </div>
                        
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            onClick={() => setSignatureMethod(null)}
                            variant="outline"
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Signature Preview */}
                    {(formData.declaration.signatureType === 'drawn' || formData.declaration.signatureType === 'uploaded') && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <Label>
                            {formData.declaration.signatureType === 'drawn' ? 'Drawn Signature' : 'Uploaded Signature'}
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Reset ALL signature state completely
                              setFormData(prev => ({
                                ...prev,
                                declaration: {
                                  ...prev.declaration,
                                  signatureType: null,
                                  signature: '',
                                  signatureFileName: '',
                                  signatureDataUrl: '',
                                  signatureFile: null
                                }
                              }))
                              setSignaturePreview('')
                              setSignatureMethod(null)
                              
                              // Clear canvas if drawn signature
                              if (canvasRef && formData.declaration.signatureType === 'drawn') {
                                const ctx = canvasRef.getContext('2d')
                                if (ctx) {
                                  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
                                }
                              }
                              
                              // Reset file input if uploaded signature
                              if (formData.declaration.signatureType === 'uploaded') {
                                const fileInput = document.getElementById('signatureUpload') as HTMLInputElement
                                if (fileInput) fileInput.value = ''
                              }
                            }}
                          >
                            Change Signature
                          </Button>
                        </div>
                        
                        {formData.declaration.signatureType === 'drawn' && signaturePreview && (
                          <div className="border rounded-lg p-4 bg-white">
                            <img 
                              src={signaturePreview} 
                              alt="Signature preview" 
                              className="max-w-full h-auto max-h-32 mx-auto"
                            />
                          </div>
                        )}
                        
                        {formData.declaration.signatureType === 'uploaded' && formData.declaration.signatureFile && (
                          <div className="border rounded-lg p-4 bg-white">
                            {signaturePreview ? (
                              <img 
                                src={signaturePreview} 
                                alt="Signature preview" 
                                className="max-w-full h-auto max-h-32 mx-auto"
                              />
                            ) : (
                              <div className="text-center py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm font-medium">{formData.declaration.signatureFile.name}</p>
                                <p className="text-xs text-muted-foreground">PDF File</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-green-600">
                          ✓ Signature {formData.declaration.signatureType === 'drawn' ? 'drawn' : 'uploaded'} successfully
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Verification Data Display */}
                  {formData.declaration.signatureType && (
                    <div className="text-xs text-green-600 space-y-1 bg-green-50 p-3 rounded-lg">
                      <p>✓ Signature {formData.declaration.signatureType === 'drawn' ? 'drawn' : 'uploaded'} successfully</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Signed At</Label>
                    <Input
                      value={
                        formData.declaration.signedAt
                          ? new Date(formData.declaration.signedAt).toLocaleString()
                          : '—'
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 12: Review & Submit */}
          {currentStep === FORM_STEPS.findIndex(s => s.id === 'review') && (
            <div className="space-y-8">
              <h3 className="text-lg font-semibold">Review & Submit</h3>

              {/* Company + Purpose */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Company</h4>
                  <SummaryRow label="1st preference" value={formData.companyNames.firstPreference} />
                  <SummaryRow label="2nd preference" value={formData.companyNames.secondPreference} />
                  <SummaryRow label="3rd preference" value={formData.companyNames.thirdPreference} />
                  <SummaryRow label="Chosen ending" value={formData.companyNames.chosenEnding} />
                  <SummaryRow label="Purpose of company" value={formData.purposeOfCompany} />
                  <SummaryRow label="Geographic profile" value={formData.geographicProfile} />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Share Capital</h4>
                  <SummaryRow label="Authorized shares" value={formData.authorizedShares === 'custom' ? formData.customShares : formData.authorizedShares} />
                  <SummaryRow label="Par value" value={formData.authorizedShares === 'custom' ? formData.customParValue : formData.sharesParValue} />
                  <SummaryRow label="Currency" value={formData.currency} />
                  <SummaryRow label="Order seal" value={formData.orderSeal ? 'Yes' : 'No'} />
                  <SummaryRow label="Seal quantity" value={formData.sealQuantity} />
                </div>
              </div>

              {/* Shareholders & Directors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Shareholders {formData.requiresNomineeShareholder ? '(Nominee)' : ''}</h4>
                  {formData.requiresNomineeShareholder ? (
                    <p className="text-sm text-muted-foreground">Nominee shareholder requested.</p>
                  ) : (
                    <>
                      {shareholdersArr.length === 0 && (
                        <p className="text-sm text-muted-foreground">No shareholders listed.</p>
                      )}
                      {shareholdersArr.map((sh, i) => (
                        <div key={sh?.id ?? i} className="text-sm">
                          • <span className="font-medium">{sh.fullName || 'Unnamed'}</span> — {sh.sharesPercentage || '0'}% — {sh.address || 'No address'}
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Directors {formData.requiresNomineeDirector ? '(Nominee)' : ''}</h4>
                  {formData.requiresNomineeDirector ? (
                    <p className="text-sm text-muted-foreground">Nominee director requested.</p>
                  ) : (
                    <>
                      {directorsArr.length === 0 && (
                        <p className="text-sm text-muted-foreground">No directors listed.</p>
                      )}
                      {directorsArr.map((d, i) => (
                        <div key={d?.id ?? i} className="text-sm">
                          • <span className="font-medium">{d.fullName || 'Unnamed'}</span>
                          {d.isShareholder && <span className="text-green-600"> (Shareholder)</span>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Individuals */}
              <div>
                <h4 className="font-medium mb-2">Relevant Individuals</h4>
                {individualsArr.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional individuals provided.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {individualsArr.map((ri, i) => (
                      <div key={ri?.id ?? i} className="border rounded-md p-3 text-sm">
                        <div className="font-medium">{ri.firstName} {ri.lastName}</div>
                        <div className="text-muted-foreground">
                          {ri.nationality || '—'} · {ri.passportNumber || '—'} · {ri.dateOfBirth || '—'}
                        </div>
                        <div>
                          {ri.isUBO ? 'UBO · ' : ''}
                          {ri.isShareholder ? 'Shareholder · ' : ''}
                          {ri.isDirector ? 'Director · ' : ''}
                          {ri.isPoliticallyExposed ? 'PEP' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Source of funds & Records */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Source of Funds</h4>
                  <SummaryRow label="Total amount" value={formData.sourceOfFunds.totalAmount} />
                  <SummaryRow label="Composition details" value={formData.sourceOfFunds.compositionDetails} />
                  <SummaryRow label="Registered office" value={formData.sourceOfFunds.needsRegisteredOffice ? 'Yes (HKD 1,500)' : 'No'}/>
                  <SummaryRow label="Office location" value={formData.sourceOfFunds.needsRegisteredOffice ? '—' : (formData.sourceOfFunds.officeLocation || '—')}/>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Records Location</h4>
                  <SummaryRow label="Registers location" value={formData.recordsLocation.registersLocation} />
                  <SummaryRow label="Registers maintained by" value={formData.recordsLocation.registersMaintainedBy} />
                  <SummaryRow label="Financial records location" value={formData.recordsLocation.financialRecordsLocation} />
                  <SummaryRow label="Financial records maintained by" value={formData.recordsLocation.financialRecordsMaintainedBy} />
                </div>
              </div>

              {/* Declaration (read-only) */}
              <div className="space-y-3">
                <h4 className="font-medium">Declaration</h4>
                <SummaryRow label="Completed by" value={formData.declaration.completedByName} />
                <SummaryRow label="Signature type" value={formData.declaration.signatureType || '—'} />
                <SummaryRow label="Signature" value={formData.declaration.signature ? 'Provided' : '—'} />
                <SummaryRow label="Signed at" value={formData.declaration.signedAt} />
                <p className="text-xs text-muted-foreground">
                  You can click Previous to change the signature or declaration details.
                </p>
              </div>
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
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit('button', e)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Company Incorporation'}
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Your progress is automatically saved as you type.</p>
          </div>
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