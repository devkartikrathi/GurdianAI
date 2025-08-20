import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService } from '@/lib/broker-integration/zerodha-service'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { connectionId } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get the broker connection
        const brokerConnection = await prisma.brokerConnection.findFirst({
            where: {
                id: connectionId,
                userId: user.id
            }
        })

        if (!brokerConnection) {
            return NextResponse.json({ error: 'Broker connection not found' }, { status: 404 })
        }

        if (brokerConnection.brokerName !== 'zerodha') {
            return NextResponse.json({
                error: 'Re-authentication is only supported for Zerodha connections'
            }, { status: 400 })
        }

        try {
            // Clear expired tokens and reset connection status
            await prisma.brokerConnection.update({
                where: { id: connectionId },
                data: {
                    accessToken: null,
                    connectionStatus: 'pending',
                    updatedAt: new Date()
                }
            })

            // Generate new login URL
            const zerodhaService = createZerodhaService({
                apiKey: brokerConnection.apiKey,
                apiSecret: brokerConnection.apiSecret || ''
            })

            const loginUrl = zerodhaService.generateLoginUrl()

            return NextResponse.json({
                success: true,
                message: 'Re-authentication initiated successfully',
                data: {
                    loginUrl,
                    connectionId,
                    requiresOAuth: true
                }
            })

        } catch (error) {
            console.error('Zerodha re-authentication failed:', error)

            return NextResponse.json({
                error: 'Failed to initiate re-authentication',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Broker re-authentication error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
