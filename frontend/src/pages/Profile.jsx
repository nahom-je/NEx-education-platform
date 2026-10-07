import { useState, useRef } from 'react'
import { Camera, Edit2, Save, BookOpen, Download, Star } from 'lucide-react'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../contexts/useAuthStore'
import ResourceCard from '../components/ResourceCard'

const MY_UPLOADS = [
  { id: 'u1', title: 'Calculus II Midterm Notes 2018 EC', university: 'AAU', courseCode: 'Math 202', courseName: 'Calculus II', year: '2018 EC', type: 'notes', tags: ['calculus'], rating: 4.5, downloads: 88, status: 'approved' },
  { id: 'u2', title: 'OOP Assignment 3 Solution', university: 'AAU', courseCode: 'CS 211', courseName: 'Object Oriented Programming', year: '2018 EC', type: 'assignment', tags: ['Java', 'OOP'], rating: 4.1, downloads: 55, status: 'pending' },
]

export default function Profile() {
  const { user, updateProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name:       user?.name       || '',
    bio:        user?.bio        || '',
    university: user?.university || '',
    department: user?.department || '',
    year:       user?.year       || '',
  })
  const fileRef = useRef()

  const handleAvatarChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    updateProfile({ avatar: url })
  }

  const handleSave = () => {
    updateProfile(form)
    setEditing(false)
  }

  const Field = ({ label, field, placeholder }) => (
    editing ? (
      <div>
        <label className="block text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide mb-1">{label}</label>
        <input
          value={form[field]}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
        />
      </div>
    ) : (
      <div>
        <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[#1F2937]">{form[field] || '—'}</p>
      </div>
    )
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Profile hero card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-[#0D9488] to-[#059669]" />

        <div className="px-6 pb-6">
          {/* Avatar + edit row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative group">
              <Avatar user={{ ...user, avatar: user?.avatar }} size="xl" showOnline />
              <button
                onClick={() => fileRef.current.click()}
                aria-label="Change profile photo"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition"
              >
                <Camera size={22} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {editing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-[#0D9488] text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#0f766e] transition"
              >
                <Save size={15} /> Save
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 border border-[#E5E7EB] text-[#374151] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#F9FAFB] transition"
              >
                <Edit2 size={15} /> Edit Profile
              </button>
            )}
          </div>

          {/* Name + bio */}
          <div className="space-y-4">
            {editing ? (
              <Field label="Full Name" field="name" placeholder="Your name" />
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-[#1F2937]">{form.name}</h2>
                <p className="text-sm text-[#0D9488] font-medium">{user?.email}</p>
              </div>
            )}

            {editing ? (
              <div>
                <label className="block text-xs text-[#9CA3AF] font-semibold uppercase tracking-wide mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell classmates about yourself…"
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            ) : (
              <p className="text-[#6B7280] text-sm leading-relaxed">{form.bio || 'No bio yet.'}</p>
            )}

            {/* Info fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <Field label="University" field="university" placeholder="e.g. AAU" />
              <Field label="Department" field="department" placeholder="e.g. Computer Science" />
              <Field label="Year / EC" field="year" placeholder="e.g. 3rd Year / 2017 EC" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: 'Uploads',    value: MY_UPLOADS.length },
          { icon: Download, label: 'Downloads',  value: '143' },
          { icon: Star,     label: 'Avg Rating', value: '4.3' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center">
            <Icon size={18} className="text-[#0D9488] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
            <p className="text-xs text-[#6B7280]">{label}</p>
          </div>
        ))}
      </div>

      {/* My uploads */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#1F2937]">My Uploads</h3>
        {/* grid: 1-col mobile → 2-col md → 3-col lg */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MY_UPLOADS.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      </div>
    </div>
  )
}
