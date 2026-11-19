import { Link } from 'react-router-dom'
import { Download, FileText, BookOpen, Layers, Tag, Calendar, Folder } from 'lucide-react'

// Icon map by resource type
const typeIcon = {
  exam:       <FileText size={14} className="text-[#0D9488]" />,
  assignment: <BookOpen size={14} className="text-[#F59E0B]" />,
  project:    <Layers   size={14} className="text-violet-500" />,
  notes:      <FileText size={14} className="text-blue-500" />,
  other:      <FileText size={14} className="text-gray-500" />
}

const typeBadge = {
  exam:       'bg-teal-50   text-teal-700',
  assignment: 'bg-amber-50  text-amber-700',
  project:    'bg-violet-50 text-violet-700',
  notes:      'bg-blue-50   text-blue-700',
  other:      'bg-gray-100  text-gray-700'
}

export default function ResourceCard({ resource }) {
  const {
    id, _id, title, categoryName, courseName, category, course,
    semester, type = 'notes', tags = [], downloads = 0, status
  } = resource

  const resourceId = _id || id
  const displayCategory = category?.name || categoryName || ''
  const displayCourse = course?.name || courseName || ''

  return (
    <article className="group bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-3
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Top row: type badge + semester */}
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge[type] || 'bg-gray-100 text-gray-600'}`}>
          {typeIcon[type] || typeIcon.notes}
          {type?.charAt(0).toUpperCase() + type?.slice(1)}
        </span>
        {semester && (
          <span className="flex items-center gap-1 text-xs text-[#6B7280] font-medium bg-gray-50 px-2 py-0.5 rounded-md">
            <Calendar size={12} />
            {semester}
          </span>
        )}
      </div>

      {/* Title */}
      <Link to={`/resource/${resourceId}`}>
        <h3 className="font-semibold text-[#1F2937] text-base leading-snug line-clamp-2
          group-hover:text-[#0D9488] transition-colors">
          {title}
        </h3>
      </Link>

      {/* Category & Course info */}
      <div className="text-xs text-[#6B7280] space-y-1">
        <p className="text-[11px] font-semibold text-[#0D9488] flex items-center gap-1">
          <span>Jimma University</span>
          {displayCategory && <span>· {displayCategory}</span>}
        </p>
        {displayCourse && (
          <p className="text-[#374151] font-medium truncate">
            {displayCourse}
          </p>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((t) => (
            <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280]">
              <Tag size={9} /> {t}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: downloads counter + View/Download button */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F3F4F6]">
        <span className="text-xs font-medium text-[#6B7280] flex items-center gap-1">
          <Download size={13} className="text-[#0D9488]" />
          {downloads} {downloads === 1 ? 'download' : 'downloads'}
        </span>

        {status === 'pending' ? (
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            Pending
          </span>
        ) : (
          <Link
            to={`/resource/${resourceId}`}
            className="flex items-center gap-1 text-xs font-semibold bg-[#0D9488] text-white px-3 py-1.5 rounded-lg
              hover:bg-[#0f766e] active:scale-95 transition-all"
            aria-label={`View ${title}`}
          >
            Open & View
          </Link>
        )}
      </div>
    </article>
  )
}
