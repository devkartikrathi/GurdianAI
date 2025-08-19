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
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalPnl: 0,
          grossProfit: 0,
          grossLoss: 0,
          netProfit: 0,
          averageWin: 0,
          averageLoss: 0,
          profitFactor: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          tradesByMonth: [],
          pnlByMonth: []
        }
      })
    }

    // Calculate performance metrics
    const totalTrades = trades.length
    const winningTrades = trades.filter(trade => Number(trade.pnl) > 0).length
    const losingTrades = trades.filter(trade => Number(trade.pnl) < 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
    const grossProfit = trades.filter(trade => Number(trade.pnl) > 0).reduce((sum, trade) => sum + Number(trade.pnl), 0)
    const grossLoss = Math.abs(trades.filter(trade => Number(trade.pnl) < 0).reduce((sum, trade) => sum + Number(trade.pnl), 0))
    const netProfit = grossProfit - grossLoss

    const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0
    const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0

    // Calculate max drawdown
    let maxDrawdown = 0
    let maxDrawdownPct = 0
    let peak = 0
    let runningTotal = 0

    trades.forEach(trade => {
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

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(trade => Number(trade.pnl))
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0

    // Group trades by month
    const tradesByMonth = trades.reduce((acc, trade) => {
      const month = trade.buyDate.toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const pnlByMonth = trades.reduce((acc, trade) => {
      const month = trade.buyDate.toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + Number(trade.pnl)
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: Math.round(winRate * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossLoss: Math.round(grossLoss * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        averageWin: Math.round(averageWin * 100) / 100,
        averageLoss: Math.round(averageLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
        maxDrawdown: Math.round(maxDrawdownPct * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        tradesByMonth: Object.entries(tradesByMonth).map(([month, count]) => ({ month, count })),
        pnlByMonth: Object.entries(pnlByMonth).map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }))
      }
    })

  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 