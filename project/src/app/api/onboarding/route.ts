import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      experience,
      totalCapital,
      riskPerTradePct,
      maxDailyDrawdownPct,
      maxConsecutiveLosses
    } = body

    // Validate required fields
    if (!name || !email || !totalCapital || !riskPerTradePct || !maxDailyDrawdownPct || !maxConsecutiveLosses) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id }
    })

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email: email,
          name: name,
          totalCapital: parseFloat(totalCapital),
          maxDailyDrawdownPct: parseFloat(maxDailyDrawdownPct),
          maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
          riskPerTradePct: parseFloat(riskPerTradePct)
        }
      })
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { clerkUserId: clerkUser.id },
        data: {
          name: name,
          email: email,
          totalCapital: parseFloat(totalCapital),
          maxDailyDrawdownPct: parseFloat(maxDailyDrawdownPct),
          maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
          riskPerTradePct: parseFloat(riskPerTradePct)
        }
      })
    }

    // Create onboarding record
    const onboarding = await prisma.onboarding.create({
      data: {
        userId: user.id,
        experience: experience,
        totalCapital: parseFloat(totalCapital),
        riskPerTradePct: parseFloat(riskPerTradePct),
        maxDailyDrawdownPct: parseFloat(maxDailyDrawdownPct),
        maxConsecutiveLosses: parseInt(maxConsecutiveLosses),
        completed: true,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          totalCapital: user.totalCapital,
          maxDailyDrawdownPct: user.maxDailyDrawdownPct,
          maxConsecutiveLosses: user.maxConsecutiveLosses,
          riskPerTradePct: user.riskPerTradePct
        },
        onboarding: {
          id: onboarding.id,
          experience: onboarding.experience,
          completed: onboarding.completed,
          completedAt: onboarding.completedAt
        }
      }
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      include: {
        onboarding: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          totalCapital: user.totalCapital,
          maxDailyDrawdownPct: user.maxDailyDrawdownPct,
          maxConsecutiveLosses: user.maxConsecutiveLosses,
          riskPerTradePct: user.riskPerTradePct
        },
        onboarding: user.onboarding[0] || null
      }
    })

  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 