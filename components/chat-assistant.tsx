"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "👋 Welcome to the Office Digital Twin AI Assistant!\n\n🎯 I can help you with:\n\n• 🏢 3D building model navigation & visualization\n• 📊 Equipment health monitoring & predictive maintenance\n• ⚠️ Alert analysis & recommended actions\n• 🌡️ Environmental control optimization\n• 🔮 What-if scenarios & 48-hour forecasts\n• 🔧 Maintenance scheduling & troubleshooting\n• 📈 Energy efficiency recommendations\n\n⚡ Quick Start:\n- \"What's the status of critical equipment?\"\n- \"How do I fix the dehumidifier issue?\"\n- \"Run a temperature simulation\"\n- \"Show me upcoming maintenance tasks\"\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: input,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.response) {
        throw new Error("Invalid response format from API")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}. Please make sure your OpenAI API key is configured in the environment variables (Vars section).`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-2 sm:right-6 left-2 sm:left-auto w-auto sm:w-[480px] h-[500px] sm:h-[600px] flex flex-col shadow-2xl z-50 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-violet-950/95 backdrop-blur-2xl">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-4 sm:p-5 border-b border-purple-400/30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-indigo-600/20 backdrop-blur-sm" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">AI Building Advisor</h3>
              <p className="text-[10px] sm:text-xs text-purple-100/80 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="hidden sm:inline">Online & Ready</span>
                <span className="sm:hidden">Online</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/20 text-white hover:scale-110"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages - Custom Scrollbar Hidden */}
      <div className="flex-1 p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-scroll scrollbar-hide">
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-lg ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-blue-400/30"
                  : "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-white border border-purple-400/30 backdrop-blur-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
              <span className={`text-xs mt-2 block ${message.role === "user" ? "text-blue-100" : "text-purple-200"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-white border border-purple-400/30 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
              <Loader className="w-5 h-5 animate-spin text-purple-300" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with Modern Design */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-gradient-to-r from-purple-900/50 to-violet-900/50 backdrop-blur-md border-t border-purple-400/30">
        <div className="flex gap-2 sm:gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your building..."
              className="w-full bg-white/10 border border-purple-400/40 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-md transition-all"
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 sm:p-3 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </form>
    </div>
  )
}
