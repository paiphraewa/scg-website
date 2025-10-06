import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle, Building2, FileText, Calendar } from "lucide-react"

export function DashboardPreview() {
  return (
    <section id="platform" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">
              One Dashboard for all your <span className="gradient-text">corporate entities</span>
            </h2>
            <p className="text-xl text-muted-foreground text-balance mb-8 leading-relaxed">
              SCG makes it easy to manage all your companies in one place. Track compliance, manage documents, and stay
              updated on regulatory requirements across all jurisdictions.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Manage companies anywhere in the world</h3>
                  <p className="text-muted-foreground text-sm">
                    Centralized management for entities across BVI, Cayman, Panama, Hong Kong, and Singapore.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Stay compliant around the globe</h3>
                  <p className="text-muted-foreground text-sm">
                    Automated compliance monitoring and reminders to keep all your entities in good standing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Update officers and shareholders</h3>
                  <p className="text-muted-foreground text-sm">
                    Easy management of corporate records, officer appointments, and shareholder registers.
                  </p>
                </div>
              </div>
            </div>

            <Button size="lg" className="text-lg px-8 py-6">
              Book a Free Guidance Call
            </Button>
          </div>

          {/* Right side - Dashboard mockup */}
          <div className="relative">
            <div className="glass-effect rounded-2xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">SCG Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Manage all your entities</p>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  5 Active
                </Badge>
              </div>

              {/* Entity cards */}
              <div className="space-y-3">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Nexus Holdings Ltd</CardTitle>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">BVI • Incorporated 2023</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        Annual Return Filed
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: Dec 2024
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Pacific Ventures Inc</CardTitle>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Cayman • Incorporating</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-yellow-400" />
                        Entity Maintenance
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-yellow-400" />
                        Action Required
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Global Trade Corp</CardTitle>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Hong Kong • Incorporated 2022</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        Compliant
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: Mar 2025
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}