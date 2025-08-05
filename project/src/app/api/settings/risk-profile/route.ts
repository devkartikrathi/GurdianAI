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
      data: user
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
    const { totalCapital, maxDailyDrawdownPct, maxConsecutiveLosses, riskPerTradePct } = body

    // Validate required fields
    if (!totalCapital || !maxDailyDrawdownPct || !maxConsecutiveLosses || !riskPerTradePct) {
      return NextResponse.json({
        error: 'All risk profile fields are required'
      }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { clerkUserId: clerkUser.id },
      data: {
        totalCapital: parseFloat(totalCapital),
        maxDailyDrawdownPct: parseFloat(maxDailyDrawdownPct),
        maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
        riskPerTradePct: parseFloat(riskPerTradePct),
        updatedAt: new Date()
      },
      select: {
        totalCapital: true,
        maxDailyDrawdownPct: true,
        maxConsecutiveLosses: true,
        riskPerTradePct: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Risk profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Risk profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 