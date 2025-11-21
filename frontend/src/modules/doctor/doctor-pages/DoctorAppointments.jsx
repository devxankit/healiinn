import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoVideocamOutline,
  IoCallOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
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
    type: 'Video',
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
    type: 'Audio',
    status: 'pending',
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
    type: 'Video',
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
    type: 'Audio',
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
    type: 'Video',
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
    type: 'Video',
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
    type: 'Video',
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
  switch (type) {
    case 'Video':
      return IoVideocamOutline
    case 'Audio':
      return IoCallOutline
    default:
      return IoPersonOutline
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const DoctorAppointments = () => {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState(mockAllAppointments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('today') // 'today', 'monthly', 'yearly', 'all'

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
    // Navigate to consultations page with this appointment
    navigate('/doctor/consultations', {
      state: {
        selectedConsultation: {
          id: `cons-${appointment.id}`,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          age: 45, // Default, should come from appointment data
          gender: 'male', // Default
          appointmentTime: `${appointment.date}T${appointment.time}`,
          appointmentType: appointment.appointmentType || 'New',
          status: 'in-progress',
          reason: appointment.reason,
          patientImage: appointment.patientImage,
          patientPhone: '+1-555-987-6543',
          patientEmail: `${appointment.patientName.toLowerCase().replace(' ', '.')}@example.com`,
          patientAddress: '123 Patient Street, New York, NY 10001',
          diagnosis: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          attachments: [],
        },
      },
    })
  }

  return (
    <>
      <DoctorNavbar />
      <section className="flex flex-col gap-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
            <p className="text-sm text-slate-600">{stats.total} total appointments</p>
          </div>
        </div>

        {/* Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterPeriod('today')}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              filterPeriod === 'today'
                ? 'border-purple-400 bg-purple-100 ring-2 ring-purple-200'
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-purple-700 mb-1">Today</p>
            <p className="text-xl font-bold text-purple-900">{stats.today}</p>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('monthly')}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              filterPeriod === 'monthly'
                ? 'border-blue-400 bg-blue-100 ring-2 ring-blue-200'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-blue-700 mb-1">This Month</p>
            <p className="text-xl font-bold text-blue-900">{stats.monthly}</p>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('yearly')}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              filterPeriod === 'yearly'
                ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-200'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1">This Year</p>
            <p className="text-xl font-bold text-emerald-900">{stats.yearly}</p>
          </button>
          <button
            type="button"
            onClick={() => setFilterPeriod('all')}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              filterPeriod === 'all'
                ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
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
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
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
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#11496c]/30 cursor-pointer"
                  onClick={() => handleViewAppointment(appointment)}
                >
                  <div className="flex items-start gap-4">
                    {/* Patient Image */}
                    <img
                      src={appointment.patientImage}
                      alt={appointment.patientName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=160`
                      }}
                    />

                    {/* Appointment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate">{appointment.patientName}</h3>
                          <p className="text-sm text-slate-600 mt-0.5">{appointment.reason}</p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)}`}
                        >
                          {appointment.status === 'confirmed' ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : appointment.status === 'completed' ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : (
                            <IoTimeOutline className="h-3 w-3" />
                          )}
                          {appointment.status}
                        </span>
                      </div>

                      {/* Appointment Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>{formatTime(appointment.time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>{appointment.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoDocumentTextOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>{appointment.appointmentType}</span>
                        </div>
                        {appointment.duration && (
                          <div className="flex items-center gap-1">
                            <span>{appointment.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </>
  )
}

export default DoctorAppointments

