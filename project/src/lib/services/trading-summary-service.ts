import { prisma } from '@/lib/prisma'

export interface TradingSummaryData {
  // Overall Performance Metrics
  totalTrades: number
  totalBuyTrades: number
  totalSellTrades: number
  totalVolume: number
  totalValue: number
  
  // P&L Analysis
  totalPnL: number
  totalPnLPct: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  
  // Risk Metrics
  maxDrawdown: number
  maxDrawdownPct: number
  sharpeRatio: number
  volatility: number
  
  // Time-based Analysis
  tradingDays: number
  averageTradesPerDay: number
  bestDay: { date: string; pnl: number }
  worstDay: { date: string; pnl: number }
  
  // Symbol Analysis
  topSymbols: Array<{ symbol: string; trades: number; pnl: number; volume: number }>
  symbolPerformance: Array<{ symbol: string; winRate: number; avgPnL: number; totalPnL: number }>
  
  // Position Analysis
  openPositions: number
  totalOpenValue: number
  unrealizedPnL: number
  
  // Behavioral Analysis
  averageHoldingPeriod: number
  mostActiveHour: number
  mostActiveDay: string
  consecutiveWins: number
  consecutiveLosses: number
  
  // Monthly/Weekly Breakdowns
  monthlyPerformance: Array<{ month: string; trades: number; pnl: number; volume: number }>
  weeklyPerformance: Array<{ week: string; trades: number; pnl: number; volume: number }>
  
  // Index signature for JSON compatibility
  [key: string]: any
}

export interface TradingSummaryOptions {
    userId: string
    startDate?: Date
    endDate?: Date
    includeOpenPositions?: boolean
    includeBehavioralAnalysis?: boolean
}

export class TradingSummaryService {

    /**
     * Generate comprehensive trading summary for a user
     */
    static async generateSummary(options: TradingSummaryOptions): Promise<TradingSummaryData> {
        const { userId, startDate, endDate, includeOpenPositions = true, includeBehavioralAnalysis = true } = options

        // Set default date range if not provided
        const start = startDate || new Date(0) // Beginning of time
        const end = endDate || new Date() // Now

        console.log(`Generating trading summary for user ${userId} from ${start.toISOString()} to ${end.toISOString()}`)

        try {
            // Get all matched trades in date range
            const matchedTrades = await prisma.matchedTrade.findMany({
                where: {
                    userId,
                    OR: [
                        { buyDate: { gte: start, lte: end } },
                        { sellDate: { gte: start, lte: end } }
                    ]
                },
                orderBy: { buyDate: 'asc' }
            })

            // Get all raw trades in date range
            const rawTrades = await prisma.rawTrade.findMany({
                where: {
                    userId,
                    tradeDatetime: { gte: start, lte: end }
                },
                orderBy: { tradeDatetime: 'asc' }
            })

            // Get open positions if requested
            const openPositions = includeOpenPositions ? await prisma.openTrade.findMany({
                where: { userId }
            }) : []

            // Calculate basic metrics
            const basicMetrics = this.calculateBasicMetrics(matchedTrades, rawTrades)

            // Calculate P&L analysis
            const pnlAnalysis = this.calculatePnLAnalysis(matchedTrades)

            // Calculate risk metrics
            const riskMetrics = this.calculateRiskMetrics(matchedTrades)

            // Calculate time-based analysis
            const timeAnalysis = this.calculateTimeAnalysis(matchedTrades, rawTrades)

            // Calculate symbol analysis
            const symbolAnalysis = this.calculateSymbolAnalysis(matchedTrades, rawTrades)

            // Calculate position analysis
            const positionAnalysis = this.calculatePositionAnalysis(openPositions)

            // Calculate behavioral analysis
            const behavioralAnalysis = includeBehavioralAnalysis ?
                this.calculateBehavioralAnalysis(matchedTrades, rawTrades) :
                { averageHoldingPeriod: 0, mostActiveHour: 0, mostActiveDay: '', consecutiveWins: 0, consecutiveLosses: 0 }

            // Calculate monthly/weekly breakdowns
            const monthlyPerformance = this.calculateMonthlyPerformance(matchedTrades, start, end)
            const weeklyPerformance = this.calculateWeeklyPerformance(matchedTrades, start, end)

            const summary: TradingSummaryData = {
                ...basicMetrics,
                ...pnlAnalysis,
                ...riskMetrics,
                ...timeAnalysis,
                ...symbolAnalysis,
                ...positionAnalysis,
                ...behavioralAnalysis,
                monthlyPerformance,
                weeklyPerformance
            }

            console.log(`Successfully generated trading summary for user ${userId}`)
            return summary

        } catch (error) {
            console.error('Error generating trading summary:', error)
            throw new Error('Failed to generate trading summary')
        }
    }

