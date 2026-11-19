import { ChevronDown, X } from 'lucide-react'

const TYPES = [
  { value: 'exam', label: 'Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'notes', label: 'Notes' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' }
]

export default function FilterBar({ filters, onChange, categories = [], className = '' }) {
  const set = (key) => (val) => onChange({ ...filters, [key]: val })

  const activeFilters = Object.entries(filters).filter(([, v]) => v)
  const clear = (key) => onChange({ ...filters, [key]: '' })

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Filter selects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={filters.category_id || ''}
            onChange={(e) => onChange({ ...filters, category_id: e.target.value, course_id: '' })}
            className="appearance-none w-full bg-white border border-[#E5E7EB] text-sm text-[#1F2937] rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>

        {/* Resource Type Dropdown */}
        <div className="relative">
          <select
            value={filters.type || ''}
            onChange={(e) => set('type')(e.target.value)}
            className="appearance-none w-full bg-white border border-[#E5E7EB] text-sm text-[#1F2937] rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer capitalize"
          >
            <option value="">All Types (Exam, Notes, etc.)</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>

        {/* Semester Filter */}
        <div className="relative">
          <select
            value={filters.semester || ''}
            onChange={(e) => set('semester')(e.target.value)}
            className="appearance-none w-full bg-white border border-[#E5E7EB] text-sm text-[#1F2937] rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
          >
            <option value="">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeFilters.map(([key, val]) => {
            let label = val
            if (key === 'category_id') {
              label = categories.find(c => c.id === val)?.name || val
            }
            return (
              <button
                key={key}
                onClick={() => clear(key)}
                className="flex items-center gap-1.5 text-xs bg-teal-50 text-[#0D9488] px-3 py-1 rounded-full font-medium hover:bg-teal-100 transition"
              >
                <span>{key}: <strong>{label}</strong></span>
                <X size={12} />
              </button>
            )
          })}
          <button
            onClick={() => onChange({ category_id: '', type: '', semester: '' })}
            className="text-xs text-red-500 hover:underline px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
