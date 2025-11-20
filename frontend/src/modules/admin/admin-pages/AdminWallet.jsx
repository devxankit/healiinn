import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoWalletOutline,
  IoPeopleOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoEyeOutline,
  IoCloseOutline,
} from 'react-icons/io5'

// Mock data - replace with API calls
const mockWalletOverview = {
  totalEarnings: 1250000,
  totalCommission: 125000,
  availableBalance: 980000,
  pendingWithdrawals: 270000,
  thisMonthEarnings: 125000,
  lastMonthEarnings: 108000,
  totalWithdrawals: 1125000,
  pendingWithdrawalRequests: 12,
  totalTransactions: 3420,
}

const mockProviders = {
  doctors: [
    {
      id: 'doc-1',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      totalEarnings: 125000,
      availableBalance: 98000,
      pendingBalance: 27000,
      totalWithdrawals: 112000,
      totalTransactions: 245,
      status: 'active',
    },
    {
      id: 'doc-2',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@example.com',
      totalEarnings: 98000,
      availableBalance: 75000,
      pendingBalance: 23000,
      totalWithdrawals: 85000,
      totalTransactions: 189,
      status: 'active',
    },
    {
      id: 'doc-3',
      name: 'Dr. Amit Patel',
      email: 'amit.patel@example.com',
      totalEarnings: 156000,
      availableBalance: 120000,
      pendingBalance: 36000,
      totalWithdrawals: 140000,
      totalTransactions: 312,
      status: 'active',
    },
  ],
  pharmacies: [
    {
      id: 'pharm-1',
      name: 'City Pharmacy',
      email: 'citypharmacy@example.com',
      totalEarnings: 85000,
      availableBalance: 65000,
      pendingBalance: 20000,
      totalWithdrawals: 70000,
      totalTransactions: 156,
      status: 'active',
    },
    {
      id: 'pharm-2',
      name: 'MediCare Pharmacy',
      email: 'medicare@example.com',
      totalEarnings: 92000,
      availableBalance: 72000,
      pendingBalance: 20000,
      totalWithdrawals: 80000,
      totalTransactions: 178,
      status: 'active',
    },
  ],
  laboratories: [
    {
      id: 'lab-1',
      name: 'Test Lab Services',
      email: 'testlab@example.com',
      totalEarnings: 68000,
      availableBalance: 52000,
      pendingBalance: 16000,
      totalWithdrawals: 60000,
      totalTransactions: 124,
      status: 'active',
    },
    {
      id: 'lab-2',
      name: 'Health Diagnostics',
      email: 'healthdiag@example.com',
      totalEarnings: 75000,
      availableBalance: 58000,
      pendingBalance: 17000,
      totalWithdrawals: 65000,
      totalTransactions: 142,
      status: 'active',
    },
  ],
}

const mockWithdrawals = [
  {
    id: 'wd-1',
    providerName: 'Dr. Rajesh Kumar',
    providerType: 'doctor',
    providerEmail: 'rajesh.kumar@example.com',
    amount: 25000,
    status: 'pending',
    requestedAt: '2025-01-15T10:30:00',
    payoutMethod: 'Bank Transfer',
    accountNumber: '****1234',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0001234',
    accountHolderName: 'Dr. Rajesh Kumar',
    availableBalance: 98000,
    totalEarnings: 125000,
    totalWithdrawals: 112000,
    transactionId: 'TXN-2025-001-001',
  },
  {
    id: 'wd-2',
    providerName: 'City Pharmacy',
    providerType: 'pharmacy',
    providerEmail: 'citypharmacy@example.com',
    amount: 15000,
    status: 'pending',
    requestedAt: '2025-01-15T09:15:00',
    payoutMethod: 'Bank Transfer',
    accountNumber: '****5678',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0005678',
    accountHolderName: 'City Pharmacy',
    availableBalance: 65000,
    totalEarnings: 85000,
    totalWithdrawals: 70000,
    transactionId: 'TXN-2025-001-002',
  },
  {
    id: 'wd-3',
    providerName: 'Test Lab Services',
    providerType: 'laboratory',
    providerEmail: 'testlab@example.com',
    amount: 12000,
    status: 'approved',
    requestedAt: '2025-01-14T14:20:00',
    payoutMethod: 'Bank Transfer',
    accountNumber: '****9012',
    bankName: 'ICICI Bank',
    ifscCode: 'ICIC0009012',
    accountHolderName: 'Test Lab Services',
    availableBalance: 52000,
    totalEarnings: 68000,
    totalWithdrawals: 60000,
    transactionId: 'TXN-2025-001-003',
    approvedAt: '2025-01-14T15:30:00',
    approvedBy: 'Admin User',
  },
]

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
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

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
          <IoTimeOutline className="h-3 w-3" />
          Pending
        </span>
      )
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          <IoCheckmarkCircleOutline className="h-3 w-3" />
          Approved
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
          <IoCloseCircleOutline className="h-3 w-3" />
          Rejected
        </span>
      )
    case 'paid':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
          <IoCheckmarkCircleOutline className="h-3 w-3" />
          Paid
        </span>
      )
    default:
      return null
  }
}

