


import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import Papa from 'papaparse'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const DATABASE_SCHEMA = {
    symbol: "Stock symbol/ticker (e.g., RELIANCE, INFY, TCS)",
    trade_type: "BUY or SELL",
    quantity: "Number of shares/quantity traded",
    price: "Price per share",
    amount: "Total trade value (quantity * price)",
    trade_datetime: "Date and time of the trade (YYYY-MM-DD HH:MM:SS format)"
}

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        console.log('Schema detection API received file:', file?.name);

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
        }

        // Read file content
        const text = await file.text()
        console.log('File content length:', text.length);

        // Parse CSV to get headers and sample rows
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

        // Get headers and sample data for Gemini analysis
        const headers = Object.keys(rows[0])
        const sampleRows = rows.slice(0, 5) // First 5 rows for analysis

        console.log('CSV headers:', headers);
        console.log('Sample rows count:', sampleRows.length);

        // Analyze column types and sample values
        const columns = headers.map(header => {
            const values = sampleRows.map(row => row[header]).filter(val => val !== undefined && val !== '')
            const sampleValues = values.slice(0, 3) // First 3 non-empty values

            // Determine type based on sample values
            let type: 'string' | 'number' | 'date' = 'string'
            if (sampleValues.length > 0) {
                const firstValue = sampleValues[0]
                if (!isNaN(Number(firstValue)) && firstValue !== '') {
                    type = 'number'
                } else if (isValidDate(firstValue)) {
                    type = 'date'
                }
            }

            return {
                name: header,
                type,
                sample_values: sampleValues
            }
        })

        console.log('Analyzed columns:', columns);

        // Use Gemini to map columns to database schema
        const mapping = await mapColumnsWithGemini(columns, sampleRows)
        console.log('Gemini mapping result:', mapping);

        // Calculate confidence score based on mapping quality
        const confidenceScore = calculateConfidenceScore(mapping, columns)
        console.log('Confidence score:', confidenceScore);

        return NextResponse.json({
            schema: {
                columns,
                suggested_mapping: mapping,
                confidence_score: confidenceScore
            }
        })

    } catch (error) {
        console.error('Schema detection error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function mapColumnsWithGemini(columns: any[], sampleRows: any[]) {
    try {
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.log('No Gemini API key found, using fallback mapping');
            return createFallbackMapping(columns);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
You are an expert at analyzing trading CSV files and mapping columns to a database schema.

DATABASE SCHEMA:
${JSON.stringify(DATABASE_SCHEMA, null, 2)}

CSV COLUMNS FOUND:
${JSON.stringify(columns, null, 2)}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

TASK: Map the CSV columns to the database schema fields. Return ONLY a JSON object with the mapping.

MAPPING RULES:
1. symbol: Look for columns containing stock symbols, tickers, or company names
2. trade_type: Look for columns indicating BUY/SELL, side, action, or transaction type
3. quantity: Look for columns with numeric values representing shares/quantity
4. price: Look for columns with numeric values representing price per share
5. amount: Look for columns with total trade value (can be calculated as quantity * price)
6. trade_datetime: Look for columns with dates/times of trades

EXAMPLES:
- "Symbol" or "Ticker" → symbol
- "Side" or "Action" or "Type" → trade_type
- "Quantity" or "Qty" or "Shares" → quantity
- "Price" or "Rate" → price
- "Amount" or "Value" or "Total" → amount
- "Date" or "Time" or "DateTime" → trade_datetime

Return ONLY the JSON mapping object, no other text.
`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Invalid JSON response from Gemini')
        }

        const mapping = JSON.parse(jsonMatch[0])

        // Validate mapping
        const validFields = Object.keys(DATABASE_SCHEMA)
        const validatedMapping: Record<string, string> = {}

        for (const field of validFields) {
            if (mapping[field] && columns.find(col => col.name === mapping[field])) {
                validatedMapping[field] = mapping[field]
            }
        }

        return validatedMapping

    } catch (error) {
        console.error('Gemini mapping error:', error)
        // Fallback to basic mapping
        return createFallbackMapping(columns)
    }
}

function createFallbackMapping(columns: any[]) {
    const mapping: Record<string, string> = {}

    for (const column of columns) {
        const name = column.name.toLowerCase()

        // Symbol mapping
        if (name.includes('symbol') || name.includes('ticker') || name.includes('stock') ||
            name.includes('company') || name.includes('instrument') || name.includes('scrip')) {
            mapping.symbol = column.name
        }
        // Trade type mapping
        else if (name.includes('side') || name.includes('action') || name.includes('type') ||
            name.includes('trade_type') || name.includes('transaction') || name.includes('order')) {
            mapping.trade_type = column.name
        }
        // Quantity mapping
        else if (name.includes('quantity') || name.includes('qty') || name.includes('shares') ||
            name.includes('volume') || name.includes('units') || name.includes('lot')) {
            mapping.quantity = column.name
        }
        // Price mapping
        else if (name.includes('price') || name.includes('rate') || name.includes('rate_per_share') ||
            name.includes('execution_price') || name.includes('trade_price')) {
            mapping.price = column.name
        }
        // Amount mapping
        else if (name.includes('amount') || name.includes('value') || name.includes('total') ||
            name.includes('gross_amount') || name.includes('trade_value') || name.includes('consideration')) {
            mapping.amount = column.name
        }
        // Date/Time mapping
        else if (name.includes('date') || name.includes('time') || name.includes('datetime') ||
            name.includes('trade_date') || name.includes('execution_time') || name.includes('timestamp')) {
            mapping.trade_datetime = column.name
        }
    }

    console.log('Fallback mapping created:', mapping);
    return mapping
}

function calculateConfidenceScore(mapping: Record<string, string>, columns: any[]) {
    const requiredFields = ['symbol', 'trade_type', 'quantity', 'price', 'trade_datetime']
    const mappedFields = requiredFields.filter(field => mapping[field])

    // Base score from required field coverage
    let score = mappedFields.length / requiredFields.length * 0.7

    // Bonus for having amount field
    if (mapping.amount) {
        score += 0.1
    }

    // Bonus for high-quality column names (exact matches)
    const exactMatches = ['symbol', 'side', 'quantity', 'price', 'amount', 'date', 'time']
    const hasExactMatches = exactMatches.some(match =>
        columns.some(col => col.name.toLowerCase() === match)
    )

    if (hasExactMatches) {
        score += 0.2
    }

    return Math.min(score, 1.0)
}

function isValidDate(value: string): boolean {
    const date = new Date(value)
    return !isNaN(date.getTime())
} 