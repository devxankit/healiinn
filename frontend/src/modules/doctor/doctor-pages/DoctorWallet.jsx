import { useNavigate } from 'react-router-dom'
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

  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          </div>

          {/* 4 Main Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Balance Card */}
            <button
              onClick={() => navigate('/doctor/wallet/balance')}
              className="group relative overflow-hidden rounded-3xl border-2 border-blue-100/60 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 p-6 text-left text-white shadow-xl shadow-blue-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-blue-500/40"
            >
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Balance</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(mockWalletData.totalBalance)}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <IoWalletOutline className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Earning Card */}
            <button
              onClick={() => navigate('/doctor/wallet/earning')}
              className="group relative overflow-hidden rounded-3xl border-2 border-emerald-100/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 p-6 text-left text-white shadow-xl shadow-emerald-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-emerald-500/40"
            >
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Earning</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(mockWalletData.totalEarnings)}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <IoArrowDownOutline className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Withdraw Card */}
            <button
              onClick={() => navigate('/doctor/wallet/withdraw')}
              className="group relative overflow-hidden rounded-3xl border-2 border-amber-100/60 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 p-6 text-left text-white shadow-xl shadow-amber-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-amber-500/40"
            >
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Withdraw</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(mockWalletData.totalWithdrawals)}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <IoCashOutline className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Transaction Card */}
            <button
              onClick={() => navigate('/doctor/wallet/transaction')}
              className="group relative overflow-hidden rounded-3xl border-2 border-purple-100/60 bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-6 text-left text-white shadow-xl shadow-purple-500/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-purple-500/40"
            >
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/90">Transaction</p>
                    <p className="mt-2 text-3xl font-bold">{mockWalletData.totalTransactions}</p>
                    <p className="mt-1 text-xs text-white/70">Total Transactions</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <IoReceiptOutline className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <span>View Details</span>
                  <IoArrowForwardOutline className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorWallet
