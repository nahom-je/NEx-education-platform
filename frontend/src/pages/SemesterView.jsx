import { API_BASE } from '../utils/config';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Search, ChevronRight, FileText, Sparkles, Lock } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

export default function SemesterView() {
  const { categorySlug, semesterSlug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const isNaturalScience = categorySlug === 'freshman-natural-science'

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/browse/${categorySlug}/${semesterSlug}/courses`)
      .then((res) => {
        if (!res.ok) throw new Error('Semester courses not found')
        return res.json()
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [categorySlug, semesterSlug])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-6 w-64 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Courses Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't load the courses for this semester.</p>
        <Link
          to={`/browse/${categorySlug}`}
          className="inline-flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Back to Semesters
        </Link>
      </div>
    )
  }

  const { category, semester, courses = [] } = data

  if (!isNaturalScience) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: category.name, href: `/browse/${categorySlug}` },
            { label: semester }
          ]}
          backTo="/"
        />

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              Department Locked
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {category.name} — {semester}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Curriculum materials and past exams for <strong>{category.name}</strong> are currently under preparation by department tutors. Currently, <strong>Freshman Natural Science</strong> is live and unlockable for students.
            </p>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 max-w-md mx-auto text-xs text-teal-900 flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-[#0D9488] shrink-0" />
            <div>
              <strong>Freshman Natural Science is Live:</strong> All 7 core courses with 208+ verified midterms, exam solutions, and lecture slides are available right now.
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/browse/freshman-natural-science/semester-1"
              className="bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-teal-700 transition shadow-sm"
            >
              View Freshman Natural Science (Semester 1) →
            </Link>
            <Link
              to="/pricing"
              className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              View Pricing &amp; Packages
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: category.name, href: `/browse/${categorySlug}` },
          { label: semester }
        ]}
        backTo={`/browse/${categorySlug}`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{category.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {semester} Courses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick a course to access its exams, worksheets, slides, and interactive quizzes.
          </p>
        </div>

        {/* Search bar inside semester */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
          />
        </div>
      </div>

      {/* Course List / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center my-6">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No courses found matching "{searchTerm}"</p>
          <p className="text-xs text-gray-400 mt-1">Try clearing your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((c) => (
            <Link
              key={c.id}
              to={`/browse/${categorySlug}/${semesterSlug}/${c.slug}`}
              className="group bg-white border border-gray-200 hover:border-[#0D9488] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0D9488] group-hover:text-white transition-colors duration-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 group-hover:bg-teal-50 group-hover:text-[#0D9488] transition-colors">
                  <FileText className="w-3 h-3" />
                  {c.resource_count} materials
                </span>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-[#0D9488] transition-colors line-clamp-2">
                  {c.name}
                </h3>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400 group-hover:text-[#0D9488] transition-colors">
                  <span>Open materials</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

