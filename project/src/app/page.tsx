import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LandingNavigation } from '@/components/landing-navigation'
import { 
  Shield,
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Clock,
  Eye,
  Activity,
  Cpu,
  LineChart,
  PieChart,
  Timer,
  Star,
  Sparkles,
  Bot,
  Gauge,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CircuitBoard,
  Database,
  Layers
} from 'lucide-react'

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }: {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}) {
  return (
    <span className="font-mono font-bold">
      {prefix}
      <span>{end.toLocaleString()}</span>
      {suffix}
    </span>
  )
}

function TradingChart({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg width="100%" height="120" viewBox="0 0 400 120" className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217, 91%, 59%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(45, 90%, 55%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(142, 76%, 45%)" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 91%, 59%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(217, 91%, 59%)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path 
          d="M0,80 Q50,40 100,60 T200,45 T300,35 T400,25" 
          stroke="url(#chartGradient)" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M0,80 Q50,40 100,60 T200,45 T300,35 T400,25 L400,120 L0,120 Z" 
          fill="url(#chartFill)"
        />
      </svg>
    </div>
  )
}

function RiskIndicator({ level, label }: { level: 'low' | 'medium' | 'high', label: string }) {
  const levelClass = level === 'low' ? 'risk-low' : level === 'medium' ? 'risk-medium' : 'risk-high'
  const dotColor = level === 'low' ? 'bg-success' : level === 'medium' ? 'bg-warning' : 'bg-danger'
  
  return (
    <div className={`risk-indicator ${levelClass}`}>
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      {label}
    </div>
  )
}



// ============================================================================
// DASHBOARD PREVIEW COMPONENT
// ============================================================================

function DashboardPreview() {
  return (
    <div className="relative glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl hover-lift">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-mono text-muted-foreground">LIVE MONITORING</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Risk Status */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-sm font-medium">Current Risk Level</span>
          <RiskIndicator level="low" label="Safe" />
        </div>
        <TradingChart />
      </div>

      {/* Trading Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
            <span className="text-xs text-muted-foreground">Today's P&L</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-success">+₹2,340</div>
        </div>
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Trades</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-foreground">8</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-3 sm:p-4 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--accent))' }}>
        <div className="flex items-start gap-2 sm:gap-3">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-accent mt-0.5 animate-pulse" />
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Guardian AI Insight</div>
            <div className="text-xs text-muted-foreground">
              "Your win rate increases by 23% when trading between 10-11 AM. 
              Consider focusing activity during this window."
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 bg-accent/5 rounded-full blur-xl animate-pulse"></div>
    </div>
  )
}

// ============================================================================
// HERO SECTION COMPONENT
// ============================================================================

function HeroSection() {
  return (
    <section className="section relative overflow-hidden bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/30">
      <div className="content-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 rounded-full">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Trading Psychology</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-blue-900 dark:text-blue-100">Guardian AI</span>
                <br />
                <span className="text-gray-800 dark:text-gray-200">Trading Coach</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                Transform your trading psychology with advanced AI behavioral analysis. 
                Real-time risk monitoring, emotional bias detection, and personalized insights 
                that act as your <span className="text-indigo-600 dark:text-indigo-400 font-semibold">"second self"</span> watching over every decision.
              </p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/50 dark:to-indigo-900/50 border border-blue-200/30 dark:border-blue-600/30">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  <AnimatedCounter end={1000} suffix="+" />
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Active Traders</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/50 dark:to-emerald-900/50 border border-green-200/30 dark:border-green-600/30">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  <AnimatedCounter end={97} suffix="%" />
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Success Rate</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-200/30 dark:border-purple-600/30">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  <AnimatedCounter end={24} suffix="/7" />
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">AI Monitoring</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-900/50 dark:to-teal-900/50 border border-cyan-200/30 dark:border-cyan-600/30">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  <AnimatedCounter end={2} suffix="min" />
                </div>
                <div className="text-sm text-cyan-700 dark:text-cyan-300">Setup Time</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up" className="inline-flex items-center justify-center text-base px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <button className="inline-flex items-center justify-center text-base px-6 py-3 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group font-semibold">
                <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  ))}
                </div>
                <span>Trusted by 1000+ traders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span>4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Dashboard Preview */}
          <div>
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES SECTION COMPONENT
// ============================================================================

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  const Icon = feature.icon
  
  // Define color schemes for each feature type
  const colorSchemes = {
    primary: {
      bg: 'from-blue-50/50 to-indigo-50/50 dark:from-blue-900/50 dark:to-indigo-900/50',
      border: 'border-blue-200/30 dark:border-blue-600/30',
      iconBg: 'bg-blue-500/10 dark:bg-blue-400/10',
      iconBorder: 'border-blue-500/20 dark:border-blue-400/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100',
      textColor: 'text-blue-700 dark:text-blue-300',
      benefitColor: 'bg-blue-500 dark:bg-blue-400'
    },
    accent: {
      bg: 'from-purple-50/50 to-pink-50/50 dark:from-purple-900/50 dark:to-pink-900/50',
      border: 'border-purple-200/30 dark:border-purple-600/30',
      iconBg: 'bg-purple-500/10 dark:bg-purple-400/10',
      iconBorder: 'border-purple-500/20 dark:border-purple-400/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      titleColor: 'text-purple-900 dark:text-purple-100',
      textColor: 'text-purple-700 dark:text-purple-300',
      benefitColor: 'bg-purple-500 dark:bg-purple-400'
    },
    success: {
      bg: 'from-green-50/50 to-emerald-50/50 dark:from-green-900/50 dark:to-emerald-900/50',
      border: 'border-green-200/30 dark:border-green-600/30',
      iconBg: 'bg-green-500/10 dark:bg-green-400/10',
      iconBorder: 'border-green-500/20 dark:border-green-400/20',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-100',
      textColor: 'text-green-700 dark:text-green-300',
      benefitColor: 'bg-green-500 dark:bg-green-400'
    }
  }
  
  const scheme = colorSchemes[feature.color as keyof typeof colorSchemes]
  
  return (
    <div className={`p-6 rounded-xl bg-gradient-to-br ${scheme.bg} border ${scheme.border} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-current to-current rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur-xl"
             style={{ color: scheme.iconColor }}></div>
        <div className={`relative p-4 rounded-2xl border w-fit ${scheme.iconBg} ${scheme.iconBorder}`}>
          <Icon className={`h-8 w-8 ${scheme.iconColor}`} />
        </div>
      </div>
      <h3 className={`text-xl md:text-2xl font-bold ${scheme.titleColor} mb-4`}>
        {feature.title}
      </h3>
      <p className={`${scheme.textColor} mb-6 leading-relaxed`}>
        {feature.description}
      </p>
      <div className="space-y-3">
        {feature.benefits.map((benefit: string) => (
          <div key={benefit} className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${scheme.benefitColor}`}></div>
            <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Gauge,
      title: "Real-Time Risk Engine",
      description: "Advanced neural networks analyze your trading patterns in milliseconds, providing instant risk assessments and position size recommendations before emotional decisions take over.",
      benefits: [
        "Sub-100ms risk calculation",
        "Dynamic position sizing",
        "Emotional state detection"
      ],
      color: "primary"
    },
    {
      icon: Brain,
      title: "Behavioral Pattern AI",
      description: "Machine learning algorithms identify subtle behavioral patterns, emotional triggers, and psychological biases that impact your trading decisions, learning your unique psychology over time.",
      benefits: [
        "Emotional zone mapping",
        "Bias detection algorithms", 
        "Personalized coaching insights"
      ],
      color: "accent"
    },
    {
      icon: Database,
      title: "Intelligent Analytics",
      description: "Advanced analytics engine processes thousands of data points to generate personalized insights, performance predictions, and strategic recommendations tailored to your unique trading style.",
      benefits: [
        "Predictive performance modeling",
        "Custom dashboard analytics",
        "Automated reporting system"
      ],
      color: "success"
    }
  ]

  return (
    <section id="features" className="section relative bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/30 dark:to-emerald-950/30">
      <div className="content-container">
        <div className="section-header">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CircuitBoard className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">Advanced Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Next-Gen Trading <span className="text-green-700 dark:text-green-300">Intelligence</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Cutting-edge AI technology that understands your trading psychology better than you do
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS SECTION COMPONENT
// ============================================================================

function StepIndicator({ step }: { step: any }) {
  if (step.number === 1) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/50 dark:to-indigo-900/50 border border-blue-200/30 dark:border-blue-600/30 shadow-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700 dark:text-blue-300">Processing trades...</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" 
                style={{ animationDelay: `${i * 100}ms` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (step.number === 2) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-200/30 dark:border-purple-600/30 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-700 dark:text-purple-300">Pattern Recognition</span>
            <span className="text-green-600 dark:text-green-400">97%</span>
          </div>
          <div className="w-full rounded-full h-1 bg-gray-200 dark:bg-gray-700">
            <div className="h-1 rounded-full w-[97%] animate-pulse bg-green-500 dark:bg-green-400"></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200/30 dark:border-green-600/30 shadow-lg border-l-4 border-l-green-500 dark:border-l-green-400">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full animate-pulse bg-green-500 dark:bg-green-400"></div>
        <span className="font-medium text-green-700 dark:text-green-300">Risk Alert Active</span>
      </div>
    </div>
  )
}

function StepCard({ step, index }: { step: any, index: number }) {
  const Icon = step.icon
  
  // Define color schemes for each step type
  const colorSchemes = {
    primary: {
      bg: 'from-blue-500 to-indigo-500',
      blur: 'bg-blue-500/20 dark:bg-blue-400/20',
      iconBg: 'bg-indigo-500/20 dark:bg-indigo-400/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      titleColor: 'text-blue-900 dark:text-blue-100',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    accent: {
      bg: 'from-purple-500 to-pink-500',
      blur: 'bg-purple-500/20 dark:bg-purple-400/20',
      iconBg: 'bg-pink-500/20 dark:bg-pink-400/20',
      iconColor: 'text-pink-600 dark:text-pink-400',
      titleColor: 'text-purple-900 dark:text-purple-100',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    success: {
      bg: 'from-green-500 to-emerald-500',
      blur: 'bg-green-500/20 dark:bg-green-400/20',
      iconBg: 'bg-emerald-500/20 dark:bg-emerald-400/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      titleColor: 'text-green-900 dark:text-green-100',
      textColor: 'text-green-700 dark:text-green-300'
    }
  }
  
  const scheme = colorSchemes[step.color as keyof typeof colorSchemes]
  
  return (
    <div className="relative z-10">
      <div className="text-center group">
        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${scheme.blur}`}></div>
          <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto hover:-translate-y-2 shadow-lg transition-all duration-300 bg-gradient-to-br ${scheme.bg}`}>
            <span className="text-2xl font-bold text-white">{step.number}</span>
          </div>
          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full animate-bounce-subtle ${scheme.iconBg}`}>
            <Icon className={`h-4 w-4 m-1 ${scheme.iconColor}`} />
          </div>
        </div>
        <h3 className={`text-xl md:text-2xl font-bold ${scheme.titleColor} mb-4`}>{step.title}</h3>
        <p className={`${scheme.textColor} leading-relaxed mb-6`}>
          {step.description}
        </p>
        <StepIndicator step={step} />
      </div>
    </div>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Connect Your Data",
      description: "Upload your trading history via smart CSV import or connect directly to Zerodha. Our AI instantly analyzes your patterns and creates your behavioral baseline.",
      icon: Sparkles,
      color: "primary"
    },
    {
      number: 2, 
      title: "AI Learning Phase",
      description: "Guardian AI studies your unique psychology, identifies emotional triggers, and builds personalized risk models that understand your trading behavior better than you do.",
      icon: Bot,
      color: "accent"
    },
    {
      number: 3,
      title: "Real-Time Guardian", 
      description: "Get instant risk warnings, position size recommendations, and behavioral insights as you trade. Your AI guardian prevents emotional decisions before they happen.",
      icon: AlertTriangle,
      color: "success"
    }
  ]

  return (
    <section id="how-it-works" className="section relative bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/30 dark:to-pink-950/30">
      <div className="content-container">
        <div className="section-header">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider">Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            How <span className="text-purple-700 dark:text-purple-300">Guardian AI</span> Works
          </h2>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Three intelligent steps to transform your trading psychology and achieve consistent results
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 relative">
            {/* Connection Lines - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent transform -translate-y-1/2 z-0"></div>
            
            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SOCIAL PROOF SECTION COMPONENT
// ============================================================================

function TestimonialCard() {
  return (
    <div className="relative">
      <div className="text-lg md:text-xl text-muted-foreground italic mb-6 leading-relaxed">
        "Guardian AI completely transformed my trading psychology. The real-time risk warnings 
        prevented me from making emotional decisions that would have cost me thousands. 
        It's like having a professional trading coach with me 24/7."
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
          <span className="text-white font-bold">RK</span>
        </div>
        <div className="text-left">
          <div className="font-semibold text-foreground">Rahul Kumar</div>
          <div className="text-sm text-muted-foreground">Full-time Trader, Mumbai</div>
        </div>
      </div>
    </div>
  )
}

function SocialProofSection() {
  const stats = [
    { value: 1247, label: "Active Users", color: "primary" },
    { value: 89, suffix: "%", label: "Improved Discipline", color: "success" },
    { value: 73, suffix: "%", label: "Reduced Losses", color: "accent" },
    { value: 24, suffix: "/7", label: "AI Monitoring", color: "primary" }
  ]

  return (
    <section className="section relative">
      <div className="content-container">
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Trusted Globally</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
              Join <span className="text-gradient-primary">1000+</span> Successful Traders
            </h2>
            
            <div className="stats-grid mb-12">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold mb-2" 
                       style={{ 
                         color: stat.color === 'primary' ? 'hsl(var(--primary))' : 
                               stat.color === 'success' ? 'hsl(var(--success))' : 
                               'hsl(var(--accent))'
                       }}>
                    <AnimatedCounter end={stat.value} suffix={stat.suffix || ""} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <TestimonialCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA SECTION COMPONENT
// ============================================================================

function FinalCTASection() {
  const trustIndicators = [
    { icon: Shield, text: "Bank-grade Security" },
    { icon: CheckCircle, text: "No Credit Card Required" },
    { icon: Timer, text: "Setup in 2 Minutes" }
  ]

  return (
    <section className="section relative bg-gradient-to-br from-cyan-50/30 to-teal-50/30 dark:from-cyan-950/30 dark:to-teal-950/30">
      <div className="content-container">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Ready to Transform</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-200 mb-8">
              Start Your <span className="text-cyan-700 dark:text-cyan-300">AI Journey</span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-12 leading-relaxed">
              Join thousands of traders who have transformed their psychology and achieved 
              consistent results with Guardian AI. Your future self will thank you.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center text-lg md:text-xl px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group"
              >
                Start Free Trial
                <ArrowUpRight className="ml-3 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center text-lg md:text-xl px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group"
              >
                <Eye className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              {trustIndicators.map((indicator, index) => {
                const Icon = indicator.icon
                return (
                  <div key={indicator.text} className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-900/50 dark:to-teal-900/50 border border-cyan-200/30 dark:border-cyan-600/30">
                    <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">{indicator.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { text: "Features", href: "#features" },
        { text: "Pricing", href: "#pricing" },
        { text: "Demo", href: "/demo" },
        { text: "API", href: "/api" }
      ]
    },
    {
      title: "Support", 
      links: [
        { text: "Documentation", href: "/docs" },
        { text: "Help Center", href: "/support" },
        { text: "Contact", href: "/contact" },
        { text: "Community", href: "/community" }
      ]
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Terms of Service", href: "/terms" },
        { text: "Security", href: "/security" },
        { text: "Compliance", href: "/compliance" }
      ]
    }
  ]

  return (
    <footer className="border-t border-border/50 py-8 sm:py-12 relative">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-r from-primary to-accent p-1.5 sm:p-2 rounded-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-foreground text-sm sm:text-base">Guardian AI</div>
                <div className="text-xs text-muted-foreground">Trading Psychology</div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Advanced AI-powered trading psychology platform helping traders overcome emotional biases and achieve consistent results.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{section.title}</h4>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <a key={link.text} href={link.href} className="block hover:text-primary transition-colors">
                    {link.text}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © 2024 Guardian AI. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// MAIN HOMEPAGE COMPONENT
// ============================================================================

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50 relative overflow-hidden">
      <LandingNavigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}