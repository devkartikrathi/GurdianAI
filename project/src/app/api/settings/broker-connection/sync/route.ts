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
 * Match buy and sell trades
 */
async function matchTrades(userId: string, symbol: string, buyTrades: any[], sellTrades: any[]) {
    try {
        let buyIndex = 0
        let sellIndex = 0

        while (buyIndex < buyTrades.length && sellIndex < sellTrades.length) {
            const buyTrade = buyTrades[buyIndex]
            const sellTrade = sellTrades[sellIndex]

            const buyQuantity = buyTrade.quantity
            const sellQuantity = sellTrade.quantity
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
                        buyPrice: buyTrade.price,
                        sellPrice: sellTrade.price,
                        pnl: (sellTrade.price - buyTrade.price) * matchQuantity,
                        pnlPct: ((sellTrade.price - buyTrade.price) / buyTrade.price) * 100,
                        commission: 0,
                        buyTradeId: buyTrade.id,
                        sellTradeId: sellTrade.id,
                        duration: Math.floor((sellTrade.tradeDatetime.getTime() - buyTrade.tradeDatetime.getTime()) / (1000 * 60))
                    }
                })

                // Update remaining quantities
                buyTrade.quantity -= matchQuantity
                sellTrade.quantity -= matchQuantity

                if (buyTrade.quantity === 0) buyIndex++
                if (sellTrade.quantity === 0) sellIndex++
            }
        }
    } catch (error) {
        console.error('Error matching trades:', error)
    }
}

/**
 * Update open positions
 */
async function updateOpenPositions(userId: string, symbol: string, buyTrades: any[], sellTrades: any[]) {
    try {
        const totalBuyQuantity = buyTrades.reduce((sum, trade) => sum + trade.quantity, 0)
        const totalSellQuantity = sellTrades.reduce((sum, trade) => sum + trade.quantity, 0)
        const netQuantity = totalBuyQuantity - totalSellQuantity

        if (netQuantity !== 0) {
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
                    averagePrice: calculateAveragePrice(buyTrades),
                    lastUpdated: new Date()
                },
                create: {
                    userId,
                    symbol,
                    tradeType: netQuantity > 0 ? 'BUY' : 'SELL',
                    date: new Date(),
                    time: new Date().toTimeString().split(' ')[0],
                    price: calculateAveragePrice(buyTrades),
                    quantity: Math.abs(netQuantity),
                    commission: 0,
                    remainingQuantity: Math.abs(netQuantity),
                    averagePrice: calculateAveragePrice(buyTrades),
                    lastUpdated: new Date()
                }
            })
        }
    } catch (error) {
        console.error('Error updating open positions:', error)
    }
}

/**
 * Calculate average price for trades
 */
function calculateAveragePrice(trades: any[]): number {
    if (trades.length === 0) return 0
    
    const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0)
    const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0)
    
    return totalQuantity > 0 ? totalValue / totalQuantity : 0
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
