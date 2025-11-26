import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoCallOutline,
  IoMailOutline,
  IoMedicalOutline,
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

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((patient) => patient.status === filterStatus)
    }

    return filtered
  }, [patients, searchTerm, filterStatus])

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
    // Load saved prescription data for this patient from localStorage
    let savedPrescriptionData = null
    try {
      const patientPrescriptionsKey = `patientPrescriptions_${patient.patientId}`
      const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
      
      // Get the most recent prescription for this patient
      if (patientPrescriptions.length > 0) {
        savedPrescriptionData = patientPrescriptions[0]
      }
    } catch (error) {
      console.error('Error loading prescription data:', error)
    }
    
    // Load saved consultation data from localStorage
    let savedConsultationData = null
    try {
      const savedConsultations = JSON.parse(localStorage.getItem('doctorConsultations') || '[]')
      savedConsultationData = savedConsultations.find((c) => c.patientId === patient.patientId)
    } catch (error) {
      console.error('Error loading consultation data:', error)
    }
    
    // Merge saved data with patient data
    const consultationData = {
      id: `cons-${patient.id}`,
      patientId: patient.patientId,
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      appointmentTime: savedConsultationData?.appointmentTime || patient.lastVisit || new Date().toISOString(),
      appointmentType: patient.patientType === 'new' ? 'New' : 'Follow-up',
      status: savedConsultationData?.status || 'completed',
      reason: patient.lastDiagnosis || 'Consultation',
      patientImage: patient.patientImage,
      patientPhone: patient.patientPhone,
      patientEmail: patient.patientEmail,
      patientAddress: patient.patientAddress,
      // Use saved prescription data if available
      diagnosis: savedPrescriptionData?.diagnosis || savedConsultationData?.diagnosis || '',
      symptoms: savedPrescriptionData?.symptoms || savedConsultationData?.symptoms || '',
      vitals: savedPrescriptionData?.vitals || savedConsultationData?.vitals || {},
      medications: savedPrescriptionData?.medications || savedConsultationData?.medications || [],
      investigations: savedPrescriptionData?.investigations || savedConsultationData?.investigations || [],
      advice: savedPrescriptionData?.advice || savedConsultationData?.advice || '',
      followUpDate: savedPrescriptionData?.followUpDate || savedConsultationData?.followUpDate || '',
      attachments: savedConsultationData?.attachments || [],
    }
    
    // Navigate to consultations page with this patient and loadSavedData flag
    navigate('/doctor/consultations', {
      state: {
        selectedConsultation: consultationData,
        loadSavedData: true, // Flag to indicate we should load saved data and bypass session check
      },
    })
  }

  return (
    <>
      <DoctorNavbar />
      <section className="flex flex-col gap-4 pb-24">

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => {
              setFilterStatus('all')
            }}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer ${
              filterStatus === 'all'
                ? 'border-[#11496c] bg-[#11496c] text-white'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase mb-1 ${
              filterStatus === 'all' ? 'text-white/80' : 'text-slate-600'
            }`}>Total</p>
            <p className={`text-xl font-bold ${
              filterStatus === 'all' ? 'text-white' : 'text-slate-900'
            }`}>{stats.total}</p>
          </button>
          <button
            onClick={() => {
              setFilterStatus('active')
            }}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer ${
              filterStatus === 'active'
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase mb-1 ${
              filterStatus === 'active' ? 'text-white/80' : 'text-emerald-700'
            }`}>Active</p>
            <p className={`text-xl font-bold ${
              filterStatus === 'active' ? 'text-white' : 'text-emerald-900'
            }`}>{stats.active}</p>
          </button>
          <button
            onClick={() => {
              setFilterStatus('inactive')
            }}
            className={`rounded-xl border p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer ${
              filterStatus === 'inactive'
                ? 'border-slate-600 bg-slate-600 text-white'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase mb-1 ${
              filterStatus === 'inactive' ? 'text-white/80' : 'text-slate-600'
            }`}>Inactive</p>
            <p className={`text-xl font-bold ${
              filterStatus === 'inactive' ? 'text-white' : 'text-slate-900'
            }`}>{stats.inactive}</p>
          </button>
        </div>

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
                className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[#11496c]/30"
              >
                {/* Top Row: Profile Image + Name (Left) and Active Status (Right) */}
                <div className="flex items-start justify-between mb-3">
                  {/* Left Side: Profile Image + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Profile Image - Left Top */}
                    <img
                      src={patient.patientImage}
                      alt={patient.patientName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.patientName)}&background=3b82f6&color=fff&size=160`
                      }}
                    />
                    
                    {/* Name - Heading next to Profile */}
                    <h3 className="text-lg font-bold text-slate-900">{patient.patientName}</h3>
                  </div>

                  {/* Right Side: Active Status */}
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shrink-0 ${
                      patient.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-400 text-white'
                    }`}
                  >
                    {patient.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Patient Info - Below Top Row */}
                <div className="flex flex-col">
                  <p className="text-sm text-slate-600 mb-3">
                    {patient.age} years • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    {patient.patientPhone && (
                      <div className="flex items-center gap-2">
                        <IoCallOutline className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{patient.patientPhone}</span>
                      </div>
                    )}
                    {patient.patientEmail && (
                      <div className="flex items-center gap-2">
                        <IoMailOutline className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{patient.patientEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Visit History */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Last: {formatDate(patient.lastVisit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IoDocumentTextOutline className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Visits: {patient.totalVisits}</span>
                    </div>
                    {patient.lastDiagnosis && (
                      <div className="flex items-center gap-1.5">
                        <IoMedicalOutline className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{patient.lastDiagnosis}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Full Width */}
                  <button
                    type="button"
                    onClick={() => handleViewPatient(patient)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDocumentTextOutline className="h-4 w-4" />
                    View Records
                  </button>
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

