import { useState, useMemo } from 'react'
import {
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoFlaskOutline,
} from 'react-icons/io5'

const mockOrders = [
  {
    id: 'order-1',
    type: 'laboratory',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'john.doe@example.com',
    status: 'pending',
    createdAt: '2024-01-15T10:30:00.000Z',
    testRequestId: 'test-3021',
    tests: [
      { name: 'Complete Blood Count (CBC)', price: 450.0 },
      { name: 'Blood Glucose (Fasting)', price: 250.0 },
    ],
    totalAmount: 700.0,
    deliveryType: 'home',
    address: '123 Main St, New York, NY',
  },
  {
    id: 'order-2',
    type: 'laboratory',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'sarah.smith@example.com',
    status: 'ready',
    createdAt: '2024-01-14T14:15:00.000Z',
    testRequestId: 'test-3022',
    tests: [
      { name: 'Lipid Profile', price: 600.0 },
    ],
    totalAmount: 600.0,
    deliveryType: 'pickup',
    address: '456 Oak Ave, New York, NY',
  },
  {
    id: 'order-3',
    type: 'laboratory',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'mike.johnson@example.com',
    status: 'completed',
    createdAt: '2024-01-13T16:45:00.000Z',
    testRequestId: 'test-3023',
    tests: [
      { name: 'Liver Function Test (LFT)', price: 800.0 },
      { name: 'Kidney Function Test (KFT)', price: 750.0 },
    ],
    totalAmount: 1550.0,
    deliveryType: 'home',
    address: '789 Pine St, New York, NY',
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: IoTimeOutline },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700', icon: IoCheckmarkCircleOutline },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: IoCloseCircleOutline },
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const LaboratoryOrders = () => {
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

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
          order.id.toLowerCase().includes(normalizedSearch) ||
          order.testRequestId.toLowerCase().includes(normalizedSearch)
      )
    }

    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filter, searchTerm])

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = mockOrders.find(o => o.id === orderId)
    if (!order) {
      alert('Order not found')
      return
    }

    const statusLabel = statusConfig[newStatus]?.label || newStatus
    const patientName = order.patientName
    const totalAmount = formatCurrency(order.totalAmount)

    const confirmMessage = `Update order status to "${statusLabel}"?\n\nPatient: ${patientName}\nOrder ID: ${orderId}\nTotal Amount: ${totalAmount}\n\nThis will send a notification to the patient about the order status.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert(`✅ Order status updated to "${statusLabel}"!\n\n📱 Notification sent to ${patientName}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status. Please try again.')
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, order ID, or test request..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'ready', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'bg-[#11496c] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status === 'all' ? 'All Orders' : statusConfig[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No orders found matching your filters.
          </p>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = statusInfo.icon

            return (
              <article
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{order.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Order ID: {order.id}</p>
                    <p className="text-xs text-slate-500">Test Request: {order.testRequestId}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      <IoCalendarOutline className="mr-1 inline h-3 w-3" />
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-slate-500">
                      {order.deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}
                    </p>
                  </div>
                </div>

                {/* Tests */}
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tests</p>
                  <ul className="space-y-1.5">
                    {order.tests.map((test, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 flex items-center gap-1">
                          <IoFlaskOutline className="h-3 w-3" />
                          {test.name}
                        </span>
                        <span className="font-semibold text-slate-900">{formatCurrency(test.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{order.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      className="flex-1 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'completed')}
                      className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 active:scale-95"
                    >
                      Mark Completed
                    </button>
                  )}
                  <a
                    href={`tel:${order.patientPhone}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoCallOutline className="h-4 w-4" />
                    Call
                  </a>
                  <a
                    href={`mailto:${order.patientEmail}`}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoMailOutline className="h-4 w-4" />
                    Email
                  </a>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoDocumentTextOutline className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseCircleOutline className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Patient Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.patientName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.patientPhone}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.patientEmail}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Tests</h3>
                <ul className="space-y-2">
                  {selectedOrder.tests.map((test, idx) => (
                    <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <IoFlaskOutline className="h-4 w-4 text-[#11496c]" />
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <p className="font-semibold">{formatCurrency(test.price)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-lg text-slate-900">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryOrders

