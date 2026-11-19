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
import AdminDashboard from './pages/AdminDashboard'
import CategoryView from './pages/CategoryView'
import SemesterView from './pages/SemesterView'
import CourseView from './pages/CourseView'
import QuizView from './pages/QuizView'
import AiChat from './pages/AiChat'
import Pricing from './pages/Pricing'
import PaymentPage from './pages/PaymentPage'
import MyCourses from './pages/MyCourses'
import AdminPayments from './pages/AdminPayments'

// Layout
import AppLayout from './components/AppLayout'

// Protected route wrapper
const Protected = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { rehydrate, isRehydrating } = useAuthStore()

  // Rehydrate auth from localStorage once on boot
  useEffect(() => { rehydrate() }, [rehydrate])

  if (isRehydrating) {
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
          <Route path="browse/:categorySlug" element={<CategoryView />} />
          <Route path="browse/:categorySlug/:semesterSlug" element={<SemesterView />} />
          <Route path="browse/:categorySlug/:semesterSlug/:courseSlug" element={<CourseView />} />
          <Route path="browse/:categorySlug/:semesterSlug/:courseSlug/quiz" element={<QuizView />} />
          <Route path="search" element={<Search />} />
          <Route path="resource/:id" element={<ResourceDetail />} />
          <Route path="upload" element={<Upload />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="ai" element={<AiChat />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/payments" element={<AdminPayments />} />
          {/* Legacy chat routes redirect to home */}
          <Route path="chat" element={<Navigate to="/" replace />} />
          <Route path="chat/*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
