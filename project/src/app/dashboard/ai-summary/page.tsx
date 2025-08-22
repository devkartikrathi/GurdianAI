"use client"

import { useUser } from '@clerk/nextjs'
import AITradingSummary from '@/components/dashboard/ai-trading-summary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AISummaryPage() {
  const { user } = useUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Authentication Required</h3>
            <p className="text-muted-foreground">Please sign in to view your AI trading summary.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Trading Summary</h1>
            <p className="text-muted-foreground">
              AI-powered insights into your trading performance and psychology
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Info Card */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Brain className="h-5 w-5" />
                <span>How AI Summary Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🤖 AI Analysis</h4>
                  <p>Our AI analyzes your trading data, behavioral patterns, and market context using Google Gemini</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📊 Comprehensive Insights</h4>
                  <p>Get detailed analysis of your strengths, improvement areas, and personalized recommendations</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⏰ Daily Limit</h4>
                  <p>Generate one AI summary per day to ensure quality insights and manage costs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary Component */}
          <AITradingSummary userId={user.id} />
        </div>
      </div>
    </div>
  )
}
