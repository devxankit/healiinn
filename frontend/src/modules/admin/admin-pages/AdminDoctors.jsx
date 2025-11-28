import { useState } from 'react'
import {
  IoSearchOutline,
  IoFilterOutline,
  IoMedicalOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoEllipsisVerticalOutline,
  IoStarOutline,
  IoCreateOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCloseOutline,
} from 'react-icons/io5'

const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+91 98765 43210',
    specialty: 'General Physician',
    clinic: 'Shivaji Nagar Clinic',
    location: 'Pune, Maharashtra',
    rating: 4.8,
    totalConsultations: 245,
    status: 'verified',
    registeredAt: '2024-12-15',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43211',
    specialty: 'Pediatrician',
    clinic: 'Central Hospital',
    location: 'Mumbai, Maharashtra',
    rating: 4.9,
    totalConsultations: 189,
    status: 'verified',
    registeredAt: '2024-12-10',
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 98765 43212',
    specialty: 'Cardiologist',
    clinic: 'Heart Care Clinic',
    location: 'Delhi, NCR',
    rating: 4.7,
    totalConsultations: 156,
    status: 'pending',
    registeredAt: '2025-01-05',
  },
  {
    id: 'doc-4',
    name: 'Dr. Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '+91 98765 43213',
    specialty: 'Dermatologist',
    clinic: 'Skin Care Center',
    location: 'Bangalore, Karnataka',
    rating: 4.6,
    totalConsultations: 98,
    status: 'verified',
    registeredAt: '2024-11-20',
  },
]

const AdminDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [doctors, setDoctors] = useState(mockDoctors)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    clinic: '',
    location: '',
    status: 'pending',
  })

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.clinic.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter
    
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

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <IoStarOutline key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      )
    }
    const remainingStars = 5 - fullStars
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <IoStarOutline key={`empty-${i}`} className="h-4 w-4 text-slate-300" />
      )
    }
    return stars
  }

  // CRUD Operations
  const handleCreate = () => {
    setEditingDoctor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      clinic: '',
      location: '',
      status: 'pending',
    })
    setShowEditModal(true)
  }

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      clinic: doctor.clinic,
      location: doctor.location,
      status: doctor.status,
    })
    setShowEditModal(true)
  }

  const handleSave = () => {
    if (editingDoctor) {
      // Update existing doctor
      setDoctors(doctors.map(doc => 
        doc.id === editingDoctor.id 
          ? { ...doc, ...formData }
          : doc
      ))
    } else {
      // Create new doctor
      const newDoctor = {
        id: `doc-${Date.now()}`,
        ...formData,
        rating: 0,
        totalConsultations: 0,
        registeredAt: new Date().toISOString().split('T')[0],
      }
      setDoctors([...doctors, newDoctor])
    }
    setShowEditModal(false)
    setEditingDoctor(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      clinic: '',
      location: '',
      status: 'pending',
    })
  }

  const handleDelete = (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      setDoctors(doctors.filter(doc => doc.id !== doctorId))
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
          <h1 className="text-2xl font-bold text-slate-900">Doctors Management</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage all registered doctors</p>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search doctors by name, specialty, or clinic..."
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Doctors</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{doctors.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'verified' ? 'border-emerald-500 bg-emerald-50' : ''
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {doctors.filter((d) => d.status === 'verified').length}
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
            {doctors.filter((d) => d.status === 'pending').length}
          </p>
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Appointments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {doctors.reduce((sum, d) => sum + d.totalConsultations, 0)}
          </p>
        </div>
      </div>

      {/* Doctors List */}
      <div className="space-y-2">
        {filteredDoctors.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">No doctors found</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <article
              key={doctor.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <IoMedicalOutline className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{doctor.name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-[#11496c]">{doctor.specialty}</p>
                      <div className="mt-1.5 space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <IoLocationOutline className="h-4 w-4 shrink-0" />
                          <span>{doctor.clinic}, {doctor.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 shrink-0" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 shrink-0" />
                          <span>{doctor.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      {getStatusBadge(doctor.status)}
                      <button
                        type="button"
                        onClick={() => handleEdit(doctor)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#11496c] hover:bg-[rgba(17,73,108,0.1)] transition-colors"
                        aria-label="Edit doctor"
                      >
                        <IoCreateOutline className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doctor.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete doctor"
                      >
                        <IoTrashOutline className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      {renderStars(doctor.rating)}
                      <span className="ml-1 font-medium text-slate-700">{doctor.rating}</span>
                    </div>
                    <span>Consultations: {doctor.totalConsultations}</span>
                    <span>Registered: {formatDate(doctor.registeredAt)}</span>
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
            setEditingDoctor(null)
          }}
        >
          <div 
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingDoctor(null)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Dr. John Doe"
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
                  placeholder="doctor@example.com"
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
                  Specialty *
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => handleInputChange('specialty', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Cardiologist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  value={formData.clinic}
                  onChange={(e) => handleInputChange('clinic', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="City Hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  placeholder="Mumbai, Maharashtra"
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
                  setEditingDoctor(null)
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0e3a52]"
              >
                {editingDoctor ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminDoctors


