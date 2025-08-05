import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Trade schema validation
const TradeSchema = z.object({
  symbol: z.string().min(1),
  trade_type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  trade_datetime: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user record
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('User lookup error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user doesn't exist, create one (this should be handled by a webhook in production)
    if (!userData) {
      // For now, return an error - in production this should be handled by Clerk webhooks
      return NextResponse.json({
        error: 'User profile not found. Please contact support.'
      }, { status: 404 })
    }

    const userId = userData.id

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    // Read and parse CSV
    const text = await file.text()
    const { data, errors: parseErrors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseErrors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing failed',
        details: parseErrors
      }, { status: 400 })
    }

    // Auto-detect column mapping
    const columns = Object.keys(data[0] || {})
    const mapping = detectColumnMapping(columns, data[0])

    if (!mapping) {
      return NextResponse.json({
        error: 'Could not detect required columns. Please ensure your CSV contains: symbol, trade type, quantity, price, and date/time columns.'
      }, { status: 400 })
    }

    // Process trades
    const processedTrades = []
    const validationErrors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      try {
        const trade = {
          symbol: row[mapping.symbol]?.toString().trim(),
          trade_type: row[mapping.trade_type]?.toString().trim().toUpperCase(),
          quantity: parseFloat(row[mapping.quantity]) || 0,
          price: parseFloat(row[mapping.price]) || 0,
          trade_datetime: parseDateTime(row[mapping.datetime]),
        }

        const validatedTrade = TradeSchema.parse(trade)
        processedTrades.push({
          ...validatedTrade,
          user_id: userId, // Use the UUID from the users table
          source: 'csv',
          amount: validatedTrade.quantity * validatedTrade.price,
        })
      } catch (error) {
        validationErrors.push(`Row ${i + 1}: ${error}`)
      }
    }

    if (processedTrades.length === 0) {
      return NextResponse.json({
        error: 'No valid trades found in CSV'
      }, { status: 400 })
    }

    // Insert trades into database
    const { error: insertError } = await supabase
      .from('raw_trades')
      .insert(processedTrades)

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({
        error: 'Failed to save trades to database'
      }, { status: 500 })
    }

    // Process trade matching (simplified)
    const matchedTrades = await processTradeMatching(userId, processedTrades)

    return NextResponse.json({
      success: true,
      total_trades: processedTrades.length,
      matched_trades: matchedTrades.length,
      message: `Successfully processed ${processedTrades.length} trades. ${matchedTrades.length} trades were matched.`,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function detectColumnMapping(columns: string[], sampleRow: any) {
  const mapping: any = {}

  // Common column name patterns
  const columnPatterns = {
    symbol: ['symbol', 'stock', 'instrument', 'scrip', 'ticker'],
    trade_type: ['type', 'side', 'action', 'buy/sell', 'transaction'],
    quantity: ['quantity', 'qty', 'shares', 'lots', 'volume'],
    price: ['price', 'rate', 'value'],
    datetime: ['date', 'time', 'datetime', 'timestamp', 'execution_time'],
  }

  for (const [key, patterns] of Object.entries(columnPatterns)) {
    const found = columns.find(col =>
      patterns.some(pattern =>
        col.toLowerCase().includes(pattern.toLowerCase())
      )
    )
    if (found) {
      mapping[key] = found
    }
  }

  // Validate we have all required fields
  const required = ['symbol', 'trade_type', 'quantity', 'price', 'datetime']
  const hasAllRequired = required.every(field => mapping[field])

  return hasAllRequired ? mapping : null
}

function parseDateTime(dateTimeStr: string): string {
  // Try multiple date formats
  const formats = [
    'DD/MM/YYYY HH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'DD-MM-YYYY HH:mm:ss',
  ]

  for (const format of formats) {
    try {
      // Simple parsing - in production use a proper date library
      const date = new Date(dateTimeStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch (error) {
      continue
    }
  }

  // Fallback to current time
  return new Date().toISOString()
}

async function processTradeMatching(userId: string, trades: any[]) {
  // Simplified trade matching logic
  // In production, this would be more sophisticated
  const buyTrades = trades.filter(t => t.trade_type === 'BUY')
  const sellTrades = trades.filter(t => t.trade_type === 'SELL')

  const matched = []

  for (const buy of buyTrades) {
    const matchingSell = sellTrades.find(sell =>
      sell.symbol === buy.symbol &&
      sell.quantity === buy.quantity
    )

    if (matchingSell) {
      matched.push({
        user_id: userId,
        symbol: buy.symbol,
        quantity: buy.quantity,
        buy_price: buy.price,
        sell_price: matchingSell.price,
        pnl: (matchingSell.price - buy.price) * buy.quantity,
        pnl_pct: ((matchingSell.price - buy.price) / buy.price) * 100,
        buy_datetime: buy.trade_datetime,
        sell_datetime: matchingSell.trade_datetime,
        duration: new Date(matchingSell.trade_datetime).getTime() - new Date(buy.trade_datetime).getTime(),
        trade_session_date: new Date(buy.trade_datetime).toISOString().split('T')[0],
      })
    }
  }

  // Insert matched trades
  if (matched.length > 0) {
    await supabase.from('matched_trades').insert(matched)
  }

  return matched
}