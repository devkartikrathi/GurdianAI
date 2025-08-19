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

        // Get user's matched trades
        const trades = await prisma.matchedTrade.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        if (trades.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    topPerformers: [],
                    worstPerformers: [],
                    mostTraded: [],
                    symbolAnalysis: []
                }
            })
        }

        // Group trades by symbol
        const symbolGroups = trades.reduce((acc, trade) => {
            if (!acc[trade.symbol]) {
                acc[trade.symbol] = []
            }
            acc[trade.symbol].push(trade)
            return acc
        }, {} as Record<string, typeof trades>)

        // Analyze each symbol
        const symbolAnalysis = Object.entries(symbolGroups).map(([symbol, symbolTrades]) => {
            const totalTrades = symbolTrades.length
            const winningTrades = symbolTrades.filter(trade => Number(trade.pnl) > 0).length
            const losingTrades = symbolTrades.filter(trade => Number(trade.pnl) < 0).length
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
            const totalPnl = symbolTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
            const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0
            const grossProfit = symbolTrades.filter(trade => Number(trade.pnl) > 0).reduce((sum, trade) => sum + Number(trade.pnl), 0)
            const grossLoss = Math.abs(symbolTrades.filter(trade => Number(trade.pnl) < 0).reduce((sum, trade) => sum + Number(trade.pnl), 0))
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0

            // Calculate average trade duration
            const totalDuration = symbolTrades.reduce((sum, trade) => {
                const duration = new Date(trade.sellDate).getTime() - new Date(trade.buyDate).getTime()
                return sum + duration
            }, 0)
            const avgDuration = totalTrades > 0 ? totalDuration / totalTrades / (1000 * 60 * 60) : 0 // in hours

            return {
                symbol,
                totalTrades,
                winningTrades,
                losingTrades,
                winRate: Math.round(winRate * 100) / 100,
                totalPnl: Math.round(totalPnl * 100) / 100,
                avgPnl: Math.round(avgPnl * 100) / 100,
                grossProfit: Math.round(grossProfit * 100) / 100,
                grossLoss: Math.round(grossLoss * 100) / 100,
                profitFactor: Math.round(profitFactor * 100) / 100,
                avgDuration: Math.round(avgDuration * 10) / 10,
                performance: Math.round((totalPnl / Math.abs(totalPnl + grossLoss)) * 100) / 100
            }
        })

        // Sort by different metrics
        const topPerformers = [...symbolAnalysis]
            .sort((a, b) => b.totalPnl - a.totalPnl)
            .slice(0, 5)

        const worstPerformers = [...symbolAnalysis]
            .sort((a, b) => a.totalPnl - b.totalPnl)
            .slice(0, 5)

        const mostTraded = [...symbolAnalysis]
            .sort((a, b) => b.totalTrades - a.totalTrades)
            .slice(0, 5)

        return NextResponse.json({
            success: true,
            data: {
                topPerformers,
                worstPerformers,
                mostTraded,
                symbolAnalysis
            }
        })

    } catch (error) {
        console.error('Symbol analysis error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 