import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoDocumentTextOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoLocationOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoArchiveOutline,
} from 'react-icons/io5'

// Current logged-in patient ID (in real app, this would come from auth context)
const CURRENT_PATIENT_ID = 'pat-1'

// Mock history data mapped by patient ID
const mockHistoryByPatient = {
  'pat-1': [
    // Prescriptions
    {
      id: 'presc-1',
      type: 'prescription',
      doctor: {
        name: 'Dr. Sarah Mitchell',
        specialty: 'Cardiology',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      issuedAt: '2025-01-10',
      status: 'active',
      diagnosis: 'Hypertension',
      medications: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
        { name: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '30 days' },
      ],
      investigations: [
        { name: 'ECG', notes: 'Routine checkup' },
        { name: 'Blood Pressure Monitoring', notes: 'Daily' },
      ],
    },
    {
      id: 'presc-2',
      type: 'prescription',
      doctor: {
        name: 'Dr. Alana Rueter',
        specialty: 'Dentist',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      },
      issuedAt: '2025-01-08',
      status: 'active',
      diagnosis: 'Dental Caries',
      medications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' },
        { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed for pain', duration: '5 days' },
      ],
      investigations: [],
    },
    {
      id: 'presc-3',
      type: 'prescription',
      doctor: {
        name: 'Dr. Michael Brown',
        specialty: 'General Medicine',
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
      },
      issuedAt: '2025-01-05',
      status: 'completed',
      diagnosis: 'Common Cold',
      medications: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '5 days' },
      ],
      investigations: [],
    },
    // Lab Tests
    {
      id: 'lab-1',
      type: 'lab_test',
      labName: 'MediCare Diagnostics',
      testName: 'Complete Blood Count (CBC)',
      status: 'completed',
      testDate: '2025-01-15',
      resultDate: '2025-01-16',
      amount: 1200,
      results: 'Normal',
      reportUrl: '#',
    },
    {
      id: 'lab-2',
      type: 'lab_test',
      labName: 'HealthLab Center',
      testName: 'ECG, Blood Pressure Monitoring',
      status: 'completed',
      testDate: '2025-01-13',
      resultDate: '2025-01-14',
      amount: 1500,
      results: 'Normal',
      reportUrl: '#',
    },
    {
      id: 'lab-3',
      type: 'lab_test',
      labName: 'MediCare Diagnostics',
      testName: 'Blood Glucose Test',
      status: 'completed',
      testDate: '2025-01-12',
      resultDate: '2025-01-13',
      amount: 800,
      results: '110 mg/dL (Normal)',
      reportUrl: '#',
    },
    // Orders
    {
      id: 'order-1',
      type: 'order',
      orderType: 'pharmacy',
      providerName: 'Rx Care Pharmacy',
      itemName: 'Amlodipine 5mg, Losartan 50mg',
      status: 'delivered',
      amount: 850,
      date: '2025-01-14',
      time: '02:15 PM',
    },
    {
      id: 'order-2',
      type: 'order',
      orderType: 'pharmacy',
      providerName: 'HealthHub Pharmacy',
      itemName: 'Amoxicillin 500mg, Ibuprofen 400mg',
      status: 'delivered',
      amount: 450,
      date: '2025-01-09',
      time: '11:30 AM',
    },
    // Appointments
    {
      id: 'apt-1',
      type: 'appointment',
      doctor: {
        name: 'Dr. Rajesh Kumar',
        specialty: 'General Physician',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      },
      clinic: 'Shivaji Nagar Clinic',
      date: '2025-01-15',
      time: '10:00 AM',
      status: 'completed',
      consultationFee: 500,
    },
    {
      id: 'apt-2',
      type: 'appointment',
      doctor: {
        name: 'Dr. Priya Sharma',
        specialty: 'Pediatrician',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      clinic: 'Central Hospital',
      date: '2025-01-16',
      time: '02:30 PM',
      status: 'completed',
      consultationFee: 600,
    },
  ],
}

