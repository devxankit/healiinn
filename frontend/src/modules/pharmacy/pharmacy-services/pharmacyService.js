// Pharmacy service utilities for API calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
 * Login pharmacy
 */
export const loginPharmacy = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pharmacy/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error logging in:', error)
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
























