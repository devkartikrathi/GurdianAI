import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, dataType, tradeBookId } = body

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 })
        }

        const clerkUserId = clerkUser.id
        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (action === 'export') {
            return await handleDataExport(user.id)
        } else if (action === 'delete') {
            if (!dataType) {
                return await handleDataDeletion(user.id, 'all')
            }
            if (dataType === 'tradeBook') {
                if (!tradeBookId) {
                    return NextResponse.json({ error: 'Trade book ID is required' }, { status: 400 })
                }
                return await handleTradeBookDeletion(user.id, tradeBookId)
            }
            return await handleDataDeletion(user.id, dataType)
        } else if (action === 'cleanup') {
            return await handleDataCleanup(user.id)
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error('Data management error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function handleDataExport(userId: string) {
    try {
        // Fetch all user data for export
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                rawTrades: true,
                matchedTrades: true,
                openTrades: true,
                tradeBooks: true,
                riskSessions: true,
                guardianInsights: true,
                tradingSummaries: true,
                onboarding: true,
                notificationPreferences: true,
                brokerConnections: true
            }
        })

        if (!userData) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 })
        }

        // Create export record
        await prisma.dataExport.create({
            data: {
                userId,
                exportType: 'full'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Data export created successfully',
            data: {
                totalTrades: userData.rawTrades.length + userData.matchedTrades.length,
                totalInsights: userData.guardianInsights.length,
                totalRiskSessions: userData.riskSessions.length,
                exportDate: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Data export error:', error)
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
    }
}

async function handleDataDeletion(userId: string, dataType: string) {
    try {
        let deletedCounts: any = {}
        let message = ''

        switch (dataType) {
            case 'trades':
                // Delete only trade-related data
                const tradesResult = await Promise.all([
                    prisma.rawTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.matchedTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.openTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.tradeBook.deleteMany({ where: { userId } }).catch(() => ({ count: 0 }))
                ])

                deletedCounts = {
                    rawTrades: tradesResult[0].count || 0,
                    matchedTrades: tradesResult[1].count || 0,
                    openTrades: tradesResult[2].count || 0,
                    tradeBooks: tradesResult[3].count || 0
                }

                message = `Successfully deleted all trade data (${Object.values(deletedCounts).reduce((a: any, b: any) => a + b, 0)} records)`
                break

            case 'insights':
                // Delete only insights and risk sessions
                const insightsResult = await Promise.all([
                    prisma.guardianInsight.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.riskSession.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.userTradingSummary.deleteMany({ where: { userId } }).catch(() => ({ count: 0 }))
                ])

                deletedCounts = {
                    insights: insightsResult[0].count || 0,
                    riskSessions: insightsResult[1].count || 0,
                    tradingSummaries: insightsResult[2].count || 0
                }

                message = `Successfully deleted all insights and analysis data (${Object.values(deletedCounts).reduce((a: any, b: any) => a + b, 0)} records)`
                break

            case 'settings':
                // Delete only user preferences and settings
                const settingsResult = await Promise.all([
                    prisma.onboarding.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.notificationPreferences.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.brokerConnection.deleteMany({ where: { userId } }).catch(() => ({ count: 0 }))
                ])

                deletedCounts = {
                    onboarding: settingsResult[0].count || 0,
                    notificationPreferences: settingsResult[1].count || 0,
                    brokerConnections: settingsResult[2].count || 0
                }

                message = `Successfully deleted all settings and preferences (${Object.values(deletedCounts).reduce((a: any, b: any) => a + b, 0)} records)`
                break

            case 'all':
                // Delete everything including the user
                await Promise.all([
                    prisma.rawTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.matchedTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.openTrade.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.tradeBook.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.riskSession.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.guardianInsight.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.userTradingSummary.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.onboarding.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.notificationPreferences.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.brokerConnection.deleteMany({ where: { userId } }).catch(() => ({ count: 0 })),
                    prisma.dataExport.deleteMany({ where: { userId } }).catch(() => ({ count: 0 }))
                ])

                // Finally delete the user
                await prisma.user.delete({ where: { id: userId } })

                message = 'All user data deleted successfully. You will be redirected to the home page.'
                break

            default:
                return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message,
            deletedCounts,
            dataType
        })

    } catch (error) {
        console.error('Data deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 })
    }
}

async function handleTradeBookDeletion(userId: string, tradeBookId: string) {
    try {
        console.log(`Deleting trade book ${tradeBookId} for user ${userId}`)

        // First, get all raw trades for this trade book to find their IDs
        const rawTrades = await prisma.rawTrade.findMany({
            where: {
                tradeBookId: tradeBookId,
                userId: userId
            },
            select: { id: true }
        })

        const rawTradeIds = rawTrades.map(t => t.id)
        console.log(`Found ${rawTradeIds.length} raw trades to delete`)

        // Delete matched trades that reference these raw trades
        const deletedMatchedTrades = await prisma.matchedTrade.deleteMany({
            where: {
                OR: [
                    { buyTradeId: { in: rawTradeIds } },
                    { sellTradeId: { in: rawTradeIds } }
                ]
            }
        })
        console.log(`Deleted ${deletedMatchedTrades.count} matched trades`)

        // For open trades, we need to identify which ones were created from this upload
        // We'll need to add a tradeBookId field to OpenTrade model in the future
        // For now, we'll leave open trades as they might be from other uploads
        console.log('Note: Open trades are not automatically deleted to preserve data integrity')
        console.log('Recommendation: Add tradeBookId field to OpenTrade model for proper cleanup')

        // Delete raw trades
        const deletedRawTrades = await prisma.rawTrade.deleteMany({
            where: {
                tradeBookId: tradeBookId,
                userId: userId
            }
        })
        console.log(`Deleted ${deletedRawTrades.count} raw trades`)

        // Finally delete the trade book
        const deletedTradeBook = await prisma.tradeBook.delete({
            where: {
                id: tradeBookId,
                userId: userId
            }
        })
        console.log(`Deleted trade book: ${deletedTradeBook.fileName}`)

        // Clean up orphaned data and recalculate open positions
        console.log('Cleaning up orphaned data and recalculating positions...')

        // Find and delete matched trades that reference non-existent raw trades
        const orphanedMatchedTrades = await prisma.matchedTrade.findMany({
            where: {
                userId: userId,
                OR: [
                    { buyTradeId: { not: null } },
                    { sellTradeId: { not: null } }
                ]
            }
        })

        let orphanedCount = 0
        for (const matchedTrade of orphanedMatchedTrades) {
            const buyExists = await prisma.rawTrade.findUnique({
                where: { id: matchedTrade.buyTradeId || '' }
            })
            const sellExists = await prisma.rawTrade.findUnique({
                where: { id: matchedTrade.sellTradeId || '' }
            })

            if (!buyExists || !sellExists) {
                await prisma.matchedTrade.delete({
                    where: { id: matchedTrade.id }
                })
                orphanedCount++
            }
        }
        console.log(`Cleaned up ${orphanedCount} orphaned matched trades`)

        // Recalculate all open positions and matched trades based on remaining raw trades
        await recalculateAllPositionsAndMatches(userId)
        console.log('Recalculated all open positions and matched trades')

        return NextResponse.json({
            success: true,
            message: `Successfully deleted trade book: ${deletedTradeBook.fileName}`,
            deletedCounts: {
                rawTrades: deletedRawTrades.count,
                matchedTrades: deletedMatchedTrades.count,
                orphanedMatchedTrades: orphanedCount
            }
        })
    } catch (error) {
        console.error('Trade book deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete trade book' }, { status: 500 })
    }
}

async function handleDataCleanup(userId: string) {
    try {
        console.log(`Starting data cleanup for user ${userId}`)

        // Find and delete orphaned matched trades
        const orphanedMatchedTrades = await prisma.matchedTrade.findMany({
            where: {
                userId: userId,
                OR: [
                    { buyTradeId: { not: null } },
                    { sellTradeId: { not: null } }
                ]
            }
        })

        let orphanedMatchedCount = 0
        for (const matchedTrade of orphanedMatchedTrades) {
            const buyExists = await prisma.rawTrade.findUnique({
                where: { id: matchedTrade.buyTradeId || '' }
            })
            const sellExists = await prisma.rawTrade.findUnique({
                where: { id: matchedTrade.sellTradeId || '' }
            })

            if (!buyExists || !sellExists) {
                await prisma.matchedTrade.delete({
                    where: { id: matchedTrade.id }
                })
                orphanedMatchedCount++
            }
        }

        // Recalculate all open positions and matched trades based on remaining raw trades
        await recalculateAllPositionsAndMatches(userId)

        // Generate comprehensive trading summary after cleanup
        await generateTradingSummary(userId)

        const finalOpenTrades = await prisma.openTrade.findMany({
            where: { userId: userId }
        })

        console.log(`Recalculated ${finalOpenTrades.length} open trades and generated trading summary`)

        return NextResponse.json({
            success: true,
            message: 'Data cleanup completed',
            cleanupResults: {
                orphanedMatchedTrades: orphanedMatchedCount,
                recalculatedOpenTrades: finalOpenTrades.length
            }
        })
    } catch (error) {
        console.error('Data cleanup error:', error)
        return NextResponse.json({ error: 'Failed to cleanup data' }, { status: 500 })
    }
}

/**
 * Recalculate all open positions and matched trades for a user
 */
async function recalculateAllPositionsAndMatches(userId: string) {
    try {
        console.log('Recalculating all positions and matches for user:', userId)

        // Get all unique symbols for this user
        const symbols = await prisma.rawTrade.findMany({
            where: { userId },
            select: { symbol: true },
            distinct: ['symbol']
        })

        // Clear all existing matched trades and open trades to recalculate from scratch
        await prisma.matchedTrade.deleteMany({
            where: { userId }
        })
        await prisma.openTrade.deleteMany({
            where: { userId }
        })

        // Process each symbol
        for (const { symbol } of symbols) {
            // Get all trades for this symbol
            const allTrades = await prisma.rawTrade.findMany({
                where: { userId, symbol },
                orderBy: { tradeDatetime: 'asc' }
            })

            const buyTrades = allTrades.filter(trade => trade.tradeType === 'BUY')
            const sellTrades = allTrades.filter(trade => trade.tradeType === 'SELL')

            // Recalculate matched trades
            await matchTrades(userId, symbol, buyTrades, sellTrades)

            // Recalculate open positions
            await updateOpenPositions(userId, symbol, buyTrades, sellTrades)
        }

        console.log('Successfully recalculated all positions and matches')
    } catch (error) {
        console.error('Error recalculating positions and matches:', error)
    }
}

/**
 * Match buy and sell trades using ALL trades for a symbol
 */
async function matchTrades(userId: string, symbol: string, allBuyTrades: any[], allSellTrades: any[]) {
    try {
        let buyIndex = 0
        let sellIndex = 0

        while (buyIndex < allBuyTrades.length && sellIndex < allSellTrades.length) {
            const buyTrade = allBuyTrades[buyIndex]
            const sellTrade = allSellTrades[sellIndex]

            const buyQuantity = Number(buyTrade.quantity)
            const sellQuantity = Number(sellTrade.quantity)
            const matchQuantity = Math.min(buyQuantity, sellQuantity)

            if (matchQuantity > 0) {
                // Create matched trade
                await prisma.matchedTrade.create({
                    data: {
                        userId,
                        symbol,
                        buyDate: buyTrade.tradeDatetime,
                        sellDate: sellTrade.tradeDatetime,
                        buyTime: buyTrade.tradeDatetime.toTimeString().split(' ')[0],
                        sellTime: sellTrade.tradeDatetime.toTimeString().split(' ')[0],
                        quantity: matchQuantity,
                        buyPrice: Number(buyTrade.price),
                        sellPrice: Number(sellTrade.price),
                        pnl: (Number(sellTrade.price) - Number(buyTrade.price)) * matchQuantity,
                        pnlPct: ((Number(sellTrade.price) - Number(buyTrade.price)) / Number(buyTrade.price)) * 100,
                        commission: 0,
                        buyTradeId: buyTrade.id,
                        sellTradeId: sellTrade.id,
                        duration: Math.floor((sellTrade.tradeDatetime.getTime() - buyTrade.tradeDatetime.getTime()) / (1000 * 60))
                    }
                })

                // Update remaining quantities for next iteration
                const remainingBuyQuantity = buyQuantity - matchQuantity
                const remainingSellQuantity = sellQuantity - matchQuantity

                if (remainingBuyQuantity === 0) buyIndex++
                if (remainingSellQuantity === 0) sellIndex++
            }
        }
    } catch (error) {
        console.error('Error matching trades:', error)
    }
}

/**
 * Update open positions by aggregating ALL trades for a symbol
 */
async function updateOpenPositions(userId: string, symbol: string, allBuyTrades: any[], allSellTrades: any[]) {
    try {
        // Calculate total quantities and values from ALL trades
        const totalBuyQuantity = allBuyTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const totalSellQuantity = allSellTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const netQuantity = totalBuyQuantity - totalSellQuantity

        if (netQuantity !== 0) {
            // Calculate weighted average price from ALL buy trades
            const weightedAveragePrice = calculateWeightedAveragePrice(allBuyTrades)

            // Create open trade
            await prisma.openTrade.create({
                data: {
                    userId,
                    symbol,
                    tradeType: netQuantity > 0 ? 'BUY' : 'SELL',
                    date: new Date(),
                    time: new Date().toTimeString().split(' ')[0],
                    price: weightedAveragePrice,
                    quantity: Math.abs(netQuantity),
                    commission: 0,
                    remainingQuantity: Math.abs(netQuantity),
                    averagePrice: weightedAveragePrice,
                    lastUpdated: new Date()
                }
            })

            console.log(`Created open position for ${symbol}: ${netQuantity} units @ ₹${weightedAveragePrice.toFixed(2)}`)
        }
    } catch (error) {
        console.error('Error updating open positions:', error)
    }
}

/**
 * Calculate weighted average price for trades
 */
function calculateWeightedAveragePrice(trades: any[]): number {
    if (trades.length === 0) return 0

    const totalValue = trades.reduce((sum, trade) => sum + (trade.price * Number(trade.quantity)), 0)
    const totalQuantity = trades.reduce((sum, trade) => sum + Number(trade.quantity), 0)

    return totalQuantity > 0 ? totalValue / totalQuantity : 0
}

/**
 * Generate comprehensive trading summary for user
 */
async function generateTradingSummary(userId: string) {
    try {
        console.log(`Generating trading summary for user ${userId} after data cleanup`)

        // Import the trading summary service
        const { TradingSummaryService } = await import('@/lib/services/trading-summary-service')

        // Generate summary with default options
        const summaryData = await TradingSummaryService.generateSummary({
            userId,
            includeOpenPositions: true,
            includeBehavioralAnalysis: true
        })

        // Save to database
        await TradingSummaryService.saveSummary(userId, summaryData, { version: 1 })

        console.log(`Successfully generated and saved trading summary for user ${userId}`)

    } catch (error) {
        console.error('Error generating trading summary:', error)
        // Don't throw error - summary generation failure shouldn't break the cleanup
    }
}
