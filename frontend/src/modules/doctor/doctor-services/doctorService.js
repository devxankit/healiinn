// Doctor service utilities for API calls
import { ApiClient, storeTokens, clearTokens } from '../../../utils/apiClient'

// Create doctor-specific API client
const apiClient = new ApiClient('doctor')

/**
 * Doctor signup
 * @param {object} signupData - Signup data
 * @returns {Promise<object>} Response data with doctor
 */
export const signupDoctor = async (signupData) => {
  try {
    const data = await apiClient.post('/doctors/auth/signup', signupData)
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
    const data = await apiClient.post('/doctors/auth/login/otp', { phone })
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

/**
 * Verify OTP and login
 * @param {object} credentials - Login credentials (phone, otp)
 * @returns {Promise<object>} Response data with doctor and tokens
 */
export const loginDoctor = async (credentials) => {
  try {
    const data = await apiClient.post('/doctors/auth/login', credentials)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

/**
 * Store doctor tokens after login
 * @param {object} tokens - Tokens object (accessToken, refreshToken)
 * @param {boolean} remember - Whether to use localStorage
 */
export const storeDoctorTokens = (tokens, remember = true) => {
  storeTokens('doctor', tokens, remember)
}

/**
 * Clear doctor tokens on logout
 */
export const clearDoctorTokens = () => {
  clearTokens('doctor')
}

/**
 * Get doctor profile
 * @returns {Promise<object>} Doctor profile data
 */
export const getDoctorProfile = async () => {
  try {
    return await apiClient.get('/doctors/auth/me')
  } catch (error) {
    console.error('Error fetching doctor profile:', error)
    throw error
  }
}

/**
 * Update doctor profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export const updateDoctorProfile = async (profileData) => {
  try {
    return await apiClient.put('/doctors/auth/me', profileData)
  } catch (error) {
    console.error('Error updating doctor profile:', error)
    throw error
  }
}

/**
 * Doctor logout
 * @returns {Promise<object>} Response data
 */
export const logoutDoctor = async () => {
  try {
    return await apiClient.post('/doctors/auth/logout')
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}


