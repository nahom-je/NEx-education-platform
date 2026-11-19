import { API_BASE } from '../utils/config';
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  GraduationCap, BookOpen, Code, Cpu, Database, Compass, 
  Wrench, Building2, HeartPulse, Search as SearchIcon, 
  ChevronRight, Sparkles, FileText, Upload, HelpCircle, Layers, Lock
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'

// Map category names to icons
const CATEGORY_ICONS = {
  'Freshman Natural Science': GraduationCap,
  'Freshman Social Science': BookOpen,
  'Software Engineering': Code,
  'Computer Science': Cpu,
  'Information Technology': Database,
  'Information Science': Layers,
  'Aerospace Engineering': Compass,
  'Mechanical Engineering': Wrench,
  'Civil Engineering': Building2,
  'Biomedical Engineering': HeartPulse,
}

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('${API_BASE}/api/browse/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Failed to load categories:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const totalMaterials = categories.reduce((sum, c) => sum + (c.resource_count || 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1F2937] via-[#111827] to-[#0f172a] text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jimma University Student Academic Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
            Find past exams, model tests, worksheets, lecture notes, and practice quizzes for your department.
          </p>

          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearch} className="relative max-w-lg">
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all categories (e.g. Physics Final, Psychology...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3 bg-white text-gray-900 rounded-2xl text-sm placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0D9488] hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick stats */}
          <div className="flex items-center gap-6 mt-6 text-xs text-gray-400">
            <div>
              <span className="font-bold text-white text-sm">{categories.length}</span> Departments
            </div>
            <div>
              <span className="font-bold text-white text-sm">{totalMaterials}</span> Materials Live
            </div>
            <div>
              <span className="font-bold text-teal-300 text-sm">100%</span> Jimma University
            </div>
          </div>
        </div>
      </div>

      {/* Category Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Browse by Department & Category
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Select your faculty to view semesters, courses, and resources.
          </p>
        </div>

        <Link
          to="/upload"
          className="hidden sm:inline-flex items-center gap-1.5 bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#0D9488] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Material</span>
        </Link>
      </div>

      {/* Categories Grid (Level 1) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || BookOpen
            const isNaturalScience = cat.slug === 'freshman-natural-science'
            const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')

            return (
              <Link
                key={cat.id}
                to={`/browse/${slug}`}
                className={`group relative bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  isNaturalScience
                    ? 'border-teal-300 ring-2 ring-teal-500/10 hover:border-[#0D9488]'
                    : 'border-gray-200/90 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                      isNaturalScience
                        ? 'bg-teal-50 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isNaturalScience
                          ? 'bg-teal-50 text-[#0D9488] border border-teal-200/60'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      }`}
                    >
                      {isNaturalScience ? (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>{cat.resource_count || 208} materials · Live</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Locked · In Prep</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 group-hover:text-[#0D9488] transition-colors text-base line-clamp-1">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {isNaturalScience 
                      ? 'Semester 1 (7 core courses live)' 
                      : 'Curriculum materials in preparation'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 text-xs font-semibold transition-colors">
                  <span className={isNaturalScience ? 'text-[#0D9488]' : 'text-gray-400'}>
                    {isNaturalScience ? 'Browse Courses' : 'Locked · Coming Soon'}
                  </span>
                  {isNaturalScience ? (
                    <ChevronRight className="w-4 h-4 text-[#0D9488] transform group-hover:translate-x-1 transition-transform" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
