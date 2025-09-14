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
        const { connectionId, requestToken, action, status, type } = body

        if (!connectionId || !requestToken) {
            return NextResponse.json({
                error: 'Connection ID and request token are required'
            }, { status: 400 })
        }

        // Handle redirect URL parameters if they exist

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
                error: 'OAuth is only supported for Zerodha connections'
            }, { status: 400 })
        }

        try {
            // Create Zerodha service with API credentials
            const zerodhaService = createZerodhaService({
                apiKey: brokerConnection.apiKey,
                apiSecret: brokerConnection.apiSecret || '',
            })

            // Exchange request token for access token
            const session = await zerodhaService.generateSession(requestToken)

            // Update the broker connection with access token and user info
            await prisma.brokerConnection.update({
                where: { id: connectionId },
                data: {
                    accessToken: session.accessToken,
                    userIdZerodha: session.profile.userId,
                    userName: session.profile.userName,
                    email: session.profile.email,
                    connectionStatus: 'active',
                    lastSyncAt: new Date(),
                    expiresAt: session.expiresAt,
                    // Store OAuth callback parameters for reference
                    oauthAction: action,
                    oauthStatus: status,
                    oauthType: type,
                    oauthCompletedAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                message: 'OAuth authentication completed successfully',
                data: {
                    userName: session.profile.userName,
                    userId: session.profile.userId,
                    email: session.profile.email,
                    expiresAt: session.expiresAt
                }
            })

        } catch (error) {
            console.error('Zerodha OAuth failed:', error)

            // Update connection status to error
            await prisma.brokerConnection.update({
                where: { id: connectionId },
                data: {
                    connectionStatus: 'error',
                    lastSyncAt: new Date()
                }
            })

            return NextResponse.json({
                error: 'OAuth authentication failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 400 })
        }

    } catch (error) {
        console.error('Broker OAuth error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
