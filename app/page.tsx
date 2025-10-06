import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { JurisdictionsGrid } from "@/components/jurisdictions-grid"
import { ContactSection } from "@/components/contact-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <ServicesSection />
        <DashboardPreview />
        <JurisdictionsGrid />
        <ContactSection />
      </main>
    </div>
  )
}
