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
import { useUserSync } from '@/hooks/useUserSync'

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
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const { user: userData } = useUserSync()
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
          className="h-10 w-10 p-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/80 dark:to-indigo-950/80 backdrop-blur-sm border-blue-300/50 dark:border-blue-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-100/80 dark:hover:bg-blue-800/80"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Menu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gradient-to-br from-slate-50/95 to-gray-50/95 dark:from-slate-900/95 dark:to-gray-900/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-800/30 dark:to-indigo-800/30">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100">GuardianAI</h1>
                {userData?.clerkData?.imageUrl || clerkUser?.imageUrl ? (
                  <img 
                    src={userData?.clerkData?.imageUrl || clerkUser?.imageUrl} 
                    alt="Profile" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {userData?.clerkData?.firstName || clerkUser?.firstName || 'User'}
                </span>
              </div>
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
            <ScrollArea className="flex-1 px-3 py-4 bg-gradient-to-br from-slate-50/30 to-gray-50/30 dark:from-slate-800/30 dark:to-gray-800/30">
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
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/50"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4",
                        isActive ? "text-white" : "text-blue-600 dark:text-blue-400"
                      )} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>

            {/* Mobile Footer */}
            <div className="border-t border-border/50 p-4 space-y-3 bg-gradient-to-r from-purple-100/30 to-pink-100/30 dark:from-purple-800/30 dark:to-pink-800/30">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start border-purple-300/50 dark:border-purple-600/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Light Mode
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start border-red-300/50 dark:border-red-600/50 hover:border-red-400/50 dark:hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col border-r border-border/50 bg-gradient-to-br from-slate-100/80 to-gray-100/80 dark:from-slate-800/80 dark:to-gray-800/80 backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-800/30 dark:to-indigo-800/30">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-blue-900 dark:text-blue-100">GuardianAI</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-blue-200/50 dark:hover:bg-blue-700/50"
          >
            <ChevronUp className={cn(
              "h-4 w-4 transition-transform text-blue-600 dark:text-blue-400",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4 bg-gradient-to-br from-slate-50/30 to-gray-50/30 dark:from-slate-700/30 dark:to-gray-700/30">
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
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/50"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-white" : "text-blue-600 dark:text-blue-400"
                  )} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="border-t border-border/50 p-4 space-y-3 bg-gradient-to-r from-purple-100/30 to-pink-100/30 dark:from-purple-800/30 dark:to-pink-800/30">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "w-full justify-start border-purple-300/50 dark:border-purple-600/50 hover:border-purple-400/50 dark:hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300",
              isCollapsed && "w-10 px-0"
            )}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {!isCollapsed && <span className="ml-2">Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {!isCollapsed && <span className="ml-2">Light Mode</span>}
              </>
            )}
          </Button>

          {/* User Profile */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/50 dark:to-blue-900/50 border border-indigo-200/30 dark:border-indigo-600/30",
            isCollapsed && "justify-center"
          )}>
            {userData?.clerkData?.imageUrl || clerkUser?.imageUrl ? (
              <img 
                src={userData?.clerkData?.imageUrl || clerkUser?.imageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 dark:from-indigo-400/20 dark:to-blue-400/20 rounded-full flex items-center justify-center border border-indigo-300/30 dark:border-indigo-500/30">
                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 truncate">
                  {userData?.clerkData?.firstName || clerkUser?.firstName || 'User'}
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 truncate">
                  {userData?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'user@example.com'}
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
              "w-full justify-start border-red-300/50 dark:border-red-600/50 hover:border-red-400/50 dark:hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300",
              isCollapsed && "w-10 px-0"
            )}
          >
            <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
} 