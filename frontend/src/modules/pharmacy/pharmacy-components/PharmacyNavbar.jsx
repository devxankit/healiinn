import { useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoBagHandleOutline,
  IoWalletOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoMedicalOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import PharmacySidebar from './PharmacySidebar'
import { usePharmacySidebar } from './PharmacySidebarContext'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

// Sidebar nav and desktop navbar (includes Support above Profile)
const sidebarNavItems = [
  { id: 'home', label: 'Home', to: '/pharmacy/dashboard', Icon: IoHomeOutline },
  { id: 'orders', label: 'Orders', to: '/pharmacy/orders', Icon: IoBagHandleOutline },
  { id: 'medicines', label: 'Medicines', to: '/pharmacy/medicines', Icon: IoMedicalOutline },
  { id: 'wallet', label: 'Wallet', to: '/pharmacy/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/pharmacy/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/pharmacy/profile', Icon: IoPersonCircleOutline },
]

// Bottom nav items (without Support only, Wallet included)
const navItems = sidebarNavItems.filter((item) => item.id !== 'support')

const PharmacyNavbar = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = usePharmacySidebar()
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  // Hide top header only on dashboard page
  const isDashboardPage = location.pathname === '/pharmacy/dashboard' || location.pathname === '/pharmacy/'

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-2xl px-1 py-1 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-all duration-300'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black uppercase tracking-widest text-slate-500 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2'

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
      const { logoutPharmacy } = await import('../pharmacy-services/pharmacyService')
      await logoutPharmacy()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Error during logout:', error)
      const { clearPharmacyTokens } = await import('../pharmacy-services/pharmacyService')
      clearPharmacyTokens()
      toast.success('Logged out successfully')
    }
    setTimeout(() => {
      window.location.href = '/login?type=pharmacy'
    }, 500)
  }

  return (
    <>
      {/* Top Header - Hidden on dashboard page for a cleaner look as dashboard has its own header */}
      {!isDashboardPage && (
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 px-4 py-4 backdrop-blur-xl border-b border-slate-100 shadow-sm md:px-8 lg:left-[280px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20 lg:hidden">
               <IoMedicalOutline className="h-6 w-6" />
            </div>
            <img
              src={healinnLogo}
              alt="Heallyn"
              className="h-7 w-auto object-contain hidden sm:block lg:hidden"
              loading="lazy"
            />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest hidden lg:block">
               Pharmacy Portal
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              ref={toggleButtonRef}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600"
              aria-label="Toggle navigation menu"
              onClick={handleSidebarToggle}
            >
              <IoMenuOutline className="text-2xl" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      <PharmacySidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={sidebarNavItems}
        onLogout={handleLogout}
      />

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-2 border-t border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden pb-safe">
        {navItems.map(({ id, label, to, Icon }) => (
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
    </>

  )
}

export default PharmacyNavbar

