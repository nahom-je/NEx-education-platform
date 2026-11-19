import { useState } from 'react'
import { FileText, AlertCircle, Eye, Shield } from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'

export default function FilePreview({ fileUrl, title }) {
  const [loadError, setLoadError] = useState(false)
  const { user } = useAuthStore()

  if (!fileUrl) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p>No file available for preview.</p>
      </div>
    )
  }

  const cleanUrl = fileUrl.split('?')[0].toLowerCase()
  const isPdf = cleanUrl.endsWith('.pdf')
  const isImage = cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.svg')

  // Dynamic watermark text with student identity
  const watermarkText = `${user?.name || 'Jimma Student'} • ${user?.email || 'NEx Platform'} • ${new Date().toLocaleDateString()}`

  // Common wrapper styling that deters right-click and selection
  const handleContextMenu = (e) => {
    e.preventDefault()
  }

  // 1. PDF Viewer with toolbar disabled and dynamic watermark overlay
  if (isPdf) {
    return (
      <div 
        className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none"
        onContextMenu={handleContextMenu}
      >
        <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium truncate">
            <FileText size={18} className="text-[#0D9488] shrink-0" />
            <span className="truncate">{title || 'PDF Document'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
            <Shield size={12} />
            <span>Protected Read-Only</span>
          </div>
        </div>

        {/* Embedded PDF iframe with watermark overlay */}
        <div className="w-full h-[520px] sm:h-[650px] bg-gray-100 relative overflow-hidden">
          {/* Transparent dynamic watermark stamp across the viewer */}
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.08] rotate-[-25deg] select-none text-[#1F2937] font-black text-sm sm:text-base tracking-widest uppercase">
            <div>{watermarkText}</div>
            <div>{watermarkText}</div>
            <div>{watermarkText}</div>
            <div>{watermarkText}</div>
          </div>

          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            title={title || 'PDF Preview'}
            className="w-full h-full border-none"
            onError={() => setLoadError(true)}
          />
        </div>
      </div>
    )
  }

  // 2. Image Viewer
  if (isImage) {
    return (
      <div 
        className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none"
        onContextMenu={handleContextMenu}
      >
        <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium truncate">
            <Eye size={18} className="text-[#0D9488] shrink-0" />
            <span className="truncate">{title || 'Image Preview'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
            <Shield size={12} />
            <span>Protected View</span>
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[300px] max-h-[600px] overflow-auto relative">
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.08] rotate-[-25deg] select-none text-[#1F2937] font-black text-xs sm:text-sm tracking-widest uppercase">
            <div>{watermarkText}</div>
            <div>{watermarkText}</div>
          </div>
          <img
            src={fileUrl}
            alt={title || 'Resource image'}
            className="max-h-[550px] w-auto max-w-full object-contain rounded-lg shadow-sm pointer-events-none"
          />
        </div>
      </div>
    )
  }

  // 3. Fallback for non-previewable formats
  const extMatch = cleanUrl.match(/\.([a-z0-9]+)$/)
  const ext = extMatch ? extMatch[1].toUpperCase() : 'FILE'

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm select-none">
      <div className="w-16 h-16 bg-teal-50 text-[#0D9488] rounded-2xl flex items-center justify-center mx-auto">
        <FileText size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#1F2937] mb-1">{title}</h3>
        <p className="text-sm text-[#6B7280] max-w-md mx-auto">
          Preview is only available for PDF and image formats. Direct downloads are disabled on NEx to protect instructor and student course materials.
        </p>
      </div>
    </div>
  )
}
