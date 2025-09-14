import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TradeMatchingService, RawTradeInput } from '@/lib/trade-matching-service'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if request body is FormData
        const contentType = request.headers.get('content-type')
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return NextResponse.json({
                error: 'Invalid content type. Expected multipart/form-data'
            }, { status: 400 })
        }

        let formData: FormData
        try {
            formData = await request.formData()
        } catch (error) {
            console.error('Error parsing FormData:', error)
            return NextResponse.json({
                error: 'Failed to parse request as FormData',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 400 })
        }

        const file = formData.get('file') as File
        const columnMapping = formData.get('columnMapping') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!columnMapping) {
            return NextResponse.json({ error: 'Column mapping is required' }, { status: 400 })
        }

        // Parse column mapping
        const mapping = JSON.parse(columnMapping)

        // Get user
        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Parse CSV content
        const csvText = await file.text()
        const lines = csvText.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const dataRows = lines.slice(1)

        // Create trade book
        const tradeBook = await prisma.tradeBook.create({
            data: {
                userId: user.id,
                fileName: file.name,
                fileSize: file.size,
                totalRows: dataRows.length,
                parsed: false,
                schemaMapping: mapping
            }
        })

        // Parse trades
        const rawTrades: RawTradeInput[] = []
        const errors: string[] = []

        for (let i = 0; i < dataRows.length; i++) {
            try {
                const row = dataRows[i].split(',').map(cell => cell.trim().replace(/"/g, ''))
                const trade = parseTradeRow(row, headers, mapping, i + 1)
                if (trade) {
                    rawTrades.push({
                        id: `temp_${i}_${Date.now()}`, // Temporary ID for matching
                        symbol: trade.symbol,
                        tradeType: trade.tradeType,
                        quantity: trade.quantity,
                        price: trade.price,
                        tradeDatetime: trade.tradeDatetime,
                        commission: trade.commission,
                        tradeId: trade.tradeId
                    })
                }
            } catch (error) {
                errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`)
            }
        }

        if (rawTrades.length === 0) {
            await prisma.tradeBook.delete({ where: { id: tradeBook.id } })
            return NextResponse.json({ error: 'No valid trades found' }, { status: 400 })
        }

        // Apply trade matching using FIFO logic
        const matchingResult = TradeMatchingService.matchTrades(rawTrades)

        // Save raw trades with proper IDs and matching info
        const savedRawTrades = await Promise.all(
            rawTrades.map(async (trade, index) => {
                return await prisma.rawTrade.create({
                    data: {
                        userId: user.id,
                        tradeBookId: tradeBook.id,
                        symbol: trade.symbol,
                        tradeType: trade.tradeType,
                        quantity: trade.quantity,
                        price: trade.price,
                        tradeDatetime: trade.tradeDatetime,
                        commission: trade.commission,
                        tradeId: trade.tradeId,
                        remainingQuantity: trade.quantity, // Initially all quantity is remaining
                        matchedQuantity: 0,
                        isFullyMatched: false,
                        isOpenPosition: true
                    }
                })
            })
        )

        // Save matched trades
        const savedMatchedTrades = await Promise.all(
            matchingResult.matchedTrades.map(async (matchedTrade) => {
                // Find the actual raw trade IDs
                const buyRawTrade = savedRawTrades.find(t =>
                    t.symbol === matchedTrade.symbol &&
                    t.tradeType === 'BUY' &&
                    t.tradeDatetime.getTime() === matchedTrade.buyDate.getTime()
                )
                const sellRawTrade = savedRawTrades.find(t =>
                    t.symbol === matchedTrade.symbol &&
                    t.tradeType === 'SELL' &&
                    t.tradeDatetime.getTime() === matchedTrade.sellDate.getTime()
                )

                if (buyRawTrade && sellRawTrade) {
                    return await prisma.matchedTrade.create({
                        data: {
                            userId: user.id,
                            symbol: matchedTrade.symbol,
                            buyDate: matchedTrade.buyDate,
                            sellDate: matchedTrade.sellDate,
                            buyTime: matchedTrade.buyTime,
                            sellTime: matchedTrade.sellTime,
                            quantity: matchedTrade.quantity,
                            buyPrice: matchedTrade.buyPrice,
                            sellPrice: matchedTrade.sellPrice,
                            pnl: matchedTrade.pnl,
                            pnlPct: matchedTrade.pnlPct,
                            commission: matchedTrade.commission,
                            buyTradeId: buyRawTrade.id,
                            sellTradeId: sellRawTrade.id,
                            duration: matchedTrade.duration,
                            isRealized: true
                        }
                    })
                }
                return null
            })
        )

        // Save open positions with consolidation and trade book tracking
        const openPositionMap = new Map<string, any>()

        for (const openPosition of matchingResult.openPositions) {
            const key = `${openPosition.symbol}_${openPosition.tradeType}`

            if (openPositionMap.has(key)) {
                // Consolidate with existing position
                const existing = openPositionMap.get(key)
                const totalQuantity = existing.quantity + openPosition.quantity
                const totalValue = (existing.quantity * existing.price) + (openPosition.quantity * openPosition.price)
                const averagePrice = totalValue / totalQuantity

                openPositionMap.set(key, {
                    ...existing,
                    quantity: totalQuantity,
                    price: averagePrice,
                    commission: existing.commission + openPosition.commission,
                    // Track that this position includes trades from this upload
                    tradeBookIds: [...(existing.tradeBookIds || []), tradeBook.id]
                })
            } else {
                // New position
                openPositionMap.set(key, {
                    ...openPosition,
                    tradeBookIds: [tradeBook.id] // Track this upload
                })
            }
        }


        const savedOpenPositions = await Promise.all(
            Array.from(openPositionMap.values()).map(async (openPosition) => {
                return await prisma.openTrade.upsert({
                    where: {
                        userId_symbol_tradeType: {
                            userId: user.id,
                            symbol: openPosition.symbol,
                            tradeType: openPosition.tradeType
                        }
                    },
                    update: {
                        quantity: { increment: openPosition.quantity },
                        price: openPosition.price, // Update to new average price
                        commission: { increment: openPosition.commission },
                        remainingQuantity: { increment: openPosition.remainingQuantity },
                        averagePrice: openPosition.price,
                        lastUpdated: new Date()
                    },
                    create: {
                        userId: user.id,
                        symbol: openPosition.symbol,
                        tradeType: openPosition.tradeType,
                        date: openPosition.date,
                        time: openPosition.time,
                        price: openPosition.price,
                        quantity: openPosition.quantity,
                        commission: openPosition.commission,
                        tradeId: openPosition.tradeId,
                        remainingQuantity: openPosition.remainingQuantity,
                        averagePrice: openPosition.price,
                        unrealizedPnl: 0,
                        unrealizedPnlPct: 0
                    }
                })
            })
        )

        // Update trade book as parsed
        await prisma.tradeBook.update({
            where: { id: tradeBook.id },
            data: { parsed: true }
        })

        // Update raw trades with matching information
        for (const matchedTrade of matchingResult.matchedTrades) {
            const buyRawTrade = savedRawTrades.find(t =>
                t.symbol === matchedTrade.symbol &&
                t.tradeType === 'BUY' &&
                t.tradeDatetime.getTime() === matchedTrade.buyDate.getTime()
            )
            const sellRawTrade = savedRawTrades.find(t =>
                t.symbol === matchedTrade.symbol &&
                t.tradeType === 'SELL' &&
                t.tradeDatetime.getTime() === matchedTrade.sellDate.getTime()
            )

            if (buyRawTrade) {
                await prisma.rawTrade.update({
                    where: { id: buyRawTrade.id },
                    data: {
                        matchedQuantity: { increment: matchedTrade.quantity },
                        remainingQuantity: { decrement: matchedTrade.quantity },
                        isFullyMatched: Number(buyRawTrade.quantity) === matchedTrade.quantity,
                        isOpenPosition: Number(buyRawTrade.quantity) > matchedTrade.quantity
                    }
                })
            }

            if (sellRawTrade) {
                await prisma.rawTrade.update({
                    where: { id: sellRawTrade.id },
                    data: {
                        matchedQuantity: { increment: matchedTrade.quantity },
                        remainingQuantity: { decrement: matchedTrade.quantity },
                        isFullyMatched: Number(sellRawTrade.quantity) === matchedTrade.quantity,
                        isOpenPosition: Number(sellRawTrade.quantity) > matchedTrade.quantity
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Trades uploaded and matched successfully',
            data: {
                tradeBookId: tradeBook.id,
                totalRows: dataRows.length,
                validTrades: rawTrades.length,
                matchedTrades: matchingResult.matchedTrades.length,
                openPositions: matchingResult.openPositions.length,
                netProfit: matchingResult.netProfit,
                errors: errors.slice(0, 10) // Limit errors in response
            }
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({
            error: 'Failed to upload trades',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

function parseTradeRow(
    row: string[],
    headers: string[],
    mapping: Record<string, string>,
    rowNumber: number
): Omit<RawTradeInput, 'id'> | null {
    try {
        // Helper function to get value from mapped column
        const getValue = (field: string): string => {
            const columnName = mapping[field]
            if (!columnName) return ''
            const index = headers.findIndex(h => h === columnName)
            return index >= 0 ? row[index] || '' : ''
        }

        const symbol = getValue('symbol')?.toUpperCase().trim()
        const tradeType = getValue('tradeType')?.toUpperCase().trim()
        const quantityStr = getValue('quantity')
        const priceStr = getValue('price')
        const dateStr = getValue('date')
        const timeStr = getValue('time')
        const commissionStr = getValue('commission')

        if (!symbol || !tradeType || !quantityStr || !priceStr || !dateStr) {
            throw new Error('Missing required fields')
        }

        // Validate trade type
        if (!['BUY', 'SELL', 'B', 'S'].includes(tradeType)) {
            throw new Error(`Invalid trade type: ${tradeType}`)
        }

        // Parse numeric values
        const quantity = parseFloat(quantityStr.replace(/[^\d.-]/g, ''))
        const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''))
        const commission = parseFloat(commissionStr.replace(/[^\d.-]/g, '')) || 0

        if (isNaN(quantity) || quantity <= 0) {
            throw new Error(`Invalid quantity: ${quantityStr}`)
        }

        if (isNaN(price) || price <= 0) {
            throw new Error(`Invalid price: ${priceStr}`)
        }

        // Parse date
        const tradeDate = parseDate(dateStr, timeStr)
        if (!tradeDate) {
            throw new Error(`Invalid date format: ${dateStr}`)
        }

        // Normalize trade type
        let normalizedTradeType: 'BUY' | 'SELL'
        if (tradeType === 'B' || tradeType === 'BUY') {
            normalizedTradeType = 'BUY'
        } else if (tradeType === 'S' || tradeType === 'SELL') {
            normalizedTradeType = 'SELL'
        } else {
            throw new Error(`Invalid trade type: ${tradeType}`)
        }

        return {
            symbol,
            tradeType: normalizedTradeType,
            quantity,
            price,
            tradeDatetime: tradeDate,
            commission,
            tradeId: getValue('tradeId') || undefined
        }

    } catch (error) {
        throw new Error(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Invalid data'}`)
    }
}

function parseDate(dateStr: string, timeStr?: string): Date | null {
    try {
        // Try common date formats
        const dateFormats = [
            'dd/MM/yyyy',
            'MM/dd/yyyy',
            'yyyy-MM-dd',
            'dd-MM-yyyy',
            'dd/MM/yy',
            'MM/dd/yy'
        ]

        let parsedDate: Date | null = null

        for (const format of dateFormats) {
            try {
                // Simple date parsing for common formats
                if (format === 'dd/MM/yyyy') {
                    const [day, month, year] = dateStr.split('/')
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                } else if (format === 'MM/dd/yyyy') {
                    const [month, day, year] = dateStr.split('/')
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                } else if (format === 'yyyy-MM-dd') {
                    parsedDate = new Date(dateStr)
                } else if (format === 'dd-MM-yyyy') {
                    const [day, month, year] = dateStr.split('-')
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    break
                }
            } catch {
                continue
            }
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
            return null
        }

        // Add time if provided
        if (timeStr) {
            const [hours, minutes, seconds] = timeStr.split(':').map(Number)
            parsedDate.setHours(hours || 0, minutes || 0, seconds || 0)
        }

        return parsedDate

    } catch {
        return null
    }
}
