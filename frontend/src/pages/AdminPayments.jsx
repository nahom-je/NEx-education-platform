import { API_BASE, SOCKET_URL } from '../utils/config';
// frontend/src/pages/AdminPayments.jsx
// Complete Admin Hub: Real-time payment verification queue
// + Direct Student Access Management (Manual Grant / Revoke full semester packages).

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Bell, BellOff,
  Users, TrendingUp, Shield, ChevronDown, ChevronUp,
  MessageSquare, Ban, Unlock, UserCheck, Plus, Search, Package,
  Trash2, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../contexts/useAuthStore'
import api from '../utils/api'
import { io } from 'socket.io-client'

const REJECT_REASONS = [
  'Screenshot not found on Telegram',
  'Payment amount incorrect',
  'Screenshot is blurry / unreadable',
  'Duplicate receipt',
  'Other',
]

const STATUS_COLOR = {
  claimed: 'bg-amber-100 text-amber-800',
  approved: 'bg-teal-100 text-teal-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  draft: 'bg-blue-100 text-blue-700',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 60000
  if (diff < 1) return 'just now'
  if (diff < 60) return `${Math.floor(diff)}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function AdminPayments() {
  const { user } = useAuthStore()
  const [activeMainTab, setActiveMainTab] = useState('queue') // 'queue' | 'access'
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filterStatus, setFilterStatus] = useState('claimed')
  const [expanded, setExpanded] = useState({})
  const [processing, setProcessing] = useState({})
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectCode, setRejectCode] = useState('')
  const [rejectText, setRejectText] = useState('')
  const [telegramChecked, setTelegramChecked] = useState({})
  
  // Student Access Management State
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [availablePackages, setAvailablePackages] = useState([])
  const [grantModalStudent, setGrantModalStudent] = useState(null)
  const [selectedGrantPackageId, setSelectedGrantPackageId] = useState('')
  const [granting, setGranting] = useState(false)

  const socketRef = useRef(null)
  const audioRef = useRef(null)

  // Load requests
  const loadRequests = async () => {
    try {
      const { data } = await api.get(`/admin/payments?status=${filterStatus}`)
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Load requests error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/payments/stats')
      setStats(data)
    } catch (err) {}
  }

  // Load all students and packages for access management
  const loadStudentsAndPackages = async () => {
    setLoadingStudents(true)
    try {
      const [studRes, catsRes] = await Promise.all([
        api.get('/admin/payments/students'),
        api.get('/categories')
      ])
      setStudents(studRes.data || [])

      // Generate package options
      const cats = catsRes.data || []
      const pkgs = []
      await Promise.all(
        cats.map(async (cat) => {
          try {
            const { data: courses } = await api.get(`/categories/${cat.id}/courses`)
            if (cat.has_semesters) {
              const semMap = {}
              courses.forEach(c => {
                const s = c.semester || 'Semester 1'
                if (!semMap[s]) semMap[s] = []
                semMap[s].push(c)
              })
              Object.entries(semMap).forEach(([sem, cList]) => {
                pkgs.push({
                  id: `${cat.id}-${sem}`,
                  name: `${cat.name} — ${sem} (${cList.length} courses)`,
                  courseIds: cList.map(c => c.id),
                  courseNames: cList.map(c => c.name)
                })
              })
            } else if (courses.length > 0) {
              pkgs.push({
                id: cat.id,
                name: `${cat.name} Department (${courses.length} courses)`,
                courseIds: courses.map(c => c.id),
                courseNames: courses.map(c => c.name)
              })
            }
          } catch {}
        })
      )
      setAvailablePackages(pkgs)
      if (pkgs.length > 0) setSelectedGrantPackageId(pkgs[0].id)
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setLoadingStudents(false)
    }
  }

  useEffect(() => {
    loadRequests()
    loadStats()
  }, [filterStatus])

  useEffect(() => {
    if (activeMainTab === 'access') {
      loadStudentsAndPackages()
    }
  }, [activeMainTab])

  // Socket.io for real-time updates
  useEffect(() => {
    const socket = io('${API_BASE}')
    socketRef.current = socket
    socket.emit('join:admin')

    socket.on('payment:claimed', () => {
      loadRequests()
      loadStats()
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {})
      }
    })
    socket.on('payment:reminded', () => {
      loadRequests()
    })

    return () => socket.disconnect()
  }, [soundEnabled])

  // ── Actions ──────────────────────────────────────────────

  const handleApprove = async (requestId) => {
    if (!telegramChecked[requestId]) {
      alert('Please check the Telegram screenshot confirmation first.')
      return
    }
    setProcessing(p => ({ ...p, [requestId]: 'approving' }))
    try {
      await api.post(`/admin/payments/${requestId}/approve`, { telegramConfirmed: true })
      setRequests(r => r.filter(req => req.id !== requestId))
      loadStats()
      alert('Payment approved! Full package unlocked for student.')
    } catch (err) {
      alert(err.response?.data?.message || 'Error approving.')
    } finally {
      setProcessing(p => ({ ...p, [requestId]: null }))
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectCode || !rejectText) return
    setProcessing(p => ({ ...p, [rejectModal]: 'rejecting' }))
    try {
      await api.post(`/admin/payments/${rejectModal}/reject`, {
        rejectReasonCode: rejectCode,
        rejectReason: rejectText
      })
      setRequests(r => r.filter(req => req.id !== rejectModal))
      setRejectModal(null)
      setRejectCode('')
      setRejectText('')
      loadStats()
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting.')
    } finally {
      setProcessing(p => ({ ...p, [rejectModal]: null }))
    }
  }

  // Admin Manual Grant of a Whole Package
  const handleGrantPackageSubmit = async (e) => {
    e.preventDefault()
    if (!grantModalStudent || !selectedGrantPackageId) return

    const pkg = availablePackages.find(p => p.id === selectedGrantPackageId)
    if (!pkg) return

    setGranting(true)
    try {
      await api.post('/admin/payments/access/grant', {
        studentId: grantModalStudent.id,
        courseIds: pkg.courseIds,
        packageName: pkg.name,
        reason: 'Manual grant by Administrator'
      })
      alert(`Success! Unlocked all ${pkg.courseIds.length} courses in "${pkg.name}" for ${grantModalStudent.name}.`)
      setGrantModalStudent(null)
      loadStudentsAndPackages()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant package access.')
    } finally {
      setGranting(false)
    }
  }

  // Admin Revoke single course access
  const handleRevokeSingleAccess = async (studentId, courseId, courseName) => {
    if (!window.confirm(`Revoke and lock "${courseName}" for this student?`)) return
    try {
      await api.post('/admin/payments/access/revoke', {
        studentId,
        courseId,
        reason: 'Admin manual revoke'
      })
      loadStudentsAndPackages()
    } catch (err) {
      alert(err.response?.data?.message || 'Error revoking access.')
    }
  }

  // Filtered students for access tab
  const filteredStudents = students.filter(s => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return true
    return (s.name && s.name.toLowerCase().includes(q)) ||
           (s.phone && s.phone.includes(q)) ||
           (s.email && s.email.toLowerCase().includes(q))
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 space-y-6">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0D9488] flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Payment &amp; Access Hub</h1>
            <p className="text-xs text-slate-500">Verify payments on Telegram and manage student access</p>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMainTab('queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'queue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Verification Queue</span>
            {stats?.pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('access')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'access'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Unlock className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Student Access &amp; Manual Grant</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: PAYMENT QUEUE ── */}
      {activeMainTab === 'queue' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pending Review', value: stats.pendingCount, color: 'text-amber-600 bg-amber-50', icon: Clock },
                { label: 'Approved Today', value: stats.approvedToday, color: 'text-teal-600 bg-teal-50', icon: CheckCircle2 },
                { label: 'Revenue Today', value: `${stats.revenueToday} ETB`, color: 'text-violet-600 bg-violet-50', icon: TrendingUp },
                { label: 'Total Unlocks', value: stats.totalApproved, color: 'text-blue-600 bg-blue-50', icon: Users },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                    <p className="font-extrabold text-slate-900 text-base">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['claimed', 'approved', 'rejected', 'cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition cursor-pointer ${
                  filterStatus === s
                    ? 'bg-[#0D9488] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'claimed' ? 'Pending Review' : s}
                {s === 'claimed' && stats?.pendingCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Request cards */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 text-sm">
              No {filterStatus} payment requests.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const student = req.student || {}
                const isExpanded = expanded[req.id]
                const isProcessing = processing[req.id]

                return (
                  <div
                    key={req.id}
                    className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all ${
                      req.status === 'claimed' ? 'border-amber-200' : 'border-slate-200/90'
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                      onClick={() => setExpanded(e => ({ ...e, [req.id]: !e[req.id] }))}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-teal-100/80 text-teal-800 font-black text-sm flex items-center justify-center shrink-0">
                          {(student.name || 'S')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-sm">{student.name || 'Unknown'}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${STATUS_COLOR[req.status] || 'bg-slate-100 text-slate-600'}`}>
                              {req.status === 'claimed' ? 'Pending Approval' : req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate">{student.phone || req.student_phone || student.email}</p>
                          <p className="text-[11px] text-slate-400">{timeAgo(req.claimed_at || req.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-base font-black text-[#0D9488]">{req.amount} ETB</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-5 bg-slate-50/30 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Phone Number</span>
                            <p className="font-bold text-slate-800 font-mono">{student.phone || req.student_phone || '—'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Payment Method</span>
                            <p className="font-bold text-slate-800 uppercase">{req.payment_method || 'CBE'}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Payment Code</span>
                            <p className="font-black text-[#0D9488] font-mono tracking-wider text-sm">{req.payment_code}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Submission Time</span>
                            <p className="font-medium text-slate-700">{req.claimed_at ? new Date(req.claimed_at).toLocaleTimeString() : '—'}</p>
                          </div>
                        </div>

                        {/* Courses included */}
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Courses In Package ({(req.course_ids || []).length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(req.course_ids || []).map(id => (
                              <span key={id} className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                                {id.slice(0, 8)}…
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Admin approval workflow for claimed requests */}
                        {req.status === 'claimed' && (
                          <div className="pt-3 border-t border-slate-200/80 space-y-3">
                            <label className="flex items-start gap-2.5 cursor-pointer bg-teal-50/60 border border-teal-200/70 p-3 rounded-xl">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded accent-[#0D9488] w-4 h-4"
                                checked={!!telegramChecked[req.id]}
                                onChange={e => setTelegramChecked(t => ({ ...t, [req.id]: e.target.checked }))}
                              />
                              <span className="text-xs text-teal-900 font-semibold leading-relaxed">
                                I verified the screenshot receipt on Telegram <strong>@bekiJng</strong> for payment code <strong className="text-[#0D9488] font-mono">{req.payment_code}</strong> ({req.amount} ETB).
                              </span>
                            </label>

                            <div className="flex gap-2.5">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={isProcessing || !telegramChecked[req.id]}
                                className="flex-1 bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {isProcessing === 'approving' ? 'Approving…' : 'Approve & Unlock Package'}
                              </button>
                              <button
                                onClick={() => setRejectModal(req.id)}
                                disabled={!!isProcessing}
                                className="px-5 border border-red-300 text-red-600 hover:bg-red-50 font-bold py-2.5 rounded-xl text-xs sm:text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: STUDENT COURSE ACCESS & DIRECT MANUAL GRANT ── */}
      {activeMainTab === 'access' && (
        <div className="space-y-6">
          {/* Top Banner explaining manual unlock */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-teal-900">Direct Student Course Unlock</h2>
              <p className="text-xs text-teal-700 mt-0.5">
                Grant or revoke full semester packages for students without requiring an online payment draft.
              </p>
            </div>
            <button
              onClick={loadStudentsAndPackages}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-white border border-teal-200 px-3 py-2 rounded-xl hover:bg-teal-50 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Students</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Search student by name, phone number, or email..."
              className="w-full text-sm bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Students table */}
          {loadingStudents ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 text-sm">
              No students found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredStudents.map(student => {
                const unlockedList = (student.accesses || []).filter(a => a.status === 'unlocked')

                return (
                  <div key={student.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{student.name}</p>
                        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {student.phone || 'No phone'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{student.email}</p>

                      {/* Unlocked courses preview */}
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-2">
                          Unlocked Access ({unlockedList.length}):
                        </span>
                        {unlockedList.length === 0 ? (
                          <span className="text-xs text-rose-500 font-medium">No courses unlocked (All locked)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {unlockedList.map(a => (
                              <span 
                                key={a.course_id}
                                className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-medium"
                              >
                                <span>{a.course?.name || 'Course'}</span>
                                <button
                                  onClick={() => handleRevokeSingleAccess(student.id, a.course_id, a.course?.name)}
                                  className="text-rose-500 hover:text-rose-700 cursor-pointer ml-0.5"
                                  title="Revoke and lock this course"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action: Open Grant Package Modal */}
                    <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => setGrantModalStudent(student)}
                        className="inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Unlock Package</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: MANUAL GRANT PACKAGE ── */}
      {grantModalStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <form onSubmit={handleGrantPackageSubmit} className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Admin Action</span>
                <h3 className="font-black text-slate-900 text-lg">Unlock Semester Package</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setGrantModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-1">
              <p className="text-slate-500">Student:</p>
              <p className="font-bold text-slate-900 text-sm">{grantModalStudent.name}</p>
              <p className="text-slate-600 font-mono">{grantModalStudent.phone || grantModalStudent.email}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Package to Unlock *
              </label>
              <select
                value={selectedGrantPackageId}
                onChange={e => setSelectedGrantPackageId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#0D9488]"
                required
              >
                {availablePackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This will immediately unlock all course materials, past exams, lecture notes, and worksheets in the selected package for this student.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setGrantModalStudent(null)}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={granting}
                className="flex-1 bg-[#0D9488] hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition disabled:opacity-50 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{granting ? 'Unlocking…' : 'Grant Full Access'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: REJECT PAYMENT ── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Reject Payment</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Reason *</label>
              <select
                value={rejectCode}
                onChange={e => { setRejectCode(e.target.value); setRejectText(e.target.value !== 'Other' ? e.target.value : '') }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-400"
              >
                <option value="">Select reason…</option>
                {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {rejectCode && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Note for Student</label>
                <textarea
                  value={rejectText}
                  onChange={e => setRejectText(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-400 resize-none"
                  placeholder="Explain why the receipt was rejected…"
                />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setRejectModal(null); setRejectCode(''); setRejectText('') }}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectCode || !rejectText || processing[rejectModal] === 'rejecting'}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {processing[rejectModal] === 'rejecting' ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
