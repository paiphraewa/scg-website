'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function JurisdictionsGrid() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const jurisdictions = [
    {
      name: "British Virgin Islands",
      code: "BVI",
      flag: "🇻🇬",
      price: "$1,200",
      timeframe: "3-5 days",
      popular: true,
      features: [
        "No corporate tax",
        "Bearer shares allowed",
        "Flexible corporate structure",
        "Strong privacy protection",
      ],
      benefits: ["Tax neutral", "Privacy", "Flexibility", "Speed"],
    },
    {
      name: "Cayman Islands",
      code: "KY",
      flag: "🇰🇾",
      price: "$2,500",
      timeframe: "5-7 days",
      popular: true,
      features: [
        "No direct taxation",
        "Exempted company status",
        "Strong regulatory framework",
        "International recognition",
      ],
      benefits: ["Zero tax", "Reputation", "Regulation", "Recognition"],
    },
    {
      name: "Panama",
      code: "PA",
      flag: "🇵🇦",
      price: "$800",
      timeframe: "2-3 days",
      popular: false,
      features: [
        "Territorial tax system",
        "Bearer shares permitted",
        "No minimum capital",
        "Nominee services available",
      ],
      benefits: ["Low cost", "Speed", "Privacy", "Flexibility"],
    },
    {
      name: "Hong Kong",
      code: "HK",
      flag: "🇭🇰",
      price: "$1,500",
      timeframe: "7-10 days",
      popular: true,
      features: ["Gateway to China", "Strong banking sector", "International business hub", "Territorial tax system"],
      benefits: ["Asia access", "Banking", "Business hub", "Tax efficient"],
    },
    {
      name: "Singapore",
      code: "SG",
      flag: "🇸🇬",
      price: "$1,800",
      timeframe: "5-7 days",
      popular: false,
      features: ["ASEAN headquarters", "Excellent infrastructure", "Strong legal system", "Tax incentives available"],
      benefits: ["ASEAN hub", "Infrastructure", "Legal system", "Incentives"],
    },
  ]

  const handleStartCompany = (jurisdictionCode: string) => {
    if (status === "loading") return

    if (!session) {
      // User is not logged in - redirect to login with proper callback URL
      const callbackUrl = `/client-register?jurisdiction=${jurisdictionCode}`
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      // User is logged in - redirect directly to client register form with jurisdiction
      router.push(`/client-register?jurisdiction=${jurisdictionCode}`)
    }
  }

  return (
    <section id="jurisdictions" className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
            Filter your needs, order online, pay in <span className="gradient-text">crypto or fiat</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
            Incorporate a legal entity within days in all major locations around the world. Choose the jurisdiction that
            best fits your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jurisdictions.map((jurisdiction, index) => (
            <Card
              key={index}
              className={`glass-effect hover:bg-slate-900/60 transition-all duration-300 group relative ${
                jurisdiction.popular ? "ring-2 ring-primary/50" : ""
              }`}
            >
              {jurisdiction.popular && (
                <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground">Most Popular</Badge>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{jurisdiction.flag}</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{jurisdiction.price}</div>
                    <div className="text-sm text-muted-foreground">starting from</div>
                  </div>
                </div>
                <CardTitle className="text-xl">{jurisdiction.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {jurisdiction.timeframe} incorporation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Features:</h4>
                  <ul className="space-y-1">
                    {jurisdiction.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {jurisdiction.benefits.map((benefit, benefitIndex) => (
                    <Badge key={benefitIndex} variant="secondary" className="text-xs bg-primary/10 text-primary">
                      {benefit}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full py-2.5 text-sm mx-auto flex items-center justify-center
                   bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  onClick={() => handleStartCompany(jurisdiction.code)}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Loading..." : `Start ${jurisdiction.code} Company`}
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Custom jurisdiction card */}
          <Card className="glass-effect hover:bg-card/80 transition-all duration-300 group flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Need Something Else?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Looking for a different jurisdiction or custom corporate structure? Our experts can help you find the
                perfect solution.
              </CardDescription>
              <Button variant="outline" className="bg-transparent">
                Speak with Expert
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            All packages include registered office, corporate kit, and first year maintenance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6">
              Compare All Jurisdictions
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
              Download Comparison Guide
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}