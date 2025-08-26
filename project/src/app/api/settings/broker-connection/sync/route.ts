import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService } from '@/lib/broker-integration/zerodha-service'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { connectionId } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get the broker connection
        const brokerConnection = await prisma.brokerConnection.findFirst({
            where: {
                id: connectionId,
                userId: user.id
            }
        })

        if (!brokerConnection) {
            return NextResponse.json({ error: 'Broker connection not found' }, { status: 404 })
        }

        if (brokerConnection.connectionStatus !== 'active') {
            return NextResponse.json({
                error: 'Broker connection is not active. Please test the connection first.'
            }, { status: 400 })
        }

        let tradesCount = 0
        let positionsCount = 0

        // Sync trades based on broker type
        if (brokerConnection.brokerName === 'zerodha') {
            try {
                const zerodhaService = createZerodhaService({
                    apiKey: brokerConnection.apiKey,
                    apiSecret: brokerConnection.apiSecret || '',
                    accessToken: brokerConnection.accessToken || undefined
                })

                // Check if token is expired
                if (zerodhaService.isTokenExpired()) {
                    return NextResponse.json({
                        error: 'Access token has expired. Please re-authenticate with Zerodha.'
                    }, { status: 401 })
                }

                // Fetch today's trades
                const todayTrades = await zerodhaService.fetchTodaysTrades()
                tradesCount = todayTrades.length

                // Fetch current positions
                const positions = await zerodhaService.fetchPositions()
                positionsCount = positions.length

                // Process and store trades using incremental updates for better performance
                if (todayTrades.length > 0) {
                    // Create a trade book for this sync
                    const tradeBook = await prisma.tradeBook.create({
                        data: {
                            userId: user.id,
                            fileName: `zerodha_sync_${new Date().toISOString().split('T')[0]}`,
                            fileSize: 0,
                            parsed: true,
                            totalRows: todayTrades.length,
                            schemaMapping: {
                                source: 'zerodha_api',
                                syncDate: new Date().toISOString()
                            }
                        }
                    })

                    // Store raw trades
                    const rawTrades = todayTrades.map(trade => ({
                        userId: user.id,
                        tradeBookId: tradeBook.id,
                        symbol: trade.symbol,
                        tradeType: trade.tradeType,
                        quantity: trade.quantity,
                        price: trade.price,
                        tradeDatetime: trade.tradeDatetime,
                        commission: 0, // Zerodha doesn't provide commission in trades API
                        tradeId: trade.tradeId
                    }))

                    await prisma.rawTrade.createMany({
                        data: rawTrades
                    })

                    // Process only the new trades for matching and open positions
                    await processNewTradesIncrementally(user.id, rawTrades)

                    // Create or update daily trades summary
                    await createOrUpdateDailyTrades(user.id, connectionId, todayTrades)

                    // Check if we need to do a full recalculation for data integrity
                    // This should happen rarely, not on every sync
                    const needsRecalculation = await checkDataIntegrity(user.id)
                    if (needsRecalculation) {
                        console.log('Data integrity issues detected, performing full recalculation...')
                        await recalculateAllPositionsAndMatches(user.id)
                    }

                    // Update trading summary with new data
                    await generateTradingSummary(user.id)

                    // Generate comprehensive trading summary
                    await generateTradingSummary(user.id)
                }

                // Update connection status and last sync time
                await prisma.brokerConnection.update({
                    where: { id: connectionId },
                    data: {
                        lastSyncAt: new Date()
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Trades synced successfully',
                    data: {
                        tradesCount,
                        positionsCount,
                        brokerName: brokerConnection.brokerName,
                        lastSyncAt: new Date().toISOString()
                    }
                })

            } catch (error) {
                console.error('Zerodha sync failed:', error)

                // Update connection status to error
                await prisma.brokerConnection.update({
                    where: { id: connectionId },
                    data: {
                        connectionStatus: 'error',
                        lastSyncAt: new Date()
                    }
                })

                return NextResponse.json({
                    error: 'Failed to sync trades from Zerodha',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }, { status: 500 })
            }
        } else {
            // For other brokers, return not implemented
            return NextResponse.json({
                error: 'Sync not implemented for this broker yet',
                brokerName: brokerConnection.brokerName
            }, { status: 501 })
        }

    } catch (error) {
        console.error('Broker sync error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * Process only new trades incrementally without recalculating everything
 */
async function processNewTradesIncrementally(userId: string, newTrades: any[]) {
    try {
        // Group new trades by symbol
        const tradesBySymbol = newTrades.reduce((acc, trade) => {
            if (!acc[trade.symbol]) {
                acc[trade.symbol] = { buy: [], sell: [] }
            }
            if (trade.tradeType === 'BUY') {
                acc[trade.symbol].buy.push(trade)
            } else {
                acc[trade.symbol].sell.push(trade)
            }
            return acc
        }, {})

        // Process each symbol incrementally
        for (const [symbol, trades] of Object.entries(tradesBySymbol)) {
            const newBuyTrades = (trades as any).buy
            const newSellTrades = (trades as any).sell

            // Get existing open position for this symbol
            const existingPosition = await prisma.openTrade.findFirst({
                where: { userId, symbol }
            })

            if (existingPosition) {
                // Update existing position with new trades
                await updateOpenPositionIncrementally(userId, symbol, newBuyTrades, newSellTrades, existingPosition)
            } else {
                // Create new position if none exists
                await createNewOpenPosition(userId, symbol, newBuyTrades, newSellTrades)
            }

            // Process new trade matches if we have both buy and sell trades
            if (newBuyTrades.length > 0 && newSellTrades.length > 0) {
                await processNewTradeMatches(userId, symbol, newBuyTrades, newSellTrades)
            }
        }
    } catch (error) {
        console.error('Error processing new trades incrementally:', error)
    }
}

/**
 * Update existing open position incrementally with new trades
 */
async function updateOpenPositionIncrementally(userId: string, symbol: string, newBuyTrades: any[], newSellTrades: any[], existingPosition: any) {
    try {
        // Calculate new quantities
        const newBuyQuantity = newBuyTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const newSellQuantity = newSellTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)

        // Calculate new weighted average price for buy trades
        let newAveragePrice = existingPosition.averagePrice
        if (newBuyTrades.length > 0) {
            const newBuyValue = newBuyTrades.reduce((sum, trade) => sum + (Number(trade.price) * Number(trade.quantity)), 0)
            const newBuyQuantity = newBuyTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)

            // Calculate weighted average with existing position
            const existingValue = Number(existingPosition.averagePrice) * Number(existingPosition.quantity)
            const totalValue = existingValue + newBuyValue
            const totalQuantity = Number(existingPosition.quantity) + newBuyQuantity

            newAveragePrice = totalValue / totalQuantity
        }

        // Calculate net change
        const netChange = newBuyQuantity - newSellQuantity
        const newQuantity = Number(existingPosition.quantity) + netChange

        if (newQuantity === 0) {
            // Position closed, remove it
            await prisma.openTrade.delete({
                where: { id: existingPosition.id }
            })
            console.log(`Closed position for ${symbol} (net quantity = 0)`)
        } else {
            // Update existing position
            await prisma.openTrade.update({
                where: { id: existingPosition.id },
                data: {
                    quantity: Math.abs(newQuantity),
                    averagePrice: newAveragePrice,
                    price: newAveragePrice,
                    remainingQuantity: Math.abs(newQuantity),
                    lastUpdated: new Date()
                }
            })
            console.log(`Updated position for ${symbol}: ${newQuantity} units @ ₹${newAveragePrice.toFixed(2)}`)
        }
    } catch (error) {
        console.error('Error updating position incrementally:', error)
    }
}

