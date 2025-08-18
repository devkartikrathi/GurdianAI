import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
// NAVIGATION COMPONENT
// ============================================================================

function Navigation() {
  return (
    <nav className="glass-card sticky top-0 z-50 backdrop-blur-2xl border-b border-primary/10 mb-0">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative bg-background/90 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient-primary">Guardian AI</span>
              <span className="text-xs text-muted-foreground font-mono">TRADING PSYCHOLOGY</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/sign-in" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ============================================================================
// DASHBOARD PREVIEW COMPONENT
// ============================================================================

function DashboardPreview() {
  return (
    <div className="relative glass-card p-6 rounded-2xl hover-lift">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
          <span className="text-sm font-mono text-muted-foreground">LIVE MONITORING</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Risk Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Current Risk Level</span>
          <RiskIndicator level="low" label="Safe" />
        </div>
        <TradingChart />
      </div>

      {/* Trading Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Today's P&L</span>
          </div>
          <div className="text-lg font-bold text-success">+₹2,340</div>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Trades</span>
          </div>
          <div className="text-lg font-bold text-foreground">8</div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-4 rounded-lg border-l-4" style={{ borderLeftColor: 'hsl(var(--accent))' }}>
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-accent mt-0.5 animate-pulse" />
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
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/5 rounded-full blur-xl animate-pulse"></div>
    </div>
  )
}

// ============================================================================
// HERO SECTION COMPONENT
// ============================================================================

function HeroSection() {
  return (
    <section className="section relative overflow-hidden">
      <div className="content-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI-Powered Trading Psychology</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gradient-primary">Guardian AI</span>
                <br />
                <span className="text-foreground">Trading Coach</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Transform your trading psychology with advanced AI behavioral analysis. 
                Real-time risk monitoring, emotional bias detection, and personalized insights 
                that act as your <span className="text-accent font-semibold">"second self"</span> watching over every decision.
              </p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  <AnimatedCounter end={1000} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Active Traders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  <AnimatedCounter end={97} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  <AnimatedCounter end={24} suffix="/7" />
                </div>
                <div className="text-sm text-muted-foreground">AI Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  <AnimatedCounter end={2} suffix="min" />
                </div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up" className="btn-primary text-base px-8 py-4 shadow-glow hover-lift">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="btn-secondary text-base px-8 py-4 hover-lift group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full border-2 border-background"></div>
                  ))}
                </div>
                <span>Trusted by 1000+ traders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
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
  
  return (
    <div className="trading-card group">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-current to-current rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur-xl"
             style={{ 
               color: feature.color === 'primary' ? 'hsl(var(--primary))' : 
                      feature.color === 'accent' ? 'hsl(var(--accent))' : 
                      'hsl(var(--success))'
             }}></div>
        <div className="relative p-4 rounded-2xl border w-fit"
             style={{ 
               backgroundColor: feature.color === 'primary' ? 'hsl(var(--primary) / 0.1)' : 
                               feature.color === 'accent' ? 'hsl(var(--accent) / 0.1)' : 
                               'hsl(var(--success) / 0.1)',
               borderColor: feature.color === 'primary' ? 'hsl(var(--primary) / 0.2)' : 
                           feature.color === 'accent' ? 'hsl(var(--accent) / 0.2)' : 
                           'hsl(var(--success) / 0.2)'
             }}>
          <Icon className="h-8 w-8" 
                style={{ 
                  color: feature.color === 'primary' ? 'hsl(var(--primary))' : 
                         feature.color === 'accent' ? 'hsl(var(--accent))' : 
                         'hsl(var(--success))'
                }} />
        </div>
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
        {feature.title}
      </h3>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        {feature.description}
      </p>
      <div className="space-y-3">
        {feature.benefits.map((benefit: string) => (
          <div key={benefit} className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
            <span>{benefit}</span>
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
    <section id="features" className="section relative">
      <div className="content-container">
        <div className="section-header">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CircuitBoard className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Advanced Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Next-Gen Trading <span className="text-gradient-primary">Intelligence</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
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
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Processing trades...</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-primary rounded-full animate-pulse" 
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
      <div className="glass-card p-4 rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pattern Recognition</span>
            <span className="text-success">97%</span>
          </div>
          <div className="w-full rounded-full h-1" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <div className="h-1 rounded-full w-[97%] animate-pulse" style={{ backgroundColor: 'hsl(var(--success))' }}></div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="glass-card p-4 rounded-xl border-l-4" style={{ borderLeftColor: 'hsl(var(--danger))' }}>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--danger))' }}></div>
        <span className="font-medium" style={{ color: 'hsl(var(--danger))' }}>Risk Alert Active</span>
      </div>
    </div>
  )
}

function StepCard({ step, index }: { step: any, index: number }) {
  const Icon = step.icon
  
  return (
    <div className="relative z-10">
      <div className="text-center group">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ 
                 backgroundColor: step.color === 'primary' ? 'hsl(var(--primary) / 0.2)' : 
                                 step.color === 'accent' ? 'hsl(var(--accent) / 0.2)' : 
                                 'hsl(var(--success) / 0.2)'
               }}></div>
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto hover-lift shadow-glow"
               style={{ 
                 background: step.color === 'primary' ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' : 
                            step.color === 'accent' ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))' : 
                            'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.8))'
               }}>
            <span className="text-2xl font-bold text-white">{step.number}</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-bounce-subtle"
               style={{ backgroundColor: 'hsl(var(--accent) / 0.2)' }}>
            <Icon className="h-4 w-4 m-1" style={{ color: 'hsl(var(--accent))' }} />
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">{step.title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
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
    <section id="how-it-works" className="section relative">
      <div className="content-container">
        <div className="section-header">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Layers className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How <span className="text-gradient-primary">Guardian AI</span> Works
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Three intelligent steps to transform your trading psychology and achieve consistent results
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12 relative">
            {/* Connection Lines - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transform -translate-y-1/2 z-0"></div>
            
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
    <section className="section relative">
      <div className="content-container">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Zap className="h-6 w-6 text-accent animate-pulse" />
              <span className="text-sm font-medium text-accent uppercase tracking-wider">Ready to Transform</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8">
              Start Your <span className="text-gradient-primary">AI Journey</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              Join thousands of traders who have transformed their psychology and achieved 
              consistent results with Guardian AI. Your future self will thank you.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link
                href="/sign-up"
                className="btn-primary text-lg md:text-xl px-10 py-5 rounded-2xl font-bold shadow-glow hover-lift group"
              >
                Start Free Trial
                <ArrowUpRight className="ml-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="btn-secondary text-lg md:text-xl px-10 py-5 rounded-2xl font-bold hover-lift group"
              >
                <Eye className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-muted-foreground">
              {trustIndicators.map((indicator, index) => {
                const Icon = indicator.icon
                return (
                  <div key={indicator.text} className="flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
                    <span className="text-sm">{indicator.text}</span>
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
    <footer className="border-t border-border/50 py-12 relative">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-foreground">Guardian AI</div>
                <div className="text-xs text-muted-foreground">Trading Psychology</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advanced AI-powered trading psychology platform helping traders overcome emotional biases and achieve consistent results.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <a key={link.text} href={link.href} className="block hover:text-primary transition-colors">
                    {link.text}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 Guardian AI. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}