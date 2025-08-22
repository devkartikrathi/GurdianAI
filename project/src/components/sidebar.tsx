"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Upload, 
  Settings, 
  MessageSquare,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Home,
  TrendingUp,
  Bot,
  ChevronUp,
  Brain
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Summary', href: '/dashboard/ai-summary', icon: Brain },
  { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  { name: 'AI Chat', href: '/dashboard/chat', icon: Bot },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    signOut()
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMobileMenu}
          className="h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border-border/50"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/50 px-6">
              <h1 className="text-xl font-bold text-primary">GuardianAI</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>

            {/* Mobile Footer */}
            <div className="border-t border-border/50 p-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col border-r border-border/50 bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">GuardianAI</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="border-t border-border/50 p-4 space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "w-full justify-start",
              isCollapsed && "w-10 px-0"
            )}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Light Mode</span>}
              </>
            )}
          </Button>

          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.emailAddresses[0]?.emailAddress || 'user@example.com'}
                </p>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive",
              isCollapsed && "w-10 px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
} 