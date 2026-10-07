import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, Star, MessageSquare, Share2, BookOpen, Calendar, University, Tag, Reply, ThumbsUp } from 'lucide-react'
import RatingStars from '../components/RatingStars'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../contexts/useAuthStore'

// Stub resource data (in real app: fetch by :id)
const RESOURCE = {
  id: '1',
  title: 'Calculus II Final Exam 2017 EC',
  university: 'AAU (Addis Ababa University)',
  department: 'Natural & Computational Sciences',
  courseCode: 'Math 202',
  courseName: 'Calculus II',
  year: '2017 EC (2024-2025 GC)',
  type: 'exam',
  tags: ['calculus', 'integration', 'final exam', 'AAU'],
  rating: 4.7,
  ratingCount: 84,
  downloads: 312,
  fileSize: '1.2 MB',
  fileType: 'PDF',
  uploadedBy: { id: 'u2', name: 'Selam Tadesse', avatar: null, university: 'AAU' },
  uploadedAt: '2024-07-15',
  description: 'Official final examination paper for Calculus II (Math 202) at AAU, 2017 Ethiopian Calendar. Covers integration techniques, series, multivariable calculus up to Chapter 8.',
  status: 'approved',
}

const COMMENTS = [
  { id: 'c1', author: { name: 'Abebe Girma', avatar: null }, text: 'This was super helpful! The integration section is exactly what I needed.', time: '2 days ago', likes: 12, replies: [] },
  { id: 'c2', author: { name: 'Tigist W.', avatar: null }, text: 'Are the answers included? I can only see the questions.', time: '1 day ago', likes: 3, replies: [
    { id: 'c2r1', author: { name: 'Selam Tadesse', avatar: null }, text: '@Tigist W. No, it is question only. I will try to upload the answer key soon!', time: '1 day ago', likes: 5 },
  ]},
  { id: 'c3', author: { name: 'Dawit K.', avatar: null }, text: 'Best exam paper on NEx so far 🔥', time: '5 hours ago', likes: 7, replies: [] },
]

