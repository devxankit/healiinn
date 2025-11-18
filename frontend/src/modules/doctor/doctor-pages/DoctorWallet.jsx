import { useNavigate, useLocation } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5'

// Mock data
const mockWalletData = {
  totalBalance: 15750.50,
  availableBalance: 12400.25,
  pendingBalance: 3350.25,
  thisMonthEarnings: 8250.00,
  lastMonthEarnings: 6890.50,
  totalEarnings: 156420.75,
  totalWithdrawals: 140670.25,
  totalTransactions: 124,
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const DoctorWallet = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
          {/* Header */}
          <div className="mb-3 sm:mb-6">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Wallet</h1>
          </div>

          {/* 4 Main Cards Grid */}
          <div className="grid grid-cols-1 gap-2.5 sm:gap-4 sm:grid-cols-2">
            {/* Balance Card */}
            <button
              onClick={() => navigate('/doctor/wallet/balance')}
              className="group relative overflow-hidden rounded-xl sm:rounded-3xl border-2 p-3 sm:p-6 text-left text-white shadow-xl transition-all active:scale-95 hover:shadow-2xl"
              style={{ 
                borderColor: 'rgba(17, 73, 108, 0.2)',
                background: 'linear-gradient(to bottom right, #11496c, #11496c)',
                boxShadow: '0 20px 25px -5px rgba(17, 73, 108, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(17, 73, 108, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(17, 73, 108, 0.3)'
              }}
            >
              <div className="absolute -right-8 sm:-right-20 -top-8 sm:-top-20 h-16 w-16 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
              <div className="absolute -left-6 sm:-left-16 bottom-0 h-12 w-12 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
              <div className="relative">
                <div className="mb-2 sm:mb-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-white/90">Balance</p>
                    <p className="mt-0.5 sm:mt-2 text-lg sm:text-3xl font-bold truncate">{formatCurrency(mockWalletData.totalBalance)}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                    <IoWalletOutline className="h-4 w-4 sm:h-7 sm:w-7" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Earning Card */}
            <button
              onClick={() => navigate('/doctor/wallet/earning')}
              className="group relative overflow-hidden rounded-xl sm:rounded-3xl border-2 border-emerald-100/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 p-3 sm:p-6 text-left text-white shadow-xl shadow-emerald-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-emerald-500/40"
            >
              <div className="absolute -right-8 sm:-right-20 -top-8 sm:-top-20 h-16 w-16 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
              <div className="absolute -left-6 sm:-left-16 bottom-0 h-12 w-12 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
              <div className="relative">
                <div className="mb-2 sm:mb-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-white/90">Earning</p>
                    <p className="mt-0.5 sm:mt-2 text-lg sm:text-3xl font-bold truncate">{formatCurrency(mockWalletData.totalEarnings)}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                    <IoArrowDownOutline className="h-4 w-4 sm:h-7 sm:w-7" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Withdraw Card */}
            <button
              onClick={() => navigate('/doctor/wallet/withdraw')}
              className="group relative overflow-hidden rounded-xl sm:rounded-3xl border-2 border-amber-100/60 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 p-3 sm:p-6 text-left text-white shadow-xl shadow-amber-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-amber-500/40"
            >
              <div className="absolute -right-8 sm:-right-20 -top-8 sm:-top-20 h-16 w-16 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
              <div className="absolute -left-6 sm:-left-16 bottom-0 h-12 w-12 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
              <div className="relative">
                <div className="mb-2 sm:mb-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-white/90">Withdraw</p>
                    <p className="mt-0.5 sm:mt-2 text-lg sm:text-3xl font-bold truncate">{formatCurrency(mockWalletData.totalWithdrawals)}</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                    <IoCashOutline className="h-4 w-4 sm:h-7 sm:w-7" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Transaction Card */}
            <button
              onClick={() => navigate('/doctor/wallet/transaction')}
              className="group relative overflow-hidden rounded-xl sm:rounded-3xl border-2 border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-3 sm:p-6 text-left text-white shadow-xl shadow-purple-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-purple-500/40"
            >
              <div className="absolute -right-8 sm:-right-20 -top-8 sm:-top-20 h-16 w-16 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-xl sm:blur-3xl" />
              <div className="absolute -left-6 sm:-left-16 bottom-0 h-12 w-12 sm:h-32 sm:w-32 rounded-full bg-white/5 blur-lg sm:blur-2xl" />
              <div className="relative">
                <div className="mb-2 sm:mb-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-sm font-medium text-white/90">Transaction</p>
                    <p className="mt-0.5 sm:mt-2 text-lg sm:text-3xl font-bold">{mockWalletData.totalTransactions}</p>
                    <p className="mt-0.5 text-[9px] sm:text-xs text-white/70">Total Transactions</p>
                  </div>
                  <div className="flex h-8 w-8 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg sm:rounded-2xl bg-white/20 backdrop-blur ml-2">
                    <IoReceiptOutline className="h-4 w-4 sm:h-7 sm:w-7" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-4 flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </div>
      </section>
    </>
  )
}

export default DoctorWallet
