// frontend/src/pages/Pricing.jsx
// NEx Semester & Department Package Store.
// Pricing Model: 50 ETB per entire semester package (e.g., Freshman 1st Semester)
// or department package (e.g., Software Engineering, Computer Science),
// NOT 50 ETB per individual course.

import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Lock, Unlock, Clock, XCircle, ShoppingCart, BookOpen, ChevronRight, Sparkles,
  CreditCard, Send, ShieldCheck, CheckCircle2, Search, ArrowRight, Zap,
  Check, HelpCircle, FileText, Award, Smartphone, GraduationCap, X, ChevronDown, ChevronUp, Package
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'
import { usePaymentStore } from '../contexts/usePaymentStore'
import api from '../utils/api'

export default function Pricing() {
  const { user } = useAuthStore()
  const { settings, fetchSettings, myAccess, fetchMyAccess } = usePaymentStore()
  const navigate = useNavigate()

  const [categoriesData, setCategoriesData] = useState([]) // array of { category, courses }
  const [courseStatuses, setCourseStatuses] = useState({}) // courseId → status object
  const [loading, setLoading] = useState(true)
  const [selectedPackages, setSelectedPackages] = useState([]) // array of package objects
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPackageId, setExpandedPackageId] = useState(null)
  const [activeFaq, setActiveFaq] = useState(null)

  useEffect(() => {
    fetchSettings()
    fetchMyAccess()
  }, [fetchSettings, fetchMyAccess])

  // Fetch all categories and their courses safely
  useEffect(() => {
    async function loadData() {
      try {
        const { data: cats } = await api.get('/categories')
        const items = await Promise.all(
          (cats || []).map(async (cat) => {
            try {
              const { data: courses } = await api.get(`/categories/${cat.id}/courses`)
              return { category: cat, courses: courses || [] }
            } catch {
              return { category: cat, courses: [] }
            }
          })
        )
        setCategoriesData(items)
      } catch (err) {
        console.error('Failed to load pricing data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Check access & pending status for loaded courses
  useEffect(() => {
    if (!categoriesData.length) return

    const allCourses = categoriesData.flatMap(item => item.courses)
    if (!allCourses.length) return

    const statuses = {}
    allCourses.forEach(c => {
      const access = myAccess.find(a => a.course_id === c.id)
      if (access?.status === 'unlocked') statuses[c.id] = { status: 'unlocked' }
      else if (access?.status === 'revoked') statuses[c.id] = { status: 'revoked' }
      else statuses[c.id] = { status: 'locked' }
    })
    setCourseStatuses(statuses)

    // Check backend for pending or rejected states
    Promise.all(
      allCourses.map(c =>
        api.get(`/payments/course-status/${c.id}`)
          .then(r => ({ id: c.id, ...r.data }))
          .catch(() => ({ id: c.id, status: 'locked' }))
      )
    ).then(results => {
      const updated = { ...statuses }
      results.forEach(r => {
        updated[r.id] = r
      })
      setCourseStatuses(updated)
    })
  }, [categoriesData, myAccess])

  const pricePerPackage = parseInt(settings?.course_price || '70')

  // Generate unified packages list from categories:
  // ONLY Freshman Natural Science is currently live with materials (208+ resources).
  // All other departments stay locked and under preparation.
  const packages = useMemo(() => {
    const list = []

    categoriesData.forEach(({ category: cat, courses }) => {
      const isNaturalScience = cat.slug === 'freshman-natural-science'

      if (cat.has_semesters) {
        const semesters = cat.semesters && cat.semesters.length > 0 
          ? cat.semesters 
          : ['Semester 1', 'Semester 2']

        semesters.forEach(sem => {
          const semCourses = courses.filter(c => 
            (c.semester || '').toLowerCase() === sem.toLowerCase()
          )

          if (semCourses.length > 0) {
            const courseIds = semCourses.map(c => c.id)
            const isUnlocked = isNaturalScience && semCourses.length > 0 && semCourses.every(c => courseStatuses[c.id]?.status === 'unlocked')
            const isPending = isNaturalScience && semCourses.some(c => courseStatuses[c.id]?.status === 'pending')

            list.push({
              id: `${cat.id}-${sem.replace(/\s+/g, '-').toLowerCase()}`,
              name: `${cat.name} — ${sem}`,
              categoryName: cat.name,
              categorySlug: cat.slug || '',
              semester: sem,
              semesterSlug: sem.toLowerCase().replace(/\s+/g, '-'),
              type: 'semester',
              courses: semCourses,
              courseIds,
              price: pricePerPackage,
              isUnlocked,
              isPending,
              isAvailable: isNaturalScience,
              isLockedDepartment: !isNaturalScience,
              description: isNaturalScience
                ? `Complete academic package for Freshman Natural Science (${sem}). Unlocks all ${semCourses.length} core courses, 208+ verified midterms, final exam solutions, lecture slides, and notes for a one-time 70 ETB.`
                : `Academic materials for ${cat.name} (${sem}) are currently under preparation by tutors. This department is currently locked.`
            })
          }
        })
      } else {
        // Department package
        list.push({
          id: cat.id,
          name: `${cat.name} Department Package`,
          categoryName: cat.name,
          categorySlug: cat.slug || '',
          semester: null,
          type: 'department',
          courses,
          courseIds: courses.map(c => c.id),
          price: pricePerPackage,
          isUnlocked: false,
          isPending: false,
          isAvailable: false,
          isLockedDepartment: true,
          description: `Curriculum materials for ${cat.name} are currently being compiled. This department is currently locked.`
        })
      }
    })

    // Sort Freshman Natural Science to the top
    list.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0))

    return list
  }, [categoriesData, courseStatuses, pricePerPackage])

  // Filter packages based on search query
  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return packages

    return packages.filter(pkg => 
      pkg.name.toLowerCase().includes(q) ||
      pkg.categoryName.toLowerCase().includes(q) ||
      pkg.courses.some(c => c.name.toLowerCase().includes(q))
    )
  }, [packages, searchQuery])

  const togglePackage = (pkg) => {
    if (pkg.isLockedDepartment) return
    setSelectedPackages(prev => {
      const exists = prev.find(p => p.id === pkg.id)
      if (exists) return prev.filter(p => p.id !== pkg.id)
      return [...prev, pkg]
    })
  }

  const handleCheckout = () => {
    if (!selectedPackages.length) return
    const allCourseIds = Array.from(new Set(selectedPackages.flatMap(p => p.courseIds))).join(',')
    const packageNames = encodeURIComponent(selectedPackages.map(p => p.name).join(' + '))
    const packageCount = selectedPackages.length

    const targetUrl = `/payment?courses=${allCourseIds}&packages=${packageNames}&count=${packageCount}`
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`)
      return
    }
    navigate(targetUrl, { state: { selectedPackages } })
  }

  const totalETB = selectedPackages.length * pricePerPackage
  const unlockedPackages = packages.filter(p => p.isUnlocked)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Loading Semester Packages…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-slate-50/50 to-white pb-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        
        {/* ── HERO BANNER ── */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1F2937] via-slate-900 to-[#111827] text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-800">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Full Semester &amp; Department Bundles</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              One Payment. <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Entire Semester.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Pay just <span className="font-extrabold text-white bg-teal-500/30 px-2 py-0.5 rounded-md border border-teal-400/40">70 ETB</span> for the entire{' '}
              <strong>Freshman First Semester</strong> package — unlocking all past exams, lecture notes, and worksheets across all 7 courses.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>70 ETB Covers All Courses in Semester</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Fast Telegram Activation (@nahomJT)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CBE &amp; Telebirr Accepted</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── UNLOCKED BANNER ── */}
        {unlockedPackages.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-300/70 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  You have unlocked {unlockedPackages.length} package{unlockedPackages.length > 1 ? 's' : ''}!
                </p>
                <p className="text-xs text-slate-600">Access all curriculum files, past exams, and lecture slides.</p>
              </div>
            </div>
            <Link 
              to="/my-courses" 
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-sm shrink-0"
            >
              My Unlocked Courses <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── 3-STEP INSTRUCTIONS ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4" />
                <span>Simple 3-Step Activation</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">How Semester Package Access Works</h2>
            </div>
            <a
              href="https://t.me/nahomJT"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition"
            >
              <Send className="w-3.5 h-3.5 text-teal-600" />
              <span>Admin Telegram: @nahomJT</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-900">Select Package (70 ETB)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose your semester package (<strong>Freshman Natural Science — Semester 1</strong>). 70 ETB unlocks all 7 core subjects.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  2
                </div>
                <h3 className="font-bold text-sm text-slate-900">Transfer 70 ETB</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send 70 ETB via <strong>CBE</strong> or <strong>Telebirr</strong> to the account shown on checkout and save your receipt screenshot.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  3
                </div>
                <h3 className="font-bold text-sm text-slate-900">Instant Telegram Unlock</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Forward your screenshot to <strong>@nahomJT</strong> on Telegram. Admin verifies and unlocks the entire semester package immediately!
              </p>
            </div>
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search packages (e.g. Freshman Natural, Social Science, Physics, Software)..."
            className="w-full text-sm bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notice Banner: Natural Science is currently the active department */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">Current Active Enrollment: Freshman Natural Science</h3>
              <p className="text-xs text-teal-200/90 mt-0.5">
                70 ETB unlocks all 7 core courses with 208+ verified materials. Other departments stay locked while our tutors compile and verify materials.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-bold bg-teal-400 text-slate-950 px-3 py-1.5 rounded-xl shadow-xs">
            Live Package
          </span>
        </div>

        {/* ── PACKAGE CARDS GRID ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0D9488]" />
              <span>Available Semester &amp; Department Packages</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {filteredPackages.length} package{filteredPackages.length > 1 ? 's' : ''} listed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredPackages.map(pkg => {
              const isSelected = selectedPackages.some(p => p.id === pkg.id)
              const isExpanded = expandedPackageId === pkg.id

              return (
                <div
                  key={pkg.id}
                  className={`bg-white border rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md ${
                    pkg.isLockedDepartment
                      ? 'border-slate-200/80 bg-slate-50/40 opacity-85'
                      : isSelected 
                      ? 'border-[#0D9488] ring-2 ring-[#0D9488]/20 bg-teal-50/20' 
                      : pkg.isUnlocked
                      ? 'border-emerald-300/80 bg-emerald-50/10'
                      : 'border-teal-200/80 ring-1 ring-teal-500/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Package Info */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {pkg.isLockedDepartment ? (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600" />
                            Locked · Coming Soon
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[#0D9488]" />
                            Live Package · {pkg.price} ETB
                          </span>
                        )}

                        {pkg.semester && (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {pkg.semester}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                          {pkg.courses.length} courses {pkg.isAvailable ? 'included' : 'planned'}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {pkg.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                        {pkg.description}
                      </p>

                      {/* Course preview tag cloud */}
                      <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Includes:
                        </span>
                        {pkg.courses.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Materials being prepared by department instructors
                          </span>
                        ) : (
                          pkg.courses.map((course, idx) => (
                            <span 
                              key={course.id || idx}
                              className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border ${
                                pkg.isLockedDepartment
                                  ? 'text-slate-500 bg-slate-100/70 border-slate-200'
                                  : 'text-slate-700 bg-slate-100 border-slate-200/80'
                              }`}
                            >
                              {course.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right: Pricing & Action Button */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <p className="text-2xl font-black text-slate-900 tracking-tight">
                          {pkg.price} <span className="text-xs font-bold text-slate-500">ETB total</span>
                        </p>
                        <p className="text-[11px] text-teal-700 font-semibold">
                          {pkg.isAvailable ? 'One-time lifetime access' : 'Available when published'}
                        </p>
                      </div>

                      {pkg.isLockedDepartment ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl select-none cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Department Locked</span>
                        </div>
                      ) : pkg.isUnlocked ? (
                        <Link
                          to={`/browse/${pkg.categorySlug}${pkg.semesterSlug ? `/${pkg.semesterSlug}` : ''}`}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm cursor-pointer"
                        >
                          <span>Access Package</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : pkg.isPending ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Under Review</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => togglePackage(pkg)}
                          className={`inline-flex items-center justify-center gap-2 text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer ${
                            isSelected
                              ? 'bg-[#0D9488] text-white hover:bg-teal-700 ring-2 ring-teal-400/30'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Selected Package ({pkg.price} ETB)</span>
                            </>
                          ) : (
                            <>
                              <span>+ Get Whole Package · {pkg.price} ETB</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── FAQ SECTION ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-[#0D9488]" />
            <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                q: 'Does 70 ETB cover the entire semester or just one course?',
                a: '70 ETB covers the ENTIRE semester package! For example, purchasing Freshman Natural Science Semester 1 unlocks all 7 courses (Physics, Math, English, Geography, Logic, Psychology, Physical Fitness) at once.'
              },
              {
                q: 'How fast is my payment verified?',
                a: 'Once you transfer via CBE or Telebirr and send your receipt screenshot to @nahomJT on Telegram, our admin approves and unlocks your entire semester package within 5 to 15 minutes.'
              },
              {
                q: 'What materials are included inside the package?',
                a: 'Every course inside the semester includes official final exams with solutions, midterms, lecture presentation slides, and chapter summary sheets.'
              },
              {
                q: 'Is this a monthly subscription or lifetime access?',
                a: 'It is a one-time lifetime payment of 70 ETB per semester. You will always maintain access to your unlocked materials.'
              }
            ].map((faq, i) => (
              <div key={i} className="py-3">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-800 hover:text-[#0D9488] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-90 text-[#0D9488]' : ''}`} />
                </button>
                {activeFaq === i && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="text-center py-4 space-y-2">
          <a
            href="https://t.me/nahomJT"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 border border-teal-200/70 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-xs"
          >
            <Send className="w-4 h-4 text-[#0D9488]" />
            <span>Questions or need manual assistance? Contact admin on Telegram <strong>@nahomJT</strong></span>
          </a>
        </div>

      </div>

      {/* ── FLOATING CHECKOUT BAR (Visible when package is selected) ── */}
      {selectedPackages.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex justify-center z-40 px-4 pointer-events-none">
          <div className="pointer-events-auto bg-[#1F2937]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 max-w-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
                <p className="text-xs text-slate-300 font-medium truncate">
                  {selectedPackages.length} Package Selected
                </p>
              </div>
              <p className="text-base sm:text-xl font-black text-white tracking-tight">
                {totalETB} ETB <span className="text-[11px] sm:text-xs font-normal text-slate-400">total</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedPackages([])}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer hidden sm:block"
              >
                Clear
              </button>
              <button
                onClick={handleCheckout}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#0D9488] hover:bg-teal-600 text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg hover:shadow-teal-500/25 cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>Checkout ({totalETB} ETB)</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
