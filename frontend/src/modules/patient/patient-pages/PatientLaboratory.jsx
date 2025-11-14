import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoFlaskOutline,
  IoDocumentTextOutline,
  IoCallOutline,
  IoArrowForwardOutline,
  IoPulseOutline,
  IoWaterOutline,
  IoMedicalOutline,
  IoHeartOutline,
  IoEyeOutline,
  IoBodyOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoCheckmarkCircle,
  IoCardOutline,
  IoPersonOutline,
  IoMailOutline,
  IoShareSocialOutline,
} from 'react-icons/io5'

const testCategories = [
  { id: 'all', label: 'All Tests', icon: IoFlaskOutline, color: 'blue' },
  { id: 'blood', label: 'Blood Tests', icon: IoPulseOutline, color: 'red' },
  { id: 'urine', label: 'Urine Tests', icon: IoWaterOutline, color: 'yellow' },
  { id: 'imaging', label: 'Imaging', icon: IoMedicalOutline, color: 'purple' },
  { id: 'cardiac', label: 'Cardiac', icon: IoHeartOutline, color: 'pink' },
  { id: 'vision', label: 'Vision', icon: IoEyeOutline, color: 'indigo' },
  { id: 'body', label: 'Body Scan', icon: IoBodyOutline, color: 'green' },
]

const mockLabs = [
  {
    id: 'lab-1',
    labName: 'MediCare Diagnostics',
    rating: 4.8,
    reviewCount: 234,
    distance: '1.2 km',
    location: '123 Health Street, New York',
    phone: '+1-555-123-4567',
    email: 'info@medicarediagnostics.com',
    availability: 'Available today',
    nextSlot: '10:00 AM',
    homeCollection: true,
    reportTime: '24 hours',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Complete Blood Count (CBC)', price: 350, category: 'blood' },
      { name: 'Lipid Profile', price: 450, category: 'blood' },
      { name: 'Liver Function Test', price: 600, category: 'blood' },
      { name: 'Urine Analysis', price: 200, category: 'urine' },
      { name: 'X-Ray Chest', price: 800, category: 'imaging' },
    ],
    timings: ['Mon – Sat · 7:00 AM – 8:00 PM', 'Sunday · 8:00 AM – 6:00 PM'],
    certifications: ['NABL Accredited', 'ISO 15189'],
  },
  {
    id: 'lab-2',
    labName: 'HealthFirst Lab',
    rating: 4.6,
    reviewCount: 189,
    distance: '2.5 km',
    location: '456 Medical Avenue, New York',
    phone: '+1-555-234-5678',
    email: 'contact@healthfirstlab.com',
    availability: 'Available tomorrow',
    nextSlot: '09:00 AM',
    homeCollection: true,
    reportTime: '48 hours',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Thyroid Function Test', price: 550, category: 'blood' },
      { name: 'Diabetes Panel', price: 750, category: 'blood' },
      { name: 'ECG', price: 400, category: 'cardiac' },
      { name: 'Ultrasound Abdomen', price: 1200, category: 'imaging' },
    ],
    timings: ['Mon – Fri · 8:00 AM – 7:00 PM', 'Saturday · 9:00 AM – 5:00 PM'],
    certifications: ['NABL Accredited'],
  },
  {
    id: 'lab-3',
    labName: 'Precision Labs',
    rating: 4.9,
    reviewCount: 312,
    distance: '0.8 km',
    location: '789 Wellness Boulevard, New York',
    phone: '+1-555-345-6789',
    email: 'info@precisionlabs.com',
    availability: 'Available today',
    nextSlot: '11:30 AM',
    homeCollection: true,
    reportTime: '12 hours',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Vitamin D Test', price: 650, category: 'blood' },
      { name: 'HbA1c', price: 500, category: 'blood' },
      { name: 'MRI Scan', price: 3500, category: 'imaging' },
      { name: 'CT Scan', price: 2800, category: 'imaging' },
      { name: 'Eye Examination', price: 600, category: 'vision' },
    ],
    timings: ['24/7 Emergency Services', 'Regular: Mon – Sat · 6:00 AM – 10:00 PM'],
    certifications: ['NABL Accredited', 'ISO 15189', 'CAP Certified'],
  },
  {
    id: 'lab-4',
    labName: 'City Lab Center',
    rating: 4.5,
    reviewCount: 156,
    distance: '3.1 km',
    location: '321 Diagnostic Road, New York',
    phone: '+1-555-456-7890',
    email: 'support@citylabcenter.com',
    availability: 'Available today',
    nextSlot: '02:00 PM',
    homeCollection: false,
    reportTime: '36 hours',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Kidney Function Test', price: 500, category: 'blood' },
      { name: 'Urine Culture', price: 400, category: 'urine' },
      { name: 'Stool Analysis', price: 300, category: 'body' },
    ],
    timings: ['Mon – Fri · 9:00 AM – 6:00 PM', 'Saturday · 9:00 AM – 4:00 PM'],
    certifications: ['NABL Accredited'],
  },
]

