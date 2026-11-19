import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, Search, Bell, Menu, X, Upload, LogOut, Shield, User, Sparkles,
  ShoppingCart, Unlock, ChevronDown
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'
import Avatar from './Avatar'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setProfileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  const isActive = (path) =>
    pathname === path ? 'text-[#0D9488] font-semibold' : 'text-[#6B7280] hover:text-[#0D9488]'

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo with Jimma University sub-brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <img 
            src="/nex-icon.png" 
            alt="NEx Logo" 
            className="w-9 h-9 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" 
          />
          <div className="flex flex-col">
            <span className="text-xl font-black text-[#1F2937] tracking-tight leading-none flex items-center">
              NE<span className="text-[#0D9488]">x</span>
            </span>
            <span className="text-[10px] font-bold text-[#0D9488] tracking-wider uppercase mt-0.5">Jimma University</span>
          </div>
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
          <Link to="/ai" className={`${isActive('/ai')} flex items-center gap-1.5`}>
            <Sparkles size={14} className="text-[#0D9488]" />
            <span>Ask AI</span>
          </Link>
          <Link to="/pricing" className={`${isActive('/pricing')} flex items-center gap-1.5`}>
            <ShoppingCart size={14} />
            <span>Courses</span>
          </Link>
          <Link to="/my-courses" className={`${isActive('/my-courses')} flex items-center gap-1.5`}>
            <Unlock size={14} />
            <span>My Courses</span>
          </Link>
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
          <div className="relative" ref={profileRef}>
            <button
              aria-label="Profile menu"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-full p-1 transition cursor-pointer ${
                profileOpen ? 'ring-2 ring-[#0D9488] bg-teal-50/50' : 'hover:ring-2 hover:ring-[#0D9488]/50'
              }`}
            >
              <Avatar user={user} size="sm" />
              <ChevronDown 
                size={14} 
                className={`text-slate-500 transition-transform duration-200 hidden sm:block ${
                  profileOpen ? 'rotate-180 text-[#0D9488]' : ''
                }`} 
              />
            </button>

            {/* Clickable Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-slate-50/50">
                  <p className="text-sm font-bold text-[#1F2937] truncate">{user?.name || 'Student'}</p>
                  <p className="text-xs text-[#6B7280] font-mono truncate">{user?.phone || user?.email}</p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-[#0D9488] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                      Administrator
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <Link 
                    to="/profile" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1F2937] hover:bg-slate-50 hover:text-[#0D9488] transition cursor-pointer"
                  >
                    <User size={15} className="text-slate-500" />
                    <span>Profile</span>
                  </Link>

                  {user?.role === 'admin' && (
                    <>
                      <Link 
                        to="/admin" 
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1F2937] hover:bg-slate-50 hover:text-[#0D9488] transition cursor-pointer"
                      >
                        <Shield size={15} className="text-teal-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                      <Link 
                        to="/admin/payments" 
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1F2937] hover:bg-slate-50 hover:text-[#0D9488] transition cursor-pointer"
                      >
                        <ShoppingCart size={15} className="text-teal-600" />
                        <span>Manage Payments</span>
                      </Link>
                    </>
                  )}

                  <Link 
                    to="/my-courses" 
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1F2937] hover:bg-slate-50 hover:text-[#0D9488] transition cursor-pointer"
                  >
                    <Unlock size={15} className="text-emerald-600" />
                    <span>My Courses</span>
                  </Link>
                </div>

                <div className="border-t border-[#E5E7EB] pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#EF4444] hover:bg-rose-50 transition text-left cursor-pointer font-medium"
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
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
          <Link to="/ai" onClick={() => setMenuOpen(false)} className={`${isActive('/ai')} flex items-center gap-1.5`}>
            <Sparkles size={14} className="text-[#0D9488]" />
            <span>Ask AI</span>
          </Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className={`${isActive('/pricing')} flex items-center gap-1.5`}>
            <ShoppingCart size={14} />
            <span>Courses / Pricing</span>
          </Link>
          <Link to="/my-courses" onClick={() => setMenuOpen(false)} className={`${isActive('/my-courses')} flex items-center gap-1.5`}>
            <Unlock size={14} />
            <span>My Courses</span>
          </Link>
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
