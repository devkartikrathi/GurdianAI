import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { UserService } from '@/lib/user-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // Get current user from Clerk
        const clerkUser = await currentUser()

        if (!clerkUser) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const clerkUserId = clerkUser.id
        const email = clerkUser.primaryEmailAddress?.emailAddress || 'user@example.com'
        const firstName = clerkUser.firstName || ''
        const lastName = clerkUser.lastName || ''
        const fullName = `${firstName} ${lastName}`.trim() || 'User'

        // Check if user already exists in our database by clerkUserId
        let existingUser = await UserService.getUserByClerkId(clerkUserId)

        // If not found by clerkUserId, check if user exists by email
        if (!existingUser) {
            const userByEmail = await UserService.getUserByEmail(email)

            if (userByEmail) {
                // User exists with this email but different clerkUserId
                // Update the existing user's clerkUserId
                existingUser = await prisma.user.update({
                    where: { email },
                    data: { clerkUserId },
                    select: {
                        id: true,
                        clerkUserId: true,
                        email: true,
                        name: true,
                        totalCapital: true,
                        maxDailyDrawdownPct: true,
                        maxConsecutiveLosses: true,
                        riskPerTradePct: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                })
            }
        }

        if (existingUser) {
            // Only update email if it's different, preserve user's custom name
            const updateData: any = {}

            // Always update email from Clerk (for security)
            updateData.email = email

            // Only update name if user hasn't customized it or if it's empty
            if (!existingUser.name || existingUser.name === 'User' || existingUser.name === '') {
                updateData.name = fullName
            }
            // If user has a custom name, don't overwrite it

            const updatedUser = await UserService.updateUser(clerkUserId, updateData)

            return NextResponse.json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            })
        } else {
            // Create new user
            const newUser = await UserService.createUser({
                clerkUserId: clerkUserId,
                email: email,
                name: fullName
            })

            return NextResponse.json({
                success: true,
                message: 'User created successfully',
                data: newUser
            })
        }

    } catch (error) {
        console.error('User sync error:', error)

        // Handle specific Prisma errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json({
                error: 'User with this email already exists',
                code: 'EMAIL_EXISTS'
            }, { status: 409 })
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET - Fetch current user data
export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()

        if (!clerkUser) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const clerkUserId = clerkUser.id
        const user = await UserService.getUserByClerkId(clerkUserId)

        if (!user) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
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
        console.error('User fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 