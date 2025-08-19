import { Decimal } from '@prisma/client/runtime/library'

export interface RawTradeInput {
    id: string
    symbol: string
    tradeType: 'BUY' | 'SELL'
    quantity: number
    price: number
    tradeDatetime: Date
    commission: number
    tradeId?: string
}

export interface MatchedTradeResult {
    id: string
    symbol: string
    buyDate: Date
    sellDate: Date
    buyTime?: string
    sellTime?: string
    quantity: number
    buyPrice: number
    sellPrice: number
    pnl: number
    pnlPct: number
    commission: number
    buyTradeId: string
    sellTradeId: string
    duration?: number
}

export interface OpenPositionResult {
    id: string
    symbol: string
    tradeType: 'BUY' | 'SELL'
    date: Date
    time?: string
    price: number
    quantity: number
    commission: number
    tradeId?: string
    remainingQuantity: number
    averagePrice: number
}

export interface TradeMatchingResult {
    matchedTrades: MatchedTradeResult[]
    openPositions: OpenPositionResult[]
    totalMatched: number
    totalUnmatched: number
    netProfit: number
}

export class TradeMatchingService {
    /**
     * Main function to match trades using FIFO logic
     */
    static matchTrades(rawTrades: RawTradeInput[]): TradeMatchingResult {
        // Group trades by symbol
        const tradeMap: { [symbol: string]: RawTradeInput[] } = {}

        for (const trade of rawTrades) {
            if (!tradeMap[trade.symbol]) {
                tradeMap[trade.symbol] = []
            }
            tradeMap[trade.symbol].push({ ...trade })
        }

        const matchedTrades: MatchedTradeResult[] = []
        const openPositions: OpenPositionResult[] = []

        // Process each symbol
        for (const symbol in tradeMap) {
            const trades = tradeMap[symbol]

            // Separate buys and sells, sort by date
            const buys: (RawTradeInput & { remainingQty: number })[] = trades
                .filter(t => t.tradeType === 'BUY')
                .map(t => ({ ...t, remainingQty: t.quantity }))
                .sort((a, b) => a.tradeDatetime.getTime() - b.tradeDatetime.getTime())

            const sells: (RawTradeInput & { remainingQty: number })[] = trades
                .filter(t => t.tradeType === 'SELL')
                .map(t => ({ ...t, remainingQty: t.quantity }))
                .sort((a, b) => a.tradeDatetime.getTime() - b.tradeDatetime.getTime())

            // Match trades using FIFO (First In, First Out)
            while (sells.length > 0 && buys.length > 0) {
                const buy = buys[0]
                const sell = sells[0]
                const matchQty = Math.min(buy.remainingQty, sell.remainingQty)

                if (matchQty > 0) {
                    const profit = (sell.price - buy.price) * matchQty
                    const totalCommission = (buy.commission || 0) + (sell.commission || 0)
                    const netProfit = profit - totalCommission

                    const duration = this.calculateDuration(buy.tradeDatetime, sell.tradeDatetime)
                    const pnlPct = buy.price > 0 ? (netProfit / (buy.price * matchQty)) * 100 : 0

                    matchedTrades.push({
                        id: this.generateId(),
                        symbol,
                        buyDate: buy.tradeDatetime,
                        sellDate: sell.tradeDatetime,
                        buyTime: this.formatTime(buy.tradeDatetime),
                        sellTime: this.formatTime(sell.tradeDatetime),
                        quantity: matchQty,
                        buyPrice: buy.price,
                        sellPrice: sell.price,
                        pnl: parseFloat(netProfit.toFixed(2)),
                        pnlPct: parseFloat(pnlPct.toFixed(4)),
                        commission: totalCommission,
                        buyTradeId: buy.id,
                        sellTradeId: sell.id,
                        duration,
                    })

                    buy.remainingQty -= matchQty
                    sell.remainingQty -= matchQty
                }

                // Remove fully matched trades
                if (buy.remainingQty === 0) buys.shift()
                if (sell.remainingQty === 0) sells.shift()
            }

            // Add remaining unmatched buys as open long positions
            buys.forEach(buy => {
                if (buy.remainingQty > 0) {
                    openPositions.push({
                        id: this.generateId(),
                        symbol,
                        tradeType: 'BUY',
                        date: buy.tradeDatetime,
                        time: this.formatTime(buy.tradeDatetime),
                        price: buy.price,
                        quantity: buy.remainingQty, // Use remaining quantity, not total
                        commission: buy.commission || 0,
                        tradeId: buy.tradeId,
                        remainingQuantity: buy.remainingQty,
                        averagePrice: buy.price,
                    })
                }
            })

            // Add remaining unmatched sells as open short positions
            sells.forEach(sell => {
                if (sell.remainingQty > 0) {
                    openPositions.push({
                        id: this.generateId(),
                        symbol,
                        tradeType: 'SELL',
                        date: sell.tradeDatetime,
                        time: this.formatTime(sell.tradeDatetime),
                        price: sell.price,
                        quantity: sell.remainingQty, // Use remaining quantity, not total
                        commission: sell.commission || 0,
                        tradeId: sell.tradeId,
                        remainingQuantity: sell.remainingQty,
                        averagePrice: sell.price,
                    })
                }
            })
        }

        const totalMatched = matchedTrades.length
        const totalUnmatched = openPositions.length
        const netProfit = matchedTrades.reduce((sum, trade) => sum + trade.pnl, 0)

        return {
            matchedTrades,
            openPositions,
            totalMatched,
            totalUnmatched,
            netProfit: parseFloat(netProfit.toFixed(2)),
        }
    }

    /**
     * Calculate duration between two dates in minutes
     */
    private static calculateDuration(buyDate: Date, sellDate: Date): number | undefined {
        try {
            const diffMs = sellDate.getTime() - buyDate.getTime()
            return Math.round(diffMs / (1000 * 60)) // Convert to minutes
        } catch {
            return undefined
        }
    }

    /**
     * Format time from date object
     */
    private static formatTime(date: Date): string {
        return date.toTimeString().split(' ')[0]
    }

    /**
     * Generate unique ID
     */
    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9)
    }

    /**
     * Update raw trades with matching information
     */
    static updateRawTradesWithMatching(
        rawTrades: RawTradeInput[],
        matchingResult: TradeMatchingResult
    ): RawTradeInput[] {
        const updatedTrades = [...rawTrades]

        // Update matched quantities and flags
        for (const matchedTrade of matchingResult.matchedTrades) {
            const buyTrade = updatedTrades.find(t => t.id === matchedTrade.buyTradeId)
            const sellTrade = updatedTrades.find(t => t.id === matchedTrade.sellTradeId)

            if (buyTrade) {
                buyTrade.quantity = buyTrade.quantity - matchedTrade.quantity
                if (buyTrade.quantity <= 0) {
                    buyTrade.quantity = 0
                }
            }

            if (sellTrade) {
                sellTrade.quantity = sellTrade.quantity - matchedTrade.quantity
                if (sellTrade.quantity <= 0) {
                    sellTrade.quantity = 0
                }
            }
        }

        return updatedTrades
    }
}
