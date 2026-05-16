import { useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  IoHomeOutline,
  IoBagHandleOutline,
  IoWalletOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoPeopleOutline,
  IoHelpCircleOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import LaboratorySidebar from './LaboratorySidebar'
import NotificationBell from '../../../components/NotificationBell'
import { useLaboratorySidebar, LaboratorySidebarProvider } from './LaboratorySidebarContext'

// Sidebar nav items
const sidebarNavItems = [
  { id: 'home', label: 'Dashboard', to: '/laboratory/dashboard', Icon: IoHomeOutline },
  { id: 'orders', label: 'Orders', to: '/laboratory/orders', Icon: IoBagHandleOutline },
  { id: 'patients', label: 'Patients', to: '/laboratory/patients', Icon: IoPeopleOutline },
  { id: 'wallet', label: 'Wallet', to: '/laboratory/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/laboratory/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/laboratory/profile', Icon: IoPersonCircleOutline },
]

// Bottom nav items (Mobile)
const navItems = sidebarNavItems.filter((item) => ['home', 'orders', 'patients', 'wallet', 'profile'].includes(item.id))

const LaboratoryNavbarInner = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useLaboratorySidebar()
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  const isDashboardPage = location.pathname === '/laboratory/dashboard' || location.pathname === '/laboratory/' || location.pathname === '/laboratory'
  const isLoginPage = location.pathname.includes('/login')

  const handleLogout = () => {
    closeSidebar()
    localStorage.removeItem('laboratoryAuthToken')
    sessionStorage.removeItem('laboratoryAuthToken')
    navigate('/login?type=laboratory', { replace: true })
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
               Laboratory Portal
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              type="button"
              ref={toggleButtonRef}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600"
              aria-label="Toggle navigation menu"
              onClick={toggleSidebar}
            >
              <IoMenuOutline className="text-2xl" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      {/* Sidebar - Persistent on desktop, drawer on mobile */}
      <LaboratorySidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        navItems={sidebarNavItems}
        onLogout={handleLogout}
      />

      {/* Bottom Navigation - Mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around bg-white/90 px-2 py-3 backdrop-blur-xl border-t border-slate-100 lg:hidden">
        {navItems.map(({ id, label, to, Icon }) => (
          <NavLink
            key={id}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-[#11496c]' : 'text-slate-400 hover:text-slate-600'
              }`
            }
            end={id === 'home'}
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20' : 'bg-slate-50'
                }`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

const LaboratoryNavbar = () => {
  // We wrap it in a try-catch or check if provider exists, but in App.jsx we will wrap it.
  return <LaboratoryNavbarInner />
}

export default LaboratoryNavbar