const getProviderIcon = (type) => {
  switch (type) {
    case 'doctor':
      return IoMedicalOutline
    case 'pharmacy':
      return IoBusinessOutline
    case 'laboratory':
      return IoFlaskOutline
    default:
      return IoPeopleOutline
  }
}

const AdminWallet = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedProviderType, setSelectedProviderType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingWithdrawal, setViewingWithdrawal] = useState(null)
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals)
  const [notification, setNotification] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const allProviders = [
    ...mockProviders.doctors.map(p => ({ ...p, type: 'doctor' })),
    ...mockProviders.pharmacies.map(p => ({ ...p, type: 'pharmacy' })),
    ...mockProviders.laboratories.map(p => ({ ...p, type: 'laboratory' })),
  ]

  const filteredProviders = allProviders.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedProviderType === 'all' || provider.type === selectedProviderType
    return matchesSearch && matchesType
  })

  const earningsByRole = {
    doctors: mockProviders.doctors.reduce((sum, p) => sum + p.totalEarnings, 0),
    pharmacies: mockProviders.pharmacies.reduce((sum, p) => sum + p.totalEarnings, 0),
    laboratories: mockProviders.laboratories.reduce((sum, p) => sum + p.totalEarnings, 0),
  }

  const handleApprove = async (withdrawalId) => {
    const withdrawal = withdrawals.find(w => w.id === withdrawalId)
    if (!withdrawal) return

    try {
      // Update withdrawal status
      const updatedWithdrawals = withdrawals.map(w => 
        w.id === withdrawalId 
          ? {
              ...w,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: 'Admin User', // In real app, get from auth context
            }
          : w
      )
      setWithdrawals(updatedWithdrawals)

      // Send notification/request to provider
      const notificationData = {
        providerId: withdrawal.providerEmail,
        providerType: withdrawal.providerType,
        providerName: withdrawal.providerName,
        withdrawalId: withdrawalId,
        amount: withdrawal.amount,
        message: `Your withdrawal request of ${formatCurrency(withdrawal.amount)} has been approved. The amount will be transferred to your account within 2-3 business days.`,
        type: 'withdrawal_approved',
        timestamp: new Date().toISOString(),
      }

      // In real app, make API call to send notification
      // await adminService.sendProviderNotification(notificationData)
      console.log('Notification sent to provider:', notificationData)

      // Show success notification
      setNotification({
        type: 'success',
        message: `Withdrawal request approved. Notification sent to ${withdrawal.providerName}.`,
      })

      // Update modal if open
      if (viewingWithdrawal?.id === withdrawalId) {
        const updated = updatedWithdrawals.find(w => w.id === withdrawalId)
        setViewingWithdrawal(updated)
      }

      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000)
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      setNotification({
        type: 'error',
        message: 'Failed to approve withdrawal. Please try again.',
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleRejectClick = (withdrawalId) => {
    setRejectingWithdrawalId(withdrawalId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingWithdrawalId) return
    if (!rejectionReason.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide a reason for rejection.',
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    const withdrawal = withdrawals.find(w => w.id === rejectingWithdrawalId)
    if (!withdrawal) return

    try {
      // Update withdrawal status
      const updatedWithdrawals = withdrawals.map(w => 
        w.id === rejectingWithdrawalId 
          ? {
              ...w,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: 'Admin User',
              rejectionReason: rejectionReason.trim(),
            }
          : w
      )
      setWithdrawals(updatedWithdrawals)

      // Send notification to provider
      const notificationData = {
        providerId: withdrawal.providerEmail,
        providerType: withdrawal.providerType,
        providerName: withdrawal.providerName,
        withdrawalId: rejectingWithdrawalId,
        amount: withdrawal.amount,
        message: `Your withdrawal request of ${formatCurrency(withdrawal.amount)} has been rejected. Reason: ${rejectionReason.trim()}`,
        type: 'withdrawal_rejected',
        timestamp: new Date().toISOString(),
      }

      // In real app, make API call
      console.log('Notification sent to provider:', notificationData)

      setNotification({
        type: 'error',
        message: `Withdrawal request rejected. Notification sent to ${withdrawal.providerName}.`,
      })

      // Update modal if open
      if (viewingWithdrawal?.id === rejectingWithdrawalId) {
        const updated = updatedWithdrawals.find(w => w.id === rejectingWithdrawalId)
        setViewingWithdrawal(updated)
      }

      // Close reject modal
      setShowRejectModal(false)
      setRejectingWithdrawalId(null)
      setRejectionReason('')

      setTimeout(() => setNotification(null), 5000)
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      setNotification({
        type: 'error',
        message: 'Failed to reject withdrawal. Please try again.',
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  return (
    <section className="flex flex-col gap-3 pb-20 pt-0">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <IoCheckmarkCircleOutline className="h-5 w-5" />
            ) : (
              <IoCloseCircleOutline className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Wallet</h1>
            <p className="mt-1.5 text-sm text-slate-600">Platform earnings and provider wallet management</p>
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
              <p className="text-sm font-medium text-white/80 mb-1">Total Platform Earnings</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight">{formatCurrency(mockWalletOverview.totalEarnings)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Available: {formatCurrency(mockWalletOverview.availableBalance)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Pending: {formatCurrency(mockWalletOverview.pendingWithdrawals)}</span>
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
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Commission Card */}
        <article className="relative overflow-hidden rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-5 shadow-sm">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <IoCashOutline className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">Total Commission</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockWalletOverview.totalCommission)}</p>
            <p className="mt-1 text-[10px] text-slate-500">Platform commission</p>
          </div>
        </article>

        {/* Withdrawals Card */}
        <article className="relative overflow-hidden rounded-2xl border border-amber-100/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-5 shadow-sm">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-amber-100/50 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <IoCashOutline className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Total Withdrawals</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(mockWalletOverview.totalWithdrawals)}</p>
            <p className="mt-1 text-[10px] text-slate-500">{mockWalletOverview.pendingWithdrawalRequests} pending requests</p>
          </div>
        </article>
      </div>

      {/* Earnings by Role */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">Earnings by Provider Type</h2>
          <p className="mt-1 text-xs text-slate-600">Commission breakdown</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Doctors Earnings */}
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <IoMedicalOutline className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase">Doctors</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(earningsByRole.doctors)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{mockProviders.doctors.length} active doctors</p>
          </article>

          {/* Pharmacies Earnings */}
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <IoBusinessOutline className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase">Pharmacies</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(earningsByRole.pharmacies)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{mockProviders.pharmacies.length} active pharmacies</p>
          </article>

          {/* Laboratories Earnings */}
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <IoFlaskOutline className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-600 uppercase">Laboratories</p>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(earningsByRole.laboratories)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">{mockProviders.laboratories.length} active laboratories</p>
          </article>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Provider Details
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'withdrawals'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Withdrawal Requests
        </button>
      </div>

      {/* Provider Details Tab */}
      {activeTab === 'overview' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">All Providers Wallet Details</h2>
              <p className="mt-1 text-xs text-slate-600">View earnings and balances for all providers</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IoSearchOutline className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                />
              </div>
              <select
                value={selectedProviderType}
                onChange={(e) => setSelectedProviderType(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
              >
                <option value="all">All Types</option>
                <option value="doctor">Doctors</option>
                <option value="pharmacy">Pharmacies</option>
                <option value="laboratory">Laboratories</option>
              </select>
            </div>
          </header>

          <div className="space-y-3">
            {filteredProviders.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-slate-600">No providers found</p>
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const ProviderIcon = getProviderIcon(provider.type)
                return (
                  <article
                    key={provider.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <ProviderIcon className="h-6 w-6 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-900">{provider.name}</h3>
                            <p className="mt-0.5 text-sm text-slate-600 truncate">{provider.email}</p>
                            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Total Earnings</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(provider.totalEarnings)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Available</p>
                                <p className="mt-1 text-sm font-bold text-emerald-600">{formatCurrency(provider.availableBalance)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
                                <p className="mt-1 text-sm font-bold text-amber-600">{formatCurrency(provider.pendingBalance)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase">Withdrawals</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(provider.totalWithdrawals)}</p>
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 capitalize">
                            {provider.type}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <IoReceiptOutline className="h-3.5 w-3.5" />
                          <span>{provider.totalTransactions} transactions</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      )}

      {/* Withdrawal Requests Tab */}
      {activeTab === 'withdrawals' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Withdrawal Requests</h2>
            <p className="mt-1 text-xs text-slate-600">Manage provider withdrawal requests</p>
          </header>

          <div className="space-y-3">
            {withdrawals.map((withdrawal) => {
              const ProviderIcon = getProviderIcon(withdrawal.providerType)
              return (
                <article
                  key={withdrawal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <ProviderIcon className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900">{withdrawal.providerName}</h3>
                          <p className="mt-0.5 text-sm text-slate-600 capitalize">{withdrawal.providerType}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Amount</p>
                              <p className="mt-1 text-base font-bold text-slate-900">{formatCurrency(withdrawal.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Method</p>
                              <p className="mt-1 text-sm text-slate-600">{withdrawal.payoutMethod}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">Requested</p>
                              <p className="mt-1 text-sm text-slate-600">{formatDate(withdrawal.requestedAt)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(withdrawal.status)}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingWithdrawal(withdrawal)}
                              className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              <IoEyeOutline className="h-3.5 w-3.5" />
                              View
                            </button>
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(withdrawal.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectClick(withdrawal.id)}
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                            <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-600">{withdrawal.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* View Withdrawal Details Modal */}
      {viewingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingWithdrawal(null)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">Withdrawal Request Details</h2>
              <button
                onClick={() => setViewingWithdrawal(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Provider Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Provider Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Provider Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.providerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Provider Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{viewingWithdrawal.providerType}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.providerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Withdrawal Details */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Withdrawal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(viewingWithdrawal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <div className="mt-1">{getStatusBadge(viewingWithdrawal.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Requested At</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(viewingWithdrawal.requestedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Transaction ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.transactionId}</p>
                  </div>
                  {viewingWithdrawal.approvedAt && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Approved At</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(viewingWithdrawal.approvedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Approved By</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.approvedBy}</p>
                      </div>
                    </>
                  )}
                  {viewingWithdrawal.rejectedAt && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Rejected At</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(viewingWithdrawal.rejectedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Rejected By</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.rejectedBy}</p>
                      </div>
                      {viewingWithdrawal.rejectionReason && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="mt-1 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-lg">{viewingWithdrawal.rejectionReason}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Payout Method</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.payoutMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bank Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account Number</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">IFSC Code</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.ifscCode}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Account Holder Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingWithdrawal.accountHolderName}</p>
                  </div>
                </div>
              </div>

              {/* Provider Wallet Summary */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Provider Wallet Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Total Earnings</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(viewingWithdrawal.totalEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Available Balance</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(viewingWithdrawal.availableBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Withdrawals</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(viewingWithdrawal.totalWithdrawals)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              {viewingWithdrawal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(viewingWithdrawal.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(viewingWithdrawal.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setViewingWithdrawal(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingWithdrawalId(null)
            setRejectionReason('')
          }}
        >
          <div 
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Withdrawal Request</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingWithdrawalId(null)
                  setRejectionReason('')
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Please provide a reason for rejecting this withdrawal request. This reason will be sent to the provider.
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
                {!rejectionReason.trim() && (
                  <p className="mt-1 text-xs text-red-600">Reason is required</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingWithdrawalId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminWallet


