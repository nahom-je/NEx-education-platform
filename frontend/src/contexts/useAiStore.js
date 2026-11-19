import { create } from 'zustand'
import api from '../utils/api'

export const useAiStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  context: null, // { category, semester, course }

  setContext: (context) => set({ context }),

  clearChat: () => set({ messages: [], error: null }),

  sendQuestion: async (question) => {
    if (!question || !question.trim()) return

    const trimmedQuestion = question.trim()
    const { messages, context } = get()

    // Optimistically add user's message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date().toISOString()
    }

    set({
      messages: [...messages, userMessage],
      loading: true,
      error: null
    })

    try {
      const response = await api.post('/ai/ask', {
        question: trimmedQuestion,
        context: context || undefined,
        history: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content
        }))
      })

      const data = response.data

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        cached: data.cached || false,
        provider: data.provider || null,
        timestamp: new Date().toISOString()
      }

      set((state) => ({
        messages: [...state.messages, aiMessage],
        loading: false
      }))
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || 'An error occurred while contacting the assistant.',
        loading: false
      })
    }
  }
}))


