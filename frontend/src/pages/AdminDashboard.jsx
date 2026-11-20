import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  Shield,
  RefreshCw,
  Search,
  Key,
  Ban,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Unlock,
  Smartphone,
  RotateCcw
} from 'lucide-react'
import Avatar from '../components/Avatar'
import api from '../utils/api'
import { useResourceStore } from '../contexts/useResourceStore'

export default function AdminDashboard() {
  const [tab, setTab] = useState('users') // Default to users so admin immediately sees real users
  const [stats, setStats] = useState({
    totalResources: 0,
    pendingReview: 0,
    totalUsers: 0,
    activeAccesses: 0,
    pendingPayments: 0
  })
  const [users, setUsers] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [message, setMessage] = useState(null)

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [resetModalUser, setResetModalUser] = useState(null)
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const { resources: pending, fetchPendingResources, approveResource, rejectResource } = useResourceStore()

  // Fetch stats and real users from backend
  const loadDashboardData = async () => {
    try {
      setLoadingStats(true)
      const statsRes = await api.get('/admin/stats')
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load admin stats:', err)
    } finally {
      setLoadingStats(false)
    }

    try {
      setLoadingUsers(true)
      const usersRes = await api.get('/admin/users')
      setUsers(usersRes.data)
    } catch (err) {
      console.error('Failed to load admin users:', err)
    } finally {
      setLoadingUsers(false)
    }

    fetchPendingResources()
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Approve / Reject resources
  const handleApprove = async (id) => {
    await approveResource(id)
    loadDashboardData()
  }
  const handleReject = async (id) => {
    await rejectResource(id)
    loadDashboardData()
  }

  // Toggle Ban / Unban user
  const handleToggleBlock = async (user) => {
    if (user.role === 'admin') {
      setMessage({ type: 'error', text: 'Admin accounts cannot be blocked.' })
      return
    }

    const confirmAction = window.confirm(
      user.is_blocked
        ? `Are you sure you want to unblock ${user.name}?`
        : `Are you sure you want to block ${user.name}? They will not be able to log in.`
    )
    if (!confirmAction) return

    try {
      setActionLoadingId(user.id)
      const res = await api.put(`/admin/users/${user.id}/toggle-block`)
      setMessage({ type: 'success', text: res.data.message })
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
      )
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update user status.'
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reset Device Lock
  const handleResetDevice = async (user) => {
    const confirmAction = window.confirm(
      `Reset device lock for ${user.name}? This will allow the student to bind a new device on their next sign-in.`
    )
    if (!confirmAction) return

    try {
      setActionLoadingId(user.id)
      const res = await api.post(`/admin/users/${user.id}/reset-device`)
      setMessage({ type: 'success', text: res.data.message })
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, device: null } : u))
      )
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, device: null } : null))
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset user device.'
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Open User Details
  const handleViewUser = async (user) => {
    setSelectedUser(user)
    setLoadingDetails(true)
    try {
      const res = await api.get(`/admin/users/${user.id}/details`)
      setUserDetails(res.data)
    } catch (err) {
      console.error('Failed to fetch user details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Reset Password
  const handleResetPassword = async () => {
    if (!resetModalUser) return
    try {
      setActionLoadingId(resetModalUser.id)
      const res = await api.post(`/admin/users/${resetModalUser.id}/reset-password`, {
        newPassword: customPassword.trim() || undefined
      })
      setTemporaryPassword(res.data.temporaryPassword)
      setMessage({ type: 'success', text: `Password reset successfully for ${resetModalUser.name}!` })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset password.'
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Copy password to clipboard
  const handleCopyPassword = () => {
    if (!temporaryPassword) return
    navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesRole =
        roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase()

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'blocked' && u.is_blocked) ||
        (statusFilter === 'active' && !u.is_blocked)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const statCards = [
    {
      icon: BookOpen,
      label: 'Total Resources',
      value: loadingStats ? '...' : stats.totalResources.toLocaleString(),
      subtext: 'Approved materials',
      color: 'text-[#0D9488] bg-teal-50'
    },
    {
      icon: Clock,
      label: 'Pending Review',
      value: loadingStats ? '...' : (pending.length || stats.pendingReview).toLocaleString(),
      subtext: 'Awaiting moderation',
      color: 'text-[#F59E0B] bg-amber-50'
    },
    {
      icon: Users,
      label: 'Total Users',
      value: loadingStats ? '...' : stats.totalUsers.toLocaleString(),
      subtext: 'Registered accounts',
      color: 'text-violet-600 bg-violet-50'
    },
    {
      icon: Unlock,
      label: 'Course Accesses',
      value: loadingStats ? '...' : stats.activeAccesses.toLocaleString(),
      subtext: 'Unlocked packages',
      color: 'text-[#10B981] bg-emerald-50'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm border ${
            message.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0D9488] flex items-center justify-center shadow-md shadow-teal-500/20">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">Admin Dashboard</h1>
            <p className="text-[#6B7280] text-sm">Real-time platform metrics, user access, and content control</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            title="Refresh dashboard data"
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition shadow-sm"
          >
            <RefreshCw size={16} className={loadingStats || loadingUsers ? 'animate-spin text-[#0D9488]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/admin/payments"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D9488] rounded-xl hover:bg-[#0f766e] transition shadow-sm"
          >
            <Unlock size={16} />
            <span>Payments & Access</span>
            {stats.pendingPayments > 0 && (
              <span className="bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingPayments}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, subtext, color }) => (
          <div
            key={label}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-[#0D9488]/30 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">{value}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">{subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-3">
        <div className="flex gap-2 bg-[#F3F4F6] p-1.5 rounded-xl">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'users' ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Users
            <span className="ml-2 bg-[#E5E7EB] text-[#374151] text-xs font-bold px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            Pending Approvals
            {pending.length > 0 && (
              <span className="ml-2 bg-[#F59E0B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'users' && (
          <div className="text-xs text-[#6B7280]">
            Showing <strong className="text-[#1F2937]">{filteredUsers.length}</strong> of{' '}
            <strong className="text-[#1F2937]">{users.length}</strong> users
          </div>
        )}
      </div>

      {/* TAB CONTENT: USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search user by name, phone (+251...), or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#1F2937]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* User List: Responsive Layout */}
          {loadingUsers ? (
            <div className="py-20 text-center text-[#6B7280]">
              <RefreshCw size={32} className="animate-spin mx-auto text-[#0D9488] mb-3" />
              <p className="text-sm font-medium">Loading real users from database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-[#6B7280]">
              <Users size={40} className="mx-auto text-[#9CA3AF] mb-3 opacity-50" />
              <p className="font-semibold text-lg text-[#1F2937]">No users found</p>
              <p className="text-sm mt-1">Try clearing your search query or filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (md and up) */}
              <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Student / User</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4 text-center">Role</th>
                      <th className="py-3.5 px-4 text-center">Device</th>
                      <th className="py-3.5 px-4 text-center">Uploads</th>
                      <th className="py-3.5 px-4 text-center">Accesses</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] text-sm text-[#1F2937]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F9FAFB]/75 transition">
                        {/* User column */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar user={u} size="sm" />
                            <div>
                              <p className="font-bold text-[#1F2937]">{u.name || 'Unnamed Student'}</p>
                              <p className="text-xs text-[#9CA3AF]">
                                Joined {new Date(u.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-4 font-mono text-xs text-[#4B5563]">
                          {u.phone || u.email || '—'}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-50 text-teal-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : 'Student'}
                          </span>
                        </td>

                        {/* Device Lock */}
                        <td className="py-4 px-4 text-center">
                          {u.role === 'admin' ? (
                            <span className="text-xs text-[#9CA3AF]">All devices</span>
                          ) : u.device ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-850 text-xs font-semibold"
                              title={`Bound: ${new Date(u.device.registeredAt).toLocaleString()}`}
                            >
                              <Smartphone size={12} className="text-teal-600 shrink-0" />
                              <span className="truncate max-w-[120px]">{u.device.deviceName || 'Bound'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">Not bound</span>
                          )}
                        </td>

                        {/* Uploads */}
                        <td className="py-4 px-4 text-center font-semibold text-[#1F2937]">
                          {u.uploadsCount}
                        </td>

                        {/* Accesses */}
                        <td className="py-4 px-4 text-center font-semibold text-[#0D9488]">
                          {u.accessesCount}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center">
                          {u.is_blocked ? (
                            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewUser(u)}
                              title="View student details & accesses"
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] transition flex items-center gap-1"
                            >
                              <Eye size={13} /> Details
                            </button>

                            {u.role !== 'admin' && u.device && (
                              <button
                                onClick={() => handleResetDevice(u)}
                                disabled={actionLoadingId === u.id}
                                title="Reset device lock (allows student to bind new phone)"
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center gap-1"
                              >
                                <RotateCcw size={13} /> Reset Dev
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setResetModalUser(u)
                                setTemporaryPassword('')
                                setCustomPassword('')
                              }}
                              title="Reset user password"
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6] transition flex items-center gap-1"
                            >
                              <Key size={13} /> Reset Pwd
                            </button>

                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleBlock(u)}
                                disabled={actionLoadingId === u.id}
                                title={u.is_blocked ? 'Unblock account' : 'Ban user'}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
                                  u.is_blocked
                                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                    : 'border-rose-300 text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Ban size={13} />
                                {u.is_blocked ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (screens below md) */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 ${
                      u.is_blocked ? 'border-rose-200 bg-rose-50/20' : 'border-[#E5E7EB]'
                    }`}
                  >
                    {/* Top Row: Avatar, Full Name, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={u} size="md" />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-[#1F2937] leading-tight break-words">
                            {u.name || 'Unnamed Student'}
                          </h3>
                          <p className="font-mono text-xs text-[#6B7280] mt-0.5">
                            {u.phone || u.email || 'No contact specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Student'}
                        </span>
                        {u.is_blocked ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta info pills */}
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] bg-[#F9FAFB] p-2.5 rounded-xl">
                      <div>
                        Uploads: <strong className="text-[#1F2937]">{u.uploadsCount}</strong>
                      </div>
                      <span className="text-[#D1D5DB]">·</span>
                      <div>
                        Accesses: <strong className="text-[#0D9488]">{u.accessesCount}</strong>
                      </div>
                      <span className="text-[#D1D5DB]">·</span>
                      <div className="text-[11px] text-[#9CA3AF]">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Device status row on mobile */}
                    {u.role !== 'admin' && (
                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Smartphone size={13} className="text-teal-600 shrink-0" />
                          <span className="text-slate-500">Device:</span>
                          <span className="font-semibold text-slate-800 truncate">
                            {u.device?.deviceName || 'Not bound yet'}
                          </span>
                        </div>
                        {u.device && (
                          <button
                            onClick={() => handleResetDevice(u)}
                            disabled={actionLoadingId === u.id}
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0 transition"
                          >
                            Reset Lock
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#F3F4F6]">
                      <button
                        onClick={() => handleViewUser(u)}
                        className="py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> Details
                      </button>

                      <button
                        onClick={() => {
                          setResetModalUser(u)
                          setTemporaryPassword('')
                          setCustomPassword('')
                        }}
                        className="py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] flex items-center justify-center gap-1"
                      >
                        <Key size={14} /> Reset
                      </button>

                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={actionLoadingId === u.id}
                          className={`py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 ${
                            u.is_blocked
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                              : 'border-rose-300 text-rose-600 bg-rose-50'
                          }`}
                        >
                          <Ban size={14} />
                          {u.is_blocked ? 'Unban' : 'Ban'}
                        </button>
                      ) : (
                        <div className="py-2 text-xs text-center text-[#9CA3AF] font-medium">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: PENDING APPROVALS */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl text-center py-20 text-[#9CA3AF] space-y-2">
              <CheckCircle size={48} className="mx-auto text-[#10B981] opacity-75" />
              <p className="font-bold text-lg text-[#1F2937]">No pending uploads</p>
              <p className="text-sm">All uploaded resources are approved and live! 🎉</p>
            </div>
          ) : (
            pending.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                      {(item.type || 'DOCUMENT').toUpperCase()}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      {item.categoryName || item.category?.name || 'General'}{' '}
                      {item.courseName || item.course?.name ? `· ${item.courseName || item.course?.name}` : ''}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      Submitted {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#1F2937]">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline hover:text-[#0D9488] inline-flex items-center gap-1"
                    >
                      {item.title} <ExternalLink size={14} />
                    </a>
                  </h3>

                  {item.uploader && (
                    <div className="flex items-center gap-2">
                      <Avatar user={item.uploader} size="xs" />
                      <span className="text-xs text-[#6B7280]">
                        {item.uploader.name} · {item.uploader.phone || item.uploader.email || 'Student'}
                      </span>
                    </div>
                  )}

                  {item.description && <p className="text-xs text-[#6B7280]">{item.description}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(item._id)}
                    className="flex items-center gap-1.5 border border-[#EF4444] text-[#EF4444] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-rose-50 transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(item._id)}
                    className="flex items-center gap-1.5 bg-[#0D9488] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0f766e] transition shadow-xs"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <Avatar user={selectedUser} size="md" />
                <div>
                  <h3 className="font-extrabold text-lg text-[#1F2937]">{selectedUser.name}</h3>
                  <p className="text-xs text-[#6B7280]">{selectedUser.role?.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setUserDetails(null)
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-[#F9FAFB] p-3.5 rounded-2xl text-xs">
                <div>
                  <span className="text-[#9CA3AF] block">Phone:</span>
                  <span className="font-bold text-[#1F2937]">{selectedUser.phone || 'None'}</span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block">Email:</span>
                  <span className="font-bold text-[#1F2937] truncate block">{selectedUser.email || 'None'}</span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block">Joined:</span>
                  <span className="font-bold text-[#1F2937]">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block">Status:</span>
                  <span
                    className={`font-bold ${selectedUser.is_blocked ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {selectedUser.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Registered Device Lock Info */}
              {selectedUser.role !== 'admin' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                      <Smartphone size={14} className="text-teal-600" />
                      Registered Device
                    </span>
                    {selectedUser.device && (
                      <button
                        onClick={() => handleResetDevice(selectedUser)}
                        disabled={actionLoadingId === selectedUser.id}
                        className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Reset Device Lock
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedUser.device?.deviceName || 'No device registered yet (will bind on next login)'}
                  </p>
                  {selectedUser.device?.registeredAt && (
                    <p className="text-xs text-slate-500">
                      Bound since: {new Date(selectedUser.device.registeredAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Unlocked Courses / Access List */}
              <div className="pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#6B7280] mb-2">
                  Unlocked Course Accesses ({userDetails?.unlockedCourses?.length || 0})
                </h4>

                {loadingDetails ? (
                  <p className="text-xs text-[#9CA3AF] italic">Loading course accesses...</p>
                ) : userDetails?.unlockedCourses?.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[#E5E7EB] text-center text-xs text-[#9CA3AF]">
                    No courses unlocked yet.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {userDetails?.unlockedCourses?.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-teal-900">
                          {acc.course?.name || `Course ID: ${acc.course_id}`}
                        </span>
                        <span className="text-[10px] text-teal-600">
                          Granted {new Date(acc.granted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#F3F4F6]">
              <Link
                to="/admin/payments"
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-[#0D9488] rounded-xl hover:bg-[#0f766e] transition"
              >
                Grant Access in Payments Hub →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key size={18} />
                </div>
                <h3 className="font-extrabold text-lg text-[#1F2937]">Reset Password</h3>
              </div>
              <button
                onClick={() => {
                  setResetModalUser(null)
                  setTemporaryPassword('')
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#4B5563]">
              Reset password for <strong className="text-[#1F2937]">{resetModalUser.name}</strong> (
              <span className="font-mono text-xs">{resetModalUser.phone || resetModalUser.email}</span>).
            </p>

            {!temporaryPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Custom Password (Optional - leave blank to auto-generate):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NEx2026!"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    Student will be prompted to change their password upon their next login.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={actionLoadingId === resetModalUser.id}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0D9488] text-white hover:bg-[#0f766e] transition flex items-center gap-1.5"
                  >
                    {actionLoadingId === resetModalUser.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Key size={14} />
                    )}
                    Generate & Save New Password
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    New Temporary Password:
                  </p>
                  <p className="font-mono text-xl font-extrabold text-emerald-950 tracking-wide select-all bg-white py-2 px-3 rounded-xl border border-emerald-300">
                    {temporaryPassword}
                  </p>
                  <button
                    onClick={handleCopyPassword}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline pt-1"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Password'}
                  </button>
                </div>

                <p className="text-xs text-[#6B7280]">
                  Please share this password with the student via Telegram or SMS. They can use it immediately to log in.
                </p>

                <button
                  onClick={() => {
                    setResetModalUser(null)
                    setTemporaryPassword('')
                  }}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-[#1F2937] text-white hover:bg-black transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
