import { Link, useLocation } from 'react-router-dom'
import { Home, Sparkles, Unlock, User, Upload } from 'lucide-react'

// BottomNav – shown only on mobile (md:hidden). Fixed to bottom of viewport.
const tabs = [
  { to: '/',          icon: Home,     label: 'Home' },
  { to: '/ai',        icon: Sparkles, label: 'Ask AI' },
  { to: '/upload',    icon: Upload,   label: 'Upload' },
  { to: '/my-courses',icon: Unlock,   label: 'My Courses' },
  { to: '/profile',   icon: User,     label: 'Profile' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] flex items-stretch h-16 safe-area-inset-bottom"
    >
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = pathname === to || (to !== '/' && pathname.startsWith(to))
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors
              ${active ? 'text-[#0D9488]' : 'text-[#6B7280]'}`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? 'text-[#0D9488]' : 'text-[#9CA3AF]'}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
