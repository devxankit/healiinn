import { useState } from 'react'
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

const mockPharmacies = [
  {
    id: 'pharm-1',
    name: 'MediCare Pharmacy',
    ownerName: 'Rajesh Patel',
    email: 'medicare@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, Pune, Maharashtra',
    licenseNumber: 'PH-12345',
    status: 'verified',
    registeredAt: '2024-12-15',
    totalOrders: 245,
  },
  {
    id: 'pharm-2',
    name: 'City Pharmacy',
    ownerName: 'Priya Sharma',
    email: 'citypharmacy@example.com',
    phone: '+91 98765 43211',
    address: '456 Market Road, Mumbai, Maharashtra',
    licenseNumber: 'PH-12346',
    status: 'pending',
    registeredAt: '2025-01-10',
    totalOrders: 0,
  },
  {
    id: 'pharm-3',
    name: 'Health Plus Pharmacy',
    ownerName: 'Amit Kumar',
    email: 'healthplus@example.com',
    phone: '+91 98765 43212',
    address: '789 Health Avenue, Delhi, NCR',
    licenseNumber: 'PH-12347',
    status: 'verified',
    registeredAt: '2024-11-20',
    totalOrders: 189,
  },
]

const AdminPharmacies = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pharmacies, setPharmacies] = useState(mockPharmacies)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPharmacy, setEditingPharmacy] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    status: 'pending',
  })

  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    const matchesSearch =
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || pharmacy.status === statusFilter
    
    return matchesSearch && matchesStatus
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e3a52] transition-colors"
          >
            <IoAddOutline className="h-4 w-4" />
            Add Pharmacy
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <IoFilterOutline className="h-4 w-4" />
            Filter
          </button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
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
            onClick={() => setStatusFilter('verified')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'verified'
                ? 'bg-[#11496c] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#11496c] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Pharmacies</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{pharmacies.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {pharmacies.filter((p) => p.status === 'verified').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pharmacies.filter((p) => p.status === 'pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pharmacies.reduce((sum, p) => sum + p.totalOrders, 0)}
          </p>
        </div>
      </div>

      {/* Pharmacies List */}
      <div className="space-y-2">
        {filteredPharmacies.length === 0 ? (
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
                    <div className="flex shrink-0 items-start gap-2">
                      {getStatusBadge(pharmacy.status)}
                      <button
                        type="button"
                        onClick={() => handleEdit(pharmacy)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#11496c] hover:bg-[rgba(17,73,108,0.1)] transition-colors"
                        aria-label="Edit pharmacy"
                      >
                        <IoCreateOutline className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pharmacy.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete pharmacy"
                      >
                        <IoTrashOutline className="h-5 w-5" />
                      </button>
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
    </section>
  )
}

export default AdminPharmacies