// Helper function to get history for a patient
const getHistoryForPatient = (patientId) => {
  return mockHistoryByPatient[patientId] || []
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PatientHistory = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // all, prescription, lab_test, order, appointment

  // Get history for current logged-in patient
  const patientHistory = getHistoryForPatient(CURRENT_PATIENT_ID)

  // Sort by date (newest first)
  const sortedHistory = [...patientHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.testDate || a.issuedAt || 0)
    const dateB = new Date(b.date || b.testDate || b.issuedAt || 0)
    return dateB - dateA
  })

  const filteredHistory = sortedHistory.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'prescription') return item.type === 'prescription'
    if (filter === 'lab_test') return item.type === 'lab_test'
    if (filter === 'order') return item.type === 'order'
    if (filter === 'appointment') return item.type === 'appointment'
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'delivered':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      case 'pending':
        return <IoTimeOutline className="h-3 w-3" />
      case 'cancelled':
        return <IoCloseCircleOutline className="h-3 w-3" />
      default:
        return null
    }
  }

  // Show current patient's history
  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 overflow-x-auto">
        {[
          { value: 'all', label: 'All' },
          { value: 'prescription', label: 'Prescriptions' },
          { value: 'lab_test', label: 'Lab Tests' },
          { value: 'order', label: 'Orders' },
          { value: 'appointment', label: 'Appointments' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === tab.value
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={filter === tab.value ? { backgroundColor: '#11496c' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoArchiveOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No history found</p>
          <p className="mt-1 text-xs text-slate-500">Your {filter !== 'all' ? filter.replace('_', ' ') : 'medical'} history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }} />

              <div className="relative">
                {/* Prescription Card */}
                {item.type === 'prescription' && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoDocumentTextOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.doctor.name}</h3>
                          <p className="text-sm text-[#11496c] mb-1">{item.doctor.specialty}</p>
                          <p className="text-xs text-slate-600 mb-2">Diagnosis: {item.diagnosis}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.issuedAt)}</span>
                            </div>
                            {item.medications && item.medications.length > 0 && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span>{item.medications.length} medication(s)</span>
                              </>
                            )}
                            {item.investigations && item.investigations.length > 0 && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span>{item.investigations.length} test(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span>{item.status === 'active' ? 'Active' : 'Completed'}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/prescriptions`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lab Test Card */}
                {item.type === 'lab_test' && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoFlaskOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.testName}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.labName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>Test: {formatDate(item.testDate)}</span>
                            </div>
                            {item.resultDate && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>Result: {formatDate(item.resultDate)}</span>
                                </div>
                              </>
                            )}
                            {item.amount && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                              </>
                            )}
                          </div>
                          {item.results && (
                            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1 inline-block">
                              <span className="font-semibold">Results:</span> {item.results}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/reports`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Report
                        </button>
                        {item.reportUrl && (
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <IoDownloadOutline className="h-3 w-3" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Card */}
                {item.type === 'order' && (
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      item.orderType === 'lab' 
                        ? 'bg-[rgba(17,73,108,0.1)]' 
                        : 'bg-orange-100'
                    }`}>
                      {item.orderType === 'lab' ? (
                        <IoFlaskOutline className={`h-6 w-6 ${item.orderType === 'lab' ? 'text-[#11496c]' : 'text-orange-600'}`} />
                      ) : (
                        <IoBagHandleOutline className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.itemName}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.providerName}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            {item.time && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>{item.time}</span>
                                </div>
                              </>
                            )}
                            {item.amount && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.amount)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/orders`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Card */}
                {item.type === 'appointment' && (
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={item.doctor.image}
                        alt={item.doctor.name}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{item.doctor.name}</h3>
                          <p className="text-sm text-[#11496c] mb-1">{item.doctor.specialty}</p>
                          <p className="text-xs text-slate-600 mb-2">{item.clinic}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <IoCalendarOutline className="h-3 w-3" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            {item.time && (
                              <>
                                <span className="text-slate-400">•</span>
                                <div className="flex items-center gap-1">
                                  <IoTimeOutline className="h-3 w-3" />
                                  <span>{item.time}</span>
                                </div>
                              </>
                            )}
                            {item.consultationFee && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(item.consultationFee)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/appointments`)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <IoEyeOutline className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PatientHistory

