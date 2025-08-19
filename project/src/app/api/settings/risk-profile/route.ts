import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      select: {
        totalCapital: true,
        maxDailyDrawdownPct: true,
        maxConsecutiveLosses: true,
        riskPerTradePct: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalCapital: Number(user.totalCapital),
        maxDailyDrawdownPct: Number(user.maxDailyDrawdownPct),
        maxConsecutiveLosses: user.maxConsecutiveLosses,
        riskPerTradePct: Number(user.riskPerTradePct)
      }
    })

  } catch (error) {
    console.error('Risk profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      totalCapital,
      maxDailyDrawdownPct,
      maxConsecutiveLosses,
      riskPerTradePct
    } = body

    // Validate required fields
    if (!totalCapital || !maxDailyDrawdownPct || !maxConsecutiveLosses || !riskPerTradePct) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate ranges
    if (totalCapital <= 0) {
      return NextResponse.json({ error: 'Total capital must be positive' }, { status: 400 })
    }
    if (maxDailyDrawdownPct <= 0 || maxDailyDrawdownPct > 50) {
      return NextResponse.json({ error: 'Daily drawdown must be between 0.1% and 50%' }, { status: 400 })
    }
    if (maxConsecutiveLosses <= 0 || maxConsecutiveLosses > 20) {
      return NextResponse.json({ error: 'Max consecutive losses must be between 1 and 20' }, { status: 400 })
    }
    if (riskPerTradePct <= 0 || riskPerTradePct > 10) {
      return NextResponse.json({ error: 'Risk per trade must be between 0.1% and 10%' }, { status: 400 })
    }

    // Update user's risk profile
    const updatedUser = await prisma.user.update({
      where: { clerkUserId: clerkUser.id },
      data: {
        totalCapital: parseFloat(totalCapital),
        maxDailyDrawdownPct: parseFloat(maxDailyDrawdownPct),
        maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
        riskPerTradePct: parseFloat(riskPerTradePct)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Risk profile updated successfully',
      data: {
        totalCapital: Number(updatedUser.totalCapital),
        maxDailyDrawdownPct: Number(updatedUser.maxDailyDrawdownPct),
        maxConsecutiveLosses: updatedUser.maxConsecutiveLosses,
        riskPerTradePct: Number(updatedUser.riskPerTradePct)
      }
    })

  } catch (error) {
    console.error('Risk profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 