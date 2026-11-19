import { useState, useEffect } from 'react'
import { Search as SearchIcon, Grid, List, BookOpen } from 'lucide-react'
import ResourceCard from '../components/ResourceCard'
import FilterBar from '../components/FilterBar'
import { useResourceStore } from '../contexts/useResourceStore'

export default function Search() {
  const { resources, fetchResources, categories, fetchCategories, loading } = useResourceStore()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ category_id: '', type: '', semester: '' })
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const params = {}
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.type) params.type = filters.type
    if (filters.semester) params.semester = filters.semester
    if (query.trim()) params.search = query.trim()

    fetchResources(params)
  }, [filters, query, fetchResources])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 px-2.5 py-0.5 rounded-full">
            Jimma University
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[#1F2937] mb-1">Browse JU Resources</h1>
        <p className="text-[#6B7280]">
          All materials uploaded here are from Jimma University (JU & JIT) campuses, departments, and curricula.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="search"
          placeholder="Search by title, description, or tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search resources"
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
        />
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />

      {/* Results Header */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#1F2937]">{resources.length}</span> resources found
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

      {/* Results Grid / List */}
      {loading ? (
        <div className="text-center py-24 text-[#6B7280]">
          <p>Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-24 text-[#9CA3AF] space-y-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <BookOpen size={48} className="mx-auto opacity-30 text-[#0D9488]" />
          <p className="font-semibold text-lg text-[#1F2937]">No resources found</p>
          <p className="text-sm text-[#6B7280]">Try adjusting your search query or selecting a different category</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
          {resources.map((r) => (
            <ResourceCard key={r._id || r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  )
}
