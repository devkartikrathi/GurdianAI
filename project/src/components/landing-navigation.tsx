"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react'

export function LandingNavigation() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    
    // Apply theme to document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])



  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // Update document and localStorage
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-300/30 dark:border-blue-600/30 backdrop-blur-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/90 dark:to-indigo-950/90 shadow-lg">
      <div className="container">
        <div className="flex items-center justify-center py-3 sm:py-4">
          {/* Left Section - Logo/Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 group">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative bg-white/90 dark:bg-gray-800/90 p-1.5 sm:p-2 rounded-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100">Guardian AI</span>
                <span className="text-xs text-blue-700 dark:text-blue-300 font-mono hidden sm:block">TRADING PSYCHOLOGY</span>
              </div>
            </Link>
          </div>
          
          {/* Center Section - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12 text-sm mx-auto">
            <a href="#features" className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors font-medium">How It Works</a>
            <a href="#pricing" className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors font-medium">Pricing</a>
          </div>
          
          {/* Right Section - Action Buttons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-blue-300/50 dark:border-blue-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-all duration-200"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </button>
            
            <Link href="/sign-in" className="inline-flex items-center justify-center text-sm sm:text-base px-6 py-3 rounded-xl border border-blue-300/50 dark:border-blue-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-all duration-200 font-medium">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center text-sm sm:text-base px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-400 dark:to-purple-500 dark:hover:from-blue-500 dark:hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
