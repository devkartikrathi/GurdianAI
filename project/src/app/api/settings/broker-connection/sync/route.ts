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

                // Process and store trades
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

                    // Process trades for matching and open positions
                    await processTradesForMatching(user.id, rawTrades)

                    // Create or update daily trades summary
                    await createOrUpdateDailyTrades(user.id, connectionId, todayTrades)

                    // Recalculate all open positions and matched trades to ensure accuracy
                    await recalculateAllPositionsAndMatches(user.id)

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
 * Process trades for matching and open positions
 */
async function processTradesForMatching(userId: string, rawTrades: any[]) {
    try {
        // Group trades by symbol
        const tradesBySymbol = rawTrades.reduce((acc, trade) => {
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

        // Process each symbol
        for (const [symbol, trades] of Object.entries(tradesBySymbol)) {
            const buyTrades = (trades as any).buy
            const sellTrades = (trades as any).sell

            // Match buy and sell trades
            await matchTrades(userId, symbol, buyTrades, sellTrades)

            // Update open positions
            await updateOpenPositions(userId, symbol, buyTrades, sellTrades)
        }
    } catch (error) {
        console.error('Error processing trades for matching:', error)
    }
}

/**
 * Match buy and sell trades using ALL trades for a symbol
 */
async function matchTrades(userId: string, symbol: string, buyTrades: any[], sellTrades: any[]) {
    try {
        // Get ALL raw trades for this symbol from the database for proper matching
        const allRawTrades = await prisma.rawTrade.findMany({
            where: {
                userId,
                symbol
            },
            orderBy: {
                tradeDatetime: 'asc'
            }
        })

        // Separate all trades by type
        const allBuyTrades = allRawTrades.filter(trade => trade.tradeType === 'BUY')
        const allSellTrades = allRawTrades.filter(trade => trade.tradeType === 'SELL')

        // Clear existing matched trades for this symbol to recalculate
        await prisma.matchedTrade.deleteMany({
            where: {
                userId,
                symbol
            }
        })

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

        console.log(`Processed ${allBuyTrades.length} buy trades and ${allSellTrades.length} sell trades for ${symbol}`)
    } catch (error) {
        console.error('Error matching trades:', error)
    }
}

/**
 * Update open positions by aggregating ALL trades for a symbol
 */
async function updateOpenPositions(userId: string, symbol: string, buyTrades: any[], sellTrades: any[]) {
    try {
        // Get ALL raw trades for this symbol from the database (not just current sync)
        const allRawTrades = await prisma.rawTrade.findMany({
            where: {
                userId,
                symbol
            },
            orderBy: {
                tradeDatetime: 'asc'
            }
        })

        // Separate all trades by type
        const allBuyTrades = allRawTrades.filter(trade => trade.tradeType === 'BUY')
        const allSellTrades = allRawTrades.filter(trade => trade.tradeType === 'SELL')

        // Calculate total quantities and values from ALL trades
        const totalBuyQuantity = allBuyTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const totalSellQuantity = allSellTrades.reduce((sum, trade) => sum + Number(trade.quantity), 0)
        const netQuantity = totalBuyQuantity - totalSellQuantity

        if (netQuantity !== 0) {
            // Calculate weighted average price from ALL buy trades
            const weightedAveragePrice = calculateWeightedAveragePrice(allBuyTrades)

            // Create or update open trade
            await prisma.openTrade.upsert({
                where: {
                    userId_symbol_tradeType: {
                        userId,
                        symbol,
                        tradeType: netQuantity > 0 ? 'BUY' : 'SELL'
                    }
                },
                update: {
                    quantity: Math.abs(netQuantity),
                    averagePrice: weightedAveragePrice,
                    price: weightedAveragePrice, // Update the price field as well
                    remainingQuantity: Math.abs(netQuantity),
                    lastUpdated: new Date()
                },
                create: {
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

            console.log(`Updated open position for ${symbol}: ${netQuantity} units @ ₹${weightedAveragePrice.toFixed(2)}`)
        } else {
            // If net quantity is 0, remove any existing open position
            await prisma.openTrade.deleteMany({
                where: {
                    userId,
                    symbol
                }
            })
            console.log(`Removed open position for ${symbol} (net quantity = 0)`)
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
