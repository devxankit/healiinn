import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoFlaskOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

const mockOrders = [
  {
    id: 'order-1',
    testName: 'Complete Blood Count (CBC)',
    patientId: 'pat-1',
    patientName: 'John Doe',
    status: 'pending',
    createdAt: '2024-01-15T10:30:00.000Z',
    price: 25.0,
  },
  {
    id: 'order-2',
    testName: 'Blood Glucose (Fasting)',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    status: 'completed',
    createdAt: '2024-01-14T14:15:00.000Z',
    price: 15.0,
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: IoTimeOutline },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const LabOrders = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOrders = useMemo(() => {
    let orders = mockOrders

    if (filter !== 'all') {
      orders = orders.filter((order) => order.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      orders = orders.filter(
        (order) =>
          order.patientName.toLowerCase().includes(normalizedSearch) ||
          order.testName.toLowerCase().includes(normalizedSearch) ||
          order.id.toLowerCase().includes(normalizedSearch)
      )
    }

    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filter, searchTerm])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/lab/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          aria-label="Go back"
        >
          <IoArrowBackOutline className="text-xl" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Test Orders</h1>
          <p className="text-sm text-slate-600">View all test orders</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-400/40'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {statusConfig[status]?.label || status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <IoFlaskOutline className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No orders found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || IoTimeOutline
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{order.testName}</h3>
                        <p className="mt-1 text-sm text-slate-600">Order ID: {order.id}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          statusConfig[order.status]?.color || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoPersonOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>{order.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoCalendarOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>Created: {formatDateTime(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium text-slate-900">Price: {formatCurrency(order.price)}</span>
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

export default LabOrders

