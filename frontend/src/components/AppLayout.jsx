import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

// AppLayout wraps all protected pages with Navbar (top) + BottomNav (mobile)
export default function AppLayout() {
  return (
    <div className="flex flex-col bg-[#F9FAFB]" style={{ minHeight: '100dvh' }}>
      <Navbar />
      {/* Main content — scrollable, padded top for fixed navbar, bottom for mobile bottom nav */}
      <main
        className="flex-1 pt-16 pb-20 md:pb-6"
        style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>
      {/* Bottom nav – fixed on mobile, hidden on md+ */}
      <BottomNav />
    </div>
  )
}
