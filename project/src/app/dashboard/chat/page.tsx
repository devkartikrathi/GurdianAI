"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@clerk/nextjs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
  Zap,
  ChevronDown,
  Menu
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
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if user is loaded - use Clerk user directly
  const isUserLoaded = isLoaded && isSignedIn && !!clerkUser?.id

  // Welcome message - show immediately
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm your Guardian AI trading assistant! 👋

I can analyze your trading data, provide insights on performance, risk management, and help you understand your trading psychology. 

I have access to your complete trading history and AI-generated insights. I can help you understand your behavioral patterns, risk management effectiveness, and provide personalized recommendations based on your actual performance data.

What would you like to know about your trading?`,
          timestamp: new Date(),
          metadata: {
            insights: ['Welcome to Guardian AI', 'AI Summary Integrated', 'Ready to analyze your trades', 'Ask me anything about your trading']
          }
        }
      ])
    }
  }, [messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const suggestedPrompts: SuggestedPrompt[] = [
    {
      text: "Analyze my trading performance using AI insights",
      category: "performance",
      icon: <Brain className="h-4 w-4" />
    },
    {
      text: "What does my AI summary say about my risk management?",
      category: "risk",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      text: "How can I improve based on my behavioral patterns?",
      category: "psychology",
      icon: <Brain className="h-4 w-4" />
    },
    {
      text: "Which symbols should I focus on based on my history?",
      category: "analysis",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      text: "What are my trading strengths and weaknesses?",
      category: "performance",
      icon: <Target className="h-4 w-4" />
    },
    {
      text: "How can I optimize my trading strategy?",
      category: "analysis",
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      text: "What psychological factors affect my trading?",
      category: "psychology",
      icon: <Brain className="h-4 w-4" />
    },
    {
      text: "Compare my performance across different time periods",
      category: "performance",
      icon: <Clock className="h-4 w-4" />
    }
  ]

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    // Simple check for user ID
    if (!clerkUser?.id) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        timestamp: new Date()
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I can see your message: "${inputMessage}"

I'm here to help with your trading questions! However, I need to verify your account to access your trading data and provide personalized insights.

Please make sure you're logged in, and then I'll be able to analyze your trading performance and give you specific advice based on your actual data!`,
        timestamp: new Date(),
        metadata: {
          insights: ['Account Verification Needed', 'General Advice Available', 'Personalized Insights Coming Soon']
        }
      }

      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInputMessage('')
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
          userId: clerkUser.id
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
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error while processing your request: ${errorMessage}

Please try again in a moment, or ask a different question.`,
        timestamp: new Date(),
        metadata: {
          insights: ['Error Occurred', 'Please Retry', 'Alternative Questions Welcome']
        }
      }

      setMessages(prev => [...prev, errorResponse])
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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50">
      {/* Minimal Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-purple-100/30 to-pink-100/30 dark:from-purple-800/30 dark:to-pink-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 dark:bg-purple-400/20 rounded-lg">
            <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-purple-900 dark:text-purple-100">AI Chat</h1>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Your personal trading intelligence companion
            </p>
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
                   <div className="text-sm leading-relaxed">
                     {message.role === 'assistant' ? (
                       <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
                         <ReactMarkdown 
                           remarkPlugins={[remarkGfm]}
                           components={{
                             h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2" {...props} />,
                             h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2" {...props} />,
                             h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
                             p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                             ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                             ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                             li: ({node, ...props}) => <li className="text-sm" {...props} />,
                             strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                             em: ({node, ...props}) => <em className="italic text-foreground" {...props} />,
                             code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                             pre: ({node, ...props}) => <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto" {...props} />,
                             blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-3 italic text-muted-foreground" {...props} />,
                           }}
                         >
                           {message.content}
                         </ReactMarkdown>
                       </div>
                     ) : (
                       <div className="whitespace-pre-wrap">{message.content}</div>
                     )}
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
      <div className="p-6 border-t border-border/50 bg-gradient-to-r from-indigo-100/30 to-blue-100/30 dark:from-indigo-800/30 dark:to-blue-800/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Input Field */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 border-indigo-300/50 dark:border-indigo-600/50 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/50"
            >
              <Paperclip className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </Button>
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trading..."
              className="flex-1 border-indigo-300/50 dark:border-indigo-600/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 rounded-xl bg-white/80 dark:bg-gray-800/80"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Prompts Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Quick prompts:</span>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-indigo-300/50 dark:border-indigo-600/50 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                >
                  <Menu className="h-3 w-3 mr-2" />
                  Select a prompt
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-80 max-h-96 overflow-y-auto bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 border border-indigo-200/50 dark:border-indigo-700/50 shadow-xl"
                side="top"
              >
                <DropdownMenuLabel className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/50 dark:to-blue-900/50 p-3">
                  Choose a quick prompt to get started
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-indigo-200/50 dark:bg-indigo-600/50" />
                
                {/* Performance Category */}
                <div className="px-2 py-1">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/50 dark:to-indigo-900/50 p-2 rounded-md">
                    <TrendingUp className="h-3 w-3" />
                    Performance Analysis
                  </div>
                  {suggestedPrompts
                    .filter(prompt => prompt.category === 'performance')
                    .map((prompt, index) => (
                      <DropdownMenuItem
                        key={`perf-${index}`}
                        onClick={() => {
                          handleSuggestedPrompt(prompt.text)
                          setIsDropdownOpen(false)
                        }}
                        className="text-xs p-2 rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
                            {prompt.icon}
                          </div>
                          <span className="text-left leading-relaxed text-gray-700 dark:text-gray-300">
                            {prompt.text}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator />
                
                {/* Risk Category */}
                <div className="px-2 py-1">
                  <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-900/50 dark:to-amber-900/50 p-2 rounded-md">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Management
                  </div>
                  {suggestedPrompts
                    .filter(prompt => prompt.category === 'risk')
                    .map((prompt, index) => (
                      <DropdownMenuItem
                        key={`risk-${index}`}
                        onClick={() => {
                          handleSuggestedPrompt(prompt.text)
                          setIsDropdownOpen(false)
                        }}
                        className="text-xs p-2 rounded-md hover:bg-orange-50/50 dark:hover:bg-orange-900/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 text-orange-600 dark:text-orange-400 mt-0.5">
                            {prompt.icon}
                          </div>
                          <span className="text-left leading-relaxed text-gray-700 dark:text-gray-300">
                            {prompt.text}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator />
                
                {/* Psychology Category */}
                <div className="px-2 py-1">
                  <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/50 dark:to-pink-900/50 p-2 rounded-md">
                    <Brain className="h-3 w-3" />
                    Trading Psychology
                  </div>
                  {suggestedPrompts
                    .filter(prompt => prompt.category === 'psychology')
                    .map((prompt, index) => (
                      <DropdownMenuItem
                        key={`psych-${index}`}
                        onClick={() => {
                          handleSuggestedPrompt(prompt.text)
                          setIsDropdownOpen(false)
                        }}
                        className="text-xs p-2 rounded-md hover:bg-purple-50/50 dark:hover:bg-purple-900/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 text-purple-600 dark:text-purple-400 mt-0.5">
                    {prompt.icon}
                          </div>
                          <span className="text-left leading-relaxed text-gray-700 dark:text-gray-300">
                            {prompt.text}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator />
                
                {/* Analysis Category */}
                <div className="px-2 py-1">
                  <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/50 dark:to-emerald-900/50 p-2 rounded-md">
                    <BarChart3 className="h-3 w-3" />
                    Strategy Analysis
                  </div>
                  {suggestedPrompts
                    .filter(prompt => prompt.category === 'analysis')
                    .map((prompt, index) => (
                      <DropdownMenuItem
                        key={`analysis-${index}`}
                        onClick={() => {
                          handleSuggestedPrompt(prompt.text)
                          setIsDropdownOpen(false)
                        }}
                        className="text-xs p-2 rounded-md hover:bg-green-50/50 dark:hover:bg-green-900/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5">
                            {prompt.icon}
                          </div>
                          <span className="text-left leading-relaxed text-gray-700 dark:text-gray-300">
                            {prompt.text}
                          </span>
                        </div>
                      </DropdownMenuItem>
              ))}
            </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

