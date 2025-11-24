import { useState, useEffect } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoMailOutline,
  IoCallOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoMedicalOutline,
} from 'react-icons/io5'

const AdminSupport = () => {
  const [supportRequests, setSupportRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Mock data - Replace with API call
  useEffect(() => {
    const mockRequests = [
      {
        id: '1',
        role: 'doctor',
        name: 'Dr. John Smith',
        clinicName: 'City Medical Center',
        email: 'john.smith@example.com',
        contactNumber: '+91 9876543210',
        note: 'Need help with prescription management system.',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        role: 'patient',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        contactNumber: '+91 9876543211',
        note: 'Unable to book appointment with doctor.',
        status: 'in_progress',
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-15T09:15:00Z',
        adminNote: 'Contacted patient, issue resolved.',
      },
      {
        id: '3',
        role: 'pharmacy',
        name: 'Rajesh Kumar',
        pharmacyName: 'MediCare Pharmacy',
        email: 'rajesh@medicare.com',
        contactNumber: '+91 9876543212',
        note: 'Order delivery system not working properly.',
        status: 'resolved',
        createdAt: '2024-01-13T11:00:00Z',
        updatedAt: '2024-01-14T16:30:00Z',
        adminNote: 'Fixed delivery system issue.',
      },
      {
        id: '4',
        role: 'laboratory',
        name: 'Priya Sharma',
        labName: 'Health Lab Services',
        email: 'priya@healthlab.com',
        contactNumber: '+91 9876543213',
        note: 'Report generation taking too long.',
        status: 'pending',
        createdAt: '2024-01-16T08:45:00Z',
        updatedAt: '2024-01-16T08:45:00Z',
      },
    ]
    setSupportRequests(mockRequests)
    setFilteredRequests(mockRequests)
  }, [])

  useEffect(() => {
    let filtered = [...supportRequests]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (req.clinicName && req.clinicName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (req.pharmacyName && req.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (req.labName && req.labName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          req.note.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((req) => req.role === roleFilter)
    }

    setFilteredRequests(filtered)
  }, [searchTerm, statusFilter, roleFilter, supportRequests])

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor':
        return <IoMedicalOutline className="h-5 w-5" />
      case 'patient':
        return <IoPersonOutline className="h-5 w-5" />
      case 'pharmacy':
        return <IoBusinessOutline className="h-5 w-5" />
      case 'laboratory':
        return <IoFlaskOutline className="h-5 w-5" />
      default:
        return <IoPersonOutline className="h-5 w-5" />
    }
  }

  const getRoleLabel = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleStatusChange = (request) => {
    setSelectedRequest(request)
    setNewStatus(request.status)
    setAdminNote(request.adminNote || '')
    setShowStatusModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !newStatus) return

    setIsUpdating(true)

    // TODO: Replace with actual API call
    // await updateSupportRequestStatus(selectedRequest.id, { status: newStatus, adminNote })

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update local state
    setSupportRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? { ...req, status: newStatus, adminNote, updatedAt: new Date().toISOString() }
          : req
      )
    )

    setIsUpdating(false)
    setShowStatusModal(false)
    setSelectedRequest(null)
    setNewStatus('')
    setAdminNote('')

    // TODO: Send email notification to user
    // await sendStatusUpdateNotification(selectedRequest.email, newStatus)
  }

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

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Support Requests</h1>
        <p className="mt-1 text-sm text-slate-600">Manage support requests from all users</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IoSearchOutline className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
            />
          </div>

        </div>
      </div>

      {/* Support Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-600">No support requests found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your filters</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#11496c]/10 text-[#11496c]">
                      {getRoleIcon(request.role)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{request.name}</h3>
                        <span className="text-xs font-medium text-slate-500">({getRoleLabel(request.role)})</span>
                        {getStatusBadge(request.status)}
                      </div>
                      {request.clinicName && (
                        <p className="mt-1 text-sm text-slate-600">{request.clinicName}</p>
                      )}
                      {request.pharmacyName && (
                        <p className="mt-1 text-sm text-slate-600">{request.pharmacyName}</p>
                      )}
                      {request.labName && <p className="mt-1 text-sm text-slate-600">{request.labName}</p>}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <IoMailOutline className="h-4 w-4" />
                      <span>{request.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IoCallOutline className="h-4 w-4" />
                      <span>{request.contactNumber}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm text-slate-700">{request.note}</p>
                  </div>

                  {/* Admin Note (if exists) */}
                  {request.adminNote && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-900">Admin Note:</p>
                      <p className="mt-1 text-sm text-blue-800">{request.adminNote}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <IoTimeOutline className="h-3.5 w-3.5" />
                      <span>Created: {formatDate(request.createdAt)}</span>
                    </div>
                    {request.updatedAt !== request.createdAt && (
                      <div className="flex items-center gap-1">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span>Updated: {formatDate(request.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex sm:flex-col sm:items-end">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(request)}
                    className="rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold text-slate-900">Update Support Request Status</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Admin Note (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  placeholder="Add a note about this update..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false)
                    setSelectedRequest(null)
                    setNewStatus('')
                    setAdminNote('')
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || !newStatus}
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSupport

