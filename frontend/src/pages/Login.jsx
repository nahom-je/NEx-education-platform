import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, Phone, Lock, User, ArrowRight, AlertCircle, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'

export default function Login() {
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [tempPwModal, setTempPwModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [clientError, setClientError] = useState('')

  const { login, registerUser, changePassword, isAuthenticated, mustChangePassword, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (mustChangePassword) {
        setTempPwModal(true)
      } else {
        navigate('/pricing', { replace: true })
      }
    }
  }, [isAuthenticated, mustChangePassword, navigate])

  // Clear errors when switching modes
  const handleModeSwitch = (m) => {
    setMode(m)
    setClientError('')
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setClientError('')
    clearError()

    // 1. Phone validation
    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '')
    if (!cleanPhone) {
      setClientError('Phone number is required.')
      return
    }
    const isValidPhone = /^(\+251|0|251)?[79]\d{8}$/.test(cleanPhone)
    if (!isValidPhone) {
      setClientError('Enter a valid Ethiopian phone number (e.g. 0912345678, 0712345678, or +251912345678).')
      return
    }

    // 2. Password validation
    if (!password || password.length < 8) {
      setClientError('Password must be at least 8 characters long.')
      return
    }

    // 3. Name validation for signup
    if (mode === 'signup') {
      const trimmedName = name.trim()
      if (!trimmedName || trimmedName.length < 2) {
        setClientError('Name must be at least 2 characters long.')
        return
      }
      if (trimmedName.length > 60) {
        setClientError('Name cannot exceed 60 characters.')
        return
      }

      const ok = await registerUser({
        name: trimmedName,
        phone: cleanPhone,
        password
      })
      if (ok) navigate('/pricing', { replace: true })
    } else {
      const ok = await login(cleanPhone, password)
      if (ok && !mustChangePassword) navigate('/pricing', { replace: true })
    }
  }

  const handleChangeTempPassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (!newPassword || newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.')
      return
    }
    const ok = await changePassword('', newPassword)
    if (ok) {
      setTempPwModal(false)
      navigate('/pricing', { replace: true })
    }
  }

  const displayError = clientError || error

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Left – brand panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#1F2937] via-slate-900 to-[#111827] text-white flex-col justify-center items-center p-16 gap-8 border-r border-slate-800">
        <div className="w-24 h-24 bg-white/10 p-3 rounded-3xl flex items-center justify-center backdrop-blur shadow-xl border border-white/10">
          <img src="/nex-icon.png" alt="NEx Icon" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold">
            Jimma University Portal
          </span>
          <h1 className="text-5xl font-black tracking-tight mt-4 mb-2 flex items-center justify-center">
            NE<span className="text-[#0D9488]">x</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
            Share · Learn · Collaborate
          </p>
          <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
            The dedicated academic resource sharing &amp; collaboration hub for Jimma University students and educators.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mt-2 w-full max-w-sm">
          {[
            ['📚', 'JU Past Exams'],
            ['📝', 'Lab & Assignments'],
            ['🏛️', 'JIT & Main Campus'],
            ['🎯', 'Freshman & Dept Notes'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <span className="text-base">{icon}</span><span className="font-medium text-xs text-slate-200">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right – form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <img src="/nex-icon.png" alt="NEx" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
          <div className="flex flex-col">
            <span className="text-2xl font-black text-[#1F2937] leading-none flex items-center">
              NE<span className="text-[#0D9488]">x</span>
            </span>
            <span className="text-[10px] font-bold text-[#0D9488] tracking-wider uppercase">Jimma University</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8">
          {/* Tab toggle */}
          <div className="flex bg-[#F3F4F6] rounded-xl p-1 mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeSwitch(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === m ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#6B7280]'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {displayError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-[#374151] mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (displayError) { setClientError(''); clearError(); }
                    }}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (displayError) { setClientError(''); clearError(); }
                  }}
                  placeholder="09XXXXXXXX or 07XXXXXXXX"
                  className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (displayError) { setClientError(''); clearError(); }
                  }}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-20 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white font-semibold py-3 rounded-xl
                hover:bg-[#0f766e] active:scale-98 transition-all disabled:opacity-60 mt-1 cursor-pointer"
            >
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Forgot Password Section */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
            <p className="text-xs text-gray-500 mb-2">Forgot your password?</p>
            <a
              href="https://t.me/nahomJT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] hover:underline"
            >
              <MessageSquare size={13} />
              Contact Admin on Telegram (@nahomJT) for a temporary password
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#9CA3AF]">
          By signing in you agree to our{' '}
          <Link to="#" className="text-[#0D9488] underline">Terms of Service</Link>
        </p>
      </div>

      {/* Mandatory Change Password Modal (if temporary password set by admin) */}
      {tempPwModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock size={22} />
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">Create New Password</h2>
              <p className="text-xs text-gray-500">
                You logged in with a temporary password from the admin. Please set your permanent password to continue.
              </p>
            </div>

            {pwError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangeTempPassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#374151] mb-1 block">New Password (min 8 characters)</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                {loading ? 'Updating…' : 'Set New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
