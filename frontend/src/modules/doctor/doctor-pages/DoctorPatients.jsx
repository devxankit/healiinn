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

const DoctorPatients = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  const [appointments, setAppointments] = useState(mockAppointments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const filteredAppointments = appointments.filter(
    (appt) =>
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            {filteredAppointments.length === 0 ? (
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
    </>
  )
}

export default DoctorPatients
