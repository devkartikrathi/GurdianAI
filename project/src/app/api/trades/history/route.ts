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
            where: { clerkUserId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get trade books with raw trades
        const tradeBooks = await prisma.tradeBook.findMany({
            where: { userId: user.id },
            include: {
                rawTrades: {
                    orderBy: { tradeDatetime: 'desc' }
                }
            },
            orderBy: { uploadTimestamp: 'desc' }
        })

        // Get matched trades
        const matchedTrades = await prisma.matchedTrade.findMany({
            where: { userId: user.id },
            include: {
                buyRawTrade: true,
                sellRawTrade: true
            },
            orderBy: { sellDate: 'desc' }
        })

        // Get open positions
        const openPositions = await prisma.openTrade.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' }
        })

        // Calculate summary statistics
        const totalUploads = tradeBooks.length
        const totalRawTrades = tradeBooks.reduce((sum, book) => sum + book.rawTrades.length, 0)
        const totalMatchedTrades = matchedTrades.length
        const totalOpenPositions = openPositions.length

        // Calculate total P&L from matched trades
        const totalPnl = matchedTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)

        // Calculate win rate
        const winningTrades = matchedTrades.filter(trade => Number(trade.pnl) > 0)
        const winRate = totalMatchedTrades > 0 ? (winningTrades.length / totalMatchedTrades) * 100 : 0

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalUploads,
                    totalRawTrades,
                    totalMatchedTrades,
                    totalOpenPositions,
                    totalPnl: parseFloat(totalPnl.toFixed(2)),
                    winRate: parseFloat(winRate.toFixed(2))
                },
                tradeBooks,
                matchedTrades,
                openPositions
            }
        })

    } catch (error) {
        console.error('Error fetching trades history:', error)
        return NextResponse.json({ error: 'Failed to fetch trades history' }, { status: 500 })
    }
}
