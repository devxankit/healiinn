import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'

// Mock data
const mockWalletData = {
  totalBalance: 32500.75,
  availableBalance: 24500.50,
  pendingBalance: 8000.25,
  thisMonthEarnings: 18500.00,
  lastMonthEarnings: 16200.50,
  totalEarnings: 245420.25,
  totalWithdrawals: 212919.50,
  totalTransactions: 142,
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const LaboratoryWallet = () => {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Wallet</h1>
            <p className="mt-1.5 text-sm text-slate-600">Manage your laboratory earnings and withdrawals</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-100">
            <IoShieldCheckmarkOutline className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 hidden sm:inline">Secure</span>
          </div>
        </div>
      </div>

      {/* Main Balance Card - Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(17,73,108,0.15)] bg-gradient-to-br from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 sm:p-8 text-white shadow-2xl shadow-[rgba(17,73,108,0.25)]">
        {/* Animated Background Elements */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80 mb-1">Total Balance</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{formatCurrency(mockWalletData.totalBalance)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Available: {formatCurrency(mockWalletData.availableBalance)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Pending: {formatCurrency(mockWalletData.pendingBalance)}</span>
                </div>
              </div>
            </div>
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <IoWalletOutline className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Earning Card */}
        <button
          onClick={() => navigate('/laboratory/wallet/earning')}
          className="group relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] hover:border-emerald-200"
        >
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <IoArrowDownOutline className="h-5 w-5 text-emerald-600" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">Total Earnings</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockWalletData.totalEarnings)}</p>
            <p className="mt-1 text-[10px] text-slate-500">All time earnings</p>
          </div>
        </button>

        {/* Withdraw Card */}
        <button
          onClick={() => navigate('/laboratory/wallet/withdraw')}
          className="group relative overflow-hidden rounded-2xl border border-amber-100/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] hover:border-amber-200"
        >
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <IoArrowUpOutline className="h-5 w-5 text-amber-600" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Total Withdrawals</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockWalletData.totalWithdrawals)}</p>
            <p className="mt-1 text-[10px] text-slate-500">All time withdrawals</p>
          </div>
        </button>

        {/* Transaction Card */}
        <button
          onClick={() => navigate('/laboratory/wallet/transaction')}
          className="group relative overflow-hidden rounded-2xl border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-white to-[rgba(17,73,108,0.05)] p-5 shadow-sm hover:shadow-lg transition-all active:scale-[0.98] hover:border-[rgba(17,73,108,0.3)] col-span-2"
        >
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-[rgba(17,73,108,0.1)] blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.15)]">
                <IoReceiptOutline className="h-5 w-5 text-[#11496c]" />
              </div>
              <IoArrowForwardOutline className="h-4 w-4 text-[#11496c] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#11496c] mb-1">Total Transactions</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{mockWalletData.totalTransactions}</p>
            <p className="mt-1 text-[10px] text-slate-500">All time transactions</p>
          </div>
        </button>
      </div>
    </section>
  )
}

export default LaboratoryWallet

