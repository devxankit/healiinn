import { createContext, useContext, useState } from 'react'

const DoctorSidebarContext = createContext()

export const DoctorSidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <DoctorSidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </DoctorSidebarContext.Provider>
  )
}

export const useDoctorSidebar = () => {
  const context = useContext(DoctorSidebarContext)
  if (!context) {
    throw new Error('useDoctorSidebar must be used within a DoctorSidebarProvider')
  }
  return context
}
