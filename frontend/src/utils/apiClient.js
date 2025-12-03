/**
 * Base API Client for making HTTP requests
 * This is a reusable utility that can be used by all modules
 * 
 * Usage:
 * import apiClient from '@/utils/apiClient'
 * const response = await apiClient.post('/admin/auth/login', data)
 */

// Get API base URL from environment variable
// For development: http://localhost:5000/api
// For production: https://your-backend-domain.com/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

/**
 * Get authentication token from storage
 * @param {string} module - Module name (admin, patient, doctor, etc.)
 * @returns {string|null} Auth token or null
 */
const getAuthToken = (module = 'admin') => {
  // Try localStorage first, then sessionStorage
  // Check all possible token keys
  return (
    localStorage.getItem(`${module}AuthToken`) ||
    localStorage.getItem(`${module}AccessToken`) ||
    sessionStorage.getItem(`${module}AuthToken`) ||
    sessionStorage.getItem(`${module}AccessToken`) ||
    null
  )
}

/**
 * Get refresh token from storage
 * @param {string} module - Module name
 * @returns {string|null} Refresh token or null
 */
const getRefreshToken = (module = 'admin') => {
  return (
    localStorage.getItem(`${module}RefreshToken`) ||
    sessionStorage.getItem(`${module}RefreshToken`) ||
    null
  )
}

/**
 * Get auth headers for API requests
 * @param {string} module - Module name
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} Headers object
 */
const getAuthHeaders = (module = 'admin', additionalHeaders = {}) => {
  const token = getAuthToken(module)
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...additionalHeaders,
  }
}

/**
 * Store tokens in storage
 * @param {string} module - Module name
 * @param {object} tokens - Tokens object with accessToken and refreshToken
 * @param {boolean} remember - Whether to use localStorage (true) or sessionStorage (false)
 */
const storeTokens = (module, tokens, remember = true) => {
  const storage = remember ? localStorage : sessionStorage
  if (tokens.accessToken) {
    storage.setItem(`${module}AuthToken`, tokens.accessToken)
    storage.setItem(`${module}AccessToken`, tokens.accessToken)
  }
  if (tokens.refreshToken) {
    storage.setItem(`${module}RefreshToken`, tokens.refreshToken)
  }
}

/**
 * Clear tokens from storage
 * @param {string} module - Module name
 */
const clearTokens = (module = 'admin') => {
  localStorage.removeItem(`${module}AuthToken`)
  localStorage.removeItem(`${module}AccessToken`)
  localStorage.removeItem(`${module}RefreshToken`)
  sessionStorage.removeItem(`${module}AuthToken`)
  sessionStorage.removeItem(`${module}AccessToken`)
  sessionStorage.removeItem(`${module}RefreshToken`)
}

/**
 * Map module name to API endpoint path
 * @param {string} module - Module name (patient, doctor, etc.)
 * @returns {string} API endpoint path (patients, doctors, etc.)
 */
const getModuleApiPath = (module) => {
  const moduleMap = {
    'patient': 'patients',
    'doctor': 'doctors',
    'pharmacy': 'pharmacies',
    'laboratory': 'laboratories',
    'admin': 'admin',
  }
  return moduleMap[module] || module
}

/**
 * Refresh access token using refresh token
 * @param {string} module - Module name
 * @returns {Promise<object>} New tokens
 */
const refreshAccessToken = async (module = 'admin') => {
  const refreshToken = getRefreshToken(module)
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const apiPath = getModuleApiPath(module)

  try {
    const response = await fetch(`${API_BASE_URL}/${apiPath}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    
    if (data.success && data.data) {
      // Store new tokens
      const remember = !!localStorage.getItem(`${module}AuthToken`)
      storeTokens(module, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }, remember)
      
      return data.data
    }
    
    throw new Error('Invalid refresh response')
  } catch (error) {
    // Clear tokens on refresh failure
    clearTokens(module)
    throw error
  }
}

/**
 * Make API request with automatic token refresh on 401
 * @param {string} endpoint - API endpoint (e.g., '/admin/auth/login')
 * @param {object} options - Fetch options
 * @param {string} module - Module name for token management
 * @returns {Promise<Response>} Fetch response
 */
const apiRequest = async (endpoint, options = {}, module = 'admin') => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  
  // Check if this is a public auth endpoint (login/signup) that shouldn't require token
  const isAuthEndpoint = endpoint.includes('/auth/login') || 
                         endpoint.includes('/auth/signup') || 
                         endpoint.includes('/auth/forgot-password') ||
                         endpoint.includes('/auth/verify-otp') ||
                         endpoint.includes('/auth/reset-password') ||
                         endpoint.includes('/auth/check-exists')
  
  const config = {
    ...options,
    headers: {
      // Only add auth headers if not an auth endpoint
      ...(isAuthEndpoint ? { 'Content-Type': 'application/json', ...options.headers } : getAuthHeaders(module, options.headers)),
    },
  }

  try {
    let response = await fetch(url, config)

    // If 401 Unauthorized
    if (response.status === 401) {
      // For auth endpoints (login/signup), 401 means invalid credentials, not missing token
      // Just return the response so the caller can handle the error message from backend
      if (isAuthEndpoint) {
        return response
      }
      
      // For protected endpoints, handle token refresh/redirect
      // If we have a refresh token, try to refresh
      if (getRefreshToken(module)) {
        try {
          await refreshAccessToken(module)
          // Retry original request with new token
          config.headers = getAuthHeaders(module, options.headers)
          response = await fetch(url, config)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          clearTokens(module)
          if (window.location.pathname !== `/${module}/login`) {
            window.location.href = `/${module}/login`
          }
          throw new Error('Session expired. Please login again.')
        }
      } else {
        // No refresh token, user is logged out - clear tokens and redirect
        clearTokens(module)
        if (window.location.pathname !== `/${module}/login` && !window.location.pathname.includes('/login')) {
          // Only redirect if not already on login page
          const loginPath = module === 'admin' ? '/admin/login' : `/${module}/login`
          if (window.location.pathname !== loginPath) {
            window.location.href = loginPath
          }
        }
        throw new Error('Authentication token missing. Please login again.')
      }
    }

    return response
  } catch (error) {
    console.error(`API Request Error [${module}]:`, error)
    throw error
  }
}

/**
 * API Client class
 */
class ApiClient {
  constructor(module = 'admin') {
    this.module = module
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Response data
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    const response = await apiRequest(url, { method: 'GET' }, this.module)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async post(endpoint, data = {}) {
    const response = await apiRequest(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      this.module
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async put(endpoint, data = {}) {
    const response = await apiRequest(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      this.module
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body
   * @returns {Promise<object>} Response data
   */
  async patch(endpoint, data = {}) {
    const response = await apiRequest(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      this.module
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<object>} Response data
   */
  async delete(endpoint) {
    const response = await apiRequest(endpoint, { method: 'DELETE' }, this.module)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * Upload file (multipart/form-data)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData with file
   * @returns {Promise<object>} Response data
   */
  async upload(endpoint, formData) {
    const token = getAuthToken(this.module)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      })
    } catch (fetchError) {
      // Handle network errors (connection refused, etc.)
      if (fetchError.message?.includes('Failed to fetch') || 
          fetchError.message?.includes('NetworkError') ||
          fetchError.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.')
      }
      throw fetchError
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
}

// Export default instance for admin
const apiClient = new ApiClient('admin')

// Export class for creating module-specific instances
export { ApiClient, storeTokens, clearTokens, getAuthToken, getRefreshToken }

export default apiClient