/**
 * Create new open position for a symbol
 */
async function createNewOpenPosition(userId: string, symbol: string, newBuyTrades: any[], newSellTrades: any[]) {
    try {
        const buyQuantity = newBuyTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const sellQuantity = newSellTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const netQuantity = buyQuantity - sellQuantity

        if (netQuantity !== 0) {
            // Calculate weighted average price for buy trades
            const weightedAveragePrice = calculateWeightedAveragePrice(newBuyTrades)

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
            console.log(`Created new position for ${symbol}: ${netQuantity} units @ ₹${weightedAveragePrice.toFixed(2)}`)
        }
    } catch (error) {
        console.error('Error creating new position:', error)
    }
}

/**
 * Process new trade matches without recalculating everything
 */
async function processNewTradeMatches(userId: string, symbol: string, newBuyTrades: any[], newSellTrades: any[]) {
    try {
        // Only process matches between new trades, not with existing ones
        // This is a simplified approach - for more complex scenarios, you might want
        // to implement a more sophisticated matching algorithm

        let buyIndex = 0
        let sellIndex = 0

        while (buyIndex < newBuyTrades.length && sellIndex < newSellTrades.length) {
            const buyTrade = newBuyTrades[buyIndex]
            const sellTrade = newSellTrades[sellIndex]

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

                // Update remaining quantities
                const remainingBuyQuantity = buyQuantity - matchQuantity
                const remainingSellQuantity = sellQuantity - matchQuantity

                if (remainingBuyQuantity === 0) buyIndex++
                if (remainingSellQuantity === 0) sellIndex++
            }
        }

        console.log(`Processed new trade matches for ${symbol}: ${newBuyTrades.length} buy, ${newSellTrades.length} sell`)
    } catch (error) {
        console.error('Error processing new trade matches:', error)
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
        console.log(`Generating trading summary for user ${userId} after sync`)

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
        // Don't throw error - summary generation failure shouldn't break the sync
    }
}

/**
 * Calculate average price for trades (legacy function for backward compatibility)
 */
