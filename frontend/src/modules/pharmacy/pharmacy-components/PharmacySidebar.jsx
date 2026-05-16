import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { IoCloseOutline, IoLogOutOutline, IoMedicalOutline } from 'react-icons/io5'

const PharmacySidebar = ({ isOpen, onClose, navItems = [], onLogout }) => {
  const closeButtonRef = useRef(null)
  
  const overlayClasses = `fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
  }`

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 flex w-[240px] transform flex-col bg-white border-r border-slate-100 shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`

  const linkBaseClasses =
    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300'

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  return (
    <>
      <div className={overlayClasses} role="presentation" onClick={onClose} aria-hidden={!isOpen} />

      <aside
        className={sidebarClasses}
        aria-hidden={!isOpen}
        aria-modal="true"
        role="dialog"
      >
        {/* Sidebar Header */}
        <div className="p-6 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
             <div className="h-8 w-8 rounded-lg bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20">
                <IoMedicalOutline className="h-5 w-5" />
             </div>
             <span className="text-lg font-black text-slate-900 tracking-tighter italic">HEALLYN</span>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-400 hover:bg-slate-50 transition-colors"
            aria-label="Close menu"
            onClick={onClose}
          >
            <IoCloseOutline />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `${linkBaseClasses} ${
                  isActive 
                    ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#11496c]'
                }`
              }
              onClick={() => {
                 if (window.innerWidth < 1024) onClose()
              }}
              end={id === 'home'}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        {onLogout ? (
          <div className="p-3 border-t border-slate-50">
            <button
              type="button"
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all duration-300"
              onClick={() => {
                onClose?.()
                onLogout()
              }}
            >
              <IoLogOutOutline className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : null}
      </aside>
    </>

  )
}

export default PharmacySidebar
















