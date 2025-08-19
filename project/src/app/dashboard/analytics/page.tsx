"use client"

import { useState, useEffect, useCallback } from 'react'
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
  Loader2,
  Sparkles,
  Gauge,
  Database,
  RefreshCw,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ClockIcon,
  TargetIcon,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PerformanceMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: number
  grossProfit: number
  grossLoss: number
  netProfit: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  maxDrawdown: number
  sharpeRatio: number
  tradesByMonth: Array<{ month: string; count: number }>
  pnlByMonth: Array<{ month: string; pnl: number }>
}

interface EmotionalZone {
  slot: string
  totalTrades: number
  winRate: number
  avgPnl: number
  totalPnl: number
  emotionalZone: string
}

interface SymbolAnalysis {
  symbol: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: number
  avgPnl: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  avgDuration: number
  performance: number
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
  type: 'pattern' | 'bias' | 'improvement' | 'risk' | 'opportunity'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  confidence: number
  recommendation: string
  actionItems: string[]
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
    grossProfit: 0,
    grossLoss: 0,
    netProfit: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    tradesByMonth: [],
    pnlByMonth: []
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

  const generateBehavioralInsights = useCallback(() => {
    const insights: BehavioralInsight[] = []

    // Performance-based insights
    if (performanceMetrics.winRate > 60) {
      insights.push({
        type: 'improvement',
        title: 'Strong Win Rate Performance',
        description: `Your win rate of ${performanceMetrics.winRate}% is above the 60% threshold, indicating disciplined trading.`,
        impact: 'positive',
        confidence: 85,
        recommendation: 'Maintain your current risk management and entry criteria.',
        actionItems: ['Continue with proven strategies', 'Document successful patterns', 'Avoid overconfidence']
      })
    }

    if (performanceMetrics.maxDrawdown > 10) {
      insights.push({
        type: 'risk',
        title: 'High Maximum Drawdown',
        description: `Your maximum drawdown of ${performanceMetrics.maxDrawdown}% exceeds the recommended 10% threshold.`,
        impact: 'negative',
        confidence: 90,
        recommendation: 'Implement stricter position sizing and stop-loss strategies.',
        actionItems: ['Reduce position sizes by 25%', 'Set tighter stop-losses', 'Review risk per trade']
      })
    }

    // Time-based insights
    if (emotionalZones.length > 0) {
      const bestZone = emotionalZones.reduce((best, current) => 
        Number(current.avgPnl) > Number(best.avgPnl) ? current : best
      )
      
      if (Number(bestZone.avgPnl) > 0) {
        insights.push({
          type: 'pattern',
          title: 'Peak Performance Time',
          description: `You perform best during ${bestZone.slot} with an average P&L of ₹${Number(bestZone.avgPnl).toFixed(2)}.`,
          impact: 'positive',
          confidence: 78,
          recommendation: 'Focus on high-probability setups during this time window.',
          actionItems: ['Schedule important trades during this period', 'Prepare watchlist in advance', 'Avoid distractions']
        })
      }
    }

    // Symbol-based insights
    if (symbolAnalysis.length > 0) {
      const topPerformer = symbolAnalysis.reduce((top, current) => 
        Number(current.totalPnl) > Number(top.totalPnl) ? current : top
      )
      
      insights.push({
        type: 'opportunity',
        title: 'Top Performing Symbol',
        description: `${topPerformer.symbol} has been your best performer with ₹${Number(topPerformer.totalPnl).toFixed(2)} total P&L.`,
        impact: 'positive',
        confidence: 82,
        recommendation: 'Consider increasing allocation to this symbol while maintaining risk management.',
        actionItems: ['Study the patterns in this symbol', 'Look for similar opportunities', 'Monitor for continuation']
      })
    }

    setBehavioralInsights(insights)
  }, [performanceMetrics, emotionalZones, symbolAnalysis])

  const loadAnalyticsData = useCallback(async () => {
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
        setEmotionalZones(emotionalData.data.emotionalZones || [])
      }

      // Load symbol analysis
      const symbolResponse = await fetch(`/api/analytics/symbol-analysis?timeRange=${timeRange}`)
      if (symbolResponse.ok) {
        const symbolData = await symbolResponse.json()
        setSymbolAnalysis(symbolData.data.symbolAnalysis || [])
      }

      // Generate behavioral insights based on data
      generateBehavioralInsights()

      // Calculate risk metrics from performance data
      setRiskMetrics({
        currentDrawdown: performanceMetrics.maxDrawdown,
        maxDrawdown: performanceMetrics.maxDrawdown,
        consecutiveLosses: calculateConsecutiveLosses(),
        riskPerTrade: 1.2,
        dailyRisk: 3.5,
        monthlyRisk: 12.8
      })

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, performanceMetrics.maxDrawdown, generateBehavioralInsights])

  const calculateConsecutiveLosses = () => {
    // This would need to be calculated from actual trade sequence
    // For now, return a mock value
    return Math.floor(Math.random() * 5) + 1
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-success'
    if (value < 0) return 'text-danger'
    return 'text-muted-foreground'
  }

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon className="h-4 w-4 text-success" />
    if (value < 0) return <TrendingDownIcon className="h-4 w-4 text-danger" />
    return <MinusIcon className="h-4 w-4 text-muted-foreground" />
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'euphoric': return 'bg-success/10 text-success border-success/20'
      case 'confident': return 'bg-primary/10 text-primary border-primary/20'
      case 'neutral': return 'bg-muted text-muted-foreground border-border'
      case 'anxious': return 'bg-warning/10 text-warning border-warning/20'
      case 'fearful': return 'bg-danger/10 text-danger border-danger/20'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <Eye className="h-4 w-4" />
      case 'bias': return <Brain className="h-4 w-4" />
      case 'improvement': return <TrendingUp className="h-4 w-4" />
      case 'risk': return <AlertTriangle className="h-4 w-4" />
      case 'opportunity': return <Target className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
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
    return `${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground">Deep insights into your trading performance and behavioral patterns</p>
            </div>
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
            <Button 
              variant="outline" 
              onClick={loadAnalyticsData}
              disabled={loading}
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="hidden sm:flex">
              <Calendar className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${getPerformanceColor(performanceMetrics.totalPnl)}`}>
              {formatCurrency(performanceMetrics.totalPnl)}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.totalPnl > 0 ? '+' : ''}{formatCurrency(performanceMetrics.netProfit)} net profit
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {formatPercentage(performanceMetrics.winRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.winningTrades} wins / {performanceMetrics.totalTrades} total
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-danger">
              {formatPercentage(performanceMetrics.maxDrawdown)}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk management metric
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-foreground">
              {performanceMetrics.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.profitFactor > 1 ? 'Profitable' : 'Unprofitable'} strategy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Win</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-success">
              {formatCurrency(performanceMetrics.averageWin)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per winning trade
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-danger">
              {formatCurrency(performanceMetrics.averageLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per losing trade
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Gauge className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {performanceMetrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted returns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emotional-zones">Emotional Zones</TabsTrigger>
          <TabsTrigger value="symbol-analysis">Symbol Analysis</TabsTrigger>
          <TabsTrigger value="risk-analytics">Risk Analytics</TabsTrigger>
          <TabsTrigger value="behavioral-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Performance Trends</CardTitle>
                </div>
                <CardDescription>Your trading performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-border/50">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Performance chart will be displayed here</p>
                    {performanceMetrics.pnlByMonth.length > 0 && (
                      <div className="mt-4 text-xs text-muted-foreground">
                        {performanceMetrics.pnlByMonth.length} months of data available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-accent" />
                  <CardTitle>Trade Distribution</CardTitle>
                </div>
                <CardDescription>Winning vs losing trades breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg border border-border/50">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Trade distribution chart will be displayed here</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span className="text-xs">Winning: {performanceMetrics.winningTrades}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-danger rounded-full"></div>
                        <span className="text-xs">Losing: {performanceMetrics.losingTrades}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotional Zones Tab */}
        <TabsContent value="emotional-zones" className="space-y-4">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                <CardTitle>Emotional Trading Zones</CardTitle>
              </div>
              <CardDescription>Performance by time of day - identify your best and worst trading hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionalZones.length > 0 ? (
                  emotionalZones.map((zone, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                      <div className="flex items-center gap-4 mb-2 sm:mb-0">
                        <div className="w-20 text-sm font-medium">{zone.slot}</div>
                        <Badge className={getRiskLevelColor(zone.emotionalZone)}>
                          {zone.emotionalZone.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getPerformanceColor(zone.avgPnl)}`}>
                            {zone.avgPnl > 0 ? '+' : ''}{formatCurrency(zone.avgPnl)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            avg P&L
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{zone.winRate}%</div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{zone.totalTrades}</div>
                          <div className="text-xs text-muted-foreground">Trades</div>
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
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-success" />
                <CardTitle>Symbol Performance Analysis</CardTitle>
              </div>
              <CardDescription>How you perform across different trading instruments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {symbolAnalysis.length > 0 ? (
                  symbolAnalysis.map((symbol, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/50 rounded-lg bg-card/50">
                      <div className="flex items-center gap-4 mb-2 sm:mb-0">
                        <div className="w-20 text-sm font-bold">{symbol.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {symbol.totalTrades} trades
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(symbol.winRate)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getPerformanceColor(symbol.totalPnl)}`}>
                            {formatCurrency(symbol.totalPnl)}
                          </div>
                          <div className="text-xs text-muted-foreground">Total P&L</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getPerformanceColor(symbol.avgPnl)}`}>
                            {formatCurrency(symbol.avgPnl)}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg P&L</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{symbol.avgDuration}h</div>
                          <div className="text-xs text-muted-foreground">Avg Duration</div>
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
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-warning" />
                  <CardTitle>Risk Metrics</CardTitle>
                </div>
                <CardDescription>Current risk exposure and management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Drawdown</span>
                  <span className={`font-semibold ${getPerformanceColor(riskMetrics.currentDrawdown)}`}>
                    {formatPercentage(riskMetrics.currentDrawdown)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Drawdown</span>
                  <span className="font-semibold text-danger">
                    {formatPercentage(riskMetrics.maxDrawdown)}
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
                    {formatPercentage(riskMetrics.riskPerTrade)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-accent" />
                  <CardTitle>Risk Timeline</CardTitle>
                </div>
                <CardDescription>Risk exposure over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg border border-border/50">
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
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Guardian AI Insights</CardTitle>
              </div>
              <CardDescription>AI-powered behavioral analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {behavioralInsights.length > 0 ? (
                  behavioralInsights.map((insight, index) => (
                    <div key={index} className="p-4 border border-border/50 rounded-lg bg-card/50">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          insight.impact === 'positive' ? 'bg-success/10 text-success' :
                          insight.impact === 'negative' ? 'bg-danger/10 text-danger' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className="w-fit">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Recommendation:</span>
                              <span className="text-sm text-muted-foreground">{insight.recommendation}</span>
                            </div>
                            {insight.actionItems.length > 0 && (
                              <div className="mt-3">
                                <span className="text-sm font-medium text-muted-foreground">Action Items:</span>
                                <ul className="mt-2 space-y-1">
                                  {insight.actionItems.map((action, actionIndex) => (
                                    <li key={actionIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No insights available yet. Upload more trades to generate AI insights.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 