"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUserSync } from '@/hooks/useUserSync'
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
  Zap
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

export default function SettingsPage() {
  const { user, loading: userLoading, error: userError, refreshUser } = useUserSync()
  
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

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRisk, setIsSavingRisk] = useState(false)
  const [isLoadingRisk, setIsLoadingRisk] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)

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
        // Refresh user data
        await refreshUser()
        // Hide success message after 3 seconds
        setTimeout(() => setProfileSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        console.error('Error saving user profile:', error)
      }
    } catch (error) {
      console.error('Error saving user profile:', error)
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
        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const error = await response.json()
        console.error('Error saving risk profile:', error)
      }
    } catch (error) {
      console.error('Error saving risk profile:', error)
    } finally {
      setIsSavingRisk(false)
    }
  }

  if (userLoading || isLoadingRisk) {
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                <Label htmlFor="totalCapital">Total Capital</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totalCapital"
                    type="number"
                    value={riskProfile.totalCapital}
                    onChange={(e) => handleRiskProfileChange('totalCapital', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxDailyDrawdown">Max Daily Drawdown (%)</Label>
                <Input
                  id="maxDailyDrawdown"
                  type="number"
                  step="0.1"
                  value={riskProfile.maxDailyDrawdownPct}
                  onChange={(e) => handleRiskProfileChange('maxDailyDrawdownPct', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxConsecutiveLosses">Max Consecutive Losses</Label>
                <Input
                  id="maxConsecutiveLosses"
                  type="number"
                  value={riskProfile.maxConsecutiveLosses}
                  onChange={(e) => handleRiskProfileChange('maxConsecutiveLosses', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
                <Input
                  id="riskPerTrade"
                  type="number"
                  step="0.1"
                  value={riskProfile.riskPerTradePct}
                  onChange={(e) => handleRiskProfileChange('riskPerTradePct', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={handleSaveRiskProfile}
              disabled={isSavingRisk}
            >
              {isSavingRisk ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                <input type="checkbox" id="riskAlerts" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="dailyDigest" className="font-medium">Daily Performance Digest</Label>
                  <p className="text-xs text-muted-foreground">Daily summary of your trading performance</p>
                </div>
                <input type="checkbox" id="dailyDigest" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <Label htmlFor="weeklyReport" className="font-medium">Weekly Analytics Report</Label>
                  <p className="text-xs text-muted-foreground">Detailed weekly performance analysis</p>
                </div>
                <input type="checkbox" id="weeklyReport" className="rounded" />
              </div>
            </div>
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
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Export Trading Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-danger hover:text-danger">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <CardTitle>Advanced Settings</CardTitle>
          </div>
          <CardDescription>
            Advanced configuration options for power users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <div>
              <Label htmlFor="apiKey">Zerodha API Key</Label>
              <Input id="apiKey" type="password" placeholder="Enter your Zerodha API key" />
            </div>
            <div>
              <Label htmlFor="apiSecret">Zerodha API Secret</Label>
              <Input id="apiSecret" type="password" placeholder="Enter your Zerodha API secret" />
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Connect Zerodha Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 