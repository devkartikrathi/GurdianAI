import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  Database
} from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Mock data - in real app this would come from API
  const riskStatus = 'green' // green, amber, red
  const todayPnL = 45230
  const totalTrades = 12
  const winRate = 78
  const maxDrawdown = 1.2
  const sessionDuration = '4h 23m'

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Your trading overview and risk status</p>
          </div>
        </div>
      </div>

      {/* Risk Status Card */}
      <Card className="glass-card border-l-4 border-l-success hover-lift">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getRiskStatusIcon(riskStatus)}
                <span>Risk Status</span>
              </CardTitle>
              <CardDescription>
                Current session risk level and recommendations
              </CardDescription>
            </div>
            <div className={`text-xl md:text-2xl font-bold ${getRiskStatusColor(riskStatus)}`}>
              {riskStatus.toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session Duration</span>
                <span className="font-medium text-foreground">{sessionDuration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown</span>
                <span className="font-medium text-foreground">{maxDrawdown}%</span>
              </div>
            </div>
            <Progress value={maxDrawdown * 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-success">
              ₹{todayPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-foreground">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              This session
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-foreground">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-foreground">{sessionDuration}</div>
            <p className="text-xs text-muted-foreground">
              Active trading session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card hover-lift lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>
              Your latest trades and Guardian AI insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-success mb-1">
                    Position size recommendation applied
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Guardian AI suggested 50% position size for RELIANCE trade
                  </p>
                </div>
                <span className="text-xs text-success whitespace-nowrap">2 min ago</span>
              </div>

              <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <Activity className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary mb-1">
                    Trade uploaded successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    15 trades processed from CSV file
                  </p>
                </div>
                <span className="text-xs text-primary whitespace-nowrap">15 min ago</span>
              </div>

              <div className="flex items-start gap-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warning mb-1">
                    Risk warning triggered
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Approaching daily loss limit - consider taking a break
                  </p>
                </div>
                <span className="text-xs text-warning whitespace-nowrap">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Status */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-accent" />
              <CardTitle>AI Status</CardTitle>
            </div>
            <CardDescription>
              Guardian AI monitoring status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Upload Trades</p>
                <p className="text-xs text-muted-foreground">Import CSV data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Brain className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Insights</p>
                <p className="text-xs text-muted-foreground">View analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Gauge className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Risk Settings</p>
                <p className="text-xs text-muted-foreground">Configure alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Activity className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-foreground">Performance</p>
                <p className="text-xs text-muted-foreground">View analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}