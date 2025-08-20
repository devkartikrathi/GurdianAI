"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Upload, 
  Settings, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  User,
  Target,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Info
} from 'lucide-react'

interface OnboardingData {
  name: string
  email: string
  experience: string
  totalCapital: string
  riskPerTradePct: string
  maxDailyDrawdownPct: string
  maxConsecutiveLosses: string
}

interface ValidationErrors {
  [key: string]: string
}

const OnboardingStep1 = ({ 
  onNext, 
  data, 
  setData,
  errors
}: { 
  onNext: () => void
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
  errors: ValidationErrors
}) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="text-center mb-6 sm:mb-8">
      <div className="bg-primary/20 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
        <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Welcome to Guardian AI</h2>
      <p className="text-sm sm:text-base text-muted-foreground">Let's set up your profile and get you started</p>
    </div>

    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label htmlFor="name" className="text-sm sm:text-base">Full Name *</Label>
        <Input 
          id="name" 
          placeholder="Enter your full name" 
          value={data.name}
          onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
          className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="Enter your email" 
          value={data.email}
          onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
          className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="experience" className="text-sm sm:text-base">Trading Experience</Label>
        <select 
          className={`w-full p-2 sm:p-3 border rounded-md bg-background mt-1 text-sm sm:text-base ${errors.experience ? 'border-red-500' : 'border-input'}`}
          value={data.experience}
          onChange={(e) => setData(prev => ({ ...prev, experience: e.target.value }))}
        >
          <option value="">Select your experience level</option>
          <option value="beginner">Beginner (0-1 years)</option>
          <option value="intermediate">Intermediate (1-3 years)</option>
          <option value="advanced">Advanced (3+ years)</option>
        </select>
        {errors.experience && <p className="text-sm text-red-500 mt-1">{errors.experience}</p>}
      </div>
    </div>

    <div className="flex justify-end">
      <Button 
        onClick={onNext} 
        className="flex items-center"
        disabled={!data.name.trim() || !data.email.trim()}
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
)

