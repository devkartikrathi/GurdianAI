import { SignUp } from '@clerk/nextjs'
import { Shield, ArrowLeft, CheckCircle, Sparkles, Bot, Gauge, Database, Zap, Users, Clock } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 110%)'
          }}
        />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-bounce-subtle" style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.5s' }} />
      </div>

      {/* Navigation */}
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
            
            <Link href="/" className="btn-ghost group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Sign Up Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Sign Up Form */}
            <div>
              <div className="text-center lg:text-left mb-8">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Start Your Journey</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Join <span className="text-gradient-primary">Guardian AI</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Transform your trading psychology with AI-powered behavioral analysis and real-time risk monitoring
                </p>
              </div>
              
              <div className="glass-card p-8 rounded-2xl hover-lift">
                <SignUp 
                  signInUrl="/sign-in"
                  appearance={{
                    baseTheme: undefined,
                    variables: {
                      colorPrimary: 'hsl(217, 91%, 59%)',
                      colorBackground: 'transparent',
                      colorText: 'hsl(0, 0%, 98%)',
                      colorInputBackground: 'hsl(215, 25%, 18%)',
                      colorInputText: 'hsl(0, 0%, 98%)',
                      borderRadius: '8px',
                    },
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none",
                      headerTitle: "text-foreground text-2xl font-bold",
                      headerSubtitle: "text-muted-foreground",
                      formButtonPrimary: "btn-primary w-full",
                      formFieldInput: "bg-input border-border text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200",
                      formFieldLabel: "text-foreground font-medium",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground",
                      socialButtonsBlockButton: "border border-border hover:bg-accent/10 transition-all duration-200",
                      socialButtonsBlockButtonText: "text-foreground",
                      formFieldLabelRow: "text-foreground",
                      formFieldRow: "mb-4",
                      formResendCodeLink: "text-primary hover:text-primary/80",
                      identityPreviewText: "text-foreground",
                      identityPreviewEditButton: "text-primary hover:text-primary/80",
                      formFieldAction: "text-primary hover:text-primary/80",
                      footer: "text-muted-foreground",
                      footerAction: "text-muted-foreground",
                      footerActionLink: "text-primary hover:text-primary/80"
                    }
                  }}
                />
              </div>

              <div className="text-center lg:text-left mt-8">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Column - Benefits */}
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">What You'll Get</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Free Trial</h3>
                      <p className="text-muted-foreground">Start with a 14-day free trial. No credit card required.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Bot className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Instant Setup</h3>
                      <p className="text-muted-foreground">Upload your trades and get insights within minutes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Database className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Insights</h3>
                      <p className="text-muted-foreground">Get personalized coaching and behavioral analysis.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Gauge className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Monitoring</h3>
                      <p className="text-muted-foreground">24/7 risk monitoring and instant alerts.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
                <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Perfect for:
                </h4>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Individual retail traders
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Traders seeking discipline improvement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Anyone wanting to reduce emotional trading
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Traders looking for behavioral analysis
                  </li>
                </ul>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary mb-1">1000+</div>
                  <div className="text-xs text-muted-foreground">Active Traders</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-success mb-1">97%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-accent mb-1">24/7</div>
                  <div className="text-xs text-muted-foreground">AI Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 