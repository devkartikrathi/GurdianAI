import { SignUp } from '@clerk/nextjs'
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex flex-col">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">Guardian AI</span>
          </div>
        </div>
      </nav>

      {/* Sign Up Section - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column - Sign Up Form */}
            <div>
              <div className="text-center md:text-left mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Start Your Trading Journey</h1>
                <p className="text-gray-400">Join Guardian AI and transform your trading psychology</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
                <SignUp 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none",
                      headerTitle: "text-white text-2xl font-bold",
                      headerSubtitle: "text-gray-400",
                      formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors",
                      formFieldInput: "bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:border-blue-400 focus:ring-blue-400",
                      formFieldLabel: "text-white font-medium",
                      dividerLine: "bg-white/20",
                      dividerText: "text-gray-400",
                      socialButtonsBlockButton: "bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors",
                      socialButtonsBlockButtonText: "text-white",
                      formFieldLabelRow: "text-white",
                      formFieldRow: "mb-4",
                      formResendCodeLink: "text-blue-400 hover:text-blue-300",
                      identityPreviewText: "text-white",
                      identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
                      formFieldAction: "text-blue-400 hover:text-blue-300",
                      footer: "text-gray-400",
                      footerAction: "text-gray-400",
                      footerActionLink: "text-blue-400 hover:text-blue-300"
                    }
                  }}
                />
              </div>

              <div className="text-center md:text-left mt-8">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Column - Benefits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">What You'll Get</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Free Trial</h3>
                    <p className="text-gray-400">Start with a 14-day free trial. No credit card required.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Instant Setup</h3>
                    <p className="text-gray-400">Upload your trades and get insights within minutes.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Insights</h3>
                    <p className="text-gray-400">Get personalized coaching and behavioral analysis.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Real-time Monitoring</h3>
                    <p className="text-gray-400">24/7 risk monitoring and instant alerts.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                <h4 className="text-white font-semibold mb-2">🎯 Perfect for:</h4>
                <ul className="text-gray-400 space-y-1 text-sm">
                  <li>• Individual retail traders</li>
                  <li>• Traders seeking discipline improvement</li>
                  <li>• Anyone wanting to reduce emotional trading</li>
                  <li>• Traders looking for behavioral analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 