const OnboardingStep2 = ({ 
  onNext, 
  onBack, 
  data, 
  setData,
  errors
}: { 
  onNext: () => void
  onBack: () => void
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
  errors: ValidationErrors
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target className="h-8 w-8 text-accent" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Set Your Risk Profile</h2>
      <p className="text-muted-foreground">Configure your risk tolerance and trading goals</p>
    </div>

    <div className="space-y-4">
      <div>
        <Label htmlFor="capital">Total Trading Capital (₹) *</Label>
        <Input 
          id="capital" 
          type="number" 
          placeholder="e.g., 100000" 
          value={data.totalCapital}
          onChange={(e) => setData(prev => ({ ...prev, totalCapital: e.target.value }))}
          className={errors.totalCapital ? 'border-red-500' : ''}
        />
        {errors.totalCapital && <p className="text-sm text-red-500 mt-1">{errors.totalCapital}</p>}
        <p className="text-xs text-muted-foreground mt-1">Enter your total available capital for trading</p>
      </div>
      <div>
        <Label htmlFor="riskPerTrade">Risk Per Trade (%) *</Label>
        <Input 
          id="riskPerTrade" 
          type="number" 
          step="0.1"
          placeholder="1.0" 
          value={data.riskPerTradePct}
          onChange={(e) => setData(prev => ({ ...prev, riskPerTradePct: e.target.value }))}
          className={errors.riskPerTradePct ? 'border-red-500' : ''}
        />
        {errors.riskPerTradePct && <p className="text-sm text-red-500 mt-1">{errors.riskPerTradePct}</p>}
        <p className="text-xs text-muted-foreground mt-1">Recommended: 1-2% of your capital per trade</p>
      </div>
      <div>
        <Label htmlFor="maxDrawdown">Max Daily Drawdown (%) *</Label>
        <Input 
          id="maxDrawdown" 
          type="number" 
          step="0.1"
          placeholder="5.0" 
          value={data.maxDailyDrawdownPct}
          onChange={(e) => setData(prev => ({ ...prev, maxDailyDrawdownPct: e.target.value }))}
          className={errors.maxDailyDrawdownPct ? 'border-red-500' : ''}
        />
        {errors.maxDailyDrawdownPct && <p className="text-sm text-red-500 mt-1">{errors.maxDailyDrawdownPct}</p>}
        <p className="text-xs text-muted-foreground mt-1">Maximum loss allowed per day (5-20%)</p>
      </div>
      <div>
        <Label htmlFor="maxLosses">Max Consecutive Losses *</Label>
        <Input 
          id="maxLosses" 
          type="number" 
          placeholder="3" 
          value={data.maxConsecutiveLosses}
          onChange={(e) => setData(prev => ({ ...prev, maxConsecutiveLosses: e.target.value }))}
          className={errors.maxConsecutiveLosses ? 'border-red-500' : ''}
        />
        {errors.maxConsecutiveLosses && <p className="text-sm text-red-500 mt-1">{errors.maxConsecutiveLosses}</p>}
        <p className="text-xs text-muted-foreground mt-1">Stop trading after this many consecutive losses</p>
      </div>
    </div>

    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Risk Management Tips</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
            <li>• Never risk more than 2% of your capital on a single trade</li>
            <li>• Set daily loss limits to prevent emotional trading</li>
            <li>• Take breaks after consecutive losses to reset your mindset</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Button 
        onClick={onNext} 
        className="flex items-center"
        disabled={!data.totalCapital || !data.riskPerTradePct || !data.maxDailyDrawdownPct || !data.maxConsecutiveLosses}
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
)

const OnboardingStep3 = ({ 
  onNext, 
  onBack 
}: { 
  onNext: () => void
  onBack: () => void
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="bg-success/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload className="h-8 w-8 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Trades</h2>
      <p className="text-muted-foreground">Import your trading data to get started with analysis</p>
    </div>

    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
      <p className="text-muted-foreground mb-4">
        Drag and drop your trade data CSV file here, or click to browse
      </p>
      <Button variant="outline">Choose File</Button>
      <p className="text-sm text-muted-foreground mt-2">
        Supported formats: CSV, Excel. Max file size: 10MB
      </p>
    </div>

    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">CSV Format Requirements</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Your CSV should include: Date, Symbol, Side (BUY/SELL), Quantity, Price, and optionally P&L.
            We'll automatically detect and map your columns.
          </p>
        </div>
      </div>
    </div>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Button onClick={onNext} className="flex items-center">
        Skip for Now
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
)

const OnboardingStep4 = ({ 
  onComplete, 
  onBack 
}: { 
  onComplete: () => void
  onBack: () => void
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="bg-success/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h2>
      <p className="text-muted-foreground">Your Guardian AI is ready to help you trade better</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your risk profile is configured and ready to provide real-time warnings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-accent" />
            Analytics Ready
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload trades anytime to start getting behavioral insights and performance analytics.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-success" />
            AI Coaching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your AI companion will learn your patterns and provide personalized coaching.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-warning" />
            Customizable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Adjust your settings and preferences anytime from the settings page.
          </p>
        </CardContent>
      </Card>
    </div>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Button onClick={onComplete} className="flex items-center">
        Go to Dashboard
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
)

const steps = [
  {
    id: 1,
    title: "Profile Setup",
    description: "Set up your basic profile information",
    icon: User,
    component: OnboardingStep1
  },
  {
    id: 2,
    title: "Risk Profile",
    description: "Configure your risk tolerance and goals",
    icon: Target,
    component: OnboardingStep2
  },
  {
    id: 3,
    title: "Upload Trades",
    description: "Import your trading data",
    icon: Upload,
    component: OnboardingStep3
  },
  {
    id: 4,
    title: "Complete",
    description: "You're ready to start",
    icon: CheckCircle,
    component: OnboardingStep4
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const router = useRouter()
  const { toast } = useToast()
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    experience: '',
    totalCapital: '',
    riskPerTradePct: '',
    maxDailyDrawdownPct: '',
    maxConsecutiveLosses: ''
  })

  // Load existing user data if available
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/onboarding')
        if (response.ok) {
          const result = await response.json()
          if (result.data.user) {
            setData({
              name: result.data.user.name || '',
              email: result.data.user.email || '',
              experience: result.data.onboarding?.experience || '',
              totalCapital: result.data.user.totalCapital?.toString() || '',
              riskPerTradePct: result.data.user.riskPerTradePct?.toString() || '',
              maxDailyDrawdownPct: result.data.user.maxDailyDrawdownPct?.toString() || '',
              maxConsecutiveLosses: result.data.user.maxConsecutiveLosses?.toString() || ''
            })
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {}

    if (step === 1) {
      if (!data.name.trim()) newErrors.name = 'Name is required'
      if (!data.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    if (step === 2) {
      if (!data.totalCapital || parseFloat(data.totalCapital) <= 0) {
        newErrors.totalCapital = 'Please enter a valid capital amount'
      }
      if (!data.riskPerTradePct || parseFloat(data.riskPerTradePct) <= 0 || parseFloat(data.riskPerTradePct) > 10) {
        newErrors.riskPerTradePct = 'Risk per trade should be between 0.1% and 10%'
      }
      if (!data.maxDailyDrawdownPct || parseFloat(data.maxDailyDrawdownPct) <= 0 || parseFloat(data.maxDailyDrawdownPct) > 50) {
        newErrors.maxDailyDrawdownPct = 'Daily drawdown should be between 0.1% and 50%'
      }
      if (!data.maxConsecutiveLosses || parseInt(data.maxConsecutiveLosses) <= 0 || parseInt(data.maxConsecutiveLosses) > 20) {
        newErrors.maxConsecutiveLosses = 'Max consecutive losses should be between 1 and 20'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    if (currentStep === 2) {
      // Save data after step 2 (risk profile setup)
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save onboarding data')
        }

        toast({
          title: "Profile Saved",
          description: "Your risk profile has been configured successfully!",
        })

        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error('Error saving onboarding data:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save profile",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const currentStepData = steps.find(step => step.id === currentStep)
  const CurrentStepComponent = currentStepData?.component

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">Setup Guardian AI</h1>
            <span className="text-sm text-muted-foreground text-center sm:text-right">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-4 sm:p-6 md:p-8">
            {CurrentStepComponent && (
              <CurrentStepComponent 
                onNext={handleNext}
                onBack={handleBack}
                onComplete={handleComplete}
                data={data}
                setData={setData}
                errors={errors}
              />
            )}
          </CardContent>
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                step.id === currentStep
                  ? 'bg-primary'
                  : step.id < currentStep
                  ? 'bg-success'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-4 sm:p-6 rounded-lg flex items-center gap-3 mx-4">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
              <p className="text-sm sm:text-base text-foreground">Saving your profile...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 