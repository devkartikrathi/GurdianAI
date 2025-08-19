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

        // Get today's date in user's timezone
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

        // Get today's trades
        const todayTrades = await prisma.matchedTrade.findMany({
            where: {
                userId: user.id,
                OR: [
                    {
                        buyDate: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    },
                    {
                        sellDate: {
                            gte: startOfDay,
                            lt: endOfDay
                        }
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }
        })

        // Get today's raw trades (unmatched)
        const todayRawTrades = await prisma.rawTrade.findMany({
            where: {
                userId: user.id,
                tradeDatetime: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate today's metrics
        const todayPnL = todayTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
        const todayWinningTrades = todayTrades.filter(trade => Number(trade.pnl) > 0).length
        const todayTotalTrades = todayTrades.length
        const todayWinRate = todayTotalTrades > 0 ? (todayWinningTrades / todayTotalTrades) * 100 : 0

        // Get recent trades for activity feed
        const recentTrades = await prisma.matchedTrade.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: {
                    select: { name: true }
                }
            }
        })

        // Get recent uploads
        const recentUploads = await prisma.tradeBook.findMany({
            where: { userId: user.id },
            orderBy: { uploadTimestamp: 'desc' },
            take: 5
        })

        // Calculate risk status
        let riskStatus = 'green'
        let riskMessage = 'All systems normal'

        if (todayPnL < -10000) {
            riskStatus = 'red'
            riskMessage = 'High daily loss - consider stopping'
        } else if (todayPnL < -5000) {
            riskStatus = 'amber'
            riskMessage = 'Approaching daily loss limit'
        }

        // Calculate session duration (mock for now - would need real session tracking)
        const sessionStart = new Date(today.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
        const sessionDuration = Math.floor((today.getTime() - sessionStart.getTime()) / (1000 * 60))

        // Get max drawdown from recent trades
        let maxDrawdown = 0
        let maxDrawdownPct = 0
        let peak = 0
        let runningTotal = 0

        const recentTradesForDrawdown = await prisma.matchedTrade.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        recentTradesForDrawdown.forEach(trade => {
            runningTotal += Number(trade.pnl)
            if (runningTotal > peak) {
                peak = runningTotal
            }
            const drawdown = peak - runningTotal
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown
            }
        })

        // Calculate max drawdown percentage based on the peak value
        maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0

        // Generate activity feed
        const activityFeed: Array<{
            type: string;
            title: string;
            description: string;
            status: string;
            timestamp: Date;
            icon: string;
        }> = []

        // Add recent trades
        recentTrades.slice(0, 3).forEach(trade => {
            const isWin = Number(trade.pnl) > 0
            activityFeed.push({
                type: 'trade',
                title: `${isWin ? 'Profitable' : 'Loss'} trade on ${trade.symbol}`,
                description: `${trade.quantity} shares ${isWin ? 'gained' : 'lost'} ₹${Math.abs(Number(trade.pnl)).toFixed(2)}`,
                status: isWin ? 'success' : 'warning',
                timestamp: trade.createdAt,
                icon: isWin ? 'CheckCircle' : 'AlertTriangle'
            })
        })

        // Add recent uploads
        recentUploads.slice(0, 2).forEach(upload => {
            activityFeed.push({
                type: 'upload',
                title: 'Trade data uploaded',
                description: `${upload.totalRows} trades processed from ${upload.fileName}`,
                status: 'primary',
                timestamp: upload.uploadTimestamp,
                icon: 'Database'
            })
        })

        // Sort activity feed by timestamp
        activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        return NextResponse.json({
            success: true,
            data: {
                today: {
                    pnl: Math.round(todayPnL * 100) / 100,
                    totalTrades: todayTotalTrades,
                    winRate: Math.round(todayWinRate * 100) / 100,
                    sessionDuration: `${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m`
                },
                risk: {
                    status: riskStatus,
                    message: riskMessage,
                    maxDrawdown: Math.round(maxDrawdownPct * 100) / 100
                },
                activity: activityFeed,
                summary: {
                    totalTrades: recentTradesForDrawdown.length,
                    totalPnL: recentTradesForDrawdown.reduce((sum, trade) => sum + Number(trade.pnl), 0)
                }
            }
        })

    } catch (error) {
        console.error('Dashboard overview error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