    /**
     * Calculate basic trading metrics
     */
    private static calculateBasicMetrics(matchedTrades: any[], rawTrades: any[]) {
        const totalTrades = matchedTrades.length
        const totalBuyTrades = rawTrades.filter(t => t.tradeType === 'BUY').length
        const totalSellTrades = rawTrades.filter(t => t.tradeType === 'SELL').length

        const totalVolume = rawTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const totalValue = rawTrades.reduce((sum, trade) => sum + (Number(trade.price) * Number(trade.quantity)), 0)

        return {
            totalTrades,
            totalBuyTrades,
            totalSellTrades,
            totalVolume,
            totalValue
        }
    }

    /**
     * Calculate P&L analysis
     */
    private static calculatePnLAnalysis(matchedTrades: any[]) {
        if (matchedTrades.length === 0) {
            return {
                totalPnL: 0,
                totalPnLPct: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                averageWin: 0,
                averageLoss: 0,
                largestWin: 0,
                largestLoss: 0
            }
        }

        const totalPnL = matchedTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
        const winningTrades = matchedTrades.filter(trade => Number(trade.pnl) > 0)
        const losingTrades = matchedTrades.filter(trade => Number(trade.pnl) < 0)

        const totalPnLPct = matchedTrades.reduce((sum, trade) => sum + Number(trade.pnlPct), 0)
        const winRate = (winningTrades.length / matchedTrades.length) * 100

        const averageWin = winningTrades.length > 0 ?
            winningTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0) / winningTrades.length : 0

