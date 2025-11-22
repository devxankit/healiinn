import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
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
  IoPauseOutline,
} from 'react-icons/io5'

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mock data - using today's date dynamically
const getMockAppointments = () => {
  const today = getTodayDateString()
  return [
    {
      id: 'appt-1',
      patientId: 'pat-1',
      patientName: 'John Doe',
      age: 45,
      gender: 'male',
      appointmentTime: `${today}T09:00:00`,
      appointmentType: 'Follow-up',
      status: 'waiting',
      queueNumber: 1,
      reason: 'Hypertension follow-up',
      patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    },
    {
      id: 'appt-2',
      patientId: 'pat-2',
      patientName: 'Sarah Smith',
      age: 32,
      gender: 'female',
      appointmentTime: `${today}T09:30:00`,
      appointmentType: 'New',
      status: 'waiting',
      queueNumber: 2,
      reason: 'Chest pain evaluation',
      patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    },
    {
      id: 'appt-3',
      patientId: 'pat-3',
      patientName: 'Mike Johnson',
      age: 28,
      gender: 'male',
      appointmentTime: `${today}T10:00:00`,
      appointmentType: 'Follow-up',
      status: 'waiting',
      queueNumber: 3,
      reason: 'Diabetes management',
      patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    },
    {
      id: 'appt-4',
      patientId: 'pat-4',
      patientName: 'Emily Brown',
      age: 55,
      gender: 'female',
      appointmentTime: `${today}T10:30:00`,
      appointmentType: 'Follow-up',
      status: 'waiting',
      queueNumber: 4,
      reason: 'Arthritis consultation',
      patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    },
    {
      id: 'appt-5',
      patientId: 'pat-5',
      patientName: 'David Wilson',
      age: 38,
      gender: 'male',
      appointmentTime: `${today}T11:00:00`,
      appointmentType: 'New',
      status: 'waiting',
      queueNumber: 5,
      reason: 'Annual checkup',
      patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    },
  ]
}

const mockAppointments = getMockAppointments()

const mockMedicalHistory = {
  'pat-1': {
    personalInfo: {
      name: 'John Doe',
      age: 45,
      gender: 'male',
      bloodGroup: 'O+',
      phone: '+1-555-123-4567',
      email: 'john.doe@example.com',
    },
    conditions: [
      { name: 'Hypertension', diagnosedDate: '2020-03-15', status: 'Active' },
      { name: 'Type 2 Diabetes', diagnosedDate: '2019-06-20', status: 'Active' },
    ],
    allergies: [{ name: 'Penicillin', severity: 'Moderate', reaction: 'Rash' }],
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', startDate: '2020-03-20' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', startDate: '2019-07-01' },
    ],
    surgeries: [
      { name: 'Appendectomy', date: '2010-05-10', hospital: 'City General Hospital' },
    ],
    previousConsultations: [
      {
        date: '2024-12-15',
        diagnosis: 'Hypertension',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Amlodipine 5mg'],
      },
      {
        date: '2024-11-20',
        diagnosis: 'Diabetes Management',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Metformin 500mg'],
      },
    ],
    labReports: [
      { testName: 'Blood Sugar Fasting', date: '2024-12-10', result: '110 mg/dL', status: 'Normal' },
      { testName: 'HbA1c', date: '2024-12-10', result: '6.8%', status: 'Elevated' },
    ],
    lastVisit: '2024-12-15',
  },
  'pat-2': {
    personalInfo: {
      name: 'Sarah Smith',
      age: 32,
      gender: 'female',
      bloodGroup: 'A+',
      phone: '+1-555-234-5678',
      email: 'sarah.smith@example.com',
    },
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    previousConsultations: [],
    labReports: [],
    lastVisit: null,
  },
  'pat-3': {
    personalInfo: {
      name: 'Mike Johnson',
      age: 28,
      gender: 'male',
      bloodGroup: 'B+',
      phone: '+1-555-345-6789',
      email: 'mike.johnson@example.com',
    },
    conditions: [
      { name: 'Type 2 Diabetes', diagnosedDate: '2023-01-10', status: 'Active' },
    ],
    allergies: [{ name: 'Peanuts', severity: 'Severe', reaction: 'Anaphylaxis' }],
    medications: [
      { name: 'Insulin Glargine', dosage: '20 units', frequency: 'Once daily', startDate: '2023-01-15' },
    ],
    surgeries: [],
    previousConsultations: [
      {
        date: '2024-12-20',
        diagnosis: 'Diabetes Management',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Insulin Glargine 20 units'],
      },
    ],
    labReports: [],
    lastVisit: '2024-12-20',
  },
  'pat-4': {
    personalInfo: {
      name: 'Emily Brown',
      age: 55,
      gender: 'female',
      bloodGroup: 'AB+',
      phone: '+1-555-456-7890',
      email: 'emily.brown@example.com',
    },
    conditions: [
      { name: 'Osteoarthritis', diagnosedDate: '2022-05-15', status: 'Active' },
    ],
    allergies: [],
    medications: [
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', startDate: '2022-05-20' },
    ],
    surgeries: [],
    previousConsultations: [
      {
        date: '2025-01-01',
        diagnosis: 'Arthritis Consultation',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Ibuprofen 400mg'],
      },
    ],
    labReports: [],
    lastVisit: '2025-01-01',
  },
  'pat-5': {
    personalInfo: {
      name: 'David Wilson',
      age: 38,
      gender: 'male',
      bloodGroup: 'O-',
      phone: '+1-555-567-8901',
      email: 'david.wilson@example.com',
    },
    conditions: [],
    allergies: [],
    medications: [],
    surgeries: [],
    previousConsultations: [],
    labReports: [],
    lastVisit: null,
  },
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMs = end - start
  const diffMinutes = diffMs / (1000 * 60)
  return Math.floor(diffMinutes / averageMinutes)
}

