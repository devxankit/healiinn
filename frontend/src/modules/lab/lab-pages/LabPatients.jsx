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
  IoCloseCircleOutline,
} from 'react-icons/io5'

const mockPatients = [
  {
    id: 'pat-1',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    phone: '+1-555-123-4567',
    email: 'john.doe@example.com',
    lastTestDate: '2025-01-12T10:15:00.000Z',
    totalTests: 8,
    totalSpent: 320.50,
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    },
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
  },
  {
    id: 'pat-2',
    name: 'Sarah Smith',
    age: 32,
    gender: 'female',
    phone: '+1-555-234-5678',
    email: 'sarah.smith@example.com',
    lastTestDate: '2025-01-12T09:30:00.000Z',
    totalTests: 5,
    totalSpent: 185.25,
    address: {
      line1: '456 Oak Avenue',
      line2: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
    },
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
  },
  {
    id: 'pat-3',
    name: 'Mike Johnson',
    age: 28,
    gender: 'male',
    phone: '+1-555-345-6789',
    email: 'mike.johnson@example.com',
    lastTestDate: '2025-01-11T14:20:00.000Z',
    totalTests: 12,
    totalSpent: 450.75,
    address: {
      line1: '789 Pine Street',
      line2: 'Suite 5',
      city: 'New York',
      state: 'NY',
      postalCode: '10003',
    },
    image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
  },
]

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const LabPatients = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const filteredPatients = useMemo(() => {
    let patients = mockPatients

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      patients = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(normalizedSearch) ||
          patient.email.toLowerCase().includes(normalizedSearch) ||
          patient.phone.includes(normalizedSearch)
      )
    }

    return patients.sort((a, b) => new Date(b.lastTestDate) - new Date(a.lastTestDate))
  }, [searchTerm])

  const formatAddress = (address) => {
    if (!address) return '—'
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
    ].filter(Boolean)
    return parts.join(', ') || '—'
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/lab/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          aria-label="Go back"
        >
          <IoArrowBackOutline className="text-xl" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-600">View and manage patient information</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <IoPeopleOutline className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No patients found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search term</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <article
              key={patient.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-shrink-0">
                  <img
                    src={patient.image}
                    alt={patient.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    <p className="text-sm text-slate-600">
                      {patient.age} years, {patient.gender}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoCallOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoMailOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoLocationOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{formatAddress(patient.address)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoCalendarOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>Last test: {formatDateTime(patient.lastTestDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Total Tests: </span>
                      <span className="font-semibold text-slate-900">{patient.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Spent: </span>
                      <span className="font-semibold text-slate-900">{formatCurrency(patient.totalSpent)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-col">
                  <a
                    href={`tel:${patient.phone}`}
                    className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={`mailto:${patient.email}`}
                    className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoMailOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-bold text-slate-900">Patient Details</h2>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <IoCloseCircleOutline className="text-xl" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto p-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPatient.image}
                  alt={selectedPatient.name}
                  className="h-20 w-20 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-slate-600">
                    {selectedPatient.age} years, {selectedPatient.gender}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="text-sm text-slate-900">{selectedPatient.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="text-sm text-slate-900">{selectedPatient.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-500">Address</p>
                  <p className="text-sm text-slate-900">{formatAddress(selectedPatient.address)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Tests</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedPatient.totalTests}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Spent</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(selectedPatient.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Last Test Date</p>
                  <p className="text-sm text-slate-900">{formatDateTime(selectedPatient.lastTestDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LabPatients

