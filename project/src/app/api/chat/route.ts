import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { message, userId } = await request.json()

        if (!message || !userId) {
            console.error('Chat API validation error:', { message: !!message, userId: !!userId })
            return NextResponse.json({ error: 'Message and userId are required' }, { status: 400 })
        }

        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('Gemini API key not configured')
            return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
        }

        // Fetch user's trading data for context
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                rawTrades: {
                    orderBy: { tradeDatetime: 'desc' },
                    take: 100 // Limit to recent trades for context
                },
                matchedTrades: {
                    orderBy: { createdAt: 'desc' },
                    take: 100
                },
                riskSessions: {
                    orderBy: { sessionDate: 'desc' },
                    take: 20
                },
                guardianInsights: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Prepare trading data summary for AI context
        const tradingSummary = prepareTradingSummary(userData)

        // Create AI prompt with trading context
        const aiPrompt = createAIPrompt(message, tradingSummary)

        // Get AI response from Gemini
        const aiResponse = await getGeminiResponse(aiPrompt, tradingSummary)

        // Extract metadata from the response
        const metadata = extractMetadata(tradingSummary, message)

        return NextResponse.json({
            success: true,
            response: aiResponse,
            metadata
        })

    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function prepareTradingSummary(userData: any) {
    const rawTrades = userData.rawTrades || []
    const matchedTrades = userData.matchedTrades || []
    const riskSessions = userData.riskSessions || []
    const guardianInsights = userData.guardianInsights || []

    // Calculate performance metrics
    const totalTrades = matchedTrades.length
    const winningTrades = matchedTrades.filter((t: any) => Number(t.pnl) > 0).length
    const losingTrades = matchedTrades.filter((t: any) => Number(t.pnl) < 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const totalPnl = matchedTrades.reduce((sum: number, t: any) => sum + Number(t.pnl), 0)
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0

    // Get unique symbols
    const symbols = [...new Set(matchedTrades.map((t: any) => t.symbol))]

    // Time analysis
    const tradeDates = matchedTrades.map((t: any) => new Date(t.createdAt))
    const timeRange = tradeDates.length > 0 ? {
        start: new Date(Math.min(...tradeDates.map((d: Date) => d.getTime()))),
        end: new Date(Math.max(...tradeDates.map((d: Date) => d.getTime())))
    } : null

    // Risk analysis
    const maxDrawdown = riskSessions.length > 0 ?
        Math.max(...riskSessions.map((r: any) => Number(r.currentDrawdownPct))) : 0

    const consecutiveLosses = riskSessions.length > 0 ?
        Math.max(...riskSessions.map((r: any) => r.consecutiveLosses)) : 0

    return {
        userProfile: {
            name: userData.name,
            totalCapital: Number(userData.totalCapital),
            riskPerTradePct: Number(userData.riskPerTradePct),
            maxDailyDrawdownPct: Number(userData.maxDailyDrawdownPct),
            maxConsecutiveLosses: userData.maxConsecutiveLosses
        },
        performance: {
            totalTrades,
            winningTrades,
            losingTrades,
            winRate: Math.round(winRate * 100) / 100,
            totalPnl: Math.round(totalPnl * 100) / 100,
            avgPnl: Math.round(avgPnl * 100) / 100
        },
        symbols,
        timeRange,
        riskMetrics: {
            maxDrawdown: Math.round(maxDrawdown * 100) / 100,
            consecutiveLosses,
            riskSessionsCount: riskSessions.length
        },
        insights: guardianInsights.map((i: any) => i.insight),
        recentTrades: matchedTrades.slice(0, 10).map((t: any) => ({
            symbol: t.symbol,
            pnl: Number(t.pnl),
            pnlPct: Number(t.pnlPct),
            createdAt: t.createdAt
        }))
    }
}

function createAIPrompt(userMessage: string, tradingSummary: any) {
    return `You are Guardian AI, an expert trading psychology and risk management AI assistant. You have access to a trader's data and should provide personalized, actionable insights.

TRADER'S PROFILE:
- Name: ${tradingSummary.userProfile.name}
- Total Capital: ₹${tradingSummary.userProfile.totalCapital.toLocaleString()}
- Risk per Trade: ${tradingSummary.userProfile.riskPerTradePct}%
- Max Daily Drawdown: ${tradingSummary.userProfile.maxDailyDrawdownPct}%
- Max Consecutive Losses: ${tradingSummary.userProfile.maxConsecutiveLosses}

TRADING PERFORMANCE:
- Total Trades: ${tradingSummary.performance.totalTrades}
- Win Rate: ${tradingSummary.performance.winRate}%
- Total P&L: ₹${tradingSummary.performance.totalPnl.toLocaleString()}
- Average P&L per Trade: ₹${tradingSummary.performance.avgPnl.toLocaleString()}
- Symbols Traded: ${tradingSummary.symbols.join(', ') || 'None yet'}

RISK METRICS:
- Max Drawdown: ${tradingSummary.riskMetrics.maxDrawdown}%
- Consecutive Losses: ${tradingSummary.riskMetrics.consecutiveLosses}
- Risk Sessions: ${tradingSummary.riskMetrics.riskSessionsCount}

RECENT INSIGHTS: ${tradingSummary.insights.join('; ') || 'No insights yet'}

USER QUESTION: "${userMessage}"

INSTRUCTIONS:
1. Analyze the user's trading data to provide personalized insights
2. Focus on actionable advice for improvement
3. Use the trader's actual performance metrics in your response
4. Be encouraging but honest about areas for improvement
5. Provide specific, practical recommendations
6. Keep responses conversational and engaging
7. If the user asks about specific metrics, calculate and show them
8. Always consider risk management and psychology aspects

Respond in a helpful, coaching tone as if you're a personal trading mentor.`
}

async function getGeminiResponse(prompt: string, tradingSummary: any) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key not configured')
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return text
    } catch (error) {
        console.error('Gemini API error:', error)

        // Return a fallback response with basic trading data
        return `I apologize, but I'm having trouble connecting to my AI services right now. However, I can still help you with some basic analysis based on your trading data.

From what I can see in your profile:
- You have ${tradingSummary.performance.totalTrades} total trades
- Your win rate is ${tradingSummary.performance.winRate}%
- You're trading with ₹${tradingSummary.userProfile.totalCapital.toLocaleString()} capital

Please try asking your question again in a moment, or you can explore the analytics dashboard for detailed insights.`
    }
}

