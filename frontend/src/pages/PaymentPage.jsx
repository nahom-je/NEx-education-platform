import { API_BASE, SOCKET_URL } from '../utils/config';
// frontend/src/pages/PaymentPage.jsx
// Full payment flow: draft creation → claim → pending tracker.

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Copy, Check, Send, AlertCircle, Clock, CheckCircle2,
  ArrowLeft, Smartphone, Building2, ExternalLink, X, Package
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'
import { usePaymentStore } from '../contexts/usePaymentStore'
import api from '../utils/api'
import { io } from 'socket.io-client'

export default function PaymentPage() {
  const { user } = useAuthStore()
  const { settings, fetchSettings, createDraft, claimRequest, cancelRequest, remindAdmin } = usePaymentStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const courseIds = searchParams.get('courses')?.split(',').filter(Boolean) || []
  const rawPackages = searchParams.get('packages') || ''
  const packageCount = Math.max(1, parseInt(searchParams.get('count') || '1'))
  const packageNames = rawPackages ? decodeURIComponent(rawPackages).split(' + ') : []

  // Form state
  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [paymentMethod, setPaymentMethod] = useState('cbe')
  const [step, setStep] = useState('form')   // 'form' | 'payment' | 'pending' | 'approved' | 'rejected'

  // Draft data (returned by API)
  const [draft, setDraft] = useState(null)   // { request, courses, amount, paymentCode }

  // UI state
  const [copied, setCopied] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderCooldown, setReminderCooldown] = useState(false)

  // Socket
  const socketRef = useRef(null)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Socket.io: listen for real-time approval/rejection
  useEffect(() => {
    if (!draft || step !== 'pending') return

    const socket = io('${API_BASE}')
    socketRef.current = socket

    socket.emit('join:student', user.id)

    socket.on('payment:approved', ({ requestId }) => {
      if (requestId === draft.request.id) setStep('approved')
    })

    socket.on('payment:rejected', ({ requestId, reason }) => {
      if (requestId === draft.request.id) {
        setStep('rejected')
        setError(reason)
      }
    })

    return () => socket.disconnect()
  }, [draft, step, user])

  const adminTelegramHandle = settings?.telegram_admin_handle || 'nahomJT'
  const price = parseInt(settings?.course_price || '70')
  const totalAmount = packageCount * price

  // ── Helpers ──────────────────────────────────────────────

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const accountDetail = paymentMethod === 'cbe'
    ? { number: settings?.cbe_account_number || '', name: settings?.cbe_account_name || '' }
    : { number: settings?.telebirr_number || '', name: settings?.telebirr_name || '' }

  // ── Step 1: Create draft ──────────────────────────────────

  const handleCreateDraft = async (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) return setError('Full name is required.')
    if (!phone.trim()) return setError('Phone number is required.')
    if (!courseIds.length) return setError('No courses selected.')

    setLoading(true)
    try {
      const data = await createDraft({ 
        courseIds, 
        packageCount, 
        packageNames, 
        fullName, 
        phone 
      })
      setDraft(data)
      setStep('payment')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment request.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Claim ─────────────────────────────────────────

  const handleClaim = async () => {
    setError('')
    setShowConfirmModal(true)
  }

  const handleConfirmClaim = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
      await claimRequest(draft.request.id, { paymentMethod })
      setStep('pending')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this payment request?')) return
    try {
      await cancelRequest(draft.request.id)
      navigate('/pricing')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel.')
    }
  }

  const handleRemind = async () => {
    setReminderCooldown(true)
    try {
      await remindAdmin(draft.request.id)
      setReminderSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remind.')
    }
    setTimeout(() => setReminderCooldown(false), 3600000)
  }

  // Telegram pre-filled message
  const packageLabel = packageNames.length > 0 ? packageNames.join(' + ') : 'Semester Package'
  const telegramMessage = draft
    ? encodeURIComponent(
        `Hello @${adminTelegramHandle},\nName: ${fullName}\nPayment Code: ${draft.paymentCode}\nPackage: ${packageLabel} (${(draft.courses || []).length} courses included)\nAmount: ${draft.amount} ETB\nPayment Method: ${paymentMethod.toUpperCase()}\n\n[Please attach your payment screenshot]`
      )
    : ''
  const telegramUrl = `https://t.me/${adminTelegramHandle}?text=${telegramMessage}`

  // ── Render ────────────────────────────────────────────────

  if (step === 'approved') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment Verified
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Granted! 🎉</h2>
          <p className="text-sm text-slate-600 max-w-xs mx-auto">
            Your payment has been confirmed by the admin. All course materials are now permanently unlocked in your account.
          </p>
        </div>
        <Link 
          to="/my-courses" 
          className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-teal-700 text-white font-bold px-6 py-3.5 rounded-xl transition shadow-md hover:shadow-teal-500/20"
        >
          <span>Go to My Courses</span>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
    )
  }

  if (step === 'rejected') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Not Verified</h2>
          <p className="text-xs text-slate-500">The administrator reviewed your request with the note below:</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left space-y-1">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Admin Feedback</p>
          <p className="text-sm font-medium text-rose-700">{error || 'Receipt does not match or was not received.'}</p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-sm"
          >
            Review Courses &amp; Try Again
          </button>
          <a
            href={`https://t.me/${adminTelegramHandle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 transition"
          >
            <Send className="w-3.5 h-3.5 text-teal-600" />
            <span>Chat directly with Admin on Telegram (@{adminTelegramHandle})</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Checkout Order</h1>
            <p className="text-xs text-slate-500 font-medium">
              Step {step === 'form' ? 1 : step === 'payment' ? 2 : 3} of 3: {
                step === 'form' ? 'Student Information' : step === 'payment' ? 'Manual Transfer & Receipt' : 'Admin Review'
              }
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-full">
          {price} ETB / course
        </span>
      </div>

      {/* Modern Progress tracker */}
      <div className="flex gap-2">
        {['form', 'payment', 'pending'].map((s, i) => {
          const currentIndex = ['form', 'payment', 'pending'].indexOf(step)
          const isDone = currentIndex > i
          const isCurrent = currentIndex === i

          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isCurrent 
                  ? 'bg-[#0D9488]' 
                  : isDone 
                  ? 'bg-teal-600' 
                  : 'bg-slate-200'
              }`}
            />
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Name + Phone form ── */}
      {step === 'form' && (
        <form onSubmit={handleCreateDraft} className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-[#1F2937]">Your Details</h2>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Abebe Girma"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0912345678"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                required
              />
            </div>
          </div>

          {/* Package & Course summary */}
          <div className="bg-teal-50 border border-teal-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  {packageNames.length > 0 ? packageNames.join(' + ') : 'Semester Package'}
                </p>
                <p className="text-xs text-teal-700 font-medium mt-0.5">
                  Includes all {courseIds.length} course{courseIds.length > 1 ? 's' : ''} in this package
                </p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-2.5 py-1 rounded-lg shrink-0">
                Full Package
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              One-time payment of 50 ETB unlocks all past exams, lecture notes, slides, and worksheets for every subject in this package.
            </p>

            <div className="mt-2 pt-2.5 border-t border-teal-200 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Total Amount</span>
              <span className="text-lg font-black text-[#0D9488]">{totalAmount} ETB</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Processing…' : `Continue to Payment (${totalAmount} ETB) →`}
          </button>
        </form>
      )}

      {/* ── STEP 2: Payment instructions ── */}
      {step === 'payment' && draft && (
        <div className="space-y-5">
          {/* Order summary */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-[#1F2937]">Order Summary</h2>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                50 ETB Package
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-slate-900 text-sm">
                {packageNames.length > 0 ? packageNames.join(' + ') : 'Semester Package'}
              </p>
              <p className="text-slate-500 leading-relaxed">
                Includes all {(draft.courses || []).length} courses: {(draft.courses || []).map(c => c.name).join(', ')}
              </p>
            </div>

            <div className="border-t pt-2.5 flex justify-between items-center font-bold">
              <span className="text-sm text-slate-700">Total Price</span>
              <span className="text-lg text-[#0D9488] font-black">{draft.amount} ETB</span>
            </div>
          </div>

          {/* Payment code */}
          <div className="bg-[#1F2937] text-white rounded-2xl p-5 space-y-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Your Payment Code</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black tracking-widest text-[#0D9488]">{draft.paymentCode}</span>
              <button
                onClick={() => copyToClipboard(draft.paymentCode, 'code')}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'code' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Write this code in your payment note and in your Telegram message.</p>
          </div>

          {/* Payment method selector */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-[#1F2937]">Pay Via</h2>

            <div className="flex gap-3">
              {[
                { key: 'cbe', label: 'CBE', icon: Building2 },
                { key: 'telebirr', label: 'Telebirr', icon: Smartphone }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                    paymentMethod === key
                      ? 'border-[#0D9488] bg-teal-50 text-[#0D9488]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Account details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Account Name</p>
                  <p className="font-bold text-[#1F2937] text-sm">{accountDetail.name}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="font-bold text-[#1F2937] font-mono">{accountDetail.number}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(accountDetail.number, 'account')}
                  className="flex items-center gap-1.5 bg-[#0D9488] text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition hover:bg-teal-700"
                >
                  {copied === 'account' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'account' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-bold text-[#0D9488]">{draft.amount} ETB</p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(draft.amount), 'amount')}
                  className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition hover:bg-gray-300"
                >
                  {copied === 'amount' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'amount' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Telegram send button */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#2AABEE] text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Screenshot on Telegram (@{adminTelegramHandle})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Confirm submission button without transaction ID */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-[#0D9488] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 text-sm">Sent your screenshot?</p>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  After forwarding your payment screenshot to <strong>@{adminTelegramHandle}</strong> on Telegram, click below to notify the admin for instant activation.
                </p>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Submitting…' : 'I Have Sent the Screenshot'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Pending tracker ── */}
      {step === 'pending' && draft && (
        <div className="space-y-5">
          <div className="bg-white border border-amber-200 rounded-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">Waiting for Review</h2>
              <p className="text-xs text-gray-500">
                Payment Code: <strong className="text-[#0D9488]">{draft.paymentCode}</strong>
              </p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center justify-between">
              {['Sent', 'Checking', 'Approved'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-[#0D9488] text-white' :
                    i === 1 ? 'bg-amber-100 text-amber-600 animate-pulse' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-center text-gray-400">
              Payments are usually reviewed within 30 minutes during business hours.
            </p>
          </div>

          {/* Remind button (shows after 30 min) */}
          <button
            onClick={handleRemind}
            disabled={reminderCooldown}
            className="w-full border border-amber-300 text-amber-700 font-semibold py-3 rounded-xl text-sm hover:bg-amber-50 transition disabled:opacity-50"
          >
            {reminderSent ? '✓ Admin Reminded' : reminderCooldown ? 'Reminder sent (1h cooldown)' : '🔔 Remind Admin'}
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="w-full text-xs text-gray-400 hover:text-red-500 py-2 transition"
          >
            Cancel this request
          </button>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-[#1F2937] text-base">Confirm Submission</h3>
              <button onClick={() => setShowConfirmModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Did you attach your payment screenshot in Telegram (<strong>@{adminTelegramHandle}</strong>) with the code{' '}
              <strong className="text-[#0D9488]">{draft?.paymentCode}</strong>?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmClaim}
                className="w-full bg-[#0D9488] text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition"
              >
                Yes, I sent it ✅
              </button>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowConfirmModal(false)}
                className="w-full text-center border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
              >
                Not yet — open Telegram
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

