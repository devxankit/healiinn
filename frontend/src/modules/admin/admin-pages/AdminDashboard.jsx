import { useNavigate } from 'react-router-dom'
import {
  IoPeopleOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoNotificationsOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoCallOutline,
} from 'react-icons/io5'

const mockStats = {
  totalUsers: 1250,
  totalDoctors: 156,
  totalPharmacies: 42,
  totalLaboratories: 28,
  totalConsultations: 3420,
  todayAppointments: 48,
  totalRevenue: 1250000,
  pendingVerifications: 12,
  thisMonthUsers: 125,
  lastMonthUsers: 98,
  thisMonthRevenue: 125000,
  lastMonthRevenue: 108000,
  thisMonthConsultations: 342,
  lastMonthConsultations: 298,
  todayVerifications: 5,
}

// Chart data
const revenueData = [
  { month: 'Jul', value: 85000 },
  { month: 'Aug', value: 92000 },
  { month: 'Sep', value: 98000 },
  { month: 'Oct', value: 105000 },
  { month: 'Nov', value: 108000 },
  { month: 'Dec', value: 125000 },
]

const userGrowthData = [
  { month: 'Jul', users: 850 },
  { month: 'Aug', users: 920 },
  { month: 'Sep', users: 980 },
  { month: 'Oct', users: 1050 },
  { month: 'Nov', users: 1120 },
  { month: 'Dec', users: 1250 },
]

const consultationsData = [
  { month: 'Jul', consultations: 280 },
  { month: 'Aug', consultations: 310 },
  { month: 'Sep', consultations: 290 },
  { month: 'Oct', consultations: 320 },
  { month: 'Nov', consultations: 298 },
  { month: 'Dec', consultations: 342 },
]

const todayVerifications = [
  {
    id: 'ver-today-1',
    type: 'doctor',
    name: 'Dr. Amit Patel',
    image: 'https://ui-avatars.com/api/?name=Dr+Amit+Patel&background=10b981&color=fff&size=128&bold=true',
    specialty: 'Cardiologist',
    submittedAt: '2025-01-15',
    time: '09:00 AM',
    status: 'pending',
    email: 'amit.patel@example.com',
  },
  {
    id: 'ver-today-2',
    type: 'pharmacy',
    name: 'City Pharmacy',
    image: 'https://ui-avatars.com/api/?name=City+Pharmacy&background=8b5cf6&color=fff&size=128&bold=true',
    owner: 'Priya Sharma',
    submittedAt: '2025-01-15',
    time: '10:30 AM',
    status: 'pending',
    email: 'citypharmacy@example.com',
  },
  {
    id: 'ver-today-3',
    type: 'laboratory',
    name: 'Test Lab Services',
    image: 'https://ui-avatars.com/api/?name=Test+Lab&background=f59e0b&color=fff&size=128&bold=true',
    owner: 'Dr. Anjali Mehta',
    submittedAt: '2025-01-15',
    time: '02:00 PM',
    status: 'pending',
    email: 'testlab@example.com',
  },
  {
    id: 'ver-today-4',
    type: 'doctor',
    name: 'Dr. Sneha Reddy',
    image: 'https://ui-avatars.com/api/?name=Dr+Sneha+Reddy&background=ec4899&color=fff&size=128&bold=true',
    specialty: 'Dermatologist',
    submittedAt: '2025-01-15',
    time: '03:30 PM',
    status: 'pending',
    email: 'sneha.reddy@example.com',
  },
]

