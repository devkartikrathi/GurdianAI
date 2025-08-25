import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { CSVParser } from '@/lib/trade-processing/csv-parser'
import { prisma } from '@/lib/prisma'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const columnMappingStr = formData.get('columnMapping') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!columnMappingStr) {
      return NextResponse.json({ error: 'Column mapping is required' }, { status: 400 })
    }

    // Parse column mapping
    const columnMapping = JSON.parse(columnMappingStr) as Record<string, string>

    // Validate required mappings
    const requiredFields = ['symbol', 'trade_type', 'quantity', 'price', 'trade_datetime']
    const missingFields = requiredFields.filter(field => !columnMapping[field])

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required column mappings: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }

    try {
      // Use our enhanced CSV parser
      const parsedTrades = await CSVParser.parseCSV(file, columnMapping)

      if (parsedTrades.length === 0) {
        return NextResponse.json({ error: 'No valid trades found in CSV' }, { status: 400 })
      }

      // Create trade book record
      const tradeBook = await prisma.tradeBook.create({
        data: {
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
          totalRows: parsedTrades.length,
          schemaMapping: columnMapping,
          parsed: false
        }
      })

      // Transform parsed trades to database format
      const trades = parsedTrades.map(trade => ({
        tradeBookId: tradeBook.id,
        userId: user.id,
        symbol: trade.symbol.toUpperCase(),
        tradeType: trade.trade_type,
        quantity: trade.quantity,
        price: trade.price,
        amount: trade.amount || trade.quantity * trade.price,
        tradeDatetime: new Date(trade.trade_datetime),
        source: 'csv'
      }))

      // Insert trades in batches
      const batchSize = 100
      const insertedTrades = []

      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize)
        const batchResult = await prisma.rawTrade.createMany({
          data: batch,
          skipDuplicates: true
        })
        insertedTrades.push(...batch)
      }

      // Update trade book as parsed
      await prisma.tradeBook.update({
        where: { id: tradeBook.id },
        data: { parsed: true }
      })

      // Process matched trades (buy/sell pairs)
      const matchedTrades = await processMatchedTrades(user.id, insertedTrades)

      return NextResponse.json({
        success: true,
        trade_book_id: tradeBook.id,
        total_trades: insertedTrades.length,
        matched_trades: matchedTrades.length,
        open_positions: insertedTrades.length - matchedTrades.length * 2,
        errors: []
      })

    } catch (error) {
      console.error('CSV parsing error:', error)
      return NextResponse.json({
        error: 'Failed to parse CSV file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Trade upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processMatchedTrades(userId: string, trades: any[]) {
  const matchedTrades = []

  // Group trades by symbol
  const tradesBySymbol = trades.reduce((acc: Record<string, any[]>, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = []
    }
    acc[trade.symbol].push(trade)
    return acc
  }, {})

  // Process each symbol's trades
  for (const [symbol, symbolTrades] of Object.entries(tradesBySymbol)) {
    const buyTrades = symbolTrades.filter((t: any) => t.tradeType === 'BUY')
    const sellTrades = symbolTrades.filter((t: any) => t.tradeType === 'SELL')

    // Sort by datetime
    buyTrades.sort((a: any, b: any) => a.tradeDatetime.getTime() - b.tradeDatetime.getTime())
    sellTrades.sort((a: any, b: any) => a.tradeDatetime.getTime() - b.tradeDatetime.getTime())

    // Match buy and sell trades
    let buyIndex = 0
    let sellIndex = 0

    while (buyIndex < buyTrades.length && sellIndex < sellTrades.length) {
      const buyTrade = buyTrades[buyIndex]
      const sellTrade = sellTrades[sellIndex]

      // Only match if sell comes after buy
      if (sellTrade.tradeDatetime > buyTrade.tradeDatetime) {
        const quantity = Math.min(buyTrade.quantity, sellTrade.quantity)
        const pnl = (sellTrade.price - buyTrade.price) * quantity
        const pnlPct = ((sellTrade.price - buyTrade.price) / buyTrade.price) * 100

        // Calculate duration
        const durationMs = sellTrade.tradeDatetime.getTime() - buyTrade.tradeDatetime.getTime()
        const duration = `${Math.floor(durationMs / (1000 * 60 * 60 * 24))} days`

        matchedTrades.push({
          userId,
          symbol,
          quantity,
          buyPrice: buyTrade.price,
          sellPrice: sellTrade.price,
          pnl,
          pnlPct,
          buyDate: buyTrade.tradeDatetime,
          sellDate: sellTrade.tradeDatetime,
          duration: Math.floor(durationMs / (1000 * 60)) // duration in minutes, not string
        })

        // Update quantities
        buyTrade.quantity -= quantity
        sellTrade.quantity -= quantity

        // Remove fully consumed trades
        if (buyTrade.quantity <= 0) buyIndex++
        if (sellTrade.quantity <= 0) sellIndex++
      } else {
        // Skip this sell trade as it's before the buy
        sellIndex++
      }
    }
  }

  // Insert matched trades
  if (matchedTrades.length > 0) {
    const batchResult = await prisma.matchedTrade.createMany({
      data: matchedTrades,
      skipDuplicates: true
    })
  }

  return matchedTrades
}