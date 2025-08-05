"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Shield,
  Brain,
  Eye,
  Timer,
  Loader2
} from 'lucide-react'

interface PerformanceMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: number
  avgPnl: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
  avgTradeDuration: number
}

interface EmotionalZone {
  timeSlot: string
  performance: number
  tradeCount: number
  avgPnl: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface SymbolAnalysis {
  symbol: string
  totalTrades: number
  winRate: number
  totalPnl: number
  avgPnl: number
  bestTrade: number
  worstTrade: number
}

interface RiskMetrics {
  currentDrawdown: number
  maxDrawdown: number
  consecutiveLosses: number
  riskPerTrade: number
  dailyRisk: number
  monthlyRisk: number
}

interface BehavioralInsight {
  type: 'pattern' | 'bias' | 'improvement'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  confidence: number
  recommendation: string
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnl: 0,
    avgPnl: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    profitFactor: 0,
    avgTradeDuration: 0
  })

  const [emotionalZones, setEmotionalZones] = useState<EmotionalZone[]>([])
  const [symbolAnalysis, setSymbolAnalysis] = useState<SymbolAnalysis[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    currentDrawdown: 0,
    maxDrawdown: 0,
    consecutiveLosses: 0,
    riskPerTrade: 0,
    dailyRisk: 0,
    monthlyRisk: 0
  })

  const [behavioralInsights, setBehavioralInsights] = useState<BehavioralInsight[]>([])

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Load performance metrics
      const performanceResponse = await fetch(`/api/analytics/performance?timeRange=${timeRange}`)
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json()
        setPerformanceMetrics(performanceData.data)
      }

      // Load emotional zones
      const emotionalResponse = await fetch(`/api/analytics/emotional-zones?timeRange=${timeRange}`)
      if (emotionalResponse.ok) {
        const emotionalData = await emotionalResponse.json()
        setEmotionalZones(emotionalData.data)
      }

      // Load symbol analysis
      const symbolResponse = await fetch(`/api/analytics/symbol-analysis?timeRange=${timeRange}`)
      if (symbolResponse.ok) {
        const symbolData = await symbolResponse.json()
        setSymbolAnalysis(symbolData.data)
      }

      // Mock behavioral insights for now (will be replaced with AI insights later)
      setBehavioralInsights([
        {
          type: 'pattern',
          title: 'Morning Momentum Trader',
          description: 'You perform best in the first hour of trading (9-10 AM) with 12.5% average returns',
          impact: 'positive',
          confidence: 85,
          recommendation: 'Focus on high-probability setups during market open'
        },
        {
          type: 'bias',
          title: 'Overtrading During Lunch',
          description: 'Performance drops significantly during 11-12 PM and 2-3 PM periods',
          impact: 'negative',
          confidence: 78,
          recommendation: 'Reduce trading frequency during these hours'
        },
        {
          type: 'improvement',
          title: 'Risk Management Improving',
          description: 'Your average loss size has decreased by 15% over the last 30 days',
          impact: 'positive',
          confidence: 92,
          recommendation: 'Continue with current position sizing discipline'
        }
      ])

      // Calculate risk metrics from performance data
      setRiskMetrics({
        currentDrawdown: performanceMetrics.maxDrawdown,
        maxDrawdown: performanceMetrics.maxDrawdown,
        consecutiveLosses: 2, // This would need to be calculated from trade sequence
        riskPerTrade: 1.2,
        dailyRisk: 3.5,
        monthlyRisk: 12.8
      })

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <Eye className="h-4 w-4" />
      case 'bias': return <Brain className="h-4 w-4" />
      case 'improvement': return <TrendingUp className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your trading performance and behavioral patterns</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(performanceMetrics.totalPnl)}`}>
              ₹{performanceMetrics.totalPnl.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.totalPnl > 0 ? '+' : ''}{performanceMetrics.avgPnl.toFixed(2)} avg per trade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {performanceMetrics.winRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.winningTrades} wins / {performanceMetrics.totalTrades} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {performanceMetrics.maxDrawdown}%
            </div>
            <p className="text-xs text-muted-foreground">
              Risk management metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {performanceMetrics.sharpeRatio}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted returns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emotional-zones">Emotional Zones</TabsTrigger>
          <TabsTrigger value="symbol-analysis">Symbol Analysis</TabsTrigger>
          <TabsTrigger value="risk-analytics">Risk Analytics</TabsTrigger>
          <TabsTrigger value="behavioral-insights">Behavioral Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Your trading performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Performance chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
                <CardDescription>Winning vs losing trades breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Trade distribution chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotional Zones Tab */}
        <TabsContent value="emotional-zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Trading Zones</CardTitle>
              <CardDescription>Performance by time of day - identify your best and worst trading hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionalZones.length > 0 ? (
                  emotionalZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 text-sm font-medium">{zone.timeSlot}</div>
                        <Badge className={getRiskLevelColor(zone.riskLevel)}>
                          {zone.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getPerformanceColor(zone.performance)}`}>
                            {zone.performance > 0 ? '+' : ''}{zone.performance}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {zone.tradeCount} trades
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getPerformanceColor(zone.avgPnl)}`}>
                            ₹{zone.avgPnl}
                          </div>
                          <div className="text-xs text-muted-foreground">avg P&L</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No trading data available for this period</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symbol Analysis Tab */}
        <TabsContent value="symbol-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symbol Performance Analysis</CardTitle>
              <CardDescription>How you perform across different trading instruments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {symbolAnalysis.length > 0 ? (
                  symbolAnalysis.map((symbol, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 text-sm font-bold">{symbol.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {symbol.totalTrades} trades
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{symbol.winRate}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getPerformanceColor(symbol.totalPnl)}`}>
                            ₹{symbol.totalPnl.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Total P&L</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getPerformanceColor(symbol.avgPnl)}`}>
                            ₹{symbol.avgPnl}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg P&L</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No symbol data available for this period</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analytics Tab */}
        <TabsContent value="risk-analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Current risk exposure and management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Drawdown</span>
                  <span className={`font-semibold ${getPerformanceColor(riskMetrics.currentDrawdown)}`}>
                    {riskMetrics.currentDrawdown}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Drawdown</span>
                  <span className="font-semibold text-red-600">
                    {riskMetrics.maxDrawdown}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Consecutive Losses</span>
                  <span className="font-semibold text-foreground">
                    {riskMetrics.consecutiveLosses}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Risk Per Trade</span>
                  <span className="font-semibold text-foreground">
                    {riskMetrics.riskPerTrade}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Timeline</CardTitle>
                <CardDescription>Risk exposure over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Risk timeline chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavioral Insights Tab */}
        <TabsContent value="behavioral-insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardian AI Insights</CardTitle>
              <CardDescription>AI-powered behavioral analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {behavioralInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                        insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Recommendation:</span>
                          <span className="text-sm text-muted-foreground">{insight.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 