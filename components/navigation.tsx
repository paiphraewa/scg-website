"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ResumeButton } from '@/components/resume-button'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
    setIsOpen(false)
  }

  // Desktop Auth Buttons
  const DesktopAuthButtons = () => {
    if (status === "loading") {
      return <div className="text-sm text-gray-500">Loading...</div>
    }

    if (session) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">
              {session.user?.name || session.user?.email?.split('@')[0]}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      )
    }

    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
    )
  }

  // Mobile Auth Buttons
  const MobileAuthButtons = () => {
    if (status === "loading") {
      return <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
    }

    if (session) {
      return (
        <>
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {session.user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {session.user?.email}
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 py-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </>
      )
    }

    return (
      <div className="px-3 py-2">
        <Link href="/login" className="w-full block">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => setIsOpen(false)}
          >
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold gradient-text">
              Synergy Consulting Group
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">
                Services
              </a>
              <a href="#jurisdictions" className="text-gray-700 hover:text-blue-600 transition-colors">
                Jurisdictions
              </a>
              <a href="#platform" className="text-gray-700 hover:text-blue-600 transition-colors">
                Platform
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </a>
              <Button variant="outline" size="sm">
                Book Free Call
              </Button>
              <ResumeButton defaultJurisdiction="bvi" showPicker={false} />
              <DesktopAuthButtons />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 shadow-lg">
            <a 
              href="#services" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Services
            </a>
            <a 
              href="#jurisdictions" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Jurisdictions
            </a>
            <a 
              href="#platform" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Platform
            </a>
            <a 
              href="#about" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            <div className="px-3 py-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Book Free Call
              </Button>
            <div className="px-3 py-2">
              <ResumeButton defaultJurisdiction="bvi" showPicker={false} />
            </div>
            </div>
            <MobileAuthButtons />
          </div>
        </div>
      )}
    </nav>
  )
}