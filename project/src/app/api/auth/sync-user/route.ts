import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const clerkUserId = clerkUser.id
        const email = clerkUser.primaryEmailAddress?.emailAddress || ''
        const firstName = clerkUser.firstName || ''
        const lastName = clerkUser.lastName || ''
        const name = `${firstName} ${lastName}`.trim() || 'User'

        // First try to find user by clerkUserId
        let user = await prisma.user.findUnique({
            where: { clerkUserId }
        })

        // If not found by clerkUserId, try by email
        if (!user && email) {
            user = await prisma.user.findUnique({
                where: { email }
            })

            // If found by email but with different clerkUserId, update it
            if (user && user.clerkUserId !== clerkUserId) {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        clerkUserId,
                        name: name || user.name
                    }
                })
            }
        }

        // If still no user found, create a new one
        if (!user) {
            try {
                user = await prisma.user.create({
                    data: {
                        clerkUserId,
                        email: email || '',
                        name: name || '',
                        totalCapital: 100000,
                        riskPerTradePct: 1.0,
                        maxDailyDrawdownPct: 2.0,
                        maxConsecutiveLosses: 3
                    }
                })
            } catch (createError: any) {
                // Handle race condition where user might have been created by another request
                if (createError.code === 'P2002') {
                    // Try to find the user again
                    user = await prisma.user.findUnique({
                        where: { clerkUserId }
                    })

                    if (!user) {
                        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
                    }
                } else {
                    throw createError
                }
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                totalCapital: user.totalCapital,
                riskPerTradePct: user.riskPerTradePct,
                maxDailyDrawdownPct: user.maxDailyDrawdownPct,
                maxConsecutiveLosses: user.maxConsecutiveLosses
            }
        })

    } catch (error) {
        console.error('User sync error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET - Fetch current user data
export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()

        if (!clerkUser) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const clerkUserId = clerkUser.id
        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                clerkData: {
                    id: clerkUser.id,
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    username: clerkUser.username,
                    imageUrl: clerkUser.imageUrl
                }
            }
        })

    } catch (error) {
        console.error('User fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 