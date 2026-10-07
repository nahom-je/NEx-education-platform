import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, BookOpen, Clock, MessageCircle, Upload, ArrowRight } from 'lucide-react'
import ResourceCard from '../components/ResourceCard'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../contexts/useAuthStore'
import { useResourceStore } from '../contexts/useResourceStore'

const RECENT_CHATS = [
  { id: 'g1', name: 'CS 3rd Year – AAU', lastMsg: 'Anyone has the exam paper?', unread: 3, time: '22:10', isGroup: true },
  { id: 'g2', name: 'Math Department', lastMsg: 'Posted new calc notes!', unread: 0, time: 'Yesterday', isGroup: true },
  { id: 'p1', name: 'Abebe Girma', lastMsg: 'Thanks for sharing 🙏', unread: 1, time: '20:45', isGroup: false },
]

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const { resources, fetchResources, loading } = useResourceStore()

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

      {/* Hero welcome */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-2">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[#6B7280] text-lg">
            {user?.university} · {user?.department} · {user?.year}
          </p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-[#0D9488] text-white font-semibold px-6 py-3 rounded-xl
            hover:bg-[#0f766e] transition-colors self-start md:self-auto"
        >
          <Upload size={18} />
          Share a Resource
        </Link>
      </section>

      {/* Quick stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Resources', value: '12,400+', color: 'text-[#0D9488] bg-teal-50' },
          { icon: TrendingUp, label: 'Downloads', value: '89,200+', color: 'text-[#F59E0B] bg-amber-50' },
          { icon: MessageCircle, label: 'Chat Rooms', value: '340+', color: 'text-violet-600 bg-violet-50' },
          { icon: Upload, label: 'Uploads Today', value: '48', color: 'text-[#10B981] bg-emerald-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
            <p className="text-sm text-[#6B7280]">{label}</p>
          </div>
        ))}
      </section>

      {/* Main two-column layout: trending + recent chats sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Trending resources */}
        <section className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
              <TrendingUp size={20} className="text-[#0D9488]" />
              Trending Resources
            </h2>
            <Link to="/search" className="text-sm text-[#0D9488] hover:underline flex items-center gap-1">
              Browse all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Responsive grid: 1 col mobile → 2 col md → 3 col xl */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-[#6B7280]">Loading resources...</p>
            ) : resources.length > 0 ? (
              resources.slice(0, 6).map((r) => <ResourceCard key={r._id || r.id} resource={r} />)
            ) : (
              <p className="text-[#6B7280]">No trending resources found.</p>
            )}
          </div>
        </section>

        {/* Right sidebar: recent chats */}
        <aside className="lg:w-72 shrink-0 space-y-4">
          {/* Recent chats */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="font-semibold text-[#1F2937] flex items-center gap-2">
                <MessageCircle size={16} className="text-[#0D9488]" />
                Recent Chats
              </h3>
              <Link to="/chat" className="text-xs text-[#0D9488] hover:underline">View all</Link>
            </div>
            <ul>
              {RECENT_CHATS.map((chat) => (
                <li key={chat.id}>
                  <Link
                    to={`/chat/${chat.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {chat.isGroup ? '#' : chat.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1F2937] truncate">{chat.name}</p>
                        <span className="text-[10px] text-[#9CA3AF] shrink-0 ml-1">{chat.time}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] truncate">{chat.lastMsg}</p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Upload CTA */}
          <div className="bg-gradient-to-br from-[#0D9488] to-[#059669] rounded-xl p-5 text-white">
            <h4 className="font-bold text-lg mb-1">Share Knowledge</h4>
            <p className="text-sm text-white/80 mb-4">Help your classmates by uploading resources.</p>
            <Link
              to="/upload"
              className="flex items-center justify-center gap-2 bg-white text-[#0D9488] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <Upload size={15} /> Upload Now
            </Link>
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-[#1F2937] flex items-center gap-2">
              <Clock size={15} className="text-[#6B7280]" />
              Recently Added
            </h3>
            {resources.slice(0, 3).map((r) => (
              <Link
                key={r._id || r.id}
                to={`/resource/${r._id || r.id}`}
                className="flex items-center gap-3 hover:bg-[#F9FAFB] -mx-2 px-2 py-1.5 rounded-lg transition"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-[#0D9488]" />
                </div>
                <p className="text-sm text-[#374151] line-clamp-1">{r.title}</p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
