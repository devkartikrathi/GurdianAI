import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService } from '@/lib/broker-integration/zerodha-service'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params
        const body = await request.json()
        const { brokerName, apiKey, apiSecret } = body

        // Validate required fields
        if (!brokerName || !apiKey || !apiSecret) {
            return NextResponse.json({
                error: 'Broker name, API key, and API secret are required'
            }, { status: 400 })
        }

        // Check if the broker connection exists and belongs to the user
        const existingConnection = await prisma.brokerConnection.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if (!existingConnection) {
            return NextResponse.json({ error: 'Broker connection not found' }, { status: 404 })
        }

        // Update the broker connection
        const updatedConnection = await prisma.brokerConnection.update({
            where: { id },
            data: {
                apiKey,
                apiSecret,
                connectionStatus: 'pending',
                accessToken: null,
                requestToken: null,
                userIdZerodha: null,
                userName: null,
                email: null,
                sessionGeneratedAt: null,
                expiresAt: null,
                lastSyncAt: null,
                oauthAction: null,
                oauthStatus: null,
                oauthType: null,
                oauthCompletedAt: null
            }
        })

        // Generate login URL for Zerodha
        let loginUrl = null
        if (brokerName === 'zerodha') {
            try {
                const zerodhaService = createZerodhaService({
                    apiKey,
                    apiSecret
                })
                loginUrl = zerodhaService.generateLoginUrl()
            } catch (error) {
                console.error('Error generating Zerodha login URL:', error)
                return NextResponse.json({
                    error: 'Failed to generate Zerodha login URL'
                }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                connectionId: updatedConnection.id,
                loginUrl,
                message: 'Broker connection updated successfully. Please complete OAuth authentication.'
            }
        })

    } catch (error) {
        console.error('Error updating broker connection:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params

        // Check if the broker connection exists and belongs to the user
        const existingConnection = await prisma.brokerConnection.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if (!existingConnection) {
            return NextResponse.json({ error: 'Broker connection not found' }, { status: 404 })
        }

        // Delete the broker connection
        await prisma.brokerConnection.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Broker connection deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting broker connection:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}
