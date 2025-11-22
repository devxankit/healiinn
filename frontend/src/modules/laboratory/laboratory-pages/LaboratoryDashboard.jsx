import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LaboratoryNavbar from '../laboratory-components/LaboratoryNavbar'
import LaboratorySidebar from '../laboratory-components/LaboratorySidebar'
import {
  IoBagHandleOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoCalendarOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoPersonCircleOutline,
  IoWalletOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoArrowForwardOutline,
  IoFlaskOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoChatbubbleOutline,
  IoCloudUploadOutline,
  IoPaperPlaneOutline,
  IoCloseOutline,
  IoMailOutline,
  IoListOutline,
  IoStatsChartOutline,
} from 'react-icons/io5'

const mockStats = {
  totalOrders: 18,
  activePatients: 124,
  totalPatients: 180,
  inactivePatients: 56,
  testReports: 45,
  notifications: 7,
  recentOrders: 3,
  requestResponses: 2,
  thisMonthEarnings: 18500.00,
  lastMonthEarnings: 16200.50,
  thisMonthOrders: 18,
  lastMonthOrders: 15,
}

const todayOrders = [
  {
    id: 'order-1',
    patientName: 'John Doe',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    time: '09:00 AM',
    status: 'pending',
    totalAmount: 700.0,
    deliveryType: 'home',
    testRequestId: 'test-3021',
    tests: ['Complete Blood Count (CBC)', 'Blood Glucose (Fasting)'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    patientName: 'Sarah Smith',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    time: '10:30 AM',
    status: 'ready',
    totalAmount: 600.0,
    deliveryType: 'pickup',
    testRequestId: 'test-3022',
    tests: ['Lipid Profile'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-3',
    patientName: 'Mike Johnson',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    time: '02:00 PM',
    status: 'pending',
    totalAmount: 1550.0,
    deliveryType: 'home',
    testRequestId: 'test-3023',
    tests: ['Liver Function Test (LFT)', 'Kidney Function Test (KFT)'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-4',
    patientName: 'Emily Brown',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=128&bold=true',
    time: '03:30 PM',
    status: 'ready',
    totalAmount: 450.0,
    deliveryType: 'pickup',
    testRequestId: 'test-3024',
    tests: ['Thyroid Function Test'],
    createdAt: new Date().toISOString(),
  },
]

const recentOrders = [
  {
    id: 'order-1',
    patientName: 'David Wilson',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=6366f1&color=fff&size=128&bold=true',
    date: '2025-01-15',
    time: '10:00 AM',
    status: 'completed',
    totalAmount: 850.0,
    testRequestId: 'test-3025',
    deliveryType: 'home',
  },
  {
    id: 'order-2',
    patientName: 'Lisa Anderson',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=8b5cf6&color=fff&size=128&bold=true',
    date: '2025-01-14',
    time: '02:30 PM',
    status: 'completed',
    totalAmount: 1200.0,
    testRequestId: 'test-3026',
    deliveryType: 'home',
  },
  {
    id: 'order-3',
    patientName: 'Robert Taylor',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=ef4444&color=fff&size=128&bold=true',
    date: '2025-01-14',
    time: '11:00 AM',
    status: 'completed',
    totalAmount: 950.0,
    testRequestId: 'test-3027',
    deliveryType: 'pickup',
  },
  {
    id: 'order-4',
    patientName: 'Jennifer Martinez',
    patientImage: 'https://ui-avatars.com/api/?name=Jennifer+Martinez&background=14b8a6&color=fff&size=128&bold=true',
    date: '2025-01-13',
    time: '09:30 AM',
    status: 'pending',
    totalAmount: 650.0,
    testRequestId: 'test-3028',
    deliveryType: 'home',
  },
]

const recentPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=128&bold=true',
    lastTestDate: '2025-01-15',
    totalTests: 8,
    status: 'active',
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=128&bold=true',
    lastTestDate: '2025-01-14',
    totalTests: 5,
    status: 'active',
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=128&bold=true',
    lastTestDate: '2025-01-12',
    totalTests: 12,
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
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'ready':
    case 'completed':
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
    case 'completed':
      return IoCheckmarkCircleOutline
    case 'cancelled':
      return IoCloseCircleOutline
    default:
      return IoTimeOutline
  }
}

const LaboratoryDashboard = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0)

  // Mock patients list
  const mockPatients = [
    { id: 'pat-1', name: 'John Doe', email: 'john.doe@example.com' },
    { id: 'pat-2', name: 'Sarah Smith', email: 'sarah.smith@example.com' },
    { id: 'pat-3', name: 'Mike Johnson', email: 'mike.johnson@example.com' },
    { id: 'pat-4', name: 'Emily Brown', email: 'emily.brown@example.com' },
  ]

  const earningsChange = ((mockStats.thisMonthEarnings - mockStats.lastMonthEarnings) / mockStats.lastMonthEarnings) * 100
  const ordersChange = ((mockStats.thisMonthOrders - mockStats.lastMonthOrders) / mockStats.lastMonthOrders) * 100

  const sidebarNavItems = [
    { id: 'home', label: 'Home', to: '/laboratory/dashboard', Icon: IoHomeOutline },
    { id: 'orders', label: 'Orders', to: '/laboratory/orders', Icon: IoBagHandleOutline },
    { id: 'patients', label: 'Patients', to: '/laboratory/patients', Icon: IoPeopleOutline },
    { id: 'wallet', label: 'Wallet', to: '/laboratory/wallet', Icon: IoWalletOutline },
    { id: 'profile', label: 'Profile', to: '/laboratory/profile', Icon: IoPersonCircleOutline },
  ]

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    handleSidebarClose()
    localStorage.removeItem('laboratoryAuthToken')
    sessionStorage.removeItem('laboratoryAuthToken')
    navigate('/doctor/login', { replace: true })
  }

  const handleTestReportsClick = (e) => {
    e.stopPropagation()
    navigate('/laboratory/test-reports')
  }


  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleSendToPatient = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }

    const patient = mockPatients.find(p => p.id === selectedPatient)
    if (!patient) {
      alert('Patient not found')
      return
    }

    if (!window.confirm(`Send prescription PDF to ${patient.name}?`)) {
      return
    }

    setIsSending(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 150)

      // Simulate API call to send PDF
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      
      // Add to uploaded files list
      const newFile = {
        id: `file-${Date.now()}`,
        name: selectedFile.name,
        patientId: selectedPatient,
        patientName: patient.name,
        patientEmail: patient.email,
        uploadedDate: new Date().toISOString(),
        sentDate: new Date().toISOString(),
        status: 'sent',
        fileSize: selectedFile.size,
      }
      setUploadedFiles([newFile, ...uploadedFiles])
      
      // Reset after success
      setTimeout(() => {
        setShowUploadModal(false)
        setSelectedFile(null)
        setSelectedPatient('')
        setUploadStatus(null)
        setUploadProgress(0)
      }, 1500)
    } catch (error) {
      setUploadStatus('error')
      setUploadProgress(0)
      alert('Failed to send PDF. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseModal = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setSelectedPatient('')
    setShowHistory(false)
    setUploadStatus(null)
    setUploadProgress(0)
  }


  return (
    <>
      <LaboratoryNavbar />
      <LaboratorySidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={sidebarNavItems}
        onLogout={handleLogout}
      />
      <section className="flex flex-col gap-4 pb-24 -mt-20">
        {/* Top Header with Gradient Background */}
        <header 
          className="relative text-white -mx-4 mb-4 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)'
          }}
        >
          <div className="px-4 pt-5 pb-4">
            {/* Top Section - Laboratory Info */}
            <div className="flex items-start justify-between mb-3.5">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-0.5">
                  MediLab Diagnostics
                </h1>
                <p className="text-sm font-normal text-white/95 leading-tight">
                  Medical Street • <span className="text-white font-medium">Online</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Notification Icon */}
                <button
                  type="button"
                  className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label="Notifications"
                >
                  <IoNotificationsOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleSidebarToggle}
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
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Total Orders */}
          <article
            onClick={() => navigate('/laboratory/orders')}
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

          {/* Total Patients */}
          <article
            onClick={() => navigate('/laboratory/patient-statistics')}
            className="relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#11496c] leading-tight mb-1">Total Patients</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.totalPatients}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
                <IoPeopleOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">All patients</p>
          </article>

          {/* Test Reports */}
          <article
            onClick={handleTestReportsClick}
            className="relative overflow-hidden rounded-xl border border-orange-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-orange-700 leading-tight mb-1">Test Reports</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.testReports}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                <IoDocumentTextOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Pending review</p>
          </article>

          {/* Requests */}
          <article
            onClick={() => navigate('/laboratory/patients')}
            className="relative overflow-hidden rounded-xl border border-purple-100 bg-white p-3 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-700 leading-tight mb-1">Requests</p>
                <p className="text-xl font-bold text-slate-900 leading-none">{mockStats.requestResponses}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
                <IoChatbubbleOutline className="text-base" aria-hidden="true" />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">Responses</p>
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
              onClick={() => navigate('/laboratory/orders')}
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
                          <p className="mt-0.5 text-xs text-slate-600">Test Request: {order.testRequestId}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {order.tests.slice(0, 2).map((test, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                <IoFlaskOutline className="h-2.5 w-2.5" />
                                {test}
                              </span>
                            ))}
                            {order.tests.length > 2 && (
                              <span className="text-[10px] text-slate-500">+{order.tests.length - 2} more</span>
                            )}
                          </div>
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
                onClick={() => navigate('/laboratory/orders')}
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
                            <p className="mt-0.5 text-xs text-slate-600">Test Request: {order.testRequestId}</p>
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
                onClick={() => navigate('/laboratory/patients')}
                className="text-sm font-medium text-[#11496c] hover:text-[#11496c] focus-visible:outline-none focus-visible:underline"
              >
                See all
              </button>
            </header>

            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <article
                  key={patient.id}
                  onClick={() => navigate(`/laboratory/patients`)}
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
                          <p className="mt-0.5 text-xs text-slate-600">Last test: {formatDate(patient.lastTestDate)}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          {patient.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoFlaskOutline className="h-3.5 w-3.5" />
                          <span>{patient.totalTests} tests</span>
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
              onClick={() => navigate('/laboratory/wallet')}
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

      {/* Upload PDF Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Theme Color */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoCloudUploadOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Upload Prescription PDF</h2>
                    <p className="text-xs text-white/80">Select PDF from your system</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status Bar */}
            {uploadStatus && (
              <div className="px-4 sm:px-6 pt-4">
                <div className={`rounded-xl p-3 ${
                  uploadStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-700">Uploading...</span>
                        <span className="text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">PDF sent successfully!</span>
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2">
                      <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Failed to send PDF</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-5">
              {/* Tabs - Upload/History */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setShowHistory(false)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                    !showHistory 
                      ? 'border-[#11496c] text-[#11496c]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 relative ${
                    showHistory 
                      ? 'border-[#11496c] text-[#11496c]' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  History
                  {uploadedFiles.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                      {uploadedFiles.length}
                    </span>
                  )}
                </button>
              </div>

              {!showHistory ? (
                <>
                  {/* File Upload Section - Theme Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select PDF File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <label
                        htmlFor="pdf-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[rgba(17,73,108,0.3)] rounded-xl bg-[rgba(17,73,108,0.05)] cursor-pointer transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.1)]"
                      >
                        {selectedFile ? (
                          <>
                            <IoDocumentTextOutline className="h-8 w-8 text-[#11496c] mb-2" />
                            <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                          </>
                        ) : (
                          <>
                            <IoCloudUploadOutline className="h-8 w-8 text-[#11496c] mb-2" />
                            <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                            <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                          </>
                        )}
                      </label>
                    </div>
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    )}
                  </div>

                  {/* Patient Selection - Theme Color */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Select Patient</label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                    >
                      <option value="">Choose a patient...</option>
                      {mockPatients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* History Section */
                <div>
                  {uploadedFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <IoDocumentTextOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-500">No upload history</p>
                      <p className="text-xs text-slate-400 mt-1">Uploaded files will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:shadow-md transition-all">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52]">
                            <IoDocumentTextOutline className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Patient:</span> {file.patientName}
                              </p>
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Email:</span> {file.patientEmail}
                              </p>
                              <p className="text-xs text-slate-500">
                                Sent on {new Date(file.sentDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {file.fileSize && (
                                <p className="text-xs text-slate-500">
                                  Size: {(file.fileSize / 1024).toFixed(2)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                              <IoCheckmarkCircleOutline className="h-3 w-3" />
                              Sent
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons - Theme Color */}
              {!showHistory && (
                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendToPatient}
                    disabled={!selectedFile || !selectedPatient || isSending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(17,73,108,0.3)] transition-all hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <IoTimeOutline className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IoPaperPlaneOutline className="h-4 w-4" />
                        Send to Patient
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default LaboratoryDashboard

