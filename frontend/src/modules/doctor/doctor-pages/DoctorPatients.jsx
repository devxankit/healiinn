import { useState } from 'react'
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
} from 'react-icons/io5'

// Mock data
const mockAppointments = [
  {
    id: 'appt-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    age: 45,
    gender: 'male',
    appointmentTime: '2025-01-15T09:00:00',
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
    appointmentTime: '2025-01-15T09:30:00',
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
    appointmentTime: '2025-01-15T10:00:00',
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
    appointmentTime: '2025-01-15T10:30:00',
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
    appointmentTime: '2025-01-15T11:00:00',
    appointmentType: 'New',
    status: 'waiting',
    queueNumber: 5,
    reason: 'Annual checkup',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
  },
]

const mockMedicalHistory = {
  'pat-1': {
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    medications: ['Amlodipine 5mg', 'Metformin 500mg'],
    lastVisit: '2024-12-15',
  },
  'pat-2': {
    conditions: [],
    allergies: [],
    medications: [],
    lastVisit: null,
  },
  'pat-3': {
    conditions: ['Type 2 Diabetes'],
    allergies: ['Peanuts'],
    medications: ['Insulin Glargine'],
    lastVisit: '2024-12-20',
  },
  'pat-4': {
    conditions: ['Osteoarthritis'],
    allergies: [],
    medications: ['Ibuprofen 400mg'],
    lastVisit: '2025-01-01',
  },
  'pat-5': {
    conditions: [],
    allergies: [],
    medications: [],
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
  
  // Session state
  const [currentSession, setCurrentSession] = useState(() => {
    // Load session from localStorage if exists
    try {
      const saved = localStorage.getItem('doctorCurrentSession')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
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
  
  const [appointments, setAppointments] = useState(mockAppointments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Calculate max tokens for current session form
  const maxTokens = currentSession
    ? currentSession.maxTokens
    : calculateMaxTokens(sessionForm.startTime, sessionForm.endTime, sessionForm.averageConsultationMinutes)

  const filteredAppointments = appointments.filter(
    (appt) =>
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    setShowCreateSessionModal(false)
    alert('Session created successfully! Click "Start Session" to begin the queue.')
  }

  const handleStartSession = () => {
    if (!currentSession) return
    
    const updatedSession = {
      ...currentSession,
      status: 'active',
      startedAt: new Date().toISOString(),
    }
    
    setCurrentSession(updatedSession)
    localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
    alert('Session started! Queue is now active.')
  }

  const handleEndSession = () => {
    if (!currentSession) return
    
    if (window.confirm('Are you sure you want to end this session? This will mark all remaining appointments.')) {
      const updatedSession = {
        ...currentSession,
        status: 'completed',
        endedAt: new Date().toISOString(),
      }
      
      setCurrentSession(updatedSession)
      localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
      alert('Session ended successfully.')
    }
  }

  const handleCancelSession = () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling the session')
      return
    }

    if (window.confirm('Are you sure? This will cancel all appointments for this session. Patients will be notified and can reschedule.')) {
      const updatedSession = {
        ...currentSession,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelReason: cancelReason.trim(),
      }
      
      setCurrentSession(updatedSession)
      localStorage.setItem('doctorCurrentSession', JSON.stringify(updatedSession))
      
      // Cancel all appointments
      setAppointments((prev) =>
        prev.map((apt) => ({
          ...apt,
          status: 'cancelled',
          cancelledBy: 'doctor',
          cancelReason: 'Session cancelled by doctor',
        }))
      )
      
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
      
      setShowCancelSessionModal(false)
      setCancelReason('')
      alert('Session cancelled. All appointments have been cancelled and patients will be notified.')
    }
  }

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
    if (!appointment) return

    // Update status locally
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === appointmentId ? { ...appt, status: 'called' } : appt
      )
    )

    // Navigate to consultations page with patient data
    // Convert appointment to consultation format
    const consultationData = {
      id: `cons-${appointment.id}`,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      age: appointment.age,
      gender: appointment.gender,
      appointmentTime: appointment.appointmentTime,
      appointmentType: appointment.appointmentType,
      status: 'in-progress',
      reason: appointment.reason,
      patientImage: appointment.patientImage,
      patientPhone: '+1-555-987-6543', // Default phone
      patientEmail: `${appointment.patientName.toLowerCase().replace(' ', '.')}@example.com`, // Default email
      patientAddress: '123 Patient Street, New York, NY 10001', // Default address
      diagnosis: '',
      vitals: {},
      medications: [],
      investigations: [],
      advice: '',
      attachments: [],
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
                      <span>Avg Time: {currentSession.averageConsultationMinutes} min/patient</span>
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
                    onClick={() => setShowCreateSessionModal(true)}
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
                      <button
                        type="button"
                        onClick={handleEndSession}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-95"
                      >
                        <IoStopOutline className="h-4 w-4" />
                        End Session
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
                  onClick={() => setShowCreateSessionModal(true)}
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
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
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
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              {/* Medical Conditions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <IoMedicalOutline className="h-4 w-4 text-[#11496c]" />
                  Medical Conditions
                </h3>
                {medicalHistory.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.conditions.map((condition, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-[rgba(17,73,108,0.15)] px-3 py-1 text-xs font-semibold text-[#11496c]"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No known conditions</p>
                )}
              </div>

              {/* Allergies */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <IoMedicalOutline className="h-4 w-4 text-red-600" />
                  Allergies
                </h3>
                {medicalHistory.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No known allergies</p>
                )}
              </div>

              {/* Current Medications */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <IoDocumentTextOutline className="h-4 w-4 text-emerald-600" />
                  Current Medications
                </h3>
                {medicalHistory.medications.length > 0 ? (
                  <div className="space-y-2">
                    {medicalHistory.medications.map((medication, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        {medication}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No current medications</p>
                )}
              </div>

              {/* Last Visit */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <IoCalendarOutline className="h-4 w-4 text-slate-600" />
                  Last Visit
                </h3>
                <p className="text-xs font-medium text-slate-700">{formatDate(medicalHistory.lastVisit)}</p>
              </div>
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
                  min="5"
                  max="60"
                  value={sessionForm.averageConsultationMinutes}
                  onChange={(e) => {
                    const value = Math.max(5, Math.min(60, parseInt(e.target.value) || 5))
                    setSessionForm({ ...sessionForm, averageConsultationMinutes: value })
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                />
                <p className="mt-1 text-xs text-slate-500">Range: 5 - 60 minutes</p>
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
