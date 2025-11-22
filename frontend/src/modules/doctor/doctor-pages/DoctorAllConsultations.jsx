import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoDocumentTextOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoMedicalOutline,
  IoVideocamOutline,
  IoCallOutline,
} from 'react-icons/io5'

// Helper function to get today's date string
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to get past date string
const getPastDateString = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Mock data for all consultations
const getMockAllConsultations = () => {
  const todayDate = getTodayDateString()
  
  // Helper to get past date string (local to this function)
  const getPastDate = (daysAgo) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return [
  // Today's consultations
  {
    id: 'cons-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    age: 45,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    appointmentTime: `${todayDate}T09:00:00`,
    appointmentType: 'Follow-up',
    status: 'in-progress',
    reason: 'Hypertension follow-up',
    type: 'In-person',
    diagnosis: 'Hypertension',
  },
  {
    id: 'cons-2',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    age: 32,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    appointmentTime: `${todayDate}T10:30:00`,
    appointmentType: 'New',
    status: 'completed',
    reason: 'Chest pain evaluation',
    type: 'Video',
    diagnosis: 'Anxiety',
  },
  {
    id: 'cons-3',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    age: 28,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    appointmentTime: `${todayDate}T14:00:00`,
    appointmentType: 'Follow-up',
    status: 'pending',
    reason: 'Quick check-up',
    type: 'Audio',
    diagnosis: '',
  },
  // This month consultations (previous days this month)
  {
    id: 'cons-4',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    age: 55,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    appointmentTime: `${getPastDate(1)}T11:00:00`,
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Routine check-up',
    type: 'In-person',
    diagnosis: 'Diabetes Management',
  },
  {
    id: 'cons-5',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    age: 38,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    appointmentTime: `${getPastDate(2)}T09:30:00`,
    appointmentType: 'New',
    status: 'completed',
    reason: 'Annual checkup',
    type: 'Video',
    diagnosis: 'Healthy',
  },
  {
    id: 'cons-6',
    patientId: 'pat-6',
    patientName: 'Lisa Anderson',
    age: 42,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=ef4444&color=fff&size=160',
    appointmentTime: `${getPastDate(3)}T15:00:00`,
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Prescription follow-up',
    type: 'In-person',
    diagnosis: 'Upper Respiratory Infection',
  },
  {
    id: 'cons-7',
    patientId: 'pat-7',
    patientName: 'Robert Taylor',
    age: 35,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=6366f1&color=fff&size=160',
    appointmentTime: `${getPastDate(4)}T10:00:00`,
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Lab results review',
    type: 'Audio',
    diagnosis: 'Normal Results',
  },
  {
    id: 'cons-8',
    patientId: 'pat-8',
    patientName: 'Jennifer Martinez',
    age: 29,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Jennifer+Martinez&background=14b8a6&color=fff&size=160',
    appointmentTime: `${getPastDate(5)}T14:30:00`,
    appointmentType: 'New',
    status: 'completed',
    reason: 'Initial consultation',
    type: 'Video',
    diagnosis: 'General Health Check',
  },
  // This year consultations (sample from previous months)
  {
    id: 'cons-9',
    patientId: 'pat-1',
    patientName: 'John Doe',
    age: 45,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    appointmentTime: '2024-12-20T11:00:00',
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Hypertension follow-up',
    type: 'In-person',
    diagnosis: 'Hypertension',
  },
  {
    id: 'cons-10',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    age: 28,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    appointmentTime: '2024-11-15T10:00:00',
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Diabetes management',
    type: 'Video',
    diagnosis: 'Type 2 Diabetes',
  },
  {
    id: 'cons-11',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    age: 55,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    appointmentTime: '2024-10-10T09:00:00',
    appointmentType: 'Follow-up',
    status: 'completed',
    reason: 'Arthritis consultation',
    type: 'In-person',
    diagnosis: 'Osteoarthritis',
  },
  {
    id: 'cons-12',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    age: 38,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    appointmentTime: '2024-09-05T14:00:00',
    appointmentType: 'New',
    status: 'completed',
    reason: 'Annual checkup',
    type: 'Video',
    diagnosis: 'Healthy',
  },
  ]
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'in-progress':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'pending':
      return 'Pending'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

const DoctorAllConsultations = () => {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState(() => getMockAllConsultations())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('today') // 'today', 'monthly', 'yearly', 'all'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'completed', 'in-progress', 'pending'

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

  // Filter consultations based on period and status
  const filteredConsultations = useMemo(() => {
    let filtered = consultations

    // Filter by period
    if (filterPeriod === 'today') {
      filtered = filtered.filter((cons) => {
        const consDate = new Date(cons.appointmentTime)
        return consDate >= today && consDate < tomorrow
      })
    } else if (filterPeriod === 'monthly') {
      filtered = filtered.filter((cons) => {
        const consDate = new Date(cons.appointmentTime)
        return consDate >= currentMonthStart && consDate <= currentMonthEnd
      })
    } else if (filterPeriod === 'yearly') {
      filtered = filtered.filter((cons) => {
        const consDate = new Date(cons.appointmentTime)
        return consDate >= currentYearStart && consDate <= currentYearEnd
      })
    }
    // 'all' shows all consultations

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((cons) => cons.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (cons) =>
          cons.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cons.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cons.diagnosis && cons.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentTime)
      const dateB = new Date(b.appointmentTime)
      return dateB - dateA
    })
  }, [consultations, filterPeriod, filterStatus, searchTerm, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

  // Calculate statistics
  const stats = useMemo(() => {
    const todayCons = consultations.filter((cons) => {
      const consDate = new Date(cons.appointmentTime)
      return consDate >= today && consDate < tomorrow
    })
    const monthlyCons = consultations.filter((cons) => {
      const consDate = new Date(cons.appointmentTime)
      return consDate >= currentMonthStart && consDate <= currentMonthEnd
    })
    const yearlyCons = consultations.filter((cons) => {
      const consDate = new Date(cons.appointmentTime)
      return consDate >= currentYearStart && consDate <= currentYearEnd
    })

    return {
      today: todayCons.length,
      monthly: monthlyCons.length,
      yearly: yearlyCons.length,
      total: consultations.length,
      completed: consultations.filter((cons) => cons.status === 'completed').length,
      inProgress: consultations.filter((cons) => cons.status === 'in-progress').length,
      pending: consultations.filter((cons) => cons.status === 'pending').length,
    }
  }, [consultations, today, tomorrow, currentMonthStart, currentMonthEnd, currentYearStart, currentYearEnd])

  const handleViewConsultation = (consultation) => {
    // Navigate to consultations page with this consultation
    navigate('/doctor/consultations', {
      state: {
        selectedConsultation: {
          ...consultation,
          patientPhone: '+1-555-987-6543',
          patientEmail: `${consultation.patientName.toLowerCase().replace(' ', '.')}@example.com`,
          patientAddress: '123 Patient Street, New York, NY 10001',
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
        {/* Statistics Cards - Clickable */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterPeriod('today')}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              filterPeriod === 'today'
                ? 'border-emerald-400 bg-emerald-100 ring-2 ring-emerald-200'
                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1">Today</p>
            <p className="text-xl font-bold text-emerald-900">{stats.today}</p>
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
                ? 'border-purple-400 bg-purple-100 ring-2 ring-purple-200'
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-purple-700 mb-1">This Year</p>
            <p className="text-xl font-bold text-purple-900">{stats.yearly}</p>
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
            placeholder="Search by patient name, reason, or diagnosis..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Consultations List */}
        <div className="space-y-3">
          {filteredConsultations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No consultations found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredConsultations.map((consultation) => {
              const TypeIcon = getTypeIcon(consultation.type)
              return (
                <div
                  key={consultation.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#11496c]/30 cursor-pointer"
                  onClick={() => handleViewConsultation(consultation)}
                >
                  <div className="flex items-start gap-4">
                    {/* Patient Image */}
                    <img
                      src={consultation.patientImage}
                      alt={consultation.patientName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.patientName)}&background=3b82f6&color=fff&size=160`
                      }}
                    />

                    {/* Consultation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate">{consultation.patientName}</h3>
                          <p className="text-sm text-slate-600 mt-0.5">{consultation.reason}</p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(consultation.status)}`}
                        >
                          {consultation.status === 'completed' ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : consultation.status === 'in-progress' ? (
                            <IoTimeOutline className="h-3 w-3" />
                          ) : (
                            <IoTimeOutline className="h-3 w-3" />
                          )}
                          {getStatusText(consultation.status)}
                        </span>
                      </div>

                      {/* Consultation Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>{formatDateTime(consultation.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>{consultation.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoMedicalOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>{consultation.appointmentType}</span>
                        </div>
                        {consultation.diagnosis && (
                          <div className="flex items-center gap-1">
                            <IoDocumentTextOutline className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-900">{consultation.diagnosis}</span>
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

export default DoctorAllConsultations

