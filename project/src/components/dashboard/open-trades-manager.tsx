"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Eye,
  EyeOff,
  Edit3,
  X,
  Check,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  Info,
  Bookmark,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react'

interface OpenTrade {
  id: string
  symbol: string
  tradeType: string
  date: string
  time?: string
  price: number
  quantity: number
  commission: number
  remainingQuantity: number
  averagePrice: number
  unrealizedPnl: number
  unrealizedPnlPct: number
  lastUpdated: string
  isInvestment: boolean
  isManuallyClosed: boolean
  manualCloseDate?: string
  manualCloseReason?: string
  notes?: string
}

interface OpenTradesData {
  openTrades: OpenTrade[]
  total: number
  active: number
  closed: number
  investments: number
}

interface OpenTradesManagerProps {
  userId: string
  className?: string
}

export default function OpenTradesManager({ userId, className }: OpenTradesManagerProps) {
  const [tradesData, setTradesData] = useState<OpenTradesData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showClosed, setShowClosed] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<OpenTrade | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<string>('')
  const [dialogData, setDialogData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadOpenTrades()
  }, [userId, showClosed])

  const loadOpenTrades = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/open-trades?includeClosed=${showClosed}`)
      
      if (response.ok) {
        const result = await response.json()
        setTradesData(result.data)
      } else {
        throw new Error('Failed to load open trades')
      }
    } catch (error) {
      console.error('Error loading open trades:', error)
      toast({
        title: "Error",
        description: "Failed to load open trades",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (trade: OpenTrade, action: string) => {
    setSelectedTrade(trade)
    setDialogAction(action)
    setDialogData({})
    setIsDialogOpen(true)
  }

  const submitAction = async () => {
    if (!selectedTrade) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/open-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: dialogAction,
          tradeId: selectedTrade.id,
          ...dialogData
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        setIsDialogOpen(false)
        loadOpenTrades() // Refresh the data
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Action failed')
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Action failed',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getPnLColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getPnLIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const renderDialogContent = () => {
    if (!selectedTrade) return null

    switch (dialogAction) {
      case 'markInvestment':
        return (
          <>
            <DialogDescription>
              Mark <strong>{selectedTrade.symbol}</strong> as a long-term investment?
              This will exclude it from active trading calculations.
            </DialogDescription>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isInvestment"
                  checked={dialogData.isInvestment || selectedTrade.isInvestment}
                  onChange={(e) => setDialogData({ ...dialogData, isInvestment: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isInvestment">Mark as investment</label>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes (optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this position..."
                  value={dialogData.notes || selectedTrade.notes || ''}
                  onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </>
        )

      case 'closePosition':
        return (
          <>
            <DialogDescription>
              Close your position in <strong>{selectedTrade.symbol}</strong>?
              This will mark it as manually closed and exclude it from active calculations.
            </DialogDescription>
            <div className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium mb-2">
                  Reason for closing (optional)
                </label>
                <Select
                  value={dialogData.reason || ''}
                  onValueChange={(value) => setDialogData({ ...dialogData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Take Profit">Take Profit</SelectItem>
                    <SelectItem value="Stop Loss">Stop Loss</SelectItem>
                    <SelectItem value="Portfolio Rebalancing">Portfolio Rebalancing</SelectItem>
                    <SelectItem value="Change in Strategy">Change in Strategy</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Additional Notes (optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={dialogData.notes || selectedTrade.notes || ''}
                  onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </>
        )

      case 'updateNotes':
        return (
          <>
            <DialogDescription>
              Update notes for your position in <strong>{selectedTrade.symbol}</strong>
            </DialogDescription>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Add notes about this position..."
                value={dialogData.notes || selectedTrade.notes || ''}
                onChange={(e) => setDialogData({ ...dialogData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </>
        )

      case 'deletePosition':
        return (
          <>
            <DialogDescription>
              Are you sure you want to permanently delete your closed position in{' '}
              <strong>{selectedTrade.symbol}</strong>? This action cannot be undone.
            </DialogDescription>
          </>
        )

      default:
        return null
    }
  }

  const getDialogTitle = () => {
    switch (dialogAction) {
      case 'markInvestment':
        return 'Mark as Investment'
      case 'closePosition':
        return 'Close Position'
      case 'updateNotes':
        return 'Update Notes'
      case 'deletePosition':
        return 'Delete Position'
      default:
        return 'Manage Position'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Open Trades Manager</CardTitle>
          <CardDescription>Loading your portfolio...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  if (!tradesData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Open Trades Manager</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const activeTrades = tradesData.openTrades.filter(t => !t.isManuallyClosed)
  const closedTrades = tradesData.openTrades.filter(t => t.isManuallyClosed)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Portfolio Manager</span>
              </CardTitle>
              <CardDescription>Manage your open positions and investments</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClosed(!showClosed)}
              >
                {showClosed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showClosed ? 'Hide Closed' : 'Show Closed'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadOpenTrades}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tradesData.total}</div>
              <div className="text-sm text-muted-foreground">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tradesData.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{tradesData.investments}</div>
              <div className="text-sm text-muted-foreground">Investments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{tradesData.closed}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Positions */}
      {activeTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Active Positions</span>
            </CardTitle>
            <CardDescription>Your current open positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={trade.isInvestment ? "secondary" : "default"}>
                          {trade.isInvestment ? (
                            <>
                              <BookmarkCheck className="h-3 w-3 mr-1" />
                              Investment
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Trading
                            </>
                          )}
                        </Badge>
                        <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'destructive'}>
                          {trade.tradeType}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{trade.symbol}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(trade, 'updateNotes')}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Notes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(trade, 'markInvestment')}
                      >
                        {trade.isInvestment ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Remove Investment
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4 mr-1" />
                            Mark Investment
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(trade, 'closePosition')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{trade.remainingQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Price</p>
                      <p className="font-semibold">{formatCurrency(trade.averagePrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current P&L</p>
                      <div className={`flex items-center space-x-1 ${getPnLColor(trade.unrealizedPnl)}`}>
                        {getPnLIcon(trade.unrealizedPnl)}
                        <span className="font-semibold">{formatCurrency(trade.unrealizedPnl)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">P&L %</p>
                      <div className={`flex items-center space-x-1 ${getPnLColor(trade.unrealizedPnlPct)}`}>
                        {getPnLIcon(trade.unrealizedPnlPct)}
                        <span className="font-semibold">{formatPercentage(trade.unrealizedPnlPct)}</span>
                      </div>
                    </div>
                  </div>

                  {trade.notes && (
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm">
                        <strong>Notes:</strong> {trade.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closed Positions */}
      {showClosed && closedTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <X className="h-5 w-5 text-gray-500" />
              <span>Closed Positions</span>
            </CardTitle>
            <CardDescription>Your manually closed positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closedTrades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Closed {trade.manualCloseDate ? formatDate(trade.manualCloseDate) : 'Unknown'}
                      </Badge>
                      <h3 className="font-semibold text-lg">{trade.symbol}</h3>
                      {trade.manualCloseReason && (
                        <Badge variant="secondary">
                          {trade.manualCloseReason}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(trade, 'reopenPosition')}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(trade, 'deletePosition')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Final Quantity</p>
                      <p className="font-semibold">{trade.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Final Price</p>
                      <p className="font-semibold">{formatCurrency(trade.price)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Close Date</p>
                      <p className="font-semibold">{formatDate(trade.date)}</p>
                    </div>
                  </div>

                  {trade.notes && (
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm">
                        <strong>Notes:</strong> {trade.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Positions Message */}
      {tradesData.total === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Open Positions</h3>
            <p className="text-muted-foreground">
              You don't have any open positions yet. Start trading to see your portfolio here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitAction} 
              disabled={isSubmitting}
              variant={dialogAction === 'deletePosition' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {dialogAction === 'deletePosition' ? (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirm
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
