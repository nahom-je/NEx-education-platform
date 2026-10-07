import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

// AppLayout wraps all protected pages with Navbar (top) + BottomNav (mobile)
export default function AppLayout() {
  const { pathname } = useLocation()
  // Hide bottom nav in chat room (full-height immersive)
  const isChatRoom = pathname.startsWith('/chat/') && pathname.length > 6

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Navbar />
      {/* Main content area — pad top for navbar, pad bottom for mobile bottom nav */}
      <main className="flex-1 pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
      {/* Bottom nav only on mobile, hidden on md+ */}
      {!isChatRoom && <BottomNav />}
    </div>
  )
}
