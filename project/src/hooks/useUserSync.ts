import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface UserData {
    id: string
    clerkUserId: string
    email: string
    name: string
    totalCapital: number
    maxDailyDrawdownPct: number
    maxConsecutiveLosses: number
    riskPerTradePct: number
    createdAt: string
    updatedAt: string
    clerkData?: {
        id: string
        email: string
        firstName: string
        lastName: string
        username: string
        imageUrl: string
    }
}

interface UseUserSyncReturn {
    user: UserData | null
    loading: boolean
    error: string | null
    syncUser: () => Promise<void>
    refreshUser: () => Promise<void>
}

export function useUserSync(): UseUserSyncReturn {
    const { isLoaded, isSignedIn, user: clerkUser } = useUser()
    const [user, setUser] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const syncUser = async () => {
        if (!isSignedIn || !clerkUser) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/sync-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to sync user')
            }

            const data = await response.json()
            setUser(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sync user')
            console.error('User sync error:', err)
        } finally {
            setLoading(false)
        }
    }

    const refreshUser = async () => {
        if (!isSignedIn || !clerkUser) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch user profile')
            }

            const data = await response.json()
            setUser(data.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user profile')
            console.error('User fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    // Auto-sync user when they sign in
    useEffect(() => {
        if (isLoaded && isSignedIn && clerkUser) {
            syncUser()
        } else if (isLoaded && !isSignedIn) {
            setUser(null)
            setError(null)
        }
    }, [isLoaded, isSignedIn, clerkUser])

    return {
        user,
        loading,
        error,
        syncUser,
        refreshUser,
    }
} 