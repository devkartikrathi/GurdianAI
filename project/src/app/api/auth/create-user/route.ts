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

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single()

        if (existingUser) {
            return NextResponse.json({
                message: 'User already exists',
                userId: existingUser.id
            })
        }

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                clerk_user_id: clerkUserId,
                email: 'user@example.com', // This should come from Clerk user data
                name: 'User', // This should come from Clerk user data
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating user:', insertError)
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        return NextResponse.json({
            message: 'User created successfully',
            userId: newUser.id
        })

    } catch (error) {
        console.error('Create user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 