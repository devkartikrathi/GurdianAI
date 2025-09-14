


import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { CSVParser } from '@/lib/trade-processing/csv-parser'

export async function POST(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        try {
            // Use our enhanced CSV parser
            const schema = await CSVParser.detectSchema(file)

            return NextResponse.json({ schema })

        } catch (error) {
            console.error('CSV parsing error:', error)
            return NextResponse.json({
                error: 'Failed to parse CSV file',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 400 })
        }

    } catch (error) {
        console.error('Schema detection error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 