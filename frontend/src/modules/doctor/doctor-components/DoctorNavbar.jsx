import { useRef, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoWalletOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import DoctorSidebar from './DoctorSidebar'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

const allNavItems = [
  { id: 'home', label: 'Dashboard', to: '/doctor/dashboard', Icon: IoHomeOutline },
  { id: 'consultations', label: 'Consultations', to: '/doctor/consultations', Icon: IoDocumentTextOutline },
  { id: 'patients', label: 'Patients', to: '/doctor/patients', Icon: IoPeopleOutline },
  { id: 'wallet', label: 'Wallet', to: '/doctor/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/doctor/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/doctor/profile', Icon: IoPersonCircleOutline },
]

// Navbar items for mobile bottom nav (without Support)
const navbarItems = allNavItems.filter((item) => item.id !== 'support')

const DoctorNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Hide header on dashboard and login pages
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  const isLoginPage = location.pathname === '/login'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(17,73,108,0.7)] focus-visible:ring-offset-2'

  const handleSidebarToggle = () => {
    if (isSidebarOpen) {
      handleSidebarClose()
    } else {
      setIsSidebarOpen(true)
    }
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutDoctor } = await import('../doctor-services/doctorService')
      await logoutDoctor()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear tokens manually if API call fails
      const { clearDoctorTokens } = await import('../doctor-services/doctorService')
      clearDoctorTokens()
      toast.success('Logged out successfully')
    }
    // Force navigation to login page - full page reload to clear all state
    setTimeout(() => {
      window.location.href = '/login?type=doctor'
    }, 500)
  }

  return (
    <>
      {!isDashboardPage && !isLoginPage && (
        <header className="lg:hidden fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-xl border-b border-slate-100 md:px-6">
          <div className="flex items-center">
            <img
              src={healinnLogo}
              alt="Heallyn"
              className="h-8 w-auto object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
              <NotificationBell />
            </div>
            <button
              type="button"
              ref={toggleButtonRef}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-600"
              aria-label="Toggle navigation menu"
              onClick={handleSidebarToggle}
            >
              <IoMenuOutline className="h-6 w-6" />
            </button>
          </div>
        </header>
      )}

      <DoctorSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={allNavItems}
        onLogout={handleLogout}
      />

      {!isLoginPage && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around bg-white/90 px-4 py-3 backdrop-blur-xl border-t border-slate-100 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {navbarItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'text-[#11496c] scale-110' : 'text-slate-400 hover:text-slate-600'
                }`
              }
              end={id === 'home'}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ${
                      isActive
                        ? 'bg-[#11496c] text-white shadow-xl shadow-[#11496c]/20 rotate-[-8deg]'
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#11496c]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export default DoctorNavbar

