import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'

export default function Login() {
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  
  const { login, registerUser, isAuthenticated, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // Clear errors when switching modes
  useEffect(() => {
    clearError()
  }, [mode, clearError])

  const onSubmit = async (data) => {
    if (mode === 'signup') {
      await registerUser({ name: data.name, email: data.email, password: data.password })
    } else {
      await login(data.email, data.password)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Left – brand panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0D9488] to-[#059669] text-white flex-col justify-center items-center p-16 gap-8">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur">
          <BookOpen size={40} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-4">NEx</h1>
          <p className="text-xl text-white/80 max-w-sm leading-relaxed">
            The knowledge-sharing platform built for Ethiopian university students.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mt-4 w-full max-w-xs">
          {[
            ['📚', 'Past Exams'],
            ['📝', 'Assignments'],
            ['💬', 'Real-time Chat'],
            ['🎯', 'Course Notes'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right – form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-[#1F2937]">NEx</span>
        </div>

        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8">
          {/* Tab toggle */}
          <div className="flex bg-[#F3F4F6] rounded-xl p-1 mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#6B7280]'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-[#374151] mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                  />
                </div>
                {errors.name && <p className="text-xs text-[#EF4444] mt-1">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="email"
                  placeholder="you@university.edu.et"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                />
              </div>
              {errors.email && <p className="text-xs text-[#EF4444] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-[#374151] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                  className="w-full pl-10 pr-10 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-transparent z-10 relative"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] z-20"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[#EF4444] mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0D9488] text-white font-semibold py-3 rounded-xl
                hover:bg-[#0f766e] active:scale-98 transition-all disabled:opacity-60 mt-1"
            >
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              <ArrowRight size={16} />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-[#D1D5DB] text-sm">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              or
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>

            {/* Google OAuth placeholder */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 border border-[#E5E7EB] rounded-xl py-3 text-sm font-medium text-[#374151]
                hover:bg-[#F9FAFB] transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-[#9CA3AF]">
          By signing in you agree to our{' '}
          <Link to="#" className="text-[#0D9488] underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
