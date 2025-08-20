import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService, validateZerodhaCredentials } from '@/lib/broker-integration/zerodha-service'

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

        // Validate credentials format
        const isValid = validateZerodhaCredentials({
            apiKey: brokerConnection.apiKey,
            apiSecret: brokerConnection.apiSecret || ''
        })

        if (!isValid) {
            return NextResponse.json({
                error: 'Invalid credentials format',
                details: 'API key and secret format validation failed'
            }, { status: 400 })
        }

        // Test the connection based on broker type
        if (brokerConnection.brokerName === 'zerodha') {
            // Check if we have an access token
            if (!brokerConnection.accessToken) {
                return NextResponse.json({
                    error: 'OAuth authentication required',
                    details: 'Please complete OAuth authentication before testing the connection. Click "Add Broker" again to start the OAuth process.',
                    requiresOAuth: true
                }, { status: 400 })
            }

            try {
                const zerodhaService = createZerodhaService({
                    apiKey: brokerConnection.apiKey,
                    apiSecret: brokerConnection.apiSecret || '',
                    accessToken: brokerConnection.accessToken
                })

                // Test connection by fetching profile
                const profile = await zerodhaService.testConnection()

                // Update connection status and user info
                await prisma.brokerConnection.update({
                    where: { id: connectionId },
                    data: {
                        connectionStatus: 'active',
                        userIdZerodha: profile.userId,
                        userName: profile.userName,
                        email: profile.email,
                        lastSyncAt: new Date()
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Connection test successful',
                    data: {
                        userName: profile.userName,
                        userId: profile.userId,
                        email: profile.email,
                        broker: profile.broker
                    }
                })
            } catch (error) {
                console.error('Zerodha connection test failed:', error)

                // Check if it's a token expiration error
                let errorMessage = 'Connection test failed'
                let requiresReauth = false

                if (error && typeof error === 'object' && 'message' in error) {
                    const errorObj = error as any
                    if (errorObj.message?.includes('Invalid') || errorObj.message?.includes('expired')) {
                        errorMessage = 'Access token has expired. Please re-authenticate with Zerodha.'
                        requiresReauth = true
                    }
                }

                // Update connection status to error
                await prisma.brokerConnection.update({
                    where: { id: connectionId },
                    data: {
                        connectionStatus: 'error',
                        lastSyncAt: new Date()
                    }
                })

                return NextResponse.json({
                    error: errorMessage,
                    details: error instanceof Error ? error.message : 'Unknown error',
                    requiresReauth
                }, { status: 400 })
            }
        } else {
            // For other brokers, just validate the credentials format
            await prisma.brokerConnection.update({
                where: { id: connectionId },
                data: {
                    connectionStatus: 'active',
                    lastSyncAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Credentials validated successfully',
                data: {
                    brokerName: brokerConnection.brokerName,
                    status: 'active'
                }
            })
        }

    } catch (error) {
        console.error('Broker connection test error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
