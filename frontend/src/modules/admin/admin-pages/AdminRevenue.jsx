import { useState, useEffect } from 'react'
import {
  IoWalletOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoTimeOutline,
  IoFilterOutline,
} from 'react-icons/io5'
import { getRevenueOverview } from '../admin-services/adminService'
import { useToast } from '../../../contexts/ToastContext'

// Default data structure (will be replaced by API data)
const defaultRevenueData = {
  totalRevenue: 0,
  thisMonthRevenue: 0,
  lastMonthRevenue: 0,
  thisWeekRevenue: 0,
  lastWeekRevenue: 0,
  todayRevenue: 0,
  yesterdayRevenue: 0,
  revenueBySource: {
    doctors: 0,
    pharmacies: 0,
    laboratories: 0,
  },
  revenueBreakdown: {
    consultations: 0,
    labOrders: 0,
    pharmacyOrders: 0,
    commissions: 0,
  },
  monthlyRevenue: [],
  recentTransactions: [],
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getSourceIcon = (type) => {
  switch (type) {
    case 'consultation':
      return IoMedicalOutline
    case 'pharmacy':
      return IoBusinessOutline
    case 'laboratory':
      return IoFlaskOutline
    default:
      return IoReceiptOutline
  }
}

const AdminRevenue = () => {
  const toast = useToast()
  const [revenueData, setRevenueData] = useState(defaultRevenueData)
  const [selectedPeriod, setSelectedPeriod] = useState('month') // 'today', 'week', 'month', 'year'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch revenue data from API
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getRevenueOverview()
        
        if (response.success && response.data) {
          const data = response.data
          setRevenueData({
            totalRevenue: data.totalRevenue || 0,
            thisMonthRevenue: data.thisMonthRevenue || 0,
            lastMonthRevenue: data.lastMonthRevenue || 0,
            thisWeekRevenue: data.thisWeekRevenue || 0,
            lastWeekRevenue: data.lastWeekRevenue || 0,
            todayRevenue: data.todayRevenue || 0,
            yesterdayRevenue: data.yesterdayRevenue || 0,
            revenueBySource: data.revenueBySource || {
              doctors: 0,
              pharmacies: 0,
              laboratories: 0,
            },
            revenueBreakdown: data.revenueBreakdown || {
              consultations: 0,
              labOrders: 0,
              pharmacyOrders: 0,
              commissions: 0,
            },
            monthlyRevenue: data.monthlyRevenue || [],
            recentTransactions: data.recentTransactions || [],
          })
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err)
        setError(err.message || 'Failed to load revenue data')
        toast.error('Failed to load revenue data')
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [toast])

  const revenueChange = revenueData.lastMonthRevenue > 0
    ? ((revenueData.thisMonthRevenue - revenueData.lastMonthRevenue) / revenueData.lastMonthRevenue) * 100
    : 0
  const weekChange = revenueData.lastWeekRevenue > 0
    ? ((revenueData.thisWeekRevenue - revenueData.lastWeekRevenue) / revenueData.lastWeekRevenue) * 100
    : 0
  const dayChange = revenueData.yesterdayRevenue > 0
    ? ((revenueData.todayRevenue - revenueData.yesterdayRevenue) / revenueData.yesterdayRevenue) * 100
    : 0

  const getPeriodRevenue = () => {
    switch (selectedPeriod) {
      case 'today':
        return {
          current: revenueData.todayRevenue,
          previous: revenueData.yesterdayRevenue,
          change: dayChange,
        }
      case 'week':
        return {
          current: revenueData.thisWeekRevenue,
          previous: revenueData.lastWeekRevenue,
          change: weekChange,
        }
      case 'month':
        return {
          current: revenueData.thisMonthRevenue,
          previous: revenueData.lastMonthRevenue,
          change: revenueChange,
        }
      default:
        return {
          current: revenueData.thisMonthRevenue,
          previous: revenueData.lastMonthRevenue,
          change: revenueChange,
        }
    }
  }

  const periodRevenue = getPeriodRevenue()

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Revenue Overview</h1>
        <p className="text-sm text-slate-600">Complete revenue analytics and breakdown</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {['today', 'week', 'month', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              selectedPeriod === period
                ? 'bg-[#11496c] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Revenue Card */}
      <div className="rounded-xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-2">
              Total Revenue
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(revenueData.totalRevenue)}
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {periodRevenue.change >= 0 ? (
                <>
                  <IoTrendingUpOutline className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">+{periodRevenue.change.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <IoTrendingDownOutline className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-semibold">{periodRevenue.change.toFixed(1)}%</span>
                </>
              )}
              <span className="text-slate-600">vs last {selectedPeriod === 'today' ? 'day' : selectedPeriod}</span>
            </div>
          </div>
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
            <IoWalletOutline className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        </div>
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Today Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Today</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(revenueData.todayRevenue)}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px]">
            {dayChange >= 0 ? (
              <>
                <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600">+{dayChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{dayChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* This Week Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">This Week</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(revenueData.thisWeekRevenue)}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px]">
            {weekChange >= 0 ? (
              <>
                <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600">+{weekChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{weekChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* This Month Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">This Month</p>
          <p className="text-lg sm:text-xl font-bold text-slate-900">{formatCurrency(revenueData.thisMonthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px]">
            {revenueChange >= 0 ? (
              <>
                <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600">+{revenueChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">All Time</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-900">{formatCurrency(revenueData.totalRevenue)}</p>
          <p className="text-[10px] text-emerald-700 mt-1">Total revenue</p>
        </div>
      </div>

      {/* Revenue by Source */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <IoMedicalOutline className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctors</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(revenueData.revenueBySource.doctors)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            {((revenueData.revenueBySource.doctors / revenueData.totalRevenue) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <IoBusinessOutline className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pharmacies</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(revenueData.revenueBySource.pharmacies)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            {((revenueData.revenueBySource.pharmacies / revenueData.totalRevenue) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <IoFlaskOutline className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Laboratories</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(revenueData.revenueBySource.laboratories)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            {((revenueData.revenueBySource.laboratories / revenueData.totalRevenue) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Revenue Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Consultations</p>
            <p className="text-base font-bold text-slate-900">{formatCurrency(revenueData.revenueBreakdown.consultations)}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              {((revenueData.revenueBreakdown.consultations / revenueData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Lab Orders</p>
            <p className="text-base font-bold text-slate-900">{formatCurrency(revenueData.revenueBreakdown.labOrders)}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              {((revenueData.revenueBreakdown.labOrders / revenueData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Pharmacy Orders</p>
            <p className="text-base font-bold text-slate-900">
              {formatCurrency(revenueData.revenueBreakdown.pharmacyOrders)}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              {((revenueData.revenueBreakdown.pharmacyOrders / revenueData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Commissions</p>
            <p className="text-base font-bold text-slate-900">{formatCurrency(revenueData.revenueBreakdown.commissions)}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              {((revenueData.revenueBreakdown.commissions / revenueData.totalRevenue) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Monthly Revenue Trend</h2>
        <div className="space-y-2">
          {revenueData.monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...revenueData.monthlyRevenue.map((r) => r.revenue))
            const percentage = (item.revenue / maxRevenue) * 100
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-xs font-medium text-slate-600">{item.month}</div>
                <div className="flex-1">
                  <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-lg transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-slate-900">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <button className="text-sm font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {revenueData.recentTransactions.map((transaction) => {
            const SourceIcon = getSourceIcon(transaction.type)
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#11496c]/10">
                  <SourceIcon className="h-5 w-5 text-[#11496c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{transaction.source}</p>
                  <p className="text-xs text-slate-600 capitalize">{transaction.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-slate-600">Commission: {formatCurrency(transaction.commission)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600">{formatDate(transaction.date)}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {transaction.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default AdminRevenue

