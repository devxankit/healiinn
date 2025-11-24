import { useState, useMemo } from 'react'
import {
  IoSearchOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoMedicalOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoArrowBackOutline,
} from 'react-icons/io5'

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generate dates relative to today
const today = new Date()
const todayStr = formatDate(today)
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = formatDate(yesterday)
const twoDaysAgo = new Date(today)
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
const twoDaysAgoStr = formatDate(twoDaysAgo)
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
const threeDaysAgoStr = formatDate(threeDaysAgo)
const fourDaysAgo = new Date(today)
fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
const fourDaysAgoStr = formatDate(fourDaysAgo)
const fiveDaysAgo = new Date(today)
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
const fiveDaysAgoStr = formatDate(fiveDaysAgo)
// For monthly view - dates from earlier in the month
const tenDaysAgo = new Date(today)
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
const tenDaysAgoStr = formatDate(tenDaysAgo)
const fifteenDaysAgo = new Date(today)
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
const fifteenDaysAgoStr = formatDate(fifteenDaysAgo)
// For yearly view - dates from previous months
const lastMonth = new Date(today)
lastMonth.setMonth(lastMonth.getMonth() - 1)
const lastMonthStr = formatDate(lastMonth)
const twoMonthsAgo = new Date(today)
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
const twoMonthsAgoStr = formatDate(twoMonthsAgo)
const threeMonthsAgo = new Date(today)
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
const threeMonthsAgoStr = formatDate(threeMonthsAgo)