const recentActivities = [
  {
    id: 'act-1',
    type: 'user',
    action: 'New user registered',
    name: 'John Doe',
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: 'act-2',
    type: 'doctor',
    action: 'Doctor verification pending',
    name: 'Dr. Priya Sharma',
    image: 'https://ui-avatars.com/api/?name=Dr+Priya+Sharma&background=10b981&color=fff&size=128&bold=true',
    time: '15 minutes ago',
    status: 'pending',
  },
  {
    id: 'act-3',
    type: 'pharmacy',
    action: 'Pharmacy approved',
    name: 'MediCare Pharmacy',
    image: 'https://ui-avatars.com/api/?name=MediCare&background=8b5cf6&color=fff&size=128&bold=true',
    time: '1 hour ago',
    status: 'success',
  },
  {
    id: 'act-4',
    type: 'laboratory',
    action: 'Laboratory registered',
    name: 'HealthLab Diagnostics',
    image: 'https://ui-avatars.com/api/?name=HealthLab&background=f59e0b&color=fff&size=128&bold=true',
    time: '2 hours ago',
    status: 'success',
  },
  {
    id: 'act-5',
    type: 'consultation',
    action: 'Consultation completed',
    name: 'Dr. Rajesh Kumar',
    image: 'https://ui-avatars.com/api/?name=Dr+Rajesh+Kumar&background=6366f1&color=fff&size=128&bold=true',
    time: '3 hours ago',
    status: 'success',
  },
]

const pendingVerifications = [
  {
    id: 'ver-1',
    type: 'doctor',
    name: 'Dr. Amit Patel',
    image: 'https://ui-avatars.com/api/?name=Dr+Amit+Patel&background=10b981&color=fff&size=128&bold=true',
    email: 'amit.patel@example.com',
    submittedAt: '2025-01-15',
    status: 'pending',
    specialty: 'Cardiologist',
  },
  {
    id: 'ver-2',
    type: 'pharmacy',
    name: 'City Pharmacy',
    image: 'https://ui-avatars.com/api/?name=City+Pharmacy&background=8b5cf6&color=fff&size=128&bold=true',
    email: 'citypharmacy@example.com',
    submittedAt: '2025-01-14',
    status: 'pending',
    owner: 'Priya Sharma',
  },
  {
    id: 'ver-3',
    type: 'laboratory',
    name: 'Test Lab Services',
    image: 'https://ui-avatars.com/api/?name=Test+Lab&background=f59e0b&color=fff&size=128&bold=true',
    email: 'testlab@example.com',
    submittedAt: '2025-01-13',
    status: 'pending',
    owner: 'Dr. Anjali Mehta',
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

// Chart Components
const RevenueLineChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding},${padding + chartHeight} ${points} ${padding + chartWidth},${padding + chartHeight}`}
          fill="url(#revenueGradient)"
        />
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth
          const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#10b981"
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {data.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month}</span>
        ))}
      </div>
    </div>
  )
}

const UserGrowthBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.users))
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  const barWidth = chartWidth / data.length * 0.6

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        {data.map((item, index) => {
          const barHeight = (item.users / maxValue) * chartHeight
          const x = padding + (index / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2
          const y = padding + chartHeight - barHeight
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#11496c"
                rx="2"
                className="hover:opacity-80 transition-opacity"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {data.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month}</span>
        ))}
      </div>
    </div>
  )
}

const ConsultationsAreaChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.consultations))
  const minValue = Math.min(...data.map(d => d.consultations))
  const range = maxValue - minValue || 1
  const width = 100
  const height = 120
  const padding = 10
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((item.consultations - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="consultationsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${padding},${padding + chartHeight} ${points} ${padding + chartWidth},${padding + chartHeight}`}
          fill="url(#consultationsGradient)"
        />
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth
          const y = padding + chartHeight - ((item.consultations - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#6366f1"
              className="hover:r-3 transition-all"
            />
          )
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        {data.map((item, index) => (
          <span key={index} className="text-[10px]">{item.month}</span>
        ))}
      </div>
    </div>
  )
}

