import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoArrowDownOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
} from 'react-icons/io5'

// Mock data
const mockEarningData = {
  totalEarnings: 189420.25,
  thisMonthEarnings: 12500.00,
  lastMonthEarnings: 10800.50,
  thisYearEarnings: 189420.25,
  todayEarnings: 850.00,
  earnings: [
    {
      id: 'earn-1',
      amount: 2500.00,
      description: 'Order payment - Order #1307 - Patient: John Doe',
      date: '2025-01-15T10:30:00',
      status: 'completed',
      category: 'Order Payment',
    },
    {
      id: 'earn-2',
      amount: 3200.00,
      description: 'Order payment - Order #1309 - Patient: Mike Johnson',
      date: '2025-01-13T09:15:00',
      status: 'completed',
      category: 'Order Payment',
    },
    {
      id: 'earn-3',
      amount: 1800.00,
      description: 'Order payment - Order #1308 - Patient: Sarah Smith',
      date: '2025-01-12T16:45:00',
      status: 'pending',
      category: 'Order Payment',
    },
    {
      id: 'earn-4',
      amount: 2100.00,
      description: 'Order payment - Order #1310 - Patient: Emily Brown',
      date: '2025-01-11T11:00:00',
      status: 'completed',
      category: 'Order Payment',
    },
    {
      id: 'earn-5',
      amount: 1500.00,
      description: 'Order payment - Order #1311 - Patient: David Wilson',
      date: '2025-01-10T14:20:00',
      status: 'completed',
      category: 'Order Payment',
    },
  ],
}

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

const WalletEarning = () => {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState('all') // all, today, year, month

  const earningsChange = ((mockEarningData.thisMonthEarnings - mockEarningData.lastMonthEarnings) / mockEarningData.lastMonthEarnings) * 100

  const filteredEarnings = mockEarningData.earnings.filter((earning) => {
    if (filterType === 'all') return true
    // In a real app, you would filter by date range
    return true
  })

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/pharmacy/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <p className="mt-1 text-sm text-slate-600">View your earnings and income details</p>
        </div>
      </div>

      {/* Main Earnings Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-white shadow-xl shadow-emerald-500/30">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90">Total Earnings</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(mockEarningData.totalEarnings)}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <IoArrowDownOutline className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/70 p-5 shadow-sm shadow-blue-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Today</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockEarningData.todayEarnings)}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-5 shadow-sm shadow-emerald-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Month</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockEarningData.thisMonthEarnings)}</p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {earningsChange >= 0 ? (
              <>
                <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">+{earningsChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                <span className="text-red-600 font-semibold">{earningsChange.toFixed(1)}%</span>
              </>
            )}
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100/60 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/70 p-5 shadow-sm shadow-purple-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Year</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockEarningData.thisYearEarnings)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType('today')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'today'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setFilterType('year')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'year'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Year
        </button>
        <button
          type="button"
          onClick={() => setFilterType('month')}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            filterType === 'month'
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-400/40'
              : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Month
        </button>
      </div>

      {/* Earnings List */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Earning History</h2>
        <div className="space-y-3">
          {filteredEarnings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoArrowDownOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No earnings found</p>
              <p className="mt-1 text-sm text-slate-500">Your earnings will appear here</p>
            </div>
          ) : (
            filteredEarnings.map((earning) => (
              <article
                key={earning.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <IoArrowDownOutline className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {earning.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            {earning.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(earning.date)}
                          </span>
                        </div>
                        {earning.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Processing
                          </div>
                        )}
                        {earning.status === 'completed' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-lg font-bold text-emerald-600">
                          +{formatCurrency(earning.amount)}
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

export default WalletEarning