const mockReports = [
  {
    id: 'report-1',
    testName: 'Complete Blood Count (CBC)',
    labName: 'MediCare Diagnostics',
    date: '2025-01-10',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: 'report-2',
    testName: 'Lipid Profile',
    labName: 'HealthFirst Lab',
    date: '2025-01-08',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: 'report-3',
    testName: 'Thyroid Function Test',
    labName: 'Precision Labs',
    date: '2025-01-12',
    status: 'pending',
    downloadUrl: null,
  },
]

const mockUpcomingTests = [
  {
    id: 'test-1',
    testName: 'Liver Function Test',
    labName: 'MediCare Diagnostics',
    date: '2025-01-15',
    time: '10:00 AM',
    type: 'Home Collection',
    status: 'scheduled',
  },
  {
    id: 'test-2',
    testName: 'ECG',
    labName: 'HealthFirst Lab',
    date: '2025-01-16',
    time: '02:00 PM',
    type: 'Lab Visit',
    status: 'scheduled',
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Mock Prescriptions
const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: {
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-123-4567',
      email: 'sarah.mitchell@example.com',
    },
    issuedAt: '2025-01-10',
    status: 'active',
    diagnosis: 'Hypertension',
  },
  {
    id: 'presc-2',
    doctor: {
      name: 'Dr. Alana Rueter',
      specialty: 'Dentist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-234-5678',
      email: 'alana.rueter@example.com',
    },
    issuedAt: '2025-01-08',
    status: 'active',
    diagnosis: 'Dental Caries',
  },
  {
    id: 'presc-3',
    doctor: {
      name: 'Dr. Michael Brown',
      specialty: 'General Medicine',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-345-6789',
      email: 'michael.brown@example.com',
    },
    issuedAt: '2025-01-05',
    status: 'active',
    diagnosis: 'Common Cold',
  },
]

// Mock Patient Data
const mockPatientData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  bloodGroup: 'O+',
  address: {
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
  },
}

