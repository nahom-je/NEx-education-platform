import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, Search, Bell, Menu, X, Upload, LogOut, Shield, User,
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'
import Avatar from './Avatar'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) =>
    pathname === path ? 'text-[#0D9488] font-semibold' : 'text-[#6B7280] hover:text-[#0D9488]'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1F2937] tracking-tight">NEx</span>
        </Link>

        {/* Desktop search */}
        <Link
          to="/search"
          className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-[#6B7280] hover:border-[#0D9488] transition-colors text-sm"
        >
          <Search size={16} />
          <span>Search resources, courses, exams…</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/search" className={isActive('/search')}>Browse</Link>
          <Link to="/chat" className={isActive('/chat')}>Chat</Link>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Upload button */}
          <Link
            to="/upload"
            className="hidden md:flex items-center gap-1.5 bg-[#0D9488] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0f766e] transition-colors shrink-0"
          >
            <Upload size={15} />
            Upload
          </Link>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9FAFB] transition"
          >
            <Bell size={20} className="text-[#6B7280]" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F59E0B]" />
          </button>

          {/* Avatar / Profile dropdown */}
          <div className="relative group">
            <button
              aria-label="Profile menu"
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#0D9488] transition"
            >
              <Avatar user={user} size="sm" />
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-12 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
              <div className="px-4 py-2 border-b border-[#E5E7EB]">
                <p className="text-sm font-semibold text-[#1F2937] truncate">{user?.name}</p>
                <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
              </div>
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-[#1F2937] hover:bg-[#F9FAFB]">
                <User size={14} /> Profile
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[#1F2937] hover:bg-[#F9FAFB]">
                  <Shield size={14} /> Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FFF5F5] text-left"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F9FAFB]"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E7EB] px-4 py-4 flex flex-col gap-3 text-sm font-medium shadow-lg">
          <Link to="/" onClick={() => setMenuOpen(false)} className={isActive('/')}>Home</Link>
          <Link to="/search" onClick={() => setMenuOpen(false)} className={isActive('/search')}>Browse</Link>
          <Link to="/chat" onClick={() => setMenuOpen(false)} className={isActive('/chat')}>Chat</Link>
          <Link to="/upload" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 bg-[#0D9488] text-white px-4 py-2 rounded-xl w-fit">
            <Upload size={14} /> Upload Resource
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[#EF4444]">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </header>
  )
}
