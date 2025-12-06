import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import { 
  getPatientQueue, 
  getPatientById, 
  getPatientHistory,
  getDoctorQueue,
  callNextPatient,
  skipPatient,
  recallPatient,
  updateQueueStatus,
  pauseSession,
  resumeSession,
  updateSession
} from '../doctor-services/doctorService'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoPlayOutline,
  IoArrowForwardOutline,
  IoArrowBackOutline,
  IoCloseOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoCallOutline,
  IoDocumentTextOutline,
  IoMedicalOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoRefreshOutline,
  IoStopOutline,
  IoAddOutline,
  IoCloseCircleOutline,
  IoVideocamOutline,
} from 'react-icons/io5'

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mock data removed - now using getPatientHistory API

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If invalid date, try to parse as time string directly
      if (typeof dateString === 'string' && (dateString.includes('AM') || dateString.includes('PM'))) {
        return dateString
      }
      return 'Invalid Date'
    }
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    console.error('Error formatting time:', error, dateString)
    return 'N/A'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get average consultation minutes from doctor profile
const getAverageConsultationMinutes = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('doctorProfile') || '{}')
    return profile.averageConsultationMinutes || 20
  } catch {
    return 20
  }
}

// Calculate max tokens based on session time and average consultation minutes
const calculateMaxTokens = (startTime, endTime, averageMinutes) => {
  if (!startTime || !endTime || !averageMinutes) return 0
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMs = end - start
  const diffMinutes = diffMs / (1000 * 60)
  return Math.floor(diffMinutes / averageMinutes)
}

