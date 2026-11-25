// frontend/src/pages/MyCourses.jsx
// Shows all unlocked courses for the logged-in student.

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Unlock, ShoppingCart, ChevronRight, Clock,
  BookMarked, FlaskConical, GraduationCap
} from 'lucide-react'
import { usePaymentStore } from '../contexts/usePaymentStore'

// Map course names to relevant icons
const COURSE_ICONS = {
  'mathematics': '📐',
  'physics': '⚛️',
  'chemistry': '🧪',
  'biology': '🧬',
  'english': '📖',
  'geography': '🗺️',
  'psychology': '🧠',
  'logic': '🤔',
  'history': '📜',
  'fitness': '🏃',
  'economics': '📊',
  'civics': '🏛️',
}

function getCourseEmoji(courseName) {
  if (!courseName) return '📚'
  const lower = courseName.toLowerCase()
  for (const [key, emoji] of Object.entries(COURSE_ICONS)) {
    if (lower.includes(key)) return emoji
  }
  return '📚'
}

function semesterToSlug(semester) {
  if (!semester) return 'semester-1'
  return semester.toLowerCase().replace(/\s+/g, '-')
}

export default function MyCourses() {
  const { myAccess, myRequests, fetchMyAccess, fetchMyRequests, loadingAccess } = usePaymentStore()

  useEffect(() => {
    fetchMyAccess()
    fetchMyRequests()
  }, [fetchMyAccess, fetchMyRequests])

  const unlocked = myAccess.filter(a => a.status === 'unlocked')
  const pending = myRequests.filter(r => r.status === 'claimed')

  if (loadingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">My Courses</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {unlocked.length} course{unlocked.length !== 1 ? 's' : ''} unlocked
          </p>
        </div>
        <Link
          to="/pricing"
          className="flex items-center gap-1.5 bg-[#0D9488] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-teal-700 transition"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Buy More
        </Link>
      </div>

      {/* Pending requests notice */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pending.length} payment{pending.length > 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-amber-600">Usually approved within 30 minutes.</p>
          </div>
        </div>
      )}

      {/* Unlocked courses */}
      {unlocked.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <h3 className="font-bold text-gray-700">No courses yet</h3>
            <p className="text-xs text-gray-400 mt-1">Purchase a course to get full access to all its materials.</p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 bg-[#0D9488] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {unlocked.map(access => {
            const course = access.course
            if (!course) return null

            // Build the browse URL
            const categorySlug = course.category?.slug || 'freshman-natural-science'
            const semesterSlug = semesterToSlug(course.semester)
            const courseSlug = course.slug
            const browseUrl = `/browse/${categorySlug}/${semesterSlug}/${courseSlug}`
            const emoji = getCourseEmoji(course.name)

            return (
              <Link
                key={access.id}
                to={browseUrl}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-[#0D9488] hover:shadow-md transition-all duration-200 group block"
              >
                {/* Course Emoji Icon */}
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-2xl group-hover:bg-teal-100 transition-colors">
                  {emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1F2937] text-sm truncate group-hover:text-[#0D9488] transition-colors">
                    {course.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" />
                      Unlocked
                    </span>
                    {course.category && (
                      <span className="text-[10px] text-gray-400">
                        {course.category.name}
                      </span>
                    )}
                    {access.granted_at && (
                      <span className="text-[10px] text-gray-400">
                        · since {new Date(access.granted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0D9488] transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Support */}
      <div className="text-center pt-2">
        <a
          href="https://t.me/bekiJng"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gray-400 hover:text-[#0D9488] transition"
        >
          Need help? Contact @bekiJng on Telegram
        </a>
      </div>
    </div>
  )
}
