// Pharmacy service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create pharmacy-specific API client
const apiClient = new ApiClient('pharmacy')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  return localStorage.getItem('pharmacyAuthToken') || sessionStorage.getItem('pharmacyAuthToken')
}

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

/**
 * Fetch pharmacies list
 */
export const fetchPharmacies = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.deliveryOption) queryParams.append('deliveryOption', filters.deliveryOption)
    if (filters.radius) queryParams.append('radius', filters.radius)
    if (filters.approvedOnly) queryParams.append('approvedOnly', filters.approvedOnly)

    const response = await fetch(`${API_BASE_URL}/pharmacies?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pharmacies: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    throw error
  }
}

/**
 * Get pharmacy details by ID
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacies/${pharmacyId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pharmacy: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pharmacy:', error)
    throw error
  }
}

/**
 * Get pharmacy orders
 */
export const getPharmacyOrders = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)

    const response = await fetch(`${API_BASE_URL}/pharmacy/orders?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacy/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error
  }
}

/**
 * Get pharmacy patients
 */
export const getPharmacyPatients = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)

    const response = await fetch(`${API_BASE_URL}/pharmacy/patients?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching patients:', error)
    throw error
  }
}

/**
 * Pharmacy signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with pharmacy
 */
export const signupPharmacy = async (signupData) => {
  try {
    const data = await apiClient.post('/pharmacies/auth/signup', signupData)
    return data
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

/**
 * Request login OTP
 * @param {string} phone - Phone number
 * @returns {Promise<object>} Response data
 */
export const requestLoginOtp = async (phone) => {
  try {
    const data = await apiClient.post('/pharmacies/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with pharmacy and tokens
 */
export const loginPharmacy = async (credentials) => {
  try {
    const data = await apiClient.post('/pharmacies/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store pharmacy tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storePharmacyTokens = (tokens, remember = true) => {
  storeTokens('pharmacy', tokens, remember)
}

/**
 * Clear pharmacy tokens on logout
 */
export const clearPharmacyTokens = () => {
  clearTokens('pharmacy')
}

/**
 * Get pharmacy profile
 * @returns {Promise<object>} Pharmacy profile data
 */
export const getPharmacyProfile = async () => {
  try {
    return await apiClient.get('/pharmacies/auth/me')
  } catch (error) {
    console.error('Error fetching pharmacy profile:', error)
    throw error
  }
}

/**
 * Update pharmacy profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updatePharmacyProfile = async (profileData) => {
  try {
    return await apiClient.put('/pharmacies/auth/me', profileData)
  } catch (error) {
    console.error('Error updating pharmacy profile:', error)
    throw error
  }
}

/**
 * Pharmacy logout
 * @returns {Promise<object>} Response data
 */
export const logoutPharmacy = async () => {
  try {
    return await apiClient.post('/pharmacies/auth/logout')
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}


export default {
  fetchPharmacies,
  getPharmacyById,
  getPharmacyOrders,
  updateOrderStatus,
  getPharmacyPatients,
  loginPharmacy,
}


