        const averageLoss = losingTrades.length > 0 ?
            losingTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0) / losingTrades.length : 0

        const largestWin = winningTrades.length > 0 ?
            Math.max(...winningTrades.map(trade => Number(trade.pnl))) : 0

        const largestLoss = losingTrades.length > 0 ?
            Math.min(...losingTrades.map(trade => Number(trade.pnl))) : 0

        return {
            totalPnL,
            totalPnLPct,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate,
            averageWin,
            averageLoss,
            largestWin,
            largestLoss
        }
    }

    /**
     * Calculate risk metrics
     */
    private static calculateRiskMetrics(matchedTrades: any[]) {
        if (matchedTrades.length === 0) {
            return {
                maxDrawdown: 0,
                maxDrawdownPct: 0,
                sharpeRatio: 0,
                volatility: 0
            }
        }

        // Calculate max drawdown
        let maxDrawdown = 0
        let maxDrawdownPct = 0
        let peak = 0
        let runningTotal = 0

        matchedTrades.forEach(trade => {
            runningTotal += Number(trade.pnl)
            if (runningTotal > peak) {
                peak = runningTotal
            }
            const drawdown = peak - runningTotal
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown
            }
        })

        maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0

        // Calculate volatility (standard deviation of P&L)
        const pnlValues = matchedTrades.map(trade => Number(trade.pnl))
        const meanPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length
        const variance = pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - meanPnL, 2), 0) / pnlValues.length
        const volatility = Math.sqrt(variance)

        // Calculate Sharpe ratio (simplified - assuming risk-free rate of 0)
        const sharpeRatio = volatility > 0 ? meanPnL / volatility : 0

        return {
            maxDrawdown,
            maxDrawdownPct,
            sharpeRatio,
            volatility
        }
    }

    /**
     * Calculate time-based analysis
     */
    private static calculateTimeAnalysis(matchedTrades: any[], rawTrades: any[]) {
        if (matchedTrades.length === 0) {
            return {
                tradingDays: 0,
                averageTradesPerDay: 0,
                bestDay: { date: '', pnl: 0 },
                worstDay: { date: '', pnl: 0 }
            }
        }

        // Group trades by day
        const dailyPnL = new Map<string, number>()

        matchedTrades.forEach(trade => {
            const dateKey = trade.buyDate.toISOString().split('T')[0]
            const existingPnL = dailyPnL.get(dateKey) || 0
            dailyPnL.set(dateKey, existingPnL + Number(trade.pnl))
        })

        const tradingDays = dailyPnL.size
        const averageTradesPerDay = matchedTrades.length / tradingDays

        // Find best and worst days
        let bestDay = { date: '', pnl: -Infinity }
        let worstDay = { date: '', pnl: Infinity }

        dailyPnL.forEach((pnl, date) => {
            if (pnl > bestDay.pnl) {
                bestDay = { date, pnl }
            }
            if (pnl < worstDay.pnl) {
                worstDay = { date, pnl }
            }
        })

        return {
            tradingDays,
            averageTradesPerDay,
            bestDay,
            worstDay
        }
    }

    /**
     * Calculate symbol analysis
     */
    private static calculateSymbolAnalysis(matchedTrades: any[], rawTrades: any[]) {
        // Group by symbol
        const symbolStats = new Map<string, { trades: number; pnl: number; volume: number; wins: number; total: number }>()

        // Process matched trades
        matchedTrades.forEach(trade => {
            const existing = symbolStats.get(trade.symbol) || { trades: 0, pnl: 0, volume: 0, wins: 0, total: 0 }
            existing.trades++
            existing.pnl += Number(trade.pnl)
            existing.volume += Number(trade.quantity)
            existing.total++
            if (Number(trade.pnl) > 0) existing.wins++
            symbolStats.set(trade.symbol, existing)
        })

        // Process raw trades for volume
        rawTrades.forEach(trade => {
            const existing = symbolStats.get(trade.symbol) || { trades: 0, pnl: 0, volume: 0, wins: 0, total: 0 }
            existing.volume += Number(trade.quantity)
            symbolStats.set(trade.symbol, existing)
        })

        // Convert to arrays
        const topSymbols = Array.from(symbolStats.entries())
            .map(([symbol, stats]) => ({
                symbol,
                trades: stats.trades,
                pnl: stats.pnl,
                volume: stats.volume
            }))
            .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
            .slice(0, 10)

        const symbolPerformance = Array.from(symbolStats.entries())
            .map(([symbol, stats]) => ({
                symbol,
                winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
                avgPnL: stats.trades > 0 ? stats.pnl / stats.trades : 0,
                totalPnL: stats.pnl
            }))
            .sort((a, b) => Math.abs(b.totalPnL) - Math.abs(a.totalPnL))

        return {
            topSymbols,
            symbolPerformance
        }
    }

    /**
     * Calculate position analysis
     */
    private static calculatePositionAnalysis(openPositions: any[]) {
        const openPositionsCount = openPositions.length
        const totalOpenValue = openPositions.reduce((sum, pos) =>
            sum + (Number(pos.averagePrice) * Number(pos.quantity)), 0)
        const unrealizedPnL = openPositions.reduce((sum, pos) =>
            sum + Number(pos.unrealizedPnl || 0), 0)

        return {
            openPositions: openPositionsCount,
            totalOpenValue,
            unrealizedPnL
        }
    }

    /**
     * Calculate behavioral analysis
     */
    private static calculateBehavioralAnalysis(matchedTrades: any[], rawTrades: any[]) {
        if (matchedTrades.length === 0) {
            return {
                averageHoldingPeriod: 0,
                mostActiveHour: 0,
                mostActiveDay: '',
                consecutiveWins: 0,
                consecutiveLosses: 0
            }
        }

        // Calculate average holding period
        const holdingPeriods = matchedTrades.map(trade => {
            const buyTime = new Date(trade.buyDate).getTime()
            const sellTime = new Date(trade.sellDate).getTime()
            return (sellTime - buyTime) / (1000 * 60 * 60 * 24) // Convert to days
        })

        const averageHoldingPeriod = holdingPeriods.reduce((sum, period) => sum + period, 0) / holdingPeriods.length

        // Find most active hour
        const hourlyActivity = new Map<number, number>()
        rawTrades.forEach(trade => {
            const hour = new Date(trade.tradeDatetime).getHours()
            hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1)
        })

        let mostActiveHour = 0
        let maxActivity = 0
        hourlyActivity.forEach((activity, hour) => {
            if (activity > maxActivity) {
                maxActivity = activity
                mostActiveHour = hour
            }
        })

        // Find most active day
        const dailyActivity = new Map<string, number>()
        rawTrades.forEach(trade => {
            const day = new Date(trade.tradeDatetime).toLocaleDateString('en-US', { weekday: 'long' })
            dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1)
        })

        let mostActiveDay = ''
        let maxDailyActivity = 0
        dailyActivity.forEach((activity, day) => {
            if (activity > maxDailyActivity) {
                maxDailyActivity = activity
                mostActiveDay = day
            }
        })

        // Calculate consecutive wins/losses
        let consecutiveWins = 0
        let consecutiveLosses = 0
        let currentWins = 0
        let currentLosses = 0

        matchedTrades.forEach(trade => {
            if (Number(trade.pnl) > 0) {
                currentWins++
                currentLosses = 0
                consecutiveWins = Math.max(consecutiveWins, currentWins)
            } else {
                currentLosses++
                currentWins = 0
                consecutiveLosses = Math.max(consecutiveLosses, currentLosses)
            }
        })

        return {
            averageHoldingPeriod,
            mostActiveHour,
            mostActiveDay,
            consecutiveWins,
            consecutiveLosses
        }
    }

    /**
     * Calculate monthly performance
     */
    private static calculateMonthlyPerformance(matchedTrades: any[], startDate: Date, endDate: Date) {
        const monthlyData = new Map<string, { trades: number; pnl: number; volume: number }>()

        // Initialize monthly buckets
        const current = new Date(startDate)
        while (current <= endDate) {
            const monthKey = current.toISOString().substring(0, 7) // YYYY-MM format
            monthlyData.set(monthKey, { trades: 0, pnl: 0, volume: 0 })
            current.setMonth(current.getMonth() + 1)
        }

        // Aggregate trades by month
        matchedTrades.forEach(trade => {
            const monthKey = new Date(trade.buyDate).toISOString().substring(0, 7)
            const existing = monthlyData.get(monthKey)
            if (existing) {
                existing.trades++
                existing.pnl += Number(trade.pnl)
                existing.volume += Number(trade.quantity)
            }
        })

        return Array.from(monthlyData.entries())
            .map(([month, data]) => ({
                month,
                trades: data.trades,
                pnl: data.pnl,
                volume: data.volume
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
    }

    /**
     * Calculate weekly performance
     */
    private static calculateWeeklyPerformance(matchedTrades: any[], startDate: Date, endDate: Date) {
        const weeklyData = new Map<string, { trades: number; pnl: number; volume: number }>()

        // Initialize weekly buckets (last 12 weeks)
        for (let i = 11; i >= 0; i--) {
            const date = new Date(endDate)
            date.setDate(date.getDate() - (i * 7))
            const weekKey = this.getWeekKey(date)
            weeklyData.set(weekKey, { trades: 0, pnl: 0, volume: 0 })
        }

        // Aggregate trades by week
        matchedTrades.forEach(trade => {
            const weekKey = this.getWeekKey(new Date(trade.buyDate))
            const existing = weeklyData.get(weekKey)
            if (existing) {
                existing.trades++
                existing.pnl += Number(trade.pnl)
                existing.volume += Number(trade.quantity)
            }
        })

        return Array.from(weeklyData.entries())
            .map(([week, data]) => ({
                week,
                trades: data.trades,
                pnl: data.pnl,
                volume: data.volume
            }))
            .sort((a, b) => a.week.localeCompare(b.week))
    }

    /**
     * Get week key in YYYY-WW format
     */
    private static getWeekKey(date: Date): string {
        const year = date.getFullYear()
        const startOfYear = new Date(year, 0, 1)
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`
    }

    /**
     * Save trading summary to database
     */
    static async saveSummary(userId: string, summaryData: TradingSummaryData, options?: { version?: number }) {
        try {
            const version = options?.version || 1
            const dataRangeStart = new Date()
            dataRangeStart.setDate(dataRangeStart.getDate() - 30) // Last 30 days by default
            const dataRangeEnd = new Date()

            // Generate insights hash for change detection
            const insightsHash = this.generateInsightsHash(summaryData)

            // Check if we need to update existing summary
            const existingSummary = await prisma.userTradingSummary.findFirst({
                where: { userId, version },
                orderBy: { generatedAt: 'desc' }
            })

            if (existingSummary && existingSummary.insightsHash === insightsHash) {
                console.log(`Summary unchanged for user ${userId}, skipping update`)
                return existingSummary
            }

            // Create or update summary
            const summary = await prisma.userTradingSummary.upsert({
                where: { id: existingSummary?.id || 'new' },
                update: {
                    generatedAt: new Date(),
                    dataRangeStart,
                    dataRangeEnd,
                    summaryData,
                    insightsHash,
                    nextUpdateDue: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next update in 24 hours
                },
                create: {
                    userId,
                    version,
                    generatedAt: new Date(),
                    dataRangeStart,
                    dataRangeEnd,
                    summaryData,
                    insightsHash,
                    nextUpdateDue: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            })

            console.log(`Saved trading summary for user ${userId}, version ${version}`)
            return summary

        } catch (error) {
            console.error('Error saving trading summary:', error)
            throw new Error('Failed to save trading summary')
        }
    }

    /**
     * Generate hash for change detection
     */
    private static generateInsightsHash(summaryData: TradingSummaryData): string {
        const keyData = {
            totalTrades: summaryData.totalTrades,
            totalPnL: summaryData.totalPnL,
            winRate: summaryData.winRate,
            maxDrawdown: summaryData.maxDrawdown
        }
        return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 16)
    }

    /**
     * Get latest trading summary for a user
     */
    static async getLatestSummary(userId: string, version: number = 1) {
        try {
            const summary = await prisma.userTradingSummary.findFirst({
                where: { userId, version },
                orderBy: { generatedAt: 'desc' }
            })

            return summary
        } catch (error) {
            console.error('Error getting latest trading summary:', error)
            throw new Error('Failed to get trading summary')
        }
    }

    /**
     * Check if summary needs update
     */
    static async needsUpdate(userId: string, version: number = 1): Promise<boolean> {
        try {
            const summary = await this.getLatestSummary(userId, version)

            if (!summary) return true

            const now = new Date()
            const nextUpdate = summary.nextUpdateDue

            return nextUpdate ? now >= nextUpdate : true
        } catch (error) {
            console.error('Error checking if summary needs update:', error)
            return true
        }
    }
}
