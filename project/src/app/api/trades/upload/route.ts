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

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
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

    // Validate required columns
    const firstRow = rows[0]
    const requiredColumns = ['date', 'symbol', 'side', 'quantity', 'price']
    const missingColumns = requiredColumns.filter(col => !firstRow[col])

    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    // Process and insert trades
    const trades = rows.map(row => ({
      userId: user.id,
      symbol: row.symbol?.toUpperCase() || '',
      tradeType: row.side?.toUpperCase() || 'BUY',
      quantity: parseInt(row.quantity) || 0,
      price: parseFloat(row.price) || 0,
      amount: (parseInt(row.quantity) || 0) * (parseFloat(row.price) || 0),
      tradeDatetime: new Date(row.date),
      source: 'csv'
    })).filter(trade => 
      trade.symbol && 
      trade.quantity > 0 && 
      trade.price > 0 && 
      !isNaN(trade.tradeDatetime.getTime())
    )

    if (trades.length === 0) {
      return NextResponse.json({ error: 'No valid trades found in CSV' }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${insertedTrades.length} trades`,
      data: {
        totalTrades: insertedTrades.length,
        fileName: file.name,
        fileSize: file.size
      }
    })

  } catch (error) {
    console.error('Trade upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}