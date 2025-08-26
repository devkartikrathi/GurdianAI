"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Target,
  Clock,
  Activity,
  Shield,
  Brain,
  Gauge,
  Database,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Upload,
  MessageSquare,
  Settings
} from 'lucide-react'
import { 
  LineChart, 
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
  PieChart,
  Pie,
  Cell
} from 'recharts'
import Link from 'next/link'

interface DashboardData {
  today: {
    pnl: number
    totalTrades: number
    winRate: number
    portfolioValue: number
  }
  risk: {
    status: string
    message: string
    maxDrawdown: number
  }
  activity: Array<{
    type: string
    title: string
    description: string
    status: string
    timestamp: string
    icon: string
  }>
  summary: {
    totalTrades: number
    totalPnL: number
  }
  charts: {
    pnlData: Array<{ time: string; pnl: number }>
    tradeDistribution: Array<{ name: string; value: number; color: string }>
    weeklyPerformance: Array<{ day: string; trades: number; pnl: number }>
  }
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard/overview')
      if (response.ok) {
        const result = await response.json()
        setDashboardData(result.data)
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const getRiskStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'text-success'
      case 'amber': return 'text-warning'
      case 'red': return 'text-danger'
      default: return 'text-muted-foreground'
    }
  }

  const getRiskStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircle className="h-6 w-6 text-success" />
      case 'amber': return <AlertTriangle className="h-6 w-6 text-warning" />
      case 'red': return <AlertTriangle className="h-6 w-6 text-danger" />
      default: return <Activity className="h-6 w-6 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Error loading dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your trading overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = '/dashboard/ai-summary'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Summary
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 dark:bg-blue-400/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Today's P&L</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {dashboardData?.today.pnl ? `$${dashboardData.today.pnl.toFixed(2)}` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200/30 dark:border-green-700/30 hover:border-green-300/50 dark:hover:border-green-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 dark:bg-green-400/20 rounded-lg">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Win Rate</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {dashboardData?.today.winRate ? `${dashboardData.today.winRate}%` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50 border-2 border-purple-200/30 dark:border-purple-700/30 hover:border-purple-300/50 dark:hover:border-purple-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Total Trades</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {dashboardData?.today.totalTrades || '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/50 dark:to-amber-950/50 border-2 border-orange-200/30 dark:border-orange-700/30 hover:border-orange-300/50 dark:hover:border-orange-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 dark:bg-orange-400/20 rounded-lg">
                    <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Portfolio Value</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {dashboardData?.today.portfolioValue ? `$${dashboardData.today.portfolioValue.toFixed(2)}` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Chart */}
            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50 border-2 border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-800/30 dark:to-indigo-800/30 border-b border-blue-200/40 dark:border-blue-600/40">
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Today's P&L</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">Real-time profit and loss tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData?.charts?.pnlData || []}>
                      <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#pnlGradient)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win/Loss Distribution */}
            <Card className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200/30 dark:border-green-700/30 hover:border-green-300/50 dark:hover:border-green-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-100/30 to-emerald-100/30 dark:from-green-800/30 dark:to-emerald-800/30 border-b border-green-200/40 dark:border-green-600/40">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">Trade Distribution</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">Win vs Loss ratio (30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.charts?.tradeDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(dashboardData?.charts?.tradeDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {(dashboardData?.charts?.tradeDistribution || []).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Performance */}
            <Card className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50 border-2 border-purple-200/30 dark:border-purple-700/30 hover:border-purple-300/50 dark:hover:border-purple-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-100/30 to-pink-100/30 dark:from-purple-800/30 dark:to-pink-800/30 border-b border-purple-200/40 dark:border-purple-600/40">
                <CardTitle className="text-lg text-purple-900 dark:text-purple-100">Weekly Performance</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">Trades and P&L by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.charts?.weeklyPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Bar 
                        dataKey="trades" 
                        fill="#8b5cf6" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/50 dark:to-amber-950/50 border-2 border-orange-200/30 dark:border-orange-700/30 hover:border-orange-300/50 dark:hover:border-orange-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-orange-100/30 to-amber-100/30 dark:from-orange-800/30 dark:to-amber-800/30 border-b border-orange-200/40 dark:border-orange-600/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 dark:bg-orange-400/20 rounded-lg">
                    <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900 dark:text-orange-100">Risk Assessment</CardTitle>
                    <CardDescription className="text-orange-700 dark:text-orange-300">Current trading risk status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.risk ? (
                    <>
                      <div className="flex items-center gap-4">
                        {getRiskStatusIcon(dashboardData.risk.status)}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{dashboardData.risk.message}</p>
                          <p className="text-sm text-muted-foreground">
                            Max Drawdown: {dashboardData.risk.maxDrawdown}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Risk Level</span>
                          <span className="font-medium">Medium</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Activity className="h-5 w-5" />
                      <span>No risk data available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/50 dark:to-blue-950/50 border-2 border-indigo-200/30 dark:border-indigo-700/30 hover:border-indigo-300/50 dark:hover:border-indigo-600/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-100/30 to-blue-100/30 dark:from-indigo-800/30 dark:to-blue-800/30 border-b border-indigo-200/40 dark:border-indigo-600/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-indigo-900 dark:text-indigo-100">Recent Activity</CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300">Latest trading activities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.activity && dashboardData.activity.length > 0 ? (
                  dashboardData.activity.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="p-2 bg-background rounded-lg">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}