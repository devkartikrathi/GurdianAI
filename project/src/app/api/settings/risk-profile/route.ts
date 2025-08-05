import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { totalCapital, maxDailyDrawdownPct, maxConsecutiveLosses, riskPerTradePct } = body

        // Validate input
        if (!totalCapital || !maxDailyDrawdownPct || !maxConsecutiveLosses || !riskPerTradePct) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get user's Supabase UUID
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update user's risk profile settings
        const { error: updateError } = await supabase
            .from('users')
            .update({
                total_capital: totalCapital,
                max_daily_drawdown_pct: maxDailyDrawdownPct,
                max_consecutive_losses: maxConsecutiveLosses,
                risk_per_trade_pct: riskPerTradePct,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating risk profile:', updateError)
            return NextResponse.json({ error: 'Failed to update risk profile' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Risk profile updated successfully',
            data: {
                totalCapital,
                maxDailyDrawdownPct,
                maxConsecutiveLosses,
                riskPerTradePct
            }
        })

    } catch (error) {
        console.error('Risk profile update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's risk profile settings
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('total_capital, max_daily_drawdown_pct, max_consecutive_losses, risk_per_trade_pct')
            .eq('clerk_user_id', clerkUserId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            data: {
                totalCapital: user.total_capital,
                maxDailyDrawdownPct: user.max_daily_drawdown_pct,
                maxConsecutiveLosses: user.max_consecutive_losses,
                riskPerTradePct: user.risk_per_trade_pct
            }
        })

    } catch (error) {
        console.error('Risk profile fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 