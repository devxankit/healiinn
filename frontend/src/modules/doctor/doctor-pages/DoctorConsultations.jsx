import { useState } from 'react'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoDocumentTextOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoAttachOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoBodyOutline,
  IoThermometerOutline,
  IoPulseOutline,
  IoWaterOutline,
} from 'react-icons/io5'

// Mock data
const mockConsultations = [
  {
    id: 'cons-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    age: 45,
    gender: 'male',
    appointmentTime: '2025-01-15T09:00:00',
    appointmentType: 'Follow-up',
    status: 'in-progress',
    reason: 'Hypertension follow-up',
    patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    diagnosis: '',
    vitals: {},
    medications: [],
    investigations: [],
    advice: '',
    attachments: [],
  },
]

const mockFullMedicalHistory = {
  'pat-1': {
    personalInfo: {
      name: 'John Doe',
      age: 45,
      gender: 'male',
      bloodGroup: 'O+',
      phone: '+1-555-123-4567',
      email: 'john.doe@example.com',
    },
    conditions: [
      { name: 'Hypertension', diagnosedDate: '2020-03-15', status: 'Active' },
      { name: 'Type 2 Diabetes', diagnosedDate: '2019-06-20', status: 'Active' },
    ],
    allergies: [{ name: 'Penicillin', severity: 'Moderate', reaction: 'Rash' }],
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', startDate: '2020-03-20' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', startDate: '2019-07-01' },
    ],
    surgeries: [
      { name: 'Appendectomy', date: '2010-05-10', hospital: 'City General Hospital' },
    ],
    previousConsultations: [
      {
        date: '2024-12-15',
        diagnosis: 'Hypertension',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Amlodipine 5mg'],
      },
      {
        date: '2024-11-20',
        diagnosis: 'Diabetes Management',
        doctor: 'Dr. Sarah Mitchell',
        medications: ['Metformin 500mg'],
      },
    ],
    labReports: [
      { testName: 'Blood Sugar Fasting', date: '2024-12-10', result: '110 mg/dL', status: 'Normal' },
      { testName: 'HbA1c', date: '2024-12-10', result: '6.8%', status: 'Elevated' },
    ],
  },
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const DoctorConsultations = () => {
  const [consultations, setConsultations] = useState(mockConsultations)
  const [selectedConsultation, setSelectedConsultation] = useState(consultations[0])
  const [activeTab, setActiveTab] = useState('vitals') // vitals, prescription, history, saved
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [showAddInvestigation, setShowAddInvestigation] = useState(false)
  const [savedPrescriptions, setSavedPrescriptions] = useState([])

  // Form states
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: '',
  })

  const [diagnosis, setDiagnosis] = useState('')
  const [medications, setMedications] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [advice, setAdvice] = useState('')
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })
  const [newInvestigation, setNewInvestigation] = useState({
    name: '',
    notes: '',
  })
  const [attachments, setAttachments] = useState([])

  const patientHistory = selectedConsultation
    ? mockFullMedicalHistory[selectedConsultation.patientId]
    : null

  const handleCalculateBMI = () => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = parseFloat(vitals.height) / 100
      const weightInKg = parseFloat(vitals.weight)
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
      setVitals({ ...vitals, bmi })
    }
  }

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setMedications([...medications, { ...newMedication, id: Date.now() }])
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
      setShowAddMedication(false)
    }
  }

  const handleRemoveMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id))
  }

  const handleAddInvestigation = () => {
    if (newInvestigation.name) {
      setInvestigations([...investigations, { ...newInvestigation, id: Date.now() }])
      setNewInvestigation({ name: '', notes: '' })
      setShowAddInvestigation(false)
    }
  }

  const handleRemoveInvestigation = (id) => {
    setInvestigations(investigations.filter((inv) => inv.id !== id))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }))
    setAttachments([...attachments, ...newAttachments])
  }

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((att) => att.id !== id))
  }

  const handleSavePrescription = async () => {
    if (!diagnosis) {
      alert('Please enter a diagnosis')
      return
    }

    if (medications.length === 0) {
      alert('Please add at least one medication')
      return
    }

    // Simulate API call
    const prescriptionData = {
      id: Date.now().toString(),
      consultationId: selectedConsultation.id,
      patientId: selectedConsultation.patientId,
      patientName: selectedConsultation.patientName,
      patientImage: selectedConsultation.patientImage,
      diagnosis,
      vitals,
      medications: [...medications],
      investigations: [...investigations],
      advice,
      attachments: attachments.map((att) => ({ name: att.name, type: att.type })),
      date: new Date().toISOString(),
      savedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    // Save prescription to state
    setSavedPrescriptions((prev) => [prescriptionData, ...prev])
    
    // Update consultation status
    setConsultations((prev) =>
      prev.map((cons) =>
        cons.id === selectedConsultation.id
          ? {
              ...cons,
              status: 'completed',
              diagnosis,
              vitals,
              medications,
              investigations,
              advice,
              attachments,
            }
          : cons
      )
    )

    // Reset form
    setDiagnosis('')
    setMedications([])
    setInvestigations([])
    setAdvice('')
    setAttachments([])
    setVitals({
      bloodPressure: { systolic: '', diastolic: '' },
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: '',
    })

    console.log('Prescription saved:', prescriptionData)
    alert('Prescription saved successfully!')
    
    // Switch to saved prescriptions tab
    setActiveTab('saved')
  }

  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
          {selectedConsultation ? (
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
              {/* Left Column - Patient Info & History */}
              <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                {/* Patient Card */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
                  <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                    <img
                      src={selectedConsultation.patientImage}
                      alt={selectedConsultation.patientName}
                      className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">{selectedConsultation.patientName}</h3>
                      <div className="mt-1 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-600">
                        <p>
                          {selectedConsultation.age} years • {selectedConsultation.gender}
                        </p>
                        <p className="flex items-center gap-1">
                          <IoTimeOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span className="truncate text-[10px] sm:text-xs">{formatDateTime(selectedConsultation.appointmentTime)}</span>
                        </p>
                      </div>
                      <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm font-medium text-slate-700 line-clamp-2">{selectedConsultation.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Full Medical History */}
                {patientHistory && (
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
                    <h3 className="mb-3 sm:mb-4 lg:mb-5 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-bold text-slate-900">
                      <IoMedicalOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] shrink-0" />
                      Medical History
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Conditions */}
                      <div>
                        <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Conditions
                        </p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {patientHistory.conditions.map((condition, idx) => (
                            <div key={idx} className="rounded-lg bg-slate-50 p-1.5 sm:p-2">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900">{condition.name}</p>
                              <p className="text-[10px] sm:text-xs text-slate-600">
                                Since {formatDate(condition.diagnosedDate)} • {condition.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold text-red-600 uppercase tracking-wide">Allergies</p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {patientHistory.allergies.map((allergy, idx) => (
                            <div key={idx} className="rounded-lg bg-red-50 p-1.5 sm:p-2">
                              <p className="text-xs sm:text-sm font-semibold text-red-900">{allergy.name}</p>
                              <p className="text-[10px] sm:text-xs text-red-700">
                                {allergy.severity} • {allergy.reaction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Current Medications */}
                      <div>
                        <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Current Medications
                        </p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {patientHistory.medications.map((med, idx) => (
                            <div key={idx} className="rounded-lg bg-emerald-50 p-1.5 sm:p-2">
                              <p className="text-xs sm:text-sm font-semibold text-emerald-900">{med.name}</p>
                              <p className="text-[10px] sm:text-xs text-emerald-700">
                                {med.dosage} • {med.frequency}
                              </p>
                              <p className="text-[10px] sm:text-xs text-emerald-600">Since {formatDate(med.startDate)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Previous Consultations */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Previous Consultations
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patientHistory.previousConsultations.map((consult, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2">
                              <p className="text-xs font-semibold text-slate-900">{consult.diagnosis}</p>
                              <p className="text-xs text-slate-600">{formatDate(consult.date)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lab Reports */}
                      <div>
                        <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Lab Reports
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patientHistory.labReports.map((report, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2">
                              <p className="text-xs font-semibold text-slate-900">{report.testName}</p>
                              <p className="text-xs text-slate-600">
                                {report.result} • {formatDate(report.date)}
                              </p>
                              <span
                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  report.status === 'Normal'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {report.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Consultation Form */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {/* Tabs */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch] pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vitals')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'vitals'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'vitals' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    Vitals & Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prescription')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'prescription'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'prescription' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'history'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'history' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 relative ${
                      activeTab === 'saved'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'saved' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    <span className="hidden sm:inline">Saved </span>Prescriptions
                    {savedPrescriptions.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] sm:text-xs font-bold text-white">
                        {savedPrescriptions.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Vitals & Examination Tab */}
                {activeTab === 'vitals' && (
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                    <h3 className="mb-3 sm:mb-4 lg:mb-5 text-sm sm:text-base lg:text-lg font-bold text-slate-900">Vitals & Examination</h3>
                    <div className="grid gap-2.5 sm:gap-3 lg:gap-4 sm:grid-cols-2">
                      {/* Blood Pressure */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoHeartOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
                          Blood Pressure
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.bloodPressure.systolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bloodPressure: { ...vitals.bloodPressure, systolic: e.target.value },
                              })
                            }
                            placeholder="Systolic"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-xs sm:text-sm text-slate-500">/</span>
                          <input
                            type="number"
                            value={vitals.bloodPressure.diastolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bloodPressure: { ...vitals.bloodPressure, diastolic: e.target.value },
                              })
                            }
                            placeholder="Diastolic"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">mmHg</span>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoThermometerOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                          Temperature
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.temperature}
                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            placeholder="98.6"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">°F</span>
                        </div>
                      </div>

                      {/* Pulse */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoPulseOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
                          Pulse Rate
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            placeholder="72"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">bpm</span>
                        </div>
                      </div>

                      {/* Respiratory Rate */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#11496c] shrink-0" />
                          Respiratory Rate
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.respiratoryRate}
                            onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                            placeholder="16"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">/min</span>
                        </div>
                      </div>

                      {/* Oxygen Saturation */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoWaterOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#11496c] shrink-0" />
                          SpO2
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.oxygenSaturation}
                            onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                            placeholder="98"
                            max="100"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">%</span>
                        </div>
                      </div>

                      {/* Weight */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 shrink-0" />
                          Weight
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.weight || ''}
                            onChange={(e) => {
                              const weightValue = e.target.value
                              setVitals((prev) => {
                                const updated = { ...prev, weight: weightValue }
                                if (updated.height && weightValue) {
                                  setTimeout(() => {
                                    const heightInMeters = parseFloat(updated.height) / 100
                                    const weightInKg = parseFloat(weightValue)
                                    if (heightInMeters > 0 && weightInKg > 0) {
                                      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
                                      setVitals((prevVitals) => ({ ...prevVitals, bmi }))
                                    }
                                  }, 100)
                                }
                                return updated
                              })
                            }}
                            placeholder="70"
                            min="0"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">kg</span>
                        </div>
                      </div>

                      {/* Height */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 shrink-0" />
                          Height
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.height || ''}
                            onChange={(e) => {
                              const heightValue = e.target.value
                              setVitals((prev) => {
                                const updated = { ...prev, height: heightValue }
                                if (updated.weight && heightValue) {
                                  setTimeout(() => {
                                    const heightInMeters = parseFloat(heightValue) / 100
                                    const weightInKg = parseFloat(updated.weight)
                                    if (heightInMeters > 0 && weightInKg > 0) {
                                      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
                                      setVitals((prevVitals) => ({ ...prevVitals, bmi }))
                                    }
                                  }, 100)
                                }
                                return updated
                              })
                            }}
                            placeholder="170"
                            min="0"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs text-slate-500">cm</span>
                        </div>
                      </div>

                      {/* BMI */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 shrink-0" />
                          BMI
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="text"
                            value={vitals.bmi || ''}
                            readOnly
                            placeholder="Auto calculated"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prescription Tab */}
                {activeTab === 'prescription' && (
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                    {/* Diagnosis */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900">Diagnosis *</label>
                      <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter diagnosis..."
                        className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                      />
                    </div>

                    {/* Medications */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Medications *</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddMedication(true)}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95 w-full sm:w-auto"
                        >
                          <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add </span>Medication
                        </button>
                      </div>

                      {medications.length === 0 ? (
                        <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No medications added</p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {medications.map((med) => (
                            <div
                              key={med.id}
                              className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{med.name}</p>
                                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-600">
                                  {med.dosage} • {med.frequency}
                                  {med.duration && ` • ${med.duration}`}
                                </p>
                                {med.instructions && (
                                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500 line-clamp-2">{med.instructions}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(med.id)}
                                className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              >
                                <IoTrashOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Investigations */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Investigations / Tests</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddInvestigation(true)}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 w-full sm:w-auto"
                        >
                          <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add </span>Test
                        </button>
                      </div>

                      {investigations.length === 0 ? (
                        <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No investigations added</p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {investigations.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{inv.name}</p>
                                {inv.notes && <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-600 line-clamp-2">{inv.notes}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvestigation(inv.id)}
                                className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              >
                                <IoTrashOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advice */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900">Advice</label>
                      <textarea
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        placeholder="Enter advice for patient..."
                        rows="3"
                        className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                      />
                    </div>

                    {/* Attachments */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Attachments</h3>
                        <label className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 w-full sm:w-auto">
                          <IoAttachOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Upload </span>Files
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                        </label>
                      </div>

                      {attachments.length === 0 ? (
                        <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No attachments</p>
                      ) : (
                        <div className="space-y-1.5 sm:space-y-2">
                          {attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2 sm:p-2.5 lg:p-3 hover:shadow-md transition-shadow"
                            >
                              <IoAttachOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-slate-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-1">{att.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                  {(att.size / 1024).toFixed(2)} KB • {att.type}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              >
                                <IoTrashOutline className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSavePrescription}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                      >
                        <IoCheckmarkCircleOutline className="h-5 w-5" />
                        Save Prescription
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved Prescriptions Tab */}
                {activeTab === 'saved' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Saved Prescriptions</h3>
                        <span className="rounded-full bg-[rgba(17,73,108,0.15)] px-3 py-1 text-xs font-semibold text-[#11496c]">
                          {savedPrescriptions.length} {savedPrescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
                        </span>
                      </div>

                      {savedPrescriptions.length === 0 ? (
                        <div className="py-12 text-center">
                          <IoDocumentTextOutline className="mx-auto h-16 w-16 text-slate-300" />
                          <p className="mt-4 text-sm font-medium text-slate-600">No saved prescriptions yet</p>
                          <p className="mt-1 text-xs text-slate-500">Prescriptions you save will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {savedPrescriptions.map((prescription) => (
                            <div
                              key={prescription.id}
                              className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-4">
                                <img
                                  src={prescription.patientImage}
                                  alt={prescription.patientName}
                                  className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-bold text-slate-900">{prescription.patientName}</h4>
                                      <p className="mt-1 text-xs text-slate-600">
                                        Saved on {prescription.savedAt}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                      Saved
                                    </span>
                                  </div>

                                  <div className="mt-4 space-y-3">
                                    {/* Diagnosis */}
                                    <div>
                                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                                        Diagnosis
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">{prescription.diagnosis}</p>
                                    </div>

                                    {/* Medications */}
                                    {prescription.medications.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                          Medications ({prescription.medications.length})
                                        </p>
                                        <div className="space-y-2">
                                          {prescription.medications.map((med, idx) => (
                                            <div
                                              key={idx}
                                              className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5"
                                            >
                                              <p className="text-sm font-semibold text-emerald-900">{med.name}</p>
                                              <p className="text-xs text-emerald-700">
                                                {med.dosage} • {med.frequency}
                                                {med.duration && ` • ${med.duration}`}
                                              </p>
                                              {med.instructions && (
                                                <p className="mt-1 text-xs text-emerald-600">{med.instructions}</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Investigations */}
                                    {prescription.investigations.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                          Investigations ({prescription.investigations.length})
                                        </p>
                                        <div className="space-y-2">
                                          {prescription.investigations.map((inv, idx) => (
                                            <div
                                              key={idx}
                                              className="rounded-lg bg-[rgba(17,73,108,0.1)] border border-[rgba(17,73,108,0.2)] p-2.5"
                                            >
                                              <p className="text-sm font-semibold text-[#0a2d3f]">{inv.name}</p>
                                              {inv.notes && (
                                                <p className="mt-1 text-xs text-[#11496c]">{inv.notes}</p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Advice */}
                                    {prescription.advice && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                                          Advice
                                        </p>
                                        <p className="text-sm text-slate-700">{prescription.advice}</p>
                                      </div>
                                    )}

                                    {/* Vitals */}
                                    {(prescription.vitals.bloodPressure.systolic ||
                                      prescription.vitals.temperature ||
                                      prescription.vitals.pulse) && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                          Vitals
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          {prescription.vitals.bloodPressure.systolic && (
                                            <div className="rounded-lg bg-slate-50 p-2">
                                              <p className="text-slate-600">BP</p>
                                              <p className="font-semibold text-slate-900">
                                                {prescription.vitals.bloodPressure.systolic}/
                                                {prescription.vitals.bloodPressure.diastolic} mmHg
                                              </p>
                                            </div>
                                          )}
                                          {prescription.vitals.temperature && (
                                            <div className="rounded-lg bg-slate-50 p-2">
                                              <p className="text-slate-600">Temp</p>
                                              <p className="font-semibold text-slate-900">
                                                {prescription.vitals.temperature}°F
                                              </p>
                                            </div>
                                          )}
                                          {prescription.vitals.pulse && (
                                            <div className="rounded-lg bg-slate-50 p-2">
                                              <p className="text-slate-600">Pulse</p>
                                              <p className="font-semibold text-slate-900">
                                                {prescription.vitals.pulse} bpm
                                              </p>
                                            </div>
                                          )}
                                          {prescription.vitals.bmi && (
                                            <div className="rounded-lg bg-slate-50 p-2">
                                              <p className="text-slate-600">BMI</p>
                                              <p className="font-semibold text-slate-900">{prescription.vitals.bmi}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Attachments */}
                                    {prescription.attachments.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                                          Attachments ({prescription.attachments.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {prescription.attachments.map((att, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5"
                                            >
                                              <IoAttachOutline className="h-4 w-4 text-slate-600" />
                                              <span className="text-xs font-medium text-slate-700">{att.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && patientHistory && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
                    <h3 className="mb-5 text-lg font-bold text-slate-900">Full Medical History</h3>
                    <div className="space-y-6">
                      {/* Personal Info */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Personal Information
                        </h4>
                        <div className="rounded-lg bg-slate-50 p-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-600">Blood Group</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {patientHistory.personalInfo.bloodGroup}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Phone</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {patientHistory.personalInfo.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Previous Consultations */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Previous Consultations
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {patientHistory.previousConsultations.map((consult, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{consult.diagnosis}</p>
                                  <p className="mt-1 text-xs text-slate-600">{formatDate(consult.date)}</p>
                                  <p className="mt-1 text-xs text-slate-600">Dr. {consult.doctor}</p>
                                  {consult.medications && consult.medications.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {consult.medications.map((med, medIdx) => (
                                        <span
                                          key={medIdx}
                                          className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                        >
                                          {med}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lab Reports */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Lab Reports
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {patientHistory.labReports.map((report, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{report.testName}</p>
                                  <p className="mt-1 text-sm text-slate-700">{report.result}</p>
                                  <p className="mt-1 text-xs text-slate-600">{formatDate(report.date)}</p>
                                  <span
                                    className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      report.status === 'Normal'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    {report.status}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#11496c] transition hover:bg-[rgba(17,73,108,0.1)]"
                                >
                                  <IoDownloadOutline className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No active consultation</p>
              <p className="mt-1 text-xs text-slate-500">Select a patient from the Patients tab to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMedication(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Medication</h2>
              <button
                type="button"
                onClick={() => setShowAddMedication(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Medication Name *</label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  placeholder="e.g., Amlodipine"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Dosage *</label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 5mg"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Frequency *</label>
                <input
                  type="text"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  placeholder="e.g., Once daily"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Duration</label>
                <input
                  type="text"
                  value={newMedication.duration}
                  onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                  placeholder="e.g., 30 days"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Instructions</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  placeholder="Additional instructions..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => setShowAddMedication(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Investigation Modal */}
      {showAddInvestigation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddInvestigation(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Investigation</h2>
              <button
                type="button"
                onClick={() => setShowAddInvestigation(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Test Name *</label>
                <input
                  type="text"
                  value={newInvestigation.name}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, name: e.target.value })}
                  placeholder="e.g., Blood Test, ECG"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Notes</label>
                <textarea
                  value={newInvestigation.notes}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => setShowAddInvestigation(false)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddInvestigation}
                disabled={!newInvestigation.name}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
          </div>
        </div>
      </div>
      )}
    </>
  )
}

export default DoctorConsultations
