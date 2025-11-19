import { useNavigate } from 'react-router-dom'
import {
  IoBagHandleOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoCalendarOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoArrowForwardOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
} from 'react-icons/io5'
import { usePharmacySidebar } from '../pharmacy-components/PharmacySidebarContext'

const mockStats = {
  totalOrders: 24,
  activePatients: 156,
  pendingPrescriptions: 12,
  notifications: 5,
  thisMonthEarnings: 12500.00,
  lastMonthEarnings: 10800.50,
  thisMonthOrders: 24,
  lastMonthOrders: 20,
}

const todayOrders = [
  {
    id: 'order-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    time: '09:00 AM',
    status: 'pending',
    totalAmount: 42.5,
    deliveryType: 'home',
    prescriptionId: 'prx-3021',
  },
  {
    id: 'order-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    time: '10:30 AM',
    status: 'ready',
    totalAmount: 34.0,
    deliveryType: 'pickup',
    prescriptionId: 'prx-3022',
  },
  {
    id: 'order-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    time: '02:00 PM',
    status: 'pending',
    totalAmount: 196.0,
    deliveryType: 'home',
    prescriptionId: 'prx-3023',
  },
  {
    id: 'order-4',
    patientName: 'Emily Brown',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=128&bold=true',
    time: '03:30 PM',
    status: 'ready',
    totalAmount: 125.5,
    deliveryType: 'pickup',
    prescriptionId: 'prx-3024',
  },
]

const recentOrders = [
  {
    id: 'order-1',
    patientName: 'David Wilson',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=6366f1&color=fff&size=128&bold=true',
    date: '2025-01-15',
    time: '10:00 AM',
    status: 'delivered',
    totalAmount: 89.5,
    prescriptionId: 'prx-3025',
    deliveryType: 'home',
  },
  {
    id: 'order-2',
    patientName: 'Lisa Anderson',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=8b5cf6&color=fff&size=128&bold=true',
    date: '2025-01-14',
    time: '02:30 PM',
    status: 'delivered',
    totalAmount: 156.0,
    prescriptionId: 'prx-3026',
    deliveryType: 'home',
  },
  {
    id: 'order-3',
    patientName: 'Robert Taylor',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=ef4444&color=fff&size=128&bold=true',
    date: '2025-01-14',
    time: '11:00 AM',
    status: 'delivered',
    totalAmount: 78.25,
    prescriptionId: 'prx-3027',
    deliveryType: 'pickup',
  },
  {
    id: 'order-4',
    patientName: 'Jennifer Martinez',
    patientImage: 'https://ui-avatars.com/api/?name=Jennifer+Martinez&background=14b8a6&color=fff&size=128&bold=true',
    date: '2025-01-13',
    time: '09:30 AM',
    status: 'cancelled',
    totalAmount: 145.0,
    prescriptionId: 'prx-3028',
    deliveryType: 'home',
  },
]

const recentPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    lastOrderDate: '2025-01-15',
    totalOrders: 12,
    status: 'active',
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    lastOrderDate: '2025-01-14',
    totalOrders: 8,
    status: 'active',
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    lastOrderDate: '2025-01-12',
    totalOrders: 15,
    status: 'active',
  },
]

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

  const earningsChange = ((mockStats.thisMonthEarnings - mockStats.lastMonthEarnings) / mockStats.lastMonthEarnings) * 100
  const ordersChange = ((mockStats.thisMonthOrders - mockStats.lastMonthOrders) / mockStats.lastMonthOrders) * 100

  return (
    <section className="flex flex-col gap-4 pb-24 -mt-20">
      {/* Top Header with Gradient Background */}
      <header 
        className="relative text-white -mx-4 mb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
        }}
      >
        <div className="px-4 pt-5 pb-4">
          {/* Top Section - Pharmacy Info */}
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                Rx Care Pharmacy
              </h1>
              <p className="text-sm font-normal text-white/95 leading-tight">
                Market Street • <span className="text-white font-medium">Online</span>
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="Menu"
              >
                <IoMenuOutline className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
            </div>
          </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        {/* Total Orders */}
        <article
          onClick={() => navigate('/pharmacy/orders')}
          className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 leading-tight mb-1">Total Orders</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalOrders}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <IoBagHandleOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">This month</p>
        </article>

        {/* Active Patients */}
        <article
          onClick={() => navigate('/pharmacy/patients')}
          className="relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1">Active Patients</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.activePatients}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
              <IoPeopleOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Currently active</p>
        </article>

        {/* Prescriptions */}
        <article
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1">Prescriptions</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.pendingPrescriptions}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <IoDocumentTextOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">Pending review</p>
        </article>

        {/* Notifications */}
        <article className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Notifications</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.notifications}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
              <IoNotificationsOutline className="text-base" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[10px] text-slate-600 leading-tight">New alerts</p>
        </article>
      </div>

      {/* Today's Orders */}
      <section aria-labelledby="orders-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="orders-title" className="text-base font-semibold text-slate-900">
              Today's Orders
            </h2>
            <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)] px-2 text-xs font-medium text-[#11496c]">
              {todayOrders.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pharmacy/orders')}
            className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>

        <div className="space-y-3">
          {todayOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={order.patientImage}
                      alt={order.patientName}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    {order.status === 'ready' && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{order.patientName}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">Prescription: {order.prescriptionId}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{order.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoLocationOutline className="h-3.5 w-3.5" />
                        <span>{order.deliveryType === 'home' ? 'Home Delivery' : 'Pickup'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-emerald-600">
                        <IoWalletOutline className="h-3.5 w-3.5" />
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Recent Orders & Recent Patients Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <section aria-labelledby="recent-orders-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="recent-orders-title" className="text-base font-semibold text-slate-900">
              Recent Orders
            </h2>
            <button
              type="button"
              onClick={() => navigate('/pharmacy/orders')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3">
            {recentOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={order.patientImage}
                      alt={order.patientName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900">{order.patientName}</h3>
                          <p className="mt-0.5 text-xs text-slate-600">Prescription: {order.prescriptionId}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5" />
                          <span>{formatDate(order.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5" />
                          <span>{order.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoLocationOutline className="h-3.5 w-3.5" />
                          <span>{order.deliveryType === 'home' ? 'Home' : 'Pickup'}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-emerald-600">
                          <IoWalletOutline className="h-3.5 w-3.5" />
                          <span>{formatCurrency(order.totalAmount)}</span>
                        </div>
            </div>
            </div>
          </div>
        </article>
              )
            })}
          </div>
        </section>

        {/* Recent Patients */}
        <section aria-labelledby="patients-title" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 id="patients-title" className="text-base font-semibold text-slate-900">
              Recent Patients
            </h2>
            <button
              type="button"
              onClick={() => navigate('/pharmacy/patients')}
              className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
            >
              See all
            </button>
          </header>

          <div className="space-y-3">
            {recentPatients.map((patient) => (
        <article
                key={patient.id}
                onClick={() => navigate(`/pharmacy/patients/${patient.id}`)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={patient.image}
                    alt={patient.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{patient.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">Last order: {formatDate(patient.lastOrderDate)}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        {patient.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <IoBagHandleOutline className="h-3.5 w-3.5" />
                        <span>{patient.totalOrders} orders</span>
                      </div>
                    </div>
                  </div>
                  <IoArrowForwardOutline className="h-5 w-5 shrink-0 text-slate-400" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Earnings Overview */}
      <section aria-labelledby="earnings-title">
        <header className="mb-3 flex items-center justify-between">
          <h2 id="earnings-title" className="text-base font-semibold text-slate-900">
            Earnings Overview
          </h2>
          <button
            type="button"
            onClick={() => navigate('/pharmacy/wallet')}
            className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
          >
            View details
          </button>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(mockStats.thisMonthEarnings)}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {earningsChange >= 0 ? (
                    <>
                      <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">+{earningsChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{earningsChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-slate-500">vs last month</span>
                </div>
            </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <IoWalletOutline className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month Orders</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{mockStats.thisMonthOrders}</p>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {ordersChange >= 0 ? (
                    <>
                      <IoTrendingUpOutline className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">+{ordersChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <IoTrendingDownOutline className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">{ordersChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-slate-500">vs last month</span>
                </div>
            </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.15)]">
                <IoBagHandleOutline className="h-6 w-6 text-[#11496c]" />
            </div>
          </div>
        </article>
      </div>
      </section>
    </section>
  )
}

export default PharmacyDashboard




