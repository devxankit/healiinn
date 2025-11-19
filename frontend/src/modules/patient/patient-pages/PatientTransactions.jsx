import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
} from 'react-icons/io5'

const mockTransactions = [
  {
    id: 'txn-1',
    type: 'Appointment',
    doctor: 'Dr. Alana Rueter',
    amount: 500,
    status: 'completed',
    date: '2024-01-15',
    time: '10:30 AM',
    transactionId: 'TXN123456789',
    paymentMethod: 'UPI',
  },
  {
    id: 'txn-2',
    type: 'Lab Test',
    doctor: 'Dr. Sarah Mitchell',
    amount: 1200,
    status: 'completed',
    date: '2024-01-14',
    time: '02:15 PM',
    transactionId: 'TXN123456790',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'txn-3',
    type: 'Pharmacy',
    doctor: 'Dr. James Wilson',
    amount: 850,
    status: 'pending',
    date: '2024-01-13',
    time: '11:00 AM',
    transactionId: 'TXN123456791',
    paymentMethod: 'Wallet',
  },
  {
    id: 'txn-4',
    type: 'Appointment',
    doctor: 'Dr. Emily Chen',
    amount: 900,
    status: 'completed',
    date: '2024-01-12',
    time: '09:45 AM',
    transactionId: 'TXN123456792',
    paymentMethod: 'Debit Card',
  },
  {
    id: 'txn-5',
    type: 'Appointment',
    doctor: 'Dr. Michael Brown',
    amount: 600,
    status: 'failed',
    date: '2024-01-11',
    time: '03:20 PM',
    transactionId: 'TXN123456793',
    paymentMethod: 'UPI',
  },
]

const PatientTransactions = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filteredTransactions = filter === 'all' 
    ? mockTransactions 
    : mockTransactions.filter(txn => txn.status === filter)

  // Ensure we have data
  if (!mockTransactions || mockTransactions.length === 0) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No transactions available</p>
        </div>
      </section>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
      case 'pending':
        return <IoTimeOutline className="h-3.5 w-3.5" />
      case 'failed':
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-600">{filteredTransactions.length} transactions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'completed', 'pending', 'failed'].map((status) => (
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                <IoReceiptOutline className="h-6 w-6 text-purple-600" />
              </div>

              {/* Main Content with Amount on Right */}
              <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                {/* Left Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Type and Amount Row */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{transaction.type}</h3>
                    <div className="shrink-0">
                      <p className="text-lg font-bold text-slate-900 whitespace-nowrap">₹{transaction.amount}</p>
                    </div>
                  </div>

                  {/* Doctor Name */}
                  <p className="text-sm font-medium text-slate-600">{transaction.doctor}</p>

                  {/* Status Badge - Consistently placed here */}
                  <div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status}</span>
                    </span>
                  </div>

                  {/* Date and Time Row */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <IoCalendarOutline className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(transaction.date)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-3.5 w-3.5 shrink-0" />
                      <span>{transaction.time}</span>
                    </span>
                  </div>

                  {/* Transaction ID and Payment */}
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-xs text-slate-400">ID: {transaction.transactionId}</p>
                    <p className="text-xs text-slate-400">Payment: {transaction.paymentMethod}</p>
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