const UserDistributionChart = ({ patients, doctors, pharmacies, laboratories }) => {
  const total = patients + doctors + pharmacies + laboratories
  const data = [
    { label: 'Patients', value: patients, color: '#3b82f6' },
    { label: 'Doctors', value: doctors, color: '#10b981' },
    { label: 'Pharmacies', value: pharmacies, color: '#8b5cf6' },
    { label: 'Laboratories', value: laboratories, color: '#f59e0b' },
  ]

  let currentAngle = -90
  const centerX = 50
  const centerY = 50
  const radius = 35

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
    const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
    const largeArcFlag = angle > 180 ? 1 : 0

    return {
      path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
    }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{item.label}</p>
              <p className="text-[10px] text-slate-600">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'user':
      return IoPeopleOutline
    case 'doctor':
      return IoMedicalOutline
    case 'pharmacy':
      return IoBusinessOutline
    case 'laboratory':
      return IoFlaskOutline
    case 'consultation':
      return IoDocumentTextOutline
    default:
      return IoNotificationsOutline
  }
}

const AdminDashboard = () => {
  const navigate = useNavigate()

  const usersChange = ((mockStats.thisMonthUsers - mockStats.lastMonthUsers) / mockStats.lastMonthUsers) * 100
  const revenueChange = ((mockStats.thisMonthRevenue - mockStats.lastMonthRevenue) / mockStats.lastMonthRevenue) * 100
  const consultationsChange = ((mockStats.thisMonthConsultations - mockStats.lastMonthConsultations) / mockStats.lastMonthConsultations) * 100

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <>
      <section className="flex flex-col gap-2 pb-20 pt-0 bg-white">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {/* Total Users */}
          <article
            onClick={() => navigate('/admin/users')}
            className="relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-0.5">Total Users</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
                <IoPeopleOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              {usersChange >= 0 ? (
                <>
                  <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">+{usersChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-semibold">{usersChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-600">vs last month</span>
            </div>
          </article>

          {/* Total Doctors */}
          <article
            onClick={() => navigate('/admin/doctors')}
            className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Doctors</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalDoctors}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <IoMedicalOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Active doctors</p>
          </article>

          {/* Total Pharmacies */}
          <article
            onClick={() => navigate('/admin/pharmacies')}
            className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Pharmacies</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalPharmacies}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
                <IoBusinessOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Registered</p>
          </article>

          {/* Total Laboratories */}
          <article
            onClick={() => navigate('/admin/laboratories')}
            className="relative overflow-hidden rounded-xl border border-amber-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700 leading-tight mb-1">Laboratories</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalLaboratories}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                <IoFlaskOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Active labs</p>
          </article>

          {/* Total Consultations */}
          <article className="relative overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-blue-700 leading-tight mb-1">Consultations</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalConsultations.toLocaleString()}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                <IoDocumentTextOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">All time</p>
          </article>

          {/* Today's Appointments */}
          <article className="relative overflow-hidden rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-indigo-700 leading-tight mb-1">Today's Appointments</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.todayAppointments}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
                <IoCalendarOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Scheduled</p>
          </article>

          {/* Total Revenue */}
          <article className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-slate-900 leading-none">{formatCurrency(mockStats.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  {revenueChange >= 0 ? (
                    <>
                      <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">+{revenueChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-semibold">{revenueChange.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <IoWalletOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">vs last month</p>
          </article>

          {/* Pending Verifications */}
          <article
            onClick={() => navigate('/admin/verification')}
            className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1">Pending Verifications</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.pendingVerifications}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                <IoNotificationsOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Requires attention</p>
          </article>
        </div>

        {/* Today's Verifications */}
        <section aria-labelledby="verifications-today-title" className="space-y-2">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="verifications-today-title" className="text-base font-semibold text-slate-900">
                Today's Verifications
              </h2>
              <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
                {todayVerifications.length}
              </span>
            </div>
          </header>

          <div className="space-y-2">
            {todayVerifications.map((verification) => {
              const VerificationIcon = getActivityIcon(verification.type)
              return (
                <article
                  key={verification.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={verification.image}
                        alt={verification.name}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(verification.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white">
                        <IoTimeOutline className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">{verification.name}</h3>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {verification.specialty || verification.owner || 'Verification pending'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(verification.status)}`}>
                          <IoTimeOutline className="h-3 w-3" />
                          {verification.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          <span className="font-medium">{verification.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <VerificationIcon className="h-3.5 w-3.5" />
                          <span className="capitalize">{verification.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoMailOutline className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[120px]">{verification.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Recent Activities & Pending Verifications Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Activities */}
          <section aria-labelledby="activities-title" className="space-y-2">
            <header className="flex items-center justify-between">
              <h2 id="activities-title" className="text-base font-semibold text-slate-900">
                Recent Activities
              </h2>
            </header>

            <div className="space-y-2">
              {recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type)
                return (
                  <article
                    key={activity.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={activity.image}
                        alt={activity.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">{activity.action}</h3>
                            <p className="mt-0.5 text-xs text-slate-600">{activity.name}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(activity.status)}`}>
                            {activity.status === 'success' ? (
                              <IoCheckmarkCircleOutline className="h-3 w-3" />
                            ) : (
                              <IoTimeOutline className="h-3 w-3" />
                            )}
                            {activity.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          {/* Pending Verifications */}
          <section aria-labelledby="verifications-title" className="space-y-2">
            <header className="flex items-center justify-between">
              <h2 id="verifications-title" className="text-base font-semibold text-slate-900">
                Pending Verifications
              </h2>
            </header>

            <div className="space-y-2">
              {pendingVerifications.map((verification) => {
                const VerificationIcon = getActivityIcon(verification.type)
                return (
                  <article
                    key={verification.id}
                    onClick={() => navigate(`/admin/${verification.type}s`)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={verification.image}
                        alt={verification.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(verification.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">{verification.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-600">
                              {verification.specialty || verification.owner || verification.email}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(verification.status)}`}>
                            <IoTimeOutline className="h-3 w-3" />
                            {verification.status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            <span>Submitted: {formatDate(verification.submittedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <VerificationIcon className="h-3.5 w-3.5" />
                            <span className="capitalize">{verification.type}</span>
                          </div>
                        </div>
                      </div>
                      <IoArrowForwardOutline className="h-5 w-5 shrink-0 text-slate-400" />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        {/* Revenue & Statistics Overview */}
        <section aria-labelledby="overview-title">
          <header className="mb-2 flex items-center justify-between">
            <h2 id="overview-title" className="text-base font-semibold text-slate-900">
              Platform Overview
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(mockStats.thisMonthRevenue)}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {revenueChange >= 0 ? (
                      <>
                        <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">+{revenueChange.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">Revenue Trend</h2>
              <p className="mt-1 text-xs text-slate-600">Last 6 months</p>
            </header>
            <RevenueLineChart data={revenueData} />
          </section>

          {/* User Growth Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">User Growth</h2>
              <p className="mt-1 text-xs text-slate-600">Last 6 months</p>
            </header>
            <UserGrowthBarChart data={userGrowthData} />
          </section>

          {/* Consultations Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">Consultations Trend</h2>
              <p className="mt-1 text-xs text-slate-600">Last 6 months</p>
            </header>
            <ConsultationsAreaChart data={consultationsData} />
          </section>

          {/* User Distribution Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-3">
              <h2 className="text-base font-semibold text-slate-900">User Distribution</h2>
              <p className="mt-1 text-xs text-slate-600">By user type</p>
            </header>
            <UserDistributionChart 
              patients={mockStats.totalUsers - mockStats.totalDoctors - mockStats.totalPharmacies - mockStats.totalLaboratories}
              doctors={mockStats.totalDoctors}
              pharmacies={mockStats.totalPharmacies}
              laboratories={mockStats.totalLaboratories}
            />
          </section>
        </div>
      </section>
    </>
  )
}

export default AdminDashboard

