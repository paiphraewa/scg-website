// components/company-incorporation-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

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

export function CompanyIncorporationForm({ onboardingId, jurisdiction }: CompanyIncorporationFormProps) {
  const [formData, setFormData] = useState({
    // Item 1: Company Name
    companyNames: {
      firstPreference: '',
      secondPreference: '',
      thirdPreference: '',
      chosenEnding: ''
    } as CompanyName,
    
    // Item 2: Purpose of Company
    purposeOfCompany: '',
    
    // Item 3: Geographic Profile
    geographicProfile: '',
    
    // Item 4: Share Capital
    authorizedShares: '50000', // '50000' or 'custom'
    sharesParValue: '1.00',
    currency: 'USD',
    customShares: '',
    customParValue: '',
    complexStructureNotes: '', // Add this new field
    
    // Item 5: Seals
    orderSeal: true,
    sealQuantity: '1',
    
    // Item 6: Relevant Individuals (empty by default since we have user info)
    relevantIndividuals: [] as RelevantIndividual[],

    // Item 7: General Source of Funds
    sourceOfFunds: {
      totalAmount: '',
      compositionDetails: ''
    },
    
    // Item 8: Location of Registers and Financial Records
    recordsLocation: {
      registersLocation: '',
      registersMaintainedBy: '',
      financialRecordsLocation: '',
      financialRecordsMaintainedBy: ''
    },
    
    // Item 9: Declaration / Signatures
    declaration: {
      authorizedToInstruct: false,
      authorizedInstructorsDetails: '',
      pepDetailsAdditional: '',
      completedByName: '',
      signature: '',
      declarationDate: '',
      // New fields
      signedAt: '',
      ipAddress: '',
      userAgent: ''
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasAdditionalIndividuals, setHasAdditionalIndividuals] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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
      // Add first individual when they say "Yes" for the first time
      addRelevantIndividual()
    } else if (!hasIndividuals) {
      // Clear all individuals when they say "No"
      setFormData(prev => ({
        ...prev,
        relevantIndividuals: []
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.companyNames.firstPreference) {
        setError('Please provide at least a first preference company name')
        return
      }

      if (!formData.companyNames.chosenEnding) {
        setError('Please choose a company name ending')
        return
      }

      if (!formData.purposeOfCompany) {
        setError('Please describe the purpose of the company')
        return
      }

      // Submit the form data
      const response = await fetch('/api/company-incorporation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          ...formData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit company incorporation form')
      }

      alert('Company incorporation form submitted successfully!')
      router.push(`/payment?onboardingId=${onboardingId}&type=incorporation`)

    } catch (error) {
      console.error('Form submission error:', error)
      setError(error instanceof Error ? error.message : 'Error submitting form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

    // Add useEffect to capture verification data
  useEffect(() => {
    const captureVerificationData = async () => {
      if (formData.declaration.signature && !formData.declaration.signedAt) {
        // Set timestamp
        handleDeclarationChange('signedAt', new Date().toISOString());
        
        // Capture IP address
        try {
          const ipResponse = await fetch('/api/ip-address');
          const ipData = await ipResponse.json();
          handleDeclarationChange('ipAddress', ipData.ip || 'Unknown');
        } catch (error) {
          handleDeclarationChange('ipAddress', 'Unknown');
        }
        
        // Capture user agent
        handleDeclarationChange('userAgent', navigator.userAgent);
      }
    };

    captureVerificationData();
  }, [formData.declaration.signature]);

  const jurisdictionName = getJurisdictionName(jurisdiction)

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="!text-2xl !font-bold">Company Incorporation Form - {jurisdictionName}</CardTitle>
        <CardDescription>
          Complete the company incorporation details for your business in {jurisdictionName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Item 1: Company Name */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Company Name</h3>
            <p className="text-sm text-muted-foreground">
              Please list three names for the company in order of preference. We will use the first name that is approved. Please also
              insert your desired ending which must be chosen from the word(s) “Limited”,” Corporation”,” Incorporated”,”Societe Anonyme”,
              “Sociedad Anonima”; the abbreviations “Ltd”, “Corp”, “Inc”, “S.A.” or such other word(s) or abbreviations thereof.
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

          {/* Item 2: Purpose of Company */}
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

          {/* Item 3: Geographic Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Geographic Profile</h3>
            <p className="text-sm text-muted-foreground">
              Please detail all jurisdictions where the company intends to trade, hold assets or invest.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="geographicProfile">Trading and Investment Jurisdictions</Label>
              <textarea
                id="geographicProfile"
                name="geographicProfile"
                value={formData.geographicProfile}
                onChange={handleChange}
                placeholder="List all countries/jurisdictions where the company will operate..."
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
            </div>
          </div>

          {/* Item 4: Share Capital */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">4. Share Capital</h3>
            <p className="text-sm text-muted-foreground">
              If authorized shares are 50,000 or less, the annual licence fee is $450.00. If authorized shares exceed 50,000 the annual licence fee is $1,200.00. Please indicate desired capital structure.
            </p>
            
            <div className="space-y-4">
              {/* 50,000 shares option with Yes/No radio buttons */}
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
              
              {/* Custom share structure - only show if "No" is selected */}
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
                  
                  {/* Complex structure notes */}
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
              
              {/* Important note about shares for minors */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note: Shares will not be issued to persons under the age of 18. Shares can be issued to a parent, guardian, or legal representative in trust for someone under the age of 18.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Item 5: Seals */}
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

          {/* Item 6: Additional Relevant Individuals - Optional Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">6. Additional Relevant Individuals</h3>
            <p className="text-sm text-muted-foreground">
              Do you have any additional Ultimate Beneficial Owners (UBO), Shareholders, Directors or Other Connected Persons besides yourself?
            </p>

            {/* Toggle for Additional Relevant Individuals */}
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

            {/* Additional Relevant Individuals (Only shown if user selects "Yes") */}
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
                    
                    {/* Additional fields for US citizens and PEP status */}
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


          {/* Item 7: General Source of Funds */}
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
              
              <div className="bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note: Each UBO is required to complete and submit a "Supplementary Source of Funds and Tax Residence Declaration" form separately.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Item 8: Location of Registers and Financial Records */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">8. Location of Registers and Financial Records</h3>
            
            <div className="space-y-6">
              {/* 8.1 Registers Location */}
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

              {/* 8.2 Financial Records Location */}
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

          {/* Item 9: Declaration / Signatures */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">9. Declaration / Signatures</h3>
            
            <div className="space-y-6 border rounded-lg p-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <strong>NOTE: Each UBO MUST submit a Supplementary Source of Funds and Tax Residence Declaration.</strong>
                </p>
                
                <div className="space-y-4">
                  {/* Authorization to Instruct */}
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

                  {/* Additional PEP Details */}
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

              {/* Declaration Text */}
              <div className="bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong>Declaration: I/We declare and affirm that the information provided herein is true and correct to the best of my/our knowledge and that the assets to be introduced into the Company do not derive from any criminal, illegal, money-laundering, terrorist, sanctions busting or other nefarious activities. I/We are aware that anti-money laundering legislation has been passed in the BVI and that I am/We are bound by the statements given herein. I confirm that if requested to do so, I/We will provide CCP with any further evidence as may be required in relation to the verification of the identity or activities of the Relevant Individuals and will promptly inform CCP of any changes in the shareholding, directors, officers or ultimate beneficial owners of the Company. I/We have read, accepted, and hereby agree to execute and be bound by CCP's Standard Terms of Business and pay all invoices rendered pursuant to the standard or agreed fee schedule.</strong>
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Completed by (a UBO or Authorized Person)</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="signature">E-Signature *</Label>
                  <div className="border border-gray-300 rounded-md p-4 space-y-4">
                    {/* Name line - with input */}
                    <div className="space-y-1">
                      <Label className="text-sm font-normal">Name:</Label>
                      <Input
                        value={formData.declaration.completedByName}
                        onChange={(e) => handleDeclarationChange('completedByName', e.target.value)}
                        placeholder="Type your full legal name"
                        className="flex h-8 w-full border-0 border-b border-gray-400 bg-transparent px-0 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none"
                        required
                      />
                    </div>
                    
                    {/* Signature line */}
                    <div className="space-y-1">
                      <Label className="text-sm font-normal">Signature:</Label>
                      <Input
                        id="signature"
                        value={formData.declaration.signature}
                        onChange={(e) => handleDeclarationChange('signature', e.target.value)}
                        placeholder="Type your full name as electronic signature"
                        className="flex h-8 w-full border-0 border-b border-gray-400 bg-transparent px-0 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none"
                        required
                      />
                    </div>
                    
                    {/* Date line - with date input */}
                    <div className="space-y-1">
                      <Label className="text-sm font-normal">Date:</Label>
                      <Input
                        type="date"
                        value={formData.declaration.declarationDate}
                        onChange={(e) => handleDeclarationChange('declarationDate', e.target.value)}
                        className="flex h-8 w-full border-0 border-b border-gray-400 bg-transparent px-0 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none"
                        required
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    By typing your name, you are providing your electronic signature and agree to be bound by this declaration.
                    This e-signature will be timestamped and recorded with verification data.
                  </p>
                  
                  {/* Display verification info if signed */}
                  {formData.declaration.signature && (
                    <div className="text-xs text-green-600 space-y-1">
                      <p>✓ E-signature recorded: {formData.declaration.signedAt ? new Date(formData.declaration.signedAt).toLocaleString() : 'Pending...'}</p>
                      {formData.declaration.ipAddress && <p>✓ IP Address: {formData.declaration.ipAddress}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Company Incorporation Form'}
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