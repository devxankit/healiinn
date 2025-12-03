import { io } from 'socket.io-client'

// Get API base URL from environment variable
// Note: VITE_API_BASE_URL should include /api suffix (e.g., http://localhost:5000/api)
// Socket.IO needs the base URL without /api, so we remove it
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '') // Remove /api and trailing slash

let socketInstance = null

/**
 * Get authentication token from storage
 * @param {string} module - Module name (patient, doctor, pharmacy, laboratory, admin)
 * @returns {string|null} Auth token or null
 */
const getAuthToken = (module) => {
  return (
    localStorage.getItem(`${module}AuthToken`) ||
    localStorage.getItem(`${module}AccessToken`) ||
    sessionStorage.getItem(`${module}AuthToken`) ||
    sessionStorage.getItem(`${module}AccessToken`) ||
    null
  )
}

/**
 * Initialize Socket.IO connection
 * @param {string} module - Module name (patient, doctor, pharmacy, laboratory, admin)
 * @returns {object} Socket instance
 */
export const initSocket = (module) => {
  // Disconnect existing socket if any
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }

  const token = getAuthToken(module)

  if (!token) {
    console.warn(`No auth token found for ${module}, cannot connect to Socket.IO`)
    return null
  }

  socketInstance = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socketInstance.on('connect', () => {
    console.log(`Socket.IO connected for ${module}`)
  })

  socketInstance.on('disconnect', (reason) => {
    console.log(`Socket.IO disconnected for ${module}:`, reason)
    // Only log if it's not a normal disconnect
    if (reason !== 'io client disconnect') {
      console.warn(`Unexpected disconnect: ${reason}`)
    }
  })

  socketInstance.on('connect_error', (error) => {
    console.error(`Socket.IO connection error for ${module}:`, error.message)
    // Don't show error if backend is not running - it's expected in development
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
      console.warn('Backend server may not be running. Socket.IO will retry connection.')
    }
  })

  return socketInstance
}

/**
 * Get current Socket.IO instance
 * @returns {object|null} Socket instance or null
 */
export const getSocket = () => {
  return socketInstance
}

/**
 * Disconnect Socket.IO
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    try {
      socketInstance.disconnect()
    } catch (error) {
      console.warn('Error disconnecting socket:', error)
    } finally {
      socketInstance = null
    }
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
}

