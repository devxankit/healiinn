import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoBagHandleOutline,
  IoCalendarOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoWalletOutline,
  IoMedicalOutline,
  IoListOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { usePharmacySidebar } from '../pharmacy-components/PharmacySidebarContext'
import { getPharmacyDashboard, getPharmacyOrders, getPharmacyRequestOrders, getPharmacyMedicines, getPharmacyPatients, getPharmacyProfile, getPharmacyWalletBalance } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import NotificationBell from '../../../components/NotificationBell'

// Default stats (will be replaced by API data)
const defaultStats = {
  totalOrders: 0,
  activePatients: 0,
  inactivePatients: 0,
  pendingPrescriptions: 0,
  walletBalance: 0,
}

// Mock data removed - using API data now

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
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'ready':
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'ready':
    case 'delivered':
      return IoCheckmarkCircleOutline
    case 'cancelled':
      return IoCloseCircleOutline
    default:
      return IoTimeOutline
  }
}

const PharmacyDashboard = () => {
  const navigate = useNavigate()
  const { toggleSidebar } = usePharmacySidebar()
  const toast = useToast()
  const [availableMedicinesCount, setAvailableMedicinesCount] = useState(0)
  const [todayOrders, setTodayOrders] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [requestOrdersCount, setRequestOrdersCount] = useState(0)
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(false) // Start with false to show content immediately
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  // Fetch profile, dashboard, and wallet data in parallel for faster loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch profile, dashboard, and wallet in parallel
        const [profileResponse, dashboardResponse, walletResponse] = await Promise.allSettled([
          getPharmacyProfile().catch(() => ({ success: false })),
          getPharmacyDashboard(),
          getPharmacyWalletBalance().catch(() => ({ success: false, data: null })) // Don't fail if wallet fails
        ])

        // Handle profile response (non-critical, don't block UI)
        if (profileResponse.status === 'fulfilled' && profileResponse.value.success && profileResponse.value.data) {
          const pharmacy = profileResponse.value.data.pharmacy || profileResponse.value.data
          setProfile({
            name: pharmacy.pharmacyName || pharmacy.name || '',
            address: pharmacy.address || {},
            isActive: pharmacy.isActive !== undefined ? pharmacy.isActive : true,
          })
        }
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const data = dashboardResponse.data
          const walletBalance = walletResponse.success && walletResponse.data 
            ? (walletResponse.data.availableBalance || walletResponse.data.balance || 0)
            : 0
          
          setStats({
            totalOrders: data.totalOrders || 0,
            activePatients: data.activePatients || 0,
            inactivePatients: data.inactivePatients || 0,
            pendingPrescriptions: data.pendingPrescriptions || 0,
            walletBalance: walletBalance,
          })
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Fetch today's orders, medicines count, and request orders count
  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        // Fetch today's orders - filter by today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)
        
        const ordersResponse = await getPharmacyOrders({ limit: 100 })
        if (ordersResponse.success && ordersResponse.data) {
          const ordersData = Array.isArray(ordersResponse.data) 
            ? ordersResponse.data 
            : ordersResponse.data.orders || ordersResponse.data.items || []
          
          // Filter orders created today
          const todayOrdersFiltered = ordersData.filter(order => {
            if (!order.createdAt) return false
            const orderDate = new Date(order.createdAt)
            return orderDate >= today && orderDate <= todayEnd
          })
          
          const transformed = todayOrdersFiltered.map(order => ({
            id: order._id || order.id,
            patientName: order.patientId?.firstName && order.patientId?.lastName
              ? `${order.patientId.firstName} ${order.patientId.lastName}`
              : order.patientId?.name || order.patientName || 'Unknown Patient',
            patientImage: order.patientId?.profileImage || order.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientId?.firstName || order.patientName || 'Patient')}&background=3b82f6&color=fff&size=128`,
            time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            date: order.createdAt ? new Date(order.createdAt) : new Date(),
            status: order.status || 'pending',
            totalAmount: Number(order.totalAmount ?? order.amount ?? 0),
            deliveryType: order.deliveryType || order.deliveryOption || 'home',
            prescriptionId: order.prescriptionId?._id || order.prescriptionId || '',
          }))
          setTodayOrders(transformed)
        }

        // Fetch recent patients (last 5 patients)
        const patientsResponse = await getPharmacyPatients({ limit: 5 })
        console.log('Pharmacy Patients Response:', patientsResponse)
        if (patientsResponse?.success && patientsResponse.data) {
          const patientsData = Array.isArray(patientsResponse.data.items) 
            ? patientsResponse.data.items 
            : Array.isArray(patientsResponse.data.patients)
            ? patientsResponse.data.patients
            : Array.isArray(patientsResponse.data)
            ? patientsResponse.data
            : []
          
          console.log('Pharmacy Patients Data:', patientsData)
          
          const transformed = patientsData.map(patient => ({
            id: patient._id || patient.id,
            name: patient.firstName && patient.lastName
              ? `${patient.firstName} ${patient.lastName}`
              : patient.name || 'Unknown Patient',
            image: patient.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'Patient')}&background=3b82f6&color=fff&size=128`,
            totalOrders: Number(patient.totalOrders ?? 0),
            lastOrderDate: patient.lastOrderDate || patient.lastOrder || null,
            status: patient.status || 'active',
          }))
          
          console.log('Pharmacy Transformed Patients:', transformed)
          setRecentPatients(transformed)
        }

        // Fetch medicines count
        const medicinesResponse = await getPharmacyMedicines({ limit: 1 })
        if (medicinesResponse.success && medicinesResponse.data) {
          // Backend returns total in data.pagination.total
          const totalCount = medicinesResponse.data.pagination?.total || 
                            medicinesResponse.data.total || 
                            (medicinesResponse.data.items?.length || 0)
          setAvailableMedicinesCount(totalCount)
        }

        // Fetch request orders count (all visible requests, not just pending)
        const requestsResponse = await getPharmacyRequestOrders({ limit: 1 })
        if (requestsResponse.success && requestsResponse.data) {
          const totalCount = requestsResponse.data.pagination?.total || 
                            requestsResponse.data.total || 
                            (requestsResponse.data.items?.length || 0)
          console.log('Pharmacy Request Orders Count:', { totalCount, data: requestsResponse.data })
          setRequestOrdersCount(totalCount)
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err)
        // Don't show error toast as these are not critical
      }
    }

    fetchDashboardDetails()
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardDetails, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="flex flex-col gap-6 pb-24 -mt-20">
      {/* Professional Header - Cover Style */}
      <header className="relative -mx-4 sm:-mx-6 mb-2 overflow-hidden bg-slate-50">
        {/* Cover Background */}
        <div 
          className="h-28 sm:h-36 w-full relative"
          style={{
            background: 'linear-gradient(135deg, #11496c 0%, #1a5f7a 50%, #14B8A6 100%)'
          }}
        >
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
        </div>

        {/* Pharmacy Info Bar (Floating Overlap) */}
        <div className="px-4 sm:px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-[24px] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[#11496c] flex items-center justify-center text-white shadow-lg shadow-[#11496c]/20 shrink-0">
                 <IoMedicalOutline className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                  {profile?.name || 'Pharmacy'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight">
                    <IoLocationOutline className="h-3 w-3" />
                    {profile?.address?.city || profile?.address?.line1 || 'Location'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${profile?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {profile?.isActive ? 'Online Store' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-0 sm:px-2 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Total Orders Card */}
          <div 
            onClick={() => navigate('/pharmacy/orders')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoBagHandleOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Orders</p>
            <div className="flex items-baseline gap-1.5">
               <h3 className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : stats.totalOrders}</h3>
               <span className="text-[9px] font-bold text-emerald-600">+12%</span>
            </div>
            <p className="text-[9px] font-medium text-slate-400 mt-1.5 uppercase tracking-tighter">Monthly performance</p>
          </div>

          {/* Wallet Card */}
          <div 
            onClick={() => navigate('/pharmacy/wallet')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#11496c] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoWalletOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Wallet Balance</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{loading ? '...' : formatCurrency(stats.walletBalance || 0)}</h3>
            <p className="text-[9px] font-medium text-[#11496c] mt-1.5 uppercase tracking-tighter">Settlement pending</p>
          </div>

          {/* Available Medicines Card */}
          <div 
            onClick={() => navigate('/pharmacy/medicines')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoMedicalOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Inventory</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{availableMedicinesCount}</h3>
            <p className="text-[9px] font-medium text-purple-600 mt-1.5 uppercase tracking-tighter">SKUs in stock</p>
          </div>

          {/* Patient Requests Card */}
          <div 
            onClick={() => navigate('/pharmacy/request-orders')}
            className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <IoListOutline className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Requests</p>
            <h3 className="text-xl font-bold text-slate-900 leading-none">{requestOrdersCount}</h3>
            <p className="text-[9px] font-medium text-amber-600 mt-1.5 uppercase tracking-tighter">Needs attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Orders Section */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-0.5 rounded-full bg-[#11496c]"></div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Today's Orders</h2>
                <div className="bg-slate-100 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-500">
                  {todayOrders.length}
                </div>
              </div>
              <button 
                onClick={() => navigate('/pharmacy/orders')}
                className="text-[10px] font-bold text-[#11496c] uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {todayOrders.length === 0 ? (
                <div className="bg-white rounded-[24px] p-10 border-2 border-dashed border-slate-50 flex flex-col items-center text-center">
                  <IoBagHandleOutline className="h-8 w-8 text-slate-100 mb-2" />
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">No orders yet for today</p>
                </div>
              ) : (
                todayOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <div 
                      key={order.id}
                      className="bg-white rounded-[20px] p-4 border border-slate-50 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={order.patientImage} 
                            alt={order.patientName}
                            className="h-11 w-11 rounded-xl object-cover ring-2 ring-slate-50 group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">{order.patientName}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">#{order.id.slice(-6)}</span>
                              <span className="h-0.5 w-0.5 rounded-full bg-slate-300"></span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{order.time}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                             <p className="text-sm font-bold text-[#11496c] leading-none">{formatCurrency(order.totalAmount)}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${getStatusColor(order.status)}`}>
                             <StatusIcon className="h-3 w-3" />
                             {order.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent Patients Sidebar Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-0.5 rounded-full bg-teal-500"></div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Patients</h2>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-2 border border-slate-100 shadow-sm overflow-hidden">
              {recentPatients.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase">No active patients</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <img 
                          src={patient.image} 
                          alt={patient.name}
                          className="h-9 w-9 rounded-lg object-cover ring-2 ring-white shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-none">{patient.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                            {patient.totalOrders} {patient.totalOrders === 1 ? 'Order' : 'Orders'}
                          </p>
                        </div>
                      </div>
                      <div className={`h-1.5 w-1.5 rounded-full ${patient.status === 'active' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'}`}></div>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => navigate('/pharmacy/patients')}
                className="w-full py-3.5 text-center text-[10px] font-bold text-[#11496c] uppercase tracking-widest hover:bg-slate-50 transition-colors border-t border-slate-50"
              >
                Manage All
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PharmacyDashboard
















