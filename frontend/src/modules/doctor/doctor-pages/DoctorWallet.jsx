import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoWalletOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'
import { getDoctorWalletBalance } from '../doctor-services/doctorService'
import { useToast } from '../../../contexts/ToastContext'

// Default wallet data (will be replaced by API data)
const defaultWalletData = {
  totalBalance: 0,
  availableBalance: 0,
  pendingBalance: 0,
  thisMonthEarnings: 0,
  lastMonthEarnings: 0,
  totalEarnings: 0,
  totalWithdrawals: 0,
  totalTransactions: 0,
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
  const toast = useToast()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  const [walletData, setWalletData] = useState(defaultWalletData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch wallet data from API
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getDoctorWalletBalance()
        
        console.log('🔍 Full wallet API response:', response) // Debug log
        
        if (response && response.success && response.data) {
          const data = response.data
          console.log('✅ Doctor wallet data received:', data) // Debug log
          
          const walletDataUpdate = {
            totalBalance: Number(data.totalBalance || data.balance || 0),
            availableBalance: Number(data.availableBalance || data.available || 0),
            pendingBalance: Number(data.pendingBalance || data.pending || data.pendingWithdrawals || 0),
            thisMonthEarnings: Number(data.thisMonthEarnings || 0),
            lastMonthEarnings: Number(data.lastMonthEarnings || 0),
            totalEarnings: Number(data.totalEarnings || 0),
            totalWithdrawals: Number(data.totalWithdrawals || 0),
            totalTransactions: Number(data.totalTransactions || 0),
          }
          
          console.log('💰 Setting wallet data:', walletDataUpdate) // Debug log
          setWalletData(walletDataUpdate)
        } else {
          console.error('❌ Wallet API response error:', response) // Debug log
          console.error('Response structure:', {
            hasResponse: !!response,
            hasSuccess: response?.success,
            hasData: !!response?.data,
            fullResponse: response,
          })
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err)
        setError(err.message || 'Failed to load wallet data')
        toast.error('Failed to load wallet data')
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
    
    // Listen for appointment booking event to refresh wallet
    const handleAppointmentBooked = () => {
      fetchWalletData()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast])

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-6 pb-24 px-4 ${isDashboardPage ? '-mt-20' : 'pt-4'}`}>
          {/* Header Section */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wallet</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Earnings & Payouts</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 border border-emerald-100 shadow-sm">
              <IoShieldCheckmarkOutline className="h-5 w-5 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hidden sm:inline">Secure Payouts</span>
            </div>
          </div>

          {/* Main Balance Card - Hero Section */}
          <div className="relative overflow-hidden rounded-[40px] p-8 text-white shadow-2xl shadow-[#11496c]/20"
            style={{ background: 'linear-gradient(135deg, #11496c 0%, #0d3a52 60%, #14B8A6 100%)' }}>
            {/* Mesh Gradient Effect */}
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-3">Current Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{loading ? '—' : formatCurrency(walletData.totalBalance)}</span>
                </div>
                
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Available: {loading ? '—' : formatCurrency(walletData.availableBalance)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/20">
                    <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pending: {loading ? '—' : formatCurrency(walletData.pendingBalance)}</span>
                  </div>
                </div>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl self-start sm:self-center">
                <IoWalletOutline className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/doctor/wallet/earning')}
              className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left transition-all hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 transition-transform group-hover:scale-110">
                <IoArrowDownOutline className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
              <p className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{loading ? '—' : formatCurrency(walletData.totalEarnings)}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">All time</span>
                <IoArrowForwardOutline className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => navigate('/doctor/wallet/withdraw')}
              className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left transition-all hover:shadow-xl hover:shadow-amber-500/5 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 transition-transform group-hover:scale-110">
                <IoCashOutline className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Withdrawals</p>
              <p className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{loading ? '—' : formatCurrency(walletData.totalWithdrawals)}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">All time</span>
                <IoArrowForwardOutline className="h-3.5 w-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </button>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/doctor/wallet/balance')}
              className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-[#11496c] transition-colors group-hover:bg-[#11496c] group-hover:text-white shadow-sm">
                    <IoWalletOutline className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Balance Details</p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">View breakdown by category</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#11496c]/10 transition-colors">
                  <IoArrowForwardOutline className="h-5 w-5 text-slate-300 group-hover:text-[#11496c] transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/doctor/wallet/transaction')}
              className="group relative overflow-hidden rounded-[32px] border border-slate-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white shadow-sm">
                    <IoReceiptOutline className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Transactions</p>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{loading ? '—' : walletData.totalTransactions} total entries</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-purple-600/10 transition-colors">
                  <IoArrowForwardOutline className="h-5 w-5 text-slate-300 group-hover:text-purple-600 transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>
          </div>
      </section>
    </>
  )
}

export default DoctorWallet

