import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { UserService } from '@/lib/user-service'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            email,
            experience,
            totalCapital,
            riskPerTradePct,
            maxDailyDrawdownPct,
            maxConsecutiveLosses
        } = body

        // Validate required fields
        if (!name || !email || !totalCapital || !riskPerTradePct) {
            return NextResponse.json({
                error: 'Missing required fields'
            }, { status: 400 })
        }

        // Update user profile with onboarding data
        const updateData: any = {
            name,
            email,
            totalCapital: parseFloat(totalCapital),
            riskPerTradePct: parseFloat(riskPerTradePct),
            maxDailyDrawdownPct: maxDailyDrawdownPct ? parseFloat(maxDailyDrawdownPct) : 10,
            maxConsecutiveLosses: maxConsecutiveLosses ? parseInt(maxConsecutiveLosses) : 5
        }

        // Check if user exists
        const existingUser = await UserService.getUserByClerkId(clerkUser.id)

        let updatedUser
        if (existingUser) {
            updatedUser = await UserService.updateUser(clerkUser.id, updateData)
        } else {
            updatedUser = await UserService.createUser({
                clerkUserId: clerkUser.id,
                email,
                name,
                totalCapital: parseFloat(totalCapital),
                riskPerTradePct: parseFloat(riskPerTradePct),
                maxDailyDrawdownPct: maxDailyDrawdownPct ? parseFloat(maxDailyDrawdownPct) : 10,
                maxConsecutiveLosses: maxConsecutiveLosses ? parseInt(maxConsecutiveLosses) : 5
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully',
            data: updatedUser
        })

    } catch (error) {
        console.error('Onboarding error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await UserService.getUserByClerkId(clerkUser.id)

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: user
        })

    } catch (error) {
        console.error('Onboarding fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 