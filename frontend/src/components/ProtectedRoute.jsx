import { Navigate } from 'react-router-dom'
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
  // Check token synchronously - this is critical for security
  const token = getAuthToken(module)
  
  // If no token, redirect to login immediately
  if (!token) {
    const loginPath = redirectTo || `/${module}/login`
    
    // Clear any stale tokens to ensure clean state
    if (typeof window !== 'undefined') {
      // Clear all possible token variations
      localStorage.removeItem(`${module}AuthToken`)
      localStorage.removeItem(`${module}AccessToken`)
      localStorage.removeItem(`${module}RefreshToken`)
      sessionStorage.removeItem(`${module}AuthToken`)
      sessionStorage.removeItem(`${module}AccessToken`)
      sessionStorage.removeItem(`${module}RefreshToken`)
      
      // Force a page reload to clear any cached state
      // This ensures that even if tokens were in memory, they're cleared
      if (window.location.pathname.includes(`/${module}/dashboard`) || 
          window.location.pathname.includes(`/${module}/profile`) ||
          window.location.pathname.startsWith(`/${module}/`) && 
          !window.location.pathname.includes(`/${module}/login`) &&
          !window.location.pathname.includes(`/${module}/signup`)) {
        // Only redirect, don't reload - React Router will handle navigation
      }
    }
    
    // Redirect to login page
    return <Navigate to={loginPath} replace state={{ from: window.location.pathname }} />
  }

  // If token exists, render the protected component
  return children
}

export default ProtectedRoute

