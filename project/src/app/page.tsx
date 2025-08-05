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
  Clock
} from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">Guardian AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-blue-400 mr-4" />
            <h1 className="text-6xl font-bold text-white">
              Guardian AI
            </h1>
          </div>
          <p className="text-2xl text-gray-300 mb-4">
            Your AI-powered trading companion that helps you overcome emotional biases
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Develop disciplined trading habits through real-time risk management, behavioral pattern recognition, 
            and personalized insights that create your "second self" watching over trading decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 rounded-lg font-semibold transition-colors text-lg flex items-center justify-center">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 text-gray-400 mb-16">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <span>500+ Traders</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>Real-time Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose Guardian AI?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced behavioral analysis and real-time risk management to transform your trading psychology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg mr-4">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Real-Time Risk Management
              </h3>
            </div>
            <p className="text-gray-300 mb-4">
              Get instant warnings and position size recommendations based on your personal risk profile. 
              Our AI monitors your trading patterns and intervenes before emotional decisions.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Instant risk warnings
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Position size calculator
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Overtrading prevention
              </li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-purple-400/50 transition-all">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 p-3 rounded-lg mr-4">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Behavioral Pattern Recognition
              </h3>
            </div>
            <p className="text-gray-300 mb-4">
              Advanced analytics that identify emotional trading zones and psychological biases. 
              Learn your patterns and get personalized coaching to improve discipline.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Emotional zone analysis
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Bias identification
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Pattern learning
              </li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 hover:border-green-400/50 transition-all">
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg mr-4">
                <BarChart3 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Personalized Insights
              </h3>
            </div>
            <p className="text-gray-300 mb-4">
              AI-powered coaching that learns your trading patterns and provides actionable advice. 
              Get daily performance digests and weekly behavioral reports.
            </p>
            <ul className="text-gray-400 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Daily performance digests
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Weekly behavioral reports
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                Goal tracking
              </li>
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How Guardian AI Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Three simple steps to transform your trading psychology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-400">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Trades</h3>
            <p className="text-gray-400">
              Import your trading data via CSV. Our smart system automatically detects formats and maps columns.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-400">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Set Your Risk Profile</h3>
            <p className="text-gray-400">
              Configure your risk tolerance, position sizing rules, and trading goals.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-400">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get AI Insights</h3>
            <p className="text-gray-400">
              Receive real-time risk warnings, behavioral insights, and personalized coaching.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join hundreds of traders who have improved their discipline and reduced emotional trading with Guardian AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/sign-in"
              className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-white font-semibold">Guardian AI</span>
          </div>
          <div className="flex space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}