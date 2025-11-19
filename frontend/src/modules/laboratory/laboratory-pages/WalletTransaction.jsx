import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    amount: 3500.0,
    description: 'Test order payment received - Order #2001',
    date: '2025-01-15T10:30:00',
    status: 'completed',
    category: 'Test Order Payment',
  },
  {
    id: 'txn-2',
    type: 'withdrawal',
    amount: -10000.0,
    description: 'Withdrawal to Bank Account',
    date: '2025-01-14T14:20:00',
    status: 'completed',
    category: 'Withdrawal',
  },
  {
    id: 'txn-3',
    type: 'earning',
    amount: 4200.0,
    description: 'Test order payment received - Order #2003',
    date: '2025-01-13T09:15:00',
    status: 'completed',
    category: 'Test Order Payment',
  },
  {
    id: 'txn-4',
    type: 'earning',
    amount: 2500.0,
    description: 'Test order payment received - Order #2002',
    date: '2025-01-12T16:45:00',
    status: 'pending',
    category: 'Test Order Payment',
  },
  {
    id: 'txn-5',
    type: 'earning',
    amount: 2800.0,
    description: 'Test order payment received - Order #2004',
    date: '2025-01-11T11:00:00',
    status: 'completed',
    category: 'Test Order Payment',
  },
  {
    id: 'txn-6',
    type: 'withdrawal',
    amount: -6000.0,
    description: 'Withdrawal to Bank Account',
    date: '2025-01-10T10:00:00',
    status: 'completed',
    category: 'Withdrawal',
  },
  {
    id: 'txn-7',
    type: 'earning',
    amount: 2000.0,
    description: 'Test order payment received - Order #2005',
    date: '2025-01-09T14:20:00',
    status: 'completed',
    category: 'Test Order Payment',
  },
  {
    id: 'txn-8',
    type: 'earning',
    amount: 3200.0,
    description: 'Test order payment received - Order #2006',
    date: '2025-01-08T16:30:00',
    status: 'completed',
    category: 'Test Order Payment',
  },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
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
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/laboratory/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600">View all your transaction history</p>
        </div>
      </div>

      {/* Main Transaction Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-6 text-white shadow-xl shadow-purple-500/30">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90">Total Transactions</p>
              <p className="mt-2 text-4xl font-bold">{mockTransactions.length}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <IoReceiptOutline className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <IoFilterOutline className="h-5 w-5 shrink-0 text-slate-500" />
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
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
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
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
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
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
        <h2 className="mb-4 text-lg font-bold text-slate-900">Transaction History</h2>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoReceiptOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">Your transaction history will appear here</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      transaction.type === 'earning' ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}
                  >
                    {transaction.type === 'earning' ? (
                      <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <IoArrowUpOutline className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            {transaction.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(transaction.date)}
                          </span>
                        </div>
                        {transaction.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Processing
                          </div>
                        )}
                        {transaction.status === 'completed' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p
                          className={`text-lg font-bold ${
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
    </section>
  )
}

export default WalletTransaction

