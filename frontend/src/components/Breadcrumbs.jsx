import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft, Home as HomeIcon } from 'lucide-react'

/**
 * items: Array of { label: string, href?: string }
 * Last item is typically current page (no href).
 */
export default function Breadcrumbs({ items = [], backTo }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-1 text-sm text-gray-500 mb-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => backTo ? navigate(backTo) : navigate(-1)}
          className="mr-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#0D9488] bg-gray-100 hover:bg-teal-50 px-2 py-1 rounded transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-[#0D9488] transition-colors"
        >
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-[#0D9488] transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

