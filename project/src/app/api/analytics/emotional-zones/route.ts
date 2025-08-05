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
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get user's matched trades
        const trades = await prisma.matchedTrade.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        if (trades.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    emotionalZones: [],
                    timeSlots: [],
                    dayOfWeek: [],
                    monthlyPatterns: []
                }
            })
        }

        // Define time slots
        const timeSlots = [
            { slot: '09:00-10:00', start: 9, end: 10 },
            { slot: '10:00-11:00', start: 10, end: 11 },
            { slot: '11:00-12:00', start: 11, end: 12 },
            { slot: '12:00-13:00', start: 12, end: 13 },
            { slot: '13:00-14:00', start: 13, end: 14 },
            { slot: '14:00-15:00', start: 14, end: 15 },
            { slot: '15:00-16:00', start: 15, end: 16 },
            { slot: '16:00-17:00', start: 16, end: 17 },
            { slot: '17:00-18:00', start: 17, end: 18 },
            { slot: '18:00-19:00', start: 18, end: 19 },
            { slot: '19:00-20:00', start: 19, end: 20 },
            { slot: '20:00-21:00', start: 20, end: 21 },
            { slot: '21:00-22:00', start: 21, end: 22 },
            { slot: '22:00-23:00', start: 22, end: 23 },
            { slot: '23:00-00:00', start: 23, end: 0 },
            { slot: '00:00-01:00', start: 0, end: 1 },
            { slot: '01:00-02:00', start: 1, end: 2 },
            { slot: '02:00-03:00', start: 2, end: 3 },
            { slot: '03:00-04:00', start: 3, end: 4 },
            { slot: '04:00-05:00', start: 4, end: 5 },
            { slot: '05:00-06:00', start: 5, end: 6 },
            { slot: '06:00-07:00', start: 6, end: 7 },
            { slot: '07:00-08:00', start: 7, end: 8 },
            { slot: '08:00-09:00', start: 8, end: 9 }
        ]

        // Analyze trades by time slot
        const timeSlotAnalysis = timeSlots.map(slot => {
            const slotTrades = trades.filter(trade => {
                const tradeHour = new Date(trade.buyDatetime).getHours()
                return tradeHour >= slot.start && tradeHour < slot.end
            })

            if (slotTrades.length === 0) {
                return {
                    slot: slot.slot,
                    totalTrades: 0,
                    winRate: 0,
                    avgPnl: 0,
                    totalPnl: 0,
                    emotionalZone: 'neutral'
                }
            }

            const totalTrades = slotTrades.length
            const winRate = slotTrades.filter(trade => Number(trade.pnl) > 0).length / slotTrades.length
            const totalPnl = slotTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
            const avgPnl = totalPnl / totalTrades

            // Determine emotional zone based on performance
            let emotionalZone = 'neutral'
            if (winRate > 0.6 && avgPnl > 0) {
                emotionalZone = 'euphoric'
            } else if (winRate < 0.4 && avgPnl < 0) {
                emotionalZone = 'fearful'
            } else if (winRate > 0.5 && avgPnl > 0) {
                emotionalZone = 'confident'
            } else if (winRate < 0.5 && avgPnl < 0) {
                emotionalZone = 'anxious'
            }

            return {
                slot: slot.slot,
                totalTrades,
                winRate: Math.round(winRate * 100),
                avgPnl: Math.round(avgPnl * 100) / 100,
                totalPnl: Math.round(totalPnl * 100) / 100,
                emotionalZone
            }
        })

        // Analyze trades by day of week
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayOfWeekAnalysis = daysOfWeek.map(day => {
            const dayTrades = trades.filter(trade => {
                const tradeDay = new Date(trade.buyDatetime).getDay()
                return tradeDay === daysOfWeek.indexOf(day)
            })

            if (dayTrades.length === 0) {
                return {
                    day,
                    totalTrades: 0,
                    winRate: 0,
                    avgPnl: 0,
                    totalPnl: 0
                }
            }

            const totalTrades = dayTrades.length
            const winRate = dayTrades.filter(trade => Number(trade.pnl) > 0).length / dayTrades.length
            const totalPnl = dayTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)
            const avgPnl = totalPnl / totalTrades

            return {
                day,
                totalTrades,
                winRate: Math.round(winRate * 100),
                avgPnl: Math.round(avgPnl * 100) / 100,
                totalPnl: Math.round(totalPnl * 100) / 100
            }
        })

        // Analyze monthly patterns
        const monthlyAnalysis = trades.reduce((acc, trade) => {
            const month = trade.tradeSessionDate.toISOString().slice(0, 7) // YYYY-MM
            if (!acc[month]) {
                acc[month] = {
                    month,
                    totalTrades: 0,
                    winningTrades: 0,
                    totalPnl: 0
                }
            }
            acc[month].totalTrades++
            if (Number(trade.pnl) > 0) {
                acc[month].winningTrades++
            }
            acc[month].totalPnl += Number(trade.pnl)
            return acc
        }, {} as Record<string, any>)

        const monthlyPatterns = Object.values(monthlyAnalysis).map((month: any) => ({
            month: month.month,
            totalTrades: month.totalTrades,
            winRate: Math.round((month.winningTrades / month.totalTrades) * 100),
            totalPnl: Math.round(month.totalPnl * 100) / 100,
            avgPnl: Math.round((month.totalPnl / month.totalTrades) * 100) / 100
        }))

        return NextResponse.json({
            success: true,
            data: {
                emotionalZones: timeSlotAnalysis.filter(slot => slot.totalTrades > 0),
                timeSlots: timeSlotAnalysis,
                dayOfWeek: dayOfWeekAnalysis,
                monthlyPatterns
            }
        })

    } catch (error) {
        console.error('Emotional zones analytics error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 