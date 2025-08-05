"use client"

import { useUserSync } from '@/hooks/useUserSync'

interface UserSyncWrapperProps {
  children: React.ReactNode
}

export function UserSyncWrapper({ children }: UserSyncWrapperProps) {
  const { loading, error } = useUserSync()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading user data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading user data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 