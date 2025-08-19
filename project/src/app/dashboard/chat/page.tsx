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
    <div className="flex flex-col h-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Trading Assistant</h1>
            <p className="text-muted-foreground">Powered by Gemini - Ask me anything about your trading</p>
          </div>
        </div>
        
        {!isUserLoaded ? (
          <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading user data...</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                Ready to analyze your trading data and provide personalized insights!
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Chat with Guardian AI</CardTitle>
              </div>
              <CardDescription>
                Get intelligent insights about your trading performance, risk analysis, and psychology
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 border border-border/50'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Metadata for assistant messages */}
                        {message.role === 'assistant' && message.metadata && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            {message.metadata.tradeCount && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <BarChart3 className="h-3 w-3" />
                                Analyzed {message.metadata.tradeCount} trades
                              </div>
                            )}
                            
                            {message.metadata.symbols && message.metadata.symbols.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Target className="h-3 w-3" />
                                Symbols: {message.metadata.symbols.join(', ')}
                              </div>
                            )}
                            
                            {message.metadata.timeRange && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Clock className="h-3 w-3" />
                                {message.metadata.timeRange}
                              </div>
                            )}
                            
                            {message.metadata.insights && (
                              <div className="space-y-1">
                                {message.metadata.insights.map((insight, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    {insight}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted/50 border border-border/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">Guardian AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t p-4">
                {!isUserLoaded ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/30">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading user data...</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about your trading performance, risk analysis, or psychology..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggested Questions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <CardTitle>Quick Questions</CardTitle>
              </div>
              <CardDescription>
                Click to ask common questions about your trading
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-3 h-full overflow-y-auto pr-2">
                {suggestedQuestions.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 text-left min-h-[80px] max-h-[80px] overflow-hidden"
                    onClick={() => handleSuggestedQuestion(item.question)}
                    disabled={!isUserLoaded}
                  >
                    <div className="flex items-start gap-3 w-full h-full">
                      <div className="mt-0.5 flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                        <div 
                          className="text-sm font-medium leading-tight overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2'
                          }}
                        >
                          {item.question}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 text-xs w-fit ${getCategoryColor(item.category)}`}
                        >
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI Capabilities</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Performance Analysis</div>
                  <div>• Risk Assessment</div>
                  <div>• Behavioral Insights</div>
                  <div>• Pattern Recognition</div>
                  <div>• Personalized Coaching</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
