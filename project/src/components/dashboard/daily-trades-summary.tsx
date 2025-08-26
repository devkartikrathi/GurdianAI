"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react'

interface DailyTradesSummary {
  id: string
  tradeDate: string
  totalTrades: number
  totalBuyTrades: number
  totalSellTrades: number
  totalBuyQuantity: number
  totalSellQuantity: number
  totalBuyValue: number
  totalSellValue: number
  netQuantity: number
  netValue: number
  lastSyncAt: string
}

interface DailyTradesSummaryProps {
  brokerConnectionId: string
  userId: string
}

export default function DailyTradesSummary({ brokerConnectionId, userId }: DailyTradesSummaryProps) {
  const [dailyTrades, setDailyTrades] = useState<DailyTradesSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const { toast } = useToast()

  const loadDailyTrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/daily-trades?brokerConnectionId=${brokerConnectionId}`)
      if (response.ok) {
        const data = await response.json()
        setDailyTrades(data.data || [])
        
        // Set today as default selected date
        const today = new Date().toISOString().split('T')[0]
        setSelectedDate(today)
      }
    } catch (error) {
      console.error('Error loading daily trades:', error)
      toast({
        title: "Error",
        description: "Failed to load daily trades summary",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [brokerConnectionId, toast])

  // Add useEffect after function definition to avoid circular dependency
  useEffect(() => {
    if (brokerConnectionId && userId) {
      loadDailyTrades()
    }
  }, [brokerConnectionId, userId, loadDailyTrades])

  const getSelectedDayTrades = () => {
    return dailyTrades.find(trade => trade.tradeDate === selectedDate)
  }

  const selectedDayTrades = getSelectedDayTrades()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading daily trades summary...</p>
        </CardContent>
      </Card>
    )
  }

  if (dailyTrades.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Daily Trades Summary
          </CardTitle>
          <CardDescription className="text-xs">
            No daily trades data available. Sync your trades to see summaries.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Daily Trades Summary
            </CardTitle>
            <CardDescription className="text-xs">
              Trading activity summary for selected date
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDailyTrades}
            disabled={isLoading}
            className="h-7"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Date Selector */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            {dailyTrades.map(trade => (
              <option key={trade.id} value={trade.tradeDate}>
                {new Date(trade.tradeDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Day Summary */}
        {selectedDayTrades && (
          <div className="space-y-4">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Buy Trades</span>
                </div>
                <div className="text-lg font-bold text-blue-900">
                  {formatNumber(selectedDayTrades.totalBuyTrades)}
                </div>
                <div className="text-xs text-blue-700">
                  Qty: {formatNumber(selectedDayTrades.totalBuyQuantity)}
                </div>
                <div className="text-xs text-blue-700">
                  Value: {formatCurrency(selectedDayTrades.totalBuyValue)}
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-900">Sell Trades</span>
                </div>
                <div className="text-lg font-bold text-red-900">
                  {formatNumber(selectedDayTrades.totalSellTrades)}
                </div>
                <div className="text-xs text-red-700">
                  Qty: {formatNumber(selectedDayTrades.totalSellQuantity)}
                </div>
                <div className="text-xs text-red-700">
                  Value: {formatCurrency(selectedDayTrades.totalSellValue)}
                </div>
              </div>
            </div>

            {/* Net Position */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Net Position</span>
                <Badge variant={selectedDayTrades.netQuantity >= 0 ? "default" : "destructive"}>
                  {selectedDayTrades.netQuantity >= 0 ? 'Long' : 'Short'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600">Net Quantity</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatNumber(Math.abs(selectedDayTrades.netQuantity))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Net Value</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(Math.abs(selectedDayTrades.netValue))}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Total Trades:</span>
                  <span className="ml-2 font-medium text-green-900">
                    {formatNumber(selectedDayTrades.totalTrades)}
                  </span>
                </div>
                <div>
                  <span className="text-green-700">Last Sync:</span>
                  <span className="ml-2 font-medium text-green-900">
                    {new Date(selectedDayTrades.lastSyncAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
