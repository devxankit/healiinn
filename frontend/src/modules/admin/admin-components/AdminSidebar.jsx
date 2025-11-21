import { NavLink, useLocation } from 'react-router-dom'
import { IoLogOutOutline, IoBarChartOutline } from 'react-icons/io5'
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoWalletOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'

const sidebarNavItems = [
  { id: 'overview', label: 'Overview', to: '/admin/dashboard', Icon: IoBarChartOutline },
  { id: 'verification', label: 'Verification', to: '/admin/verification', Icon: IoShieldCheckmarkOutline },
  { id: 'doctors', label: 'Doctors', to: '/admin/doctors', Icon: IoMedicalOutline },
  { id: 'patients', label: 'Patients', to: '/admin/users', Icon: IoPeopleOutline },
  { id: 'laboratories', label: 'Laboratories', to: '/admin/laboratories', Icon: IoFlaskOutline },
  { id: 'pharmacies', label: 'Pharmacies', to: '/admin/pharmacies', Icon: IoBusinessOutline },
  { id: 'wallet', label: 'Wallet', to: '/admin/wallet', Icon: IoWalletOutline },
  { id: 'support', label: 'Support', to: '/admin/support', Icon: IoHelpCircleOutline },
]

const AdminSidebar = ({ isOpen, onClose, onLogout }) => {
  const location = useLocation()
  const isLoginPage = location.pathname === '/admin/login'

  if (isLoginPage) {
    return null
  }

  // Sidebar classes - always visible
  const sidebarClasses = `fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#11496c] text-white`

  return (
    <>
      {/* Sidebar */}
      <aside
        className={sidebarClasses}
        aria-hidden={isLoginPage}
      >
        {/* Header */}
        <div className="flex flex-col px-6 py-6 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white">Healiinn</h1>
          <p className="mt-1 text-sm text-white/70">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarNavItems.map(({ id, label, to, Icon }) => {
            const isActive = location.pathname === to || (id === 'overview' && location.pathname === '/admin/dashboard')
            return (
              <NavLink
                key={id}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/20 px-3 py-4">
          <button
            type="button"
            onClick={() => {
              onClose?.()
              onLogout?.()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <IoLogOutOutline className="h-5 w-5" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