const PatientLaboratory = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [showHomeCollection, setShowHomeCollection] = useState('all')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [collectionType, setCollectionType] = useState('lab') // 'lab' or 'home'
  const [bookingStep, setBookingStep] = useState(1) // 1: Prescription, 2: Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailLabId, setDetailLabId] = useState(null)

  const detailLab = useMemo(
    () => mockLabs.find((lab) => lab.id === detailLabId) || null,
    [detailLabId]
  )

  const filteredLabs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return mockLabs
      .filter((lab) => {
        if (showHomeCollection === 'home' && !lab.homeCollection) return false
        if (showHomeCollection === 'lab' && lab.homeCollection) return false

        if (normalizedSearch) {
          const searchableText = [
            lab.labName,
            lab.location,
            ...lab.testsOffered.map((t) => t.name),
            ...lab.certifications,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(normalizedSearch)
        }

        if (selectedCategory !== 'all') {
          return lab.testsOffered.some((test) => test.category === selectedCategory)
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.rating - a.rating
        }
        if (sortBy === 'distance') {
          const aDist = parseFloat(a.distance.replace(' km', ''))
          const bDist = parseFloat(b.distance.replace(' km', ''))
          return aDist - bDist
        }
        return b.rating - a.rating
      })
  }, [searchTerm, selectedCategory, sortBy, showHomeCollection])

  useEffect(() => {
    if (showBookingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showBookingModal])

  useEffect(() => {
    if (!detailLab) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDetailLabId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailLab])

  const handleBookTest = (labId) => {
    const lab = mockLabs.find((l) => l.id === labId)
    if (lab) {
      setSelectedLab(lab)
      setSelectedPrescription(null)
      setCollectionType(lab.homeCollection ? 'home' : 'lab')
      setBookingStep(1)
      setShowBookingModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowBookingModal(false)
    setSelectedLab(null)
    setSelectedPrescription(null)
    setBookingStep(1)
  }

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedPrescription) {
      setBookingStep(2)
    }
  }

  const handlePreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1)
    }
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    // Simulate API call - Share prescription with lab including patient and doctor details
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Test booking confirmed and shared:', {
      labId: selectedLab.id,
      collectionType,
      prescription: selectedPrescription,
      patientDetails: mockPatientData,
      doctorDetails: selectedPrescription?.doctor,
    })
    setIsSubmitting(false)
    setTimeout(() => {
      handleCloseModal()
    }, 2000)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar - Outside Card */}
          <div className="relative">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
              </span>
              <input
                id="lab-search"
                type="search"
                placeholder="Search by lab name, test, or location..."
            className="w-full rounded-lg border border-blue-200/60 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-blue-300 hover:bg-white hover:shadow-md focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

      {/* Category Filters - Scrollable with Icons and Text */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
              {testCategories.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-sm shadow-blue-400/40'
                  : 'bg-white text-slate-700 border border-blue-200/60 hover:bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>

      {/* Home Collection / Lab Visit Filters */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHomeCollection('all')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'all'
                  ? 'border-blue-400 bg-blue-500 text-white shadow-sm shadow-blue-400/40'
              : 'border-blue-200/60 bg-white text-slate-700 hover:border-blue-300 hover:bg-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setShowHomeCollection('home')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'home'
                  ? 'border-blue-400 bg-blue-500 text-white shadow-sm shadow-blue-400/40'
              : 'border-blue-200/60 bg-white text-slate-700 hover:border-blue-300 hover:bg-white'
              }`}
            >
              Home Collection
            </button>
            <button
              type="button"
              onClick={() => setShowHomeCollection('lab')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'lab'
                  ? 'border-blue-400 bg-blue-500 text-white shadow-sm shadow-blue-400/40'
              : 'border-blue-200/60 bg-white text-slate-700 hover:border-blue-300 hover:bg-white'
              }`}
            >
              Lab Visit
            </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reports</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{mockReports.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{mockUpcomingTests.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Labs</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{filteredLabs.length}</p>
        </div>
      </div>

      {/* Recent Reports Section */}
      {mockReports.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              onClick={() => {
                // Navigate to reports page or show all reports
                // For now, scroll to reports section or could create a dedicated page
                const reportsSection = document.getElementById('reports-section')
                if (reportsSection) {
                  reportsSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {mockReports.slice(0, 2).map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{report.testName}</p>
                  <p className="text-xs text-slate-600">{report.labName}</p>
                  <p className="text-xs text-slate-500">{formatDate(report.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      report.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {report.status === 'completed' ? 'Ready' : 'Pending'}
                  </span>
                  {report.downloadUrl && (
                    <button
                      type="button"
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tests Section */}
      {mockUpcomingTests.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Tests</h2>
            <button
              type="button"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              onClick={() => {
                // Navigate to tests page or show all tests
                // For now, scroll to tests section or could create a dedicated page
                const testsSection = document.getElementById('tests-section')
                if (testsSection) {
                  testsSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {mockUpcomingTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{test.testName}</p>
                  <p className="text-xs text-slate-600">{test.labName}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <IoCalendarOutline className="h-3 w-3" />
                    <span>{formatDate(test.date)}</span>
                    <IoTimeOutline className="h-3 w-3 ml-2" />
                    <span>{test.time}</span>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
                  {test.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labs List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Available Laboratories</h2>
        <span className="text-sm text-slate-600">{filteredLabs.length} labs found</span>
      </div>

      {filteredLabs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No laboratories found matching your criteria.</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLabs.map((lab) => (
            <article
              key={lab.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{lab.labName}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-0.5">{renderStars(lab.rating)}</div>
                          <span className="text-xs font-semibold text-slate-700">{lab.rating}</span>
                          <span className="text-xs text-slate-500">({lab.reviewCount})</span>
                        </div>
                      </div>
                      {lab.homeCollection && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
                          Home Collection
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-600 sm:text-sm">
                      <div className="flex items-center gap-2">
                        <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{lab.location}</span>
                        <span className="shrink-0 font-semibold text-slate-700">{lab.distance}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="font-medium text-slate-700">{lab.availability}</span>
                        {lab.nextSlot && (
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            {lab.nextSlot}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <IoDocumentTextOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>Reports in {lab.reportTime}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {lab.certifications.slice(0, 2).map((cert) => (
                        <span
                          key={cert}
                          className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBookTest(lab.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95 sm:text-sm"
                  >
                    <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                    Book Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLabId(lab.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
                  >
                    View
                  </button>
                  <a
                    href={`tel:${lab.phone.replace(/[^+\d]/g, '')}`}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lab.labName} ${lab.location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <IoLocationOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedLab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Book Lab Test</h2>
                <p className="text-sm text-slate-600">{selectedLab.labName}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                      bookingStep >= step
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {bookingStep > step ? <IoCheckmarkCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 2 && (
                    <div
                      className={`h-1 w-12 transition ${
                        bookingStep > step ? 'bg-blue-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                      </div>
                    ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Select Tests & Prescription */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  {/* Collection Type */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">Collection Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCollectionType('lab')}
                        disabled={!selectedLab.homeCollection && collectionType === 'home'}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                          collectionType === 'lab'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${!selectedLab.homeCollection && collectionType === 'home' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            collectionType === 'lab'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoFlaskOutline className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Lab Visit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollectionType('home')}
                        disabled={!selectedLab.homeCollection}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                          collectionType === 'home'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${!selectedLab.homeCollection ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            collectionType === 'home'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoHomeOutline className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Home Collection</span>
                      </button>
                    </div>
                  </div>

                  {/* Select Prescription */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Select Prescription</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {mockPrescriptions.map((prescription) => {
                        const isSelected = selectedPrescription?.id === prescription.id
  return (
                          <button
                            key={prescription.id}
                            type="button"
                            onClick={() => setSelectedPrescription(prescription)}
                            className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 transition text-left ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={prescription.doctor.image}
                              alt={prescription.doctor.name}
                              className="h-12 w-12 rounded-xl object-cover bg-slate-100"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{prescription.doctor.name}</p>
                              <p className="text-xs text-blue-600">{prescription.doctor.specialty}</p>
                              <p className="mt-1 text-xs text-slate-600">Diagnosis: {prescription.diagnosis}</p>
                            </div>
                            {isSelected && (
                              <IoCheckmarkCircleOutline className="h-5 w-5 text-blue-600 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              </div>
              )}

              {/* Step 2: Confirmation */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                      <IoShareSocialOutline className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900">Share & Confirm Booking</h3>
                    <p className="text-sm text-slate-600">Prescription and details will be shared with the lab</p>
                  </div>

                  {/* Patient Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <IoPersonOutline className="h-5 w-5 text-slate-600" />
                      Patient Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-medium text-slate-600">Name</span>
                        <span className="text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.firstName} {mockPatientData.lastName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-medium text-slate-600">Email</span>
                        <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%] break-all">
                          {mockPatientData.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-medium text-slate-600">Phone</span>
                        <span className="text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.phone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-sm font-medium text-slate-600">Blood Group</span>
                        <span className="text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.bloodGroup}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Address</span>
                        <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%] break-words">
                          {mockPatientData.address.line1}, {mockPatientData.address.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Details */}
                  {selectedPrescription && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <IoMedicalOutline className="h-5 w-5 text-slate-600" />
                        Doctor Details
                      </h4>
                      <div className="flex flex-col items-center gap-4">
                        <img
                          src={selectedPrescription.doctor.image}
                          alt={selectedPrescription.doctor.name}
                          className="h-20 w-20 rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPrescription.doctor.name)}&background=3b82f6&color=fff&size=160&bold=true`
                          }}
                        />
                        <div className="w-full space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-sm font-medium text-slate-600">Name</span>
                            <span className="text-sm font-semibold text-slate-900 text-right">
                              {selectedPrescription.doctor.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-sm font-medium text-slate-600">Specialty</span>
                            <span className="text-sm font-semibold text-blue-600 text-right">
                              {selectedPrescription.doctor.specialty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-sm font-medium text-slate-600">Phone</span>
                            <span className="text-sm font-semibold text-slate-900 text-right">
                              {selectedPrescription.doctor.phone}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-sm font-medium text-slate-600">Email</span>
                            <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%] break-all">
                              {selectedPrescription.doctor.email}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Diagnosis</span>
                            <span className="text-sm font-semibold text-slate-900 text-right max-w-[55%] break-words">
                              {selectedPrescription.diagnosis}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lab & Prescription PDF */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 text-base font-semibold text-slate-900">{selectedLab.labName}</h4>
                        <p className="text-sm text-slate-600">{selectedLab.location}</p>
                      </div>

                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-sm font-medium text-slate-600">Collection Type</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}
                          </span>
                        </div>
                        <div>
                          <p className="mb-3 text-sm font-medium text-slate-600">Prescription PDF</p>
                          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                                <IoDocumentTextOutline className="h-6 w-6 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {selectedPrescription?.doctor.name} - Prescription
                                </p>
                                <p className="text-xs text-slate-600">
                                  Issued: {selectedPrescription?.issuedAt ? formatDate(selectedPrescription.issuedAt) : '—'}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                              >
                                View PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                {bookingStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}
                {bookingStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!selectedPrescription}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-400/40 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <IoShareSocialOutline className="h-5 w-5" />
                        Share & Confirm
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Details Modal */}
      {detailLab && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailLabId(null)
            }
          }}
        >
          <article className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setDetailLabId(null)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                aria-label="Close details"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-2 pr-8">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Laboratory overview
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {detailLab.labName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">{detailLab.location}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(detailLab.rating)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{detailLab.rating}</span>
                  <span className="text-xs text-slate-500">({detailLab.reviewCount})</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {detailLab.homeCollection && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-blue-600">
                      Home Collection
                    </span>
                  )}
                  {detailLab.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-700"
                    >
                      {cert}
                    </span>
          ))}
        </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 text-sm text-slate-600">
                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Contact Information
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Phone:</span>
                      <a
                        href={`tel:${detailLab.phone.replace(/[^+\d]/g, '')}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {detailLab.phone}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Email:</span>
                      <a
                        href={`mailto:${detailLab.email}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {detailLab.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Distance:</span>
                      <span className="font-semibold text-slate-700">{detailLab.distance}</span>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Availability
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <li className="flex items-center gap-2 text-slate-700">
                      <IoTimeOutline className="h-4 w-4 text-slate-400" />
                      <span>{detailLab.availability}</span>
                      {detailLab.nextSlot && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          {detailLab.nextSlot}
                        </span>
                      )}
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <IoDocumentTextOutline className="h-4 w-4 text-slate-400" />
                      <span>Reports in {detailLab.reportTime}</span>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Operating Hours
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {detailLab.timings.map((timing) => (
                      <li key={timing} className="text-slate-700">
                        {timing}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className="flex-shrink-0 mt-auto border-t border-slate-200 p-4 sm:p-5">
              <div className="flex flex-row gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detailLab.labName} ${detailLab.location}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Directions
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDetailLabId(null)
                    handleBookTest(detailLab.id)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition hover:bg-blue-600"
                >
                  <IoCalendarOutline className="h-4 w-4" />
                  Book Test
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default PatientLaboratory
