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
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload Trades', href: '/dashboard/upload', icon: Upload },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-card shadow-sm border-r min-h-screen">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <Shield className="h-8 w-8 text-primary mr-3" />
          <span className="text-xl font-bold text-foreground">Guardian AI</span>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 px-2">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Profile and Theme Toggle */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
} 