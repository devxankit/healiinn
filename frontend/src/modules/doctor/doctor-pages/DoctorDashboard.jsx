import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
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
  IoArrowForwardOutline,
  IoLocationOutline,
  IoCallOutline,
  IoVideocamOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
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

const todayAppointments = [
  {
    id: 'apt-1',
    patientName: 'John Doe',
    patientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
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

const recentPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    lastVisit: '2025-01-15',
    totalVisits: 5,
    status: 'active',
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    lastVisit: '2025-01-14',
    totalVisits: 3,
    status: 'active',
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    lastVisit: '2025-01-12',
    totalVisits: 2,
    status: 'active',
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

  // Sidebar navigation items
  const sidebarNavItems = [
    { id: 'home', label: 'Dashboard', to: '/doctor/dashboard', Icon: IoHomeOutline },
    { id: 'consultations', label: 'Consultations', to: '/doctor/consultations', Icon: IoDocumentTextOutline },
    { id: 'patients', label: 'Patients', to: '/doctor/patients', Icon: IoPeopleOutline },
    { id: 'wallet', label: 'Wallet', to: '/doctor/wallet', Icon: IoWalletOutline },
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
      <div className="min-h-screen bg-slate-50 pt-0 pb-24">
        {/* New Gradient Header - Full Width */}
        <div className="mb-6 rounded-b-xl sm:rounded-b-2xl overflow-hidden bg-gradient-to-r from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] shadow-lg">
          <div className="relative p-4 sm:p-5 lg:p-6">
            {/* Top Section - Doctor Info */}
            <div className="flex items-start justify-between mb-4 sm:mb-5">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Dr. Rajesh Kumar
                </h1>
                <p className="text-sm sm:text-base text-white/90">
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
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-x-2.5 sm:gap-y-2 lg:grid-cols-3 mb-4 sm:mb-6">
            {/* Total Patients */}
            <article
              onClick={() => navigate('/doctor/patients')}
              className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-white to-[rgba(17,73,108,0.05)] p-2 sm:p-2.5 shadow-sm shadow-[rgba(17,73,108,0.1)] backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[rgba(17,73,108,0.15)] blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[rgba(17,73,108,0.1)] blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1">Total Patients</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-none">{mockStats.totalPatients}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(17,73,108,0.1)]">
                  <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Active patients</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-[#11496c] to-[#11496c] text-white shadow-md shadow-[rgba(17,73,108,0.3)]">
                    <IoPeopleOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>

            {/* Total Consultations */}
            <article
              onClick={() => navigate('/doctor/consultations')}
              className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-2 sm:p-2.5 shadow-sm shadow-emerald-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-200/30 blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-300/20 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Consultations</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-none">{mockStats.totalConsultations}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-100/50">
                  <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">All time</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md shadow-emerald-300/50">
                    <IoDocumentTextOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>

            {/* Today's Appointments */}
            <article
              onClick={() => navigate('/doctor/consultations')}
              className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-purple-100/60 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/70 p-2 sm:p-2.5 shadow-sm shadow-purple-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-200/30 blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-300/20 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Today's Appointments</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-none">{mockStats.todayAppointments}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-100/50">
                  <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight line-clamp-1">{todayLabel}</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-md shadow-purple-300/50">
                    <IoCalendarOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>

            {/* Total Earnings */}
            <article
              onClick={() => navigate('/doctor/wallet')}
              className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-amber-100/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/70 p-2 sm:p-2.5 shadow-sm shadow-amber-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-200/30 blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-300/20 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-amber-700 leading-tight mb-1">Total Earnings</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-none">{formatCurrency(mockStats.totalEarnings)}</p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] sm:text-[10px]">
                    {earningsChange >= 0 ? (
                      <>
                        <IoTrendingUpOutline className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <IoTrendingDownOutline className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-red-600" />
                        <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-amber-100/50">
                  <p className="text-[8px] sm:text-[9px] text-slate-500 leading-tight">vs last month</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-300/50">
                    <IoWalletOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>

            {/* Pending Consultations */}
            <article
              onClick={() => navigate('/doctor/consultations')}
              className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-orange-100/60 bg-gradient-to-br from-orange-50/90 via-white to-orange-50/70 p-2 sm:p-2.5 shadow-sm shadow-orange-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-200/30 blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-300/20 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1">Pending Consultations</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-none">{mockStats.pendingConsultations}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-orange-100/50">
                  <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Requires attention</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-300/50">
                    <IoNotificationsOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>

            {/* Average Rating */}
            <article className="relative overflow-hidden aspect-square rounded-lg sm:rounded-xl border border-pink-100/60 bg-gradient-to-br from-pink-50/90 via-white to-pink-50/70 p-2 sm:p-2.5 shadow-sm shadow-pink-100/50 backdrop-blur-sm">
              <div className="absolute -right-3 -top-3 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-200/30 blur-xl" />
              <div className="absolute -bottom-2 left-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-pink-300/20 blur-xl" />
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide text-pink-700 leading-tight mb-1">Average Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-none">{mockStats.averageRating}</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <IoStarOutline
                          key={i}
                          className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < Math.floor(mockStats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-pink-100/50">
                  <p className="text-[9px] sm:text-[10px] text-slate-600 leading-tight">Based on patient reviews</p>
                  <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-md shadow-pink-300/50">
                    <IoStarOutline className="text-sm sm:text-base" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Today's Schedule */}
          <section aria-labelledby="schedule-title" className="mb-6 space-y-3">
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
                onClick={() => navigate('/doctor/consultations')}
                className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
              >
                See all
              </button>
            </header>

            <div className="space-y-3">
              {todayAppointments.map((appointment) => {
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
              })}
            </div>
          </section>

          {/* Recent Consultations & Recent Patients Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            {/* Recent Consultations */}
            <section aria-labelledby="consultations-title" className="space-y-3">
              <header className="flex items-center justify-between">
                <h2 id="consultations-title" className="text-base font-semibold text-slate-900">
                  Recent Consultations
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/doctor/consultations')}
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

            {/* Recent Patients */}
            <section aria-labelledby="patients-title" className="space-y-3">
              <header className="flex items-center justify-between">
                <h2 id="patients-title" className="text-base font-semibold text-slate-900">
                  Recent Patients
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/doctor/patients')}
                  className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
                >
                  See all
                </button>
              </header>

              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <article
                    key={patient.id}
                    onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={patient.image}
                        alt={patient.name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">{patient.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-600">Last visit: {formatDate(patient.lastVisit)}</p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            {patient.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <IoDocumentTextOutline className="h-3.5 w-3.5" />
                            <span>{patient.totalVisits} visits</span>
                          </div>
                        </div>
                      </div>
                      <IoArrowForwardOutline className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Earnings Overview */}
          <section aria-labelledby="earnings-title" className="mb-6">
            <header className="mb-3 flex items-center justify-between">
              <h2 id="earnings-title" className="text-base font-semibold text-slate-900">
                Earnings Overview
              </h2>
              <button
                type="button"
                onClick={() => navigate('/doctor/wallet')}
                className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
              >
                View details
              </button>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(mockStats.thisMonthEarnings)}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {earningsChange >= 0 ? (
                        <>
                          <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">+{earningsChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">{earningsChange.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <IoWalletOutline className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month Consultations</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{mockStats.thisMonthConsultations}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {consultationsChange >= 0 ? (
                        <>
                          <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">+{consultationsChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">{consultationsChange.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.15)]">
                    <IoDocumentTextOutline className="h-6 w-6 text-[#11496c]" />
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default DoctorDashboard
