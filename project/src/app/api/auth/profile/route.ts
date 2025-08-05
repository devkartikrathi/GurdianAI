import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { UserService } from '@/lib/user-service'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await UserService.getUserByClerkId(clerkUser.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        clerkData: {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          imageUrl: clerkUser.imageUrl
        }
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, totalCapital, maxDailyDrawdownPct, maxConsecutiveLosses, riskPerTradePct } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Get current user data to preserve customizations
    const existingUser = await UserService.getUserByClerkId(clerkUser.id)

    const updateData: any = {
      email, // Always update email for security
      totalCapital: totalCapital ? parseFloat(totalCapital) : undefined,
      maxDailyDrawdownPct: maxDailyDrawdownPct ? parseFloat(maxDailyDrawdownPct) : undefined,
      maxConsecutiveLosses: maxConsecutiveLosses ? parseInt(maxConsecutiveLosses) : undefined,
      riskPerTradePct: riskPerTradePct ? parseFloat(riskPerTradePct) : undefined
    }

    // Only update name if it's different from current or if user is explicitly setting it
    if (name && name !== existingUser?.name) {
      updateData.name = name
    }

    const updatedUser = await UserService.updateUser(clerkUser.id, updateData)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete user profile (soft delete or full delete)
export async function DELETE(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user using UserService
    await UserService.deleteUser(clerkUser.id)

    return NextResponse.json({
      success: true,
      message: 'User profile deleted successfully'
    })

  } catch (error) {
    console.error('Profile deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 