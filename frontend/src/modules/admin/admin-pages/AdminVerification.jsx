import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoMedicalOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoEyeOutline,
  IoCloseOutline,
} from 'react-icons/io5'

// Mock data for verification requests
const mockVerifications = [
  {
    id: '1',
    type: 'doctor',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 234-567-8900',
    specialty: 'Cardiology',
    clinic: 'Heart Care Clinic',
    location: 'New York, NY',
    status: 'pending',
    submittedAt: '2024-01-15T10:30:00Z',
    documents: ['License', 'Degree', 'ID'],
  },
  {
    id: '2',
    type: 'pharmacy',
    name: 'MediCare Pharmacy',
    ownerName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 234-567-8901',
    address: '123 Main St, Los Angeles, CA',
    licenseNumber: 'PH-12345',
    status: 'pending',
    submittedAt: '2024-01-14T14:20:00Z',
    documents: ['License', 'Business Registration'],
  },
  {
    id: '3',
    type: 'laboratory',
    name: 'HealthLab Diagnostics',
    ownerName: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1 234-567-8902',
    address: '456 Oak Ave, Chicago, IL',
    licenseNumber: 'LAB-67890',
    status: 'pending',
    submittedAt: '2024-01-13T09:15:00Z',
    documents: ['License', 'Accreditation'],
  },
  {
    id: '4',
    type: 'doctor',
    name: 'Dr. Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+1 234-567-8903',
    specialty: 'Pediatrics',
    clinic: 'Children\'s Hospital',
    location: 'Boston, MA',
    status: 'pending',
    submittedAt: '2024-01-12T16:45:00Z',
    documents: ['License', 'Degree', 'ID'],
  },
  {
    id: '5',
    type: 'pharmacy',
    name: 'QuickMed Pharmacy',
    ownerName: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    phone: '+1 234-567-8904',
    address: '789 Pine St, Miami, FL',
    licenseNumber: 'PH-54321',
    status: 'pending',
    submittedAt: '2024-01-11T11:30:00Z',
    documents: ['License', 'Business Registration'],
  },
  {
    id: '6',
    type: 'doctor',
    name: 'Dr. James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 234-567-8905',
    specialty: 'Dermatology',
    clinic: 'Skin Care Clinic',
    location: 'Seattle, WA',
    status: 'approved',
    submittedAt: '2024-01-10T08:00:00Z',
    approvedAt: '2024-01-12T10:00:00Z',
    documents: ['License', 'Degree', 'ID'],
  },
  {
    id: '7',
    type: 'pharmacy',
    name: 'City Pharmacy',
    ownerName: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+1 234-567-8906',
    address: '321 Elm St, Denver, CO',
    licenseNumber: 'PH-98765',
    status: 'approved',
    submittedAt: '2024-01-09T12:00:00Z',
    approvedAt: '2024-01-11T14:00:00Z',
    documents: ['License', 'Business Registration'],
  },
  {
    id: '8',
    type: 'laboratory',
    name: 'TestLab Services',
    ownerName: 'David Martinez',
    email: 'david.martinez@example.com',
    phone: '+1 234-567-8907',
    address: '654 Maple Ave, Phoenix, AZ',
    licenseNumber: 'LAB-11111',
    status: 'approved',
    submittedAt: '2024-01-08T09:30:00Z',
    approvedAt: '2024-01-10T11:00:00Z',
    documents: ['License', 'Accreditation'],
  },
  {
    id: '9',
    type: 'doctor',
    name: 'Dr. Jennifer Lee',
    email: 'jennifer.lee@example.com',
    phone: '+1 234-567-8908',
    specialty: 'Orthopedics',
    clinic: 'Bone & Joint Clinic',
    location: 'Portland, OR',
    status: 'rejected',
    submittedAt: '2024-01-07T15:00:00Z',
    rejectedAt: '2024-01-09T16:00:00Z',
    rejectionReason: 'Incomplete documentation',
    documents: ['License', 'Degree'],
  },
  {
    id: '10',
    type: 'pharmacy',
    name: 'Wellness Pharmacy',
    ownerName: 'Mark Thompson',
    email: 'mark.thompson@example.com',
    phone: '+1 234-567-8909',
    address: '987 Cedar Blvd, Austin, TX',
    licenseNumber: 'PH-22222',
    status: 'rejected',
    submittedAt: '2024-01-06T10:00:00Z',
    rejectedAt: '2024-01-08T12:00:00Z',
    rejectionReason: 'License expired',
    documents: ['License', 'Business Registration'],
  },
  {
    id: '11',
    type: 'laboratory',
    name: 'Precision Labs',
    ownerName: 'Susan White',
    email: 'susan.white@example.com',
    phone: '+1 234-567-8910',
    address: '147 Birch St, Nashville, TN',
    licenseNumber: 'LAB-33333',
    status: 'rejected',
    submittedAt: '2024-01-05T11:00:00Z',
    rejectedAt: '2024-01-07T13:00:00Z',
    rejectionReason: 'Missing accreditation certificate',
    documents: ['License'],
  },
]

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeIcon = (type) => {
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

const getTypeColor = (type) => {
  switch (type) {
    case 'doctor':
      return 'bg-emerald-100 text-emerald-600'
    case 'pharmacy':
      return 'bg-purple-100 text-purple-600'
    case 'laboratory':
      return 'bg-amber-100 text-amber-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const AdminVerification = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifications, setVerifications] = useState(mockVerifications)
  const [viewingVerification, setViewingVerification] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingVerificationId, setRejectingVerificationId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const filteredVerifications = verifications.filter((verification) => {
    const matchesSearch =
      verification.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (verification.phone && verification.phone.includes(searchTerm))
    const matchesType = typeFilter === 'all' || verification.type === typeFilter
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleApprove = async (id) => {
    const updated = verifications.map((v) =>
      v.id === id ? { ...v, status: 'approved', approvedAt: new Date().toISOString() } : v
    )
    setVerifications(updated)
    if (viewingVerification?.id === id) {
      setViewingVerification(updated.find((v) => v.id === id))
    }
    // In real app, make API call
    console.log('Approved verification:', id)
  }

  const handleRejectClick = (id) => {
    setRejectingVerificationId(id)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingVerificationId) return
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.')
      return
    }

    const updated = verifications.map((v) =>
      v.id === rejectingVerificationId
        ? {
            ...v,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason.trim(),
          }
        : v
    )
    setVerifications(updated)
    if (viewingVerification?.id === rejectingVerificationId) {
      setViewingVerification(updated.find((v) => v.id === rejectingVerificationId))
    }
    // In real app, make API call
    console.log('Rejected verification:', rejectingVerificationId, 'Reason:', rejectionReason)

    // Close modal
    setShowRejectModal(false)
    setRejectingVerificationId(null)
    setRejectionReason('')
  }

  const stats = {
    total: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    approved: verifications.filter((v) => v.status === 'approved').length,
    rejected: verifications.filter((v) => v.status === 'rejected').length,
  }

  // Status breakdown by type
  const statusByType = {
    doctor: {
      total: verifications.filter((v) => v.type === 'doctor').length,
      pending: verifications.filter((v) => v.type === 'doctor' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'doctor' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'doctor' && v.status === 'rejected').length,
    },
    pharmacy: {
      total: verifications.filter((v) => v.type === 'pharmacy').length,
      pending: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'pharmacy' && v.status === 'rejected').length,
    },
    laboratory: {
      total: verifications.filter((v) => v.type === 'laboratory').length,
      pending: verifications.filter((v) => v.type === 'laboratory' && v.status === 'pending').length,
      approved: verifications.filter((v) => v.type === 'laboratory' && v.status === 'approved').length,
      rejected: verifications.filter((v) => v.type === 'laboratory' && v.status === 'rejected').length,
    },
  }

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verification Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Verify doctors, pharmacies, and laboratories</p>
        </div>
      </header>

      {/* Status Bars by Type */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Doctors Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <IoMedicalOutline className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Doctors</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.doctor.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.doctor.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.doctor.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.doctor.rejected}</span>
            </div>
          </div>
        </div>

        {/* Pharmacy Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <IoBusinessOutline className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Pharmacies</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.pharmacy.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.pharmacy.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.pharmacy.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.pharmacy.rejected}</span>
            </div>
          </div>
        </div>

        {/* Laboratory Status Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <IoFlaskOutline className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Laboratories</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Total</span>
              <span className="text-sm font-bold text-slate-900">{statusByType.laboratory.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600">Pending</span>
              <span className="text-sm font-semibold text-amber-600">{statusByType.laboratory.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-600">Approved</span>
              <span className="text-sm font-semibold text-emerald-600">{statusByType.laboratory.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600">Rejected</span>
              <span className="text-sm font-semibold text-red-600">{statusByType.laboratory.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Requests</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-0.5 text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-0.5 text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-0.5 text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
            >
              <option value="all">All Types</option>
              <option value="doctor">Doctors</option>
              <option value="pharmacy">Pharmacies</option>
              <option value="laboratory">Laboratories</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#11496c] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-2">
        {filteredVerifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No verification requests found</p>
          </div>
        ) : (
          filteredVerifications.map((verification) => {
            const TypeIcon = getTypeIcon(verification.type)
            return (
              <article
                key={verification.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(verification.type)}`}>
                    <TypeIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">{verification.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-600 capitalize">{verification.type}</p>
                        <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                          {verification.specialty && (
                            <div className="flex items-center gap-2">
                              <IoMedicalOutline className="h-4 w-4 shrink-0" />
                              <span>{verification.specialty}</span>
                            </div>
                          )}
                          {verification.clinic && (
                            <div className="flex items-center gap-2">
                              <IoLocationOutline className="h-4 w-4 shrink-0" />
                              <span>{verification.clinic}, {verification.location}</span>
                            </div>
                          )}
                          {verification.ownerName && (
                            <div className="flex items-center gap-2">
                              <IoPeopleOutline className="h-4 w-4 shrink-0" />
                              <span>Owner: {verification.ownerName}</span>
                            </div>
                          )}
                          {verification.address && (
                            <div className="flex items-center gap-2">
                              <IoLocationOutline className="h-4 w-4 shrink-0" />
                              <span className="truncate">{verification.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <IoMailOutline className="h-4 w-4 shrink-0" />
                            <span className="truncate">{verification.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoCallOutline className="h-4 w-4 shrink-0" />
                            <span>{verification.phone}</span>
                          </div>
                          {verification.licenseNumber && (
                            <div className="text-xs text-slate-500">
                              License: {verification.licenseNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            verification.status === 'approved'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : verification.status === 'rejected'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {verification.status === 'pending' && <IoTimeOutline className="h-3 w-3" />}
                          {verification.status === 'approved' && <IoCheckmarkCircleOutline className="h-3 w-3" />}
                          {verification.status === 'rejected' && <IoCloseCircleOutline className="h-3 w-3" />}
                          {verification.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingVerification(verification)}
                            className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <IoEyeOutline className="h-3.5 w-3.5" />
                            View
                          </button>
                          {verification.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(verification.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectClick(verification.id)}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <IoCalendarOutline className="h-3.5 w-3.5" />
                        <span>Submitted: {formatDate(verification.submittedAt)}</span>
                      </div>
                      {verification.documents && (
                        <div className="flex items-center gap-1">
                          <span>Documents: {verification.documents.length}</span>
                        </div>
                      )}
                    </div>
                    {verification.status === 'rejected' && verification.rejectionReason && (
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-600">{verification.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* View Verification Details Modal */}
      {viewingVerification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingVerification(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">Verification Details</h2>
              <button
                onClick={() => setViewingVerification(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseCircleOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{viewingVerification.type}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.phone}</p>
                  </div>
                  {viewingVerification.ownerName && (
                    <div>
                      <p className="text-xs text-slate-500">Owner Name</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.ownerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Type-specific Info */}
              {(viewingVerification.specialty || viewingVerification.clinic || viewingVerification.address) && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                    {viewingVerification.type === 'doctor' ? 'Professional Details' : 'Business Details'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingVerification.specialty && (
                      <div>
                        <p className="text-xs text-slate-500">Specialty</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.specialty}</p>
                      </div>
                    )}
                    {viewingVerification.clinic && (
                      <div>
                        <p className="text-xs text-slate-500">Clinic</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.clinic}</p>
                      </div>
                    )}
                    {viewingVerification.location && (
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.location}</p>
                      </div>
                    )}
                    {viewingVerification.address && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.address}</p>
                      </div>
                    )}
                    {viewingVerification.licenseNumber && (
                      <div>
                        <p className="text-xs text-slate-500">License Number</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{viewingVerification.licenseNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              {viewingVerification.documents && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Submitted Documents</h3>
                  <div className="space-y-2">
                    {viewingVerification.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">{doc}</span>
                        <button className="text-xs font-medium text-[#11496c] hover:underline">View</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current Status</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          viewingVerification.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : viewingVerification.status === 'rejected'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {viewingVerification.status === 'pending' && <IoTimeOutline className="h-3 w-3" />}
                        {viewingVerification.status === 'approved' && <IoCheckmarkCircleOutline className="h-3 w-3" />}
                        {viewingVerification.status === 'rejected' && <IoCloseCircleOutline className="h-3 w-3" />}
                        {viewingVerification.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted At</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(viewingVerification.submittedAt)}
                    </p>
                  </div>
                  {viewingVerification.rejectedAt && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Rejected At</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(viewingVerification.rejectedAt)}
                        </p>
                      </div>
                      {viewingVerification.rejectionReason && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Rejection Reason</p>
                          <p className="mt-1 text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
                            {viewingVerification.rejectionReason}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {viewingVerification.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                <button
                  onClick={() => {
                    setViewingVerification(null)
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingVerification(null)
                    handleRejectClick(viewingVerification.id)
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApprove(viewingVerification.id)
                    setViewingVerification(null)
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingVerificationId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Verification Request</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingVerificationId(null)
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
                  Please provide a reason for rejecting this verification request. This reason will be visible to the user.
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
                  setRejectingVerificationId(null)
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

export default AdminVerification