const DoctorPatients = () => {
  console.log('🔵 DoctorPatients component rendering...') // Debug log
  
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  console.log('📍 Current pathname:', location.pathname, 'isDashboardPage:', isDashboardPage) // Debug log
  
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  
  // Appointments state - loaded from API
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState(null)
  
  // Session state
  const [currentSession, setCurrentSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  
  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true)
        setLoadingSession(true)
        setAppointmentsError(null)
        
        // Get today's date in YYYY-MM-DD format
        const todayStr = getTodayDateString()
        
        console.log('🔍 Fetching patient queue for date:', todayStr) // Debug log
        
        const response = await getPatientQueue(todayStr)
        
        console.log('📊 Patient queue API response:', response) // Debug log
        
        if (response && response.success && response.data) {
          // Backend returns: { session: {...}, appointments: [...], currentToken: 0 }
          const sessionData = response.data.session || null
          const queueData = response.data.appointments || response.data.queue || []
          
          console.log('✅ Queue data received:', {
            session: sessionData,
            appointmentsCount: queueData.length,
            firstAppointment: queueData[0],
          }) // Debug log
          
          // Set session data
          if (sessionData) {
            const sessionToSet = {
              id: sessionData._id || sessionData.id,
              _id: sessionData._id || sessionData.id,
              date: sessionData.date,
              startTime: sessionData.sessionStartTime || sessionData.startTime,
              endTime: sessionData.sessionEndTime || sessionData.endTime,
              status: sessionData.status || 'scheduled',
              currentToken: sessionData.currentToken || response.data.currentToken || 0,
              maxTokens: sessionData.maxTokens || 0,
              averageConsultationMinutes: sessionData.averageConsultationMinutes || getAverageConsultationMinutes(),
              startedAt: sessionData.startedAt,
              endedAt: sessionData.endedAt,
            }
            console.log('✅ Setting session data:', sessionToSet) // Debug log
            setCurrentSession(sessionToSet)
          } else {
            console.log('⚠️ No session data in response') // Debug log
            setCurrentSession(null)
            // Clear any cached session data
            localStorage.removeItem('doctorCurrentSession')
          }
          
          // Transform API data to match component structure
          const transformedAppointments = Array.isArray(queueData) ? queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId?.id,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                return appt.appointmentTime
              }
              if (appt.appointmentDate && appt.time) {
                // Convert 12-hour time to 24-hour for ISO format
                const convertTo24Hour = (time12) => {
                  if (!time12) return '00:00'
                  if (time12.includes('AM') || time12.includes('PM')) {
                    const [time, period] = time12.split(' ')
                    const [hours, minutes] = time.split(':').map(Number)
                    let hour24 = hours
                    if (period === 'PM' && hours !== 12) hour24 = hours + 12
                    if (period === 'AM' && hours === 12) hour24 = 0
                    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                  }
                  return time12
                }
                const time24 = convertTo24Hour(appt.time)
                const dateStr = appt.appointmentDate instanceof Date 
                  ? appt.appointmentDate.toISOString().split('T')[0]
                  : appt.appointmentDate.split('T')[0]
                return `${dateStr}T${time24}:00`
              }
              return new Date().toISOString()
            })(),
            appointmentDate: appt.appointmentDate || appt.date,
            appointmentType: appt.appointmentType || appt.type || 'New',
            consultationMode: appt.consultationMode || 'in_person', // Add consultation mode
            status: appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          })) : []
          
          console.log('💰 Setting appointments:', {
            count: transformedAppointments.length,
            statuses: transformedAppointments.map(a => a.status),
          }) // Debug log
          
          setAppointments(transformedAppointments)
        } else {
          console.error('❌ Invalid API response:', response) // Debug log
          setAppointments([])
          setCurrentSession(null)
        }
      } catch (error) {
        console.error('❌ Error fetching appointments:', error)
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load appointments'
        setAppointmentsError(errorMessage)
        try {
          if (toast && typeof toast.error === 'function') {
            toast.error(errorMessage)
          }
        } catch (toastError) {
          console.error('Error showing toast:', toastError)
        }
        setAppointments([])
        setCurrentSession(null)
      } finally {
        setLoadingAppointments(false)
        setLoadingSession(false)
      }
    }
    
    // Always fetch when on patients page
    if (location.pathname === '/doctor/patients' || isDashboardPage) {
      fetchAppointments()
      // Refresh every 30 seconds
      const interval = setInterval(fetchAppointments, 30000)
      return () => {
        clearInterval(interval)
      }
    } else {
      // If not on patients page, still set loading to false
      setLoadingAppointments(false)
      setLoadingSession(false)
    }
  }, [location.pathname, isDashboardPage]) // Removed toast from dependencies to avoid re-renders
  
  // Reload appointments when navigating back to this page
  // Appointments are already fetched in the main useEffect above
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Check session date on mount and clear if not today
  useEffect(() => {
    if (currentSession) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      
      const sessionDate = currentSession.date
      
      // Format session date for comparison
      let sessionDateStr = null
      if (sessionDate) {
        if (sessionDate instanceof Date) {
          sessionDateStr = sessionDate.toISOString().split('T')[0]
        } else if (typeof sessionDate === 'string') {
          // Handle both YYYY-MM-DD and ISO format
          sessionDateStr = sessionDate.split('T')[0]
        }
      }
      
      console.log('🔍 Checking session date:', {
        today: todayStr,
        sessionDate: sessionDateStr,
        sessionStatus: currentSession.status,
        match: sessionDateStr === todayStr,
      }) // Debug log
      
      // Only clear if session is cancelled or completed
      // Don't clear based on date mismatch - let backend handle that
      if (
        currentSession.status === 'cancelled' ||
        currentSession.status === 'completed'
      ) {
        console.log('🗑️ Clearing session due to status:', currentSession.status) // Debug log
        setCurrentSession(null)
        localStorage.removeItem('doctorCurrentSession')
      }
      // Note: We're not clearing based on date mismatch anymore
      // The backend will return the correct session for the requested date
    }
  }, [currentSession])

  // Calculate max tokens for current session
  const maxTokens = currentSession ? currentSession.maxTokens : 0

  const filteredAppointments = appointments.filter((appt) => {
    try {
      // Filter by session date if session exists
      if (currentSession && currentSession.date) {
        const sessionDate = new Date(currentSession.date)
        if (isNaN(sessionDate.getTime())) {
          console.warn('Invalid session date:', currentSession.date)
        } else {
          const appointmentDate = appt.appointmentTime ? new Date(appt.appointmentTime) : null
          if (appointmentDate && !isNaN(appointmentDate.getTime())) {
            // Compare dates (year, month, day only, ignore time)
            const sessionDateStr = sessionDate.toISOString().split('T')[0]
            const appointmentDateStr = appointmentDate.toISOString().split('T')[0]
            
            if (sessionDateStr !== appointmentDateStr) {
              return false
            }
          }
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const patientName = appt.patientName || ''
        const reason = appt.reason || ''
        return (
          patientName.toLowerCase().includes(searchLower) ||
          reason.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    } catch (error) {
      console.error('Error filtering appointment:', error, appt)
      return false
    }
  })

  // Session management functions
  const handleStartSession = async () => {
    if (!currentSession) {
      toast.error('No session available')
      return
    }
    
    try {
      const sessionId = currentSession._id || currentSession.id
      if (!sessionId) {
        toast.error('Session ID not found')
        return
      }

      // Call backend API to update session status to 'live'
      const response = await updateSession(sessionId, { status: 'live' })
      
      if (response.success && response.data) {
        // Update local state with backend response
        const updatedSession = {
          ...currentSession,
          _id: response.data._id || sessionId,
          id: response.data._id || sessionId,
          status: response.data.status || 'live',
          startedAt: response.data.startedAt || new Date().toISOString(),
        }
        
        setCurrentSession(updatedSession)
        localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
        
        toast.success('Session started! ETA is now active for all patients.')
        
        // Refresh appointments to get updated data and ETAs
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const sessionData = queueResponse.data.session
          const queueData = queueResponse.data.appointments || []
          
          if (sessionData) {
            setCurrentSession({
              id: sessionData._id || sessionData.id,
              _id: sessionData._id || sessionData.id,
              date: sessionData.date,
              startTime: sessionData.sessionStartTime || sessionData.startTime,
              endTime: sessionData.sessionEndTime || sessionData.endTime,
              status: sessionData.status || 'live',
              currentToken: sessionData.currentToken || response.data.currentToken || 0,
              maxTokens: sessionData.maxTokens || 0,
              averageConsultationMinutes: sessionData.averageConsultationMinutes || getAverageConsultationMinutes(),
            })
          }
          
          // Update appointments list
          const transformedAppointments = Array.isArray(queueData) ? queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId?.id,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: (() => {
              // Properly format appointment time
              if (appt.appointmentTime) {
                return appt.appointmentTime
              }
              if (appt.appointmentDate && appt.time) {
                // Convert 12-hour time to 24-hour for ISO format
                const convertTo24Hour = (time12) => {
                  if (!time12) return '00:00'
                  if (time12.includes('AM') || time12.includes('PM')) {
                    const [time, period] = time12.split(' ')
                    const [hours, minutes] = time.split(':').map(Number)
                    let hour24 = hours
                    if (period === 'PM' && hours !== 12) hour24 = hours + 12
                    if (period === 'AM' && hours === 12) hour24 = 0
                    return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                  }
                  return time12
                }
                const time24 = convertTo24Hour(appt.time)
                const dateStr = appt.appointmentDate instanceof Date 
                  ? appt.appointmentDate.toISOString().split('T')[0]
                  : appt.appointmentDate.split('T')[0]
                return `${dateStr}T${time24}:00`
              }
              return new Date().toISOString()
            })(),
            appointmentDate: appt.appointmentDate || appt.date,
            appointmentType: appt.appointmentType || appt.type || 'New',
            status: appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          })) : []
          
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error(error.message || 'Failed to start session')
    }
  }

  const handleEndSession = () => {
    if (!currentSession) return
    
    if (window.confirm('Are you sure you want to end this session? This will mark all remaining appointments.')) {
      // Clear the session from state and localStorage (don't show completed sessions)
      setCurrentSession(null)
      localStorage.removeItem('doctorCurrentSession')
      
      // Also clear consultation room data when session ends
      localStorage.removeItem('doctorSelectedConsultation')
      localStorage.removeItem('doctorConsultations')
      
      alert('Session ended successfully.')
    }
  }

  const handleCancelSession = () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling the session')
      return
    }

    if (window.confirm('Are you sure? This will cancel all appointments for this session. Patients will be notified and can reschedule.')) {
      // Store cancelled session info for patient notifications
      try {
        const cancelledSessions = JSON.parse(localStorage.getItem('cancelledSessions') || '[]')
        cancelledSessions.push({
          date: currentSession.date,
          reason: cancelReason.trim(),
          cancelledAt: new Date().toISOString(),
        })
        localStorage.setItem('cancelledSessions', JSON.stringify(cancelledSessions))
      } catch (error) {
        console.error('Error saving cancelled session:', error)
      }
      
      // Cancel all appointments
      setAppointments((prev) =>
        prev.map((apt) => ({
          ...apt,
          status: 'cancelled',
          cancelledBy: 'doctor',
          cancelReason: 'Session cancelled by doctor',
        }))
      )
      
      // Clear the session from state and localStorage (don't show cancelled sessions)
      setCurrentSession(null)
      localStorage.removeItem('doctorCurrentSession')
      
      setShowCancelSessionModal(false)
      setCancelReason('')
      alert('Session cancelled. All appointments have been cancelled and patients will be notified.')
    }
  }

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'live':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getSessionStatusText = (status) => {
    switch (status) {
      case 'active':
      case 'live':
        return 'Live'
      case 'scheduled':
        return 'Scheduled'
      case 'paused':
        return 'Paused'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status || 'Not Started'
    }
  }

  const handleCallNext = async (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    if (!appointment) {
      toast.error('Appointment not found')
      return
    }

    // Check if session is active/live
    if (!currentSession || (currentSession.status !== 'active' && currentSession.status !== 'live')) {
      toast.warning('Please start the session first before calling patients')
      return
    }

    try {
      const sessionId = currentSession._id || currentSession.id
      if (!sessionId) {
        toast.error('Session ID not found')
        return
      }

      // Call API to call next patient
      const response = await callNextPatient(sessionId)
      
      if (response.success) {
        toast.success('Patient called successfully')
        
        // Update local state with API response
        if (response.data?.appointment) {
          const calledAppointment = response.data.appointment
          setAppointments((prev) =>
            prev.map((appt) =>
              appt.id === appointmentId || appt._id === calledAppointment._id
                ? { ...appt, status: 'called', queueStatus: 'called' }
                : appt
            )
          )
        }

        // Load shared prescriptions from appointment
        const sharedPrescriptions = appointment.sharedPrescriptions || []
        
        // Navigate to consultations page with patient data
        // Convert appointment to consultation format
        const consultationData = {
          id: `cons-${appointment.id}-${Date.now()}`, // Unique ID with timestamp
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          age: appointment.age,
          gender: appointment.gender,
          appointmentTime: appointment.appointmentTime || new Date().toISOString(),
          appointmentType: appointment.appointmentType || 'Follow-up',
          status: 'in-progress',
          reason: appointment.reason || 'Consultation',
          patientImage: appointment.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=11496c&color=fff&size=160`,
          patientPhone: appointment.patientPhone || '+1-555-987-6543',
          patientEmail: appointment.patientEmail || `${appointment.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          patientAddress: appointment.patientAddress || '123 Patient Street, New York, NY 10001',
          diagnosis: '',
          symptoms: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          followUpDate: '',
          attachments: [],
          sharedPrescriptions: sharedPrescriptions, // Prescriptions shared by patient from other doctors
          sessionId: currentSession.id || currentSession._id,
          sessionDate: currentSession.date,
          calledAt: new Date().toISOString(),
        }

        // Navigate to consultations page with patient data in state
        navigate('/doctor/consultations', {
          state: { selectedConsultation: consultationData },
        })
      } else {
        toast.error(response.message || 'Failed to call patient')
      }
    } catch (error) {
      console.error('Error calling next patient:', error)
      toast.error(error.message || 'Failed to call patient')
    }
  }

  const handleComplete = async (appointmentId) => {
    try {
      const response = await updateQueueStatus(appointmentId, 'completed')
      
      if (response.success) {
        toast.success('Consultation completed successfully')
        // Update local state
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId ? { ...appt, status: 'completed', queueStatus: 'completed' } : appt
          )
        )
        // Refresh appointments
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: appt.appointmentDate 
              ? `${appt.appointmentDate}T${appt.time || '00:00'}`
              : appt.appointmentTime || new Date().toISOString(),
            appointmentType: appt.appointmentType || appt.type || 'New',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to complete consultation')
      }
    } catch (error) {
      console.error('Error completing consultation:', error)
      toast.error(error.message || 'Failed to complete consultation')
    }
  }

  const handleRecall = async (appointmentId) => {
    try {
      const response = await recallPatient(appointmentId)
      
      if (response.success) {
        toast.success('Patient recalled to waiting queue')
        // Update local state
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId ? { ...appt, status: 'waiting', queueStatus: 'waiting' } : appt
          )
        )
        // Refresh appointments
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            // ... other fields
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to recall patient')
      }
    } catch (error) {
      console.error('Error recalling patient:', error)
      toast.error(error.message || 'Failed to recall patient')
    }
  }

  const handleSkip = async (appointmentId) => {
    try {
      const response = await skipPatient(appointmentId)
      
      if (response.success) {
        toast.success('Patient skipped successfully')
        // Update local state
        setAppointments((prev) =>
          prev.map((appt) =>
            appt.id === appointmentId ? { ...appt, status: 'skipped', queueStatus: 'skipped' } : appt
          )
        )
        // Refresh appointments
        const queueResponse = await getPatientQueue(getTodayDateString())
        if (queueResponse.success && queueResponse.data) {
          const queueData = queueResponse.data.queue || queueResponse.data.appointments || []
          const transformedAppointments = queueData.map((appt) => ({
            id: appt._id || appt.id,
            _id: appt._id || appt.id,
            patientId: appt.patientId?._id || appt.patientId || appt.patientId,
            patientName: appt.patientId?.firstName && appt.patientId?.lastName
              ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
              : appt.patientId?.name || appt.patientName || 'Patient',
            age: appt.patientId?.age || appt.age || 0,
            gender: appt.patientId?.gender || appt.gender || 'unknown',
            appointmentTime: appt.appointmentDate 
              ? `${appt.appointmentDate}T${appt.time || '00:00'}`
              : appt.appointmentTime || new Date().toISOString(),
            appointmentType: appt.appointmentType || appt.type || 'New',
            status: appt.status || 'waiting',
            queueStatus: appt.queueStatus || appt.status || 'waiting',
            queueNumber: appt.tokenNumber || appt.queueNumber || 0,
            reason: appt.reason || appt.chiefComplaint || 'Consultation',
            patientImage: appt.patientId?.profileImage || appt.patientId?.image || appt.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
            originalData: appt,
          }))
          setAppointments(transformedAppointments)
        }
      } else {
        toast.error(response.message || 'Failed to skip patient')
      }
    } catch (error) {
      console.error('Error skipping patient:', error)
      toast.error(error.message || 'Failed to skip patient')
    }
  }

  const handleNoShow = (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status: 'no-show' } : appt
      )
    )
    
    alert(`${appointment.patientName} marked as No Show`)
  }

  const handleMoveUp = (appointmentId) => {
    const currentIndex = appointments.findIndex((appt) => appt.id === appointmentId)
    if (currentIndex === 0) return

    setAppointments((prev) => {
      const newAppointments = [...prev]
      ;[newAppointments[currentIndex - 1], newAppointments[currentIndex]] = [
        newAppointments[currentIndex],
        newAppointments[currentIndex - 1],
      ]
      return newAppointments.map((appt, idx) => ({ ...appt, queueNumber: idx + 1 }))
    })
  }

  const handleMoveDown = (appointmentId) => {
    const currentIndex = appointments.findIndex((appt) => appt.id === appointmentId)
    if (currentIndex === appointments.length - 1) return

    setAppointments((prev) => {
      const newAppointments = [...prev]
      ;[newAppointments[currentIndex], newAppointments[currentIndex + 1]] = [
        newAppointments[currentIndex + 1],
        newAppointments[currentIndex],
      ]
      return newAppointments.map((appt, idx) => ({ ...appt, queueNumber: idx + 1 }))
    })
  }

  const handleViewHistory = (appointment) => {
    setSelectedPatient(appointment)
    setShowHistoryModal(true)
  }


  // Patient medical history - loaded from API
  const [medicalHistory, setMedicalHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Load patient history when patient is selected
  useEffect(() => {
    const loadPatientHistory = async () => {
      if (selectedPatient?.patientId || selectedPatient?._id) {
        try {
          setLoadingHistory(true)
          const patientId = selectedPatient.patientId || selectedPatient._id
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            setMedicalHistory(historyResponse.data)
          } else {
            setMedicalHistory(null)
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
          setMedicalHistory(null)
        } finally {
          setLoadingHistory(false)
        }
      } else {
        setMedicalHistory(null)
      }
    }
    
    loadPatientHistory()
  }, [selectedPatient?.patientId, selectedPatient?._id])

  // Show loading state if initial load
  if (loadingAppointments && appointments.length === 0 && !appointmentsError) {
    return (
      <>
        <DoctorNavbar />
        <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300 animate-pulse" />
            <p className="mt-4 text-sm font-medium text-slate-600">Loading patients...</p>
          </div>
        </section>
      </>
    )
  }

  // Show error state if there's an error
  if (appointmentsError && appointments.length === 0) {
    return (
      <>
        <DoctorNavbar />
        <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <IoCloseCircleOutline className="mx-auto h-12 w-12 text-red-300" />
            <p className="mt-4 text-sm font-medium text-red-600">Error loading patients</p>
            <p className="mt-1 text-xs text-red-500">{appointmentsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          {/* Session Status Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <IoCalendarOutline className="h-5 w-5 text-[#11496c]" />
                  <h3 className="text-sm font-bold text-slate-900">Today's Session</h3>
                </div>
                {currentSession ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSessionStatusColor(currentSession.status)}`}>
                        {getSessionStatusText(currentSession.status)}
                      </span>
                      <span className="text-xs text-slate-600">
                        {currentSession?.date && currentSession?.startTime && currentSession?.endTime
                          ? (() => {
                              // Helper to convert time to 12-hour format if needed
                              const formatTime12Hour = (time) => {
                                if (!time) return 'N/A'
                                // If already in 12-hour format (contains AM/PM), return as is
                                if (time.toString().includes('AM') || time.toString().includes('PM')) {
                                  return time
                                }
                                // Convert 24-hour to 12-hour
                                const [hours, minutes] = time.split(':').map(Number)
                                if (isNaN(hours) || isNaN(minutes)) return time
                                const period = hours >= 12 ? 'PM' : 'AM'
                                const hours12 = hours % 12 || 12
                                return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
                              }
                              return `${formatTime12Hour(currentSession.startTime)} - ${formatTime12Hour(currentSession.endTime)}`
                            })()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Avg Time: {currentSession?.averageConsultationMinutes || getAverageConsultationMinutes()} min/patient</span>
                      <span>•</span>
                      <span>Capacity: {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show').length} / {currentSession?.maxTokens || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No session scheduled for today</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {currentSession && (
                  <>
                    {(currentSession.status === 'scheduled' || currentSession.status === 'paused') && (
                      <button
                        type="button"
                        onClick={handleStartSession}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        <IoPlayOutline className="h-4 w-4" />
                        {currentSession.status === 'paused' ? 'Resume Session' : 'Start Session'}
                      </button>
                    )}
                    {(currentSession.status === 'active' || currentSession.status === 'live') && (
                      <button
                        type="button"
                        onClick={handleEndSession}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
                      >
                        <IoStopOutline className="h-4 w-4" />
                        End Session
                      </button>
                    )}
                    {(currentSession.status === 'scheduled' || currentSession.status === 'active' || currentSession.status === 'live' || currentSession.status === 'paused') && (
                      <button
                        type="button"
                        onClick={() => setShowCancelSessionModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 active:scale-95"
                      >
                        <IoCloseCircleOutline className="h-4 w-4" />
                        Cancel Session
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <IoSearchOutline className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patients by name or reason..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Appointment Queue */}
          <div className="space-y-3">
            {!currentSession ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No session available</p>
                <p className="mt-1 text-xs text-slate-500">A session will be created when you book an appointment or manually create one</p>
                {loadingSession && (
                  <p className="mt-2 text-xs text-slate-400">Loading session...</p>
                )}
              </div>
            ) : currentSession.status !== 'active' && currentSession.status !== 'live' && currentSession.status !== 'scheduled' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">Session not started</p>
                <p className="mt-1 text-xs text-slate-500">Click "Start Session" to begin and view appointments</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-600">No appointments found</p>
                <p className="mt-1 text-xs text-slate-500">Your appointment queue will appear here</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-xl border bg-white p-3 shadow-sm transition-all ${
                    appointment.status === 'called' || appointment.status === 'in-consultation'
                      ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]'
                      : appointment.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : appointment.status === 'no-show'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Queue Number, Profile Image, Patient Info, Time */}
                    <div className="flex items-start gap-2.5">
                      {/* Queue Number - Smaller */}
                      <div className="flex shrink-0 items-center justify-center">
                        <span
                          className={`text-xs font-semibold ${
                            appointment.status === 'called' || appointment.status === 'in-consultation'
                              ? 'text-[#11496c]'
                              : appointment.status === 'completed'
                              ? 'text-emerald-700'
                              : appointment.status === 'no-show'
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {appointment.queueNumber}.
                        </span>
                      </div>

                      {/* Profile Image - Side */}
                      <img
                        src={appointment.patientImage}
                        alt={appointment.patientName}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                        }}
                      />

                      {/* Patient Info - Full Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {appointment.patientName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {appointment.age} years • {appointment.gender.charAt(0).toUpperCase()}
                        </p>
                      </div>

                      {/* Time - Right Side */}
                      <div className="flex shrink-0 items-center">
                        <div className="text-xs font-medium text-slate-700">
                          {formatTime(appointment.appointmentTime)}
                        </div>
                      </div>
                    </div>

                    {/* Appointment Type Badge and Consultation Mode */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.appointmentType === 'New'
                            ? 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {appointment.appointmentType === 'New' ? 'New' : 'Follow up'}
                      </span>
                      {/* Consultation Mode Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.consultationMode === 'in_person'
                            ? 'bg-blue-100 text-blue-700'
                            : appointment.consultationMode === 'video_call'
                            ? 'bg-purple-100 text-purple-700'
                            : appointment.consultationMode === 'call'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {appointment.consultationMode === 'in_person' ? (
                          <>
                            <IoPersonOutline className="h-2.5 w-2.5" />
                            <span>In-Person</span>
                          </>
                        ) : appointment.consultationMode === 'video_call' ? (
                          <>
                            <IoVideocamOutline className="h-2.5 w-2.5" />
                            <span>Video Call</span>
                          </>
                        ) : appointment.consultationMode === 'call' ? (
                          <>
                            <IoCallOutline className="h-2.5 w-2.5" />
                            <span>Call</span>
                          </>
                        ) : (
                          <span>In-Person</span>
                        )}
                      </span>
                    </div>

                      {/* Action Buttons - Below patient info */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {appointment.status === 'waiting' && (currentSession?.status === 'active' || currentSession?.status === 'live') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCallNext(appointment.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                          >
                            <IoCallOutline className="h-3.5 w-3.5" />
                            Call to Consultation Room
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSkip(appointment.id)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                          >
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNoShow(appointment.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                          >
                            No Show
                          </button>
                        </>
                      )}
                      {(appointment.status === 'called' || appointment.status === 'in-consultation') && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleComplete(appointment.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                          >
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRecall(appointment.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#11496c] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                          >
                            <IoRefreshOutline className="h-3.5 w-3.5" />
                            Recall
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSkip(appointment.id)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                          >
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNoShow(appointment.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                          >
                            No Show
                          </button>
                        </>
                      )}
                      {appointment.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleViewHistory(appointment)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                        >
                          <IoDocumentTextOutline className="h-3.5 w-3.5" />
                          History
                        </button>
                      )}
                      {appointment.status === 'no-show' && (
                        <button
                          type="button"
                          onClick={() => handleViewHistory(appointment)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                        >
                          <IoDocumentTextOutline className="h-3.5 w-3.5" />
                          History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </section>

      {/* Medical History Modal */}
      {showHistoryModal && selectedPatient && medicalHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryModal(false)
            }
          }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPatient.patientImage}
                  alt={selectedPatient.patientName}
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedPatient.patientName}</h2>
                  <p className="text-xs text-slate-600">
                    {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Personal Information */}
              {medicalHistory.personalInfo && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Personal Information
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="grid gap-2 grid-cols-2">
                      {medicalHistory.personalInfo.bloodGroup && (
                        <div>
                          <p className="text-xs text-slate-600">Blood Group</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.bloodGroup}
                          </p>
                        </div>
                      )}
                      {medicalHistory.personalInfo.phone && (
                        <div>
                          <p className="text-xs text-slate-600">Phone</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {medicalHistory.personalInfo.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Conditions */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Conditions
                </h3>
                {medicalHistory.conditions && medicalHistory.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.conditions.map((condition, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{condition.name || condition}</p>
                        {condition.diagnosedDate && (
                          <p className="text-xs text-slate-600 mt-1">
                            Since {formatDate(condition.diagnosedDate)} • {condition.status || 'Active'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">No known conditions</p>
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Allergies
                </h3>
                {medicalHistory.allergies && medicalHistory.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.allergies.map((allergy, idx) => (
                      <div key={idx} className="rounded-lg bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-900">{allergy.name || allergy}</p>
                        {allergy.severity && (
                          <p className="text-xs text-red-700 mt-1">
                            {allergy.severity} • {allergy.reaction || ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-xs text-slate-500">No known allergies</p>
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div>
                <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Current Medications
                </h3>
                {medicalHistory.medications && medicalHistory.medications.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">
                          {med.name || med}
                        </p>
                        {med.dosage && med.frequency && (
                          <p className="text-xs text-emerald-700 mt-1">
                            {med.dosage} • {med.frequency}
                          </p>
                        )}
                        {med.startDate && (
                          <p className="text-xs text-emerald-600 mt-1">Since {formatDate(med.startDate)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-slate-500">No current medications</p>
                  </div>
                )}
              </div>

              {/* Vitals Records */}
              {(() => {
                try {
                  const historyKey = `patientHistory_${selectedPatient?.patientId}`
                  const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}')
                  const vitalsRecords = savedHistory.vitalsRecords || []
                  
                  if (vitalsRecords.length > 0) {
                    return (
                      <div>
                        <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                          Vitals Records
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {vitalsRecords.map((vital, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-600">
                                  {vital.recordedAt || formatDate(vital.date)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                                  <div>
                                    <p className="text-slate-600">BP</p>
                                    <p className="font-semibold text-slate-900">
                                      {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                                    </p>
                                  </div>
                                )}
                                {vital.temperature && (
                                  <div>
                                    <p className="text-slate-600">Temp</p>
                                    <p className="font-semibold text-slate-900">{vital.temperature} °F</p>
                                  </div>
                                )}
                                {vital.pulse && (
                                  <div>
                                    <p className="text-slate-600">Pulse</p>
                                    <p className="font-semibold text-slate-900">{vital.pulse} bpm</p>
                                  </div>
                                )}
                                {vital.respiratoryRate && (
                                  <div>
                                    <p className="text-slate-600">RR</p>
                                    <p className="font-semibold text-slate-900">{vital.respiratoryRate} /min</p>
                                  </div>
                                )}
                                {vital.oxygenSaturation && (
                                  <div>
                                    <p className="text-slate-600">SpO2</p>
                                    <p className="font-semibold text-slate-900">{vital.oxygenSaturation}%</p>
                                  </div>
                                )}
                                {vital.weight && (
                                  <div>
                                    <p className="text-slate-600">Weight</p>
                                    <p className="font-semibold text-slate-900">{vital.weight} kg</p>
                                  </div>
                                )}
                                {vital.height && (
                                  <div>
                                    <p className="text-slate-600">Height</p>
                                    <p className="font-semibold text-slate-900">{vital.height} cm</p>
                                  </div>
                                )}
                                {vital.bmi && (
                                  <div>
                                    <p className="text-slate-600">BMI</p>
                                    <p className="font-semibold text-slate-900">{vital.bmi}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                } catch (error) {
                  console.error('Error loading vitals records:', error)
                }
                return null
              })()}

              {/* Previous Consultations */}
              {medicalHistory.previousConsultations && medicalHistory.previousConsultations.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Previous Consultations
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {medicalHistory.previousConsultations.map((consult, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{consult.diagnosis}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(consult.date)}</p>
                            <p className="mt-1 text-xs text-slate-600">Dr. {consult.doctor}</p>
                            {consult.medications && consult.medications.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {consult.medications.map((med, medIdx) => (
                                  <span
                                    key={medIdx}
                                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                  >
                                    {med}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Reports */}
              {medicalHistory.labReports && medicalHistory.labReports.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Lab Reports
                  </h3>
                  <div className="space-y-2">
                    {medicalHistory.labReports.map((report, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{report.testName}</p>
                            <p className="mt-1 text-xs text-slate-600">{formatDate(report.date)}</p>
                            <p className="mt-1 text-xs font-medium text-slate-900">{report.result}</p>
                            <span
                              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                report.status === 'Normal'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Visit */}
              {medicalHistory.lastVisit && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold text-slate-900 uppercase tracking-wide">
                    Last Visit
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-700">{formatDate(medicalHistory.lastVisit)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Session Modal */}
      {showCancelSessionModal && currentSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowCancelSessionModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cancel Session</h2>
                  <p className="text-xs text-slate-600">{currentSession?.date ? formatDate(currentSession.date) : 'N/A'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelSessionModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800 mb-1">Warning</p>
                <p className="text-xs text-red-700">
                  Cancelling this session will cancel all appointments. Patients will be notified and can reschedule.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this session..."
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowCancelSessionModal(false)
                  setCancelReason('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={handleCancelSession}
                disabled={!cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorPatients
