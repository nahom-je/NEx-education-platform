import { ChevronDown, X } from 'lucide-react'

const UNIVERSITIES = ['AAU', 'JU', 'MU', 'BDU', 'HU', 'WU', 'AASTU', 'AIT']
const TYPES = ['exam', 'assignment', 'project', 'notes']
const YEARS = ['2017 EC', '2018 EC', '2019 EC', '2016 EC', '2015 EC', '2024 GC', '2023 GC']

function Select({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none w-full bg-white border border-[#E5E7EB] text-sm text-[#1F2937] rounded-lg px-3 py-2 pr-8
          focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
    </div>
  )
}

// FilterBar – row of dropdowns for university, type, year + optional active filter pills
export default function FilterBar({ filters, onChange, className = '' }) {
  const set = (key) => (val) => onChange({ ...filters, [key]: val })

  const activeFilters = Object.entries(filters).filter(([, v]) => v)
  const clear = (key) => onChange({ ...filters, [key]: '' })

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Filter selects — responsive: stack on mobile, row on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select label="University"   value={filters.university || ''} onChange={set('university')} options={UNIVERSITIES} />
        <Select label="Type"         value={filters.type      || ''} onChange={set('type')}       options={TYPES} />
        <Select label="Year"         value={filters.year      || ''} onChange={set('year')}        options={YEARS} />
        <input
          type="text"
          placeholder="Course code / name…"
          value={filters.course || ''}
          onChange={(e) => set('course')(e.target.value)}
          aria-label="Course filter"
          className="bg-white border border-[#E5E7EB] text-sm rounded-lg px-3 py-2
            focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent col-span-2 md:col-span-1"
        />
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(([key, val]) => (
            <button
              key={key}
              onClick={() => clear(key)}
              className="flex items-center gap-1 text-xs bg-[#E0F2F1] text-[#0D9488] px-2.5 py-1 rounded-full font-medium hover:bg-[#ccebe8] transition"
            >
              {val}
              <X size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
