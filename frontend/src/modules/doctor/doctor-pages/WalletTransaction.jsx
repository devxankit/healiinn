import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoArrowBackOutline,
  IoReceiptOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoFilterOutline,
} from 'react-icons/io5'

// Mock data
const mockTransactions = [
  {
    id: 'txn-1',
    type: 'earning',
    amount: 1500.00,
    description: 'Consultation fee - Patient: John Doe',
    date: '2025-01-15T10:30:00',
    status: 'completed',
    category: 'Consultation',
  },
  {
    id: 'txn-2',
    type: 'withdrawal',
    amount: -5000.00,
    description: 'Withdrawal to Bank Account',
    date: '2025-01-14T14:20:00',
    status: 'completed',
    category: 'Withdrawal',
  },
  {
    id: 'txn-3',
    type: 'earning',
    amount: 2500.00,
    description: 'Consultation fee - Patient: Sarah Smith',
    date: '2025-01-13T09:15:00',
    status: 'completed',
    category: 'Consultation',
  },
  {
    id: 'txn-4',
    type: 'earning',
    amount: 1200.00,
    description: 'Follow-up consultation - Patient: Mike Johnson',
    date: '2025-01-12T16:45:00',
    status: 'pending',
    category: 'Follow-up',
  },
  {
    id: 'txn-5',
    type: 'earning',
    amount: 1800.00,
    description: 'Consultation fee - Patient: Emily Brown',
    date: '2025-01-11T11:00:00',
    status: 'completed',
    category: 'Consultation',
  },
  {
    id: 'txn-6',
    type: 'withdrawal',
    amount: -3000.00,
    description: 'Withdrawal to Bank Account',
    date: '2025-01-10T10:00:00',
    status: 'completed',
    category: 'Withdrawal',
  },
  {
    id: 'txn-7',
    type: 'earning',
    amount: 1000.00,
    description: 'Video consultation - Patient: David Wilson',
    date: '2025-01-09T14:20:00',
    status: 'completed',
    category: 'Video Consultation',
  },
  {
    id: 'txn-8',
    type: 'earning',
    amount: 2200.00,
    description: 'Consultation fee - Patient: Lisa Anderson',
    date: '2025-01-08T16:30:00',
    status: 'completed',
    category: 'Consultation',
  },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const WalletTransaction = () => {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState('all') // all, earnings, withdrawals

  const filteredTransactions = mockTransactions.filter((txn) => {
    if (filterType === 'all') return true
    if (filterType === 'earnings') return txn.type === 'earning'
    if (filterType === 'withdrawals') return txn.type === 'withdrawal'
    return true
  })

  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-14 sm:pt-20 pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/doctor/wallet')}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <IoArrowBackOutline className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Transactions</h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600">View all your transaction history</p>
            </div>
          </div>

          {/* Main Transaction Card */}
          <div className="mb-4 sm:mb-6 relative overflow-hidden rounded-xl sm:rounded-3xl border border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-4 sm:p-6 text-white shadow-xl shadow-purple-500/30">
            <div className="absolute -right-10 sm:-right-20 -top-10 sm:-top-20 h-20 w-20 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
            <div className="absolute -left-8 sm:-left-16 bottom-0 h-16 w-16 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
            
            <div className="relative">
              <div className="mb-2 sm:mb-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white/90">Total Transactions</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold">{mockTransactions.length}</p>
                </div>
                <div className="flex h-10 w-10 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                  <IoReceiptOutline className="h-5 w-5 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
            <IoFilterOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-slate-500" />
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('earnings')}
              className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                filterType === 'earnings'
                  ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Earnings
            </button>
            <button
              type="button"
              onClick={() => setFilterType('withdrawals')}
              className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                filterType === 'withdrawals'
                  ? 'bg-purple-500 text-white shadow-sm shadow-purple-400/40'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Withdrawals
            </button>
          </div>

          {/* Transactions List */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-slate-900">Transaction History</h2>
            <div className="space-y-2 sm:space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm">
                  <IoReceiptOutline className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-300" />
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold text-slate-600">No transactions found</p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">Your transaction history will appear here</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="group rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-4">
                      <div
                        className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                          transaction.type === 'earning'
                            ? 'bg-emerald-100'
                            : 'bg-amber-100'
                        }`}
                      >
                        {transaction.type === 'earning' ? (
                          <IoArrowDownOutline className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
                        ) : (
                          <IoArrowUpOutline className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                              {transaction.description}
                            </p>
                            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 font-medium">
                                {transaction.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <IoCalendarOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {formatDateTime(transaction.date)}
                              </span>
                            </div>
                            {transaction.status === 'pending' && (
                              <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-amber-700 border border-amber-200">
                                <IoTimeOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Processing
                              </div>
                            )}
                            {transaction.status === 'completed' && (
                              <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-emerald-700 border border-emerald-200">
                                <IoCheckmarkCircleOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Completed
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end">
                            <p
                              className={`text-base sm:text-lg font-bold ${
                                transaction.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {transaction.type === 'earning' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default WalletTransaction

