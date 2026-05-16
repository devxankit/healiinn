import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { IoCloseOutline, IoLogOutOutline } from 'react-icons/io5'

const DoctorSidebar = ({ isOpen, onClose, navItems = [], onLogout }) => {
  const closeButtonRef = useRef(null)
  
  const overlayClasses = `fixed inset-0 z-[60] bg-[#11496c]/40 backdrop-blur-sm transition-opacity duration-500 ${
    isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
  }`

  const sidebarClasses = `fixed inset-y-0 right-0 z-[70] flex w-[85%] max-w-xs transform flex-col bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out ${
    isOpen ? 'translate-x-0 rounded-l-[40px]' : 'translate-x-full rounded-l-none'
  }`

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
        inert={!isOpen}
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-50">
          <div>
            <h2 className="text-2xl font-black text-[#11496c] tracking-tight">Menu</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Navigation</p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#11496c] hover:text-white transition-all duration-300"
            aria-label="Close menu"
            onClick={onClose}
          >
            <IoCloseOutline className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {navItems.map(({ id, label, to, Icon }) => (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#11496c] text-white shadow-lg shadow-[#11496c]/20 translate-x-2' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              onClick={onClose}
              end={id === 'home'}
            >
              {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
              <span className="text-sm font-black uppercase tracking-widest">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        {onLogout ? (
          <div className="p-8 border-t border-slate-50">
            <button
              type="button"
              className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-red-500 font-black uppercase tracking-widest bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
              onClick={() => {
                onClose?.()
                onLogout()
              }}
            >
              <IoLogOutOutline className="h-6 w-6" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : null}
      </aside>
    </>
  )
}

export default DoctorSidebar

