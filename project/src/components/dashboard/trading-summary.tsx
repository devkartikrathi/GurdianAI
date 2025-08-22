"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  Clock, 
  Target, 
  AlertTriangle,
  RefreshCw,
  Download,
  Activity,
  PieChart,
  LineChart
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

interface TradingSummaryData {
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
}

interface TradingSummaryProps {
  userId: string
  className?: string
}

export default function TradingSummary({ userId, className }: TradingSummaryProps) {
  const [summary, setSummary] = useState<TradingSummaryData | null>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSummary()
  }, [userId])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/trading-summary?action=get')
      
      if (response.ok) {
        const result = await response.json()
        setSummary(result.data.summary)
        setMetadata(result.data.metadata)
      } else {
        console.log('No existing summary found')
      }
    } catch (error) {
      console.error('Error loading trading summary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/trading-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', forceRegenerate: true })
      })
      
      if (response.ok) {
        const result = await response.json()
        setSummary(result.data.summary)
        setMetadata(result.data.metadata)
        toast({
          title: "Success",
          description: "Trading summary generated successfully!",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating trading summary:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate trading summary',
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Summary
          </CardTitle>
          <CardDescription>Loading comprehensive trading analysis...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Summary
          </CardTitle>
          <CardDescription>Generate your first comprehensive trading analysis</CardDescription>
        </CardHeader>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-4">
            No trading summary found. Generate one to see detailed analysis of your trading performance.
          </p>
          <Button onClick={generateSummary} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Generate Summary
          </Button>
        </CardContent>
      </Card>
    )
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
    return `${value.toFixed(2)}%`
  }

  const getPnLColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getPnLIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comprehensive Trading Summary
            </CardTitle>
            <CardDescription>
              {metadata && (
                <span>
                  Generated on {new Date(metadata.generatedAt).toLocaleDateString()} • 
                  Data from {new Date(metadata.dataRangeStart).toLocaleDateString()} to {new Date(metadata.dataRangeEnd).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={generateSummary} disabled={isGenerating}>
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {getPnLIcon(summary.totalPnL)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPnLColor(summary.totalPnL)}`}>
              {formatCurrency(summary.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(summary.totalPnLPct)} return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(summary.winRate)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.winningTrades} wins / {summary.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.maxDrawdown)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(summary.maxDrawdownPct)} of peak
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Performance</CardTitle>
            <CardDescription>P&L trends over months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar 
                  dataKey="pnl" 
                  fill="#3b82f6" 
                  name="P&L"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade Distribution</CardTitle>
            <CardDescription>Winning vs losing trades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Wins', value: summary.winningTrades, color: '#10b981' },
                    { name: 'Losses', value: summary.losingTrades, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {[
                    { name: 'Wins', value: summary.winningTrades, color: '#10b981' },
                    { name: 'Losses', value: summary.losingTrades, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trading Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trading Statistics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-lg font-semibold">{summary.totalTrades}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trading Days</p>
                <p className="text-lg font-semibold">{summary.tradingDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Trades/Day</p>
                <p className="text-lg font-semibold">{summary.averageTradesPerDay.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-lg font-semibold">{summary.totalVolume.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Average Win:</span>
                <span className="font-medium text-green-600">{formatCurrency(summary.averageWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Loss:</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.averageLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Largest Win:</span>
                <span className="font-medium text-green-600">{formatCurrency(summary.largestWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Largest Loss:</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.largestLoss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Behavioral Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Behavioral Analysis</CardTitle>
            <CardDescription>Trading patterns and habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Holding Period</p>
                <p className="text-lg font-semibold">{summary.averageHoldingPeriod.toFixed(1)} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Active Hour</p>
                <p className="text-lg font-semibold">{summary.mostActiveHour}:00</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Active Day</p>
                <p className="text-lg font-semibold">{summary.mostActiveDay}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volatility</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.volatility)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Consecutive Wins:</span>
                <Badge variant="secondary">{summary.consecutiveWins}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Consecutive Losses:</span>
                <Badge variant="secondary">{summary.consecutiveLosses}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Symbols */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Symbols</CardTitle>
          <CardDescription>Best and worst performing stocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.topSymbols.slice(0, 5).map((symbol, index) => (
              <div key={symbol.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{symbol.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {symbol.trades} trades • {symbol.volume.toLocaleString()} volume
                    </p>
                  </div>
                </div>
                <div className={`text-right ${getPnLColor(symbol.pnl)}`}>
                  <p className="font-semibold">{formatCurrency(symbol.pnl)}</p>
                  <p className="text-sm">
                    {symbol.trades > 0 ? formatCurrency(symbol.pnl / symbol.trades) : 'N/A'} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best/Worst Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-600">Best Trading Day</CardTitle>
            <CardDescription>Highest P&L in a single day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.bestDay.pnl)}
              </div>
              <p className="text-muted-foreground">{summary.bestDay.date}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Worst Trading Day</CardTitle>
            <CardDescription>Lowest P&L in a single day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.worstDay.pnl)}
              </div>
              <p className="text-muted-foreground">{summary.worstDay.date}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
