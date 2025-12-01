// Patient service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create patient-specific API client
const apiClient = new ApiClient('patient')

/**
 * Patient signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with patient and tokens
 */
export const signupPatient = async (signupData) => {
  try {
    const data = await apiClient.post('/patients/auth/signup', signupData)
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
    const data = await apiClient.post('/patients/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with patient and tokens
 */
export const loginPatient = async (credentials) => {
  try {
    const data = await apiClient.post('/patients/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store patient tokens after login/signup
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storePatientTokens = (tokens, remember = true) => {
  storeTokens('patient', tokens, remember)
}

/**
 * Clear patient tokens on logout
 */
export const clearPatientTokens = () => {
  clearTokens('patient')
}

/**
 * Get patient profile
 * @returns {Promise<object>} Patient profile data
 */
export const getPatientProfile = async () => {
  try {
    return await apiClient.get('/patients/auth/me')
  } catch (error) {
    console.error('Error fetching patient profile:', error)
    throw error
  }
}

/**
 * Update patient profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updatePatientProfile = async (profileData) => {
  try {
    return await apiClient.put('/patients/auth/me', profileData)
  } catch (error) {
    console.error('Error updating patient profile:', error)
    throw error
  }
}

/**
 * Patient logout
 * @returns {Promise<object>} Response data
 */
export const logoutPatient = async () => {
  try {
    // Call backend logout API to blacklist tokens
    await apiClient.post('/patients/auth/logout').catch((error) => {
      // Even if backend call fails, we still clear tokens on frontend
      console.error('Error calling logout API:', error)
    })
    
    // Clear all tokens from storage
    clearPatientTokens()
    
    return { success: true, message: 'Logout successful' }
  } catch (error) {
    console.error('Error logging out:', error)
    // Clear tokens even if there's an error
    clearPatientTokens()
    throw error
  }
}


