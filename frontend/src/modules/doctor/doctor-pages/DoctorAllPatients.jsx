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
  {
    id: 'pat-7',
    patientId: 'pat-7',
    patientName: 'Robert Taylor',
    age: 50,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=06b6d4&color=fff&size=160',
    patientPhone: '+1-555-567-8901',
    patientEmail: 'robert.taylor@example.com',
    patientAddress: '258 Health Boulevard, New York, NY 10008',
    firstVisit: '2019-08-22',
    lastVisit: '2025-01-12',
    totalVisits: 15,
    patientType: 'returning',
    totalConsultations: 15,
    lastDiagnosis: 'Cardiac evaluation',
    status: 'active',
  },
  {
    id: 'pat-8',
    patientId: 'pat-8',
    patientName: 'Jennifer Martinez',
    age: 29,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Jennifer+Martinez&background=a855f7&color=fff&size=160',
    patientPhone: '+1-555-678-9012',
    patientEmail: 'jennifer.martinez@example.com',
    patientAddress: '369 Medical Center, New York, NY 10009',
    firstVisit: '2024-10-05',
    lastVisit: '2025-01-08',
    totalVisits: 4,
    patientType: 'returning',
    totalConsultations: 4,
    lastDiagnosis: 'Pregnancy consultation',
    status: 'active',
  },
  {
    id: 'pat-9',
    patientId: 'pat-9',
    patientName: 'James White',
    age: 62,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=James+White&background=14b8a6&color=fff&size=160',
    patientPhone: '+1-555-789-0123',
    patientEmail: 'james.white@example.com',
    patientAddress: '741 Wellness Park, New York, NY 10010',
    firstVisit: '2020-11-30',
    lastVisit: '2025-01-05',
    totalVisits: 20,
    patientType: 'returning',
    totalConsultations: 20,
    lastDiagnosis: 'Hypertension monitoring',
    status: 'active',
  },
  {
    id: 'pat-10',
    patientId: 'pat-10',
    patientName: 'Amanda Davis',
    age: 35,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Amanda+Davis&background=f97316&color=fff&size=160',
    patientPhone: '+1-555-890-1234',
    patientEmail: 'amanda.davis@example.com',
    patientAddress: '852 Care Avenue, New York, NY 10011',
    firstVisit: '2024-09-15',
    lastVisit: '2024-12-28',
    totalVisits: 7,
    patientType: 'returning',
    totalConsultations: 7,
    lastDiagnosis: 'Migraine treatment',
    status: 'active',
  },
  {
    id: 'pat-11',
    patientId: 'pat-11',
    patientName: 'Christopher Lee',
    age: 41,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Christopher+Lee&background=6366f1&color=fff&size=160',
    patientPhone: '+1-555-901-2345',
    patientEmail: 'christopher.lee@example.com',
    patientAddress: '963 Health Plaza, New York, NY 10012',
    firstVisit: '2025-01-18',
    lastVisit: '2025-01-18',
    totalVisits: 1,
    patientType: 'new',
    totalConsultations: 1,
    lastDiagnosis: 'General checkup',
    status: 'active',
  },
  {
    id: 'pat-12',
    patientId: 'pat-12',
    patientName: 'Michelle Garcia',
    age: 48,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Michelle+Garcia&background=ec4899&color=fff&size=160',
    patientPhone: '+1-555-012-3456',
    patientEmail: 'michelle.garcia@example.com',
    patientAddress: '159 Medical Way, New York, NY 10013',
    firstVisit: '2021-03-10',
    lastVisit: '2024-10-20',
    totalVisits: 9,
    patientType: 'returning',
    totalConsultations: 9,
    lastDiagnosis: 'Thyroid function test',
    status: 'inactive',
  },
  {
    id: 'pat-13',
    patientId: 'pat-13',
    patientName: 'Daniel Rodriguez',
    age: 33,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Daniel+Rodriguez&background=10b981&color=fff&size=160',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'daniel.rodriguez@example.com',
    patientAddress: '357 Wellness Circle, New York, NY 10014',
    firstVisit: '2024-11-25',
    lastVisit: '2025-01-16',
    totalVisits: 5,
    patientType: 'returning',
    totalConsultations: 5,
    lastDiagnosis: 'Sports injury follow-up',
    status: 'active',
  },
  {
    id: 'pat-14',
    patientId: 'pat-14',
    patientName: 'Nicole Thompson',
    age: 27,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Nicole+Thompson&background=f59e0b&color=fff&size=160',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'nicole.thompson@example.com',
    patientAddress: '468 Health Street, New York, NY 10015',
    firstVisit: '2024-12-01',
    lastVisit: '2025-01-11',
    totalVisits: 3,
    patientType: 'returning',
    totalConsultations: 3,
    lastDiagnosis: 'Skin condition treatment',
    status: 'active',
  },
  {
    id: 'pat-15',
    patientId: 'pat-15',
    patientName: 'Kevin Moore',
    age: 56,
    gender: 'male',
    patientImage: 'https://ui-avatars.com/api/?name=Kevin+Moore&background=8b5cf6&color=fff&size=160',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'kevin.moore@example.com',
    patientAddress: '579 Care Boulevard, New York, NY 10016',
    firstVisit: '2018-05-14',
    lastVisit: '2025-01-09',
    totalVisits: 18,
    patientType: 'returning',
    totalConsultations: 18,
    lastDiagnosis: 'Cholesterol management',
    status: 'active',
  },
  {
    id: 'pat-16',
    patientId: 'pat-16',
    patientName: 'Rachel Clark',
    age: 39,
    gender: 'female',
    patientImage: 'https://ui-avatars.com/api/?name=Rachel+Clark&background=ef4444&color=fff&size=160',
    patientPhone: '+1-555-456-7890',
    patientEmail: 'rachel.clark@example.com',
    patientAddress: '680 Medical Drive, New York, NY 10017',
    firstVisit: '2023-01-20',
    lastVisit: '2024-09-10',
    totalVisits: 6,
    patientType: 'returning',
    totalConsultations: 6,
    lastDiagnosis: 'Allergy consultation',
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
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          <button
            onClick={() => {
              setFilterStatus('all')
            }}
            className={`rounded-xl border p-3 lg:p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              filterStatus === 'all'
                ? 'border-[#11496c] bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white lg:shadow-xl'
                : 'border-slate-200 bg-white hover:border-[#11496c]/30 hover:bg-slate-50'
            }`}
          >
            <p className={`text-[10px] lg:text-sm font-semibold uppercase mb-1.5 lg:mb-2 ${
              filterStatus === 'all' ? 'text-white/90' : 'text-slate-600'
            }`}>Total</p>
            <p className={`text-xl lg:text-4xl font-bold transition-all duration-300 ${
              filterStatus === 'all' ? 'text-white' : 'text-slate-900'
            }`}>{stats.total}</p>
          </button>
          <button
            onClick={() => {
              setFilterStatus('active')
            }}
            className={`rounded-xl border p-3 lg:p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              filterStatus === 'active'
                ? 'border-emerald-600 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white lg:shadow-xl'
                : 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <p className={`text-[10px] lg:text-sm font-semibold uppercase mb-1.5 lg:mb-2 ${
              filterStatus === 'active' ? 'text-white/90' : 'text-emerald-700'
            }`}>Active</p>
            <p className={`text-xl lg:text-4xl font-bold transition-all duration-300 ${
              filterStatus === 'active' ? 'text-white' : 'text-emerald-900'
            }`}>{stats.active}</p>
          </button>
          <button
            onClick={() => {
              setFilterStatus('inactive')
            }}
            className={`rounded-xl border p-3 lg:p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              filterStatus === 'inactive'
                ? 'border-slate-600 bg-gradient-to-br from-slate-600 to-slate-700 text-white lg:shadow-xl'
                : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <p className={`text-[10px] lg:text-sm font-semibold uppercase mb-1.5 lg:mb-2 ${
              filterStatus === 'inactive' ? 'text-white/90' : 'text-slate-600'
            }`}>Inactive</p>
            <p className={`text-xl lg:text-4xl font-bold transition-all duration-300 ${
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
        <div className="space-y-3 lg:grid lg:grid-cols-6 lg:gap-4 lg:space-y-0">
          {filteredPatients.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm lg:col-span-6">
              <IoPeopleOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No patients found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-[#11496c]/50 hover:scale-105 lg:flex lg:flex-col lg:group"
              >
                {/* Top Row: Profile Image + Name (Left) and Active Status (Right) */}
                <div className="flex items-start justify-between mb-3 lg:mb-3">
                  {/* Left Side: Profile Image + Name */}
                  <div className="flex items-center gap-2.5 lg:gap-3 flex-1 min-w-0">
                    {/* Profile Image - Left Top */}
                    <img
                      src={patient.patientImage}
                      alt={patient.patientName}
                      className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0 transition-all duration-300 group-hover:ring-[#11496c]/30 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.patientName)}&background=3b82f6&color=fff&size=160`
                      }}
                    />
                    
                    {/* Name - Heading next to Profile */}
                    <h3 className="text-sm lg:text-base font-bold text-slate-900 group-hover:text-[#11496c] transition-colors duration-300 break-words">{patient.patientName}</h3>
                  </div>

                  {/* Right Side: Active Status */}
                  <span
                    className={`rounded-full px-2 py-0.5 lg:px-2 lg:py-0.5 text-[8px] lg:text-[9px] font-semibold shrink-0 transition-all duration-300 group-hover:scale-105 ${
                      patient.status === 'active'
                        ? 'bg-green-500 text-white group-hover:bg-green-600'
                        : 'bg-slate-400 text-white group-hover:bg-slate-500'
                    }`}
                  >
                    {patient.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Patient Info - Below Top Row */}
                <div className="flex flex-col lg:flex-1">
                  <p className="text-xs lg:text-sm text-slate-600 mb-2.5 lg:mb-3">
                    {patient.age} years • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-1.5 lg:space-y-1.5 text-[11px] lg:text-xs text-slate-600 mb-2.5 lg:mb-3">
                    {patient.patientPhone && (
                      <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                        <IoCallOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 shrink-0 transition-colors duration-300 group-hover:text-[#11496c]" />
                        <span className="truncate">{patient.patientPhone}</span>
                      </div>
                    )}
                    {patient.patientEmail && (
                      <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                        <IoMailOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 shrink-0 transition-colors duration-300 group-hover:text-[#11496c]" />
                        <span className="truncate">{patient.patientEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Visit History */}
                  <div className="flex flex-wrap items-center gap-2.5 lg:gap-3 text-[11px] lg:text-xs text-slate-600 mb-3 lg:mb-4">
                    <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                      <IoTimeOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 shrink-0 transition-colors duration-300 group-hover:text-[#11496c]" />
                      <span>Last: {formatDate(patient.lastVisit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                      <IoDocumentTextOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 shrink-0 transition-colors duration-300 group-hover:text-[#11496c]" />
                      <span>Visits: {patient.totalVisits}</span>
                    </div>
                    {patient.lastDiagnosis && (
                      <div className="flex items-center gap-1.5 transition-colors duration-300 group-hover:text-[#11496c]">
                        <IoMedicalOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400 shrink-0 transition-colors duration-300 group-hover:text-[#11496c]" />
                        <span className="truncate">{patient.lastDiagnosis}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Full Width */}
                  <button
                    type="button"
                    onClick={() => handleViewPatient(patient)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#0d3a52] hover:shadow-lg hover:scale-105 active:scale-95 mt-auto"
                  >
                    <IoDocumentTextOutline className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
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

