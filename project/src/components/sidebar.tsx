"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  Shield, 
  Upload, 
  BarChart3, 
  Settings,
  Home,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload Trades', href: '/dashboard/upload', icon: Upload },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-30"></div>
              <div className="relative bg-background/90 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="ml-3">
              <div className="text-xl font-bold text-gradient-primary">Guardian AI</div>
              <div className="text-xs text-muted-foreground font-mono">TRADING PSYCHOLOGY</div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 px-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mr-3 transition-transform duration-200",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile and Theme Toggle */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                    userButtonTrigger: "focus:shadow-none"
                  }
                }}
              />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
} 