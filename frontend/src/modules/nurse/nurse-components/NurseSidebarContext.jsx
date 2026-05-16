import { createContext, useContext, useState } from 'react'

const NurseSidebarContext = createContext()

export const NurseSidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <NurseSidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </NurseSidebarContext.Provider>
  )
}

export const useNurseSidebar = () => {
  const context = useContext(NurseSidebarContext)
  if (!context) {
    throw new Error('useNurseSidebar must be used within a NurseSidebarProvider')
  }
  return context
}
