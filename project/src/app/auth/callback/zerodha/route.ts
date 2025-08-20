import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createZerodhaService } from '@/lib/broker-integration/zerodha-service'

export async function GET(request: NextRequest) {
    try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const requestToken = searchParams.get('request_token')
        const action = searchParams.get('action')
        const status = searchParams.get('status')
        const type = searchParams.get('type')

        console.log('Zerodha OAuth Callback:', { requestToken, action, status, type })

        if (!requestToken) {
            return NextResponse.json({ error: 'Request token is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Find the pending Zerodha connection for this user
        const pendingConnection = await prisma.brokerConnection.findFirst({
            where: {
                userId: user.id,
                brokerName: 'zerodha',
                connectionStatus: 'pending'
            }
        })

        if (!pendingConnection) {
            return NextResponse.json({
                error: 'No pending Zerodha connection found. Please create a connection first.'
            }, { status: 404 })
        }

        try {
            // Create Zerodha service with API credentials
            const zerodhaService = createZerodhaService({
                apiKey: pendingConnection.apiKey,
                apiSecret: pendingConnection.apiSecret || '',
            })

            // Exchange request token for access token
            const session = await zerodhaService.generateSession(requestToken)

            // Update the broker connection with access token and user info
            await prisma.brokerConnection.update({
                where: { id: pendingConnection.id },
                data: {
                    accessToken: session.accessToken,
                    userIdZerodha: session.profile.userId,
                    userName: session.profile.userName,
                    email: session.profile.email,
                    connectionStatus: 'active',
                    lastSyncAt: new Date(),
                    expiresAt: session.expiresAt,
                    // Store OAuth callback parameters for reference
                    oauthAction: action,
                    oauthStatus: status,
                    oauthType: type,
                    oauthCompletedAt: new Date()
                }
            })

            console.log('OAuth completed successfully for connection:', pendingConnection.id)

            // Return a success page that the user can see
            return new NextResponse(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>OAuth Success - GuardianAI</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            margin: 0; padding: 0; min-height: 100vh;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .container {
                            background: white; border-radius: 16px; padding: 48px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                            text-align: center; max-width: 500px; width: 90%;
                        }
                        .success-icon {
                            width: 80px; height: 80px; background: #10b981;
                            border-radius: 50%; display: flex; align-items: center;
                            justify-content: center; margin: 0 auto 24px;
                        }
                        .success-icon svg { width: 40px; height: 40px; color: white; }
                        h1 { color: #1f2937; margin: 0 0 16px; font-size: 28px; }
                        p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
                        .close-btn {
                            background: #3b82f6; color: white; border: none;
                            padding: 12px 24px; border-radius: 8px; font-size: 16px;
                            cursor: pointer; transition: background 0.2s;
                        }
                        .close-btn:hover { background: #2563eb; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1>Authentication Successful!</h1>
                        <p>Your Zerodha connection has been successfully established. You can now close this tab and return to GuardianAI to sync your trades.</p>
                        <button class="close-btn" onclick="window.close()">Close Tab</button>
                    </div>
                </body>
                </html>
            `, {
                headers: {
                    'Content-Type': 'text/html',
                },
            })

        } catch (error) {
            console.error('Zerodha OAuth failed:', error)

            // Update connection status to error
            await prisma.brokerConnection.update({
                where: { id: pendingConnection.id },
                data: {
                    connectionStatus: 'error',
                    lastSyncAt: new Date()
                }
            })

            // Return an error page
            return new NextResponse(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>OAuth Failed - GuardianAI</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            margin: 0; padding: 0; min-height: 100vh;
                            display: flex; align-items: center; justify-content: center;
                        }
                        .container {
                            background: white; border-radius: 16px; padding: 48px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                            text-align: center; max-width: 500px; width: 90%;
                        }
                        .error-icon {
                            width: 80px; height: 80px; background: #ef4444;
                            border-radius: 50%; display: flex; align-items: center;
                            justify-content: center; margin: 0 auto 24px;
                        }
                        .error-icon svg { width: 40px; height: 40px; color: white; }
                        h1 { color: #1f2937; margin: 0 0 16px; font-size: 28px; }
                        p { color: #6b7280; margin: 0 0 24px; line-height: 1.6; }
                        .close-btn {
                            background: #ef4444; color: white; border: none;
                            padding: 12px 24px; border-radius: 8px; font-size: 16px;
                            cursor: pointer; transition: background 0.2s;
                        }
                        .close-btn:hover { background: #dc2626; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h1>Authentication Failed</h1>
                        <p>There was an error completing your Zerodha authentication. Please try again or contact support if the issue persists.</p>
                        <button class="close-btn" onclick="window.close()">Close Tab</button>
                    </div>
                </body>
                </html>
            `, {
                headers: {
                    'Content-Type': 'text/html',
                },
            })
        }

    } catch (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
