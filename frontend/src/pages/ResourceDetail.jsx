import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, MessageSquare, Share2, Calendar, Folder, BookOpen, ThumbsUp, Tag, ArrowLeft } from 'lucide-react'
import Avatar from '../components/Avatar'
import FilePreview from '../components/FilePreview'
import { useAuthStore } from '../contexts/useAuthStore'
import { useResourceStore } from '../contexts/useResourceStore'

export default function ResourceDetail() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const { currentResource, fetchResourceById, downloadResource, commentResource, loading } = useResourceStore()

  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (id) {
      fetchResourceById(id)
    }
  }, [id, fetchResourceById])

  const handleDownload = async () => {
    if (!currentResource) return
    const fileUrl = await downloadResource(currentResource._id || currentResource.id)
    if (fileUrl) {
      // Trigger download in new window/tab
      const link = document.createElement('a')
      link.href = fileUrl
      link.setAttribute('download', currentResource.title || 'resource')
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    await commentResource(currentResource._id || currentResource.id, commentText)
    setCommentText('')
    setSubmittingComment(false)
  }

  if (loading && !currentResource) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[#6B7280]">
        <p className="text-lg">Loading resource details...</p>
      </div>
    )
  }

  if (!currentResource) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-xl font-bold text-[#1F2937]">Resource Not Found</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[#0D9488] font-semibold hover:underline">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    )
  }

  const {
    title, description, type, category, categoryName, course, courseName,
    semester, fileUrl, fileSize, downloads = 0, uploader, comments = [], tags = []
  } = currentResource

  const displayCategory = category?.name || categoryName || 'Uncategorized'
  const displayCourse = course?.name || courseName || 'General'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#6B7280] flex items-center gap-2 flex-wrap">
        <Link to="/" className="hover:text-[#0D9488]">Home</Link>
        <span>/</span>
        <span className="text-[#0D9488] font-medium">{displayCategory}</span>
        {semester && (
          <>
            <span>/</span>
            <span>{semester}</span>
          </>
        )}
        <span>/</span>
        <span className="text-[#1F2937] font-semibold truncate max-w-xs">{title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] uppercase tracking-wide">
                {type}
              </span>
              <span className="text-xs text-[#6B7280] font-medium">
                {fileSize || 'Document'} · <Download size={13} className="inline mr-0.5 text-[#0D9488]" />{downloads} downloads
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] leading-tight">
              {title}
            </h1>

            {description && (
              <p className="text-[#4B5563] leading-relaxed text-sm sm:text-base">
                {description}
              </p>
            )}

            {/* Meta details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2">
              <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F3F4F6]">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Folder size={12} className="text-[#0D9488]" /> Institution
                </p>
                <p className="font-semibold text-[#0D9488] text-xs sm:text-sm">Jimma University</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F3F4F6]">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Folder size={12} className="text-[#0D9488]" /> Category
                </p>
                <p className="font-semibold text-[#1F2937] text-xs sm:text-sm truncate">{displayCategory}</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F3F4F6]">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen size={12} className="text-[#0D9488]" /> Course
                </p>
                <p className="font-semibold text-[#1F2937] text-xs sm:text-sm truncate">{displayCourse}</p>
              </div>

              {semester && (
                <div className="bg-[#F9FAFB] rounded-xl p-3 border border-[#F3F4F6]">
                  <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-[#0D9488]" /> Semester
                  </p>
                  <p className="font-semibold text-[#1F2937] text-xs sm:text-sm">{semester}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((t) => (
                  <span key={t} className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* In-Browser Document Previewer */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <BookOpen size={18} className="text-[#0D9488]" />
              Document Preview
            </h2>
            <FilePreview
              fileUrl={fileUrl}
              title={title}
              onDownload={handleDownload}
            />
          </div>

          {/* Comments & Discussion */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="font-bold text-[#1F2937] text-lg flex items-center gap-2">
              <MessageSquare size={18} className="text-[#0D9488]" />
              Discussion ({comments.length})
            </h2>

            {/* Add Comment */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask a question or share feedback on this resource..."
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-[#0D9488] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0f766e] disabled:opacity-50 transition shadow-sm"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-[#6B7280]">
                <Link to="/login" className="text-[#0D9488] font-semibold hover:underline">Log in</Link> to join the discussion.
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-6">No comments yet. Be the first to start the discussion!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id || c.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                    <Avatar user={c.user} size="sm" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#1F2937]">{c.user?.name || 'Anonymous Student'}</span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-[#374151] leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <aside className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 shadow-sm lg:sticky lg:top-20">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center"><p className="text-xs font-semibold text-[#0D9488]">Protected View Mode</p><p className="text-[11px] text-gray-500 mt-0.5">Read-only inside NEx platform</p></div>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full border border-[#E5E7EB] text-[#374151] font-medium py-2.5 rounded-xl hover:bg-[#F9FAFB] transition text-sm"
            >
              <Share2 size={16} />
              {copiedLink ? 'Link Copied! ✓' : 'Share Resource'}
            </button>

            {/* Uploader Card */}
            {uploader && (
              <div className="border-t border-[#F3F4F6] pt-4 mt-2">
                <p className="text-xs text-[#9CA3AF] mb-2 font-semibold uppercase tracking-wide">Shared By</p>
                <div className="flex items-center gap-3">
                  <Avatar user={uploader} size="sm" />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-[#1F2937] truncate">{uploader.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{uploader.university || 'Student'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
