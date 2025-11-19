import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMedicalOutline,
} from 'react-icons/io5'

const mockPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    phone: '+1-555-123-4567',
    email: 'john.doe@example.com',
    lastOrderDate: '2025-01-12T10:15:00.000Z',
    totalOrders: 12,
    totalSpent: 1250.50,
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    },
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    age: 32,
    gender: 'female',
    phone: '+1-555-234-5678',
    email: 'sarah.smith@example.com',
    lastOrderDate: '2025-01-12T09:30:00.000Z',
    totalOrders: 8,
    totalSpent: 890.25,
    address: {
      line1: '456 Oak Avenue',
      line2: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
    },
    medicalHistory: [],
    allergies: [],
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    age: 28,
    gender: 'male',
    phone: '+1-555-345-6789',
    email: 'mike.johnson@example.com',
    lastOrderDate: '2025-01-11T14:20:00.000Z',
    totalOrders: 15,
    totalSpent: 2100.75,
    address: {
      line1: '789 Pine Street',
      line2: 'Suite 5',
      city: 'New York',
      state: 'NY',
      postalCode: '10003',
    },
    medicalHistory: ['Type 2 Diabetes'],
    allergies: ['Peanuts'],
    image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
  },
  {
    id: 'pat-4',
    name: 'Emily Brown',
    age: 55,
    gender: 'female',
    phone: '+1-555-456-7890',
    email: 'emily.brown@example.com',
    lastOrderDate: '2025-01-10T11:00:00.000Z',
    totalOrders: 20,
    totalSpent: 3200.00,
    address: {
      line1: '321 Elm Street',
      line2: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10004',
    },
    medicalHistory: ['Osteoarthritis'],
    allergies: [],
    image: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
  },
]

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const PharmacyPatients = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return mockPatients

    const normalizedSearch = searchTerm.trim().toLowerCase()
    return mockPatients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(normalizedSearch) ||
        patient.phone.includes(normalizedSearch) ||
        patient.email.toLowerCase().includes(normalizedSearch)
    )
  }, [searchTerm])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-600">{filteredPatients.length} patients</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No patients found matching your search.
          </p>
        ) : (
          filteredPatients.map((patient) => (
            <article
              key={patient.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="h-16 w-16 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{patient.name}</h3>
                  <p className="text-xs text-slate-500">
                    {patient.age} years, {patient.gender}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`tel:${patient.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <IoCallOutline className="h-3 w-3" />
                      {patient.phone}
                    </a>
                    <a
                      href={`mailto:${patient.email}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <IoMailOutline className="h-3 w-3" />
                      Email
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{patient.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Spent</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(patient.totalSpent)}</p>
                </div>
              </div>

              {/* Medical Info */}
              {(patient.medicalHistory.length > 0 || patient.allergies.length > 0) && (
                <div className="space-y-2">
                  {patient.medicalHistory.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Medical History</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.medicalHistory.map((condition, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.allergies.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Allergies</p>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formatAddress(patient.address)}</span>
              </div>

              {/* Last Order */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IoCalendarOutline className="h-3 w-3" />
                <span>Last order: {formatDateTime(patient.lastOrderDate)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoDocumentTextOutline className="mr-1 inline h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={() => navigate(`/pharmacy/orders?patientId=${patient.id}`)}
                  className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                >
                  View Orders
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Patient Details</h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPatient.image}
                  alt={selectedPatient.name}
                  className="h-20 w-20 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=3b82f6&color=fff&size=160&bold=true`
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedPatient.age} years, {selectedPatient.gender}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedPatient.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedPatient.email}</p>
                  <p><span className="font-medium">Address:</span> {formatAddress(selectedPatient.address)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoMedicalOutline className="h-4 w-4" />
                  Medical Information
                </h4>
                <div className="space-y-2 text-sm">
                  {selectedPatient.medicalHistory.length > 0 ? (
                    <div>
                      <p className="font-medium text-slate-600">Medical History:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.medicalHistory.map((condition, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">No medical history recorded</p>
                  )}
                  {selectedPatient.allergies.length > 0 && (
                    <div>
                      <p className="font-medium text-slate-600">Allergies:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.allergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Order Statistics</h4>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{selectedPatient.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Spent</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(selectedPatient.totalSpent)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyPatients

