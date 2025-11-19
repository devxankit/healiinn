import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

// Mock data
const mockBalanceData = {
  totalBalance: 24500.75,
  availableBalance: 18900.50,
  pendingBalance: 5600.25,
  recentActivity: [
    {
      id: 'act-1',
      type: 'available',
      amount: 2500.00,
      description: 'Order payment received - Order #1307',
      date: '2025-01-15T10:30:00',
      status: 'completed',
    },
    {
      id: 'act-2',
      type: 'pending',
      amount: 1800.00,
      description: 'Order payment - Order #1308',
      date: '2025-01-12T16:45:00',
      status: 'pending',
    },
    {
      id: 'act-3',
      type: 'available',
      amount: 3200.00,
      description: 'Order payment received - Order #1309',
      date: '2025-01-13T09:15:00',
      status: 'completed',
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

const WalletBalance = () => {
  const navigate = useNavigate()

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
          <h1 className="text-2xl font-bold text-slate-900">Balance</h1>
          <p className="mt-1 text-sm text-slate-600">View your wallet balance details</p>
        </div>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 p-6 text-white shadow-xl shadow-blue-500/30">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90">Total Balance</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(mockBalanceData.totalBalance)}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <IoWalletOutline className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-5 shadow-sm shadow-emerald-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockBalanceData.availableBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Ready to withdraw</p>
        </div>

        <div className="rounded-2xl border border-amber-100/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/70 p-5 shadow-sm shadow-amber-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockBalanceData.pendingBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Processing</p>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Recent Activity</h2>
        <div className="space-y-3">
          {mockBalanceData.recentActivity.map((activity) => (
            <article
              key={activity.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    activity.type === 'available'
                      ? 'bg-emerald-100'
                      : 'bg-amber-100'
                  }`}
                >
                  <IoWalletOutline
                    className={`h-6 w-6 ${
                      activity.type === 'available'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(activity.date)}
                      </p>
                      {activity.status === 'pending' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          Processing
                        </div>
                      )}
                      {activity.status === 'completed' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                          <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                          Completed
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <p
                        className={`text-lg font-bold ${
                          activity.type === 'available'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        +{formatCurrency(activity.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default WalletBalance