const mockAppointments = [
  {
    id: 'apt-1',
    patientName: 'John Doe',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    date: todayStr,
    time: '10:00 AM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-2',
    patientName: 'Sarah Smith',
    doctorName: 'Dr. Michael Brown',
    specialty: 'Pediatrics',
    date: todayStr,
    time: '11:30 AM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-3',
    patientName: 'Mike Johnson',
    doctorName: 'Dr. James Wilson',
    specialty: 'Dermatology',
    date: todayStr,
    time: '02:00 PM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-4',
    patientName: 'Emily Brown',
    doctorName: 'Dr. Jennifer Lee',
    specialty: 'Orthopedics',
    date: todayStr,
    time: '09:00 AM',
    status: 'cancelled',
    type: 'consultation',
  },
  {
    id: 'apt-5',
    patientName: 'David Wilson',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    date: todayStr,
    time: '03:30 PM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-6',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'General Medicine',
    date: todayStr,
    time: '01:00 PM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-7',
    patientName: 'Anjali Mehta',
    doctorName: 'Dr. Amit Patel',
    specialty: 'Gynecology',
    date: todayStr,
    time: '04:00 PM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-8',
    patientName: 'Rohit Singh',
    doctorName: 'Dr. Sneha Reddy',
    specialty: 'Neurology',
    date: todayStr,
    time: '05:00 PM',
    status: 'completed',
    type: 'consultation',
  },
  // This week appointments for monthly view
  {
    id: 'apt-9',
    patientName: 'Ravi Verma',
    doctorName: 'Dr. Michael Brown',
    specialty: 'Pediatrics',
    date: yesterdayStr,
    time: '10:30 AM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-10',
    patientName: 'Sneha Patel',
    doctorName: 'Dr. James Wilson',
    specialty: 'Dermatology',
    date: yesterdayStr,
    time: '02:30 PM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-11',
    patientName: 'Amit Singh',
    doctorName: 'Dr. Jennifer Lee',
    specialty: 'Orthopedics',
    date: twoDaysAgoStr,
    time: '11:00 AM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-12',
    patientName: 'Kavita Reddy',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    date: twoDaysAgoStr,
    time: '03:00 PM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-13',
    patientName: 'Vikram Malhotra',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'General Medicine',
    date: threeDaysAgoStr,
    time: '09:30 AM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-14',
    patientName: 'Meera Iyer',
    doctorName: 'Dr. Amit Patel',
    specialty: 'Gynecology',
    date: threeDaysAgoStr,
    time: '01:30 PM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-15',
    patientName: 'Arjun Nair',
    doctorName: 'Dr. Sneha Reddy',
    specialty: 'Neurology',
    date: fourDaysAgoStr,
    time: '04:00 PM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-16',
    patientName: 'Divya Menon',
    doctorName: 'Dr. Michael Brown',
    specialty: 'Pediatrics',
    date: fourDaysAgoStr,
    time: '10:00 AM',
    status: 'cancelled',
    type: 'consultation',
  },
  {
    id: 'apt-17',
    patientName: 'Nikhil Joshi',
    doctorName: 'Dr. James Wilson',
    specialty: 'Dermatology',
    date: fiveDaysAgoStr,
    time: '02:00 PM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-18',
    patientName: 'Pooja Desai',
    doctorName: 'Dr. Jennifer Lee',
    specialty: 'Orthopedics',
    date: fiveDaysAgoStr,
    time: '11:30 AM',
    status: 'confirmed',
    type: 'consultation',
  },
  // Earlier this month for monthly view
  {
    id: 'apt-19',
    patientName: 'Rahul Gupta',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    date: tenDaysAgoStr,
    time: '10:00 AM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-20',
    patientName: 'Sunita Rao',
    doctorName: 'Dr. Michael Brown',
    specialty: 'Pediatrics',
    date: tenDaysAgoStr,
    time: '02:00 PM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-21',
    patientName: 'Karan Mehta',
    doctorName: 'Dr. James Wilson',
    specialty: 'Dermatology',
    date: fifteenDaysAgoStr,
    time: '11:00 AM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-22',
    patientName: 'Neha Shah',
    doctorName: 'Dr. Jennifer Lee',
    specialty: 'Orthopedics',
    date: fifteenDaysAgoStr,
    time: '03:30 PM',
    status: 'completed',
    type: 'consultation',
  },
  // Previous months for yearly view
  {
    id: 'apt-23',
    patientName: 'Vishal Kumar',
    doctorName: 'Dr. Rajesh Kumar',
    specialty: 'General Medicine',
    date: lastMonthStr,
    time: '09:00 AM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-24',
    patientName: 'Deepika Nair',
    doctorName: 'Dr. Amit Patel',
    specialty: 'Gynecology',
    date: lastMonthStr,
    time: '01:00 PM',
    status: 'confirmed',
    type: 'consultation',
  },
  {
    id: 'apt-25',
    patientName: 'Aditya Singh',
    doctorName: 'Dr. Sneha Reddy',
    specialty: 'Neurology',
    date: twoMonthsAgoStr,
    time: '10:30 AM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-26',
    patientName: 'Shreya Patel',
    doctorName: 'Dr. Michael Brown',
    specialty: 'Pediatrics',
    date: twoMonthsAgoStr,
    time: '02:30 PM',
    status: 'rescheduled',
    type: 'consultation',
  },
  {
    id: 'apt-27',
    patientName: 'Manish Verma',
    doctorName: 'Dr. James Wilson',
    specialty: 'Dermatology',
    date: threeMonthsAgoStr,
    time: '11:30 AM',
    status: 'completed',
    type: 'consultation',
  },
  {
    id: 'apt-28',
    patientName: 'Anita Iyer',
    doctorName: 'Dr. Jennifer Lee',
    specialty: 'Orthopedics',
    date: threeMonthsAgoStr,
    time: '04:00 PM',
    status: 'confirmed',
    type: 'consultation',
  },
]

