import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { UserSyncWrapper } from '@/components/user-sync-wrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Temporarily disable onboarding check to fix infinite redirect
  // TODO: Re-enable once database is properly set up
  /*
  try {
    const dbUser = await UserService.getUserByClerkId(user.id)
    
    if (!dbUser || (!dbUser.totalCapital && !dbUser.riskPerTradePct)) {
      redirect('/onboarding')
    }
  } catch (error) {
    console.error('Error checking user onboarding status:', error)
  }
  */

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto w-full bg-transparent">
          <UserSyncWrapper>
            {children}
          </UserSyncWrapper>
        </main>
      </div>
    </div>
  )
}