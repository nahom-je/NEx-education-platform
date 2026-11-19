import { useState, useEffect } from 'react'
import { 
  FileText, AlertCircle, Eye, Shield, Maximize2, Minimize2, 
  Presentation, FileSpreadsheet, ZoomIn, ZoomOut, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'

export default function FilePreview({ fileUrl, title }) {
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const { user } = useAuthStore()

  // On mobile (iOS Safari / Android), raw iframe only renders page 1.
  // Google Docs Viewer enables continuous multi-page scrolling through ALL pages.
  const isMobileDevice = typeof window !== 'undefined' && (
    window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  )
  const [pdfEngine, setPdfEngine] = useState(isMobileDevice ? 'google' : 'native')

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Prevent background body scroll when in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  if (!fileUrl) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p className="font-semibold text-gray-700">No document available for preview.</p>
        <p className="text-xs text-gray-400 mt-1">This material may still be processing.</p>
      </div>
    )
  }

  const cleanUrl = fileUrl.split('?')[0].toLowerCase()
  const isPdf = cleanUrl.endsWith('.pdf')
  const isImage = cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.svg')
  const isPresentation = cleanUrl.endsWith('.pptx') || cleanUrl.endsWith('.ppt')
  const isWordDoc = cleanUrl.endsWith('.docx') || cleanUrl.endsWith('.doc') || cleanUrl.endsWith('.txt')
  const isSpreadsheet = cleanUrl.endsWith('.xlsx') || cleanUrl.endsWith('.xls') || cleanUrl.endsWith('.csv')
  const isOfficeDoc = isPresentation || isWordDoc || isSpreadsheet

  // Dynamic watermark text with student identity
  const watermarkText = `${user?.name || 'Jimma Student'} • ${user?.phone || user?.email || 'NEx Platform'} • ${new Date().toLocaleDateString()}`

  // Common wrapper styling that deters right-click and selection
  const handleContextMenu = (e) => {
    e.preventDefault()
  }

  // Pre-calculate embed URLs
  const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
  const googleEmbedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  // ─────────────────────────────────────────────────────────────────────────
  // 1. PRESENTATIONS (PPT / PPTX) AND WORD DOCUMENTS (DOCX / DOC)
  // ─────────────────────────────────────────────────────────────────────────
  if (isOfficeDoc) {
    const currentEmbed = officeEmbedUrl

    return (
      <>
        <div 
          className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
          }`}
          onContextMenu={handleContextMenu}
        >
          {/* Header */}
          <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-sm font-medium truncate min-w-0">
              {isPresentation ? (
                <Presentation size={18} className="text-[#0D9488] shrink-0" />
              ) : (
                <FileText size={18} className="text-[#0D9488] shrink-0" />
              )}
              <span className="truncate">{title || (isPresentation ? 'Presentation' : 'Document')}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
                <Shield size={12} />
                <span className="font-semibold">Protected View</span>
              </div>

              {/* Fullscreen Expand Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Document Frame */}
          <div className={`w-full bg-gray-100 relative ${
            isFullscreen ? 'flex-1 h-[calc(100vh-50px)]' : 'h-[650px] sm:h-[800px]'
          }`}>
            {/* Watermark overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.06] rotate-[-25deg] select-none text-[#1F2937] font-black text-xs sm:text-base tracking-widest uppercase">
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
            </div>

            <iframe
              src={currentEmbed}
              title={title || 'Document Preview'}
              className="w-full h-full border-none"
              onError={() => setLoadError(true)}
            />
          </div>

          {/* Footer bar */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
            <span>Interactive {isPresentation ? 'Slides' : 'Document'} · Scroll & flip through pages</span>
            <span>Protected View (Read-Only)</span>
          </div>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PDF VIEWER (MULTI-PAGE SCROLL ON MOBILE, STANDARD ON DESKTOP)
  // ─────────────────────────────────────────────────────────────────────────
  if (isPdf) {
    const pdfSrc = pdfEngine === 'google' 
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` 
      : `${fileUrl}#toolbar=0&navpanes=0`

    return (
      <>
        <div 
          className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
          }`}
          onContextMenu={handleContextMenu}
        >
          {/* Header */}
          <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-sm font-medium truncate min-w-0">
              <FileText size={18} className="text-[#0D9488] shrink-0" />
              <span className="truncate">{title || 'PDF Document'}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle to allow student to switch engines anytime */}
              <button
                type="button"
                onClick={() => setPdfEngine(prev => prev === 'google' ? 'native' : 'google')}
                className="text-[11px] text-teal-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-700 transition inline-flex items-center gap-1 font-medium"
                title="Switch between all-pages continuous scroll and standard viewer"
              >
                <RefreshCw size={11} />
                <span>{pdfEngine === 'google' ? 'Standard PDF' : 'Scroll All Pages'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
                <Shield size={12} />
                <span className="font-semibold">Protected View</span>
              </div>

              {/* Fullscreen Expand Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Embedded PDF iframe with watermark overlay */}
          <div 
            className={`w-full bg-gray-100 relative ${
              isFullscreen ? 'flex-1 h-[calc(100vh-50px)]' : 'h-[700px] sm:h-[850px]'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Transparent dynamic watermark stamp across the viewer */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.06] rotate-[-25deg] select-none text-[#1F2937] font-black text-xs sm:text-base tracking-widest uppercase">
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
            </div>

            <iframe
              src={pdfSrc}
              title={title || 'PDF Preview'}
              className="w-full h-full border-none"
              onError={() => setLoadError(true)}
            />
          </div>

          {/* Footer note */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
            <span>Scroll vertically through all worksheet pages · Protected read-only</span>
            <span>Jimma University</span>
          </div>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. IMAGE VIEWER (PHOTO EXAMS, DIAGRAMS, SCANNED SHEETS)
  // ─────────────────────────────────────────────────────────────────────────
  if (isImage) {
    return (
      <>
        <div 
          className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
          }`}
          onContextMenu={handleContextMenu}
        >
          {/* Header */}
          <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium truncate min-w-0">
              <Eye size={18} className="text-[#0D9488] shrink-0" />
              <span className="truncate">{title || 'Exam Image'}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom Controls */}
              <button
                type="button"
                onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-xs text-gray-300 min-w-9 text-center font-mono">
                {Math.round(imageZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                className="p-1 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
                <Shield size={12} />
                <span className="font-semibold">Protected View</span>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Scrollable Image viewport */}
          <div className={`p-4 bg-gray-50 flex items-center justify-center overflow-auto relative ${
            isFullscreen ? 'flex-1 h-[calc(100vh-50px)]' : 'min-h-[400px] max-h-[82vh]'
          }`}>
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-[0.07] rotate-[-25deg] select-none text-[#1F2937] font-black text-xs sm:text-sm tracking-widest uppercase">
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
              <div>{watermarkText}</div>
            </div>
            <img
              src={fileUrl}
              alt={title || 'Resource'}
              style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
              className="w-auto max-w-full rounded-lg shadow-sm pointer-events-none transition-transform duration-150"
            />
          </div>
        </div>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. FALLBACK VIEWER (Try Google Docs Viewer for other unknown document extensions)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div 
      className={`bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
      onContextMenu={handleContextMenu}
    >
      <div className="bg-[#1F2937] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium truncate">
          <FileText size={18} className="text-[#0D9488] shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-lg border border-teal-800/50">
          <Shield size={12} />
          <span>Protected View</span>
        </div>
      </div>

      <div className={`w-full bg-gray-100 relative ${
        isFullscreen ? 'flex-1 h-[calc(100vh-50px)]' : 'h-[650px] sm:h-[800px]'
      }`}>
        <iframe
          src={googleEmbedUrl}
          title={title}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  )
}
