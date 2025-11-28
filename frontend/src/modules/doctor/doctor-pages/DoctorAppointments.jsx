import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoCloseCircleOutline,
  IoCloseOutline,
} from 'react-icons/io5'

// Mock data for appointments
const mockAllAppointments = [
  // Today's appointments
  {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    date: '2025-01-15',
    time: '09:00 AM',
    type: 'In-person',
    status: 'confirmed',
    duration: '30 min',
    reason: 'Follow-up consultation',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-2',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    date: '2025-01-15',
    time: '10:30 AM',
    type: 'In-person',
    status: 'confirmed',
    duration: '45 min',
    reason: 'Initial consultation',
    appointmentType: 'New',
  },
  {
    id: 'apt-3',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    date: '2025-01-15',
    time: '02:00 PM',
    type: 'In-person',
    status: 'scheduled', // Backend status - will display as 'pending'
    duration: '20 min',
    reason: 'Quick check-up',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-4',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    date: '2025-01-15',
    time: '03:30 PM',
    type: 'In-person',
    status: 'confirmed',
    duration: '30 min',
    reason: 'Routine check-up',
    appointmentType: 'Follow-up',
  },
  // This month appointments (already today's + more)
  {
    id: 'apt-5',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    date: '2025-01-14',
    time: '11:00 AM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Annual checkup',
    appointmentType: 'New',
  },
  {
    id: 'apt-6',
    patientId: 'pat-6',
    patientName: 'Lisa Anderson',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=ef4444&color=fff&size=160',
    date: '2025-01-13',
    time: '09:30 AM',
    type: 'In-person',
    status: 'completed',
    duration: '45 min',
    reason: 'Prescription follow-up',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-7',
    patientId: 'pat-7',
    patientName: 'Robert Taylor',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=6366f1&color=fff&size=160',
    date: '2025-01-12',
    time: '02:30 PM',
    type: 'In-person',
    status: 'completed',
    duration: '20 min',
    reason: 'Lab results review',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-8',
    patientId: 'pat-8',
    patientName: 'Jennifer Martinez',
    patientImage: 'https://ui-avatars.com/api/?name=Jennifer+Martinez&background=14b8a6&color=fff&size=160',
    date: '2025-01-11',
    time: '10:00 AM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Initial consultation',
    appointmentType: 'New',
  },
  {
    id: 'apt-9',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    date: '2025-01-10',
    time: '03:00 PM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Hypertension follow-up',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-10',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    date: '2025-01-09',
    time: '11:30 AM',
    type: 'In-person',
    status: 'completed',
    duration: '45 min',
    reason: 'Chest pain evaluation',
    appointmentType: 'Follow-up',
  },
  // This year appointments (sample from previous months)
  {
    id: 'apt-11',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    date: '2024-12-20',
    time: '02:00 PM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Diabetes management',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-12',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    date: '2024-11-15',
    time: '10:00 AM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Arthritis consultation',
    appointmentType: 'Follow-up',
  },
  {
    id: 'apt-13',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    date: '2024-10-10',
    time: '11:00 AM',
    type: 'In-person',
    status: 'completed',
    duration: '30 min',
    reason: 'Annual checkup',
    appointmentType: 'New',
  },
]

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timeString) => {
  return timeString || 'N/A'
}

const getTypeIcon = (type) => {
  // Only in-person consultations are supported
  return IoPersonOutline
}

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'pending' // Backend 'scheduled' shows as 'pending' for doctor
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'pending'
  }
}

// Map frontend display status back to backend status
const mapDisplayStatusToBackend = (displayStatus) => {
  switch (displayStatus) {
    case 'pending':
      return 'scheduled' // Frontend 'pending' is backend 'scheduled'
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return displayStatus || 'scheduled'
  }
}

const getStatusColor = (status) => {
  // Handle both backend and frontend statuses
  const displayStatus = status === 'scheduled' ? 'pending' : status
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'no_show':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const DoctorAppointments = () => {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all') // 'today', 'monthly', 'yearly', 'all'
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // Load appointments from localStorage
  useEffect(() => {
    const loadAppointments = () => {
      try {
        // Get current doctor ID from profile
        const doctorProfile = JSON.parse(localStorage.getItem('doctorProfile') || '{}')
        const doctorId = doctorProfile.id || 'doc-current'
        const doctorName = `${doctorProfile.firstName || ''} ${doctorProfile.lastName || ''}`.trim() || doctorProfile.name || ''
        
        // Load from allAppointments (shared by patient bookings)
        const allAppts = JSON.parse(localStorage.getItem('allAppointments') || '[]')
        // Also check doctorAppointments for backward compatibility
        const doctorAppts = JSON.parse(localStorage.getItem('doctorAppointments') || '[]')
        
        // Filter appointments for this doctor
        const doctorFilteredAppts = [
          ...allAppts.filter(apt => apt.doctorId === doctorId || apt.doctorName === doctorName),
          ...doctorAppts.filter(apt => apt.doctorId === doctorId),
        ]
        
        // Remove duplicates
        const unique = doctorFilteredAppts.filter((apt, idx, self) => 
          idx === self.findIndex(a => a.id === apt.id)
        )
        
        // Merge with mock data for backward compatibility, but prioritize localStorage data
        const merged = [...unique, ...mockAllAppointments]
        const finalUnique = merged.filter((apt, idx, self) => 
          idx === self.findIndex(a => a.id === apt.id)
        )
        
        // Transform to match expected format, preserving all data
        const transformed = finalUnique.map(apt => ({
          id: apt.id,
          patientId: apt.patientId || apt.patient?.id || 'pat-unknown',
          patientName: apt.patientName || apt.patient?.name || 'Unknown Patient',
          patientImage: apt.patientImage || apt.patient?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName || 'Patient')}&background=3b82f6&color=fff&size=160`,
          date: apt.appointmentDate || apt.date,
          time: apt.time || '10:00 AM',
          type: apt.appointmentType || apt.type || 'In-person',
          status: apt.status || 'scheduled',
          duration: apt.duration || '30 min',
          reason: apt.reason || 'Consultation',
          appointmentType: apt.appointmentType || 'New',
          // Preserve additional patient data
          patientPhone: apt.patientPhone || apt.patient?.phone || '+1-555-000-0000',
          patientEmail: apt.patientEmail || apt.patient?.email || `${(apt.patientName || 'patient').toLowerCase().replace(/\s+/g, '.')}@example.com`,
          patientAddress: apt.patientAddress || apt.patient?.address || 'Address not provided',
          age: apt.age || apt.patient?.age || 30,
          gender: apt.gender || apt.patient?.gender || 'male',
          // Preserve original appointment data for reference
          originalData: apt,
        }))
        
        setAppointments(transformed)
      } catch (error) {
        console.error('Error loading appointments:', error)
        setAppointments(mockAllAppointments)
      }
    }
    
    loadAppointments()
    // Refresh every 2 seconds to get new appointments
    const interval = setInterval(loadAppointments, 2000)
    return () => clearInterval(interval)
  }, [])

  // Get today's date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get current month start and end
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  currentMonthEnd.setHours(23, 59, 59, 999)

  // Get current year start and end
  const currentYearStart = new Date(today.getFullYear(), 0, 1)
  const currentYearEnd = new Date(today.getFullYear(), 11, 31)
  currentYearEnd.setHours(23, 59, 59, 999)

  // Filter appointments based on period
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filter by period
    if (filterPeriod === 'today') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date)
        return aptDate >= today && aptDate < tomorrow
      })
    } else if (filterPeriod === 'monthly') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date)
        return aptDate >= currentMonthStart && aptDate <= currentMonthEnd
      })
    } else if (filterPeriod === 'yearly') {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.date)
        return aptDate >= currentYearStart && aptDate <= currentYearEnd
      })
    }
    // 'all' shows all appointments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.time.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time)
      const dateB = new Date(b.date + ' ' + b.time)
      return dateB - dateA
    })
  }, [appointments, filterPeriod, searchTerm, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

  // Calculate statistics
  const stats = useMemo(() => {
    const todayApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      return aptDate >= today && aptDate < tomorrow
    })
    const monthlyApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      return aptDate >= currentMonthStart && aptDate <= currentMonthEnd
    })
    const yearlyApts = appointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      return aptDate >= currentYearStart && aptDate <= currentYearEnd
    })

    return {
      today: todayApts.length,
      monthly: monthlyApts.length,
      yearly: yearlyApts.length,
      total: appointments.length,
    }
  }, [appointments, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

  const handleViewAppointment = (appointment) => {
    // Navigate to consultations page with this appointment data
    navigate('/doctor/consultations', {
      state: {
        selectedConsultation: {
          id: `cons-${appointment.id}`,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          age: appointment.age || 30,
          gender: appointment.gender || 'male',
          appointmentTime: `${appointment.date}T${appointment.time}`,
          appointmentType: appointment.appointmentType || 'New',
          status: appointment.status === 'scheduled' ? 'in-progress' : appointment.status,
          reason: appointment.reason || 'Consultation',
          patientImage: appointment.patientImage,
          patientPhone: appointment.patientPhone || '+1-555-000-0000',
          patientEmail: appointment.patientEmail || `${appointment.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          patientAddress: appointment.patientAddress || 'Address not provided',
          diagnosis: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          attachments: [],
          // Include original appointment data if available
          originalAppointment: appointment.originalData || appointment,
        },
      },
    })
  }

  const handleCancelClick = (e, appointment) => {
    e.stopPropagation() // Prevent card click
    setAppointmentToCancel(appointment)
    setShowCancelModal(true)
  }

  const handleConfirmCancel = () => {
    if (!appointmentToCancel || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    // Update appointment status to cancelled in localStorage
    try {
      const allAppts = JSON.parse(localStorage.getItem('allAppointments') || '[]')
      const updatedAllAppts = allAppts.map(apt =>
        apt.id === appointmentToCancel.id
          ? { ...apt, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledBy: 'doctor' }
          : apt
      )
      localStorage.setItem('allAppointments', JSON.stringify(updatedAllAppts))
      
      // Also update in doctorAppointments
      const doctorAppts = JSON.parse(localStorage.getItem('doctorAppointments') || '[]')
      const updatedDoctorAppts = doctorAppts.map(apt =>
        apt.id === appointmentToCancel.id
          ? { ...apt, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledBy: 'doctor' }
          : apt
      )
      localStorage.setItem('doctorAppointments', JSON.stringify(updatedDoctorAppts))
      
      // Also update in patientAppointments
      const patientAppts = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      const updatedPatientAppts = patientAppts.map(apt =>
        apt.id === appointmentToCancel.id
          ? { ...apt, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledBy: 'doctor' }
          : apt
      )
      localStorage.setItem('patientAppointments', JSON.stringify(updatedPatientAppts))
    } catch (error) {
      console.error('Error updating appointment status:', error)
    }

    // Update appointment status to cancelled in state
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentToCancel.id
          ? { ...apt, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledBy: 'doctor' }
          : apt
      )
    )

    // Close modal and reset
    setShowCancelModal(false)
    setAppointmentToCancel(null)
    setCancelReason('')
    
    alert(`Appointment with ${appointmentToCancel.patientName} has been cancelled. Patient will be notified and can reschedule.`)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setAppointmentToCancel(null)
    setCancelReason('')
  }

  return (
    <>
      <DoctorNavbar />
      <section className="flex flex-col gap-4 pb-24">

        {/* Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterPeriod('today')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'today'
                ? 'border-purple-400 bg-purple-100 ring-2 ring-purple-200'
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-purple-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-purple-700 mb-1 group-hover:text-purple-900 transition-colors">Today</p>
              <p className="text-xl font-bold text-purple-900 group-hover:text-purple-950 transition-colors duration-300">{stats.today}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('monthly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'monthly'
                ? 'border-blue-400 bg-blue-100 ring-2 ring-blue-200'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-blue-700 mb-1 group-hover:text-blue-900 transition-colors">This Month</p>
              <p className="text-xl font-bold text-blue-900 group-hover:text-blue-950 transition-colors duration-300">{stats.monthly}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('yearly')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'yearly'
                ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-200'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-emerald-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1 group-hover:text-emerald-900 transition-colors">This Year</p>
              <p className="text-xl font-bold text-emerald-900 group-hover:text-emerald-950 transition-colors duration-300">{stats.yearly}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('all')}
            className={`group relative overflow-hidden rounded-xl border p-3 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
              filterPeriod === 'all'
                ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/0 to-slate-500/0 group-hover:from-slate-500/10 group-hover:to-slate-500/20 transition-all duration-300"></div>
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1 group-hover:text-slate-900 transition-colors">Total</p>
              <p className="text-xl font-bold text-slate-900 group-hover:text-slate-950 transition-colors duration-300">{stats.total}</p>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by patient name, reason, or time..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Appointments List */}
        <div className="space-y-3 lg:grid lg:grid-cols-6 lg:gap-3 lg:space-y-0">
          {filteredAppointments.length === 0 ? (
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No appointments found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const TypeIcon = getTypeIcon(appointment.type)
              return (
                <div
                  key={appointment.id}
                  onClick={() => handleViewAppointment(appointment)}
                  className="group relative overflow-hidden rounded-xl lg:rounded-lg border border-slate-200 bg-white p-2.5 lg:p-2.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#11496c]/30 cursor-pointer active:scale-[0.98] lg:hover:scale-[1.01]"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                  
                  <div className="relative flex flex-col gap-1.5 lg:gap-1.5">
                    {/* Top Row: Image + Name + Status */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Patient Image */}
                        <div className="relative shrink-0">
                          <img
                            src={appointment.patientImage}
                            alt={appointment.patientName}
                            className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg object-cover ring-2 ring-slate-100 group-hover:ring-[#11496c]/30 transition-all duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                            }}
                          />
                          {appointment.status === 'completed' && (
                            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white group-hover:scale-110 group-hover:ring-emerald-400 transition-all duration-300">
                              <IoCheckmarkCircleOutline className="h-1.5 w-1.5 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs lg:text-xs font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors duration-300">{appointment.patientName}</h3>
                          <p className="text-[9px] lg:text-[9px] text-slate-600 truncate group-hover:text-slate-700 transition-colors">{appointment.reason}</p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {(() => {
                          const displayStatus = mapBackendStatusToDisplay(appointment.status)
                          return (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[8px] lg:text-[8px] font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)} group-hover:scale-105 transition-transform duration-300`}
                            >
                              {displayStatus === 'confirmed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'completed' ? (
                                <IoCheckmarkCircleOutline className="h-2 w-2" />
                              ) : displayStatus === 'cancelled' ? (
                                <IoCloseCircleOutline className="h-2 w-2" />
                              ) : (
                                <IoTimeOutline className="h-2 w-2" />
                              )}
                              <span className="hidden lg:inline">{displayStatus}</span>
                            </span>
                          )
                        })()}
                        {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                          <button
                            type="button"
                            onClick={(e) => handleCancelClick(e, appointment)}
                            className="flex items-center gap-0.5 rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[8px] lg:text-[8px] font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
                            title="Cancel Appointment"
                          >
                            <IoCloseCircleOutline className="h-2 w-2" />
                            <span className="hidden lg:inline">Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[8px] lg:text-[8px] text-slate-600 group-hover:text-slate-700 transition-colors">
                      <div className="flex items-center gap-0.5">
                        <IoCalendarOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <IoTimeOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{formatTime(appointment.time)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <TypeIcon className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                        <span className="truncate">{appointment.type}</span>
                      </div>
                      {appointment.duration ? (
                        <div className="flex items-center gap-0.5">
                          <span className="truncate">{appointment.duration}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <IoDocumentTextOutline className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{appointment.appointmentType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Cancel Appointment Modal */}
      {showCancelModal && appointmentToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={handleCloseCancelModal}
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
                  <h2 className="text-lg font-bold text-slate-900">Cancel Appointment</h2>
                  <p className="text-xs text-slate-600">Patient: {appointmentToCancel.patientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <IoCalendarOutline className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(appointmentToCancel.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IoTimeOutline className="h-4 w-4 text-slate-400" />
                  <span>{formatTime(appointmentToCancel.time)}</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling this appointment..."
                  rows="4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  The patient will be notified and can reschedule for a new date and time.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-6">
              <button
                type="button"
                onClick={handleCloseCancelModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorAppointments

