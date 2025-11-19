import { useNavigate, useLocation } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoWalletOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

// Mock data
const mockBalanceData = {
  totalBalance: 15750.50,
  availableBalance: 12400.25,
  pendingBalance: 3350.25,
  recentActivity: [
    {
      id: 'act-1',
      type: 'available',
      amount: 1500.00,
      description: 'Consultation fee received',
      date: '2025-01-15T10:30:00',
      status: 'completed',
    },
    {
      id: 'act-2',
      type: 'pending',
      amount: 1200.00,
      description: 'Follow-up consultation fee',
      date: '2025-01-12T16:45:00',
      status: 'pending',
    },
    {
      id: 'act-3',
      type: 'available',
      amount: 2500.00,
      description: 'Consultation fee received',
      date: '2025-01-13T09:15:00',
      status: 'completed',
    },
  ],
}

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

const WalletBalance = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/doctor/wallet')}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <IoArrowBackOutline className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Balance</h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600">View your wallet balance details</p>
            </div>
          </div>

          {/* Main Balance Card */}
          <div className="mb-4 sm:mb-6 relative overflow-hidden rounded-xl sm:rounded-3xl border p-4 sm:p-6 text-white shadow-xl" style={{ borderColor: 'rgba(17, 73, 108, 0.2)', background: 'linear-gradient(to bottom right, #11496c, #11496c)', boxShadow: '0 20px 25px -5px rgba(17, 73, 108, 0.3)' }}>
            <div className="absolute -right-10 sm:-right-20 -top-10 sm:-top-20 h-20 w-20 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
            <div className="absolute -left-8 sm:-left-16 bottom-0 h-16 w-16 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
            
            <div className="relative">
              <div className="mb-2 sm:mb-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white/90">Total Balance</p>
                  <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold truncate">{formatCurrency(mockBalanceData.totalBalance)}</p>
                </div>
                <div className="flex h-10 w-10 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                  <IoWalletOutline className="h-5 w-5 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
            <div className="rounded-xl sm:rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-3 sm:p-5 shadow-sm shadow-emerald-100/50">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-700">Available</p>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockBalanceData.availableBalance)}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">Ready to withdraw</p>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-amber-100/60 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/70 p-3 sm:p-5 shadow-sm shadow-amber-100/50">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockBalanceData.pendingBalance)}</p>
              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">Processing</p>
            </div>
          </div>

          {/* Recent Activity */}
          <section>
            <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-slate-900">Recent Activity</h2>
            <div className="space-y-2 sm:space-y-3">
              {mockBalanceData.recentActivity.map((activity) => (
                <article
                  key={activity.id}
                  className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-2.5 sm:gap-4">
                    <div
                      className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
                        activity.type === 'available'
                          ? 'bg-emerald-100'
                          : 'bg-amber-100'
                      }`}
                    >
                      <IoWalletOutline
                        className={`h-4 w-4 sm:h-6 sm:w-6 ${
                          activity.type === 'available'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {activity.description}
                          </p>
                          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">
                            {formatDateTime(activity.date)}
                          </p>
                          {activity.status === 'pending' && (
                            <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-amber-700 border border-amber-200">
                              <IoTimeOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Processing
                            </div>
                          )}
                          {activity.status === 'completed' && (
                            <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-emerald-700 border border-emerald-200">
                              <IoCheckmarkCircleOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              Completed
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end">
                          <p
                            className={`text-base sm:text-lg font-bold ${
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
    </>
  )
}

export default WalletBalance

