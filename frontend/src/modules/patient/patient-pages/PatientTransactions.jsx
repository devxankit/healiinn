import { useState, useEffect } from 'react'
import {
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
} from 'react-icons/io5'

const PatientTransactions = () => {
  const [filter, setFilter] = useState('all')
  const [transactions, setTransactions] = useState([])

  // Mock transactions for demonstration
  const mockTransactions = [
    {
      id: 'txn-1',
      type: 'Appointment',
      category: 'doctor',
      providerName: 'Dr. Rajesh Kumar',
      amount: 500,
      status: 'completed',
      date: '2025-01-15',
      time: '10:30 AM',
      transactionId: 'TXN-APP-001',
      paymentMethod: 'UPI',
      queueNumber: 5,
    },
    {
      id: 'txn-2',
      type: 'Lab Test',
      category: 'laboratory',
      providerName: 'MediCare Diagnostics',
      serviceName: 'Complete Blood Count (CBC)',
      amount: 350,
      status: 'completed',
      date: '2025-01-14',
      time: '02:15 PM',
      transactionId: 'TXN-LAB-002',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'txn-3',
      type: 'Pharmacy',
      category: 'pharmacy',
      providerName: 'City Pharmacy',
      serviceName: 'Prescription Medicines',
      amount: 1250,
      status: 'pending',
      date: '2025-01-13',
      time: '11:00 AM',
      transactionId: 'TXN-PHAR-003',
      paymentMethod: 'Wallet',
    },
    {
      id: 'txn-4',
      type: 'Appointment',
      category: 'doctor',
      providerName: 'Dr. Priya Sharma',
      amount: 600,
      status: 'completed',
      date: '2025-01-12',
      time: '09:45 AM',
      transactionId: 'TXN-APP-004',
      paymentMethod: 'Debit Card',
      queueNumber: 3,
    },
    {
      id: 'txn-5',
      type: 'Lab Test',
      category: 'laboratory',
      providerName: 'HealthLab Center',
      serviceName: 'Blood Glucose Test',
      amount: 450,
      status: 'completed',
      date: '2025-01-11',
      time: '03:20 PM',
      transactionId: 'TXN-LAB-005',
      paymentMethod: 'UPI',
    },
    {
      id: 'txn-6',
      type: 'Pharmacy',
      category: 'pharmacy',
      providerName: 'MediPlus Pharmacy',
      serviceName: 'Prescription Medicines',
      amount: 850,
      status: 'failed',
      date: '2025-01-10',
      time: '04:00 PM',
      transactionId: 'TXN-PHAR-006',
      paymentMethod: 'Credit Card',
    },
  ]

  // Load all transactions from localStorage and combine with mock data
  useEffect(() => {
    const loadTransactions = () => {
      const allTransactions = []

      // Load Doctor Appointments
      try {
        const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
        appointments.forEach((appt) => {
          if (appt.amount || appt.fee) {
            allTransactions.push({
              id: `appt-${appt.id}`,
              type: 'Appointment',
              category: 'doctor',
              providerName: appt.doctorName || 'Doctor',
              amount: appt.amount || appt.fee || 0,
              status: appt.status === 'confirmed' || appt.status === 'completed' ? 'completed' : appt.status || 'pending',
              date: appt.appointmentDate || appt.date || new Date().toISOString().split('T')[0],
              time: appt.appointmentTime ? appt.appointmentTime.split('T')[1]?.substring(0, 5) : 'N/A',
              transactionId: `TXN-APP-${appt.id}`,
              paymentMethod: appt.paymentMethod || 'Online',
              queueNumber: appt.queueNumber,
            })
          }
        })
      } catch (error) {
        console.error('Error loading appointments:', error)
      }

      // Load Lab and Pharmacy Requests (from PatientRequests) - Only payment confirmed
      try {
        const requests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
        requests.forEach((req) => {
          // Only include payment confirmed requests
          if (req.paymentConfirmed && req.totalAmount && (req.status === 'confirmed' || req.status === 'paid' || req.paidAt)) {
            const paidDate = req.paidAt ? new Date(req.paidAt) : (req.responseDate ? new Date(req.responseDate) : new Date())
            const dateStr = paidDate.toISOString().split('T')[0]
            const timeStr = paidDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            
            allTransactions.push({
              id: `req-${req.id}`,
              type: req.type === 'lab' ? 'Lab Test' : 'Pharmacy',
              category: req.type === 'lab' ? 'laboratory' : 'pharmacy',
              providerName: req.providerName || (req.type === 'lab' ? 'Laboratory' : 'Pharmacy'),
              serviceName: req.type === 'lab' ? (req.testName || 'Lab Tests') : (req.medicineName || 'Medicines'),
              amount: req.totalAmount,
              status: 'completed',
              date: dateStr,
              time: timeStr,
              transactionId: `TXN-${req.type === 'lab' ? 'LAB' : 'PHAR'}-${req.id?.substring(0, 8) || Date.now()}`,
              paymentMethod: req.paymentMethod || 'Online',
              requestId: req.id,
              paidAt: req.paidAt,
            })
          }
        })
      } catch (error) {
        console.error('Error loading requests:', error)
      }

      // Load from patientOrders - payment confirmed orders
      try {
        const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
        patientOrders.forEach((order) => {
          // Only include payment confirmed orders
          if (order.paymentConfirmed && order.totalAmount && order.paidAt) {
            const paidDate = new Date(order.paidAt)
            const dateStr = paidDate.toISOString().split('T')[0]
            const timeStr = paidDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            
            // Check if transaction already exists (from requests)
            const existingTxn = allTransactions.find(txn => txn.requestId === order.requestId)
            if (!existingTxn) {
              allTransactions.push({
                id: `order-${order.id}`,
                type: order.type === 'lab' ? 'Lab Test' : 'Pharmacy',
                category: order.type === 'lab' ? 'laboratory' : 'pharmacy',
                providerName: order.type === 'lab' 
                  ? (order.labName || order.providerNames?.join(', ') || 'Laboratory')
                  : (order.pharmacyName || order.providerNames?.join(', ') || 'Pharmacy'),
                serviceName: order.type === 'lab' 
                  ? (order.investigations?.map(inv => typeof inv === 'string' ? inv : inv.name).join(', ') || 'Lab Tests')
                  : (order.medicines?.map(med => typeof med === 'string' ? med : med.name).join(', ') || 'Medicines'),
                amount: order.totalAmount,
                status: 'completed',
                date: dateStr,
                time: timeStr,
                transactionId: `TXN-${order.type === 'lab' ? 'LAB' : 'PHAR'}-${order.id?.substring(0, 8) || Date.now()}`,
                paymentMethod: 'Online',
                requestId: order.requestId,
                paidAt: order.paidAt,
              })
            }
          }
        })
      } catch (error) {
        console.error('Error loading orders:', error)
      }

      // If no transactions found, use mock data
      if (allTransactions.length === 0) {
        allTransactions.push(...mockTransactions)
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB - dateA
      })

      setTransactions(allTransactions)
    }

    loadTransactions()
  }, [])

  // Filter out pending transactions (they should show in requests page)
  const completedTransactions = transactions.filter(txn => txn.status !== 'pending' && txn.status !== 'accepted')
  
  const filteredTransactions = filter === 'all' 
    ? completedTransactions 
    : completedTransactions.filter(txn => txn.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
      case 'accepted':
        return 'bg-amber-100 text-amber-700'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'paid':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'pending':
      case 'accepted':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'failed':
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getTypeIcon = (type, category) => {
    if (category === 'laboratory' || type === 'Lab Test') {
      return <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
    } else if (category === 'pharmacy' || type === 'Pharmacy') {
      return <IoBagHandleOutline className="h-6 w-6 text-amber-600" />
    } else {
      return <IoPeopleOutline className="h-6 w-6 text-purple-600" />
    }
  }

  const getTypeBgColor = (category) => {
    if (category === 'laboratory') {
      return 'bg-[rgba(17,73,108,0.1)]'
    } else if (category === 'pharmacy') {
      return 'bg-amber-100'
    } else {
      return 'bg-purple-100'
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const formatDateTime = (dateString, timeString) => {
    try {
      if (dateString && timeString && timeString !== 'N/A') {
        return `${formatDate(dateString)}, ${timeString}`
      }
      return formatDate(dateString)
    } catch (error) {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            style={filter === status ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : {}}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getTypeBgColor(transaction.category)}`}>
                {getTypeIcon(transaction.type, transaction.category)}
              </div>

              {/* Main Content with Amount on Right */}
              <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                {/* Left Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Provider Name and Amount Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{transaction.providerName}</p>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 capitalize shrink-0">{transaction.category}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <p className={`text-lg font-bold whitespace-nowrap ${transaction.status === 'completed' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {transaction.status === 'completed' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-slate-600">
                      {transaction.category === 'laboratory' 
                        ? `Payment for lab test order to ${transaction.providerName}`
                        : transaction.category === 'pharmacy'
                        ? `Payment for medicine order to ${transaction.providerName}`
                        : `Payment for ${transaction.type.toLowerCase()}`
                      }
                    </p>
                    {transaction.serviceName && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{transaction.serviceName}</p>
                    )}
                  </div>

                  {/* Status Badge and Type Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status === 'paid' ? 'completed' : transaction.status === 'accepted' ? 'pending' : transaction.status}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      transaction.category === 'laboratory' 
                        ? 'bg-blue-100 text-blue-700' 
                        : transaction.category === 'pharmacy'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {transaction.type}
                    </span>
                  </div>

                  {/* Date and Time */}
                  <div className="text-xs text-slate-500">
                    <span>{formatDateTime(transaction.date, transaction.time)}</span>
                  </div>

                  {/* Transaction ID and Order ID */}
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-xs text-slate-400">Transaction ID: {transaction.transactionId}</p>
                    {transaction.requestId && (
                      <p className="text-xs text-slate-400">Order: {transaction.requestId}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoReceiptOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No transactions found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}
    </section>
  )
}

export default PatientTransactions
