import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import DoctorSidebar from '../doctor-components/DoctorSidebar'
import {
  IoPeopleOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoStarOutline,
  IoCheckmarkCircleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5'

const mockStats = {
  totalPatients: 156,
  totalConsultations: 342,
  todayAppointments: 8,
  totalEarnings: 15750.50,
  pendingConsultations: 12,
  averageRating: 4.8,
  thisMonthEarnings: 8250.00,
  lastMonthEarnings: 6890.50,
  thisMonthConsultations: 45,
  lastMonthConsultations: 38,
}

// Helper function to get today's date string in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// All appointments data (includes today and future appointments)
const allAppointments = [
  {
    id: 'apt-1',
    patientName: 'John Doe',
    patientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    date: getTodayDateString(),
    time: '09:00 AM',
    type: 'In-person',
    status: 'confirmed',
    duration: '30 min',
    reason: 'Follow-up consultation',
  },
  {
    id: 'apt-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    date: getTodayDateString(),
    time: '10:30 AM',
    type: 'Video',
    status: 'confirmed',
    duration: '45 min',
    reason: 'Initial consultation',
  },
  {
    id: 'apt-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    date: getTodayDateString(),
    time: '02:00 PM',
    type: 'Audio',
    status: 'pending',
    duration: '20 min',
    reason: 'Quick check-up',
  },
  {
    id: 'apt-4',
    patientName: 'Emily Brown',
    patientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
    date: getTodayDateString(),
    time: '03:30 PM',
    type: 'In-person',
    status: 'confirmed',
    duration: '30 min',
    reason: 'Routine check-up',
  },
]

const recentConsultations = [
  {
    id: 'cons-1',
    patientName: 'David Wilson',
    patientImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    date: '2025-01-15',
    time: '10:00 AM',
    type: 'Video',
    status: 'completed',
    fee: 1500,
    notes: 'Follow-up required in 2 weeks',
  },
  {
    id: 'cons-2',
    patientName: 'Lisa Anderson',
    patientImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    date: '2025-01-14',
    time: '02:30 PM',
    type: 'In-person',
    status: 'completed',
    fee: 2000,
    notes: 'Prescription provided',
  },
  {
    id: 'cons-3',
    patientName: 'Robert Taylor',
    patientImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    date: '2025-01-14',
    time: '11:00 AM',
    type: 'Audio',
    status: 'completed',
    fee: 1200,
    notes: 'Lab tests recommended',
  },
  {
    id: 'cons-4',
    patientName: 'Jennifer Martinez',
    patientImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    date: '2025-01-13',
    time: '09:30 AM',
    type: 'Video',
    status: 'pending',
    fee: 1500,
    notes: 'Awaiting payment',
  },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getTypeIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'video':
      return IoVideocamOutline
    case 'audio':
      return IoCallOutline
    case 'chat':
      return IoChatbubbleOutline
    default:
      return IoLocationOutline
  }
}

const DoctorDashboard = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const earningsChange = ((mockStats.thisMonthEarnings - mockStats.lastMonthEarnings) / mockStats.lastMonthEarnings) * 100
  const consultationsChange = ((mockStats.thisMonthConsultations - mockStats.lastMonthConsultations) / mockStats.lastMonthConsultations) * 100

  // Filter today's appointments dynamically
  const todayAppointments = useMemo(() => {
    const today = getTodayDateString()
    return allAppointments.filter((apt) => apt.date === today)
  }, [])

  // Sidebar navigation items
  const sidebarNavItems = [
    { id: 'home', label: 'Dashboard', to: '/doctor/dashboard', Icon: IoHomeOutline },
    { id: 'consultations', label: 'Consultations', to: '/doctor/consultations', Icon: IoDocumentTextOutline },
    { id: 'patients', label: 'Patients', to: '/doctor/patients', Icon: IoPeopleOutline },
    { id: 'wallet', label: 'Wallet', to: '/doctor/wallet', Icon: IoWalletOutline },
    { id: 'support', label: 'Support', to: '/doctor/support', Icon: IoHelpCircleOutline },
    { id: 'profile', label: 'Profile', to: '/doctor/profile', Icon: IoPersonCircleOutline },
  ]

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    handleSidebarClose()
    localStorage.removeItem('doctorAuthToken')
    sessionStorage.removeItem('doctorAuthToken')
    navigate('/', { replace: true })
  }

  return (
    <>
      <DoctorNavbar />
      <DoctorSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={sidebarNavItems}
        onLogout={handleLogout}
      />
      <section className="flex flex-col gap-4 pb-24 -mt-20">
        {/* Top Header with Gradient Background */}
        <header 
          className="relative text-white -mx-4 mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
          }}
        >
          <div className="px-4 pt-5 pb-4">
            {/* Top Section - Doctor Info */}
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                  Dr. Rajesh Kumar
                </h1>
                <p className="text-sm font-normal text-white/95 leading-tight">
                  Shivaji Nagar Clinic • <span className="text-white font-medium">Online</span>
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleSidebarToggle}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label="Menu"
                >
                  <IoMenuOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Queue Status Button */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs sm:max-w-sm rounded-lg bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-3 border border-white/30">
                <p className="text-center text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
                  Queue Status: <span className="text-white font-bold">ACTIVE</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            {/* Total Patients */}
            <article
              onClick={() => navigate('/doctor/all-patients')}
              className="relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1">Total Patients</p>
                  <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalPatients}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
                  <IoPeopleOutline className="text-base" aria-hidden="true" />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">Active patients</p>
            </article>

            {/* Total Consultations */}
            <article
              onClick={() => navigate('/doctor/all-consultations')}
              className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Consultations</p>
                  <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalConsultations}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <IoDocumentTextOutline className="text-base" aria-hidden="true" />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">All time</p>
            </article>

            {/* Appointments */}
            <article
              onClick={() => navigate('/doctor/appointments')}
              className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Appointment</p>
                  <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.todayAppointments}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
                  <IoCalendarOutline className="text-base" aria-hidden="true" />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight line-clamp-1">{todayLabel}</p>
            </article>

            {/* Total Earnings */}
            <article
              onClick={() => navigate('/doctor/wallet')}
              className="relative overflow-hidden rounded-xl border border-amber-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 leading-tight mb-1">Total Earnings</p>
                  <p className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(mockStats.totalEarnings)}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px]">
                    {earningsChange >= 0 ? (
                      <>
                        <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                        <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <IoWalletOutline className="text-base" aria-hidden="true" />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">vs last month</p>
            </article>
          </div>

        {/* Today's Schedule */}
        <section aria-labelledby="schedule-title" className="space-y-3">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 id="schedule-title" className="text-base font-semibold text-slate-900">
                  Today's Schedule
                </h2>
                <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
                  {todayAppointments.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
              >
                See all
              </button>
            </header>

            <div className="space-y-3">
              {todayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm font-medium text-slate-600">No appointments today</p>
                  <p className="mt-1 text-xs text-slate-500">Your schedule is clear</p>
                </div>
              ) : (
                todayAppointments.map((appointment) => {
                const TypeIcon = getTypeIcon(appointment.type)
                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={appointment.patientImage}
                          alt={appointment.patientName}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                          }}
                        />
                        {appointment.status === 'confirmed' && (
                          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                            <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">{appointment.patientName}</h3>
                            <p className="mt-0.5 text-xs text-slate-600">{appointment.reason}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)}`}>
                              {appointment.status === 'confirmed' ? (
                                <IoCheckmarkCircleOutline className="h-3 w-3" />
                              ) : (
                                <IoTimeOutline className="h-3 w-3" />
                              )}
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            <span className="font-medium">{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-3.5 w-3.5" />
                            <span>{appointment.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            <span>{appointment.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
              )}
            </div>
          </section>

        {/* Recent Consultations */}
        <section aria-labelledby="consultations-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="consultations-title" className="text-base font-semibold text-slate-900">
              Recent Consultations
            </h2>
            <button
              type="button"
              onClick={() => navigate('/doctor/all-consultations')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3">
            {recentConsultations.map((consultation) => {
              const TypeIcon = getTypeIcon(consultation.type)
              return (
                <article
                  key={consultation.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={consultation.patientImage}
                      alt={consultation.patientName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">{consultation.patientName}</h3>
                          <p className="mt-0.5 text-xs text-slate-600">{consultation.notes}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(consultation.status)}`}>
                          {consultation.status === 'completed' ? (
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                          ) : (
                            <IoTimeOutline className="h-3 w-3" />
                          )}
                          {consultation.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5" />
                          <span>{formatDate(consultation.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          <span>{consultation.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TypeIcon className="h-3.5 w-3.5" />
                          <span>{consultation.type}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-emerald-600">
                          <IoWalletOutline className="h-3.5 w-3.5" />
                          <span>{formatCurrency(consultation.fee)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </section>
    </>
  )
}

export default DoctorDashboard
