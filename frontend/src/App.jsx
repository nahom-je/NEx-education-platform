import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './contexts/useAuthStore'

// Pages
import Login from './pages/Login'
import Home from './pages/Home'
import Search from './pages/Search'
import ResourceDetail from './pages/ResourceDetail'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import ChatList from './pages/ChatList'
import ChatRoom from './pages/ChatRoom'
import AdminDashboard from './pages/AdminDashboard'

// Layout
import AppLayout from './components/AppLayout'

// Protected route wrapper
const Protected = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { rehydrate, loading } = useAuthStore()

  // Rehydrate auth from localStorage on mount
  useEffect(() => { rehydrate() }, [rehydrate])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9488]"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — wrapped in AppLayout (Navbar + mobile bottom tabs) */}
        <Route
          path="/"
          element={<Protected><AppLayout /></Protected>}
        >
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="resource/:id" element={<ResourceDetail />} />
          <Route path="upload" element={<Upload />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="chat" element={<ChatList />} />
          <Route path="chat/:roomId" element={<ChatRoom />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
