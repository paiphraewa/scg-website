import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, MessageSquare, ArrowRight } from "lucide-react"

export function ContactSection() {
  return (
    <>
      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-muted-foreground text-balance leading-relaxed">
              Get answers to common questions about offshore company formation and our services.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How long does company formation take?",
                answer:
                  "Formation times vary by jurisdiction. BVI and Panama can be completed in 2-5 days, while Hong Kong and Singapore typically take 5-10 days. Cayman Islands usually require 5-7 days.",
              },
              {
                question: "What documents do I need to provide?",
                answer:
                  "You'll need passport copies of directors and shareholders, proof of address, and a completed application form. Additional documents may be required depending on the jurisdiction and your specific requirements.",
              },
              {
                question: "Do you provide ongoing compliance services?",
                answer:
                  "Yes, we offer comprehensive ongoing compliance services including annual returns, statutory filings, registered office services, and regulatory updates to keep your company in good standing.",
              },
              {
                question: "Can I open a bank account for my offshore company?",
                answer:
                  "We provide banking support and introductions to reputable banks. However, account opening is subject to the bank's due diligence requirements and your specific business activities.",
              },
            ].map((faq, index) => (
              <Card key={index} className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">
                Ready to get <span className="gradient-text">started?</span>
              </h2>
              <p className="text-xl text-muted-foreground text-balance mb-8 leading-relaxed">
                Speak with our corporate formation experts to discuss your specific requirements and find the best
                jurisdiction for your business needs.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-muted-foreground">(+852) 9886 1697</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">contact@synergyconsulting.io</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Office</h3>
                    <p className="text-muted-foreground">Sheung Wan, Hong Kong</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-xl">Contact us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* First and Last Name*/}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    First and last name <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Full name" className="w-full" />
                </div>

                {/*Project Name */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    Project name <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Project name" className="w-full"/>
                </div>

                {/* Telegram */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    Telegram @ <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Telegram" className="w-full"/>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Email" className="w-full"/>
                </div>

                {/* Link to pitchdeck or website */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    Link to pitchdeck or website <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Link" className="w-full"/>
                </div>

                {/* Assistance message */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    What would you like assistance from SCG with? <span className="text-red-500">*</span>
                  </label>
                  <Input placeholder="Message" className="w-full" />
                </div>

                {/* Additional information */}
                <div className="space-y-2">
                  <label className="text-lg font-medium">
                    Is there any further information that you would like to share?
                  </label>
                  <Input placeholder="Message" className="w-full" />
                </div>

                {/* Submit Button */}
                <Button className="px-8 py-4 text-lg mx-auto flex items-center justify-center
                 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
                  Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-bold gradient-text mb-4">Synergy Consulting Group</div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Synergy Consulting Group provides professional offshore company formation and corporate structuring
                services worldwide.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="bg-transparent">
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Twitter
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Company Formation</li>
                <li>Corporate Compliance</li>
                <li>Director Services</li>
                <li>Banking Support</li>
                <li>Ongoing Maintenance</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Jurisdictions</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>British Virgin Islands</li>
                <li>Cayman Islands</li>
                <li>Panama</li>
                <li>Hong Kong</li>
                <li>Singapore</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 by Synergy Consulting Group Limited</p>
            <div className="flex space-x-6 text-sm text-muted-foreground mt-4 sm:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
