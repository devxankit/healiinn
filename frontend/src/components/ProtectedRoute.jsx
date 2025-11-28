import { Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAuthToken } from '../utils/apiClient'

/**
 * ProtectedRoute Component
 * Protects routes that require authentication
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Component to render if authenticated
 * @param {string} props.module - Module name (patient, doctor, pharmacy, laboratory, admin)
 * @param {string} props.redirectTo - Path to redirect if not authenticated (default: /{module}/login)
 */
const ProtectedRoute = ({ children, module, redirectTo = null }) => {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  
  // Check token synchronously first - this prevents any rendering
  const token = getAuthToken(module)
  
  useEffect(() => {
    // Double-check token in useEffect
    const currentToken = getAuthToken(module)
    
    if (!currentToken) {
      // No token - clear all
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem(`${module}AuthToken`)
        localStorage.removeItem(`${module}AccessToken`)
        localStorage.removeItem(`${module}RefreshToken`)
        localStorage.removeItem(`${module}Profile`)
        
        // Clear sessionStorage
        sessionStorage.removeItem(`${module}AuthToken`)
        sessionStorage.removeItem(`${module}AccessToken`)
        sessionStorage.removeItem(`${module}RefreshToken`)
        sessionStorage.removeItem(`${module}Profile`)
      }
      setIsChecking(false)
      setIsAuthenticated(false)
      return
    }
    
    // Token exists - set authenticated
    setIsAuthenticated(true)
    setIsChecking(false)
  }, [module, redirectTo])

  // If no token synchronously, redirect immediately (before useEffect runs)
  if (!token) {
    const loginPath = redirectTo || `/${module}/login`
    // Clear tokens and redirect immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${module}AuthToken`)
      localStorage.removeItem(`${module}AccessToken`)
      localStorage.removeItem(`${module}RefreshToken`)
      localStorage.removeItem(`${module}Profile`)
      sessionStorage.removeItem(`${module}AuthToken`)
      sessionStorage.removeItem(`${module}AccessToken`)
      sessionStorage.removeItem(`${module}RefreshToken`)
      sessionStorage.removeItem(`${module}Profile`)
      
      // Use Navigate component for React Router redirect
      return <Navigate to={loginPath} replace />
    }
    return null
  }

  // Show nothing while checking
  if (isChecking) {
    return null
  }

  // If not authenticated, return null (redirect already happened)
  if (!isAuthenticated) {
    return null
  }

  // If authenticated, render children
  return children
}

export default ProtectedRoute

