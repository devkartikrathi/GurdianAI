import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AITradingSummaryService, AITradingSummaryOptions } from '@/lib/services/ai-trading-summary-service'

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
    const action = searchParams.get('action')
    const version = parseInt(searchParams.get('version') || '1')
    const forceRegenerate = searchParams.get('forceRegenerate') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeOpenPositions = searchParams.get('includeOpenPositions') !== 'false'
    const includeBehavioralAnalysis = searchParams.get('includeBehavioralAnalysis') !== 'false'

    if (action === 'generate') {
      return await handleGenerateAISummary(user.id, {
        version,
        forceRegenerate,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeOpenPositions,
        includeBehavioralAnalysis
      })
    } else if (action === 'check-limit') {
      return await handleCheckLimit(user.id)
    } else if (action === 'get') {
      return await handleGetAISummary(user.id, version)
    } else {
      return await handleGetAISummary(user.id, version)
    }

  } catch (error) {
    console.error('AI Trading summary API error:', error)
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
    const {
      action = 'generate',
      version = 1,
      forceRegenerate = false,
      startDate,
      endDate,
      includeOpenPositions = true,
      includeBehavioralAnalysis = true
    } = body

    if (action === 'generate') {
      return await handleGenerateAISummary(user.id, {
        version,
        forceRegenerate,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeOpenPositions,
        includeBehavioralAnalysis
      })
    } else if (action === 'check-limit') {
      return await handleCheckLimit(user.id)
    } else if (action === 'get') {
      return await handleGetAISummary(user.id, version)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('AI Trading summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Handle AI summary generation with rate limiting
 */
async function handleGenerateAISummary(userId: string, options: Partial<AITradingSummaryOptions> & { version?: number }) {
  try {
    // Check if user can generate summary (once per day limit)
    if (!options.forceRegenerate) {
      const limitCheck = await AITradingSummaryService.canGenerateSummary(userId)
      if (!limitCheck.canGenerate) {
        return NextResponse.json({
          error: 'Daily limit reached',
          message: 'You can only generate one AI summary per day',
          nextAvailable: limitCheck.nextAvailable,
          canGenerate: false
        }, { status: 429 })
      }
    }


    // Generate AI summary
    const summaryData = await AITradingSummaryService.generateAISummary({
      userId,
      startDate: options.startDate,
      endDate: options.endDate,
      includeOpenPositions: options.includeOpenPositions,
      includeBehavioralAnalysis: options.includeBehavioralAnalysis
    })

    // Save to database
    const summary = await AITradingSummaryService.saveAISummary(userId, summaryData, { version: options.version || 1 })

    return NextResponse.json({
      success: true,
      message: 'AI trading summary generated successfully',
      data: {
        summary: summaryData,
        metadata: {
          id: summary.id,
          generatedAt: summary.generatedAt,
          version: summary.version,
          insightsHash: summary.insightsHash
        }
      }
    })

  } catch (error) {
    console.error('Error generating AI trading summary:', error)
    return NextResponse.json({
      error: 'Failed to generate AI trading summary',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Handle checking generation limits
 */
async function handleCheckLimit(userId: string) {
  try {
    const limitCheck = await AITradingSummaryService.canGenerateSummary(userId)

    return NextResponse.json({
      success: true,
      data: {
        canGenerate: limitCheck.canGenerate,
        nextAvailable: limitCheck.nextAvailable,
        message: limitCheck.canGenerate
          ? 'You can generate a new AI summary now'
          : 'Daily limit reached. Try again tomorrow.'
      }
    })

  } catch (error) {
    console.error('Error checking generation limit:', error)
    return NextResponse.json({
      error: 'Failed to check generation limit',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * Handle getting existing AI summary
 */
async function handleGetAISummary(userId: string, version: number) {
  try {
    const summary = await AITradingSummaryService.getLatestAISummary(userId, version)

    if (!summary) {
      return NextResponse.json({
        error: 'No AI summary found',
        message: 'No AI trading summary has been generated yet. Generate one to get started.',
        canGenerate: true
      }, { status: 404 })
    }

    // Check if user can generate a new one
    const limitCheck = await AITradingSummaryService.canGenerateSummary(userId)

    return NextResponse.json({
      success: true,
      data: {
        summary: summary.summaryData,
        metadata: {
          id: summary.id,
          generatedAt: summary.generatedAt,
          version: summary.version,
          insightsHash: summary.insightsHash,
          nextUpdateDue: summary.nextUpdateDue
        },
        generation: {
          canGenerate: limitCheck.canGenerate,
          nextAvailable: limitCheck.nextAvailable
        }
      }
    })

  } catch (error) {
    console.error('Error getting AI trading summary:', error)
    return NextResponse.json({
      error: 'Failed to get AI trading summary',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
