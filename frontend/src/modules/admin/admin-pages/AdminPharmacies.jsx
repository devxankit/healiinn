import { useState, useEffect } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoBusinessOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoCreateOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCloseOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  getPharmacies,
  getPharmacyById,
  verifyPharmacy,
  rejectPharmacy,
} from '../admin-services/adminService'

// Mock data removed - using real API now

const AdminPharmacies = () => {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPharmacy, setEditingPharmacy] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingPharmacyId, setRejectingPharmacyId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    status: 'pending',
  })

  // Load pharmacies from API
  useEffect(() => {
    loadPharmacies()
  }, [statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPharmacies()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const [allPharmacies, setAllPharmacies] = useState([]) // Store all pharmacies for stats

  const loadPharmacies = async () => {
    try {
      setLoading(true)
      
      // First, load ALL pharmacies for stats (no filters)
      const allPharmaciesResponse = await getPharmacies({ page: 1, limit: 1000 })
      if (allPharmaciesResponse.success && allPharmaciesResponse.data) {
        const allTransformed = (allPharmaciesResponse.data.items || []).map(pharmacy => ({
          id: pharmacy._id || pharmacy.id,
          name: pharmacy.pharmacyName || '',
          ownerName: pharmacy.ownerName || '',
          email: pharmacy.email || '',
          phone: pharmacy.phone || '',
          address: pharmacy.address ? `${pharmacy.address.line1 || ''}, ${pharmacy.address.city || ''}, ${pharmacy.address.state || ''}`.trim() : '',
          licenseNumber: pharmacy.licenseNumber || '',
          status: pharmacy.status === 'approved' ? 'verified' : pharmacy.status || 'pending',
          registeredAt: pharmacy.createdAt || new Date().toISOString(),
          totalOrders: 0, // TODO: Add when orders API is ready
          rejectionReason: pharmacy.rejectionReason || '',
        }))
        setAllPharmacies(allTransformed)
      }
      
      // Then, load filtered pharmacies for display
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      }
      const response = await getPharmacies(filters)
      
      if (response.success && response.data) {
        const transformedPharmacies = (response.data.items || []).map(pharmacy => ({
          id: pharmacy._id || pharmacy.id,
          name: pharmacy.pharmacyName || '',
          ownerName: pharmacy.ownerName || '',
          email: pharmacy.email || '',
          phone: pharmacy.phone || '',
          address: pharmacy.address ? `${pharmacy.address.line1 || ''}, ${pharmacy.address.city || ''}, ${pharmacy.address.state || ''}`.trim() : '',
          licenseNumber: pharmacy.licenseNumber || '',
          status: pharmacy.status === 'approved' ? 'verified' : pharmacy.status || 'pending',
          registeredAt: pharmacy.createdAt || new Date().toISOString(),
          totalOrders: 0, // TODO: Add when orders API is ready
          rejectionReason: pharmacy.rejectionReason || '',
        }))
        setPharmacies(transformedPharmacies)
      }
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      toast.error(error.message || 'Failed to load pharmacies')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (pharmacyId) => {
    try {
      setProcessingId(pharmacyId)
      const response = await verifyPharmacy(pharmacyId)
      
      if (response.success) {
        toast.success('Pharmacy approved successfully')
        await loadPharmacies()
      }
    } catch (error) {
      console.error('Error approving pharmacy:', error)
      toast.error(error.message || 'Failed to approve pharmacy')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (pharmacyId) => {
    setRejectingPharmacyId(pharmacyId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectingPharmacyId) return
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a reason for rejection.')
      return
    }

    try {
      setProcessingId(rejectingPharmacyId)
      const response = await rejectPharmacy(rejectingPharmacyId, rejectionReason.trim())
      
      if (response.success) {
        toast.success('Pharmacy rejected successfully')
        await loadPharmacies()
        setShowRejectModal(false)
        setRejectingPharmacyId(null)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Error rejecting pharmacy:', error)
      toast.error(error.message || 'Failed to reject pharmacy')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    const matchesSearch =
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
            <IoCheckmarkCircleOutline className="h-3 w-3" />
            Verified
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
            <IoTimeOutline className="h-3 w-3" />
            Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">
            <IoCloseCircleOutline className="h-3 w-3" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  // CRUD Operations
  const handleCreate = () => {
    setEditingPharmacy(null)
    setFormData({
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      status: 'pending',
    })
    setShowEditModal(true)
  }

  const handleEdit = (pharmacy) => {
    setEditingPharmacy(pharmacy)
    setFormData({
      name: pharmacy.name,
      ownerName: pharmacy.ownerName,
      email: pharmacy.email,
      phone: pharmacy.phone,
      address: pharmacy.address,
      licenseNumber: pharmacy.licenseNumber,
      status: pharmacy.status,
    })
    setShowEditModal(true)
  }

  const handleSave = () => {
    if (editingPharmacy) {
      // Update existing pharmacy
      setPharmacies(pharmacies.map(pharm => 
        pharm.id === editingPharmacy.id 
          ? { ...pharm, ...formData }
          : pharm
      ))
    } else {
      // Create new pharmacy
      const newPharmacy = {
        id: `pharm-${Date.now()}`,
        ...formData,
        totalOrders: 0,
        registeredAt: new Date().toISOString().split('T')[0],
      }
      setPharmacies([...pharmacies, newPharmacy])
    }
    setShowEditModal(false)
    setEditingPharmacy(null)
    setFormData({
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      status: 'pending',
    })
  }

  const handleDelete = (pharmacyId) => {
    if (window.confirm('Are you sure you want to delete this pharmacy?')) {
      setPharmacies(pharmacies.filter(pharm => pharm.id !== pharmacyId))
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <section className="flex flex-col gap-2 pb-20 pt-0">
      {/* Header */}
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacies Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all registered pharmacies</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search pharmacies by name, owner, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
        />
      </div>

      {/* Stats Summary - Clickable Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:shadow-md ${
            statusFilter === 'all' ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Pharmacies</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{allPharmacies.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {allPharmacies.filter((p) => p.status === 'verified' || p.status === 'approved').length}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'pending' ? 'border-amber-500 bg-amber-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {allPharmacies.filter((p) => p.status === 'pending').length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {allPharmacies.reduce((sum, p) => sum + p.totalOrders, 0)}
          </p>
        </div>
      </div>

      {/* Pharmacies List */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading pharmacies...</p>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No pharmacies found</p>
          </div>
        ) : (
          filteredPharmacies.map((pharmacy) => (
            <article
              key={pharmacy.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <IoBusinessOutline className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{pharmacy.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">Owner: {pharmacy.ownerName}</p>
                      <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <IoLocationOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{pharmacy.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{pharmacy.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 shrink-0" />
                          <span>{pharmacy.phone}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          License: {pharmacy.licenseNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2 flex-col">
                      {getStatusBadge(pharmacy.status)}
                      {pharmacy.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(pharmacy.id)}
                            disabled={processingId === pharmacy.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                          >
                            {processingId === pharmacy.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClick(pharmacy.id)}
                            disabled={processingId === pharmacy.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {pharmacy.status === 'rejected' && pharmacy.rejectionReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 max-w-xs">
                          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-600">{pharmacy.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span>Orders: {pharmacy.totalOrders}</span>
                    <span>Registered: {formatDate(pharmacy.registeredAt)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowEditModal(false)
            setEditingPharmacy(null)
          }}
        >
          <div 
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPharmacy ? 'Edit Pharmacy' : 'Add New Pharmacy'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPharmacy(null)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pharmacy Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="MediCare Pharmacy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Rajesh Patel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="pharmacy@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="123 Main Street, Pune, Maharashtra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="PH-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPharmacy(null)
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e3a52]"
              >
                {editingPharmacy ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Pharmacy Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowRejectModal(false)
            setRejectingPharmacyId(null)
            setRejectionReason('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Reject Pharmacy</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingPharmacyId(null)
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
                  Please provide a reason for rejecting this pharmacy. This reason will be visible to the pharmacy.
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
                  setRejectingPharmacyId(null)
                  setRejectionReason('')
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === rejectingPharmacyId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {processingId === rejectingPharmacyId ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminPharmacies


