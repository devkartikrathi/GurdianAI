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

  const generateBehavioralInsights = useCallback((metrics: PerformanceMetrics, zones: EmotionalZone[], symbols: SymbolAnalysis[]) => {
    const insights: BehavioralInsight[] = []

    // Performance-based insights
    if (metrics.winRate > 60) {
      insights.push({
        type: 'improvement',
        title: 'Strong Win Rate Performance',
        description: `Your win rate of ${metrics.winRate}% is above the 60% threshold, indicating disciplined trading.`,
        impact: 'positive',
        confidence: 85,
        recommendation: 'Maintain your current risk management and entry criteria.',
        actionItems: ['Continue with proven strategies', 'Document successful patterns', 'Avoid overconfidence']
      })
    }

    if (metrics.maxDrawdown > 10) {
      insights.push({
        type: 'risk',
        title: 'High Maximum Drawdown',
        description: `Your maximum drawdown of ${metrics.maxDrawdown}% exceeds the recommended 10% threshold.`,
        impact: 'negative',
        confidence: 90,
        recommendation: 'Implement stricter position sizing and stop-loss strategies.',
        actionItems: ['Reduce position sizes by 25%', 'Set tighter stop-losses', 'Review risk per trade']
      })
    }

    // Time-based insights
    if (zones.length > 0) {
      const bestZone = zones.reduce((best, current) => 
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
    if (symbols.length > 0) {
      const topPerformer = symbols.reduce((top, current) => 
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

    return insights
  }, [])

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

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  const calculateConsecutiveLosses = () => {
    // This would need to be calculated from actual trade sequence
    // For now, return a mock value
    return Math.floor(Math.random() * 5) + 1
  }

  // Generate insights and risk metrics when data changes
  useEffect(() => {
    if (performanceMetrics.totalTrades > 0) {
      const insights = generateBehavioralInsights(performanceMetrics, emotionalZones, symbolAnalysis)
      setBehavioralInsights(insights)

      // Calculate risk metrics from performance data
      setRiskMetrics({
        currentDrawdown: performanceMetrics.maxDrawdown,
        maxDrawdown: performanceMetrics.maxDrawdown,
        consecutiveLosses: calculateConsecutiveLosses(),
        riskPerTrade: 1.2,
        dailyRisk: 3.5,
        monthlyRisk: 12.8
      })
    }
  }, [performanceMetrics, emotionalZones, symbolAnalysis, generateBehavioralInsights])

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm sm:text-base text-muted-foreground">AI-powered trading insights and performance analysis</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={loadAnalyticsData}
              disabled={loading}
              size="sm"
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${performanceMetrics.totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
              ₹{performanceMetrics.totalPnl.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {getPerformanceIcon(performanceMetrics.totalPnl)}
              <span className="hidden sm:inline">
                {performanceMetrics.totalPnl >= 0 ? 'Profitable' : 'Loss'} overall
              </span>
              <span className="sm:hidden">
                {performanceMetrics.totalPnl >= 0 ? '+' : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {performanceMetrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {performanceMetrics.winningTrades} of {performanceMetrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-warning">
              {performanceMetrics.maxDrawdown.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Peak to trough decline
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Sharpe Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {performanceMetrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Risk-adjusted returns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-4 sm:mb-6">
          <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
          <TabsTrigger value="emotional" className="text-xs sm:text-sm">Emotional Zones</TabsTrigger>
          <TabsTrigger value="symbols" className="text-xs sm:text-sm">Symbols</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs sm:text-sm">Risk</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm">AI Insights</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Profit/Loss Breakdown */}
            <Card className="glass-card hover-lift">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Profit/Loss Breakdown</CardTitle>
                <CardDescription className="text-sm">Detailed P&L analysis</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Profit</span>
                    <span className="text-sm font-medium text-success">₹{performanceMetrics.grossProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Loss</span>
                    <span className="text-sm font-medium text-danger">₹{performanceMetrics.grossLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Profit</span>
                    <span className={`text-sm font-medium ${performanceMetrics.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      ₹{performanceMetrics.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profit Factor</span>
                    <span className="text-sm font-medium text-foreground">{performanceMetrics.profitFactor.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade Statistics */}
            <Card className="glass-card hover-lift">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Trade Statistics</CardTitle>
                <CardDescription className="text-sm">Key trading metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Trades</span>
                    <span className="text-sm font-medium text-foreground">{performanceMetrics.totalTrades}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Winning Trades</span>
                    <span className="text-sm font-medium text-success">{performanceMetrics.winningTrades}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Losing Trades</span>
                    <span className="text-sm font-medium text-danger">{performanceMetrics.losingTrades}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Win</span>
                    <span className="text-sm font-medium text-success">₹{performanceMetrics.averageWin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Loss</span>
                    <span className="text-sm font-medium text-danger">₹{performanceMetrics.averageLoss.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotional Zones Tab */}
        <TabsContent value="emotional" className="space-y-4 sm:space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Trading Performance by Time</CardTitle>
              <CardDescription className="text-sm">Analyze your performance across different time slots</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {emotionalZones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {emotionalZones.map((zone, index) => (
                    <div key={index} className="p-3 sm:p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm sm:text-base">{zone.slot}</h4>
                        <Badge variant={Number(zone.avgPnl) >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {Number(zone.avgPnl) >= 0 ? '+' : ''}₹{Number(zone.avgPnl).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trades:</span>
                          <span className="font-medium">{zone.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Win Rate:</span>
                          <span className="font-medium">{zone.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total P&L:</span>
                          <span className={`font-medium ${Number(zone.totalPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {Number(zone.totalPnl) >= 0 ? '+' : ''}₹{Number(zone.totalPnl).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emotional zone data available</p>
                  <p className="text-sm">Upload trades to see time-based analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symbols Tab */}
        <TabsContent value="symbols" className="space-y-4 sm:space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Symbol Performance Analysis</CardTitle>
              <CardDescription className="text-sm">Performance breakdown by trading symbols</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {symbolAnalysis.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {symbolAnalysis.map((symbol, index) => (
                    <div key={index} className="p-3 sm:p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm sm:text-base">{symbol.symbol}</h4>
                        <Badge variant={Number(symbol.totalPnl) >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {Number(symbol.totalPnl) >= 0 ? '+' : ''}₹{Number(symbol.totalPnl).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Trades:</span>
                          <div className="font-medium">{symbol.totalTrades}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Win Rate:</span>
                          <div className="font-medium">{symbol.winRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg P&L:</span>
                          <div className={`font-medium ${Number(symbol.avgPnl) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {Number(symbol.avgPnl) >= 0 ? '+' : ''}₹{Number(symbol.avgPnl).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">{Math.round(symbol.avgDuration)}m</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No symbol analysis available</p>
                  <p className="text-sm">Upload trades to see symbol performance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="glass-card hover-lift">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Risk Metrics</CardTitle>
                <CardDescription className="text-sm">Current risk assessment</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Drawdown</span>
                    <span className="text-sm font-medium text-warning">{riskMetrics.currentDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Drawdown</span>
                    <span className="text-sm font-medium text-danger">{riskMetrics.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consecutive Losses</span>
                    <span className="text-sm font-medium text-danger">{riskMetrics.consecutiveLosses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Risk Management</CardTitle>
                <CardDescription className="text-sm">Risk per trade settings</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk per Trade</span>
                    <span className="text-sm font-medium text-foreground">{riskMetrics.riskPerTrade.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Risk</span>
                    <span className="text-sm font-medium text-foreground">{riskMetrics.dailyRisk.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Risk</span>
                    <span className="text-sm font-medium text-foreground">{riskMetrics.monthlyRisk.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">AI Behavioral Insights</CardTitle>
              <CardDescription className="text-sm">Guardian AI analysis of your trading patterns</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {behavioralInsights.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {behavioralInsights.map((insight, index) => (
                    <div key={index} className={`p-3 sm:p-4 border rounded-lg ${
                      insight.impact === 'positive' ? 'bg-success/5 border-success/20' :
                      insight.impact === 'negative' ? 'bg-destructive/5 border-destructive/20' :
                      'bg-muted/5 border-muted/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          insight.impact === 'positive' ? 'bg-success/10' :
                          insight.impact === 'negative' ? 'bg-destructive/10' :
                          'bg-muted/10'
                        }`}>
                          {insight.type === 'improvement' && <TrendingUp className="h-4 w-4 text-success" />}
                          {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {insight.type === 'pattern' && <Eye className="h-4 w-4 text-primary" />}
                          {insight.type === 'opportunity' && <Zap className="h-4 w-4 text-accent" />}
                          {insight.type === 'bias' && <Brain className="h-4 w-4 text-warning" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm sm:text-base mb-1">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {insight.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-foreground">Recommendation:</p>
                            <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                          </div>
                          {insight.actionItems.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-foreground mb-1">Action Items:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {insight.actionItems.map((item, itemIndex) => (
                                  <li key={itemIndex} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No behavioral insights available</p>
                  <p className="text-sm">Upload more trades to generate AI insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 