function extractMetadata(tradingSummary: any, userMessage: string) {
    const metadata: any = {
        tradeCount: tradingSummary.performance.totalTrades,
        symbols: tradingSummary.symbols,
        timeRange: tradingSummary.timeRange ?
            `${tradingSummary.timeRange.start.toLocaleDateString()} - ${tradingSummary.timeRange.end.toLocaleDateString()}` :
            'No trades yet'
    }

    // Extract insights based on message content
    const insights: string[] = []

    if (userMessage.toLowerCase().includes('performance')) {
        insights.push(`Win Rate: ${tradingSummary.performance.winRate}%`)
        insights.push(`Total P&L: ₹${tradingSummary.performance.totalPnl.toLocaleString()}`)
    }

    if (userMessage.toLowerCase().includes('risk')) {
        insights.push(`Max Drawdown: ${tradingSummary.riskMetrics.maxDrawdown}%`)
        insights.push(`Risk per Trade: ${tradingSummary.userProfile.riskPerTradePct}%`)
    }

    if (userMessage.toLowerCase().includes('symbol')) {
        insights.push(`Trading ${tradingSummary.symbols.length} symbols`)
        insights.push(`Most active: ${tradingSummary.symbols.slice(0, 3).join(', ')}`)
    }

    metadata.insights = insights.length > 0 ? insights : ['AI-powered analysis', 'Personalized insights', 'Risk-aware recommendations']

    return metadata
}
