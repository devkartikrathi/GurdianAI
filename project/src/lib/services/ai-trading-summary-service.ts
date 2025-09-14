import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface AITradingSummaryData {
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

  // AI-Generated Insights
  aiInsights: {
    behavioralPatterns: string[]
    riskAssessment: string
    improvementAreas: string[]
    strengths: string[]
    recommendations: string[]
    marketContext: string
    psychologicalFactors: string[]
  }

  // Index signature for JSON compatibility
  [key: string]: any
}

export interface AITradingSummaryOptions {
  userId: string
  startDate?: Date
  endDate?: Date
  includeOpenPositions?: boolean
  includeBehavioralAnalysis?: boolean
  forceRegenerate?: boolean
}

export class AITradingSummaryService {

  /**
   * Check if user can generate summary (once per day limit)
   */
  static async canGenerateSummary(userId: string): Promise<{ canGenerate: boolean; nextAvailable: Date | null }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Check if summary was generated today
      const todaySummary = await prisma.userTradingSummary.findFirst({
        where: {
          userId,
          generatedAt: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: { generatedAt: 'desc' }
      })

      if (todaySummary) {
        return {
          canGenerate: false,
          nextAvailable: tomorrow
        }
      }

      return {
        canGenerate: true,
        nextAvailable: null
      }
    } catch (error) {
      console.error('Error checking summary generation limit:', error)
      return { canGenerate: false, nextAvailable: null }
    }
  }

  /**
   * Generate comprehensive AI-powered trading summary
   */
  static async generateAISummary(options: AITradingSummaryOptions): Promise<AITradingSummaryData> {
    const { userId, startDate, endDate, includeOpenPositions = true, includeBehavioralAnalysis = true } = options

    // Set default date range if not provided - last 12 months instead of beginning of time
    const end = endDate || new Date() // Now
    const start = startDate || (() => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 1) // Last 12 months
      return date
    })()

    try {
      // Get all required data for AI analysis
      const userData = await this.getUserDataForAnalysis(userId, start, end)

      // Generate AI insights using Gemini
      const aiInsights = await this.generateAIInsights(userData)

      // Calculate technical metrics
      const technicalMetrics = this.calculateTechnicalMetrics(userData)

      // Combine technical metrics with AI insights
      const summary: AITradingSummaryData = {
        ...technicalMetrics,
        aiInsights
      }

      return summary

    } catch (error) {
      console.error('Error generating AI trading summary:', error)
      throw new Error('Failed to generate AI trading summary')
    }
  }

  /**
   * Get comprehensive user data for AI analysis
   */
  private static async getUserDataForAnalysis(userId: string, startDate: Date, endDate: Date) {
    // Get user profile and settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        onboarding: true,
        notificationPreferences: true
      }
    })

    // Get all matched trades in date range
    const matchedTrades = await prisma.matchedTrade.findMany({
      where: {
        userId,
        OR: [
          { buyDate: { gte: startDate, lte: endDate } },
          { sellDate: { gte: startDate, lte: endDate } }
        ]
      },
      orderBy: { buyDate: 'asc' }
    })

    // Get all raw trades in date range
    const rawTrades = await prisma.rawTrade.findMany({
      where: {
        userId,
        tradeDatetime: { gte: startDate, lte: endDate }
      },
      orderBy: { tradeDatetime: 'asc' }
    })

    // Get open positions
    const openPositions = await prisma.openTrade.findMany({
      where: { userId }
    })

    // Get last 3 summaries for context
    const previousSummaries = await prisma.userTradingSummary.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: 3
    })

    // Get all guardian insights for recommendations context
    const guardianInsights = await prisma.guardianInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Get risk sessions
    const riskSessions = await prisma.riskSession.findMany({
      where: { userId },
      orderBy: { sessionDate: 'desc' },
      take: 30
    })

    return {
      user,
      matchedTrades,
      rawTrades,
      openPositions,
      previousSummaries,
      guardianInsights,
      riskSessions,
      startDate,
      endDate
    }
  }

  /**
   * Generate AI insights using Google Gemini
   */
  private static async generateAIInsights(userData: any) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, using fallback insights')
        return this.generateFallbackInsights(userData)
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Prepare context for AI
      const aiContext = this.prepareAIContext(userData)

      const prompt = `
You are an expert trading psychologist and financial analyst. Analyze the following trading data and provide comprehensive insights.

USER PROFILE:
- Capital: ₹${userData.user?.totalCapital || 0}
- Risk per trade: ${userData.user?.riskPerTradePct || 0}%
- Max daily drawdown: ${userData.user?.maxDailyDrawdownPct || 0}%
- Max consecutive losses: ${userData.user?.maxConsecutiveLosses || 0}

TRADING DATA SUMMARY:
- Total trades: ${userData.matchedTrades.length}
- Date range: ${userData.startDate.toLocaleDateString()} to ${userData.endDate.toLocaleDateString()}
- Open positions: ${userData.openPositions.length}

PREVIOUS INSIGHTS (Last 3 summaries):
${userData.previousSummaries.map((summary: any, index: number) =>
        `Summary ${index + 1} (${summary.generatedAt.toLocaleDateString()}): ${JSON.stringify(summary.summaryData?.aiInsights?.recommendations || [])}`
      ).join('\n')}

GUARDIAN INSIGHTS (Recent recommendations):
${userData.guardianInsights.map((insight: any) =>
        `- ${insight.insightType}: ${JSON.stringify(insight.insightData)}`
      ).join('\n')}

RISK SESSIONS:
${userData.riskSessions.map((session: any) =>
        `- ${session.sessionDate.toLocaleDateString()}: ${session.riskStatus} status, ${session.currentPnl} P&L`
      ).join('\n')}

TASK: Generate comprehensive trading insights in the following JSON format:

{
  "behavioralPatterns": [
    "3-4 specific behavioral observations about the trader's psychology and decision-making patterns"
  ],
  "riskAssessment": "Detailed risk evaluation including current risk level, potential concerns, and risk management effectiveness",
  "improvementAreas": [
    "3-4 specific areas where the trader can improve their performance or psychology"
  ],
  "strengths": [
    "3-4 specific strengths the trader demonstrates in their trading approach"
  ],
  "recommendations": [
    "5-6 actionable recommendations for improving trading performance, risk management, and psychology"
  ],
  "marketContext": "Analysis of how current market conditions may be affecting the trader's performance",
  "psychologicalFactors": [
    "3-4 psychological factors that may be influencing the trader's decision-making"
  ]
}

IMPORTANT:
- Be specific and actionable
- Consider the trader's risk profile and capital
- Reference previous insights and recommendations
- Focus on behavioral and psychological aspects
- Provide practical, implementable advice
- Consider Indian market context
- Be encouraging but realistic

Return ONLY the JSON object, no other text.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini')
      }

      const aiInsights = JSON.parse(jsonMatch[0])

      // Validate required fields
      const requiredFields = ['behavioralPatterns', 'riskAssessment', 'improvementAreas', 'strengths', 'recommendations', 'marketContext', 'psychologicalFactors']
      for (const field of requiredFields) {
        if (!aiInsights[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      return aiInsights

    } catch (error) {
      console.error('Error generating AI insights:', error)
      return this.generateFallbackInsights(userData)
    }
  }

  /**
   * Generate fallback insights when AI is not available
   */
  private static generateFallbackInsights(userData: any) {
    const totalTrades = userData.matchedTrades.length
    const winningTrades = userData.matchedTrades.filter((t: any) => Number(t.pnl) > 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return {
      behavioralPatterns: [
        `Trading frequency: ${totalTrades} trades over ${Math.ceil((userData.endDate - userData.startDate) / (1000 * 60 * 60 * 24))} days`,
        `Win rate: ${winRate.toFixed(1)}% with ${winningTrades} winning trades`,
        `Risk management: Using ${userData.user?.riskPerTradePct || 0}% risk per trade`
      ],
      riskAssessment: `Current risk level based on ${userData.openPositions.length} open positions and risk settings`,
      improvementAreas: [
        "Consider reviewing trade entry and exit timing",
        "Evaluate position sizing based on market volatility",
        "Monitor emotional decision-making during losses"
      ],
      strengths: [
        "Consistent trading approach",
        "Risk management discipline",
        "Trade tracking and analysis"
      ],
      recommendations: [
        "Maintain current risk management practices",
        "Review losing trades for pattern analysis",
        "Consider diversifying across more symbols",
        "Set specific profit targets for trades",
        "Monitor market conditions before entering positions"
      ],
      marketContext: "Market analysis requires real-time data and AI insights",
      psychologicalFactors: [
        "Emotional control during drawdowns",
        "Patience in waiting for optimal setups",
        "Confidence in trading decisions"
      ]
    }
  }

  /**
   * Prepare context data for AI analysis
   */
  private static prepareAIContext(userData: any) {
    // Calculate key metrics for AI context
    const totalPnL = userData.matchedTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl), 0)
    const winningTrades = userData.matchedTrades.filter((t: any) => Number(t.pnl) > 0)
    const losingTrades = userData.matchedTrades.filter((t: any) => Number(t.pnl) < 0)
    const winRate = userData.matchedTrades.length > 0 ? (winningTrades.length / userData.matchedTrades.length) * 100 : 0

    return {
      totalTrades: userData.matchedTrades.length,
      totalPnL,
      winRate,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      openPositions: userData.openPositions.length,
      capital: userData.user?.totalCapital || 0,
      riskSettings: {
        riskPerTrade: userData.user?.riskPerTradePct || 0,
        maxDrawdown: userData.user?.maxDailyDrawdownPct || 0,
        maxConsecutiveLosses: userData.user?.maxConsecutiveLosses || 0
      }
    }
  }

  /**
   * Calculate technical metrics (non-AI)
   */
  private static calculateTechnicalMetrics(userData: any) {
    const matchedTrades = userData.matchedTrades
    const rawTrades = userData.rawTrades
    const openPositions = userData.openPositions

    // Basic metrics
    const totalTrades = matchedTrades.length
    const totalBuyTrades = rawTrades.filter((t: any) => t.tradeType === 'BUY').length
    const totalSellTrades = rawTrades.filter((t: any) => t.tradeType === 'SELL').length
    const totalVolume = rawTrades.reduce((sum: number, trade: any) => sum + Number(trade.quantity), 0)
    const totalValue = rawTrades.reduce((sum: number, trade: any) => sum + (Number(trade.price) * Number(trade.quantity)), 0)

    // P&L analysis
    const totalPnL = matchedTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl), 0)
    const totalPnLPct = matchedTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnlPct || 0), 0)
    const winningTrades = matchedTrades.filter((trade: any) => Number(trade.pnl) > 0)
    const losingTrades = matchedTrades.filter((trade: any) => Number(trade.pnl) < 0)
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0

    const averageWin = winningTrades.length > 0 ?
      winningTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl), 0) / winningTrades.length : 0

    const averageLoss = losingTrades.length > 0 ?
      losingTrades.reduce((sum: number, trade: any) => sum + Number(trade.pnl), 0) / losingTrades.length : 0

    const largestWin = winningTrades.length > 0 ?
      Math.max(...winningTrades.map((trade: any) => Number(trade.pnl))) : 0

    const largestLoss = losingTrades.length > 0 ?
      Math.min(...losingTrades.map((trade: any) => Number(trade.pnl))) : 0

    // Risk metrics
    const riskMetrics = this.calculateRiskMetrics(matchedTrades)

    // Time analysis
    const timeAnalysis = this.calculateTimeAnalysis(matchedTrades, rawTrades)

    // Symbol analysis
    const symbolAnalysis = this.calculateSymbolAnalysis(matchedTrades, rawTrades)

    // Position analysis
    const positionAnalysis = this.calculatePositionAnalysis(openPositions)

    // Behavioral analysis
    const behavioralAnalysis = this.calculateBehavioralAnalysis(matchedTrades, rawTrades)

    // Monthly/weekly breakdowns
    const monthlyPerformance = this.calculateMonthlyPerformance(matchedTrades, userData.startDate, userData.endDate)
    const weeklyPerformance = this.calculateWeeklyPerformance(matchedTrades, userData.startDate, userData.endDate)

    return {
      totalTrades,
      totalBuyTrades,
      totalSellTrades,
      totalVolume,
      totalValue,
      totalPnL,
      totalPnLPct,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      ...riskMetrics,
      ...timeAnalysis,
      ...symbolAnalysis,
      ...positionAnalysis,
      ...behavioralAnalysis,
      monthlyPerformance,
      weeklyPerformance
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
   * Save AI trading summary to database
   */
  static async saveAISummary(userId: string, summaryData: AITradingSummaryData, options?: { version?: number }) {
    try {
      const version = options?.version || 1
      const dataRangeStart = new Date()
      dataRangeStart.setDate(dataRangeStart.getDate() - 30) // Last 30 days by default
      const dataRangeEnd = new Date()

      // Generate insights hash for change detection
      const insightsHash = this.generateInsightsHash(summaryData)

      // Create new summary (no upsert for daily limit)
      const summary = await prisma.userTradingSummary.create({
        data: {
          userId,
          version,
          generatedAt: new Date(),
          dataRangeStart,
          dataRangeEnd,
          summaryData,
          insightsHash,
          nextUpdateDue: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next update in 24 hours
        }
      })

      return summary

    } catch (error) {
      console.error('Error saving AI trading summary:', error)
      throw new Error('Failed to save AI trading summary')
    }
  }

  /**
   * Generate hash for change detection
   */
  private static generateInsightsHash(summaryData: AITradingSummaryData): string {
    const keyData = {
      totalTrades: summaryData.totalTrades,
      totalPnL: summaryData.totalPnL,
      winRate: summaryData.winRate,
      maxDrawdown: summaryData.maxDrawdown,
      aiInsightsHash: JSON.stringify(summaryData.aiInsights).length
    }
    return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 16)
  }

  /**
   * Get latest AI trading summary for a user
   */
  static async getLatestAISummary(userId: string, version: number = 1) {
    try {
      const summary = await prisma.userTradingSummary.findFirst({
        where: { userId, version },
        orderBy: { generatedAt: 'desc' }
      })

      return summary
    } catch (error) {
      console.error('Error getting latest AI trading summary:', error)
      throw new Error('Failed to get AI trading summary')
    }
  }
}
