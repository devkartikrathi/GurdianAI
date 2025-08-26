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

        const { searchParams } = new URL(request.url)
        const includeClosed = searchParams.get('includeClosed') === 'true'
        const symbol = searchParams.get('symbol')
        const isInvestment = searchParams.get('isInvestment')

        // Build where clause
        const where: any = { userId: user.id }

        if (symbol) {
            where.symbol = symbol
        }

        if (isInvestment !== null) {
            where.isInvestment = isInvestment === 'true'
        }

        if (!includeClosed) {
            where.isManuallyClosed = false
        }

        const openTrades = await prisma.openTrade.findMany({
            where,
            orderBy: [
                { isManuallyClosed: 'asc' }, // Active positions first
                { lastUpdated: 'desc' }
            ]
        })

        return NextResponse.json({
            success: true,
            data: {
                openTrades,
                total: openTrades.length,
                active: openTrades.filter(t => !t.isManuallyClosed).length,
                closed: openTrades.filter(t => t.isManuallyClosed).length,
                investments: openTrades.filter(t => t.isInvestment && !t.isManuallyClosed).length
            }
        })

    } catch (error) {
        console.error('Error fetching open trades:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { action, tradeId, ...data } = body

        if (!action || !tradeId) {
            return NextResponse.json({ error: 'Action and tradeId are required' }, { status: 400 })
        }

        // Verify the trade belongs to the user
        const existingTrade = await prisma.openTrade.findFirst({
            where: {
                id: tradeId,
                userId: user.id
            }
        })

        if (!existingTrade) {
            return NextResponse.json({ error: 'Open trade not found' }, { status: 404 })
        }

        let result

        switch (action) {
            case 'markInvestment':
                result = await prisma.openTrade.update({
                    where: { id: tradeId },
                    data: {
                        isInvestment: data.isInvestment,
                        notes: data.notes || existingTrade.notes,
                        lastUpdated: new Date()
                    }
                })
                break

            case 'closePosition':
                result = await prisma.openTrade.update({
                    where: { id: tradeId },
                    data: {
                        isManuallyClosed: true,
                        manualCloseDate: new Date(),
                        manualCloseReason: data.reason || 'Manually closed by user',
                        notes: data.notes || existingTrade.notes,
                        lastUpdated: new Date()
                    }
                })
                break

            case 'reopenPosition':
                result = await prisma.openTrade.update({
                    where: { id: tradeId },
                    data: {
                        isManuallyClosed: false,
                        manualCloseDate: null,
                        manualCloseReason: null,
                        notes: data.notes || existingTrade.notes,
                        lastUpdated: new Date()
                    }
                })
                break

            case 'updateNotes':
                result = await prisma.openTrade.update({
                    where: { id: tradeId },
                    data: {
                        notes: data.notes,
                        lastUpdated: new Date()
                    }
                })
                break

            case 'deletePosition':
                // Only allow deletion of manually closed positions
                if (!existingTrade.isManuallyClosed) {
                    return NextResponse.json({
                        error: 'Cannot delete active positions. Close them first.'
                    }, { status: 400 })
                }

                await prisma.openTrade.delete({
                    where: { id: tradeId }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Position deleted successfully'
                })

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: `Position ${action.replace(/([A-Z])/g, ' $1').toLowerCase()} successfully`,
            data: result
        })

    } catch (error) {
        console.error('Error managing open trade:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
