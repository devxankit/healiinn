import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoShareSocialOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoSearchOutline,
  IoPeopleOutline,
  IoStar,
  IoStarOutline,
  IoInformationCircleOutline,
} from 'react-icons/io5'

const mockPrescriptions = [
  {
    id: 'presc-1',
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
    advice: 'Maintain a low-sodium diet and regular exercise. Monitor blood pressure daily.',
    followUpAt: '2025-02-10',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Rx Care Pharmacy'],
      laboratories: ['MediCare Diagnostics'],
    },
  },
  {
    id: 'presc-2',
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
    advice: 'Maintain good oral hygiene. Avoid hard foods for the next few days.',
    followUpAt: '2025-01-22',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['HealthHub Pharmacy'],
      laboratories: [],
    },
  },
  {
    id: 'presc-3',
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
    advice: 'Rest and stay hydrated. If symptoms persist, consult again.',
    followUpAt: null,
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Neighborhood Family Pharmacy'],
      laboratories: [],
    },
  },
]

const mockPharmacies = [
  {
    id: 'pharm-1',
    name: 'Rx Care Pharmacy',
    distance: '0.9 km',
    location: '123 Market Street, New York',
    rating: 4.8,
    phone: '+1-555-214-0098',
  },
  {
    id: 'pharm-2',
    name: 'HealthHub Pharmacy',
    distance: '1.5 km',
    location: '77 Elm Avenue, New York',
    rating: 4.6,
    phone: '+1-555-909-4433',
  },
  {
    id: 'pharm-3',
    name: 'Neighborhood Family Pharmacy',
    distance: '2.6 km',
    location: '452 Cedar Lane, New York',
    rating: 4.2,
    phone: '+1-555-712-0080',
  },
  {
    id: 'pharm-4',
    name: 'City Center Wellness Pharmacy',
    distance: '3.1 km',
    location: '15 Harbor Road, New York',
    rating: 4.9,
    phone: '+1-555-367-5511',
  },
]

const mockLabs = [
  {
    id: 'lab-1',
    name: 'MediCare Diagnostics',
    distance: '1.2 km',
    location: '123 Health Street, New York',
    rating: 4.8,
    phone: '+1-555-123-4567',
  },
  {
    id: 'lab-2',
    name: 'HealthFirst Lab',
    distance: '2.5 km',
    location: '456 Medical Avenue, New York',
    rating: 4.6,
    phone: '+1-555-234-5678',
  },
  {
    id: 'lab-3',
    name: 'Precision Labs',
    distance: '0.8 km',
    location: '789 Wellness Boulevard, New York',
    rating: 4.9,
    phone: '+1-555-345-6789',
  },
  {
    id: 'lab-4',
    name: 'City Lab Center',
    distance: '3.1 km',
    location: '321 Diagnostic Road, New York',
    rating: 4.5,
    phone: '+1-555-456-7890',
  },
]

const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Alana Rueter',
    specialty: 'Dentist',
    distance: '1.2 km',
    location: 'Sunrise Dental Care, New York',
    rating: 4.8,
    consultationFee: 500,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-2',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic',
    distance: '3.1 km',
    location: 'Bone & Joint Clinic, New York',
    rating: 4.7,
    consultationFee: 750,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Chen',
    specialty: 'Neurology',
    distance: '1.8 km',
    location: 'Neuro Care Institute, New York',
    rating: 4.6,
    consultationFee: 900,
    image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-4',
    name: 'Dr. Michael Brown',
    specialty: 'General Medicine',
    distance: '0.9 km',
    location: 'Family Health Clinic, New York',
    rating: 4.9,
    consultationFee: 600,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
  },
]

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-3 w-3 text-amber-400" />)
  }

  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-3 w-3 text-amber-400" />)
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<IoStarOutline key={`empty-${i}`} className="h-3 w-3 text-slate-300" />)
  }

  return stars
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const PatientPrescriptions = () => {
  const navigate = useNavigate()
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharePrescriptionId, setSharePrescriptionId] = useState(null)
  const [selectedPharmacies, setSelectedPharmacies] = useState([])
  const [selectedLabs, setSelectedLabs] = useState([])
  const [selectedDoctors, setSelectedDoctors] = useState([])
  const [shareSearchTerm, setShareSearchTerm] = useState('')
  const [shareTab, setShareTab] = useState('pharmacy') // 'pharmacy', 'laboratory', or 'doctor'
  const [isSharing, setIsSharing] = useState(false)

  const filteredPrescriptions = mockPrescriptions.filter((presc) => {
    if (filter === 'all') return true
    return presc.status === filter
  })

  const currentPrescription = mockPrescriptions.find((p) => p.id === sharePrescriptionId)

  const filteredPharmacies = mockPharmacies.filter((pharmacy) => {
    const search = shareSearchTerm.toLowerCase()
    return (
      pharmacy.name.toLowerCase().includes(search) ||
      pharmacy.location.toLowerCase().includes(search)
    )
  })

  const filteredLabs = mockLabs.filter((lab) => {
    const search = shareSearchTerm.toLowerCase()
    return (
      lab.name.toLowerCase().includes(search) ||
      lab.location.toLowerCase().includes(search)
    )
  })

  const filteredDoctors = mockDoctors.filter((doctor) => {
    const search = shareSearchTerm.toLowerCase()
    return (
      doctor.name.toLowerCase().includes(search) ||
      doctor.specialty.toLowerCase().includes(search) ||
      doctor.location.toLowerCase().includes(search)
    )
  })

  useEffect(() => {
    if (showShareModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showShareModal])

  const handleShareClick = (prescriptionId) => {
    setSharePrescriptionId(prescriptionId)
    setSelectedPharmacies([])
    setSelectedLabs([])
    setSelectedDoctors([])
    setShareSearchTerm('')
    setShareTab('pharmacy')
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
    setSharePrescriptionId(null)
    setSelectedPharmacies([])
    setSelectedLabs([])
    setSelectedDoctors([])
    setShareSearchTerm('')
  }

  const handleDownloadPDF = (prescription) => {
    if (prescription.pdfUrl && prescription.pdfUrl !== '#') {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = prescription.pdfUrl
      link.download = `prescription-${prescription.doctor.name.replace(/\s+/g, '-')}-${prescription.issuedAt}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // If no PDF URL, show alert (in real app, this would generate/download from API)
      alert('PDF is being generated. Please try again in a moment.')
    }
  }

  const handleViewPDF = (prescription) => {
    if (prescription.pdfUrl && prescription.pdfUrl !== '#') {
      // Open PDF in new tab
      window.open(prescription.pdfUrl, '_blank')
    } else {
      // If no PDF URL, show alert (in real app, this would generate/view from API)
      alert('PDF is not available yet. Please try again later.')
    }
  }

  const togglePharmacySelection = (pharmacyId) => {
    setSelectedPharmacies((prev) => {
      if (prev.includes(pharmacyId)) {
        return prev.filter((id) => id !== pharmacyId)
      }
      return [...prev, pharmacyId]
    })
  }

  const toggleLabSelection = (labId) => {
    setSelectedLabs((prev) => {
      if (prev.includes(labId)) {
        return prev.filter((id) => id !== labId)
      }
      return [...prev, labId]
    })
  }

  const toggleDoctorSelection = (doctorId) => {
    setSelectedDoctors((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId)
      }
      return [...prev, doctorId]
    })
  }

  const handleShare = async () => {
    if (selectedPharmacies.length === 0 && selectedLabs.length === 0 && selectedDoctors.length === 0) {
      return
    }

    setIsSharing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Sharing prescription:', {
      prescriptionId: sharePrescriptionId,
      pharmacies: selectedPharmacies,
      laboratories: selectedLabs,
      doctors: selectedDoctors,
    })
    setIsSharing(false)
    
    // If doctors are selected, navigate to first doctor's booking page
    if (selectedDoctors.length > 0) {
      const firstDoctorId = selectedDoctors[0]
      handleCloseShareModal()
      // Navigate to doctor details page with booking modal open
      navigate(`/patient/doctors/${firstDoctorId}?book=true`)
    } else {
      setTimeout(() => {
        handleCloseShareModal()
        // Show success message
      }, 1000)
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
        {[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
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

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No prescriptions found</p>
          <p className="mt-1 text-xs text-slate-500">Prescriptions shared by doctors will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }} />

              <div className="relative">
                {/* Doctor Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={prescription.doctor.image}
                    alt={prescription.doctor.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{prescription.doctor.name}</h3>
                    <p className="text-sm text-[#11496c]">{prescription.doctor.specialty}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          prescription.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {prescription.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <IoCalendarOutline className="h-3 w-3" />
                        <span>Issued {formatDate(prescription.issuedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(prescription)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewPDF(prescription)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="View PDF"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareClick(prescription.id)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="Share prescription"
                  >
                    <IoShareSocialOutline className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && currentPrescription && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseShareModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Share Prescription</h2>
                <p className="text-sm text-slate-600">
                  {currentPrescription.doctor.name} - {currentPrescription.doctor.specialty}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-center border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setShareTab('pharmacy')}
                className={`relative flex items-center justify-center p-4 transition group ${
                  shareTab === 'pharmacy'
                    ? 'border-b-2 border-[#11496c] bg-white text-[#11496c]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <IoBagHandleOutline className="h-5 w-5" />
                {shareTab === 'pharmacy' && selectedPharmacies.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                    {selectedPharmacies.length}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="relative rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shadow-lg">
                    Pharmacies
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShareTab('laboratory')}
                className={`relative flex items-center justify-center p-4 transition group ${
                  shareTab === 'laboratory'
                    ? 'border-b-2 border-[#11496c] bg-white text-[#11496c]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <IoFlaskOutline className="h-5 w-5" />
                {shareTab === 'laboratory' && selectedLabs.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                    {selectedLabs.length}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="relative rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shadow-lg">
                    Laboratories
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShareTab('doctor')}
                className={`relative flex items-center justify-center p-4 transition group ${
                  shareTab === 'doctor'
                    ? 'border-b-2 border-[#11496c] bg-white text-[#11496c]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <IoPeopleOutline className="h-5 w-5" />
                {shareTab === 'doctor' && selectedDoctors.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                    {selectedDoctors.length}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="relative rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shadow-lg">
                    Doctors
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IoSearchOutline className="h-5 w-5" />
                </span>
                <input
                  type="search"
                  placeholder={`Search ${shareTab === 'pharmacy' ? 'pharmacies' : shareTab === 'laboratory' ? 'laboratories' : 'doctors'}...`}
                  value={shareSearchTerm}
                  onChange={(e) => setShareSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {shareTab === 'pharmacy' ? (
                <div className="space-y-3">
                  {filteredPharmacies.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-600">No pharmacies found</p>
                    </div>
                  ) : (
                    filteredPharmacies.map((pharmacy) => {
                      const isSelected = selectedPharmacies.includes(pharmacy.id)
                      return (
                        <button
                          key={pharmacy.id}
                          type="button"
                          onClick={() => togglePharmacySelection(pharmacy.id)}
                          className={`w-full flex items-center justify-between rounded-xl border-2 p-4 transition text-left ${
                            isSelected
                              ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                isSelected ? 'bg-[#11496c] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <IoBagHandleOutline className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900">{pharmacy.name}</h4>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                                <IoLocationOutline className="h-3 w-3" />
                                <span>{pharmacy.location}</span>
                                <span className="font-semibold">{pharmacy.distance}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : shareTab === 'laboratory' ? (
                <div className="space-y-3">
                  {filteredLabs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-600">No laboratories found</p>
                    </div>
                  ) : (
                    filteredLabs.map((lab) => {
                      const isSelected = selectedLabs.includes(lab.id)
                      return (
                        <button
                          key={lab.id}
                          type="button"
                          onClick={() => toggleLabSelection(lab.id)}
                          className={`w-full flex items-center justify-between rounded-xl border-2 p-4 transition text-left ${
                            isSelected
                              ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                isSelected ? 'bg-[#11496c] text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <IoFlaskOutline className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900">{lab.name}</h4>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                                <IoLocationOutline className="h-3 w-3" />
                                <span>{lab.location}</span>
                                <span className="font-semibold">{lab.distance}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Info Banner */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <IoInformationCircleOutline className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-900">Note</p>
                        <p className="text-xs text-amber-800 mt-1">
                          Doctors will need to book an appointment to view this prescription.
                        </p>
                      </div>
                    </div>
                  </div>

                  {filteredDoctors.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-600">No doctors found</p>
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => {
                      const isSelected = selectedDoctors.includes(doctor.id)
                      return (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => toggleDoctorSelection(doctor.id)}
                          className={`w-full flex items-center justify-between rounded-xl border-2 p-4 transition text-left ${
                            isSelected
                              ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className={`h-12 w-12 rounded-xl object-cover ring-2 bg-slate-100 ${
                                isSelected ? 'ring-[#11496c]' : 'ring-slate-200'
                              }`}
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-slate-900">{doctor.name}</h4>
                              <p className="text-xs text-[#11496c] mt-0.5">{doctor.specialty}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                                <IoLocationOutline className="h-3 w-3" />
                                <span>{doctor.location}</span>
                                <span className="font-semibold">{doctor.distance}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1">
                                {renderStars(doctor.rating)}
                                <span className="text-xs font-semibold text-slate-700 ml-1">{doctor.rating}</span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">
                  {selectedPharmacies.length + selectedLabs.length + selectedDoctors.length} selected
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPharmacies([])
                    setSelectedLabs([])
                    setSelectedDoctors([])
                  }}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Clear All
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseShareModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={selectedPharmacies.length === 0 && selectedLabs.length === 0 && selectedDoctors.length === 0 || isSharing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <IoShareSocialOutline className="h-4 w-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PatientPrescriptions

