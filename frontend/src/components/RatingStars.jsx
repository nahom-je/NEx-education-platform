import { Star } from 'lucide-react'
import { useState } from 'react'

// RatingStars – interactive or read-only star rating (1-5).
// Props: value (number), onChange (fn, optional), size (number)
export default function RatingStars({ value = 0, onChange, size = 16, className = '' }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className={`flex items-center gap-0.5 ${className}`} role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          disabled={!onChange}
          className={`transition-transform ${onChange ? 'hover:scale-125 cursor-pointer' : 'cursor-default'} disabled:opacity-100`}
        >
          <Star
            size={size}
            className={display >= star ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D1D5DB]'}
          />
        </button>
      ))}
    </div>
  )
}
