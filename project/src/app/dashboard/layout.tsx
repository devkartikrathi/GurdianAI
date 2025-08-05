import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Upload, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Upload Trades', href: '/dashboard/upload', icon: Upload },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
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
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-4 py-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </nav>
      {/* Main content */}
      <main className="flex-1 p-8 bg-background min-h-screen">
        {children}
      </main>
    </div>
  )
}