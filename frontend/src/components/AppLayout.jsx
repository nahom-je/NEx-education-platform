import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

// AppLayout wraps all protected pages with Navbar (top) + BottomNav (mobile)
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Navbar />
      {/* Main content area — pad top for navbar, pad bottom for mobile bottom nav */}
      <main className="flex-1 pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
      {/* Bottom nav only on mobile, hidden on md+ */}
      <BottomNav />
    </div>
  )
}