export default function ResourceDetail() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const [userRating, setUserRating] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(COMMENTS)
  const [replyTo, setReplyTo] = useState(null)

  const submitComment = () => {
    if (!comment.trim()) return
    const nc = {
      id: `c${Date.now()}`,
      author: user,
      text: comment,
      time: 'Just now',
      likes: 0,
      replies: [],
    }
    setComments((prev) => {
      if (replyTo) {
        return prev.map((c) => c.id === replyTo
          ? { ...c, replies: [...c.replies, { ...nc, id: `r${Date.now()}` }] }
          : c
        )
      }
      return [...prev, nc]
    })
    setComment('')
    setReplyTo(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-[#6B7280] flex items-center gap-2">
        <Link to="/" className="hover:text-[#0D9488]">Home</Link>
        <span>/</span>
        <Link to="/search" className="hover:text-[#0D9488]">Browse</Link>
        <span>/</span>
        <span className="text-[#1F2937] font-medium truncate">{RESOURCE.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Main card */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                {RESOURCE.type.toUpperCase()}
              </span>
              <span className="text-xs text-[#6B7280]">{RESOURCE.fileType} · {RESOURCE.fileSize}</span>
            </div>

            <h1 className="text-2xl font-bold text-[#1F2937] leading-tight">{RESOURCE.title}</h1>
            <p className="text-[#6B7280] leading-relaxed">{RESOURCE.description}</p>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['University', RESOURCE.university],
                ['Course', `${RESOURCE.courseCode} – ${RESOURCE.courseName}`],
                ['Academic Year', RESOURCE.year],
                ['Department', RESOURCE.department],
              ].map(([label, val]) => (
                <div key={label} className="bg-[#F9FAFB] rounded-xl p-3">
                  <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-medium text-[#1F2937] text-sm">{val}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {RESOURCE.tags.map((t) => (
                <span key={t} className="text-xs bg-[#F3F4F6] px-2.5 py-1 rounded-full text-[#6B7280]">
                  #{t}
                </span>
              ))}
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#F3F4F6]">
              <RatingStars value={RESOURCE.rating} size={18} />
              <span className="font-bold text-[#1F2937]">{RESOURCE.rating}</span>
              <span className="text-sm text-[#9CA3AF]">({RESOURCE.ratingCount} ratings)</span>
              <div className="ml-auto text-sm text-[#6B7280]">
                <Download size={14} className="inline mr-1" />{RESOURCE.downloads} downloads
              </div>
            </div>

            {/* Your rating */}
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <span>Rate this resource:</span>
              <RatingStars value={userRating} onChange={setUserRating} size={20} />
              {userRating > 0 && (
                <button
                  onClick={() => setUserRating(0)}
                  className="text-xs text-[#EF4444] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-[#1F2937] flex items-center gap-2">
              <MessageSquare size={18} className="text-[#0D9488]" />
              Discussion ({comments.length})
            </h2>

            {/* Comment input */}
            <div className="flex gap-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1 space-y-2">
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs text-[#0D9488] bg-teal-50 px-3 py-1.5 rounded-lg">
                    <Reply size={12} /> Replying to a comment
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-[#6B7280]">×</button>
                  </div>
                )}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts or questions…"
                  aria-label="Write a comment"
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitComment}
                    disabled={!comment.trim()}
                    className="bg-[#0D9488] text-white text-sm font-semibold px-5 py-2 rounded-xl
                      hover:bg-[#0f766e] disabled:opacity-50 transition"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <div className="space-y-5">
              {comments.map((c) => (
                <div key={c.id}>
                  <div className="flex gap-3">
                    <Avatar user={c.author} size="sm" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1F2937]">{c.author.name}</span>
                        <span className="text-xs text-[#9CA3AF]">{c.time}</span>
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed">{c.text}</p>
                      <div className="flex items-center gap-4 text-xs text-[#9CA3AF] mt-1">
                        <button className="flex items-center gap-1 hover:text-[#0D9488] transition">
                          <ThumbsUp size={12}/> {c.likes}
                        </button>
                        <button
                          onClick={() => setReplyTo(c.id)}
                          className="flex items-center gap-1 hover:text-[#0D9488] transition"
                        >
                          <Reply size={12}/> Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nested replies */}
                  {c.replies.length > 0 && (
                    <div className="ml-12 mt-3 space-y-3 border-l-2 border-[#F3F4F6] pl-4">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-3">
                          <Avatar user={r.author} size="xs" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#1F2937]">{r.author.name}</span>
                              <span className="text-[10px] text-[#9CA3AF]">{r.time}</span>
                            </div>
                            <p className="text-sm text-[#374151]">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:w-72 shrink-0 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 lg:sticky lg:top-20">
            <a
              href="#"
              className="flex items-center justify-center gap-2 w-full bg-[#0D9488] text-white font-bold py-3.5 rounded-xl
                hover:bg-[#0f766e] active:scale-95 transition-all text-sm"
              aria-label="Download resource"
            >
              <Download size={18} />
              Download PDF
            </a>

            <button className="flex items-center justify-center gap-2 w-full border border-[#E5E7EB] text-[#374151] font-medium py-2.5 rounded-xl hover:bg-[#F9FAFB] transition text-sm">
              <Share2 size={16} /> Share Resource
            </button>

            {/* Uploader */}
            <div className="border-t border-[#F3F4F6] pt-4">
              <p className="text-xs text-[#9CA3AF] mb-2 font-semibold uppercase tracking-wide">Uploaded by</p>
              <Link to={`/profile/${RESOURCE.uploadedBy.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                <Avatar user={RESOURCE.uploadedBy} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">{RESOURCE.uploadedBy.name}</p>
                  <p className="text-xs text-[#6B7280]">{RESOURCE.uploadedBy.university}</p>
                </div>
              </Link>
              <p className="text-xs text-[#9CA3AF] mt-2">Uploaded {RESOURCE.uploadedAt}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
