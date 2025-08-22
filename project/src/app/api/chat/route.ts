import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

// Initialize Gemini with improved model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

interface TradingData {
  hasData: boolean;
  totalTrades?: number;
  totalNetProfitLoss?: number;
  winRate?: number;
  avgProfitLoss?: number;
  totalCapital?: number;
  riskPerTrade?: number;
  openPositions?: number;
  hourlyPerformance?: Array<{ hour: number; avgPnL: number; total: number; count: number }>;
  dailyPerformance?: Array<{ day: string; avgPnL: number; total: number; count: number }>;
  symbolPerformance?: Array<{ symbol: string; avgPnL: number; total: number; count: number }>;
  recentTrades?: Array<{
    symbol: string;
    pnl: number;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    tradeDate: string;
  }>;
  aiInsights?: {
    behavioralPatterns: string[];
    riskAssessment: string;
    recommendations: string[];
    strengths: string[];
    improvementAreas: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch user data with ALL raw trades and summary
    let userData: any = {}
    try {
      userData = await prisma.user.findUnique({
        where: { clerkUserId: clerkUser.id },
        include: {
          rawTrades: { orderBy: { tradeDatetime: 'desc' } }, // Get ALL raw trades
          matchedTrades: { orderBy: { createdAt: 'desc' } },
          openTrades: { orderBy: { createdAt: 'desc' } },
          tradingSummaries: { take: 1, orderBy: { generatedAt: 'desc' } }, // Latest summary only
          onboarding: true,
        },
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Continue with empty data
    }

    // Generate chat response with direct data
    const response = await generateDirectChatResponse(message, userData || {})

    // Extract metadata
    const metadata = extractDirectMetadata(message, userData || {})

    return NextResponse.json({
      response,
      metadata
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      error: 'Failed to process chat request'
    }, { status: 500 })
  }
}



async function generateDirectChatResponse(message: string, userData: any): Promise<string> {
  try {
    const prompt = createDirectPrompt(message, userData)

    if (!process.env.GEMINI_API_KEY) {
      return getDirectFallbackResponse(message, userData)
    }

    const result = await model.generateContent(prompt)
    const response = await result.response

    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)
    return getDirectFallbackResponse(message, userData)
  }
}

function createDirectPrompt(message: string, userData: any): string {
  const hasRawTrades = userData?.rawTrades && userData.rawTrades.length > 0
  const hasSummary = userData?.tradingSummaries && userData.tradingSummaries.length > 0
  const latestSummary = hasSummary ? userData.tradingSummaries[0] : null

  let prompt = `You are Guardian AI, an expert Indian trading advisor. Answer the user's question based on their trading data.

**User Profile:**
- Capital: ₹${userData?.totalCapital?.toLocaleString('en-IN') || '0'}
- Risk per trade: ${userData?.riskPerTradePct || '0'}%
- Experience: ${userData?.onboarding?.experience || 'Not specified'}

**User Question:** "${message}"

`

  if (hasRawTrades) {
    prompt += `**Raw Trading Data (${userData.rawTrades.length} trades):**
${userData.rawTrades.slice(0, 50).map((trade: any, index: number) =>
      `${index + 1}. ${trade.symbol} | ${trade.tradeType} | ${trade.quantity} shares @ ₹${trade.price} | ${new Date(trade.tradeDatetime).toLocaleDateString('en-IN')}`
    ).join('\n')}

${userData.rawTrades.length > 50 ? `... and ${userData.rawTrades.length - 50} more trades` : ''}

`
  }

  if (hasSummary && latestSummary?.summaryData) {
    prompt += `**Latest AI Trading Summary:**
${JSON.stringify(latestSummary.summaryData, null, 2)}

`
  }

  prompt += `**Instructions:**
1. Answer the user's question directly using their trading data
2. Format currency in Indian Rupees (₹) with proper formatting
3. Use Indian market context (NSE, BSE, SEBI)
4. Be specific and actionable
5. Include emojis for better readability
6. If no data, provide general trading advice

**Response:** Provide a comprehensive, helpful answer based on the available data.`

  return prompt
}

function getDirectFallbackResponse(message: string, userData: any): string {
  const hasRawTrades = userData?.rawTrades && userData.rawTrades.length > 0
  const hasSummary = userData?.tradingSummaries && userData.tradingSummaries.length > 0

  if (!hasRawTrades) {
    return `Hello! I'm Guardian AI, your trading assistant. 👋

I notice you don't have trading data uploaded yet. To provide personalized insights, I'd need access to your trading history.

**In the meantime, I can help with:**
📚 General trading strategies and psychology
⚖️ Risk management principles
📊 Technical analysis concepts
🎯 Goal setting for traders
💡 Market psychology and behavioral trading

**To get personalized analysis, please:**
1. Upload your trading data/CSV files
2. Connect your broker account
3. Generate an AI trading summary

What specific trading topic would you like to discuss today?`
  }

  // Quick analysis from raw data
  const totalTrades = userData.rawTrades.length
  const buyTrades = userData.rawTrades.filter((t: any) => t.tradeType === 'BUY').length
  const sellTrades = userData.rawTrades.filter((t: any) => t.tradeType === 'SELL').length

  return `Based on your trading data, I can see some interesting patterns! 📊

**Your Trading Snapshot:**
- Total Trades: ${totalTrades}
- Buy Trades: ${buyTrades}
- Sell Trades: ${sellTrades}
- Capital: ₹${userData?.totalCapital?.toLocaleString('en-IN') || '0'}

**Quick Analysis:**
${buyTrades > sellTrades ? '📈 You have more buy trades than sell trades - this suggests you might be building positions' : '📉 You have more sell trades than buy trades - this suggests you might be taking profits or reducing positions'}

**Regarding your question:** "${message}"

I'm experiencing a temporary technical issue with my AI analysis engine. However, I can still provide insights based on your ${totalTrades} trades.

**Next Steps:**
1. Review your trading patterns in the analytics section
2. Generate an AI trading summary for deeper insights
3. Connect your broker for real-time data

Please try your question again in a moment!`
}

function extractDirectMetadata(userMessage: string, userData: any) {
  const message = userMessage.toLowerCase()
  const hasRawTrades = userData?.rawTrades && userData.rawTrades.length > 0
  const hasSummary = userData?.tradingSummaries && userData.tradingSummaries.length > 0

  const insights = []

  if (hasRawTrades) {
    const totalTrades = userData.rawTrades.length
    const buyTrades = userData.rawTrades.filter((t: any) => t.tradeType === 'BUY').length
    const sellTrades = userData.rawTrades.filter((t: any) => t.tradeType === 'SELL').length

    insights.push(`${totalTrades} trades analyzed`)
    insights.push(`${buyTrades} buy trades`)
    insights.push(`${sellTrades} sell trades`)

    // Get unique symbols
    const symbols = [...new Set(userData.rawTrades.map((t: any) => t.symbol))]
    if (symbols.length > 0) {
      insights.push(`${symbols.length} symbols traded`)
      insights.push(`${symbols[0]} most traded`)
    }
  }

  if (hasSummary) {
    insights.push('AI Summary Available')
  }

  if (message.includes('risk') || message.includes('safety')) {
    insights.push('Risk Management Focus')
  }

  if (message.includes('psychology') || message.includes('mindset')) {
    insights.push('Psychology Analysis')
  }

  if (message.includes('performance') || message.includes('profit')) {
    insights.push('Performance Review')
  }

  if (message.includes('strategy') || message.includes('plan')) {
    insights.push('Strategy Development')
  }

  if (message.includes('pattern') || message.includes('timing')) {
    insights.push('Pattern Analysis')
  }

  return {
    tradeCount: hasRawTrades ? userData.rawTrades.length : 0,
    symbols: hasRawTrades ? [...new Set(userData.rawTrades.map((t: any) => t.symbol))] : [],
    timeRange: hasRawTrades ? 'Raw trading data' : 'No data available',
    insights,
    hasAISummary: hasSummary,
    hasData: hasRawTrades,
    capital: userData?.totalCapital || 0,
    riskPerTrade: userData?.riskPerTradePct || 0
  }
}
