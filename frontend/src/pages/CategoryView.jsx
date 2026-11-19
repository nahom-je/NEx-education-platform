import { API_BASE } from '../utils/config';
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ChevronRight, Lock, Sparkles } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

export default function CategoryView() {
  const { categorySlug } = useParams()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/browse/${categorySlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Category not found')
        return res.json()
      })
      .then((data) => {
        setCategory(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [categorySlug])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Category Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the category you're looking for.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    )
  }

  const isNaturalScience = categorySlug === 'freshman-natural-science'

  // If this department is NOT Freshman Natural Science, show the clean locked notice
  if (!isNaturalScience) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs items={[{ label: category.name }]} backTo="/" />

        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              Department Locked
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {category.name} Materials
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Curriculum materials and past exams for <strong>{category.name}</strong> are currently under preparation by our academic team. Currently, <strong>Freshman Natural Science</strong> is live and unlockable for students.
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
              to="/browse/freshman-natural-science"
              className="bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-teal-700 transition shadow-sm"
            >
              View Freshman Natural Science →
            </Link>
            <Link
              to="/pricing"
              className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              View Packages &amp; Pricing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const semesters = category.semesters?.length > 0 
    ? category.semesters 
    : ['Semester 1']

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: category.name }
        ]}
        backTo="/"
      />

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Jimma University Curriculum</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {category.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select your semester to view courses, midterms, final exam solutions, and lecture slides.
        </p>
      </div>

      {/* Semesters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {semesters.map((sem) => {
          const semSlug = sem.toLowerCase().replace(/\s+/g, '-')
          return (
            <Link
              key={sem}
              to={`/browse/${categorySlug}/${semSlug}`}
              className="group relative bg-white border border-gray-200 hover:border-[#0D9488] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center group-hover:bg-[#0D9488] group-hover:text-white transition-colors duration-200">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0D9488] transition-colors">
                    {sem}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click to view courses &amp; materials
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-teal-50 text-gray-400 group-hover:text-[#0D9488] flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
