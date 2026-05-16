import { createContext, useContext, useState, useCallback } from 'react'

const LaboratorySidebarContext = createContext()

export const LaboratorySidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  return (
    <LaboratorySidebarContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </LaboratorySidebarContext.Provider>
  )
}

export const useLaboratorySidebar = () => {
  const context = useContext(LaboratorySidebarContext)
  if (!context) {
    throw new Error('useLaboratorySidebar must be used within a LaboratorySidebarProvider')
  }
  return context
}
