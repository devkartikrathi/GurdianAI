"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

import { 
  Database, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Clock,
  User,
  Key,
  Shield,
  Loader2,
  ExternalLink,
  Info,
  Settings
} from 'lucide-react'


interface BrokerConnection {
  id: string
  brokerName: string
  apiKey: string
  apiSecret: string
  accessToken?: string
  userIdZerodha?: string
  userName?: string
  email?: string
  connectionStatus: 'pending' | 'active' | 'expired' | 'error'
  lastSyncAt?: Date
  expiresAt?: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

export default function BrokerConnectionComponent() {
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({})
  const [editingBroker, setEditingBroker] = useState<BrokerConnection | null>(null)
  const [newBroker, setNewBroker] = useState({
    brokerName: 'zerodha',
    apiKey: '',
    apiSecret: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [showOAuthInstructions, setShowOAuthInstructions] = useState<string | null>(null)
  const { toast } = useToast()

  // Load broker connections
  useEffect(() => {
    loadBrokerConnections()
  }, [])

  // Check for pending connections and show OAuth instructions if needed
  useEffect(() => {
    if (brokerConnections.length > 0) {
      const pendingConnection = brokerConnections.find(conn => 
        conn.brokerName === 'zerodha' && conn.connectionStatus === 'pending'
      )
      
      if (pendingConnection && !showOAuthInstructions) {
        setShowOAuthInstructions(pendingConnection.id)
      }
    }
  }, [brokerConnections, showOAuthInstructions])

  // Auto-refresh connections every 5 seconds when there's a pending connection
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (showOAuthInstructions) {
      interval = setInterval(() => {
        loadBrokerConnections()
      }, 5000) // Check every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [showOAuthInstructions])

  const loadBrokerConnections = async () => {
    try {
      const response = await fetch('/api/settings/broker-connection')
      if (response.ok) {
        const data = await response.json()
        setBrokerConnections(data.data)
      }
    } catch (error) {
      console.error('Error loading broker connections:', error)
    }
  }

  const handleEditBroker = (broker: BrokerConnection) => {
    setEditingBroker(broker)
    setNewBroker({
      brokerName: broker.brokerName,
      apiKey: broker.apiKey,
      apiSecret: broker.apiSecret
    })
    setShowAddForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBroker(null)
    setNewBroker({ brokerName: 'zerodha', apiKey: '', apiSecret: '' })
    setShowAddForm(false)
  }

  const handleSaveBroker = async () => {
    if (!newBroker.apiKey || !newBroker.apiSecret) {
      toast({
        title: "Error",
        description: "Please fill in all broker details",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
    try {
      const method = editingBroker ? 'PUT' : 'POST'
      const url = editingBroker 
        ? `/api/settings/broker-connection/${editingBroker.id}`
        : '/api/settings/broker-connection'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBroker,
          isActive: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (newBroker.brokerName === 'zerodha') {
          // For Zerodha, automatically redirect to login URL
          if (result.data.loginUrl) {
            toast({
              title: editingBroker ? "Connection Updated" : "Connection Created",
              description: "Redirecting to Zerodha login page...",
            })
            
            // Automatically open the login URL in a new tab
            window.open(result.data.loginUrl, '_blank')
            
            // Show OAuth instructions for manual completion
            if (result.data.connectionId) {
              setShowOAuthInstructions(result.data.connectionId)
            }
          } else {
            toast({
              title: editingBroker ? "Connection Updated" : "Connection Created",
              description: "Please complete OAuth authentication manually",
            })
          }
        } else {
          toast({
            title: editingBroker ? "Connection Updated" : "Connection Created",
            description: "Broker connection saved successfully!",
          })
        }
        
        setNewBroker({ brokerName: 'zerodha', apiKey: '', apiSecret: '' })
        setEditingBroker(null)
        setShowAddForm(false)
        await loadBrokerConnections()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save broker connection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving broker connection:', error)
      toast({
        title: "Error",
        description: "Failed to save broker connection",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async (connection: BrokerConnection) => {
    setIsTesting(connection.id)
    
    try {
      const response = await fetch('/api/settings/broker-connection/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: connection.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Connection Test Successful",
          description: `Successfully connected to ${connection.brokerName}. User: ${result.data.userName}`,
        })
        // Refresh connections to update status
        await loadBrokerConnections()
      } else {
        const error = await response.json()
        
        if (error.requiresOAuth) {
          toast({
            title: "OAuth Required",
            description: error.details || "Please complete OAuth authentication first",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Connection Test Failed",
            description: error.details || error.error || "Failed to test connection",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setIsTesting(null)
    }
  }

  const handleSyncTrades = async (connection: BrokerConnection) => {
    setIsSyncing(connection.id)
    
    try {
      const response = await fetch('/api/settings/broker-connection/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: connection.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Trades Synced",
          description: `Successfully imported ${result.data.tradesCount || 0} trades`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Sync Failed",
          description: error.error || "Failed to sync trades",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error syncing trades:', error)
      toast({
        title: "Error",
        description: "Failed to sync trades",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(null)
    }
  }

  const handleReauthenticate = async (broker: BrokerConnection) => {
    try {
      setIsSaving(true)
      
      // Use existing credentials to generate new login URL
      const response = await fetch(`/api/settings/broker-connection/${broker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerName: broker.brokerName,
          apiKey: broker.apiKey,
          apiSecret: broker.apiSecret
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate re-authentication URL')
      }

      if (result.loginUrl) {
        // Open Zerodha login in new tab
        window.open(result.loginUrl, '_blank')
        
        toast({
          title: "Re-authentication Started",
          description: "Complete the login in the new tab. This page will auto-refresh when done.",
        })

        // Start auto-refresh to detect when authentication is complete
        setShowOAuthInstructions(broker.id)
      }

    } catch (error) {
      console.error('Re-authentication error:', error)
      toast({
        title: "Re-authentication Failed",
        description: error instanceof Error ? error.message : 'Failed to start re-authentication',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBroker = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this broker connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/settings/broker-connection?id=${connectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Broker connection deleted successfully!",
        })
        setBrokerConnections(prev => prev.filter(conn => conn.id !== connectionId))
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete broker connection",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting broker connection:', error)
      toast({
        title: "Error",
        description: "Failed to delete broker connection",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="glass-card hover-lift border-2 border-primary/20 bg-primary/5">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg text-primary">🔗 Broker Connections</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Connect your trading accounts to enable real-time data and automated trading
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Existing Connections */}
      {brokerConnections.map((broker) => (
        <Card key={broker.id} className="glass-card hover-lift">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(broker.connectionStatus)}
                  <CardTitle className="text-base sm:text-lg">
                    {broker.brokerName.charAt(0).toUpperCase() + broker.brokerName.slice(1)} Connection
                  </CardTitle>
                </div>
                <Badge className={`text-xs ${getStatusColor(broker.connectionStatus)}`}>
                  {broker.connectionStatus.charAt(0).toUpperCase() + broker.connectionStatus.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection(broker)}
                  disabled={isTesting === broker.id}
                  className="h-8"
                >
                  {isTesting === broker.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
                
                                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleSyncTrades(broker)}
                   disabled={isSyncing === broker.id}
                   className="h-8"
                   title="Fetch historical trades"
                 >
                   {isSyncing === broker.id ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Download className="h-4 w-4" />
                   )}
                 </Button>
                
                {(broker.connectionStatus === 'expired' || broker.connectionStatus === 'pending') && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleReauthenticate(broker)}
                    className="h-8 bg-primary hover:bg-primary/90"
                    title="Re-authenticate with Zerodha"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Re-authenticate
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditBroker(broker)}
                  className="h-8"
                  title="Edit connection details"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeys(prev => ({ ...prev, [broker.id]: !prev[broker.id] }))}
                  className="h-8"
                >
                  {showApiKeys[broker.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBroker(broker.id)}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {broker.userName && (
              <CardDescription className="text-sm">
                Connected as: {broker.userName} ({broker.email})
                {broker.lastSyncAt && (
                  <span className="ml-2">• Last sync: {new Date(broker.lastSyncAt).toLocaleString()}</span>
                )}
                {broker.expiresAt && (
                  <span className="ml-2">• Expires: {new Date(broker.expiresAt).toLocaleString()}</span>
                )}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <Label className="text-xs text-muted-foreground">API Key</Label>
                 <div className="flex items-center gap-2 mt-1">
                   <Input
                     type={showApiKeys[broker.id] ? "text" : "password"}
                     value={showApiKeys[broker.id] ? broker.apiKey : "••••••••••••••••"}
                     readOnly
                     className="text-sm"
                   />
                 </div>
               </div>
               
               <div>
                 <Label className="text-xs text-muted-foreground">API Secret</Label>
                 <div className="flex items-center gap-2 mt-1">
                   <Input
                     type={showApiKeys[broker.id] ? "text" : "password"}
                     value={showApiKeys[broker.id] ? broker.apiSecret : "••••••••••••••••"}
                     readOnly
                     className="text-sm"
                   />
                 </div>
               </div>
             </div>

                           {/* Trades Information */}
              {broker.connectionStatus === 'active' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Connection Active</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Use the Download button above to fetch your historical trades from Zerodha
                  </p>
                  
                                     {/* Daily Trades Summary */}
                   <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                     <h6 className="text-xs font-medium text-green-900 mb-2">📊 Daily Trading Summary</h6>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <div>
                         <span className="text-green-700">Total Trades:</span>
                         <span className="ml-1 font-medium">{broker.lastSyncAt ? 'Click Sync to fetch' : 'Not synced yet'}</span>
                       </div>
                       <div>
                         <span className="text-green-700">Last Sync:</span>
                         <span className="ml-1 font-medium">
                           {broker.lastSyncAt ? new Date(broker.lastSyncAt).toLocaleString() : 'Never'}
                         </span>
                       </div>
                       <div>
                         <span className="text-green-700">Token Expires:</span>
                         <span className="ml-1 font-medium">
                           {broker.expiresAt ? new Date(broker.expiresAt).toLocaleString() : 'Unknown'}
                         </span>
                       </div>
                       <div>
                         <span className="text-green-700">Status:</span>
                         <span className="ml-1 font-medium">
                           {broker.expiresAt && new Date(broker.expiresAt) < new Date() ? 'Expired' : 'Valid'}
                         </span>
                       </div>
                     </div>
                   </div>
                   
                   
                </div>
              )}

            
          </CardContent>
        </Card>
      ))}

      {/* Add New Broker Form */}
      {showAddForm && (
        <div className="p-4 border-2 border-dashed border-primary/25 rounded-lg bg-primary/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-foreground">
                {editingBroker ? "Update Broker Connection" : "Add New Broker Connection"}
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brokerName" className="text-sm">Broker</Label>
                <select
                  id="brokerName"
                  value={newBroker.brokerName}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, brokerName: e.target.value }))}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="zerodha">Zerodha</option>
                  <option value="angelone" disabled>Angel One (Coming Soon)</option>
                  <option value="upstox" disabled>Upstox (Coming Soon)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="apiKey" className="text-sm">API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  value={newBroker.apiKey}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API Key"
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="apiSecret" className="text-sm">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={newBroker.apiSecret}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="Enter API Secret"
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveBroker}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {editingBroker ? "Update & Re-authenticate" : "Save Connection"}
              </Button>
              
              <Button
                variant="outline"
                onClick={editingBroker ? handleCancelEdit : () => setShowAddForm(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Instructions */}
      {showOAuthInstructions && (
        <Card className="glass-card border-primary/25 bg-primary/5">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Complete OAuth Authentication</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Follow these steps to complete your Zerodha connection
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
                         <div className="space-y-4">
                {/* OAuth Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3">🔗 OAuth Authentication in Progress</h5>
                  <p className="text-sm text-green-800 mb-3">
                    A new tab should have opened with the Zerodha login page. Complete the authentication there.
                  </p>
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Login URL Generated",
                        description: "The login URL was generated when you saved your API credentials. Please check the new tab that opened.",
                      })
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Check Login Tab
                  </Button>
                  <p className="text-xs text-green-800">
                    Once you complete the OAuth flow, this connection will automatically become active. No need to paste tokens manually!
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Step-by-Step Instructions:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>A new tab should have opened with the Zerodha login page (if not, check your popup blocker)</li>
                    <li>Login with your Zerodha credentials</li>
                    <li>Authorize GuardianAI to access your trading data</li>
                    <li>Wait for the success page to appear</li>
                    <li>Close the tab and return here - your connection will be automatically activated!</li>
                  </ol>
                  
                  <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
                    <p className="text-xs text-blue-800">
                      <strong>Pro Tip:</strong> The system automatically detects when OAuth is completed. No manual token input required!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOAuthInstructions(null)
                    }}
                  >
                    Close Instructions
                  </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Connections Message */}
      {brokerConnections.length === 0 && !showAddForm && (
        <Card className="glass-card border-dashed border-2 border-gray-300 bg-gray-50/50">
          <CardContent className="p-8 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Broker Connections</h3>
            <p className="text-gray-600 mb-4">
              Get started by connecting your first trading account to enable real-time data and automated trading.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Broker Connection
            </Button>
          </CardContent>
        </Card>
      )}


    </div>
  )
}
