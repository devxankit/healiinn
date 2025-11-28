import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoFlaskOutline,
  IoBagHandleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5'

const mockOrders = [
  {
    id: 'order-1',
    type: 'lab',
    labName: 'MediCare Diagnostics',
    testName: 'Complete Blood Count (CBC)',
    status: 'sample_collected',
    amount: 1200,
    date: '2024-01-15',
    time: '10:30 AM',
    collectionType: 'home',
    address: '123 Main St, New York, NY',
    prescriptionId: 'presc-1',
  },
  {
    id: 'order-2',
    type: 'pharmacy',
    pharmacyName: 'Rx Care Pharmacy',
    medicineName: 'Amlodipine 5mg, Losartan 50mg',
    status: 'delivered',
    amount: 850,
    date: '2024-01-14',
    time: '02:15 PM',
    deliveryType: 'home',
    address: '123 Main St, New York, NY',
    prescriptionId: 'presc-2',
  },
  {
    id: 'order-3',
    type: 'lab',
    labName: 'HealthLab Center',
    testName: 'ECG, Blood Pressure Monitoring',
    status: 'test_completed',
    amount: 1500,
    date: '2024-01-13',
    time: '11:00 AM',
    collectionType: 'lab',
    address: '200 Park Ave, New York, NY',
    prescriptionId: 'presc-1',
  },
  {
    id: 'order-4',
    type: 'pharmacy',
    pharmacyName: 'Wellness Pharmacy',
    medicineName: 'Paracetamol 500mg',
    status: 'new',
    amount: 250,
    date: '2024-01-12',
    time: '09:45 AM',
    deliveryType: 'pickup',
    address: '150 Broadway, New York, NY',
    prescriptionId: 'presc-3',
  },
  {
    id: 'order-5',
    type: 'lab',
    labName: 'Diagnostic Solutions',
    testName: 'COVID-19 RT-PCR Test',
    status: 'report_uploaded',
    amount: 800,
    date: '2024-01-11',
    time: '03:20 PM',
    collectionType: 'home',
    address: '100 Main St, New York, NY',
    prescriptionId: 'presc-4',
  },
  {
    id: 'order-6',
    type: 'pharmacy',
    pharmacyName: 'MedExpress',
    medicineName: 'Aspirin 75mg',
    status: 'patient_arrived',
    amount: 180,
    date: '2024-01-10',
    time: '01:30 PM',
    deliveryType: 'pickup',
    address: '50 State St, New York, NY',
    prescriptionId: 'presc-5',
  },
]

