"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
  TrendingUp
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

const OnboardingStep1 = ({ 
  onNext, 
  data, 
  setData 
}: { 
  onNext: () => void
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <User className="h-8 w-8 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Guardian AI</h2>
      <p className="text-muted-foreground">Let's set up your profile and get you started</p>
    </div>

    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          placeholder="Enter your full name" 
          value={data.name}
          onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="Enter your email" 
          value={data.email}
          onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="experience">Trading Experience</Label>
        <select 
          className="w-full p-3 border border-input rounded-md bg-background"
          value={data.experience}
          onChange={(e) => setData(prev => ({ ...prev, experience: e.target.value }))}
        >
          <option value="">Select your experience level</option>
          <option value="beginner">Beginner (0-1 years)</option>
          <option value="intermediate">Intermediate (1-3 years)</option>
          <option value="advanced">Advanced (3+ years)</option>
        </select>
      </div>
    </div>

    <div className="flex justify-end">
      <Button 
        onClick={onNext} 
        className="flex items-center"
        disabled={!data.name || !data.email}
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
  setData 
}: { 
  onNext: () => void
  onBack: () => void
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target className="h-8 w-8 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Set Your Risk Profile</h2>
      <p className="text-muted-foreground">Configure your risk tolerance and trading goals</p>
    </div>

    <div className="space-y-4">
      <div>
        <Label htmlFor="capital">Total Trading Capital</Label>
        <Input 
          id="capital" 
          type="number" 
          placeholder="Enter your total capital" 
          value={data.totalCapital}
          onChange={(e) => setData(prev => ({ ...prev, totalCapital: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
        <Input 
          id="riskPerTrade" 
          type="number" 
          placeholder="1-5%" 
          value={data.riskPerTradePct}
          onChange={(e) => setData(prev => ({ ...prev, riskPerTradePct: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="maxDrawdown">Max Daily Drawdown (%)</Label>
        <Input 
          id="maxDrawdown" 
          type="number" 
          placeholder="5-20%" 
          value={data.maxDailyDrawdownPct}
          onChange={(e) => setData(prev => ({ ...prev, maxDailyDrawdownPct: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="maxLosses">Max Consecutive Losses</Label>
        <Input 
          id="maxLosses" 
          type="number" 
          placeholder="3-10" 
          value={data.maxConsecutiveLosses}
          onChange={(e) => setData(prev => ({ ...prev, maxConsecutiveLosses: e.target.value }))}
        />
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
        disabled={!data.totalCapital || !data.riskPerTradePct}
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
      <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload className="h-8 w-8 text-green-400" />
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
      <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-8 w-8 text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You're All Set!</h2>
      <p className="text-muted-foreground">Your Guardian AI is ready to help you trade better</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
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
            <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
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
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
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
            <Settings className="h-5 w-5 mr-2 text-yellow-500" />
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
  const router = useRouter()
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    experience: '',
    totalCapital: '',
    riskPerTradePct: '',
    maxDailyDrawdownPct: '',
    maxConsecutiveLosses: ''
  })

  const handleNext = async () => {
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
          throw new Error('Failed to save onboarding data')
        }

        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error('Error saving onboarding data:', error)
        // You might want to show an error message to the user
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
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const currentStepData = steps.find(step => step.id === currentStep)
  const CurrentStepComponent = currentStepData?.component

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">Setup Guardian AI</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {CurrentStepComponent && (
              <CurrentStepComponent 
                onNext={handleNext}
                onBack={handleBack}
                onComplete={handleComplete}
                data={data}
                setData={setData}
              />
            )}
          </CardContent>
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                step.id === currentStep
                  ? 'bg-primary'
                  : step.id < currentStep
                  ? 'bg-green-500'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg">
              <p className="text-foreground">Saving your profile...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 