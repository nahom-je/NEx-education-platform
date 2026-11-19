import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  X
} from 'lucide-react'
import { useAiStore } from '../contexts/useAiStore'

export default function AiChat() {
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const [searchParams] = useSearchParams()

  const {
    messages,
    loading,
    error,
    context,
    setContext,
    sendQuestion,
    clearChat
  } = useAiStore()

  // Pre-populate context from query parameters if present (e.g., from course page)
  useEffect(() => {
    const course = searchParams.get('course')
    const category = searchParams.get('category')
    const semester = searchParams.get('semester')

    if (course || category || semester) {
      setContext({
        course: course || '',
        category: category || '',
        semester: semester || ''
      })
    }
  }, [searchParams, setContext])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    sendQuestion(text)
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#1F2937] leading-tight flex items-center gap-2">
              <span>NEx Study Assistant</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-[#0D9488]">
                Beta
              </span>
            </h1>
            <p className="text-xs text-gray-500 truncate">
              Step-by-step academic explanations for Ethiopian university students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              title="Start a new chat session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Context Badge (if asking about a specific course) */}
      {context?.course && (
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl px-3.5 py-2 mb-3 flex items-center justify-between text-xs text-teal-800 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>
              Asking about: <strong className="font-semibold text-[#0D9488]">{context.course}</strong>
              {context.semester ? ` (${context.semester})` : ''}
            </span>
          </div>
          <button
            onClick={() => setContext(null)}
            className="text-teal-600 hover:text-teal-900 p-0.5 rounded"
            title="Clear course focus"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              How can I help with your studies today?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mb-6">
              Ask any question from your courses, past exams, or assignments. You can also write in Amharic.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {[
                'Explain Newton’s Third Law with real examples',
                'What is the difference between ought to and had better?',
                'How do I calculate population density in Geography?',
                'ቀላል ማብራሪያ ስለ logic and critical thinking'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(suggestion)
                  }}
                  className="text-left text-xs bg-white border border-gray-200 hover:border-[#0D9488] p-3 rounded-xl transition-all text-gray-700 hover:text-[#0D9488] shadow-sm"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm relative group ${
                    isUser
                      ? 'bg-[#0D9488] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-[#1F2937] rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-teal">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>

                      {/* Copy Action Button */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="inline-flex items-center gap-1 hover:text-[#0D9488] transition-colors p-1 rounded"
                          title="Copy explanation"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-teal-600" />
                              <span className="text-teal-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2 font-medium text-gray-500">Thinking step by step...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Card */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                If the assistant is busy, please wait a moment and try again.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-3 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
            placeholder="Ask a question... (Press Enter to send, Shift+Enter for new line)"
            rows={2}
            maxLength={1000}
            className="w-full pl-4 pr-14 py-3 text-sm bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] resize-none shadow-sm transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-[#0D9488] transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-2">
          AI answers can be wrong. Check important facts with your teacher or textbook.
        </p>
      </div>
    </div>
  )
}

