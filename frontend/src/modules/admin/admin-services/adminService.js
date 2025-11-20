// Admin service utilities for API calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  return localStorage.getItem('adminAuthToken') || sessionStorage.getItem('adminAuthToken')
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
 * Admin login
 */
export const loginAdmin = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Login failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * Get all users with filters
 */
export const getUsers = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

/**
 * Update user status
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update user status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
}

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Get all doctors with filters
 */
export const getDoctors = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.specialty) queryParams.append('specialty', filters.specialty)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

    const response = await fetch(`${API_BASE_URL}/admin/doctors?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch doctors: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching doctors:', error)
    throw error
  }
}

/**
 * Get doctor by ID
 */
export const getDoctorById = async (doctorId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch doctor: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching doctor:', error)
    throw error
  }
}

/**
 * Verify doctor
 */
export const verifyDoctor = async (doctorId, verificationData = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`Failed to verify doctor: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying doctor:', error)
    throw error
  }
}

/**
 * Reject doctor verification
 */
export const rejectDoctor = async (doctorId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/doctors/${doctorId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error(`Failed to reject doctor: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error rejecting doctor:', error)
    throw error
  }
}

/**
 * Get all pharmacies with filters
 */
export const getPharmacies = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

    const response = await fetch(`${API_BASE_URL}/admin/pharmacies?${queryParams}`, {
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
 * Get pharmacy by ID
 */
export const getPharmacyById = async (pharmacyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pharmacies/${pharmacyId}`, {
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
 * Verify pharmacy
 */
export const verifyPharmacy = async (pharmacyId, verificationData = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pharmacies/${pharmacyId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`Failed to verify pharmacy: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying pharmacy:', error)
    throw error
  }
}

/**
 * Reject pharmacy verification
 */
export const rejectPharmacy = async (pharmacyId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/pharmacies/${pharmacyId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error(`Failed to reject pharmacy: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error rejecting pharmacy:', error)
    throw error
  }
}

/**
 * Get all laboratories with filters
 */
export const getLaboratories = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

    const response = await fetch(`${API_BASE_URL}/admin/laboratories?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch laboratories: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching laboratories:', error)
    throw error
  }
}

/**
 * Get laboratory by ID
 */
export const getLaboratoryById = async (laboratoryId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/laboratories/${laboratoryId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch laboratory: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching laboratory:', error)
    throw error
  }
}

/**
 * Verify laboratory
 */
export const verifyLaboratory = async (laboratoryId, verificationData = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/laboratories/${laboratoryId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`Failed to verify laboratory: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying laboratory:', error)
    throw error
  }
}

/**
 * Reject laboratory verification
 */
export const rejectLaboratory = async (laboratoryId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/laboratories/${laboratoryId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      throw new Error(`Failed to reject laboratory: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error rejecting laboratory:', error)
    throw error
  }
}

/**
 * Get recent activities
 */
export const getRecentActivities = async (limit = 10) => {
  try {
    const queryParams = new URLSearchParams()
    if (limit) queryParams.append('limit', limit)

    const response = await fetch(`${API_BASE_URL}/admin/activities?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch recent activities: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    throw error
  }
}

/**
 * Get pending verifications
 */
export const getPendingVerifications = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.type) queryParams.append('type', filters.type)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)

    const response = await fetch(`${API_BASE_URL}/admin/verifications/pending?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pending verifications: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
    throw error
  }
}

/**
 * Get admin profile
 */
export const getAdminProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch admin profile: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    throw error
  }
}

/**
 * Update admin profile
 */
export const updateAdminProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      throw new Error(`Failed to update admin profile: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating admin profile:', error)
    throw error
  }
}

/**
 * Update admin password
 */
export const updateAdminPassword = async (passwordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/profile/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update password: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating password:', error)
    throw error
  }
}

/**
 * Get admin settings
 */
export const getAdminSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch admin settings: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    throw error
  }
}

/**
 * Update admin settings
 */
export const updateAdminSettings = async (settings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error(`Failed to update admin settings: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating admin settings:', error)
    throw error
  }
}

/**
 * Logout admin
 */
export const logoutAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to logout: ${response.statusText}`)
    }

    // Clear tokens from storage
    localStorage.removeItem('adminAuthToken')
    sessionStorage.removeItem('adminAuthToken')

    return await response.json()
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if API call fails
    localStorage.removeItem('adminAuthToken')
    sessionStorage.removeItem('adminAuthToken')
    throw error
  }
}

/**
 * Get admin wallet overview
 */
export const getAdminWalletOverview = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/wallet/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch wallet overview: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching wallet overview:', error)
    throw error
  }
}

/**
 * Get provider summaries (doctors, pharmacies, laboratories)
 */
export const getProviderSummaries = async (role = null) => {
  try {
    const url = role 
      ? `${API_BASE_URL}/admin/wallet/providers?role=${role}`
      : `${API_BASE_URL}/admin/wallet/providers`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch provider summaries: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching provider summaries:', error)
    throw error
  }
}

/**
 * Get withdrawal requests
 */
export const getWithdrawals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.role) queryParams.append('role', filters.role)
    if (filters.page) queryParams.append('page', filters.page)
    if (filters.limit) queryParams.append('limit', filters.limit)

    const response = await fetch(`${API_BASE_URL}/admin/wallet/withdrawals?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch withdrawals: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    throw error
  }
}

/**
 * Update withdrawal status
 */
export const updateWithdrawalStatus = async (withdrawalId, status, adminNote = null, payoutReference = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/wallet/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        adminNote,
        payoutReference,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update withdrawal: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating withdrawal status:', error)
    throw error
  }
}

export default {
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getDoctors,
  getDoctorById,
  verifyDoctor,
  rejectDoctor,
  getPharmacies,
  getPharmacyById,
  verifyPharmacy,
  rejectPharmacy,
  getLaboratories,
  getLaboratoryById,
  verifyLaboratory,
  rejectLaboratory,
  getRecentActivities,
  getPendingVerifications,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  getAdminSettings,
  updateAdminSettings,
  logoutAdmin,
  getAdminWalletOverview,
  getProviderSummaries,
  getWithdrawals,
  updateWithdrawalStatus,
}

