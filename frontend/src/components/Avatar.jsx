// Avatar – displays user initials or photo, with optional online status dot.
// size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const sizeMap = {
  xs: { wrap: 'w-7 h-7 text-xs',   dot: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  sm: { wrap: 'w-9 h-9 text-sm',   dot: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  md: { wrap: 'w-11 h-11 text-base', dot: 'w-3 h-3 bottom-0 right-0'       },
  lg: { wrap: 'w-16 h-16 text-xl', dot: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
  xl: { wrap: 'w-24 h-24 text-3xl',dot: 'w-4 h-4 bottom-1 right-1'         },
}

// Derive initials from user name
const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

// Deterministic pastel bg color from name
const getBg = (name = '') => {
  const colors = [
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
  ]
  const idx = (name.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export default function Avatar({ user, size = 'md', showOnline = false, className = '' }) {
  const s = sizeMap[size] || sizeMap.md

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user?.name || 'User'}
          className={`${s.wrap} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`${s.wrap} ${getBg(user?.name)} rounded-full flex items-center justify-center font-semibold select-none ring-2 ring-white`}
          aria-label={user?.name}
        >
          {getInitials(user?.name)}
        </div>
      )}

      {/* Online status dot */}
      {(showOnline || user?.online) && (
        <span
          aria-label="Online"
          className={`absolute ${s.dot} rounded-full bg-[#10B981] ring-2 ring-white`}
        />
      )}
    </div>
  )
}
