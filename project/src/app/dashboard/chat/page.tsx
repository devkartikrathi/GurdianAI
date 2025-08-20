"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUserSync } from '@/hooks/useUserSync'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  Brain,
  Zap,
  BarChart3,
  Target,
  Clock
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    tradeCount?: number
    symbols?: string[]
    timeRange?: string
    insights?: string[]
  }
}

interface SuggestedQuestion {
  question: string
  category: 'analysis' | 'performance' | 'risk' | 'psychology'
  icon: React.ReactNode
}

export default function ChatPage() {
  const { user } = useUserSync()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if user is loaded
  const isUserLoaded = !!user?.id

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      if (isUserLoaded) {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your Guardian AI trading assistant. I can analyze your trading data, provide insights on performance, risk management, and help you understand your trading psychology. 

What would you like to know about your trading?`,
            timestamp: new Date(),
            metadata: {
              insights: ['Welcome to Guardian AI', 'Ready to analyze your trades', 'Ask me anything about your trading']
            }
          }
        ])
      } else {
        setMessages([
          {
            id: 'loading',
            role: 'assistant',
            content: `Hello! I'm your Guardian AI trading assistant. I'm loading your trading data to provide personalized insights. Please wait a moment...`,
            timestamp: new Date(),
            metadata: {
              insights: ['Loading user data', 'Preparing AI assistant', 'Setting up trading context']
            }
          }
        ])
      }
    }
  }, [messages.length, isUserLoaded])

  // Update welcome message when user loads
  useEffect(() => {
    if (isUserLoaded && messages.length === 1 && messages[0].id === 'loading') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your Guardian AI trading assistant. I can analyze your trading data, provide insights on performance, risk management, and help you understand your trading psychology. 

What would you like to know about your trading?`,
          timestamp: new Date(),
          metadata: {
            insights: ['Welcome to Guardian AI', 'Ready to analyze your trades', 'Ask me anything about your trading']
          }
        }
      ])
    }
  }, [isUserLoaded, messages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const suggestedQuestions: SuggestedQuestion[] = [
    {
      question: "How is my trading performance this month?",
      category: "performance",
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      question: "What are my biggest risk factors?",
      category: "risk",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      question: "Which symbols am I most successful with?",
      category: "analysis",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      question: "How can I improve my trading psychology?",
      category: "psychology",
      icon: <Brain className="h-4 w-4" />
    },
    {
      question: "What's my win rate and average P&L?",
      category: "performance",
      icon: <Target className="h-4 w-4" />
    },
    {
      question: "When am I most active in trading?",
      category: "analysis",
      icon: <Clock className="h-4 w-4" />
    }
  ]

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    // Check if user is loaded
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please wait for user data to load before sending messages.",
        variant: "destructive",
      })
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error for missing API key
        if (errorData.error === 'AI service not configured') {
          throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file and restart the server.')
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('Chat error:', error)
      
      // Show user-friendly error message
      let errorMessage = "Failed to get AI response. Please try again."
      if (error instanceof Error) {
        if (error.message.includes('Gemini API key not configured')) {
          errorMessage = "AI service not configured. Please add GEMINI_API_KEY to your .env file and restart the server."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance': return 'bg-success/20 text-success border-success/30'
      case 'risk': return 'bg-warning/20 text-warning border-warning/30'
      case 'analysis': return 'bg-primary/20 text-primary border-primary/30'
      case 'psychology': return 'bg-accent/20 text-accent border-accent/30'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">AI Chat</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Chat with Guardian AI about your trading performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="glass-card hover-lift h-[600px] sm:h-[700px] flex flex-col">
            <CardHeader className="p-4 sm:p-6 border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Guardian AI Assistant</CardTitle>
              </div>
              <CardDescription className="text-sm">Ask me anything about your trading performance</CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 sm:p-4 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted border'
                        }`}
                      >
                        <div className="text-sm sm:text-base whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {message.metadata?.insights && (
                          <div className="mt-3 pt-3 border-t border-border/20">
                            <div className="flex flex-wrap gap-2">
                              {message.metadata.insights.map((insight, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs bg-primary/10 text-primary border-primary/20"
                                >
                                  {insight}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted border rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Guardian AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="p-4 sm:p-6 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your trading performance..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggested Questions Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="text-base sm:text-lg">Suggested Questions</CardTitle>
              </div>
              <CardDescription className="text-sm">Quick questions to get started</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question.question)}
                    className="w-full justify-start h-auto p-3 text-left"
                    disabled={isLoading}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {question.icon}
                      </div>
                      <span className="text-xs leading-relaxed">{question.question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card className="glass-card hover-lift">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">AI Capabilities</CardTitle>
              </div>
              <CardDescription className="text-sm">What Guardian AI can help you with</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-success" />
                  <span>Performance Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  <span>Risk Assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span>Trading Patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Behavioral Insights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
