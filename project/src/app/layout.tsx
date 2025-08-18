import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/react'

// Optimized font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Guardian AI - AI-Powered Trading Psychology & Risk Management',
  description: 'Transform your trading with AI-powered behavioral analysis, real-time risk monitoring, and personalized insights. Overcome emotional biases and develop disciplined trading habits.',
  keywords: ['trading psychology', 'AI trading', 'risk management', 'emotional trading', 'trading discipline', 'behavioral analysis', 'trading coach'].join(', '),
  authors: [{ name: 'Guardian AI Team' }],
  creator: 'Guardian AI',
  publisher: 'Guardian AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://guardian-ai.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Guardian AI - AI-Powered Trading Psychology',
    description: 'Transform your trading with AI-powered behavioral analysis and real-time risk management.',
    siteName: 'Guardian AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Guardian AI - AI-Powered Trading Psychology',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guardian AI - AI-Powered Trading Psychology',
    description: 'Transform your trading with AI-powered behavioral analysis and real-time risk management.',
    images: ['/og-image.png'],
    creator: '@GuardianAI',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: 'hsl(217, 91%, 59%)',
          colorBackground: 'hsl(222, 10%, 5%)',
          colorText: 'hsl(0, 0%, 98%)',
          colorInputBackground: 'hsl(215, 25%, 18%)',
          colorInputText: 'hsl(0, 0%, 98%)',
          borderRadius: '8px',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary-hover text-primary-foreground font-semibold transition-all duration-200 active:scale-95',
          card: 'glass-card',
          headerTitle: 'text-foreground font-semibold',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border border-border hover:bg-accent/10 transition-all duration-200',
          formFieldInput: 'bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200',
          footerActionLink: 'text-primary hover:text-primary-hover',
        },
      }}
    >
      <html 
        lang="en" 
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable}`}
      >
        <head>
          <meta name="theme-color" content="hsl(222, 10%, 5%)" />
          <meta name="color-scheme" content="dark light" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="icon" type="image/png" href="/favicon.png" />
        </head>
        <body className={`${inter.className} font-sans antialiased min-h-screen bg-background text-foreground`}>
          <ThemeProvider>
            {/* Background Elements - Fixed and optimized */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              {/* Animated Grid Background */}
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
              
              {/* Floating Orbs - Optimized with CSS transforms */}
              <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success/5 rounded-full blur-3xl animate-bounce-subtle" style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.5s' }} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
              <main className="flex-1">
                {children}
              </main>
              
              <Toaster />
              <Analytics />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}