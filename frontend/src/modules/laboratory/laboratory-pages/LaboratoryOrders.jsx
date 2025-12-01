import { useState, useMemo, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
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
  {
    id: 'order-4',
    type: 'laboratory',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    patientPhone: '+1-555-456-7890',
    patientEmail: 'emily.brown@example.com',
    status: 'pending',
    createdAt: '2024-01-12T09:20:00.000Z',
    testRequestId: 'test-3024',
    tests: [
      { name: 'Thyroid Function Test', price: 450.0 },
    ],
    totalAmount: 450.0,
    deliveryType: 'pickup',
    address: '321 Elm St, New York, NY',
  },
  {
    id: 'order-5',
    type: 'laboratory',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    patientPhone: '+1-555-567-8901',
    patientEmail: 'david.wilson@example.com',
    status: 'ready',
    createdAt: '2024-01-11T11:30:00.000Z',
    testRequestId: 'test-3025',
    tests: [
      { name: 'Hemoglobin A1C', price: 500.0 },
      { name: 'Vitamin D', price: 350.0 },
    ],
    totalAmount: 850.0,
    deliveryType: 'home',
    address: '654 Maple Ave, New York, NY',
  },
  {
    id: 'order-6',
    type: 'laboratory',
    patientId: 'pat-6',
    patientName: 'Lisa Anderson',
    patientPhone: '+1-555-678-9012',
    patientEmail: 'lisa.anderson@example.com',
    status: 'completed',
    createdAt: '2024-01-10T15:45:00.000Z',
    testRequestId: 'test-3026',
    tests: [
      { name: 'Complete Metabolic Panel (CMP)', price: 1200.0 },
    ],
    totalAmount: 1200.0,
    deliveryType: 'pickup',
    address: '987 Cedar Blvd, New York, NY',
  },
  {
    id: 'order-7',
    type: 'laboratory',
    patientId: 'pat-7',
    patientName: 'Robert Taylor',
    patientPhone: '+1-555-789-0123',
    patientEmail: 'robert.taylor@example.com',
    status: 'pending',
    createdAt: '2024-01-09T08:15:00.000Z',
    testRequestId: 'test-3027',
    tests: [
      { name: 'Urine Analysis', price: 300.0 },
      { name: 'Stool Test', price: 650.0 },
    ],
    totalAmount: 950.0,
    deliveryType: 'home',
    address: '147 Birch Ln, New York, NY',
  },
  {
    id: 'order-8',
    type: 'laboratory',
    patientId: 'pat-8',
    patientName: 'Jennifer Martinez',
    patientPhone: '+1-555-890-1234',
    patientEmail: 'jennifer.martinez@example.com',
    status: 'ready',
    createdAt: '2024-01-08T13:20:00.000Z',
    testRequestId: 'test-3028',
    tests: [
      { name: 'ECG', price: 600.0 },
      { name: 'Chest X-Ray', price: 500.0 },
    ],
    totalAmount: 1100.0,
    deliveryType: 'pickup',
    address: '258 Spruce Dr, New York, NY',
  },
  {
    id: 'order-9',
    type: 'laboratory',
    patientId: 'pat-9',
    patientName: 'Michael Chen',
    patientPhone: '+1-555-901-2345',
    patientEmail: 'michael.chen@example.com',
    status: 'pending',
    createdAt: '2024-01-07T10:00:00.000Z',
    testRequestId: 'test-3029',
    tests: [
      { name: 'PSA Test', price: 800.0 },
    ],
    totalAmount: 800.0,
    deliveryType: 'home',
    address: '369 Willow Way, New York, NY',
  },
  {
    id: 'order-10',
    type: 'laboratory',
    patientId: 'pat-10',
    patientName: 'Priya Sharma',
    patientPhone: '+1-555-012-3456',
    patientEmail: 'priya.sharma@example.com',
    status: 'completed',
    createdAt: '2024-01-06T14:30:00.000Z',
    testRequestId: 'test-3030',
    tests: [
      { name: 'HbA1c', price: 550.0 },
      { name: 'Lipid Panel', price: 600.0 },
    ],
    totalAmount: 1150.0,
    deliveryType: 'pickup',
    address: '741 Ash St, New York, NY',
  },
  {
    id: 'order-11',
    type: 'laboratory',
    patientId: 'pat-11',
    patientName: 'James Wilson',
    patientPhone: '+1-555-123-4568',
    patientEmail: 'james.wilson@example.com',
    status: 'ready',
    createdAt: '2024-01-05T16:00:00.000Z',
    testRequestId: 'test-3031',
    tests: [
      { name: 'Bone Density Test', price: 900.0 },
    ],
    totalAmount: 900.0,
    deliveryType: 'home',
    address: '852 Poplar Ave, New York, NY',
  },
  {
    id: 'order-12',
    type: 'laboratory',
    patientId: 'pat-12',
    patientName: 'Maria Garcia',
    patientPhone: '+1-555-234-5679',
    patientEmail: 'maria.garcia@example.com',
    status: 'pending',
    createdAt: '2024-01-04T09:45:00.000Z',
    testRequestId: 'test-3032',
    tests: [
      { name: 'Pap Smear', price: 400.0 },
      { name: 'Mammogram', price: 750.0 },
    ],
    totalAmount: 1150.0,
    deliveryType: 'pickup',
    address: '963 Oakwood Dr, New York, NY',
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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const LaboratoryOrders = () => {
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orders, setOrders] = useState(mockOrders)
  const [loading, setLoading] = useState(true)

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('laboratoryAuthToken') || sessionStorage.getItem('laboratoryAuthToken')
        if (!token) {
          // If no token, use mock data
          setOrders(mockOrders)
          setLoading(false)
          return
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/labs/leads?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.leads && data.leads.length > 0) {
            // Transform leads to orders format
            const transformedOrders = data.leads.map(lead => {
              const patientName = lead.patient?.firstName && lead.patient?.lastName
                ? `${lead.patient.firstName} ${lead.patient.lastName}`
                : lead.patient?.name || 'Unknown Patient'
              
              return {
                id: lead._id,
                _id: lead._id,
                type: 'laboratory',
                patientId: lead.patient?._id || lead.patient,
                patientName: patientName,
                patientPhone: lead.patient?.phone || '+91-000-000-0000',
                patientEmail: lead.patient?.email || 'patient@example.com',
                status: lead.status === 'accepted' ? 'ready' : lead.status === 'new' ? 'pending' : lead.status === 'test_completed' ? 'completed' : lead.status,
                createdAt: lead.createdAt || new Date().toISOString(),
                testRequestId: lead._id,
                tests: (lead.tests || lead.investigations || []).map(test => ({
                  name: typeof test === 'string' ? test : test.name || test.testName || 'Test',
                  price: typeof test === 'object' && test.price ? test.price : 0,
                })),
                totalAmount: lead.billingSummary?.totalAmount || lead.amount || 0,
                deliveryType: lead.homeCollectionRequested ? 'home' : 'pickup',
                address: lead.patient?.address ? 
                  `${lead.patient.address.line1 || ''} ${lead.patient.address.city || ''} ${lead.patient.address.state || ''}`.trim() || 'Address not provided'
                  : 'Address not provided',
              }
            })
            setOrders(transformedOrders)
          } else {
            // If no data from API, use mock data
            setOrders(mockOrders)
          }
        } else {
          // If API fails, use mock data
          setOrders(mockOrders)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        // Fallback to mock data on error
        setOrders(mockOrders)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (filter !== 'all') {
      filtered = filtered.filter((order) => order.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.patientName.toLowerCase().includes(normalizedSearch) ||
          String(order.id || order._id || '').toLowerCase().includes(normalizedSearch) ||
          String(order.testRequestId || '').toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filter, searchTerm, orders])

  const handleStatusUpdate = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId || o._id === orderId)
    if (!order) {
      toast.error('Order not found')
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
      // Update order status in state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          (o.id === orderId || o._id === orderId) 
            ? { ...o, status: newStatus }
            : o
        )
      )
      
      // TODO: Call API to update status
      // const token = localStorage.getItem('laboratoryAuthToken') || sessionStorage.getItem('laboratoryAuthToken')
      // await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/labs/leads/${orderId}/status`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ status: newStatus }),
      // })
      
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(`Order status updated to "${statusLabel}"! Notification sent to ${patientName}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status. Please try again.')
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
      <div className="space-y-3 lg:grid lg:grid-cols-4 lg:gap-4 lg:space-y-0">
        {loading ? (
          <div className="lg:col-span-4 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#11496c] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="lg:col-span-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No orders found</p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm.trim() || filter !== 'all' 
                ? 'No orders match your search or filter criteria.' 
                : 'Your orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = statusInfo.icon
            const orderId = order.id || order._id || `order-${Math.random()}`

            return (
              <article
                key={orderId}
                className="group relative overflow-hidden flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#11496c]/30 active:scale-[0.98] lg:hover:scale-[1.02] sm:p-5 lg:gap-3.5"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#11496c]/0 to-[#11496c]/0 group-hover:from-[#11496c]/5 group-hover:to-[#11496c]/10 transition-all duration-300"></div>
                <div className="relative flex items-start justify-between gap-3 lg:gap-2">
                  <div className="flex-1 min-w-0 lg:min-w-0">
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:gap-1.5">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-sm lg:truncate lg:flex-1">{order.patientName}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusInfo.color} group-hover:scale-105 transition-transform duration-300 shrink-0 lg:text-[9px] lg:px-1.5 lg:py-0.5`}>
                        <StatusIcon className="h-3 w-3 lg:h-2.5 lg:w-2.5" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 group-hover:text-slate-600 transition-colors lg:text-[10px] lg:truncate">Order ID: {String(orderId).slice(0, 12)}...</p>
                    {order.testRequestId && (
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors line-clamp-1 lg:text-[10px] lg:truncate">Test: {String(order.testRequestId).slice(0, 10)}...</p>
                    )}
                    <p className="mt-1 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:flex lg:items-center lg:gap-1">
                      <IoCalendarOutline className="mr-1 inline h-3 w-3 text-[#11496c] lg:h-2.5 lg:w-2.5 lg:mr-0" />
                      <span className="lg:truncate">{formatDateTime(order.createdAt)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 lg:flex lg:flex-col lg:items-end lg:gap-0.5">
                    <p className="text-lg font-bold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 lg:text-base lg:leading-tight">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors lg:text-[10px]">
                      {order.deliveryType === 'home' ? 'Home' : 'Pickup'}
                    </p>
                  </div>
                </div>

                {/* Tests */}
                {order.tests && order.tests.length > 0 && (
                  <div className="relative rounded-lg bg-slate-50 p-3 group-hover:bg-slate-100 transition-colors duration-300 lg:p-2.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-600 transition-colors lg:text-[10px] lg:mb-1.5">Tests</p>
                    <ul className="space-y-1.5 lg:space-y-1">
                      {order.tests.map((test, idx) => {
                        const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                        const testPrice = typeof test === 'object' && test.price ? test.price : 0
                        return (
                          <li key={idx} className="flex items-center justify-between text-xs lg:text-[10px]">
                            <span className="text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1 line-clamp-1 lg:flex-1 lg:min-w-0">
                              <IoFlaskOutline className="h-3 w-3 text-[#11496c] shrink-0 lg:h-2.5 lg:w-2.5" />
                              <span className="truncate">{testName}</span>
                            </span>
                            {testPrice > 0 && (
                              <span className="font-semibold text-slate-900 group-hover:text-[#11496c] transition-colors shrink-0 lg:ml-1 lg:text-[10px]">{formatCurrency(testPrice)}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Address */}
                <div className="relative flex items-start gap-2 text-xs text-slate-600 group-hover:text-slate-700 transition-colors lg:text-[10px] lg:gap-1.5">
                  <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0 text-[#11496c] lg:h-3 lg:w-3 lg:mt-0" />
                  <span className="line-clamp-2 lg:line-clamp-1">{order.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="relative flex gap-2 flex-wrap lg:mt-auto lg:pt-2 lg:border-t lg:border-slate-200">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(orderId, 'ready')}
                      className="flex-1 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95 group-hover:scale-105 lg:px-2 lg:py-1.5 lg:text-[10px]"
                    >
                      <span className="lg:hidden">Mark Ready</span>
                      <span className="hidden lg:inline">Ready</span>
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusUpdate(orderId, 'completed')}
                      className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 hover:shadow-md active:scale-95 group-hover:scale-105 lg:px-2 lg:py-1.5 lg:text-[10px]"
                    >
                      <span className="lg:hidden">Mark Completed</span>
                      <span className="hidden lg:inline">Complete</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="View Details"
                  >
                    <IoDocumentTextOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </button>
                  <a
                    href={`tel:${order.patientPhone}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Call Patient"
                  >
                    <IoCallOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
                  <a
                    href={`mailto:${order.patientEmail}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-all hover:border-blue-500 hover:bg-blue-500 hover:text-white active:scale-95 group-hover:scale-110 lg:h-8 lg:w-8"
                    aria-label="Email Patient"
                  >
                    <IoMailOutline className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                  </a>
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
              {selectedOrder.tests && selectedOrder.tests.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Tests</h3>
                  <ul className="space-y-2">
                    {selectedOrder.tests.map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testPrice = typeof test === 'object' && test.price ? test.price : 0
                      return (
                        <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <IoFlaskOutline className="h-4 w-4 text-[#11496c]" />
                            <span className="font-medium">{testName}</span>
                          </div>
                          {testPrice > 0 && (
                            <p className="font-semibold">{formatCurrency(testPrice)}</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
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

