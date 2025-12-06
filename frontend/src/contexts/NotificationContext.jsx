import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { initSocket, disconnectSocket } from '../utils/socketClient'
import { useToast } from './ToastContext'
import { ApiClient } from '../utils/apiClient'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children, module = 'patient' }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Get current user's module from route
  const getCurrentModule = () => {
    const path = location.pathname
    if (path.startsWith('/patient')) return 'patient'
    if (path.startsWith('/doctor')) return 'doctor'
    if (path.startsWith('/pharmacy')) return 'pharmacy'
    if (path.startsWith('/laboratory')) return 'laboratory'
    if (path.startsWith('/admin')) return 'admin'
    return module
  }

  const currentModule = getCurrentModule()

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    // Don't fetch if on login page or no module
    if (!currentModule || location.pathname.includes('/login')) {
      return
    }

    // Check if user is authenticated
    const modulePathMap = {
      patient: 'patients',
      doctor: 'doctors',
      pharmacy: 'pharmacy',
      laboratory: 'laboratory',
      admin: 'admin',
    }
    const apiPath = modulePathMap[currentModule] || currentModule
    
    // Check if token exists
    const token = localStorage.getItem(`${currentModule}AuthToken`) || 
                  localStorage.getItem(`${currentModule}AccessToken`) ||
                  sessionStorage.getItem(`${currentModule}AuthToken`) ||
                  sessionStorage.getItem(`${currentModule}AccessToken`)
    
    if (!token) {
      // User not authenticated, don't fetch
      return
    }

    try {
      setIsLoading(true)
      // Create apiClient instance with correct module
      const client = new ApiClient(currentModule)
      const response = await client.get(`/${apiPath}/notifications`, { limit: 20 })
      if (response.success) {
        setNotifications(response.data.items || [])
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      // Only log non-403 errors (403 means user not authorized, which is expected if not logged in)
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.error('Error fetching notifications:', error)
      }
      // Don't set error state for auth errors
    } finally {
      setIsLoading(false)
    }
  }, [currentModule, location.pathname])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    // Don't fetch if on login page or no module
    if (!currentModule || location.pathname.includes('/login')) {
      return
    }

    // Check if user is authenticated
    const modulePathMap = {
      patient: 'patients',
      doctor: 'doctors',
      pharmacy: 'pharmacy',
      laboratory: 'laboratory',
      admin: 'admin',
    }
    const apiPath = modulePathMap[currentModule] || currentModule
    
    // Check if token exists
    const token = localStorage.getItem(`${currentModule}AuthToken`) || 
                  localStorage.getItem(`${currentModule}AccessToken`) ||
                  sessionStorage.getItem(`${currentModule}AuthToken`) ||
                  sessionStorage.getItem(`${currentModule}AccessToken`)
    
    if (!token) {
      // User not authenticated, don't fetch
      return
    }

    try {
      // Create apiClient instance with correct module
      const client = new ApiClient(currentModule)
      const response = await client.get(`/${apiPath}/notifications/unread-count`)
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      // Only log non-403 errors (403 means user not authorized, which is expected if not logged in)
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.error('Error fetching unread count:', error)
      }
    }
  }, [currentModule, location.pathname])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!currentModule) return
    
    try {
      const modulePathMap = {
        patient: 'patients',
        doctor: 'doctors',
        pharmacy: 'pharmacy',
        laboratory: 'laboratory',
        admin: 'admin',
      }
      const apiPath = modulePathMap[currentModule] || currentModule
      const client = new ApiClient(currentModule)
      await client.patch(`/${apiPath}/notifications/${notificationId}/read`)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true, readAt: new Date() } : notif
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [currentModule])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentModule) return
    
    try {
      const modulePathMap = {
        patient: 'patients',
        doctor: 'doctors',
        pharmacy: 'pharmacy',
        laboratory: 'laboratory',
        admin: 'admin',
      }
      const apiPath = modulePathMap[currentModule] || currentModule
      const client = new ApiClient(currentModule)
      await client.patch(`/${apiPath}/notifications/read-all`)
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true, readAt: new Date() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [currentModule])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!currentModule) return
    
    try {
      const modulePathMap = {
        patient: 'patients',
        doctor: 'doctors',
        pharmacy: 'pharmacy',
        laboratory: 'laboratory',
        admin: 'admin',
      }
      const apiPath = modulePathMap[currentModule] || currentModule
      const client = new ApiClient(currentModule)
      await client.delete(`/${apiPath}/notifications/${notificationId}`)
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId))
      // Update unread count if notification was unread
      const notification = notifications.find((n) => n._id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [currentModule, notifications])

  // Handle new notification from Socket.IO
  const handleNewNotification = useCallback((data) => {
    const notification = data.notification
    if (notification) {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
      
      // Show toast notification
      toast.info(notification.message || notification.title, {
        onClick: () => {
          if (notification.actionUrl) {
            navigate(notification.actionUrl)
          }
        },
      })
    }
  }, [toast, navigate])

  // Setup Socket.IO connection
  useEffect(() => {
    // Only connect if we're in a module route
    if (!currentModule || location.pathname.includes('/login')) {
      return
    }

    let socket = null
    let mounted = true

    try {
      socket = initSocket(currentModule)

      if (!socket) {
        return
      }

      if (mounted) {
        setIsConnected(true)
      }

    // Listen for new notifications
    socket.on('notification:new', handleNewNotification)

    // Listen for appointment events (for backward compatibility)
    socket.on('appointment:created', () => {
      fetchUnreadCount()
    })

    socket.on('appointment:payment:confirmed', () => {
      fetchUnreadCount()
    })

    socket.on('token:called', () => {
      fetchUnreadCount()
    })

    socket.on('prescription:created', () => {
      fetchUnreadCount()
    })

    socket.on('wallet:credited', () => {
      fetchUnreadCount()
    })

    socket.on('order:completed', () => {
      fetchUnreadCount()
    })

    socket.on('report:created', () => {
      fetchUnreadCount()
    })

    socket.on('request:responded', () => {
      fetchUnreadCount()
    })

    socket.on('request:assigned', () => {
      fetchUnreadCount()
    })

    // Listen for support ticket events
    socket.on('support:ticket:responded', () => {
      fetchUnreadCount()
      fetchNotifications()
    })

    socket.on('support:ticket:status:updated', () => {
      fetchUnreadCount()
      fetchNotifications()
    })

      // Fetch initial notifications
      fetchNotifications()
    } catch (error) {
      console.error('Error initializing socket:', error)
    }

    return () => {
      mounted = false
      if (socket) {
        try {
          socket.off('notification:new', handleNewNotification)
          socket.off('appointment:created')
          socket.off('appointment:payment:confirmed')
          socket.off('token:called')
          socket.off('prescription:created')
          socket.off('wallet:credited')
          socket.off('order:completed')
          socket.off('report:created')
          socket.off('request:responded')
          socket.off('request:assigned')
          socket.off('support:ticket:responded')
          socket.off('support:ticket:status:updated')
          disconnectSocket()
        } catch (error) {
          console.error('Error cleaning up socket:', error)
        }
      }
      setIsConnected(false)
    }
  }, [currentModule, location.pathname, handleNewNotification, fetchNotifications, fetchUnreadCount])

  // Refresh notifications when module changes
  useEffect(() => {
    if (currentModule && !location.pathname.includes('/login')) {
      fetchNotifications()
    }
  }, [currentModule, fetchNotifications, location.pathname])

  const value = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

