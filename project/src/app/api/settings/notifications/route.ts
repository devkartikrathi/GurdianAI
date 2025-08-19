import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get or create notification preferences
        let notificationPrefs = await prisma.notificationPreferences.findUnique({
            where: { userId: user.id }
        })

        if (!notificationPrefs) {
            // Create default notification preferences
            notificationPrefs = await prisma.notificationPreferences.create({
                data: {
                    userId: user.id,
                    riskAlerts: true,
                    dailyDigest: true,
                    weeklyReport: false,
                    tradeNotifications: true,
                    performanceAlerts: true,
                    emailNotifications: true,
                    pushNotifications: true
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: notificationPrefs
        })

    } catch (error) {
        console.error('Notification preferences fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            riskAlerts,
            dailyDigest,
            weeklyReport,
            tradeNotifications,
            performanceAlerts,
            emailNotifications,
            pushNotifications
        } = body

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update or create notification preferences
        const updatedPrefs = await prisma.notificationPreferences.upsert({
            where: { userId: user.id },
            update: {
                riskAlerts: Boolean(riskAlerts),
                dailyDigest: Boolean(dailyDigest),
                weeklyReport: Boolean(weeklyReport),
                tradeNotifications: Boolean(tradeNotifications),
                performanceAlerts: Boolean(performanceAlerts),
                emailNotifications: Boolean(emailNotifications),
                pushNotifications: Boolean(pushNotifications)
            },
            create: {
                userId: user.id,
                riskAlerts: Boolean(riskAlerts),
                dailyDigest: Boolean(dailyDigest),
                weeklyReport: Boolean(weeklyReport),
                tradeNotifications: Boolean(tradeNotifications),
                performanceAlerts: Boolean(performanceAlerts),
                emailNotifications: Boolean(emailNotifications),
                pushNotifications: Boolean(pushNotifications)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Notification preferences updated successfully',
            data: updatedPrefs
        })

    } catch (error) {
        console.error('Notification preferences update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
