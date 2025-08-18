import { prisma } from './prisma'

export interface UserProfile {
    id: string
    clerkUserId: string
    email: string
    name: string
    totalCapital: number
    maxDailyDrawdownPct: number
    maxConsecutiveLosses: number
    riskPerTradePct: number
    createdAt: Date
    updatedAt: Date
}

export interface CreateUserData {
    clerkUserId: string
    email: string
    name: string
    totalCapital?: number
    maxDailyDrawdownPct?: number
    maxConsecutiveLosses?: number
    riskPerTradePct?: number
}

export interface UpdateUserData {
    email?: string
    name?: string
    totalCapital?: number
    maxDailyDrawdownPct?: number
    maxConsecutiveLosses?: number
    riskPerTradePct?: number
}

export class UserService {
    static async getUserByClerkId(clerkUserId: string): Promise<UserProfile | null> {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
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

        if (!user) {
            return null
        }

        return user
    }

    static async getUserByEmail(email: string): Promise<UserProfile | null> {
        const user = await prisma.user.findUnique({
            where: { email },
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

        if (!user) {
            return null
        }

        return user
    }

    static async createUser(data: CreateUserData): Promise<UserProfile> {
        const user = await prisma.user.create({
            data: {
                clerkUserId: data.clerkUserId,
                email: data.email,
                name: data.name,
                totalCapital: data.totalCapital || 0,
                maxDailyDrawdownPct: data.maxDailyDrawdownPct || 2.0,
                maxConsecutiveLosses: data.maxConsecutiveLosses || 3,
                riskPerTradePct: data.riskPerTradePct || 1.0,
            },
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

        return user
    }

    static async updateUser(clerkUserId: string, data: UpdateUserData): Promise<UserProfile> {
        const user = await prisma.user.update({
            where: { clerkUserId },
            data: {
                ...(data.email && { email: data.email }),
                ...(data.name && { name: data.name }),
                ...(data.totalCapital !== undefined && { totalCapital: data.totalCapital }),
                ...(data.maxDailyDrawdownPct !== undefined && { maxDailyDrawdownPct: data.maxDailyDrawdownPct }),
                ...(data.maxConsecutiveLosses !== undefined && { maxConsecutiveLosses: data.maxConsecutiveLosses }),
                ...(data.riskPerTradePct !== undefined && { riskPerTradePct: data.riskPerTradePct }),
            },
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

        return user
    }

    static async deleteUser(clerkUserId: string): Promise<void> {
        await prisma.user.delete({
            where: { clerkUserId }
        })
    }

    static async getUserWithStats(clerkUserId: string) {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: {
                matchedTrades: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                riskSessions: {
                    orderBy: { sessionDate: 'desc' },
                    take: 5
                }
            }
        })

        if (!user) {
            return null
        }

        return user
    }

    static async userExists(clerkUserId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true }
        })
        return !!user
    }
} 