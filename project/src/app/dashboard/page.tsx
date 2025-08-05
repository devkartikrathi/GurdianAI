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
  Activity
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
      case 'green': return 'text-green-600 dark:text-green-400'
      case 'amber': return 'text-yellow-600 dark:text-yellow-400'
      case 'red': return 'text-red-600 dark:text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const getRiskStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
      case 'amber': return <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
      case 'red': return <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      default: return <Activity className="h-6 w-6 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Your trading overview and risk status</p>
      </div>

      {/* Risk Status Card */}
      <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {getRiskStatusIcon(riskStatus)}
                <span className="ml-2">Risk Status</span>
              </CardTitle>
              <CardDescription>
                Current session risk level and recommendations
              </CardDescription>
            </div>
            <div className={`text-2xl font-bold ${getRiskStatusColor(riskStatus)}`}>
              {riskStatus.toUpperCase()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session Duration</span>
              <span className="font-medium text-foreground">{sessionDuration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-foreground">{maxDrawdown}%</span>
            </div>
            <Progress value={maxDrawdown * 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₹{todayPnL.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              This session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{sessionDuration}</div>
            <p className="text-xs text-muted-foreground">
              Active trading session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest trades and Guardian AI insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Position size recommendation applied
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Guardian AI suggested 50% position size for RELIANCE trade
                </p>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">2 min ago</span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Trade uploaded successfully
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  15 trades processed from CSV file
                </p>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">15 min ago</span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Risk warning triggered
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Approaching daily loss limit - consider taking a break
                </p>
              </div>
              <span className="text-xs text-yellow-600 dark:text-yellow-400">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}