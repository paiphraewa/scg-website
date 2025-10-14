// app/login/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Country codes data
const countryCodes = [
  { code: '+852', country: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+66', country: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+880', country: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+95', country: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+673', country: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: '+855', country: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+856', country: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: '+670', country: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: '+353', country: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: '+48', country: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: '+36', country: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: '+420', country: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+40', country: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: '+380', country: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+90', country: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: '+20', country: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: '+233', country: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: '+212', country: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: '+216', country: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', country: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: '+251', country: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+255', country: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: '+51', country: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: '+58', country: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+593', country: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+595', country: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+598', country: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+507', country: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: '+506', country: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+503', country: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+502', country: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+504', country: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: '+505', country: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: '+973', country: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: '+962', country: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', country: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: '+964', country: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: '+98', country: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: '+972', country: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: '+970', country: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: '+20', country: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+218', country: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: '+249', country: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: '+252', country: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: '+253', country: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: '+291', country: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: '+260', country: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+267', country: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: '+264', country: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: '+266', country: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: '+268', country: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: '+230', country: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: '+960', country: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: '+670', country: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+675', country: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+677', country: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+679', country: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: '+676', country: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: '+682', country: 'CK', name: 'Cook Islands', flag: '🇨🇰' },
  { code: '+686', country: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: '+691', country: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: '+692', country: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
]

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+852')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Get callbackUrl from searchParams
  const callbackUrl = typeof searchParams.callbackUrl === 'string' ? searchParams.callbackUrl : '/'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCountry = countryCodes.find(country => country.code === countryCode)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Success - redirect to the intended page
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate inputs
      if (!name || !email || !password) {
        setError('Please fill in all required fields')
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      // Format phone number with country code
      const fullPhone = phone ? `${countryCode}${phone}` : undefined

      // Call your registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: fullPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created! Please sign in manually.')
      } else {
        setSuccess('Account created successfully! Redirecting...')
        setTimeout(() => {
          router.push(callbackUrl)
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">Welcome to SCG</h1>
          <p className="text-muted-foreground">Synergy Consulting Group</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create an account or sign in with your credentials
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="glass-effect">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                  Access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-black w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-black w-full"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-3" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card className="glass-effect">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>
                  Register for corporate services access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name *</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-black w-full"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-black w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-black w-full"
                      required
                    />
                  </div>

                  {/* Mobile Phone Field - Custom Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">
                      Mobile Phone <span className="text-muted-foreground text-sm">(Optional)</span>
                    </Label>
                    <div className="flex gap-2" ref={dropdownRef}>
                      {/* Country Code Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          disabled={loading}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-black min-w-24 justify-between hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span>{selectedCountry?.flag} {selectedCountry?.code}</span>
                          <span>▼</span>
                        </button>
                        
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-10">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(country.code)
                                  setIsDropdownOpen(false)
                                }}
                                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="font-medium">{country.code}</span>
                                <span className="text-sm text-gray-600">{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Phone Number Input */}
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="12345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-3" 
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}