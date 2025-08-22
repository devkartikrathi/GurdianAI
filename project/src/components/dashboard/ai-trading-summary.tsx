"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lightbulb,
  Shield,
  Activity,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Eye,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

export interface AITradingSummaryData {
  // Overall Performance Metrics
  totalTrades: number
  totalBuyTrades: number
  totalSellTrades: number
  totalVolume: number
  totalValue: number
  
  // P&L Analysis
  totalPnL: number
  totalPnLPct: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  
  // Risk Metrics
  maxDrawdown: number
  maxDrawdownPct: number
  sharpeRatio: number
  volatility: number
  
  // Time-based Analysis
  tradingDays: number
  averageTradesPerDay: number
  bestDay: { date: string; pnl: number }
  worstDay: { date: string; pnl: number }
  
  // Symbol Analysis
  topSymbols: Array<{ symbol: string; trades: number; pnl: number; volume: number }>
  symbolPerformance: Array<{ symbol: string; winRate: number; avgPnL: number; totalPnL: number }>
  
  // Position Analysis
  openPositions: number
  totalOpenValue: number
  unrealizedPnL: number
  
  // Behavioral Analysis
  averageHoldingPeriod: number
  mostActiveHour: number
  mostActiveDay: string
  consecutiveWins: number
  consecutiveLosses: number
  
  // Monthly/Weekly Breakdowns
  monthlyPerformance: Array<{ month: string; trades: number; pnl: number; volume: number }>
  weeklyPerformance: Array<{ week: string; trades: number; pnl: number; volume: number }>
  
  // AI-Generated Insights
  aiInsights: {
    behavioralPatterns: string[]
    riskAssessment: string
    improvementAreas: string[]
    strengths: string[]
    recommendations: string[]
    marketContext: string
    psychologicalFactors: string[]
  }
  
  // Index signature for JSON compatibility
  [key: string]: any
}

interface AITradingSummaryProps {
  userId: string
  className?: string
}

export default function AITradingSummary({ userId, className }: AITradingSummaryProps) {
  const [summary, setSummary] = useState<AITradingSummaryData | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [canGenerate, setCanGenerate] = useState(true)
  const [nextAvailable, setNextAvailable] = useState<Date | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSummary()
    checkGenerationLimit()
  }, [userId])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/ai-trading-summary?action=get`)
      
      if (response.ok) {
        const data = await response.json()
        setSummary(data.data.summary)
        setMetadata(data.data.metadata)
        setCanGenerate(data.data.generation.canGenerate)
        setNextAvailable(data.data.generation.nextAvailable)
      } else if (response.status === 404) {
        // No summary exists yet
        setSummary(null)
        setMetadata(null)
        const limitResponse = await fetch(`/api/ai-trading-summary?action=check-limit`)
        if (limitResponse.ok) {
          const limitData = await limitResponse.json()
          setCanGenerate(limitData.data.canGenerate)
          setNextAvailable(limitData.data.nextAvailable)
        }
      }
    } catch (error) {
      console.error('Error loading AI summary:', error)
      toast({
        title: "Error",
        description: "Failed to load AI trading summary",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkGenerationLimit = async () => {
    try {
      const response = await fetch(`/api/ai-trading-summary?action=check-limit`)
      if (response.ok) {
        const data = await response.json()
        setCanGenerate(data.data.canGenerate)
        setNextAvailable(data.data.data.nextAvailable)
      }
    } catch (error) {
      console.error('Error checking generation limit:', error)
    }
  }

  const generateSummary = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/ai-trading-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.data.summary)
        setMetadata(data.data.metadata)
        setCanGenerate(false)
        toast({
          title: "Success",
          description: "AI trading summary generated successfully!",
        })
      } else {
        const errorData = await response.json()
        if (response.status === 429) {
          setCanGenerate(false)
          setNextAvailable(errorData.nextAvailable)
          toast({
            title: "Daily Limit Reached",
            description: errorData.message,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Error",
            description: errorData.message || "Failed to generate AI summary",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error)
      toast({
        title: "Error",
        description: "Failed to generate AI trading summary",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading AI Trading Summary...</span>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">AI Trading Summary</CardTitle>
            <CardDescription>
              Get AI-powered insights into your trading performance, behavioral patterns, and personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {canGenerate 
                  ? "Generate your first AI-powered trading summary to get started"
                  : "You've already generated a summary today. Try again tomorrow."
                }
              </p>
              {nextAvailable && (
                <p className="text-xs text-muted-foreground">
                  Next available: {new Date(nextAvailable).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button 
              onClick={generateSummary} 
              disabled={!canGenerate || isGenerating}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Summary
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Trading Summary</h2>
            <p className="text-sm text-muted-foreground">
              Generated on {metadata?.generatedAt ? new Date(metadata.generatedAt).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSummary} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={generateSummary} 
            disabled={!canGenerate || isGenerating}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Behavioral Patterns</span>
            </CardTitle>
            <CardDescription>AI-detected trading psychology patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.aiInsights.behavioralPatterns.map((pattern, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-sm">{pattern}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <span>Risk Assessment</span>
            </CardTitle>
            <CardDescription>Current risk level and management effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{summary.aiInsights.riskAssessment}</p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Trading Strengths</span>
            </CardTitle>
            <CardDescription>Areas where you excel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.aiInsights.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm">{strength}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Improvement Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span>Improvement Areas</span>
            </CardTitle>
            <CardDescription>Focus areas for better performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.aiInsights.improvementAreas.map((area, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-purple-500" />
                <p className="text-sm">{area}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <span>Key Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPnL)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(summary.winRate)}
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(summary.totalTrades)}
              </div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(summary.maxDrawdownPct)}
              </div>
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>AI Recommendations</span>
          </CardTitle>
          <CardDescription>Personalized suggestions for improvement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.aiInsights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500" />
                <p className="text-sm leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Context & Psychological Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-cyan-500" />
              <span>Market Context</span>
            </CardTitle>
            <CardDescription>How market conditions affect your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{summary.aiInsights.marketContext}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <span>Psychological Factors</span>
            </CardTitle>
            <CardDescription>Mental aspects influencing your decisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.aiInsights.psychologicalFactors.map((factor, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-pink-500" />
                <p className="text-sm">{factor}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              <span>Monthly Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'P&L']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="pnl" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-rose-500" />
              <span>Trade Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Winning Trades', value: summary.winningTrades, color: '#10b981' },
                    { name: 'Losing Trades', value: summary.losingTrades, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {[
                    { name: 'Winning Trades', value: summary.winningTrades, color: '#10b981' },
                    { name: 'Losing Trades', value: summary.losingTrades, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Trades']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Winning: {summary.winningTrades}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Losing: {summary.losingTrades}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Status */}
      {!canGenerate && nextAvailable && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                Daily limit reached. You can generate a new AI summary on{' '}
                {new Date(nextAvailable).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
