import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

// ─── Chat Store ───────────────────────────────────────────────────────────────
// Manages Socket.io connection, chat rooms, and messages.
export const useChatStore = create((set, get) => ({
  socket: null,
  rooms: [],           // [{ id, name, avatar, type: 'private'|'group', lastMsg, unread }]
  messages: {},        // { [roomId]: [{ id, senderId, text, media, createdAt, replyTo }] }
  typingBy: {},        // { [roomId]: [userId] }
  activeRoomId: null,

  // Connect to Socket.io server (call after login)
  connect: (token) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => console.log('[NEx Chat] connected'))

    socket.on('message', ({ roomId, message }) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: [...(state.messages[roomId] || []), message],
        },
        rooms: state.rooms.map((r) =>
          r.id === roomId ? { ...r, lastMsg: message.text, unread: (r.unread || 0) + 1 } : r
        ),
      }))
    })

    socket.on('typing', ({ roomId, userId, isTyping }) => {
      set((state) => {
        const current = state.typingBy[roomId] || []
        const next = isTyping
          ? [...new Set([...current, userId])]
          : current.filter((id) => id !== userId)
        return { typingBy: { ...state.typingBy, [roomId]: next } }
      })
    })

    socket.on('roomsList', (rooms) => set({ rooms }))

    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) socket.disconnect()
    set({ socket: null })
  },

  joinRoom: (roomId) => {
    const { socket } = get()
    if (socket) socket.emit('joinRoom', roomId)
    set({ activeRoomId: roomId })
  },

  sendMessage: (roomId, text, media = null, replyTo = null) => {
    const { socket } = get()
    if (socket) socket.emit('sendMessage', { roomId, text, media, replyTo })
  },

  setTyping: (roomId, isTyping) => {
    const { socket } = get()
    if (socket) socket.emit('typing', { roomId, isTyping })
  },

  loadMessages: (roomId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    }))
  },

  clearUnread: (roomId) => {
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, unread: 0 } : r
      ),
    }))
  },

  setRooms: (rooms) => set({ rooms }),
}))