const AdminAppointments = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('daily') // daily, monthly, yearly
  const [appointments] = useState(mockAppointments)

  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Filter by period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter((apt) => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)

      if (periodFilter === 'daily') {
        return aptDate.getTime() === today.getTime()
      } else if (periodFilter === 'monthly') {
        return aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear()
      } else if (periodFilter === 'yearly') {
        return aptDate.getFullYear() === today.getFullYear()
      }
      return true
    })

    // Filter by search
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(normalizedSearch) ||
          apt.doctorName.toLowerCase().includes(normalizedSearch) ||
          apt.specialty.toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateB - dateA
    })
  }, [appointments, searchTerm, periodFilter])

  // Doctor aggregation
  const doctorAggregation = useMemo(() => {
    const doctorMap = new Map()
    
    filteredAppointments.forEach((apt) => {
      const key = `${apt.doctorName}_${apt.specialty}`
      
      if (!doctorMap.has(key)) {
        doctorMap.set(key, {
          doctorName: apt.doctorName,
          specialty: apt.specialty,
          confirmed: 0,
          rescheduled: 0,
          completed: 0,
          cancelled: 0,
          totalAppointments: 0,
        })
      }
      
      const doctor = doctorMap.get(key)
      doctor.totalAppointments++
      
      if (apt.status === 'confirmed') {
        doctor.confirmed++
      } else if (apt.status === 'rescheduled') {
        doctor.rescheduled++
      } else if (apt.status === 'completed') {
        doctor.completed++
      } else if (apt.status === 'cancelled') {
        doctor.cancelled++
      }
    })
    
    // Filter by search if provided
    let doctors = Array.from(doctorMap.values())
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      doctors = doctors.filter((doctor) =>
        doctor.doctorName.toLowerCase().includes(normalizedSearch) ||
        doctor.specialty.toLowerCase().includes(normalizedSearch)
      )
    }
    
    // Sort by total appointments descending
    return doctors.sort((a, b) => b.totalAppointments - a.totalAppointments)
  }, [filteredAppointments, searchTerm])

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'rescheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return IoCheckmarkCircleOutline
      case 'rescheduled':
        return IoCalendarOutline
      case 'cancelled':
        return IoCloseCircleOutline
      default:
        return IoTimeOutline
    }
  }

  const stats = useMemo(() => {
    const total = filteredAppointments.length
    const confirmed = filteredAppointments.filter((apt) => apt.status === 'confirmed').length
    const completed = filteredAppointments.filter((apt) => apt.status === 'completed').length
    const rescheduled = filteredAppointments.filter((apt) => apt.status === 'rescheduled').length
    const cancelled = filteredAppointments.filter((apt) => apt.status === 'cancelled').length
    
    // Doctor stats from aggregation
    const doctorStats = {
      totalDoctors: doctorAggregation.length,
      totalConfirmed: doctorAggregation.reduce((sum, d) => sum + d.confirmed, 0),
      totalCompleted: doctorAggregation.reduce((sum, d) => sum + d.completed, 0),
      totalRescheduled: doctorAggregation.reduce((sum, d) => sum + d.rescheduled, 0),
      totalCancelled: doctorAggregation.reduce((sum, d) => sum + d.cancelled, 0),
    }

    return { total, confirmed, completed, rescheduled, cancelled, doctorStats }
  }, [filteredAppointments, doctorAggregation])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all appointments</p>
        </div>
      </header>

      {/* Period Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['daily', 'monthly', 'yearly'].map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              periodFilter === period
                ? 'bg-[#11496c] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.doctorStats.totalDoctors}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.doctorStats.totalConfirmed}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.doctorStats.totalCompleted}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Rescheduled</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.doctorStats.totalRescheduled}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Cancelled</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.doctorStats.totalCancelled}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search by doctor name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
        />
      </div>

      {/* Doctor List */}
      <div className="space-y-3">
        {doctorAggregation.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <IoCalendarOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No doctors found</p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm.trim()
                ? 'No doctors match your search criteria.'
                : `No appointments for ${periodFilter} period.`}
            </p>
          </div>
        ) : (
          doctorAggregation.map((doctor) => {
            return (
              <article
                key={`${doctor.doctorName}_${doctor.specialty}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#11496c]/10">
                    <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">{doctor.doctorName}</h3>
                        <p className="mt-0.5 text-sm text-slate-600">{doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">{doctor.totalAppointments}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Confirmed</p>
                        <p className="mt-1 text-xl font-bold text-emerald-700">{doctor.confirmed}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
                        <p className="mt-1 text-xl font-bold text-emerald-700">{doctor.completed}</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Rescheduled</p>
                        <p className="mt-1 text-xl font-bold text-blue-700">{doctor.rescheduled}</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Cancelled</p>
                        <p className="mt-1 text-xl font-bold text-red-700">{doctor.cancelled}</p>
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
  )
}

export default AdminAppointments

