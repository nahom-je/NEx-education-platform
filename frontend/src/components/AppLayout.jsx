import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

// AppLayout wraps all protected pages with Navbar (top) + BottomNav (mobile)
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Navbar />
      {/* Main content — pad top for fixed navbar (pt-16), pad bottom for fixed mobile bottom nav (pb-24) */}
      <main className="flex-1 w-full pt-16 pb-24 md:pb-10">
        <Outlet />
      </main>
      {/* Bottom nav – fixed on mobile, hidden on md+ */}
      <BottomNav />
    </div>
  )
}
