"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUserSync } from '@/hooks/useUserSync'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Shield, 
  Palette, 
  Bell, 
  Database,
  Save,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Settings as SettingsIcon,
  Sparkles,
  Gauge,
  Zap,
  Loader2,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  Info
} from 'lucide-react'

interface RiskProfile {
  totalCapital: number
  maxDailyDrawdownPct: number
  maxConsecutiveLosses: number
  riskPerTradePct: number
}

interface UserProfile {
  name: string
  email: string
}

interface NotificationPreferences {
  riskAlerts: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  tradeNotifications: boolean
  performanceAlerts: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

interface BrokerConnection {
  id: string
  brokerName: string
  apiKey: string
  apiSecret: string
  isActive: boolean
  lastConnected: string
}

export default function SettingsPage() {
  const { user, loading: userLoading, error: userError, refreshUser } = useUserSync()
  const { toast } = useToast()
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: ''
  })

  const [riskProfile, setRiskProfile] = useState<RiskProfile>({
    totalCapital: 100000,
    maxDailyDrawdownPct: 2.0,
    maxConsecutiveLosses: 3,
    riskPerTradePct: 1.0
  })

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    riskAlerts: true,
    dailyDigest: true,
    weeklyReport: false,
    tradeNotifications: true,
    performanceAlerts: true,
    emailNotifications: true,
    pushNotifications: true
  })

  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([])
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({})
  const [newBroker, setNewBroker] = useState({
    brokerName: '',
    apiKey: '',
    apiSecret: ''
  })

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRisk, setIsSavingRisk] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [isSavingBroker, setIsSavingBroker] = useState(false)
  const [isExportingData, setIsExportingData] = useState(false)
  const [isDeletingData, setIsDeletingData] = useState(false)
  const [isLoadingRisk, setIsLoadingRisk] = useState(true)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<string>('')

  // Load user profile data
  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name || '',
        email: user.email || ''
      })
    }
  }, [user])

  // Load user's current risk profile settings
  useEffect(() => {
    const loadRiskProfile = async () => {
      try {
        const response = await fetch('/api/settings/risk-profile')
        if (response.ok) {
          const data = await response.json()
          setRiskProfile(data.data)
        }
      } catch (error) {
        console.error('Error loading risk profile:', error)
      } finally {
        setIsLoadingRisk(false)
      }
    }

    loadRiskProfile()
  }, [])

  // Load notification preferences
  useEffect(() => {
    const loadNotificationPrefs = async () => {
      try {
        const response = await fetch('/api/settings/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotificationPrefs(data.data)
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }

    loadNotificationPrefs()
  }, [])

  // Load broker connections
  useEffect(() => {
    const loadBrokerConnections = async () => {
      try {
        const response = await fetch('/api/settings/broker-connection')
        if (response.ok) {
          const data = await response.json()
          setBrokerConnections(data.data)
        }
      } catch (error) {
        console.error('Error loading broker connections:', error)
      } finally {
        setIsLoadingBrokers(false)
      }
    }

    loadBrokerConnections()
  }, [])

  const handleUserProfileChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRiskProfileChange = (field: keyof RiskProfile, value: number) => {
    setRiskProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (field: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveUserProfile = async () => {
    setIsSavingProfile(true)
    setProfileSaveSuccess(false)
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      })

      if (response.ok) {
        setProfileSaveSuccess(true)
        await refreshUser()
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
        setTimeout(() => setProfileSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving user profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveRiskProfile = async () => {
    setIsSavingRisk(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/settings/risk-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(riskProfile),
      })

      if (response.ok) {
        setSaveSuccess(true)
        toast({
          title: "Success",
          description: "Risk profile saved successfully!",
        })
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save risk profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving risk profile:', error)
      toast({
        title: "Error",
        description: "Failed to save risk profile",
        variant: "destructive",
      })
    } finally {
      setIsSavingRisk(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true)
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPrefs),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification preferences saved successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save notification preferences",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handleSaveBroker = async () => {
    if (!newBroker.brokerName || !newBroker.apiKey || !newBroker.apiSecret) {
      toast({
        title: "Error",
        description: "Please fill in all broker details",
        variant: "destructive",
      })
      return
    }

    setIsSavingBroker(true)
    
    try {
      const response = await fetch('/api/settings/broker-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBroker,
          isActive: true
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Broker connection saved successfully!",
        })
        setNewBroker({ brokerName: '', apiKey: '', apiSecret: '' })
        // Reload broker connections
        const reloadResponse = await fetch('/api/settings/broker-connection')
        if (reloadResponse.ok) {
          const data = await reloadResponse.json()
          setBrokerConnections(data.data)
        }
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
      setIsSavingBroker(false)
    }
  }

  const handleDeleteBroker = async (connectionId: string) => {
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

  const handleExportData = async () => {
    setIsExportingData(true)
    
    try {
      const response = await fetch('/api/settings/data-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: `Data export completed! ${data.data.dataSummary.totalMatchedTrades} trades exported.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to export data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setIsExportingData(false)
    }
  }

  const handleDeleteData = async () => {
    if (!deleteType) return
    
    setIsDeletingData(true)
    try {
      const response = await fetch('/api/settings/data-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', dataType: deleteType }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        
        if (deleteType === 'all') {
          // Redirect to home page since user data is deleted
          window.location.href = '/'
        } else {
          // Refresh the page to show updated data
          window.location.reload()
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete data",
        variant: "destructive",
      })
    } finally {
      setIsDeletingData(false)
      setShowDeleteConfirm(null)
    }
  }

  if (userLoading || isLoadingRisk || isLoadingNotifications || isLoadingBrokers) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4 md:p-6">
        <div className="text-center">
          <p className="text-danger mb-2">Error loading user data</p>
          <p className="text-sm text-muted-foreground">{userError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* User Profile */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={userProfile.name}
                  onChange={(e) => handleUserProfileChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={userProfile.email}
                  onChange={(e) => handleUserProfileChange('email', e.target.value)}
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveUserProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
            {profileSaveSuccess && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Profile updated successfully!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Profile */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle>Risk Profile</CardTitle>
            </div>
            <CardDescription>
              Configure your trading risk parameters for Guardian AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="totalCapital">Total Capital (₹) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totalCapital"
                    type="number"
                    min="1000"
                    step="1000"
                    value={riskProfile.totalCapital}
                    onChange={(e) => handleRiskProfileChange('totalCapital', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum: ₹1,000</p>
              </div>
              <div>
                <Label htmlFor="maxDailyDrawdown">Max Daily Drawdown (%) *</Label>
                <Input
                  id="maxDailyDrawdown"
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={riskProfile.maxDailyDrawdownPct}
                  onChange={(e) => handleRiskProfileChange('maxDailyDrawdownPct', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Range: 0.1% - 50%</p>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxConsecutiveLosses">Max Consecutive Losses *</Label>
                <Input
                  id="maxConsecutiveLosses"
                  type="number"
                  min="1"
                  max="20"
                  value={riskProfile.maxConsecutiveLosses}
                  onChange={(e) => handleRiskProfileChange('maxConsecutiveLosses', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Range: 1 - 20</p>
              </div>
              <div>
                <Label htmlFor="riskPerTrade">Risk Per Trade (%) *</Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskProfile.riskPerTradePct}
                  onChange={(e) => handleRiskProfileChange('riskPerTradePct', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Range: 0.1% - 10%</p>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">Risk Management Guidelines:</p>
                  <ul className="space-y-1">
                    <li>• Never risk more than 2% of your capital per trade</li>
                    <li>• Set daily loss limits to prevent emotional trading</li>
                    <li>• Take breaks after consecutive losses to reset mindset</li>
                    <li>• Monitor your risk metrics regularly</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleSaveRiskProfile}
              disabled={isSavingRisk || 
                riskProfile.totalCapital < 1000 || 
                riskProfile.riskPerTradePct < 0.1 || 
                riskProfile.riskPerTradePct > 10 ||
                riskProfile.maxDailyDrawdownPct < 0.1 || 
                riskProfile.maxDailyDrawdownPct > 50 ||
                riskProfile.maxConsecutiveLosses < 1 || 
                riskProfile.maxConsecutiveLosses > 20
              }
            >
              {isSavingRisk ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Risk Profile
                </>
              )}
            </Button>
            {saveSuccess && (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Risk profile saved successfully!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="riskAlerts" className="font-medium">Risk Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified of high-risk situations</p>
                </div>
                <input 
                  type="checkbox" 
                  id="riskAlerts" 
                  checked={notificationPrefs.riskAlerts}
                  onChange={(e) => handleNotificationChange('riskAlerts', e.target.checked)}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="dailyDigest" className="font-medium">Daily Performance Digest</Label>
                  <p className="text-xs text-muted-foreground">Daily summary of your trading performance</p>
                </div>
                <input 
                  type="checkbox" 
                  id="dailyDigest" 
                  checked={notificationPrefs.dailyDigest}
                  onChange={(e) => handleNotificationChange('dailyDigest', e.target.checked)}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="weeklyReport" className="font-medium">Weekly Analytics Report</Label>
                  <p className="text-xs text-muted-foreground">Detailed weekly performance analysis</p>
                </div>
                <input 
                  type="checkbox" 
                  id="weeklyReport" 
                  checked={notificationPrefs.weeklyReport}
                  onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                  className="rounded" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="tradeNotifications" className="font-medium">Trade Notifications</Label>
                  <p className="text-xs text-muted-foreground">Real-time trade alerts and updates</p>
                </div>
                <input 
                  type="checkbox" 
                  id="tradeNotifications" 
                  checked={notificationPrefs.tradeNotifications}
                  onChange={(e) => handleNotificationChange('tradeNotifications', e.target.checked)}
                  className="rounded" 
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveNotifications}
              disabled={isSavingNotifications}
            >
              {isSavingNotifications ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-success" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <CardDescription>
              Manage your trading data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  <span className="font-medium">Export Data</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Download a complete backup of all your trading data and settings
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={isExportingData}
                  variant="outline"
                  className="w-full"
                >
                  {isExportingData ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Delete Data</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Remove specific data types or delete everything
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setDeleteType('trades')
                      setShowDeleteConfirm('trades')
                    }}
                    disabled={isDeletingData}
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Trades
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteType('insights')
                      setShowDeleteConfirm('insights')
                    }}
                    disabled={isDeletingData}
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Insights
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteType('settings')
                      setShowDeleteConfirm('settings')
                    }}
                    disabled={isDeletingData}
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Settings
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteType('all')
                      setShowDeleteConfirm('all')
                    }}
                    disabled={isDeletingData}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Everything
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Broker Connections */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <CardTitle>Broker Connections</CardTitle>
          </div>
          <CardDescription>
            Connect your trading accounts for automated data sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Connections */}
          {brokerConnections.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Connected Brokers</h4>
              {brokerConnections.map((connection) => (
                <div key={connection.id} className="relative p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${connection.isActive ? 'bg-success' : 'bg-muted'}`} />
                      <div>
                        <p className="font-medium capitalize">{connection.brokerName}</p>
                        <p className="text-xs text-muted-foreground">
                          Last connected: {new Date(connection.lastConnected).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {connection.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKeys(prev => ({ ...prev, [connection.id]: !prev[connection.id] }))}
                      >
                        {showApiKeys[connection.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBroker(connection.id)}
                        className="text-danger hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {showApiKeys[connection.id] && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">API Key</p>
                          <p className="text-xs font-mono bg-background p-2 rounded border">
                            {connection.apiKey.substring(0, 8)}...{connection.apiKey.substring(connection.apiKey.length - 4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">API Secret</p>
                          <p className="text-xs font-mono bg-background p-2 rounded border">
                            {connection.apiSecret.substring(0, 8)}...{connection.apiSecret.substring(connection.apiSecret.length - 4)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⚠️ Keep your API keys secure and never share them
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Connection */}
          <div className="space-y-4">
            <h4 className="font-medium">Add New Broker</h4>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <Label htmlFor="brokerName">Broker Name</Label>
                <Input
                  id="brokerName"
                  placeholder="e.g., Zerodha"
                  value={newBroker.brokerName}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, brokerName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key"
                  value={newBroker.apiKey}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  placeholder="Enter API secret"
                  value={newBroker.apiSecret}
                  onChange={(e) => setNewBroker(prev => ({ ...prev, apiSecret: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Broker Connection Tips:</p>
                  <ul className="space-y-1">
                    <li>• Ensure your API keys have the correct permissions</li>
                    <li>• Test the connection before saving</li>
                    <li>• Keep your API keys secure and private</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveBroker}
              disabled={isSavingBroker || !newBroker.brokerName || !newBroker.apiKey || !newBroker.apiSecret}
              className="flex items-center"
            >
              {isSavingBroker ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Broker
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h4 className="font-semibold text-red-900 dark:text-red-100">
              Confirm Data Deletion
            </h4>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">
            {deleteType === 'trades' && 
              "This action will permanently delete ALL your trading data including raw trades, matched trades, and trade books. This cannot be undone."
            }
            {deleteType === 'insights' && 
              "This action will permanently delete ALL your trading insights, risk sessions, and trading summaries. This cannot be undone."
            }
            {deleteType === 'settings' && 
              "This action will permanently delete ALL your settings, preferences, and broker connections. This cannot be undone."
            }
            {deleteType === 'all' && 
              "This action will permanently delete ALL your data including trades, analytics, settings, and account. This cannot be undone."
            }
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm"
              variant="destructive"
              onClick={handleDeleteData}
              disabled={isDeletingData}
            >
              {isDeletingData ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Yes, Delete {deleteType === 'all' ? 'Everything' : deleteType === 'trades' ? 'All Trades' : deleteType === 'insights' ? 'Insights' : 'Settings'}
                </>
              )}
            </Button>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={isDeletingData}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 