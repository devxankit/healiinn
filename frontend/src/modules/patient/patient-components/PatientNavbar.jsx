import { useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  IoHomeOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
  IoFlaskOutline,
  IoPersonCircleOutline,
  IoMenuOutline,
  IoNotificationsOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'
import PatientSidebar from './PatientSidebar'

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'pharmacy', label: 'Pharmacy', to: '/patient/pharmacy', Icon: IoBagHandleOutline },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: IoPeopleOutline },
  { id: 'laboratory', label: 'Laboratory', to: '/patient/laboratory', Icon: IoFlaskOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

const PatientNavbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)
  const navigate = useNavigate()

  const mobileLinkBase =
    'flex flex-1 items-center justify-center rounded-full px-1 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2'

  const mobileIconWrapper =
    'flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-200'

  const desktopLinkBase =
    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2'

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

  const handleLogout = () => {
    handleSidebarClose()
    localStorage.removeItem('patientAuthToken')
    sessionStorage.removeItem('patientAuthToken')
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur shadow md:px-6">
        <div className="flex items-center">
          <img
            src={healinnLogo}
            alt="Healiinn"
            className="h-8 w-auto object-contain"
            loading="lazy"
          />
        </div>
        <nav className="hidden items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-lg shadow-blue-200/40 ring-1 ring-slate-200 md:flex">
          {navItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `${desktopLinkBase} ${
                  isActive ? 'bg-blue-500 text-white shadow-sm shadow-blue-400/40' : 'hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              end={id === 'home'}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Logout
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <IoNotificationsOutline
            aria-hidden="true"
            className="text-xl text-slate-500 md:hidden"
          />
          <button
            type="button"
            ref={toggleButtonRef}
            className="md:hidden"
            aria-label="Toggle navigation menu"
            onClick={handleSidebarToggle}
          >
            <IoMenuOutline className="text-2xl text-slate-600" aria-hidden="true" />
          </button>
        </div>
      </header>

      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-1 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        {navItems.map(({ id, label, to, Icon }) => (
          <NavLink
            key={id}
            to={to}
            className={({ isActive }) =>
              `${mobileLinkBase} ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
            end={id === 'home'}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`${mobileIconWrapper} ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-400/40'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="sr-only">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default PatientNavbar

