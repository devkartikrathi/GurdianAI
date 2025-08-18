import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import Papa from 'papaparse'
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

    // Debug logging
    console.log('Upload API received:');
    console.log('File:', file?.name);
    console.log('Column mapping string:', columnMappingStr);
    console.log('All form data keys:', Array.from(formData.keys()));

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!columnMappingStr) {
      return NextResponse.json({ error: 'Column mapping is required' }, { status: 400 })
    }

    // Parse column mapping
    const columnMapping = JSON.parse(columnMappingStr) as Record<string, string>
    console.log('Parsed column mapping:', columnMapping);

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

    // Read file content
    const text = await file.text()

    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim()
    })

    if (result.errors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing errors',
        details: result.errors
      }, { status: 400 })
    }

    const rows = result.data as any[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in CSV' }, { status: 400 })
    }

    // Create trade book record
    const tradeBook = await prisma.tradeBook.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        totalRows: rows.length,
        schemaMapping: columnMapping,
        parsed: false
      }
    })

    // Process and validate trades
    const trades = []
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because of 0-based index and header row

      try {
        // Extract values using column mapping
        const symbol = row[columnMapping.symbol]?.toString().toUpperCase().trim()
        const tradeTypeRaw = row[columnMapping.trade_type]?.toString().toUpperCase().trim()
        const quantityRaw = row[columnMapping.quantity]
        const priceRaw = row[columnMapping.price]
        const amountRaw = columnMapping.amount ? row[columnMapping.amount] : null
        const datetimeRaw = row[columnMapping.trade_datetime]

        // Validate required fields
        if (!symbol) {
          errors.push(`Row ${rowNumber}: Missing or invalid symbol`)
          continue
        }

        if (!tradeTypeRaw || !['BUY', 'SELL'].includes(tradeTypeRaw)) {
          errors.push(`Row ${rowNumber}: Invalid trade type (must be BUY or SELL)`)
          continue
        }

        const quantity = parseInt(quantityRaw)
        if (!quantity || quantity <= 0) {
          errors.push(`Row ${rowNumber}: Invalid quantity (must be positive number)`)
          continue
        }

        const price = parseFloat(priceRaw)
        if (!price || price <= 0) {
          errors.push(`Row ${rowNumber}: Invalid price (must be positive number)`)
          continue
        }

        // Parse datetime
        let tradeDatetime: Date
        try {
          tradeDatetime = new Date(datetimeRaw)
          if (isNaN(tradeDatetime.getTime())) {
            errors.push(`Row ${rowNumber}: Invalid date format`)
            continue
          }
        } catch {
          errors.push(`Row ${rowNumber}: Invalid date format`)
          continue
        }

        // Calculate amount if not provided
        let amount = amountRaw ? parseFloat(amountRaw) : quantity * price
        if (!amount || amount <= 0) {
          amount = quantity * price
        }

        trades.push({
          tradeBookId: tradeBook.id,
          userId: user.id,
          symbol,
          tradeType: tradeTypeRaw,
          quantity,
          price,
          amount,
          tradeDatetime,
          source: 'csv'
        })

      } catch (error) {
        errors.push(`Row ${rowNumber}: Processing error - ${error}`)
      }
    }

    if (trades.length === 0) {
      // Delete the trade book if no valid trades
      await prisma.tradeBook.delete({
        where: { id: tradeBook.id }
      })

      return NextResponse.json({
        error: 'No valid trades found in CSV',
        details: errors
      }, { status: 400 })
    }

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
      errors: errors.length > 0 ? errors : undefined
    })

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
          buyDatetime: buyTrade.tradeDatetime,
          sellDatetime: sellTrade.tradeDatetime,
          duration,
          tradeSessionDate: buyTrade.tradeDatetime
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