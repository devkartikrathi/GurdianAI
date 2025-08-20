"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUserSync } from '@/hooks/useUserSync'
import { useToast } from '@/hooks/use-toast'
import BrokerConnectionComponent from '@/components/dashboard/broker-connection'
import { 
  User, 
  Shield, 
  Palette, 
  Bell, 
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



  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRisk, setIsSavingRisk] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)

  const [isExportingData, setIsExportingData] = useState(false)
  const [isDeletingData, setIsDeletingData] = useState(false)
  const [isLoadingRisk, setIsLoadingRisk] = useState(true)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
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

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Configure your trading preferences and account settings</p>
          </div>
        </div>
      </div>

      {userLoading ? (
        <div className="flex items-center justify-center min-h-[400px] p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading settings...</span>
          </div>
        </div>
      ) : userError ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Failed to load settings</h3>
            <p className="text-muted-foreground mb-4">{userError}</p>
            <Button onClick={refreshUser} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* User Profile Section */}
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">User Profile</CardTitle>
              </div>
              <CardDescription className="text-sm">Your basic account information</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Risk Profile Section */}
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                <CardTitle className="text-base sm:text-lg">Risk Profile</CardTitle>
              </div>
              <CardDescription className="text-sm">Configure your risk management parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalCapital" className="text-sm">Total Capital (₹)</Label>
                  <Input
                    id="totalCapital"
                    type="number"
                    value={riskProfile.totalCapital}
                    onChange={(e) => setRiskProfile(prev => ({ ...prev, totalCapital: Number(e.target.value) }))}
                    placeholder="100000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxDailyDrawdownPct" className="text-sm">Max Daily Drawdown (%)</Label>
                  <Input
                    id="maxDailyDrawdownPct"
                    type="number"
                    step="0.1"
                    value={riskProfile.maxDailyDrawdownPct}
                    onChange={(e) => setRiskProfile(prev => ({ ...prev, maxDailyDrawdownPct: Number(e.target.value) }))}
                    placeholder="2.0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxConsecutiveLosses" className="text-sm">Max Consecutive Losses</Label>
                  <Input
                    id="maxConsecutiveLosses"
                    type="number"
                    value={riskProfile.maxConsecutiveLosses}
                    onChange={(e) => setRiskProfile(prev => ({ ...prev, maxConsecutiveLosses: Number(e.target.value) }))}
                    placeholder="3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="riskPerTradePct" className="text-sm">Risk Per Trade (%)</Label>
                  <Input
                    id="riskPerTradePct"
                    type="number"
                    step="0.1"
                    value={riskProfile.riskPerTradePct}
                    onChange={(e) => setRiskProfile(prev => ({ ...prev, riskPerTradePct: Number(e.target.value) }))}
                    placeholder="1.0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Risk Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences Section */}
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
              </div>
              <CardDescription className="text-sm">Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="riskAlerts"
                    checked={notificationPrefs.riskAlerts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, riskAlerts: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="riskAlerts" className="text-sm">Risk Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dailyDigest"
                    checked={notificationPrefs.dailyDigest}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, dailyDigest: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="dailyDigest" className="text-sm">Daily Digest</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="weeklyReport"
                    checked={notificationPrefs.weeklyReport}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, weeklyReport: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="weeklyReport" className="text-sm">Weekly Report</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tradeNotifications"
                    checked={notificationPrefs.tradeNotifications}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, tradeNotifications: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="tradeNotifications" className="text-sm">Trade Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="performanceAlerts"
                    checked={notificationPrefs.performanceAlerts}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, performanceAlerts: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="performanceAlerts" className="text-sm">Performance Alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={notificationPrefs.emailNotifications}
                    onChange={(e) => setNotificationPrefs(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="emailNotifications" className="text-sm">Email Notifications</Label>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Broker Connections Section */}
          <BrokerConnectionComponent />

          {/* Data Management Section */}
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-warning" />
                <CardTitle className="text-base sm:text-lg">Data Management</CardTitle>
              </div>
              <CardDescription className="text-sm">Manage your trading data and exports</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="h-12">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" className="h-12 text-destructive border-destructive/20 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm text-warning">
                    <p className="font-medium">Warning:</p>
                    <p>Deleting data is irreversible. Make sure to export your data before proceeding.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 