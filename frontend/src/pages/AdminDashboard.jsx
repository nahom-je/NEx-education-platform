import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Users, BookOpen, TrendingUp, Shield } from 'lucide-react'
import Avatar from '../components/Avatar'

import { useEffect } from 'react'
import { useResourceStore } from '../contexts/useResourceStore'

const USERS = [
  { id: 'u1', name: 'Abebe Girma',  email: 'abebe@aau.edu.et',   university: 'AAU',   uploads: 12, role: 'student', status: 'active' },
  { id: 'u2', name: 'Tigist W.',    email: 'tigist@ju.edu.et',    university: 'JU',    uploads: 7,  role: 'student', status: 'active' },
  { id: 'u3', name: 'Dawit Kebede', email: 'dawit@aastu.edu.et',  university: 'AASTU', uploads: 3,  role: 'student', status: 'active' },
  { id: 'u4', name: 'Sara Abi',     email: 'sara@bdu.edu.et',     university: 'BDU',   uploads: 18, role: 'student', status: 'active' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('pending')
  
  const { resources: pending, fetchPendingResources, approveResource, rejectResource, loading } = useResourceStore()

  useEffect(() => {
    fetchPendingResources()
  }, [fetchPendingResources])

  const approve = async (id) => await approveResource(id)
  const reject  = async (id) => await rejectResource(id)

  const stats = [
    { icon: BookOpen,   label: 'Total Resources', value: '12,418',  color: 'text-[#0D9488] bg-teal-50' },
    { icon: Clock,      label: 'Pending Review',  value: pending.length, color: 'text-[#F59E0B] bg-amber-50' },
    { icon: Users,      label: 'Total Users',     value: '3,240',   color: 'text-violet-600 bg-violet-50' },
    { icon: TrendingUp, label: 'Downloads Today', value: '1,847',   color: 'text-[#10B981] bg-emerald-50' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1F2937]">Admin Dashboard</h1>
          <p className="text-[#6B7280] text-sm">Manage resources, users, and platform content</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
            <p className="text-sm text-[#6B7280]">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl w-fit">
        {[['pending', 'Pending Approvals'], ['users', 'Users']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === key ? 'bg-white text-[#0D9488] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'
            }`}
          >
            {label}
            {key === 'pending' && pending.length > 0 && (
              <span className="ml-1.5 bg-[#F59E0B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-20 text-[#9CA3AF] space-y-2">
              <CheckCircle size={48} className="mx-auto text-[#10B981] opacity-50" />
              <p className="font-medium text-lg">No pending uploads</p>
              <p className="text-sm">All caught up! 🎉</p>
            </div>
          ) : (
            pending.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Left: type badge + info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{item.university} · {item.fileSize || 'Unknown Size'}</span>
                    <span className="text-xs text-[#9CA3AF]">Submitted {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-[#1F2937]">
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#0D9488]">
                      {item.title}
                    </a>
                  </h3>
                  <div className="flex items-center gap-2">
                    <Avatar user={item.uploader} size="xs" />
                    <span className="text-sm text-[#6B7280]">
                      {item.uploader.name} · {item.uploader.university}
                    </span>
                  </div>
                  {item.description && <p className="text-sm text-[#6B7280] mt-1">{item.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => reject(item._id)}
                    aria-label="Reject"
                    className="flex items-center gap-1.5 border border-[#EF4444] text-[#EF4444] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#FFF5F5] transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    onClick={() => approve(item._id)}
                    aria-label="Approve"
                    className="flex items-center gap-1.5 bg-[#0D9488] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0f766e] transition"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
            <span>User</span>
            <span className="hidden md:block">University</span>
            <span>Uploads</span>
            <span>Action</span>
          </div>
          {USERS.map((u) => (
            <div key={u.id} className="grid grid-cols-4 gap-4 px-5 py-4 items-center border-b border-[#F3F4F6] last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar user={u} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#1F2937] truncate">{u.name}</p>
                  <p className="text-xs text-[#9CA3AF] truncate hidden md:block">{u.email}</p>
                </div>
              </div>
              <span className="hidden md:block text-sm text-[#6B7280]">{u.university}</span>
              <span className="text-sm text-[#1F2937] font-semibold">{u.uploads}</span>
              <div className="flex gap-2">
                <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]">View</button>
                <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#EF4444] text-[#EF4444] hover:bg-[#FFF5F5]">Ban</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
