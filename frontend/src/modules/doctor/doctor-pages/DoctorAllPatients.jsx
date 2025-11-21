import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoMedicalOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoAddOutline,
} from 'react-icons/io5'

// Mock data for all patients with their history
const mockAllPatients = [
  {
    id: 'pat-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    age: 45,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    patientPhone: '+1-555-987-6543',
    patientEmail: 'john.doe@example.com',
    patientAddress: '456 Patient Street, New York, NY 10002',
    firstVisit: '2020-03-15',
    lastVisit: '2025-01-15',
    totalVisits: 12,
    patientType: 'returning', // 'new' or 'returning'
    totalConsultations: 12,
    lastDiagnosis: 'Hypertension follow-up',
    status: 'active',
  },
  {
    id: 'pat-2',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    age: 32,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'sarah.smith@example.com',
    patientAddress: '789 Health Avenue, New York, NY 10003',
    firstVisit: '2024-12-10',
    lastVisit: '2025-01-14',
    totalVisits: 3,
    patientType: 'returning',
    totalConsultations: 3,
    lastDiagnosis: 'Chest pain evaluation',
    status: 'active',
  },
  {
    id: 'pat-3',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    age: 28,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160',
    patientPhone: '+1-555-456-7890',
    patientEmail: 'mike.johnson@example.com',
    patientAddress: '321 Medical Lane, New York, NY 10004',
    firstVisit: '2021-06-20',
    lastVisit: '2025-01-10',
    totalVisits: 8,
    patientType: 'returning',
    totalConsultations: 8,
    lastDiagnosis: 'Diabetes management',
    status: 'active',
  },
  {
    id: 'pat-4',
    patientId: 'pat-4',
    patientName: 'Emily Brown',
    age: 55,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=f59e0b&color=fff&size=160',
    patientPhone: '+1-555-789-0123',
    patientEmail: 'emily.brown@example.com',
    patientAddress: '654 Clinic Road, New York, NY 10005',
    firstVisit: '2023-09-05',
    lastVisit: '2024-12-20',
    totalVisits: 6,
    patientType: 'returning',
    totalConsultations: 6,
    lastDiagnosis: 'Arthritis consultation',
    status: 'active',
  },
  {
    id: 'pat-5',
    patientId: 'pat-5',
    patientName: 'David Wilson',
    age: 38,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=8b5cf6&color=fff&size=160',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'david.wilson@example.com',
    patientAddress: '987 Wellness Drive, New York, NY 10006',
    firstVisit: '2025-01-10',
    lastVisit: '2025-01-10',
    totalVisits: 1,
    patientType: 'new',
    totalConsultations: 1,
    lastDiagnosis: 'Annual checkup',
    status: 'active',
  },
  {
    id: 'pat-6',
    patientId: 'pat-6',
    patientName: 'Lisa Anderson',
    age: 42,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=ef4444&color=fff&size=160',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'lisa.anderson@example.com',
    patientAddress: '147 Care Street, New York, NY 10007',
    firstVisit: '2022-04-18',
    lastVisit: '2024-11-15',
    totalVisits: 5,
    patientType: 'returning',
    totalConsultations: 5,
    lastDiagnosis: 'Prescription provided',
    status: 'inactive',
  },
]

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DoctorAllPatients = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState(mockAllPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'new', 'returning'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'

  // Filter patients based on search and filters
  const filteredPatients = useMemo(() => {
    let filtered = patients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.patientPhone.includes(searchTerm) ||
          patient.patientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Patient type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((patient) => patient.patientType === filterType)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((patient) => patient.status === filterStatus)
    }

    return filtered
  }, [patients, searchTerm, filterType, filterStatus])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: patients.length,
      new: patients.filter((p) => p.patientType === 'new').length,
      returning: patients.filter((p) => p.patientType === 'returning').length,
      active: patients.filter((p) => p.status === 'active').length,
      inactive: patients.filter((p) => p.status === 'inactive').length,
    }
  }, [patients])

  const handleViewPatient = (patient) => {
    // Navigate to consultations page with this patient
    navigate('/doctor/consultations', {
      state: {
        selectedConsultation: {
          id: `cons-${patient.id}`,
          patientId: patient.patientId,
          patientName: patient.patientName,
          age: patient.age,
          gender: patient.gender,
          appointmentTime: new Date().toISOString(),
          appointmentType: patient.patientType === 'new' ? 'New' : 'Follow-up',
          status: 'in-progress',
          reason: patient.lastDiagnosis || 'Consultation',
          patientImage: patient.patientImage,
          patientPhone: patient.patientPhone,
          patientEmail: patient.patientEmail,
          patientAddress: patient.patientAddress,
          diagnosis: '',
          vitals: {},
          medications: [],
          investigations: [],
          advice: '',
          attachments: [],
        },
      },
    })
  }

  return (
    <>
      <DoctorNavbar />
      <section className="flex flex-col gap-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Patients</h1>
            <p className="text-sm text-slate-600">{stats.total} total patients</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1">New</p>
            <p className="text-xl font-bold text-emerald-900">{stats.new}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-blue-700 mb-1">Returning</p>
            <p className="text-xl font-bold text-blue-900">{stats.returning}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-slate-600 mb-1">Active</p>
            <p className="text-xl font-bold text-slate-900">{stats.active}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
            </span>
            <input
              type="search"
              placeholder="Search by name, phone, or email..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'all'
                  ? 'bg-[#11496c] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setFilterType('new')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'new'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              New Patients ({stats.new})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('returning')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterType === 'returning'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              Returning ({stats.returning})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === 'active'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
              }`}
            >
              Active ({stats.active})
            </button>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No patients found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#11496c]/30"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    {/* Patient Image */}
                    <img
                      src={patient.patientImage}
                      alt={patient.patientName}
                      className="h-16 w-16 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.patientName)}&background=3b82f6&color=fff&size=160`
                      }}
                    />

                    {/* Patient Name and Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{patient.patientName}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            patient.patientType === 'new'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {patient.patientType === 'new' ? 'New' : 'Returning'}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            patient.status === 'active'
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-400 text-white'
                          }`}
                        >
                          {patient.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {patient.age} years • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                      </p>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                        {patient.patientPhone && (
                          <div className="flex items-center gap-1">
                            <IoCallOutline className="h-3.5 w-3.5 text-slate-500" />
                            <span>{patient.patientPhone}</span>
                          </div>
                        )}
                        {patient.patientEmail && (
                          <div className="flex items-center gap-1">
                            <IoMailOutline className="h-3.5 w-3.5 text-slate-500" />
                            <span className="truncate max-w-[200px]">{patient.patientEmail}</span>
                          </div>
                        )}
                        {patient.patientAddress && (
                          <div className="flex items-center gap-1">
                            <IoLocationOutline className="h-3.5 w-3.5 text-slate-500" />
                            <span className="truncate max-w-[200px]">{patient.patientAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Visit History */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            <span className="font-semibold">First Visit:</span> {formatDate(patient.firstVisit)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            <span className="font-semibold">Last Visit:</span> {formatDate(patient.lastVisit)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoDocumentTextOutline className="h-3.5 w-3.5 text-slate-500" />
                          <span>
                            <span className="font-semibold">Total Visits:</span> {patient.totalVisits}
                          </span>
                        </div>
                        {patient.lastDiagnosis && (
                          <div className="flex items-center gap-1">
                            <IoMedicalOutline className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              <span className="font-semibold">Last Diagnosis:</span> {patient.lastDiagnosis}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleViewPatient(patient)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      <IoDocumentTextOutline className="h-4 w-4" />
                      View Records
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  )
}

export default DoctorAllPatients

