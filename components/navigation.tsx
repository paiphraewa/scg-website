"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold gradient-text">Synergy Consulting Group</div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#services" className="text-foreground hover:text-primary transition-colors">
                Services
              </a>
              <a href="#jurisdictions" className="text-foreground hover:text-primary transition-colors">
                Jurisdictions
              </a>
              <a href="#platform" className="text-foreground hover:text-primary transition-colors">
                Platform
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">
                About
              </a>
              <Button variant="outline" size="sm">
                Book Free Call
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
            <a href="#services" className="block px-3 py-2 text-foreground hover:text-primary">
              Services
            </a>
            <a href="#jurisdictions" className="block px-3 py-2 text-foreground hover:text-primary">
              Jurisdictions
            </a>
            <a href="#platform" className="block px-3 py-2 text-foreground hover:text-primary">
              Platform
            </a>
            <a href="#about" className="block px-3 py-2 text-foreground hover:text-primary">
              About
            </a>
            <div className="px-3 py-2">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Book Free Call
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}