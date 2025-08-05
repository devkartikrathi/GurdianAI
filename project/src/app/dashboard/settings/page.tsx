"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserButton } from '@clerk/nextjs'
import { Separator } from '@/components/ui/separator'
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
  CheckCircle
} from 'lucide-react'

interface RiskProfile {
  totalCapital: number
  maxDailyDrawdownPct: number
  maxConsecutiveLosses: number
  riskPerTradePct: number
}

export default function SettingsPage() {
  const [riskProfile, setRiskProfile] = useState<RiskProfile>({
    totalCapital: 100000,
    maxDailyDrawdownPct: 2.0,
    maxConsecutiveLosses: 3,
    riskPerTradePct: 1.0
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

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
        setIsLoading(false)
      }
    }

    loadRiskProfile()
  }, [])

  const handleRiskProfileChange = (field: keyof RiskProfile, value: number) => {
    setRiskProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveRiskProfile = async () => {
    setIsSaving(true)
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
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Manage your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" defaultValue="John Doe" />
              </div>
              <div className="flex-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" defaultValue="john@example.com" disabled />
              </div>
            </div>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Risk Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Profile
            </CardTitle>
            <CardDescription>
              Configure your trading risk parameters for Guardian AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              disabled={isSaving}
            >
              {isSaving ? (
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
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Risk profile saved successfully!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="riskAlerts">Risk Alerts</Label>
                <input type="checkbox" id="riskAlerts" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dailyDigest">Daily Performance Digest</Label>
                <input type="checkbox" id="dailyDigest" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weeklyReport">Weekly Analytics Report</Label>
                <input type="checkbox" id="weeklyReport" className="rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Manage your trading data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Export Trading Data
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Advanced configuration options for power users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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