const PatientOrders = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [orders, setOrders] = useState([])

  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      try {
        const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
        
        // Transform orders to display format
        const transformedOrders = patientOrders.map(order => {
          const orderDate = order.createdAt || order.paidAt || new Date().toISOString()
          const date = new Date(orderDate).toISOString().split('T')[0]
          const time = new Date(orderDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          
          // Preserve payment status - check paymentConfirmed first, then paymentPending, then order.status
          let orderStatus = order.status
          if (order.paymentConfirmed) {
            orderStatus = 'payment_confirmed'
          } else if (order.paymentPending || order.status === 'payment_pending') {
            orderStatus = 'payment_pending'
          } else if (!orderStatus) {
            orderStatus = 'confirmed'
          }
          
          if (order.type === 'lab') {
            return {
              id: order.id,
              type: 'lab',
              labName: order.labName || order.providerNames?.join(', ') || 'Laboratory',
              testName: order.investigations?.map(inv => typeof inv === 'string' ? inv : inv.name).join(', ') || 'Lab Tests',
              status: orderStatus,
              amount: order.totalAmount || 0,
              date: date,
              time: time,
              collectionType: 'home',
              address: order.patient?.address || order.address || 'N/A',
              prescriptionId: order.requestId,
              requestId: order.requestId,
              investigations: order.investigations || [],
              providerIds: order.providerIds || [order.labId].filter(Boolean),
              providerNames: order.providerNames || [order.labName].filter(Boolean),
              paymentPending: order.paymentPending,
              paymentConfirmed: order.paymentConfirmed,
            }
          } else if (order.type === 'pharmacy') {
            return {
              id: order.id,
              type: 'pharmacy',
              pharmacyName: order.pharmacyName || order.providerNames?.join(', ') || 'Pharmacy',
              medicineName: order.medicines?.map(med => typeof med === 'string' ? med : med.name).join(', ') || 'Medicines',
              status: orderStatus,
              amount: order.totalAmount || 0,
              date: date,
              time: time,
              deliveryType: 'home',
              address: order.patient?.address || order.address || 'N/A',
              prescriptionId: order.requestId,
              requestId: order.requestId,
              medicines: order.medicines || [],
              providerIds: order.providerIds || [order.pharmacyId].filter(Boolean),
              providerNames: order.providerNames || [order.pharmacyName].filter(Boolean),
              paymentPending: order.paymentPending,
              paymentConfirmed: order.paymentConfirmed,
            }
          }
          return null
        }).filter(Boolean)
        
        // Merge with mock data for backward compatibility
        const merged = [...transformedOrders, ...mockOrders]
        const unique = merged.filter((order, idx, self) => 
          idx === self.findIndex(o => o.id === order.id)
        )
        
        // Sort by date (newest first)
        unique.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
        
        setOrders(unique)
      } catch (error) {
        console.error('Error loading orders:', error)
        setOrders(mockOrders)
      }
    }
    
    loadOrders()
    // Refresh every 2 seconds to get new orders
    const interval = setInterval(loadOrders, 2000)
    return () => clearInterval(interval)
  }, [])

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.type === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'payment_pending':
        return 'bg-blue-100 text-blue-700'
      case 'payment_confirmed':
        return 'bg-emerald-100 text-emerald-700'
      case 'new':
        return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
      case 'home_collection_requested':
      case 'patient_arrived':
      case 'delivery_requested':
        return 'bg-amber-100 text-amber-700'
      case 'sample_collected':
      case 'delivered':
        return 'bg-purple-100 text-purple-700'
      case 'test_completed':
      case 'report_uploaded':
        return 'bg-emerald-100 text-emerald-700'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'payment_pending':
        return 'Payment Pending'
      case 'payment_confirmed':
        return 'Payment Confirmed'
      // Lab statuses
      case 'new':
        return 'New Order'
      case 'home_collection_requested':
        return 'Collection Requested'
      case 'sample_collected':
        return 'Sample Collected'
      case 'test_completed':
        return 'Test Completed'
      case 'report_uploaded':
        return 'Report Uploaded'
      // Pharmacy statuses
      case 'patient_arrived':
        return 'Patient Arrived'
      case 'delivery_requested':
        return 'Delivery Requested'
      case 'delivered':
        return 'Delivered'
      // Common statuses
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'payment_pending':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'payment_confirmed':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'new':
      case 'home_collection_requested':
      case 'patient_arrived':
      case 'delivery_requested':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'sample_collected':
      case 'delivered':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'test_completed':
      case 'report_uploaded':
      case 'completed':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'lab', 'pharmacy'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === type
                ? 'bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type === 'all' ? 'All Orders' : type === 'lab' ? 'Lab Tests' : 'Pharmacy'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div 
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg"
                style={order.type === 'lab' 
                  ? { 
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)'
                    }
                  : {
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3), 0 2px 4px -1px rgba(245, 158, 11, 0.2)'
                    }
                }
              >
                {order.type === 'lab' ? (
                  <IoFlaskOutline className="h-6 w-6 text-white" />
                ) : (
                  <IoBagHandleOutline className="h-6 w-6 text-white" />
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                {/* Left Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Type and Amount Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {order.type === 'lab' ? order.labName : order.pharmacyName}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      <p className="text-lg font-bold text-slate-900 whitespace-nowrap">₹{order.amount}</p>
                    </div>
                  </div>

                  {/* Order Name */}
                  <p className="text-sm font-medium text-slate-600">
                    {order.type === 'lab' ? order.testName : order.medicineName}
                  </p>

                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{getStatusLabel(order.status)}</span>
                    </span>
                  </div>

                  {/* Date and Time Row */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <IoCalendarOutline className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(order.date)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-3.5 w-3.5 shrink-0" />
                      <span>{order.time}</span>
                    </span>
                  </div>

                  {/* Address and Type */}
                  <div className="space-y-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <IoLocationOutline className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {order.type === 'lab' 
                        ? `Collection: ${order.collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}`
                        : `Delivery: ${order.deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}`
                      }
                    </p>
                    {order.prescriptionId && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <IoDocumentTextOutline className="h-3.5 w-3.5 shrink-0" />
                        <span>Prescription: {order.prescriptionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            {filter === 'lab' ? (
              <IoFlaskOutline className="h-8 w-8" />
            ) : filter === 'pharmacy' ? (
              <IoBagHandleOutline className="h-8 w-8" />
            ) : (
              <IoDocumentTextOutline className="h-8 w-8" />
            )}
          </div>
          <p className="text-lg font-semibold text-slate-700">No orders found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}
    </section>
  )
}

export default PatientOrders

