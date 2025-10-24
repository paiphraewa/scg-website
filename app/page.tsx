// app/page.tsx
import { auth } from '@/lib/auth'
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { JurisdictionsGrid } from "@/components/jurisdictions-grid"
import { ContactSection } from "@/components/contact-section"
import { Button } from "@/components/ui/button"  // ⬅️ add

export default async function HomePage() {
  const session = await auth() // ⬅️ make page async and read session

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />

        {/* Optional small CTA band under hero */}
        <section className="container mx-auto px-4 py-6 flex items-center justify-center gap-3">
          {/* Always allow starting BVI directly */}
          <a href="/incorporate/bvi">
            <Button size="lg">Start BVI Company</Button>
          </a>

          {/* If logged in, show Resume */}
          {session && (
            <form action="/resume" method="post">
              {/* hidden preferred jurisdiction — defaults to BVI now but you can replace with a picker later */}
              <input type="hidden" name="preferredJurisdiction" value="bvi" />
              <Button type="submit" variant="outline" size="lg">
                Resume Application
              </Button>
            </form>
          )}
        </section>

        <ServicesSection />
        <DashboardPreview />
        <JurisdictionsGrid />
        <ContactSection />
      </main>
    </div>
  )
}
