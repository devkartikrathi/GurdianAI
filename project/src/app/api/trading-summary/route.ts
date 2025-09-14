import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TradingSummaryService, TradingSummaryOptions } from '@/lib/services/trading-summary-service'

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
            return await handleGenerateSummary(user.id, {
                version,
                forceRegenerate,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                includeOpenPositions,
                includeBehavioralAnalysis
            })
        } else if (action === 'get') {
            return await handleGetSummary(user.id, version)
        } else {
            return await handleGetSummary(user.id, version)
        }

    } catch (error) {
        console.error('Trading summary API error:', error)
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
            return await handleGenerateSummary(user.id, {
                version,
                forceRegenerate,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                includeOpenPositions,
                includeBehavioralAnalysis
            })
        } else if (action === 'get') {
            return await handleGetSummary(user.id, version)
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error('Trading summary API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function handleGenerateSummary(
    userId: string,
    options: {
        version: number
        forceRegenerate: boolean
        startDate?: Date
        endDate?: Date
        includeOpenPositions: boolean
        includeBehavioralAnalysis: boolean
    }
) {
    try {
        const { version, forceRegenerate, startDate, endDate, includeOpenPositions, includeBehavioralAnalysis } = options

        // Check if we need to regenerate
        if (!forceRegenerate) {
            const needsUpdate = await TradingSummaryService.needsUpdate(userId, version)
            if (!needsUpdate) {
                const existingSummary = await TradingSummaryService.getLatestSummary(userId, version)
                if (existingSummary) {
                    return NextResponse.json({
                        success: true,
                        message: 'Summary is up to date',
                        data: {
                            summary: existingSummary.summaryData,
                            metadata: {
                                generatedAt: existingSummary.generatedAt,
                                dataRangeStart: existingSummary.dataRangeStart,
                                dataRangeEnd: existingSummary.dataRangeEnd,
                                version: existingSummary.version,
                                nextUpdateDue: existingSummary.nextUpdateDue
                            }
                        }
                    })
                }
            }
        }


        // Generate new summary
        const summaryData = await TradingSummaryService.generateSummary({
            userId,
            startDate,
            endDate,
            includeOpenPositions,
            includeBehavioralAnalysis
        })

        // Save to database
        const savedSummary = await TradingSummaryService.saveSummary(userId, summaryData, { version })

        return NextResponse.json({
            success: true,
            message: 'Trading summary generated successfully',
            data: {
                summary: summaryData,
                metadata: {
                    generatedAt: savedSummary.generatedAt,
                    dataRangeStart: savedSummary.dataRangeStart,
                    dataRangeEnd: savedSummary.dataRangeEnd,
                    version: savedSummary.version,
                    nextUpdateDue: savedSummary.nextUpdateDue
                }
            }
        })

    } catch (error) {
        console.error('Error generating trading summary:', error)
        return NextResponse.json({
            error: 'Failed to generate trading summary',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

async function handleGetSummary(userId: string, version: number) {
    try {
        const summary = await TradingSummaryService.getLatestSummary(userId, version)

        if (!summary) {
            return NextResponse.json({
                success: false,
                message: 'No trading summary found. Generate one first.',
                data: null
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Trading summary retrieved successfully',
            data: {
                summary: summary.summaryData,
                metadata: {
                    generatedAt: summary.generatedAt,
                    dataRangeStart: summary.dataRangeStart,
                    dataRangeEnd: summary.dataRangeEnd,
                    version: summary.version,
                    nextUpdateDue: summary.nextUpdateDue
                }
            }
        })

    } catch (error) {
        console.error('Error getting trading summary:', error)
        return NextResponse.json({
            error: 'Failed to get trading summary',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
