import { Link } from 'react-router-dom'
import { Download, FileText, BookOpen, Layers, Tag, Calendar } from 'lucide-react'
import RatingStars from './RatingStars'

// Icon map by resource type
const typeIcon = {
  exam:       <FileText size={14} className="text-[#0D9488]" />,
  assignment: <BookOpen size={14} className="text-[#F59E0B]" />,
  project:    <Layers   size={14} className="text-violet-500" />,
  notes:      <FileText size={14} className="text-blue-400" />,
}

const typeBadge = {
  exam:       'bg-teal-50  text-teal-700',
  assignment: 'bg-amber-50 text-amber-700',
  project:    'bg-violet-50 text-violet-700',
  notes:      'bg-blue-50  text-blue-700',
}

export default function ResourceCard({ resource }) {
  const {
    id, title, university, courseCode, courseName,
    year, type, tags = [], rating = 0, downloads = 0,
    thumbnail, status,
  } = resource

  return (
    <article className="group bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-3
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Top row: type badge + year */}
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge[type] || 'bg-gray-100 text-gray-600'}`}>
          {typeIcon[type]}
          {type?.charAt(0).toUpperCase() + type?.slice(1)}
        </span>
        <span className="flex items-center gap-1 text-xs text-[#6B7280]">
          <Calendar size={12} />
          {year}
        </span>
      </div>

      {/* Title */}
      <Link to={`/resource/${id}`}>
        <h3 className="font-semibold text-[#1F2937] text-base leading-snug line-clamp-2
          group-hover:text-[#0D9488] transition-colors">
          {title}
        </h3>
      </Link>

      {/* Course info */}
      <div className="text-xs text-[#6B7280] space-y-0.5">
        <p className="font-medium text-[#374151]">{university}</p>
        <p>{courseCode && <span className="font-mono bg-[#F3F4F6] px-1.5 py-0.5 rounded mr-1">{courseCode}</span>}{courseName}</p>
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

      {/* Bottom row: rating + downloads + download button */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F3F4F6]">
        <div className="flex items-center gap-2">
          <RatingStars value={rating} size={13} />
          <span className="text-xs text-[#6B7280]">({rating.toFixed(1)})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">
            <Download size={12} className="inline mr-0.5" />{downloads}
          </span>
          {status === 'pending' ? (
            <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">Pending</span>
          ) : (
            <Link
              to={`/resource/${id}`}
              className="flex items-center gap-1 text-xs font-semibold bg-[#0D9488] text-white px-3 py-1.5 rounded-lg
                hover:bg-[#0f766e] active:scale-95 transition-all"
              aria-label={`Download ${title}`}
            >
              <Download size={13} />
              Download
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
