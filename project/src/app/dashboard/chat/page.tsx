"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUserSync } from '@/hooks/useUserSync'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Paperclip,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Target,
  Clock,
  Brain,
  Zap
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

interface SuggestedPrompt {
  text: string
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

  const suggestedPrompts: SuggestedPrompt[] = [
    {
      text: "How is my trading performance this month?",
      category: "performance",
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      text: "What are my biggest risk factors?",
      category: "risk",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      text: "Which symbols am I most successful with?",
      category: "analysis",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      text: "How can I improve my trading psychology?",
      category: "psychology",
      icon: <Brain className="h-4 w-4" />
    },
    {
      text: "What's my win rate and average P&L?",
      category: "performance",
      icon: <Target className="h-4 w-4" />
    },
    {
      text: "When am I most active in trading?",
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

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Minimal Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground">Your personal trading intelligence companion</p>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
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
                            <Sparkles className="h-3 w-3 mr-1" />
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
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-3">
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
      </div>

      {/* Chat Input Area */}
      <div className="p-6 border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Input Field */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 border-border/50"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="h-10 w-10 p-0 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Suggested Prompts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Suggested prompts:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  className="h-8 px-3 text-xs border-border/50 hover:border-primary/50 hover:bg-primary/5 rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    {prompt.icon}
                    <span>{prompt.text}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
