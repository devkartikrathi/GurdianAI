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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-800/30 dark:to-indigo-800/30">
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard" 
            className="p-2 hover:bg-blue-200/50 dark:hover:bg-blue-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">AI Trading Summary</h1>
            <p className="text-blue-700 dark:text-blue-300">
              AI-powered insights into your trading performance and psychology
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Info Card */}
          <Card className="mb-6 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/50 dark:to-teal-950/50 border-2 border-cyan-200/30 dark:border-cyan-700/30 hover:border-cyan-300/50 dark:hover:border-cyan-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-cyan-100/30 to-teal-100/30 dark:from-cyan-800/30 dark:to-teal-800/30 border-b border-cyan-200/40 dark:border-cyan-600/40">
              <CardTitle className="flex items-center space-x-2 text-cyan-900 dark:text-cyan-100">
                <div className="p-1 bg-cyan-500/20 dark:bg-cyan-400/20 rounded">
                  <Brain className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span>How AI Summary Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-cyan-700 dark:text-cyan-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 text-cyan-800 dark:text-cyan-200">🤖 AI Analysis</h4>
                  <p>Our AI analyzes your trading data, behavioral patterns, and market context using Google Gemini</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-cyan-800 dark:text-cyan-200">📊 Comprehensive Insights</h4>
                  <p>Get detailed analysis of your strengths, improvement areas, and personalized recommendations</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-cyan-800 dark:text-cyan-200">⏰ Daily Limit</h4>
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
