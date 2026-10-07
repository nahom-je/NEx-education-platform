import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload as UploadIcon, FileText, CheckCircle, X, AlertCircle } from 'lucide-react'
import { useResourceStore } from '../contexts/useResourceStore'

const UNIVERSITIES = ['AAU', 'JU', 'MU', 'BDU', 'HU', 'WU', 'AASTU', 'AIT']
const TYPES = ['exam', 'assignment', 'project', 'notes']
const YEARS = ['2018 EC', '2017 EC', '2016 EC', '2015 EC', '2014 EC', '2024 GC', '2023 GC', '2022 GC']

export default function Upload() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [file, setFile] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  
  const { uploadResource, loading: isSubmitting, error } = useResourceStore()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const onSubmit = async (data) => {
    if (!file) return
    
    // Create a real FormData object to send the file as multipart/form-data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', data.title)
    formData.append('type', data.type.toLowerCase())
    formData.append('university', data.university)
    formData.append('courseCode', data.courseCode || 'N/A')
    formData.append('courseName', data.courseName || 'General')
    formData.append('year', data.year)
    if (data.description) formData.append('description', data.description)
    if (data.tags) formData.append('tags', data.tags)

    try {
      await uploadResource(formData)
      setSubmitted(true)
      reset()
      setFile(null)
    } catch (err) {
      console.error('Upload failed', err)
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
          Your upload is <span className="font-semibold text-[#F59E0B]">pending admin review</span>.
          You will be notified once it is approved.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-[#0D9488] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0f766e] transition"
        >
          Upload Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1F2937] mb-1">Upload Resource</h1>
        <p className="text-[#6B7280]">Share exams, notes, assignments, or projects with your classmates.</p>
      </div>

      {/* Pending notice */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
        <p>Uploads require admin approval before becoming publicly visible. Typical review time: 24–48 hrs.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-5">

        {/* File drop zone */}
        <div>
          <label className="text-sm font-semibold text-[#374151] mb-2 block">File *</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-[#0D9488] bg-teal-50' : 'border-[#E5E7EB] hover:border-[#0D9488]'}`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Upload file"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={36} className="text-[#0D9488]" />
                <p className="font-semibold text-[#1F2937]">{file.name}</p>
                <p className="text-sm text-[#6B7280]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button type="button" onClick={() => setFile(null)} className="text-xs text-[#EF4444] flex items-center gap-1">
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#9CA3AF]">
                <UploadIcon size={36} />
                <p className="font-medium text-[#374151]">Drop your file here or click to browse</p>
                <p className="text-xs">PDF, DOCX, PPTX, ZIP, images – max 50 MB</p>
              </div>
            )}
          </div>
          {!file && <p className="text-xs text-[#EF4444] mt-1">File is required</p>}
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Title *</label>
          <input
            type="text"
            placeholder="e.g. Calculus II Final Exam 2017 EC"
            {...register('title', { required: 'Title is required' })}
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
          />
          {errors.title && <p className="text-xs text-[#EF4444] mt-1">{errors.title.message}</p>}
        </div>

        {/* Two-col grid for selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* University */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">University *</label>
            <select
              {...register('university', { required: 'Required' })}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#0D9488] appearance-none"
            >
              <option value="">Select university…</option>
              {UNIVERSITIES.map((u) => <option key={u}>{u}</option>)}
            </select>
            {errors.university && <p className="text-xs text-[#EF4444] mt-1">{errors.university.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Resource Type *</label>
            <select
              {...register('type', { required: 'Required' })}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#0D9488] appearance-none"
            >
              <option value="">Select type…</option>
              {TYPES.map((t) => <option key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            {errors.type && <p className="text-xs text-[#EF4444] mt-1">{errors.type.message}</p>}
          </div>

          {/* Course code */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Course Code</label>
            <input
              type="text"
              placeholder="e.g. Math 202"
              {...register('courseCode')}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {/* Course name */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Course Name</label>
            <input
              type="text"
              placeholder="e.g. Calculus II"
              {...register('courseName')}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          {/* Academic year */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Academic Year *</label>
            <select
              {...register('year', { required: 'Required' })}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-[#0D9488] appearance-none"
            >
              <option value="">Select year…</option>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
            {errors.year && <p className="text-xs text-[#EF4444] mt-1">{errors.year.message}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Tags</label>
            <input
              type="text"
              placeholder="calculus, integration, AAU  (comma-separated)"
              {...register('tags')}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-[#374151] mb-1.5 block">Description</label>
          <textarea
            placeholder="Briefly describe the content, year/semester, and any notes for reviewers…"
            {...register('description')}
            rows={4}
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !file}
          className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white font-bold py-4 rounded-xl
            hover:bg-[#0f766e] transition disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Submitting…
            </span>
          ) : (
            <><UploadIcon size={18} /> Submit for Review</>
          )}
        </button>
      </form>
    </div>
  )
}