function calculateAveragePrice(trades: any[]): number {
    return calculateWeightedAveragePrice(trades)
}

/**
 * Recalculate all open positions and matched trades for a user
 * 
 * WARNING: This function processes ALL trades from the beginning of time and should
 * only be used for:
 * - Data integrity checks
 * - Recovery from data corruption
 * - Initial setup
 * - Manual admin operations
 * 
 * DO NOT call this on every broker sync as it will cause performance issues
 * and unnecessary processing of historical data.
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

        // Clear all existing data to recalculate from scratch
        await prisma.matchedTrade.deleteMany({ where: { userId } })
        await prisma.openTrade.deleteMany({ where: { userId } })

        // Process each symbol
        for (const { symbol } of symbols) {
            // Get all trades for this symbol
            const allTrades = await prisma.rawTrade.findMany({
                where: { userId, symbol },
                orderBy: { tradeDatetime: 'asc' }
            })

            const buyTrades = allTrades.filter(trade => trade.tradeType === 'BUY')
            const sellTrades = allTrades.filter(trade => trade.tradeType === 'SELL')

            // Create open position
            await createNewOpenPosition(userId, symbol, buyTrades, sellTrades)

            // Process trade matches
            if (buyTrades.length > 0 && sellTrades.length > 0) {
                await processNewTradeMatches(userId, symbol, buyTrades, sellTrades)
            }
        }

        console.log('Successfully recalculated all positions and matches')
    } catch (error) {
        console.error('Error recalculating positions and matches:', error)
    }
}

/**
 * Check if data integrity issues exist that require full recalculation
 */
async function checkDataIntegrity(userId: string): Promise<boolean> {
    try {
        // Check for orphaned matched trades
        const orphanedMatchedTrades = await prisma.matchedTrade.findMany({
            where: {
                userId,
                OR: [
                    { buyTradeId: null },
                    { sellTradeId: null }
                ]
            }
        })

        // Check for mismatched quantities
        const openTrades = await prisma.openTrade.findMany({
            where: { userId }
        })

        let hasQuantityMismatch = false
        for (const openTrade of openTrades) {
            const symbolTrades = await prisma.rawTrade.findMany({
                where: { userId, symbol: openTrade.symbol }
            })

            const buyQuantity = symbolTrades
                .filter(t => t.tradeType === 'BUY')
                .reduce((sum, t) => sum + Number(t.quantity), 0)
            const sellQuantity = symbolTrades
                .filter(t => t.tradeType === 'SELL')
                .reduce((sum, t) => sum + Number(t.quantity), 0)

            const expectedQuantity = buyQuantity - sellQuantity
            if (Math.abs(expectedQuantity - Number(openTrade.quantity)) > 0.01) {
                hasQuantityMismatch = true
                break
            }
        }

        // Return true if any integrity issues are found
        return orphanedMatchedTrades.length > 0 || hasQuantityMismatch
    } catch (error) {
        console.error('Error checking data integrity:', error)
        // If we can't check integrity, assume it's okay to avoid unnecessary recalculations
        return false
    }
}

/**
 * Create or update daily trades summary
 */
async function createOrUpdateDailyTrades(userId: string, brokerConnectionId: string, trades: any[]) {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Start of day

        const buyTrades = trades.filter(t => t.tradeType === 'BUY')
        const sellTrades = trades.filter(t => t.tradeType === 'SELL')

        const totalBuyQuantity = buyTrades.reduce((sum, t) => sum + t.quantity, 0)
        const totalSellQuantity = sellTrades.reduce((sum, t) => sum + t.quantity, 0)
        const totalBuyValue = buyTrades.reduce((sum, t) => sum + (t.price * t.quantity), 0)
        const totalSellValue = sellTrades.reduce((sum, t) => sum + (t.price * t.quantity), 0)

        const netQuantity = totalBuyQuantity - totalSellQuantity
        const netValue = totalBuyValue - totalSellValue

        await prisma.dailyTrades.upsert({
            where: {
                userId_brokerConnectionId_tradeDate: {
                    userId,
                    brokerConnectionId,
                    tradeDate: today
                }
            },
            update: {
                totalTrades: trades.length,
                totalBuyTrades: buyTrades.length,
                totalSellTrades: sellTrades.length,
                totalBuyQuantity,
                totalSellQuantity,
                totalBuyValue,
                totalSellValue,
                netQuantity,
                netValue,
                lastSyncAt: new Date()
            },
            create: {
                userId,
                brokerConnectionId,
                tradeDate: today,
                totalTrades: trades.length,
                totalBuyTrades: buyTrades.length,
                totalSellTrades: sellTrades.length,
                totalBuyQuantity,
                totalSellQuantity,
                totalBuyValue,
                totalSellValue,
                netQuantity,
                netValue
            }
        })
    } catch (error) {
        console.error('Error creating daily trades summary:', error)
    }
}
