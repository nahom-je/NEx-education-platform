import { API_BASE } from '../utils/config';
import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { 
  BookOpen, Search, Download, Eye, Upload, FileText, 
  HelpCircle, Sparkles, Filter, CheckCircle2, AlertCircle, ArrowUpRight,
  Lock, ArrowRight, Send, ChevronRight, Shield, ChevronLeft
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { useResourceStore } from '../contexts/useResourceStore'
import { useAuthStore } from '../contexts/useAuthStore'
import api from '../utils/api'

const TYPE_CONFIG = [
  { key: 'all', label: 'All' },
  { key: 'exam', label: 'Exams (Mid/Final)' },
  { key: 'worksheet', label: 'Worksheets' },
  { key: 'notes', label: 'Notes & Slides' },
  { key: 'teachers_guide', label: "Teacher's Guide" },
  { key: 'project', label: 'Projects' },
  { key: 'interactive_quiz', label: 'Practice Quiz', isQuizLink: true },
]

export default function CourseView() {
  const { categorySlug, semesterSlug, courseSlug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { downloadResource } = useResourceStore()
  const user = useAuthStore((s) => s.user)

  const currentType = searchParams.get('type') || 'all'
  const currentSearch = searchParams.get('q') || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [quizCount, setQuizCount] = useState(0)
  const [selectedExamId, setSelectedExamId] = useState(null)

  useEffect(() => {
    // Fetch count of chapter quizzes
    fetch(`${API_BASE}/api/quizzes/course/${courseSlug}`)
      .then((res) => res.json())
      .then((list) => {
        setQuizCount(list?.length || 0)
      })
      .catch(() => {})
  }, [courseSlug])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (currentType && currentType !== 'all') params.set('type', currentType)
    if (currentSearch) params.set('search', currentSearch)
    if (currentType === 'exam') params.set('limit', '200') // fetch all exams

    api.get(`/browse/${categorySlug}/${semesterSlug}/${courseSlug}/materials?${params.toString()}`)
      .then((res) => {
        setData(res.data)
        // Automatically select the first exam when in exams tab
        if (currentType === 'exam' && res.data?.materials?.length > 0) {
          setSelectedExamId(res.data.materials[0]._id || res.data.materials[0].id)
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false))
  }, [categorySlug, semesterSlug, courseSlug, currentType, currentSearch])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      next.set('q', searchInput.trim())
    } else {
      next.delete('q')
    }
    setSearchParams(next)
  }

  const handleTypeChange = (tab) => {
    if (tab.isQuizLink) {
      navigate(`/browse/${categorySlug}/${semesterSlug}/${courseSlug}/quiz`)
      return
    }

    const next = new URLSearchParams(searchParams)
    if (tab.key === 'all') {
      next.delete('type')
    } else {
      next.set('type', tab.key)
    }
    setSearchParams(next)
  }

  const handleSelectExam = (examId) => {
    setSelectedExamId(examId)
    const el = document.getElementById('exam-inline-viewer')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-6 w-72 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="h-28 bg-gray-100 animate-pulse rounded-2xl mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course Not Found</h2>
        <p className="text-gray-500 mb-6">Could not load materials for this course.</p>
        <Link
          to={`/browse/${categorySlug}/${semesterSlug}`}
          className="inline-flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Back to Courses
        </Link>
      </div>
    )
  }

  // Paywall screen for locked course
  if (data?.locked) {
    const { category, semester, course } = data
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: category?.name || 'Category', href: `/browse/${categorySlug}` },
            { label: semester || 'Semester', href: `/browse/${categorySlug}/${semesterSlug}` },
            { label: course?.name || 'Course' }
          ]}
          backTo={`/browse/${categorySlug}/${semesterSlug}`}
        />

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
              Content Locked
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {course?.name} Materials
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              This course is locked. Full access to all official midterm exams, final exam solutions, lecture slides, and worksheets requires the <strong>{semester || 'Semester'} Package (70 ETB)</strong>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 max-w-md mx-auto text-left space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Semester Package</p>
                <p className="text-[11px] text-slate-500">Unlocks all courses in this semester</p>
              </div>
              <span className="text-base font-black text-[#0D9488]">70 ETB Total</span>
            </div>

            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All {semester || 'Semester'} courses unlocked at once</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified midterms, final exams &amp; teacher solutions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>In-browser protected document &amp; slide viewer</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fast Telegram verification with Admin (@nahomJT)</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/pricing"
                className="w-full flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-sm text-sm cursor-pointer"
              >
                <span>Unlock Semester Package (70 ETB)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="https://t.me/nahomJT"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 transition"
              >
                <Send className="w-3.5 h-3.5 text-teal-600" />
                <span>Already paid? Contact Admin on Telegram (@nahomJT)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { category, semester, course, counts = {}, materials = [], total = 0 } = data

  // Watermark text for protected reading
  const watermarkText = `${user?.name || 'Jimma Student'} • ${user?.phone || 'NEx Platform'} • ${new Date().toLocaleDateString()}`

  // Active exam object for inline viewing
  const activeExam = (materials || []).find((m) => (m._id || m.id) === selectedExamId) || materials?.[0]
  const activeExamIndex = (materials || []).findIndex((m) => (m._id || m.id) === (activeExam?._id || activeExam?.id))

  const cleanActiveUrl = (activeExam?.file_url || '').split('?')[0].toLowerCase()
  const isActivePdf = cleanActiveUrl.endsWith('.pdf')
  const isActiveImage = cleanActiveUrl.endsWith('.png') || cleanActiveUrl.endsWith('.jpg') || cleanActiveUrl.endsWith('.jpeg') || cleanActiveUrl.endsWith('.webp')

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: category.name, href: `/browse/${categorySlug}` },
          { label: semester, href: `/browse/${categorySlug}/${semesterSlug}` },
          { label: course.name }
        ]}
        backTo={`/browse/${categorySlug}/${semesterSlug}`}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1F2937] to-[#111827] text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jimma University · {semester}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {course.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Access curated past exams, chapter slides, worksheets, and interactive practice tests.
          </p>
        </div>

        {/* Action Buttons: Worksheets Mode, Ask AI & Upload */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/ai?course=${encodeURIComponent(course.name)}&category=${encodeURIComponent(category.name)}&semester=${encodeURIComponent(semester)}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI</span>
          </Link>

          <Link
            to={`/browse/${categorySlug}/${semesterSlug}/${courseSlug}/quiz`}
            className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition-all duration-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Worksheets</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>

          <Link
            to={`/upload?category_id=${category.id}&course_id=${course.id}&semester=${encodeURIComponent(semester)}`}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Material</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Resource Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {TYPE_CONFIG.map((t) => {
            const count = t.isQuizLink ? quizCount : (counts[t.key] || 0)
            const isActive = currentType === t.key
            return (
              <button
                key={t.key}
                onClick={() => handleTypeChange(t)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  t.isQuizLink
                    ? 'bg-teal-50 border border-teal-200 text-[#0D9488] hover:bg-[#0D9488] hover:text-white'
                    : isActive
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-teal-800 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.isQuizLink && count > 1 ? `${count} Chapters` : count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search inside course */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in this course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                const next = new URLSearchParams(searchParams)
                next.delete('q')
                setSearchParams(next)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* EXAMS TAB: INLINE PROTECTED DOCUMENT VIEWER                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentType === 'exam' && activeExam && (
        <div id="exam-inline-viewer" className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm select-none">
          {/* Header Bar with Protected Tag & Prev/Next Exam Navigation */}
          <div className="bg-[#1F2937] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                    Exam Reader
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-300 font-medium">
                    {activeExamIndex >= 0 ? `Exam ${activeExamIndex + 1} of ${materials.length}` : 'Exam Preview'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                  {activeExam.title}
                </h2>
              </div>
            </div>

            {/* Prev / Next Buttons & Protected Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (activeExamIndex > 0) {
                    handleSelectExam(materials[activeExamIndex - 1]._id || materials[activeExamIndex - 1].id)
                  }
                }}
                disabled={activeExamIndex <= 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-gray-200 rounded-xl transition"
                title="Previous Exam"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                onClick={() => {
                  if (activeExamIndex < materials.length - 1) {
                    handleSelectExam(materials[activeExamIndex + 1]._id || materials[activeExamIndex + 1].id)
                  }
                }}
                disabled={activeExamIndex >= materials.length - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-gray-200 rounded-xl transition"
                title="Next Exam"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-teal-300 bg-teal-950/70 px-3 py-1.5 rounded-xl border border-teal-800/60">
                <Shield size={12} className="text-teal-400" />
                <span className="font-semibold">Protected View</span>
              </div>
            </div>
          </div>

          {/* Embedded Document View with Dynamic Watermark */}
          <div
            className="relative bg-gray-100 overflow-hidden"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Dynamic Watermark Stamp */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.07] rotate-[-25deg] select-none text-[#1F2937] font-black text-xs sm:text-sm tracking-widest uppercase">
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
            </div>

            {isActivePdf ? (
              <iframe
                src={`${activeExam.file_url}#toolbar=0&navpanes=0`}
                title={activeExam.title}
                className="w-full h-[580px] sm:h-[800px] border-none"
              />
            ) : isActiveImage ? (
              <div className="p-4 sm:p-6 bg-gray-50 flex items-center justify-center min-h-[350px] max-h-[85vh] overflow-y-auto">
                <img
                  src={activeExam.file_url}
                  alt={activeExam.title}
                  className="w-auto max-w-full rounded-xl shadow-xs pointer-events-none"
                />
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold">{activeExam.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Preview is protected. Direct downloads are disabled on NEx.
                </p>
              </div>
            )}
          </div>

          {/* Viewer Footer Note */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-500">
            <span>Official Protected Exam · Read-only inside NEx Platform</span>
            <span>{activeExam.file_size ? `${activeExam.file_size} MB` : 'Exam Material'}</span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION TITLE: FOR EXAMS TAB                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentType === 'exam' && materials.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <span>Available Exams ({materials.length})</span>
          </h2>
          <span className="text-xs text-gray-500">Click any exam below to open in reader</span>
        </div>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center my-6">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No materials found
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            {currentSearch || currentType !== 'all'
              ? 'Try switching tabs or clearing your search filter.'
              : 'Be the first student to upload a material for this course!'}
          </p>
          <Link
            to={`/upload?category_id=${category.id}&course_id=${course.id}&semester=${encodeURIComponent(semester)}`}
            className="inline-flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload for {course.name}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => {
            const uploaderName = m.uploader?.name || 'Jimma Student'
            const uploadDate = new Date(m.created_at).toLocaleDateString()
            const isExam = currentType === 'exam' || m.type === 'exam' || m.type === 'mid_exam' || m.type === 'final_exam'
            const isSelected = (m._id || m.id) === selectedExamId

            const typeLabel = {
              exam: 'Exam (Mid/Final)',
              mid_exam: 'Exam (Mid/Final)',
              final_exam: 'Exam (Mid/Final)',
              worksheet: 'Worksheet',
              questions: 'Worksheet',
              assignment: 'Worksheet',
              notes: 'Notes / Slides',
              teachers_guide: "Teacher's Guide",
              other: "Teacher's Guide",
              project: 'Project'
            }[m.type] || m.type

            // ─────────────────────────────────────────────────────────────
            // EXAM CARD: NO "View Material" button! Clicking selects exam
            // ─────────────────────────────────────────────────────────────
            if (isExam) {
              return (
                <div
                  key={m._id || m.id}
                  onClick={() => handleSelectExam(m._id || m.id)}
                  className={`group cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border ${
                    isSelected
                      ? 'bg-teal-50/60 border-[#0D9488] ring-2 ring-teal-500/20 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-teal-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected ? 'bg-[#0D9488] text-white' : 'bg-teal-50 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          {typeLabel}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{uploaderName}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{uploadDate}</span>
                      </div>

                      <h3 className={`font-bold text-sm sm:text-base line-clamp-2 transition-colors ${
                        isSelected ? 'text-[#0D9488]' : 'text-gray-900 group-hover:text-[#0D9488]'
                      }`}>
                        {m.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{m.file_size ? `${m.file_size} MB` : 'Exam File'}</span>
                        <span>·</span>
                        <span>Protected View (In-Browser)</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean status pill — NO "View Material" button */}
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0D9488] rounded-xl shadow-xs">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Viewing in Reader Above</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0D9488] bg-teal-50 group-hover:bg-[#0D9488] group-hover:text-white rounded-xl transition-colors border border-teal-200/60">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Click to Open</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            }

            // ─────────────────────────────────────────────────────────────
            // NON-EXAM CARD (Worksheets, Notes, Slides, etc.)
            // ─────────────────────────────────────────────────────────────
            return (
              <div
                key={m._id || m.id}
                className="group bg-white border border-gray-200 hover:border-[#0D9488] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {typeLabel}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{uploaderName}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{uploadDate}</span>
                    </div>

                    <Link
                      to={`/resource/${m._id || m.id}`}
                      className="font-bold text-gray-900 group-hover:text-[#0D9488] transition-colors text-sm sm:text-base line-clamp-2"
                    >
                      {m.title}
                    </Link>

                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{m.file_size ? `${m.file_size} MB` : 'File'}</span>
                      <span>·</span>
                      <span>{m.downloads || 0} downloads</span>
                    </div>
                  </div>
                </div>

                {/* Actions: View Material button for non-exams */}
                <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <Link
                    to={`/resource/${m._id || m.id}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Material</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
