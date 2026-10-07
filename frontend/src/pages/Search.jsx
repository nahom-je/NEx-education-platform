import { useState } from 'react'
import { Search as SearchIcon, Grid, List } from 'lucide-react'
import ResourceCard from '../components/ResourceCard'
import FilterBar from '../components/FilterBar'

// Extended mock data
const ALL_RESOURCES = [
  { id: '1',  title: 'Calculus II Final Exam 2017 EC',          university: 'AAU',   courseCode: 'Math 202', courseName: 'Calculus II',        year: '2017 EC', type: 'exam',       tags: ['calculus','final'],    rating: 4.7, downloads: 312, status: 'approved' },
  { id: '2',  title: 'Data Structures Assignment Solutions',     university: 'AASTU', courseCode: 'CS 301',  courseName: 'Data Structures',    year: '2018 EC', type: 'assignment', tags: ['algorithms','DSA'],    rating: 4.2, downloads: 198, status: 'approved' },
  { id: '3',  title: 'Physics I Mid Exam – JU 2018 EC',        university: 'JU',    courseCode: 'Phys 101',courseName: 'Physics I',           year: '2018 EC', type: 'exam',       tags: ['physics','mechanics'], rating: 4.5, downloads: 254, status: 'approved' },
  { id: '4',  title: 'Database Design Final Project',           university: 'MU',    courseCode: 'CS 421',  courseName: 'Database Systems',    year: '2017 EC', type: 'project',    tags: ['SQL','ERD'],           rating: 4.8, downloads: 411, status: 'approved' },
  { id: '5',  title: 'Thermodynamics Lecture Notes',            university: 'BDU',   courseCode: 'ME 302',  courseName: 'Thermodynamics',      year: '2018 EC', type: 'notes',      tags: ['heat','entropy'],      rating: 4.0, downloads: 145, status: 'approved' },
  { id: '6',  title: 'Linear Algebra Exam – 2016 EC',          university: 'HU',    courseCode: 'Math 201',courseName: 'Linear Algebra',      year: '2016 EC', type: 'exam',       tags: ['matrices','vectors'],  rating: 4.3, downloads: 277, status: 'approved' },
  { id: '7',  title: 'Operating Systems Midterm 2017 EC',      university: 'AAU',   courseCode: 'CS 352',  courseName: 'Operating Systems',   year: '2017 EC', type: 'exam',       tags: ['OS','concurrency'],    rating: 4.6, downloads: 300, status: 'approved' },
  { id: '8',  title: 'Circuit Theory Lab Assignment',          university: 'AASTU', courseCode: 'EE 201',  courseName: 'Circuit Theory',      year: '2018 EC', type: 'assignment', tags: ['EE','circuits'],        rating: 3.9, downloads: 120, status: 'approved' },
  { id: '9',  title: 'Machine Learning Notes',                  university: 'AAU',   courseCode: 'CS 481',  courseName: 'Machine Learning',    year: '2018 EC', type: 'notes',      tags: ['AI','ML'],             rating: 4.9, downloads: 520, status: 'approved' },
  { id: '10', title: 'Software Engineering Group Project',      university: 'JU',    courseCode: 'CS 401',  courseName: 'Software Engineering',year: '2017 EC', type: 'project',    tags: ['SDLC','Agile'],        rating: 4.4, downloads: 188, status: 'approved' },
  { id: '11', title: 'Organic Chemistry Exam 2015 EC',         university: 'WU',    courseCode: 'Chem 201',courseName: 'Organic Chemistry',   year: '2015 EC', type: 'exam',       tags: ['chemistry','organic'],  rating: 4.1, downloads: 99,  status: 'approved' },
  { id: '12', title: 'Network Design Project – AASTU',         university: 'AASTU', courseCode: 'CS 464',  courseName: 'Computer Networks',   year: '2018 EC', type: 'project',    tags: ['networking','TCP/IP'], rating: 4.7, downloads: 365, status: 'approved' },
]

export default function Search() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ university: '', type: '', year: '', course: '' })
  const [viewMode, setViewMode] = useState('grid')  // 'grid' | 'list'

  const filtered = ALL_RESOURCES.filter((r) => {
    const q = query.toLowerCase()
    const matchQ = !q ||
      r.title.toLowerCase().includes(q) ||
      r.courseCode.toLowerCase().includes(q) ||
      r.courseName.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    const matchU  = !filters.university || r.university === filters.university
    const matchT  = !filters.type       || r.type === filters.type
    const matchY  = !filters.year       || r.year === filters.year
    const matchC  = !filters.course     ||
      r.courseCode.toLowerCase().includes(filters.course.toLowerCase()) ||
      r.courseName.toLowerCase().includes(filters.course.toLowerCase())
    return matchQ && matchU && matchT && matchY && matchC
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F2937] mb-1">Browse Resources</h1>
        <p className="text-[#6B7280]">Search past exams, notes, assignments and projects from Ethiopian universities</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="search"
          placeholder="Search by title, course code, tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search resources"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm shadow-sm
            focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#1F2937]">{filtered.length}</span> resources found
        </p>
        <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#0D9488] text-white' : 'text-[#6B7280]'}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#0D9488] text-white' : 'text-[#6B7280]'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Results grid/list */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-[#9CA3AF] space-y-3">
          <SearchIcon size={48} className="mx-auto opacity-30" />
          <p className="font-medium text-lg">No resources found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
        }>
          {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </div>
  )
}
