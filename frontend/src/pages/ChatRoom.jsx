import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, Smile, Phone, Video, MoreVertical, Reply as ReplyIcon } from 'lucide-react'
import ChatBubble from '../components/ChatBubble'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../contexts/useAuthStore'

// Stub room data
const ROOMS = {
  g1:  { name: 'CS 3rd Year – AAU',       isGroup: true  },
  g2:  { name: 'Math Department 2017 EC',  isGroup: true  },
  g3:  { name: 'AASTU EE 2018',            isGroup: true  },
  p1:  { name: 'Abebe Girma',              isGroup: false },
  p2:  { name: 'Tigist Wondimu',           isGroup: false },
  p3:  { name: 'Dawit Kebede',             isGroup: false },
}

// Stub messages
const INITIAL_MSGS = [
  { id: 'm1', senderId: 'other', senderName: 'Abebe Girma',  text: 'Hey! Has anyone got the Calculus II past papers?', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'read' },
  { id: 'm2', senderId: '1',     senderName: 'You',           text: 'Yes! I just uploaded them on NEx. Check the resources section.', createdAt: new Date(Date.now() - 3500000).toISOString(), status: 'read' },
  { id: 'm3', senderId: 'other', senderName: 'Tigist W.',     text: 'Thanks so much! Do you have 2016 EC as well?', createdAt: new Date(Date.now() - 3400000).toISOString(), status: 'read' },
  { id: 'm4', senderId: '1',     senderName: 'You',           text: "I'll look for it and share soon 🙂", createdAt: new Date(Date.now() - 3300000).toISOString(), status: 'delivered' },
  { id: 'm5', senderId: 'other', senderName: 'Dawit K.',      text: 'Anyone joining the study session tomorrow at the library?', createdAt: new Date(Date.now() - 600000).toISOString(), status: 'read' },
]

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-[#9CA3AF] bounce-1" />
        <span className="w-2 h-2 rounded-full bg-[#9CA3AF] bounce-2" />
        <span className="w-2 h-2 rounded-full bg-[#9CA3AF] bounce-3" />
      </div>
      <span className="text-xs text-[#9CA3AF]">typing…</span>
    </div>
  )
}

export default function ChatRoom() {
  const { roomId } = useParams()
  const user = useAuthStore((s) => s.user)
  const room = ROOMS[roomId] || { name: 'Chat', isGroup: false }

  const [messages, setMessages] = useState(INITIAL_MSGS)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef()
  const typingTimer = useRef()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Simulate other user typing after a reply
  const simulateTyping = () => {
    setOtherTyping(true)
    setTimeout(() => setOtherTyping(false), 3000)
  }

  const handleSend = () => {
    if (!text.trim()) return
    const msg = {
      id: `m${Date.now()}`,
      senderId: user?.id || '1',
      senderName: user?.name || 'You',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
      replyTo: replyTo ? { text: replyTo.text } : null,
    }
    setMessages((prev) => [...prev, msg])
    setText('')
    setReplyTo(null)
    simulateTyping()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    // useChatStore.setTyping(roomId, true) — call real socket action here
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      // useChatStore.setTyping(roomId, false)
    }, 1500)
  }

  return (
    // Full-height on mobile: h-screen flex flex-col
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E7EB] shrink-0">
        <Link to="/chat" aria-label="Back to chats" className="md:hidden text-[#6B7280] hover:text-[#0D9488]">
          <ArrowLeft size={20} />
        </Link>

        {room.isGroup ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
            #
          </div>
        ) : (
          <Avatar user={{ name: room.name }} size="sm" showOnline />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1F2937] text-sm truncate">{room.name}</p>
          <p className="text-[11px] text-[#10B981]">{room.isGroup ? 'Group chat' : 'Online'}</p>
        </div>

        <div className="flex items-center gap-2 text-[#6B7280]">
          {!room.isGroup && (
            <>
              <button aria-label="Voice call" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9FAFB]">
                <Phone size={18} />
              </button>
              <button aria-label="Video call" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9FAFB]">
                <Video size={18} />
              </button>
            </>
          )}
          <button aria-label="More options" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9FAFB]">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Message list – scrollable middle section */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F9FAFB]">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isSent={msg.senderId === (user?.id || '1')}
            showAvatar={room.isGroup}
            onReply={setReplyTo}
          />
        ))}
        {otherTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-teal-50 border-t border-teal-100 shrink-0">
          <ReplyIcon size={14} className="text-[#0D9488]" />
          <p className="text-sm text-[#6B7280] truncate flex-1">
            Replying to: <em>{replyTo.text.slice(0, 60)}</em>
          </p>
          <button onClick={() => setReplyTo(null)} className="text-[#6B7280] hover:text-[#EF4444] text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Input bar – pinned to bottom */}
      <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-[#E5E7EB] shrink-0">
        <button aria-label="Attach file" className="w-9 h-9 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#0D9488] hover:bg-[#F0FDFA] transition shrink-0">
          <Paperclip size={20} />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            aria-label="Message input"
            rows={1}
            style={{ resize: 'none' }}
            className="w-full px-4 py-2.5 pr-10 bg-[#F3F4F6] rounded-2xl text-sm border border-transparent
              focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:bg-white transition-colors
              max-h-32 overflow-y-auto"
          />
          <button aria-label="Emoji" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F59E0B]">
            <Smile size={18} />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-[#0D9488] text-white
            hover:bg-[#0f766e] active:scale-95 transition-all disabled:opacity-40 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
