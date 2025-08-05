import { SignIn } from '@clerk/nextjs'
import { Shield, ArrowLeft } from 'lucide-react'
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

      {/* Sign In Section - Centered */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to continue your trading journey with Guardian AI</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <SignIn 
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

          <div className="text-center mt-8">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 