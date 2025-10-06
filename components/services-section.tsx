import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, Users, TrendingUp, Shield, Clock } from "lucide-react"

export function ServicesSection() {
  const services = [
    {
      icon: Building2,
      title: "Company Formation",
      description: "Complete offshore company incorporation with all required documentation and regulatory filings.",
      features: ["Certificate of Incorporation", "Memorandum & Articles", "Corporate Kit", "Registered Office"],
    },
    {
      icon: FileText,
      title: "Corporate Compliance",
      description: "Ongoing compliance management to maintain good standing across all jurisdictions.",
      features: ["Annual Returns", "Statutory Filings", "Compliance Monitoring", "Regulatory Updates"],
    },
    {
      icon: Users,
      title: "Director Services",
      description: "Professional nominee director and corporate secretary services for enhanced privacy.",
      features: ["Nominee Directors", "Corporate Secretary", "Shareholder Services", "Board Resolutions"],
    },
    {
      icon: TrendingUp,
      title: "Corporate Structuring",
      description: "Strategic corporate structure design for tax optimization and operational efficiency.",
      features: ["Structure Planning", "Tax Optimization", "Holding Companies", "Investment Vehicles"],
    },
    {
      icon: Shield,
      title: "Banking Support",
      description: "Assistance with corporate banking relationships and account opening procedures.",
      features: ["Bank Introductions", "Account Opening", "Banking Documentation", "Relationship Management"],
    },
    {
      icon: Clock,
      title: "Ongoing Maintenance",
      description: "Comprehensive corporate maintenance services to ensure continued compliance.",
      features: ["Document Updates", "Address Services", "Mail Forwarding", "Corporate Changes"],
    },
  ]

  return (
    <section id="services" className="py-24 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
            Why Choose <span className="gradient-text">SCG</span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
            Comprehensive corporate services designed to streamline your business formation and ongoing compliance needs
            across multiple jurisdictions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Card key={index} className="glass-effect hover:bg-slate-900/60 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-16">
          <Button size="lg" className="text-lg px-8 py-6">
            Explore All Services
          </Button>
        </div>
      </div>
    </section>
  )
}