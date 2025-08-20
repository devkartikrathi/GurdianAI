import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService } from '@/lib/broker-integration/zerodha-service'

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

        // Get broker connections
        const brokerConnections = await prisma.brokerConnection.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: brokerConnections
        })

    } catch (error) {
        console.error('Broker connections fetch error:', error)
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
            brokerName,
            apiKey,
            apiSecret,
            accessToken,
            refreshToken,
            isActive
        } = body

        // Validate required fields
        if (!brokerName || !apiKey || !apiSecret) {
            return NextResponse.json({
                error: 'Broker name, API key, and API secret are required'
            }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if broker connection already exists
        const existingConnection = await prisma.brokerConnection.findFirst({
            where: {
                userId: user.id,
                brokerName: brokerName.toLowerCase()
            }
        })

        // Create or update broker connection
        let brokerConnection;

        if (existingConnection) {
            // Update existing connection
            brokerConnection = await prisma.brokerConnection.update({
                where: { id: existingConnection.id },
                data: {
                    apiKey: body.apiKey,
                    apiSecret: body.apiSecret,
                    connectionStatus: body.isActive ? 'active' : 'inactive',
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new connection - always start as pending for OAuth
            brokerConnection = await prisma.brokerConnection.create({
                data: {
                    userId: user.id,
                    brokerName: body.brokerName,
                    apiKey: body.apiKey,
                    apiSecret: body.apiSecret,
                    connectionStatus: 'pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }

        // For Zerodha, generate login URL for OAuth with our callback route
        let responseData: any = {
            message: 'Broker connection saved successfully',
            data: brokerConnection
        }

        if (body.brokerName === 'zerodha') {
            try {
                const zerodhaService = createZerodhaService({
                    apiKey: body.apiKey,
                    apiSecret: body.apiSecret
                })

                // Generate the login URL with our callback route
                const baseLoginUrl = zerodhaService.generateLoginUrl()
                const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/zerodha`
                const loginUrl = `${baseLoginUrl}&redirect_uri=${encodeURIComponent(callbackUrl)}`

                responseData.data.loginUrl = loginUrl
                responseData.data.connectionId = brokerConnection.id
                responseData.data.callbackUrl = callbackUrl
            } catch (error) {
                console.error('Error generating Zerodha login URL:', error)
                // Continue without login URL - user can still save connection
            }
        }

        return NextResponse.json(responseData)

    } catch (error) {
        console.error('Broker connection update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('id')

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

        // Delete the broker connection
        await prisma.brokerConnection.deleteMany({
            where: {
                id: connectionId,
                userId: user.id
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Broker connection deleted successfully'
        })

    } catch (error) {
        console.error('Broker connection deletion error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
