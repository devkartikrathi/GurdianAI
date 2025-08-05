import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'
import { headers } from 'next/headers'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const headerPayload = headers()
        const svix_id = headerPayload.get("svix-id")
        const svix_timestamp = headerPayload.get("svix-timestamp")
        const svix_signature = headerPayload.get("svix-signature")

        // If there are no headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response('Error occured -- no svix headers', {
                status: 400
            })
        }

        // Get the body
        const payload = await request.json()
        const body = JSON.stringify(payload)

        // Create a new Svix instance with your secret.
        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

        let evt: any

        // Verify the payload with the headers
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            })
        } catch (err) {
            console.error('Error verifying webhook:', err)
            return new Response('Error occured', {
                status: 400
            })
        }

        // Handle the webhook
        const { id } = evt.data
        const eventType = evt.type

        if (eventType === 'user.created') {
            const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data

            const email = email_addresses?.[0]?.email_address || ''
            const name = `${first_name || ''} ${last_name || ''}`.trim() || 'User'

            // Create user in our database
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    clerk_user_id: clerkUserId,
                    email: email,
                    name: name,
                })

            if (insertError) {
                console.error('Error creating user:', insertError)
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
            }

            console.log('User created successfully:', clerkUserId)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 