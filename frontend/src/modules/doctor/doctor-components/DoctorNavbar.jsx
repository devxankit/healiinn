import { useRef } from 'react'
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
import { useDoctorSidebar } from './DoctorSidebarContext'
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
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useDoctorSidebar()
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Hide header on dashboard and login pages
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  const isLoginPage = location.pathname === '/login'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-2xl px-1 py-1 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all duration-300'

  const handleSidebarToggle = () => {
    toggleSidebar()
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    closeSidebar()
  }

  const handleLogout = async () => {
    handleSidebarClose()
    try {
      const { logoutDoctor } = await import('../doctor-services/doctorService')
      await logoutDoctor()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      const { clearDoctorTokens } = await import('../doctor-services/doctorService')
      clearDoctorTokens()
      toast.success('Logged out successfully')
    }
    setTimeout(() => {
      window.location.href = '/login?type=doctor'
    }, 500)
  }

  return (
    <>
      {/* Top Header - Hidden on dashboard page */}
      {!isDashboardPage && !isLoginPage && (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 px-4 py-4 backdrop-blur-xl border-b border-slate-100 shadow-sm md:px-8 lg:left-[304px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20 lg:hidden">
               <IoDocumentTextOutline className="h-6 w-6" />
            </div>
            <img
              src={healinnLogo}
              alt="Healinn"
              className="h-7 w-auto object-contain hidden sm:block lg:hidden"
              loading="lazy"
            />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest hidden lg:block">
               Doctor Portal
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              ref={toggleButtonRef}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600"
              aria-label="Toggle navigation menu"
              onClick={handleSidebarToggle}
            >
              <IoMenuOutline className="text-2xl" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      <DoctorSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={allNavItems}
        onLogout={handleLogout}
      />

      {/* Mobile Bottom Nav */}
      {!isLoginPage && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-2 border-t border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden pb-safe">
          {navbarItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `${mobileLinkBase} ${
                  isActive ? 'scale-110' : 'text-slate-400 opacity-60'
                }`
              }
              end={id === 'home'}
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`${mobileIconWrapper} ${
                      isActive
                        ? 'bg-[#11496c] text-white shadow-xl shadow-[#11496c]/30'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-[#11496c]' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export default DoctorNavbar


