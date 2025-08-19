"use client"

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, Database, Shield, Sparkles, RefreshCw, BarChart3, Loader2, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface TradeBook {
  id: string
  fileName: string
  fileSize: number
  uploadTimestamp: string
  parsed: boolean
  totalRows: number
  schemaMapping: any
  rawTrades: RawTrade[]
  matchedTrades?: any[]
  openPositions?: any[]
}

interface RawTrade {
  id: string
  symbol: string
  tradeType: string
  quantity: number
  price: any
  tradeDatetime: string
  commission: number
  remainingQuantity: number
  matchedQuantity: number
  isFullyMatched: boolean
  isOpenPosition: boolean
}

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [tradeHistory, setTradeHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    symbol: '',
    tradeType: 'all',
    pnlRange: 'all'
  })
  const [filteredTrades, setFilteredTrades] = useState<any[]>([])
  
  // Upload result states
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [showUploadResult, setShowUploadResult] = useState(false)

  // Summary stats for display
  const [summaryStats, setSummaryStats] = useState({
    totalUploads: 0,
    totalRawTrades: 0,
    totalMatchedTrades: 0,
    totalOpenPositions: 0,
    totalPnl: 0,
    winRate: 0
  })
  
  // Store matched trades and open positions for display
  const [matchedTrades, setMatchedTrades] = useState<any[]>([])
  const [openPositions, setOpenPositions] = useState<any[]>([])

  // Fetch trades data
  const fetchTrades = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch('/api/trades/history')
      if (response.ok) {
        const data = await response.json()
        setTradeHistory(data.data?.tradeBooks || [])
        setFilteredTrades(data.data?.tradeBooks || [])
        
        // Store the summary data for display
        setSummaryStats({
          totalUploads: data.data?.summary?.totalUploads || 0,
          totalRawTrades: data.data?.summary?.totalRawTrades || 0,
          totalMatchedTrades: data.data?.summary?.totalMatchedTrades || 0,
          totalOpenPositions: data.data?.summary?.totalOpenPositions || 0,
          totalPnl: data.data?.summary?.totalPnl || 0,
          winRate: data.data?.summary?.winRate || 0
        })
        
        // Store matched trades and open positions
        setMatchedTrades(data.data?.matchedTrades || [])
        setOpenPositions(data.data?.openPositions || [])
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Fetch trades on component mount
  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsLoading(true)

    try {
      // Parse CSV to get headers
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

      // Create column mapping
      const columnMapping: Record<string, string> = {}
      
      // Try to auto-detect columns
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes('symbol') || lowerHeader.includes('scrip') || lowerHeader.includes('script')) {
          columnMapping.symbol = header
        } else if ((lowerHeader.includes('trade') && lowerHeader.includes('type')) || 
                   lowerHeader.includes('buy') || 
                   lowerHeader.includes('sell')) {
          columnMapping.tradeType = header
        } else if (lowerHeader.includes('quantity') || lowerHeader.includes('qty')) {
          columnMapping.quantity = header
        } else if (lowerHeader.includes('price') || lowerHeader.includes('rate')) {
          columnMapping.price = header
        } else if (lowerHeader.includes('date')) {
          columnMapping.date = header
        } else if (lowerHeader.includes('time')) {
          columnMapping.time = header
        } else if (lowerHeader.includes('commission') || lowerHeader.includes('brokerage')) {
          columnMapping.commission = header
        } else if (lowerHeader.includes('trade') && lowerHeader.includes('id')) {
          columnMapping.tradeId = header
        }
      })

      // Debug logging
      console.log('Headers:', headers)
      console.log('Column mapping:', columnMapping)
      
      // Validate required mappings
      if (!columnMapping.symbol || !columnMapping.tradeType || !columnMapping.quantity || !columnMapping.price || !columnMapping.date) {
        console.log('Missing mappings:', {
          symbol: !!columnMapping.symbol,
          tradeType: !!columnMapping.tradeType,
          quantity: !!columnMapping.quantity,
          price: !!columnMapping.price,
          date: !!columnMapping.date
        })
        toast({
          title: "Error",
          description: "Could not auto-detect required columns. Please ensure your CSV has: symbol, trade type, quantity, price, and date columns.",
          variant: "destructive",
        })
        return
      }

          const formData = new FormData()
          formData.append('file', file)
      formData.append('columnMapping', JSON.stringify(columnMapping))

      const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
        setUploadResult(result.data)
        setShowUploadResult(true)
        
        toast({
          title: "Success",
          description: `Trades uploaded successfully! ${result.data.matchedTrades} trades matched, ${result.data.openPositions} open positions.`,
        })
        
        // Refresh trade history
        fetchTrades()
          } else {
            const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to upload trades",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload trades",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchTrades])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  })

  const applyFilters = () => {
    let filtered = tradeHistory
    
    if (filters.dateFrom) {
      filtered = filtered.filter((t: any) => new Date(t.uploadTimestamp) >= new Date(filters.dateFrom))
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter((t: any) => new Date(t.uploadTimestamp) <= new Date(filters.dateTo))
    }
    
    if (filters.symbol) {
      filtered = filtered.filter((t: any) => 
        t.rawTrades?.some((trade: any) => 
          trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
        )
      )
    }
    
    if (filters.tradeType !== 'all') {
      filtered = filtered.filter((t: any) => 
        t.rawTrades?.some((trade: any) => 
          trade.tradeType.toLowerCase() === filters.tradeType.toLowerCase()
        )
      )
    }
    
    setFilteredTrades(filtered)
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      symbol: '',
      tradeType: 'all',
      pnlRange: 'all'
    })
    setFilteredTrades(tradeHistory)
  }

  const handleDeleteTradeBook = async (tradeBookId: string) => {
    if (!confirm('Are you sure you want to delete this trade book and all associated trades? This action cannot be undone.')) {
      return
    }
    try {
      const response = await fetch('/api/settings/data-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', dataType: 'tradeBook', tradeBookId }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Trade book deleted successfully" })
        fetchTrades()
      } else {
        const errorData = await response.json()
        toast({ title: "Error", description: errorData.error || "Failed to delete trade book", variant: "destructive" })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({ title: "Error", description: "Failed to delete trade book", variant: "destructive" })
    }
  }

  const handleDataCleanup = async () => {
    if (!confirm('This will clean up orphaned data and fix data inconsistencies. Continue?')) {
      return
    }
    try {
      const response = await fetch('/api/settings/data-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' }),
      })
      if (response.ok) {
        const result = await response.json()
        toast({ 
          title: "Success", 
          description: `Cleanup completed! Removed ${result.cleanupResults.orphanedMatchedTrades} orphaned trades.` 
        })
        fetchTrades() // Refresh data
      } else {
        const errorData = await response.json()
        toast({ title: "Error", description: errorData.error || "Failed to cleanup data", variant: "destructive" })
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      toast({ title: "Error", description: "Failed to cleanup data", variant: "destructive" })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* File Upload Section */}
          <Card className="glass-card hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Trade Data
              </CardTitle>
              <CardDescription>
                Upload your CSV trade files for analysis and matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports CSV, Excel files with trade data
                </p>
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Processing your file...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Results */}
          {showUploadResult && uploadResult && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Upload Results
                </CardTitle>
                <CardDescription>
                  Trade matching analysis and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{uploadResult.totalRows}</div>
                    <div className="text-sm text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="text-2xl font-bold text-success">{uploadResult.validTrades}</div>
                    <div className="text-sm text-muted-foreground">Valid Trades</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <div className="text-2xl font-bold text-accent">{uploadResult.matchedTrades}</div>
                    <div className="text-sm text-muted-foreground">Matched Trades</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="text-2xl font-bold text-warning">{uploadResult.openPositions}</div>
                    <div className="text-sm text-muted-foreground">Open Positions</div>
                  </div>
                </div>
                
                {uploadResult.netProfit !== undefined && (
                  <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className={`text-2xl font-bold ${uploadResult.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ₹{uploadResult.netProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Net Realized P&L</div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={() => setShowUploadResult(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUploadResult(false)
                      setUploadResult(null)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Upload Another File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trades Display Section */}
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <div>
                    <CardTitle>Uploaded Trades</CardTitle>
                    <CardDescription>View and manage all your uploaded trade data</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDataCleanup}
                    variant="outline"
                    size="sm"
                    className="h-8 text-warning border-warning/20 hover:bg-warning/10"
                    disabled={isLoadingHistory}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="ml-2">Cleanup</span>
                  </Button>
                  <Button
                    onClick={fetchTrades}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={isLoadingHistory}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    <span className="ml-2">Refresh</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Filter Controls */}
            <div className="px-6 pb-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-xs">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-xs">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="symbol" className="text-xs">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., INFY"
                    value={filters.symbol}
                    onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="tradeType" className="text-xs">Trade Type</Label>
                  <Select value={filters.tradeType} onValueChange={(value) => setFilters(prev => ({ ...prev, tradeType: value }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trades</SelectItem>
                      <SelectItem value="buy">Buy Only</SelectItem>
                      <SelectItem value="sell">Sell Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pnlRange" className="text-xs">P&L Range</Label>
                  <Select value={filters.pnlRange} onValueChange={(value) => setFilters(prev => ({ ...prev, pnlRange: value }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All P&L</SelectItem>
                      <SelectItem value="profit">Profit Only</SelectItem>
                      <SelectItem value="loss">Loss Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={applyFilters}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={clearFilters}
                  size="sm"
                  variant="ghost"
                  className="h-8"
                >
                  Clear Filters
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  Showing {filteredTrades.length} of {tradeHistory.length} trades
                    </span>
              </div>
            </div>
            
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading trades...</span>
                </div>
              ) : filteredTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trades uploaded yet</p>
                  <p className="text-sm">Upload a CSV file to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-2xl font-bold text-primary">{summaryStats.totalUploads}</div>
                      <div className="text-sm text-muted-foreground">Files Uploaded</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <div className="text-2xl font-bold text-accent">
                        {summaryStats.totalRawTrades}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Trades</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
                      <div className="text-2xl font-bold text-success">
                        {summaryStats.totalMatchedTrades}
                      </div>
                      <div className="text-sm text-muted-foreground">Matched Trades</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
                      <div className="text-2xl font-bold text-warning">
                        {summaryStats.totalOpenPositions}
                      </div>
                      <div className="text-sm text-muted-foreground">Open Positions</div>
                    </div>
                  </div>
                  
                  {/* P&L Summary */}
                  {summaryStats.totalMatchedTrades > 0 && (
                    <div className="text-center p-4 rounded-lg bg-muted/30 border">
                      <div className="text-3xl font-bold text-foreground">
                        ₹{summaryStats.totalPnl.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Net Realized P&L • {summaryStats.winRate.toFixed(1)}% Win Rate
                      </div>
                    </div>
                  )}

                  {/* Matched Trades Details */}
                  {matchedTrades.length > 0 && (
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        Matched Trades ({matchedTrades.length})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {matchedTrades.map((trade: any) => (
                          <div key={trade.id} className="p-3 bg-muted/20 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-foreground">{trade.symbol}</div>
                              <div className={`text-sm font-medium ${
                                Number(trade.pnl) >= 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                {Number(trade.pnl) >= 0 ? '+' : ''}₹{Number(trade.pnl).toFixed(2)}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="text-muted-foreground">Buy</div>
                                <div className="text-success">
                                  {trade.quantity} @ ₹{Number(trade.buyPrice).toFixed(2)}
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(trade.buyDate).toLocaleDateString()}
                                  {trade.buyTime && ` ${trade.buyTime}`}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground">Sell</div>
                                <div className="text-destructive">
                                  {trade.quantity} @ ₹{Number(trade.sellPrice).toFixed(2)}
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(trade.sellDate).toLocaleDateString()}
                                  {trade.sellTime && ` ${trade.sellTime}`}
                                </div>
                              </div>
                            </div>
                            {trade.duration && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Duration: {trade.duration} minutes • P&L%: {Number(trade.pnlPct).toFixed(2)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Positions Details */}
                  {openPositions.length > 0 && (
                    <div className="p-4 border rounded-lg bg-card">
                      <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <Database className="h-5 w-5 text-warning" />
                        Open Positions ({openPositions.length})
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {openPositions.map((position: any) => (
                          <div key={position.id} className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-foreground">{position.symbol}</div>
                              <div className={`text-sm px-2 py-1 rounded text-xs ${
                                position.tradeType === 'BUY' 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-destructive/10 text-destructive'
                              }`}>
                                {position.tradeType}
                              </div>
                            </div>
                            <div className="text-sm text-foreground">
                              {Number(position.quantity)} @ ₹{Number(position.price).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(position.date).toLocaleDateString()}
                              {position.time && ` ${position.time}`}
                            </div>
                            {position.unrealizedPnl !== 0 && (
                              <div className={`text-xs mt-2 ${
                                Number(position.unrealizedPnl) >= 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                Unrealized P&L: ₹{Number(position.unrealizedPnl).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trade Books */}
                  {filteredTrades.map((tradeBook) => (
                    <div key={tradeBook.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <h5 className="font-medium text-foreground">{tradeBook.fileName}</h5>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(tradeBook.fileSize)} • {tradeBook.totalRows} trades
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(tradeBook.uploadTimestamp)}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            tradeBook.parsed 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {tradeBook.parsed ? 'Parsed' : 'Processing'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          onClick={() => handleDeleteTradeBook(tradeBook.id)}
                          variant="outline"
                          size="sm"
                          className="h-7 text-destructive border-destructive/20 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Raw Trades Preview */}
                      {tradeBook.rawTrades && tradeBook.rawTrades.length > 0 && (
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-foreground mb-2">Raw Trades:</h6>
                          <div className="max-h-32 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {tradeBook.rawTrades.slice(0, 6).map((trade: any) => (
                                <div key={trade.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                  <span className="font-medium">{trade.symbol}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    trade.tradeType.toUpperCase() === 'BUY' 
                                      ? 'bg-success/10 text-success' 
                                      : 'bg-destructive/10 text-destructive'
                                  }`}>
                                    {trade.tradeType}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {trade.quantity} @ ₹{Number(trade.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matched Trades Summary */}
                      {tradeBook.matchedTrades && tradeBook.matchedTrades.length > 0 && (
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-foreground mb-2">Matched Trades:</h6>
                          <div className="text-xs text-muted-foreground">
                            {tradeBook.matchedTrades.length} trades matched with total P&L
                          </div>
                        </div>
                      )}

                      {/* Open Positions Summary */}
                      {tradeBook.openPositions && tradeBook.openPositions.length > 0 && (
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-foreground mb-2">Open Positions:</h6>
                          <div className="text-xs text-muted-foreground">
                            {tradeBook.openPositions.length} positions still open
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <CardTitle>Upload Guidelines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Symbol/Stock name
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Trade type (BUY/SELL)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Quantity
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Price
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Date and time
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-success" />
                <CardTitle>Supported Formats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  CSV files (.csv)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Excel exports
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Broker statements
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  Custom trade logs
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}