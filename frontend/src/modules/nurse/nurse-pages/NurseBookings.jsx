import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NurseNavbar from '../nurse-components/NurseNavbar'
import NurseHeader from '../nurse-components/NurseHeader'
import NurseFooter from '../nurse-components/NurseFooter'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoCalendarOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoPersonOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
} from 'react-icons/io5'

// Default bookings (will be replaced by API data)
const defaultBookings = []

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (timeString) => {
  return timeString || 'N/A'
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

const NurseBookings = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [bookings, setBookings] = useState(defaultBookings)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all') // 'today', 'monthly', 'yearly', 'all'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        // TODO: Import nurse bookings service when available
        // const response = await getNurseBookings()
        // if (response.success && response.data) {
        //   const bookingsData = Array.isArray(response.data) 
        //     ? response.data 
        //     : response.data.items || response.data.bookings || []
        //   setBookings(bookingsData)
        // }
        setBookings([])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching bookings:', err)
        setError(err.message || 'Failed to load bookings')
        toast.error('Failed to load bookings')
        setLoading(false)
      }
    }

    fetchBookings()
  }, [toast])

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        booking.patientName?.toLowerCase().includes(searchLower) ||
        booking.reason?.toLowerCase().includes(searchLower) ||
        booking.status?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const bookingDate = new Date(booking.date || booking.bookingDate)
      const now = new Date()
      
      if (filterPeriod === 'today') {
        return bookingDate.toDateString() === now.toDateString()
      } else if (filterPeriod === 'monthly') {
        return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
      } else if (filterPeriod === 'yearly') {
        return bookingDate.getFullYear() === now.getFullYear()
      }
    }

    return true
  })

  return (
    <>
      <NurseNavbar />
      <NurseHeader />
      <section className="flex flex-col gap-4 pb-24 lg:pb-8 pt-20 lg:pt-24 min-h-screen">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Booking</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your bookings</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 focus:border-[#11496c]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <IoRefreshOutline className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading bookings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <IoCloseCircleOutline className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-sm font-medium text-red-800">{error}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <IoCalendarOutline className="mx-auto h-16 w-16 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No bookings found</p>
            <p className="mt-2 text-sm text-slate-600">
              {searchTerm || filterPeriod !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You don\'t have any bookings yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredBookings.map((booking) => (
              <article
                key={booking.id || booking._id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors">
                        {booking.patientName || 'Unknown Patient'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{booking.reason || 'Consultation'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                      {booking.status === 'confirmed' ? (
                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                      ) : (
                        <IoTimeOutline className="h-3 w-3" />
                      )}
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <IoCalendarOutline className="h-4 w-4 text-[#11496c]" />
                      <span>{formatDate(booking.date || booking.bookingDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoTimeOutline className="h-4 w-4 text-[#11496c]" />
                      <span>{formatTime(booking.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoPersonOutline className="h-4 w-4 text-[#11496c]" />
                      <span>{booking.type || 'In-person'}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <NurseFooter />
    </>
  )
}

export default NurseBookings

