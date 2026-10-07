import { Link } from 'react-router-dom'
import { Search, Users, Plus } from 'lucide-react'
import Avatar from '../components/Avatar'

const CHATS = [
  { id: 'g1', name: 'CS 3rd Year – AAU', lastMsg: 'Anyone has the Algo exam paper?', unread: 5, time: '22:32', isGroup: true, members: 48 },
  { id: 'g2', name: 'Math Department 2017 EC', lastMsg: 'New calculus notes uploaded!', unread: 0, time: '21:15', isGroup: true, members: 120 },
  { id: 'g3', name: 'AASTU EE 2018', lastMsg: 'Lab report due tomorrow', unread: 2, time: '20:58', isGroup: true, members: 63 },
  { id: 'p1', name: 'Abebe Girma', lastMsg: 'Thanks for sharing! 🙏', unread: 1, time: '19:45', isGroup: false },
  { id: 'p2', name: 'Tigist Wondimu', lastMsg: 'Did you get the answer key?', unread: 0, time: 'Yesterday', isGroup: false },
  { id: 'p3', name: 'Dawit Kebede', lastMsg: 'Let\'s study together tomorrow', unread: 0, time: 'Monday', isGroup: false },
]

export default function ChatList() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1F2937]">Messages</h1>
        <button
          aria-label="New chat"
          className="flex items-center gap-1.5 bg-[#0D9488] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0f766e] transition"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Search chats */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          placeholder="Search conversations…"
          aria-label="Search chats"
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
        />
      </div>

      {/* Chat list */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl divide-y divide-[#F3F4F6] overflow-hidden">
        {CHATS.map((chat) => (
          <Link
            key={chat.id}
            to={`/chat/${chat.id}`}
            className="flex items-center gap-4 px-4 py-4 hover:bg-[#F9FAFB] transition"
          >
            {/* Avatar / group icon */}
            <div className="relative shrink-0">
              {chat.isGroup ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  #
                </div>
              ) : (
                <Avatar user={{ name: chat.name }} size="md" showOnline />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-[#1F2937] truncate text-sm">{chat.name}</span>
                <span className="text-[10px] text-[#9CA3AF] shrink-0 ml-2">{chat.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <p className="text-xs text-[#6B7280] truncate flex-1">{chat.lastMsg}</p>
                {chat.isGroup && (
                  <span className="text-[9px] text-[#9CA3AF] flex items-center gap-0.5 shrink-0">
                    <Users size={9} />{chat.members}
                  </span>
                )}
              </div>
            </div>

            {/* Unread badge */}
            {chat.unread > 0 && (
              <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold flex items-center justify-center px-1">
                {chat.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
