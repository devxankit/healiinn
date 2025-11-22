import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoCloseOutline,
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
    totalSpent: 3500.50,
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
    lastTestDate: '2025-01-12T09:30:00.000Z',
    totalTests: 5,
    totalSpent: 2100.25,
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

const LaboratoryPatients = () => {
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
        patient.email.toLowerCase().includes(normalizedSearch) ||
        patient.address.city.toLowerCase().includes(normalizedSearch) ||
        patient.address.state.toLowerCase().includes(normalizedSearch)
    )
  }, [searchTerm])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
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
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={patient.image}
                  alt={patient.name}
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{patient.name}</h3>
                  <p className="text-xs text-slate-500">Age: {patient.age}, Gender: {patient.gender}</p>
                  <p className="text-xs text-slate-500">Last Test: {formatDateTime(patient.lastTestDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(patient.totalSpent)}</p>
                  <p className="text-xs text-slate-500">{patient.totalTests} Tests</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${patient.phone}`}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoCallOutline className="h-4 w-4" />
                  Call
                </a>
                <a
                  href={`mailto:${patient.email}`}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoMailOutline className="h-4 w-4" />
                  Email
                </a>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoDocumentTextOutline className="h-4 w-4" />
                  View Details
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
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPatient.image}
                  alt={selectedPatient.name}
                  className="h-16 w-16 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=3b82f6&color=fff&size=160&bold=true`
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-slate-600">Age: {selectedPatient.age}, Gender: {selectedPatient.gender}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedPatient.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedPatient.email}</p>
                  <p><span className="font-medium">Address:</span> {formatAddress(selectedPatient.address)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Medical History</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Conditions:</span> {selectedPatient.medicalHistory.length > 0 ? selectedPatient.medicalHistory.join(', ') : 'None'}</p>
                  <p><span className="font-medium">Allergies:</span> {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'None'}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Test History</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Total Tests:</span> {selectedPatient.totalTests}</p>
                  <p><span className="font-medium">Total Spent:</span> {formatCurrency(selectedPatient.totalSpent)}</p>
                  <p><span className="font-medium">Last Test:</span> {formatDateTime(selectedPatient.lastTestDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryPatients
