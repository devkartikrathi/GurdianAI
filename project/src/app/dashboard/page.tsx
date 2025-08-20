"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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
  Minus
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  today: {
    pnl: number
    totalTrades: number
    winRate: number
    sessionDuration: string
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

  const getRiskBorderColor = (status: string) => {
    switch (status) {
      case 'green': return 'border-l-success'
      case 'amber': return 'border-l-warning'
      case 'red': return 'border-l-danger'
      default: return 'border-l-muted'
    }
  }

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle': return <CheckCircle className="h-5 w-5 text-success" />
      case 'AlertTriangle': return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'Database': return <Database className="h-5 w-5 text-primary" />
      default: return <Activity className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/10 border-success/20'
      case 'warning': return 'bg-warning/10 border-warning/20'
      case 'primary': return 'bg-primary/10 border-primary/20'
      default: return 'bg-muted/10 border-muted/20'
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-success" />
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-danger" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Failed to load dashboard</h3>
          <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
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
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your real-time trading overview and risk status</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
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

      {/* Risk Status Card */}
      <Card className={`glass-card border-l-4 ${getRiskBorderColor(dashboardData.risk.status)} hover-lift`}>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {getRiskStatusIcon(dashboardData.risk.status)}
                <span>Risk Status</span>
              </CardTitle>
              <CardDescription className="text-sm">
                {dashboardData.risk.message}
              </CardDescription>
            </div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${getRiskStatusColor(dashboardData.risk.status)}`}>
              {dashboardData.risk.status.toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session Duration</span>
                <span className="font-medium text-foreground">{dashboardData.today.sessionDuration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-medium text-foreground">{dashboardData.risk.maxDrawdown.toFixed(2)}%</span>
              </div>
            </div>
            <Progress value={Math.min(dashboardData.risk.maxDrawdown * 10, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${dashboardData.today.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(dashboardData.today.pnl)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {getPerformanceIcon(dashboardData.today.pnl)}
              <span className="hidden sm:inline">
                {dashboardData.today.pnl >= 0 ? 'Profitable' : 'Loss'} today
              </span>
              <span className="sm:hidden">
                {dashboardData.today.pnl >= 0 ? '+' : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {dashboardData.today.totalTrades}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.today.winRate.toFixed(1)}% win rate
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {dashboardData.today.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.today.totalTrades > 0 ? `${dashboardData.today.totalTrades} trades` : 'No trades yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {dashboardData.today.sessionDuration}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active trading session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card className="glass-card hover-lift lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Your latest trades and Guardian AI insights
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.activity.length > 0 ? (
                dashboardData.activity.map((activity, index) => (
                  <div key={index} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${getActivityStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.icon)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground">Upload trades to see activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Status */}
        <Card className="glass-card hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-accent" />
              <CardTitle className="text-base sm:text-lg">AI Status</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Guardian AI monitoring status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Behavioral Analysis</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Monitoring</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pattern Recognition</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emotional Detection</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/dashboard/upload">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-200 hover:scale-105">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">Upload Trades</p>
                  <p className="text-xs text-muted-foreground">Import CSV data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-200 hover:scale-105">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Brain className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">AI Insights</p>
                  <p className="text-xs text-muted-foreground">View analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-200 hover:scale-105">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Gauge className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">Risk Settings</p>
                  <p className="text-xs text-muted-foreground">Configure alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="glass-card hover-lift cursor-pointer transition-all duration-200 hover:scale-105">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm sm:text-base">Performance</p>
                  <p className="text-xs text-muted-foreground">View analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}