const DoctorPatients = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  // Function to automatically create session based on doctor profile
  const autoCreateSession = () => {
    try {
      const today = getTodayDateString()
      
      // Check if session already exists for today
      const existingSession = localStorage.getItem('doctorCurrentSession')
      if (existingSession) {
        const session = JSON.parse(existingSession)
        if (session.date === today && session.status !== 'cancelled' && session.status !== 'completed') {
          return session // Session already exists
        }
      }
      
      // Get doctor profile from localStorage
      const profile = JSON.parse(localStorage.getItem('doctorProfile') || '{}')
      
      // Check if doctor has availability settings
      if (!profile.availability || profile.availability.length === 0) {
        return null // No availability set, cannot auto-create
      }
      
      // Get today's day name
      const todayDate = new Date()
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const todayDayName = dayNames[todayDate.getDay()]
      
      // Find availability for today
      const todayAvailability = profile.availability.find(avail => avail.day === todayDayName)
      
      if (!todayAvailability) {
        return null // Doctor not available today
      }
      
      // Get average consultation minutes from profile
      const averageMinutes = profile.averageConsultationMinutes || 20
      
      // Create session automatically
      const session = {
        id: `session-${Date.now()}`,
        date: today,
        startTime: todayAvailability.startTime || '09:00',
        endTime: todayAvailability.endTime || '17:00',
        averageConsultationMinutes: averageMinutes,
        maxTokens: calculateMaxTokens(todayAvailability.startTime || '09:00', todayAvailability.endTime || '17:00', averageMinutes),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        autoCreated: true, // Flag to indicate auto-created
      }
      
      // Save to localStorage
      localStorage.setItem('doctorCurrentSession', JSON.stringify(session))
      
      // Also save to doctorSessions for patient booking connection
      try {
        const doctorSessions = JSON.parse(localStorage.getItem('doctorSessions') || '[]')
        const filtered = doctorSessions.filter((s) => s.date !== session.date)
        filtered.push(session)
        localStorage.setItem('doctorSessions', JSON.stringify(filtered))
      } catch (error) {
        console.error('Error saving session to doctorSessions:', error)
      }
      
      return session
    } catch (error) {
      console.error('Error auto-creating session:', error)
      return null
    }
  }

  // Session state - auto-create if needed
  const [currentSession, setCurrentSession] = useState(() => {
    // Load session from localStorage if exists
    try {
      const saved = localStorage.getItem('doctorCurrentSession')
      if (saved) {
        const session = JSON.parse(saved)
        
        // Don't show cancelled or completed sessions
        if (session.status === 'cancelled' || session.status === 'completed') {
          localStorage.removeItem('doctorCurrentSession')
        } else {
          // Check if session date is today
          const today = getTodayDateString()
          const sessionDate = session.date
          
          // If session is for today, return it
          if (sessionDate === today) {
            return session
          } else {
            // Clear old session
            localStorage.removeItem('doctorCurrentSession')
          }
        }
      }
      
      // Auto-create session if not exists
      return autoCreateSession()
    } catch {
      // Try to auto-create on error
      return autoCreateSession()
    }
  })
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  
  // Session form state
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '09:00',
    endTime: '17:00',
    averageConsultationMinutes: getAverageConsultationMinutes(),
  })

  // Auto-create session on component mount and when profile changes
  useEffect(() => {
    const today = getTodayDateString()
    
    // Check if we need to auto-create session
    if (!currentSession || currentSession.date !== today) {
      const autoSession = autoCreateSession()
      if (autoSession && (!currentSession || currentSession.date !== today)) {
        setCurrentSession(autoSession)
      }
    }
  }, []) // Run once on mount

  // Re-check for auto-creation when navigating to this page (in case profile was updated)
  useEffect(() => {
    if (location.pathname === '/doctor/patients' || location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/') {
      const today = getTodayDateString()
      if (!currentSession || currentSession.date !== today) {
        const autoSession = autoCreateSession()
        if (autoSession) {
          setCurrentSession(autoSession)
        }
      }
    }
  }, [location.pathname])
  
  // Load appointments from localStorage and merge with mock data
  const [appointments, setAppointments] = useState(() => {
    // Get fresh mock appointments with today's date
    const todayMockAppointments = getMockAppointments()
    
    try {
      const saved = localStorage.getItem('doctorAppointments')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Merge with mock appointments, preserving status from localStorage
        const merged = todayMockAppointments.map((mockAppt) => {
          // Check if this appointment exists in saved data with updated status
          const savedAppt = parsed.find((a) => a.id === mockAppt.id)
          if (savedAppt) {
            // Preserve status and other updates from localStorage
            return { ...mockAppt, ...savedAppt }
          }
          return mockAppt
        })
        
        // Add any new appointments that aren't in mock data
        parsed.forEach((appt) => {
          const exists = merged.find((a) => a.id === appt.id)
          if (!exists) {
            merged.push(appt)
          }
        })
        return merged
      }
    } catch (error) {
      console.error('Error loading appointments from localStorage:', error)
    }
    return todayMockAppointments
  })
  
  // Save appointments to localStorage whenever they change
  useEffect(() => {
    try {
      const todayMockAppointments = getMockAppointments()
      
      // Save appointments that have status changes or are new
      const appointmentsToSave = appointments
        .filter((appt) => {
          const mockAppt = todayMockAppointments.find((ma) => ma.id === appt.id)
          if (mockAppt) {
            // Save if status or queueNumber is different from default mock status
            return appt.status !== mockAppt.status || appt.queueNumber !== mockAppt.queueNumber
          }
          // Save if it's a new appointment not in mock data
          return true
        })
        .map((appt) => ({
          id: appt.id,
          patientId: appt.patientId,
          status: appt.status,
          queueNumber: appt.queueNumber,
          appointmentTime: appt.appointmentTime,
          patientName: appt.patientName,
          reason: appt.reason,
        }))
      
      if (appointmentsToSave.length > 0) {
        localStorage.setItem('doctorAppointments', JSON.stringify(appointmentsToSave))
      } else {
        // Clear localStorage if no appointments to save
        localStorage.removeItem('doctorAppointments')
      }
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error)
    }
  }, [appointments])
  
  // Reload appointments when navigating back to this page
  useEffect(() => {
    if (location.pathname === '/doctor/patients') {
      // Reload appointments from localStorage to get updated status
      try {
        const saved = localStorage.getItem('doctorAppointments')
        if (saved) {
          const parsed = JSON.parse(saved)
          const todayMockAppointments = getMockAppointments()
          
          // Merge with mock appointments, preserving status from localStorage
          const merged = todayMockAppointments.map((mockAppt) => {
            const savedAppt = parsed.find((a) => a.id === mockAppt.id)
            if (savedAppt) {
              return { ...mockAppt, ...savedAppt }
            }
            return mockAppt
          })
          
          // Add any new appointments
          parsed.forEach((appt) => {
            const exists = merged.find((a) => a.id === appt.id)
            if (!exists) {
              merged.push(appt)
            }
          })
          
          setAppointments(merged)
        }
      } catch (error) {
        console.error('Error reloading appointments:', error)
      }
    }
  }, [location.pathname])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Check session date on mount and clear if not today
  useEffect(() => {
    if (currentSession) {
      const today = new Date().toISOString().split('T')[0]
      const sessionDate = currentSession.date
      
      // If session is cancelled, completed, or not for today, clear it
      if (
        currentSession.status === 'cancelled' ||
        currentSession.status === 'completed' ||
        sessionDate !== today
      ) {
        setCurrentSession(null)
        localStorage.removeItem('doctorCurrentSession')
      }
    }
  }, [currentSession])

  // Calculate max tokens for current session form
  const maxTokens = currentSession
    ? currentSession.maxTokens
    : calculateMaxTokens(sessionForm.startTime, sessionForm.endTime, sessionForm.averageConsultationMinutes)

  const filteredAppointments = appointments.filter((appt) => {
    // Filter by session date if session exists
    if (currentSession) {
      const sessionDate = new Date(currentSession.date)
      const appointmentDate = new Date(appt.appointmentTime)
      
      // Compare dates (year, month, day only, ignore time)
      const sessionDateStr = sessionDate.toISOString().split('T')[0]
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0]
      
      if (sessionDateStr !== appointmentDateStr) {
        return false
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        appt.patientName.toLowerCase().includes(searchLower) ||
        appt.reason.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Session management functions
  const handleCreateSession = () => {
    const session = {
      id: `session-${Date.now()}`,
      date: sessionForm.date,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      averageConsultationMinutes: sessionForm.averageConsultationMinutes,
      maxTokens: maxTokens,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    }
    
    setCurrentSession(session)
    localStorage.setItem('doctorCurrentSession', JSON.stringify(session))
    
    // Also save to doctorSessions for patient booking connection
    try {
      const doctorSessions = JSON.parse(localStorage.getItem('doctorSessions') || '[]')
      // Remove old session for same date if exists
      const filtered = doctorSessions.filter((s) => s.date !== session.date)
      filtered.push(session)
      localStorage.setItem('doctorSessions', JSON.stringify(filtered))
    } catch (error) {
      console.error('Error saving session to doctorSessions:', error)
    }
    
    setShowCreateSessionModal(false)
    alert('Session created successfully! Click "Start Session" to begin the queue.')
  }

  const handleStartSession = () => {
    if (!currentSession) return
    
    const updatedSession = {
      ...currentSession,
      status: 'active',
      startedAt: new Date().toISOString(),
      pausedAt: null,
      resumedAt: null,
    }
    
    setCurrentSession(updatedSession)
    localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
    alert('Session started! Queue is now active.')
  }

  const handlePauseSession = () => {
    if (!currentSession || currentSession.status !== 'active') return
    
    const updatedSession = {
      ...currentSession,
      status: 'paused',
      pausedAt: new Date().toISOString(),
    }
    
    setCurrentSession(updatedSession)
    localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
    alert('Session paused. Patients will be notified.')
  }

  const handleResumeSession = () => {
    if (!currentSession || currentSession.status !== 'paused') return
    
    const updatedSession = {
      ...currentSession,
      status: 'active',
      resumedAt: new Date().toISOString(),
    }
    
    setCurrentSession(updatedSession)
    localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
    alert('Session resumed! Queue is active again.')
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
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'paused':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200'
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
        return 'Active'
      case 'paused':
        return 'Paused'
      case 'scheduled':
        return 'Scheduled'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Not Started'
    }
  }

  const handleCallNext = (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    if (!appointment) {
      alert('Appointment not found')
      return
    }

    // Check if session is active
    if (!currentSession || currentSession.status !== 'active') {
      alert('Please start the session first before calling patients')
      return
    }

    // Update status locally
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status: 'called' } : appt
      )
    )

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
      sessionId: currentSession.id,
      sessionDate: currentSession.date,
      calledAt: new Date().toISOString(),
    }

    // Navigate to consultations page with patient data in state
    navigate('/doctor/consultations', {
      state: { selectedConsultation: consultationData },
    })
  }

  const handleComplete = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status: 'completed' } : appt
      )
    )
    alert('Consultation completed')
  }

  const handleRecall = (appointmentId) => {
    alert('Patient recalled')
  }

  const handleSkip = (appointmentId) => {
    const appointment = appointments.find((appt) => appt.id === appointmentId)
    const currentIndex = appointments.findIndex((appt) => appt.id === appointmentId)
    
    // Move to end of queue
    setAppointments((prev) => {
      const newAppointments = [...prev]
      const skipped = newAppointments.splice(currentIndex, 1)[0]
      skipped.queueNumber = newAppointments.length + 1
      newAppointments.push(skipped)
      return newAppointments.map((appt, idx) => ({ ...appt, queueNumber: idx + 1 }))
    })
    
    alert(`${appointment.patientName} skipped to end of queue`)
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

  // Reset form to profile values when opening create session modal
  const handleOpenCreateSessionModal = () => {
    setSessionForm({
      date: new Date().toISOString().split('T')[0], // Today
      startTime: '09:00',
      endTime: '17:00',
      averageConsultationMinutes: getAverageConsultationMinutes(), // Reset to profile value
    })
    setShowCreateSessionModal(true)
  }

  const medicalHistory = selectedPatient ? mockMedicalHistory[selectedPatient.patientId] : null

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
                        {formatTime(`${currentSession.date}T${currentSession.startTime}`)} - {formatTime(`${currentSession.date}T${currentSession.endTime}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Avg Time: {currentSession.averageConsultationMinutes || getAverageConsultationMinutes()} min/patient</span>
                      <span>•</span>
                      <span>Capacity: {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no-show').length} / {currentSession.maxTokens}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No session created for today</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {!currentSession ? (
                  <button
                    type="button"
                    onClick={handleOpenCreateSessionModal}
                    className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoAddOutline className="h-4 w-4" />
                    Create Session
                  </button>
                ) : (
                  <>
                    {currentSession.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={handleStartSession}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        <IoPlayOutline className="h-4 w-4" />
                        Start Session
                      </button>
                    )}
                    {currentSession.status === 'active' && (
                      <>
                        <button
                          type="button"
                          onClick={handlePauseSession}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95"
                        >
                          <IoPauseOutline className="h-4 w-4" />
                          Pause Session
                        </button>
                        <button
                          type="button"
                          onClick={handleEndSession}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
                        >
                          <IoStopOutline className="h-4 w-4" />
                          End Session
                        </button>
                      </>
                    )}
                    {currentSession.status === 'paused' && (
                      <button
                        type="button"
                        onClick={handleResumeSession}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                      >
                        <IoPlayOutline className="h-4 w-4" />
                        Resume Session
                      </button>
                    )}
                    {(currentSession.status === 'scheduled' || currentSession.status === 'active') && (
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
                <p className="mt-4 text-sm font-medium text-slate-600">No session created</p>
                <p className="mt-1 text-xs text-slate-500">Create a session to view patient queue</p>
                <button
                  type="button"
                  onClick={handleOpenCreateSessionModal}
                  className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                >
                  <IoAddOutline className="h-4 w-4" />
                  Create Session
                </button>
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

                    {/* Appointment Type Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          appointment.appointmentType === 'New'
                            ? 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {appointment.appointmentType === 'New' ? 'New' : 'Follow up'}
                      </span>
                    </div>

                    {/* Action Buttons - Below patient info */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {appointment.status === 'waiting' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCallNext(appointment.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                          >
                            <IoPlayOutline className="h-3.5 w-3.5" />
                            Call Next
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

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowCreateSessionModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Create Session</h2>
              <button
                type="button"
                onClick={() => setShowCreateSessionModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">Date</label>
                <input
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">Start Time</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => {
                      setSessionForm({ ...sessionForm, startTime: e.target.value })
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">End Time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => {
                      setSessionForm({ ...sessionForm, endTime: e.target.value })
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Average Consultation Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={sessionForm.averageConsultationMinutes ?? ''}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    
                    // Allow empty input while typing
                    if (inputValue === '') {
                      setSessionForm({ ...sessionForm, averageConsultationMinutes: '' })
                      return
                    }
                    
                    // Parse the number (removes leading zeros automatically)
                    const numValue = parseInt(inputValue, 10)
                    
                    // If it's a valid number and within range
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 60) {
                      setSessionForm({ ...sessionForm, averageConsultationMinutes: numValue })
                    }
                    // If invalid or out of range, don't update (keeps previous valid value)
                  }}
                  onBlur={(e) => {
                    // On blur, ensure we have a valid value
                    const inputValue = e.target.value.trim()
                    if (inputValue === '') {
                      // If empty, set to profile value
                      const profileValue = getAverageConsultationMinutes()
                      setSessionForm({ ...sessionForm, averageConsultationMinutes: profileValue })
                    } else {
                      const numValue = parseInt(inputValue, 10)
                      if (isNaN(numValue) || numValue < 0 || numValue > 60) {
                        // If invalid, set to profile value
                        const profileValue = getAverageConsultationMinutes()
                        setSessionForm({ ...sessionForm, averageConsultationMinutes: profileValue })
                      } else {
                        // Ensure the value is set correctly (removes any leading zeros)
                        setSessionForm({ ...sessionForm, averageConsultationMinutes: numValue })
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                />
                <p className="mt-1 text-xs text-slate-500">Range: 0 - 60 minutes</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Max Capacity:</span>
                  <span className="font-bold text-[#11496c]">{maxTokens} patients</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Based on session duration and average consultation time
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => setShowCreateSessionModal(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={!sessionForm.startTime || !sessionForm.endTime || sessionForm.startTime >= sessionForm.endTime}
                className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Create Session
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
                  <p className="text-xs text-slate-600">{formatDate(currentSession.date)}</p>
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
