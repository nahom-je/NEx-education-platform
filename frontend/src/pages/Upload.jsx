import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload as UploadIcon, FileText, CheckCircle, X, AlertCircle, ChevronDown } from 'lucide-react'
import { useResourceStore } from '../contexts/useResourceStore'

const RESOURCE_TYPES = [
  { value: 'mid_exam', label: 'Mid Exam' },
  { value: 'final_exam', label: 'Final Exam' },
  { value: 'assignment', label: 'Worksheet' },
  { value: 'notes', label: 'Notes & Slides' },
  { value: 'teachers_guide', label: "Teacher's Guide" },
  { value: 'project', label: 'Project' }
]

export default function Upload() {
  const [searchParams] = useSearchParams()
  const { categories, fetchCategories, fetchCourses, uploadResource, loading } = useResourceStore()

  const preCategory = searchParams.get('category_id') || ''
  const preSemester = searchParams.get('semester') || ''
  const preCourse = searchParams.get('course_id') || ''

  const [selectedCategory, setSelectedCategory] = useState(preCategory)
  const [selectedSemester, setSelectedSemester] = useState(preSemester)
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(preCourse)
  const [type, setType] = useState('notes')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState(null)
  
  const [dragOver, setDragOver] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Pre-load courses if prefilled from URL
  useEffect(() => {
    if (preCategory) {
      fetchCourses(preCategory, preSemester || null).then((courses) => {
        setAvailableCourses(courses || [])
        if (preCourse) setSelectedCourse(preCourse)
      })
    }
  }, [preCategory, preSemester, preCourse, fetchCourses])

  // Get current category object
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory)
  const hasSemesters = currentCategoryObj?.has_semesters

  // When category changes, load courses or clear
  useEffect(() => {
    if (!selectedCategory) {
      setAvailableCourses([])
      setSelectedCourse('')
      setSelectedSemester('')
      return
    }

    if (hasSemesters) {
      // If category has semesters and none selected yet, default to first semester
      const firstSem = currentCategoryObj.semesters?.[0] || 'Semester 1'
      setSelectedSemester(firstSem)
      fetchCourses(selectedCategory, firstSem).then((courses) => {
        setAvailableCourses(courses || [])
        setSelectedCourse('')
      })
    } else {
      setSelectedSemester('')
      fetchCourses(selectedCategory).then((courses) => {
        setAvailableCourses(courses || [])
        setSelectedCourse('')
      })
    }
  }, [selectedCategory, hasSemesters, currentCategoryObj, fetchCourses])

  // When semester changes (for freshman)
  const handleSemesterChange = async (sem) => {
    setSelectedSemester(sem)
    setSelectedCourse('')
    const courses = await fetchCourses(selectedCategory, sem)
    setAvailableCourses(courses || [])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedCategory) {
      setFormError('Please select a category.')
      return
    }
    if (hasSemesters && !selectedSemester) {
      setFormError('Please select a semester.')
      return
    }
    if (!title.trim()) {
      setFormError('Please enter a title.')
      return
    }
    if (!file) {
      setFormError('Please attach a file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title.trim())
    formData.append('type', type)
    formData.append('category_id', selectedCategory)
    if (hasSemesters && selectedSemester) {
      formData.append('semester', selectedSemester)
    }
    if (selectedCourse) {
      formData.append('course_id', selectedCourse)
    }
    if (description.trim()) {
      formData.append('description', description.trim())
    }
    if (tags.trim()) {
      formData.append('tags', tags.trim())
    }

    try {
      await uploadResource(formData)
      setSubmitted(true)
      // Reset form
      setTitle('')
      setDescription('')
      setTags('')
      setFile(null)
      setSelectedCategory('')
      setSelectedSemester('')
      setSelectedCourse('')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to upload resource')
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-[#0D9488]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Resource Submitted!</h2>
        <p className="text-[#6B7280]">
          Your upload is <span className="font-semibold text-[#F59E0B]">pending admin approval</span>.
          Once approved, it will be visible for all students in the course list.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-[#0D9488] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0f766e] transition shadow-sm"
        >
          Upload Another Resource
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1F2937] mb-1">Share a Study Resource</h1>
        <p className="text-[#6B7280]">Share past exams, notes, assignments, or projects with your fellow Jimma University classmates.</p>
      </div>

      {/* Moderation notice */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
        <p>All uploads are reviewed by platform administrators before becoming publicly accessible.</p>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        
        {/* Step 1: Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#374151]">Category / Department *</label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              required
            >
              <option value="">-- Select a Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Step 2: Semester (Only if Category has semesters) */}
        {hasSemesters && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-sm font-semibold text-[#374151]">Semester *</label>
            <div className="grid grid-cols-2 gap-3">
              {(currentCategoryObj.semesters || ['Semester 1', 'Semester 2']).map((sem) => (
                <button
                  type="button"
                  key={sem}
                  onClick={() => handleSemesterChange(sem)}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition text-center ${
                    selectedSemester === sem
                      ? 'border-[#0D9488] bg-teal-50 text-[#0D9488] font-semibold'
                      : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Course Dropdown */}
        {selectedCategory && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-sm font-semibold text-[#374151]">Course</label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="">
                  {availableCourses.length > 0 ? '-- Select Course --' : '-- No courses registered yet (or General) --'}
                </option>
                {availableCourses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    {crs.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Step 4: Resource Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#374151]">Resource Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {RESOURCE_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium transition capitalize text-center ${
                  type === t.value
                    ? 'border-[#0D9488] bg-teal-50 text-[#0D9488] font-bold shadow-sm'
                    : 'border-[#E5E7EB] text-[#4B5563] hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#374151]">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. General Physics Final Examination 2017"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            required
          />
        </div>

        {/* Step 6: Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#374151]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add brief details about chapters covered, answers included, etc."
            rows={3}
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none"
          />
        </div>

        {/* Step 7: Tags */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#374151]">Tags (Optional)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. physics, exam, optics, midterm (comma-separated)"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        {/* Step 8: File Upload Zone */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#374151]">File *</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition cursor-pointer ${
              dragOver ? 'border-[#0D9488] bg-teal-50' : 'border-[#E5E7EB] hover:border-[#0D9488]'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.zip"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={32} className="text-[#0D9488]" />
                <div className="text-left">
                  <p className="font-semibold text-sm text-[#1F2937] truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-[#6B7280]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <UploadIcon size={36} className="mx-auto text-[#0D9488] opacity-80" />
                <p className="font-semibold text-sm text-[#1F2937]">Drag & drop your file here, or click to browse</p>
                <p className="text-xs text-[#6B7280]">Supports PDF, PNG, JPG, DOCX, PPTX, ZIP (Up to 50 MB)</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold py-3.5 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Submit Resource for Review'}
        </button>
      </form>
    </div>
  )
}
