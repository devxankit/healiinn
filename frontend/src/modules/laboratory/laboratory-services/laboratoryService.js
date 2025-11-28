// Laboratory service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create laboratory-specific API client
const apiClient = new ApiClient('laboratory')

/**
 * Laboratory signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with laboratory
 */
export const signupLaboratory = async (signupData) => {
  try {
    const data = await apiClient.post('/laboratories/auth/signup', signupData)
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
    const data = await apiClient.post('/laboratories/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with laboratory and tokens
 */
export const loginLaboratory = async (credentials) => {
  try {
    const data = await apiClient.post('/laboratories/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store laboratory tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storeLaboratoryTokens = (tokens, remember = true) => {
  storeTokens('laboratory', tokens, remember)
}

/**
 * Clear laboratory tokens on logout
 */
export const clearLaboratoryTokens = () => {
  clearTokens('laboratory')
}

/**
 * Get laboratory profile
 * @returns {Promise<object>} Laboratory profile data
 */
export const getLaboratoryProfile = async () => {
  try {
    return await apiClient.get('/laboratories/auth/me')
  } catch (error) {
    console.error('Error fetching laboratory profile:', error)
    throw error
  }
}

/**
 * Update laboratory profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updateLaboratoryProfile = async (profileData) => {
  try {
    return await apiClient.put('/laboratories/auth/me', profileData)
  } catch (error) {
    console.error('Error updating laboratory profile:', error)
    throw error
  }
}

/**
 * Laboratory logout
 * @returns {Promise<object>} Response data
 */
export const logoutLaboratory = async () => {
  try {
    return await apiClient.post('/laboratories/auth/logout')
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}


