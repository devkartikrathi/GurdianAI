import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const brokerConnectionId = searchParams.get('brokerConnectionId')

        if (!brokerConnectionId) {
            return NextResponse.json({ error: 'Broker connection ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify the broker connection belongs to the user
        const brokerConnection = await prisma.brokerConnection.findFirst({
            where: {
                id: brokerConnectionId,
                userId: user.id
            },
            select: { id: true }
        })

        if (!brokerConnection) {
            return NextResponse.json({ error: 'Broker connection not found' }, { status: 404 })
        }

        // Fetch daily trades for this broker connection
        const dailyTrades = await prisma.dailyTrades.findMany({
            where: {
                userId: user.id,
                brokerConnectionId: brokerConnectionId
            },
            orderBy: {
                tradeDate: 'desc'
            },
            take: 30 // Last 30 days
        })

        return NextResponse.json({
            success: true,
            data: dailyTrades
        })

    } catch (error) {
        console.error('Daily trades API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
