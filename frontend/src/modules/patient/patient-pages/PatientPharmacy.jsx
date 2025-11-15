import { useEffect, useMemo, useState, useRef } from 'react'
import { HiChevronDown } from 'react-icons/hi'
import {
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoInformationCircleOutline,
  IoCalendarOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoDocumentTextOutline,
  IoShareSocialOutline,
  IoCheckmarkCircleOutline,
  IoCheckmarkCircle,
  IoBagHandleOutline,
  IoStar,
  IoStarOutline,
  IoHomeOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5'

const mockOverview = {
  pharmacies: [
    {
      id: 'rx-care',
      pharmacyName: 'Rx Care Pharmacy',
      status: 'approved',
      rating: 4.8,
      reviewCount: 124,
      phone: '+1-555-214-0098',
      email: 'support@rxcare.com',
      licenseNumber: 'RX-45287',
      distanceKm: 0.9,
      serviceRadiusKm: 8,
      responseTimeMinutes: 35,
      deliveryOptions: ['both'],
      address: {
        line1: '123 Market Street',
        line2: 'Suite 210',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'USA',
      },
      timings: [
        'Mon – Fri · 8:00 AM – 9:00 PM',
        'Saturday · 9:00 AM – 6:00 PM',
        'Sunday · 10:00 AM – 4:00 PM',
      ],
      contactPerson: {
        name: 'Lauren Patel',
        phone: '+1-555-211-0800',
        email: 'lauren.patel@rxcare.com',
      },
      featuredMedicines: [
        { name: 'Atorvastatin', brand: 'Lipitor', price: 28.5, stock: 42 },
        { name: 'Metformin', brand: 'Glucophage XR', price: 18.9, stock: 60 },
        { name: 'Losartan', brand: 'Cozaar', price: 22.5, stock: 35 },
      ],
      notes: 'Digital prescriptions and chronic care packs available.',
      lastUpdated: '2025-01-12T10:45:00.000Z',
    },
    {
      id: 'health-hub',
      pharmacyName: 'HealthHub Pharmacy',
      status: 'approved',
      rating: 4.6,
      reviewCount: 89,
      phone: '+1-555-909-4433',
      email: 'hello@healthhubpharmacy.com',
      licenseNumber: 'RX-99401',
      distanceKm: 1.5,
      serviceRadiusKm: 12,
      responseTimeMinutes: 25,
      deliveryOptions: ['delivery'],
      address: {
        line1: '77 Elm Avenue',
        line2: '',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62703',
        country: 'USA',
      },
      timings: ['24/7 support · Pharmacist on call'],
      contactPerson: {
        name: 'Marcus Allen',
        phone: '+1-555-909-0021',
        email: 'marcus@healthhubpharmacy.com',
      },
      featuredMedicines: [
        { name: 'Insulin Glargine', brand: 'Lantus', price: 52, stock: 28 },
        { name: 'Levothyroxine', brand: 'Synthroid', price: 14.75, stock: 95 },
      ],
      notes: 'Emergency deliveries under 30 minutes in core service radius.',
      lastUpdated: '2025-01-11T21:10:00.000Z',
    },
    {
      id: 'neighborhood',
      pharmacyName: 'Neighborhood Family Pharmacy',
      status: 'approved',
      rating: 4.2,
      reviewCount: 57,
      phone: '+1-555-712-0080',
      email: 'care@neighborhoodfamilyrx.com',
      licenseNumber: 'RX-22014',
      distanceKm: 2.6,
      serviceRadiusKm: 6,
      responseTimeMinutes: 55,
      deliveryOptions: ['pickup'],
      address: {
        line1: '452 Cedar Lane',
        line2: '',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        country: 'USA',
      },
      timings: [
        'Mon – Fri · 9:00 AM – 7:30 PM',
        'Saturday · 9:00 AM – 5:00 PM',
        'Closed on Sunday',
      ],
      contactPerson: {
        name: 'Hannah Ortiz',
        phone: '+1-555-712-1100',
        email: 'hannah@neighborhoodfamilyrx.com',
      },
      featuredMedicines: [
        { name: 'Amlodipine', brand: 'Norvasc', price: 16.3, stock: 48 },
        { name: 'Vitamin D3', brand: 'Cholecalciferol', price: 9.5, stock: 82 },
      ],
      notes: 'Specializes in senior care and medication synchronization.',
      lastUpdated: '2025-01-09T16:20:00.000Z',
    },
    {
      id: 'city-center',
      pharmacyName: 'City Center Wellness Pharmacy',
      status: 'approved',
      rating: 4.9,
      reviewCount: 203,
      phone: '+1-555-367-5511',
      email: 'support@citycenterwellness.com',
      licenseNumber: 'RX-33088',
      distanceKm: 3.1,
      serviceRadiusKm: 18,
      responseTimeMinutes: 45,
      deliveryOptions: ['both'],
      address: {
        line1: '15 Harbor Road',
        line2: 'Ground Floor',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        country: 'USA',
      },
      timings: [
        'Mon – Sat · 8:00 AM – 10:00 PM',
        'Sunday · 9:00 AM – 6:00 PM',
      ],
      contactPerson: {
        name: 'David Cho',
        phone: '+1-555-367-5500',
        email: 'david.cho@citycenterwellness.com',
      },
      featuredMedicines: [
        { name: 'Apixaban', brand: 'Eliquis', price: 68, stock: 30 },
        { name: 'Montelukast', brand: 'Singulair', price: 24.5, stock: 54 },
        { name: 'Budesonide Inhaler', brand: 'Pulmicort', price: 42, stock: 26 },
      ],
      notes: 'Clinical pharmacists on-site with vaccine and compounding services.',
      lastUpdated: '2025-01-08T12:00:00.000Z',
    },
  ],
  leads: [
    {
      id: 'lead-501',
      status: 'new',
      createdAt: '2025-01-12T09:15:00.000Z',
      prescriptionId: 'prx-3021',
      consultationId: 'cns-884',
      medicines: [
        { name: 'Metformin', dosage: '500 mg', quantity: 56, instructions: 'Take twice daily' },
        { name: 'Atorvastatin', dosage: '20 mg', quantity: 30, instructions: 'Take at night' },
      ],
      preferredPharmacies: ['rx-care', 'health-hub'],
      remarks: 'Open to generics if equivalent.',
    },
    {
      id: 'lead-498',
      status: 'quoted',
      createdAt: '2025-01-10T14:50:00.000Z',
      prescriptionId: 'prx-3014',
      consultationId: 'cns-872',
      medicines: [
        { name: 'Budesonide Inhaler', dosage: '200 mcg', quantity: 2, instructions: 'Two puffs twice daily' },
      ],
      preferredPharmacies: ['city-center'],
      remarks: 'Needs home delivery due to limited mobility.',
    },
  ],
  quotes: [
    {
      id: 'quote-2201',
      leadId: 'lead-498',
      pharmacyId: 'city-center',
      status: 'quoted',
      createdAt: '2025-01-10T17:05:00.000Z',
      expiresAt: '2025-01-14T12:00:00.000Z',
      currency: 'USD',
      totalAmount: 124,
      deliveryType: 'delivery',
      remarks: 'Includes delivery and inhaler technique coaching.',
      medicines: [
        {
          name: 'Budesonide Inhaler',
          brand: 'Pulmicort',
          dosage: '200 mcg',
          quantity: 2,
          price: 62,
          availability: 'in_stock',
        },
      ],
    },
    {
      id: 'quote-2212',
      leadId: 'lead-501',
      pharmacyId: 'rx-care',
      status: 'quoted',
      createdAt: '2025-01-12T10:05:00.000Z',
      expiresAt: '2025-01-13T23:00:00.000Z',
      currency: 'USD',
      totalAmount: 95.6,
      deliveryType: 'pickup',
      remarks: 'Ready for pickup within 30 minutes.',
      medicines: [
        {
          name: 'Metformin',
          brand: 'Glucophage XR',
          dosage: '500 mg',
          quantity: 56,
          price: 34,
          availability: 'in_stock',
        },
        {
          name: 'Atorvastatin',
          brand: 'Lipitor',
          dosage: '20 mg',
          quantity: 30,
          price: 61.6,
          availability: 'in_stock',
        },
      ],
    },
  ],
  orders: [
    {
      id: 'order-1307',
      quoteId: 'quote-2120',
      pharmacyId: 'health-hub',
      status: 'preparing',
      createdAt: '2025-01-09T15:20:00.000Z',
      updatedAt: '2025-01-12T16:10:00.000Z',
      deliveryType: 'delivery',
      scheduledAt: '2025-01-12T19:30:00.000Z',
      payment: { amount: 142.3, status: 'pending' },
      medicines: [
        {
          name: 'Insulin Glargine',
          brand: 'Lantus',
          dosage: '10 ml vial',
          quantity: 2,
          price: 98,
          status: 'preparing',
        },
        {
          name: 'Syringe Pack',
          brand: 'BD Ultra-Fine',
          dosage: '31G',
          quantity: 1,
          price: 44.3,
          status: 'preparing',
        },
      ],
    },
    {
      id: 'order-1298',
      quoteId: 'quote-2108',
      pharmacyId: 'neighborhood',
      status: 'ready',
      createdAt: '2025-01-07T10:05:00.000Z',
      updatedAt: '2025-01-11T09:40:00.000Z',
      deliveryType: 'pickup',
      scheduledAt: '2025-01-11T17:00:00.000Z',
      payment: { amount: 52.4, status: 'pending' },
      medicines: [
        {
          name: 'Losartan',
          brand: 'Cozaar',
          dosage: '50 mg',
          quantity: 30,
          price: 26.2,
          status: 'ready',
        },
        {
          name: 'Vitamin D3',
          brand: 'Cholecalciferol',
          dosage: '60,000 IU',
          quantity: 4,
          price: 26.2,
          status: 'ready',
        },
      ],
    },
  ],
}

const DELIVERY_LABELS = {
  pickup: 'In-pharmacy pickup',
  delivery: 'Home delivery',
  both: 'Pickup & delivery',
}

const normalizePhone = (phone) => phone.replace(/[^+\d]/g, '')

const formatCurrency = (value, currency = 'USD') => {
  if (typeof value !== 'number') {
    return '—'
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    return `$${value.toFixed(2)}`
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const supportsDeliveryOption = (deliveryOptions = [], option) => {
  if (option === 'all') return true
  if (!Array.isArray(deliveryOptions) || !deliveryOptions.length) return false
  if (deliveryOptions.includes('both')) return true
  return deliveryOptions.includes(option)
}

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

const CustomDropdown = ({ id, value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Fixed positioning is relative to viewport, not document
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 120),
      })
    }
  }

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Calculate position immediately and after a small delay to ensure DOM is ready
      calculatePosition()
      const timeoutId = setTimeout(calculatePosition, 10)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        clearTimeout(timeoutId)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const updatePosition = () => {
        calculatePosition()
      }
      
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      
      // Update position periodically while open
      const intervalId = setInterval(updatePosition, 100)
      
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
        clearInterval(intervalId)
      }
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value) || options[0]

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <>
      <div className={`relative z-0 shrink-0 min-w-[120px] ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex w-full items-center justify-between rounded-lg border bg-white/95 backdrop-blur-sm px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all ${
            isOpen
              ? 'border-sky-400 bg-white shadow-md ring-2 ring-sky-400/30'
              : 'border-sky-200/60 hover:border-sky-300 hover:bg-white hover:shadow-md focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate text-xs">{selectedOption?.label || 'Select...'}</span>
          <HiChevronDown
            className={`ml-1.5 h-3 w-3 flex-shrink-0 text-sky-500 transition-all duration-200 ${
              isOpen ? 'rotate-180 text-sky-600' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9998] bg-transparent" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={menuRef}
            className="fixed z-[9999] rounded-lg border-2 border-sky-300 bg-white shadow-2xl"
            style={{
              top: position.top > 0 ? `${position.top}px` : '50%',
              left: position.left > 0 ? `${position.left}px` : '50%',
              width: position.width > 0 ? `${position.width}px` : '200px',
              maxHeight: '12rem',
              transform: position.top === 0 ? 'translate(-50%, -50%)' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ul
              role="listbox"
              className="max-h-48 overflow-auto py-1.5"
              aria-labelledby={id}
            >
              {options.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(option.value)
                  }}
                  className={`cursor-pointer px-3 py-2 text-xs font-medium transition-colors ${
                    value === option.value
                      ? 'bg-sky-100 text-sky-700 font-semibold'
                      : 'bg-white text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
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

const PatientPharmacy = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState('all')
  const [radiusFilter, setRadiusFilter] = useState('any')
  const [sortBy, setSortBy] = useState('relevance')
  const [showOnlyApproved, setShowOnlyApproved] = useState(true)
  const [detailPharmacyId, setDetailPharmacyId] = useState(null)
  const [bookingPharmacyId, setBookingPharmacyId] = useState(null)
  const [bookingStep, setBookingStep] = useState(1) // 1: Prescription, 2: Confirmation
  const [serviceType, setServiceType] = useState('pickup') // 'pickup' or 'delivery'
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const detailPharmacy = useMemo(
    () => mockOverview.pharmacies.find((pharmacy) => pharmacy.id === detailPharmacyId) || null,
    [detailPharmacyId]
  )

  const bookingPharmacy = useMemo(
    () => mockOverview.pharmacies.find((pharmacy) => pharmacy.id === bookingPharmacyId) || null,
    [bookingPharmacyId]
  )

  useEffect(() => {
    if (!detailPharmacy) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDetailPharmacyId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailPharmacy])

  useEffect(() => {
    if (!bookingPharmacy) {
      setBookingStep(1)
      setSelectedPrescription(null)
      return
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBookingPharmacyId(null)
        setBookingStep(1)
        setSelectedPrescription(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bookingPharmacy])

  const filteredPharmacies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const matchesSearch = (pharmacy) => {
      if (!normalizedSearch) return true

      const haystack = [
        pharmacy.pharmacyName,
        pharmacy.notes,
        pharmacy.address?.line1,
        pharmacy.address?.line2,
        pharmacy.address?.city,
        pharmacy.address?.state,
        pharmacy.address?.postalCode,
        pharmacy.contactPerson?.name,
        pharmacy.contactPerson?.email,
        ...(pharmacy.timings || []),
        ...(pharmacy.featuredMedicines || []).flatMap((medicine) => [medicine.name, medicine.brand]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    }

    const calculateScore = (pharmacy) => {
      const ratingScore = (pharmacy.rating || 0) * 2
      const distanceScore = Math.max(0, 5 - (pharmacy.distanceKm || 5))
      const responseScore = pharmacy.responseTimeMinutes
        ? Math.max(0, 120 - pharmacy.responseTimeMinutes) / 30
        : 0
      return ratingScore + distanceScore + responseScore
    }

    return mockOverview.pharmacies
      .filter((pharmacy) => {
        if (showOnlyApproved && pharmacy.status !== 'approved') return false

        if (!supportsDeliveryOption(pharmacy.deliveryOptions, selectedDelivery)) {
          return false
        }

        if (radiusFilter !== 'any') {
          const limit = Number.parseInt(radiusFilter, 10)
          const distance = typeof pharmacy.distanceKm === 'number' ? pharmacy.distanceKm : Number.POSITIVE_INFINITY
          const serviceRadius =
            typeof pharmacy.serviceRadiusKm === 'number' ? pharmacy.serviceRadiusKm : Number.POSITIVE_INFINITY
          if (distance > limit && serviceRadius > limit) {
            return false
          }
        }

        return matchesSearch(pharmacy)
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
        }

        if (sortBy === 'rating') {
          return (b.rating ?? 0) - (a.rating ?? 0)
        }

        if (sortBy === 'responseTime') {
          return (a.responseTimeMinutes ?? Number.POSITIVE_INFINITY) - (b.responseTimeMinutes ?? Number.POSITIVE_INFINITY)
        }

        return calculateScore(b) - calculateScore(a)
      })
  }, [radiusFilter, searchTerm, selectedDelivery, showOnlyApproved, sortBy])

  return (
    <section className="flex flex-col gap-3 px-2 pb-4 pt-2 sm:px-3 sm:pb-6 sm:pt-3">
      {/* Search Bar - Outside Card */}
      <div className="relative">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="pharmacy-directory-search"
            type="search"
            placeholder="Search by name, service, or medicine..."
            className="w-full rounded-lg border border-sky-200/60 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-sky-300 hover:bg-white hover:shadow-md focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/30 sm:text-base"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {/* Filters - Scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
            <CustomDropdown
              className="shrink-0"
              id="delivery-filter"
              value={selectedDelivery}
              onChange={(value) => setSelectedDelivery(value)}
              options={[
                { value: 'all', label: 'All options' },
                { value: 'delivery', label: 'Home delivery' },
                { value: 'pickup', label: 'In-pharmacy pickup' },
              ]}
            />

            <CustomDropdown
              className="shrink-0"
              id="status-filter"
              value={showOnlyApproved ? 'approved' : 'all'}
              onChange={(value) => setShowOnlyApproved(value === 'approved')}
              options={[
                { value: 'approved', label: 'Approved only' },
                { value: 'all', label: 'Include pending' },
              ]}
            />

            <CustomDropdown
              className="shrink-0"
              id="radius-filter"
              value={radiusFilter}
              onChange={(value) => setRadiusFilter(value)}
              options={[
                { value: 'any', label: 'Any distance' },
                { value: '5', label: 'Up to 5 km' },
                { value: '10', label: 'Up to 10 km' },
                { value: '20', label: 'Up to 20 km' },
              ]}
            />

            <CustomDropdown
              className="shrink-0"
              id="sort-filter"
              value={sortBy}
              onChange={(value) => setSortBy(value)}
              options={[
                { value: 'relevance', label: 'Recommended' },
                { value: 'distance', label: 'Nearest' },
                { value: 'rating', label: 'Top rated' },
                { value: 'responseTime', label: 'Fastest response' },
              ]}
            />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredPharmacies.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No pharmacies match your filters. Try expanding the radius or clearing the delivery preference.
          </p>
        )}

        {filteredPharmacies.map((pharmacy) => (
          <article
            key={pharmacy.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          >
            <div className="flex flex-col gap-2 sm:max-w-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    {pharmacy.pharmacyName}
                  </h3>
                  {typeof pharmacy.rating === 'number' && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(pharmacy.rating)}</div>
                      <span className="text-xs font-semibold text-slate-700">{pharmacy.rating.toFixed(1)}</span>
                      {pharmacy.reviewCount && (
                        <span className="text-xs text-slate-500">({pharmacy.reviewCount})</span>
                      )}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{formatAddress(pharmacy.address)}</p>
                  <p className="text-xs font-medium text-slate-600">
                    {(pharmacy.distanceKm ?? pharmacy.serviceRadiusKm)?.toFixed
                      ? `${(pharmacy.distanceKm ?? pharmacy.serviceRadiusKm).toFixed(1)} km away`
                      : 'Distance unavailable'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      pharmacy.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {pharmacy.status === 'approved' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(pharmacy.deliveryOptions || []).map((option) => (
                  <span
                    key={`${pharmacy.id}-${option}`}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                  >
                    {DELIVERY_LABELS[option] || option}
                  </span>
                ))}
                {pharmacy.responseTimeMinutes && (
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-600">
                    ~{pharmacy.responseTimeMinutes} min response
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-1 sm:items-end sm:text-right">
              <p className="text-[11px] text-slate-500">
                Updated {formatDateTime(pharmacy.lastUpdated)}
              </p>
              <div className="flex flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setBookingPharmacyId(pharmacy.id)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                >
                  <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                  Book
                </button>
                <button
                  type="button"
                  onClick={() => setDetailPharmacyId(pharmacy.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
                >
                  View
                </button>
                <a
                  href={`tel:${normalizePhone(pharmacy.phone)}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Call"
                >
                  <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={`mailto:${pharmacy.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Email"
                >
                  <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.pharmacyName} ${formatAddress(pharmacy.address)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Map"
                >
                  <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {detailPharmacy && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailPharmacyId(null)
            }
          }}
        >
          <article className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setDetailPharmacyId(null)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                aria-label="Close details"
              >
                ✕
              </button>

              <div className="flex flex-col gap-2 pr-8">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pharmacy overview
                  </p>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                    {detailPharmacy.pharmacyName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">{formatAddress(detailPharmacy.address)}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(detailPharmacy.deliveryOptions || []).map((option) => (
                    <span
                      key={`${detailPharmacy.id}-${option}`}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600"
                    >
                      {DELIVERY_LABELS[option] || option}
                    </span>
                  ))}
                  {detailPharmacy.responseTimeMinutes && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-sky-600">
                      ~{detailPharmacy.responseTimeMinutes} min response
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 text-sm text-slate-600">
                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Contact
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Phone:</span>
                      <a
                        href={`tel:${normalizePhone(detailPharmacy.phone)}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {detailPharmacy.phone}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Email:</span>
                      <a
                        href={`mailto:${detailPharmacy.email}`}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                      >
                        {detailPharmacy.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Contact person:</span>
                      <span className="font-semibold text-slate-700">
                        {detailPharmacy.contactPerson?.name || 'Not listed'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">License #:</span>
                      <span className="font-semibold text-slate-700">
                        {detailPharmacy.licenseNumber || '—'}
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Hours
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {(detailPharmacy.timings || []).map((timing) => (
                      <li key={`${detailPharmacy.id}-${timing}`} className="text-slate-700">
                        {timing}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Featured medications
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {(detailPharmacy.featuredMedicines || []).map((medicine) => (
                      <li
                        key={`${detailPharmacy.id}-${medicine.name}`}
                        className="flex items-center justify-between gap-2 sm:gap-3"
                      >
                        <span className="text-slate-700 min-w-0 flex-1">
                          {medicine.name}
                          {medicine.brand ? <span className="text-slate-500"> · {medicine.brand}</span> : ''}
                        </span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {formatCurrency(medicine.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {detailPharmacy.notes && (
                  <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                    <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                      Notes
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{detailPharmacy.notes}</p>
                  </section>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 mt-auto border-t border-slate-200 p-4 sm:p-5">
              <p className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-left mb-3">
                Last verified {formatDateTime(detailPharmacy.lastUpdated)}
              </p>
              <div className="flex flex-row gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detailPharmacy.pharmacyName} ${formatAddress(detailPharmacy.address)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Directions
                </a>
                <button
                  type="button"
                  onClick={() => setDetailPharmacyId(null)}
                  className="flex flex-1 items-center justify-center rounded-lg bg-blue-500 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Booking Modal */}
      {bookingPharmacy && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setBookingPharmacyId(null)
              setBookingStep(1)
              setSelectedPrescription(null)
            }
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Book Medicine</h2>
                <p className="text-sm text-slate-600">{bookingPharmacy.pharmacyName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookingPharmacyId(null)
                  setBookingStep(1)
                  setSelectedPrescription(null)
                }}
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
              {/* Step 1: Select Service Type & Prescription */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  {/* Service Type */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-700">Service Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setServiceType('pickup')}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                          serviceType === 'pickup'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            serviceType === 'pickup'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoBagHandleOutline className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">In-Pharmacy Pickup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceType('delivery')}
                        disabled={!bookingPharmacy.deliveryOptions?.includes('delivery') && !bookingPharmacy.deliveryOptions?.includes('both')}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                          serviceType === 'delivery'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${!bookingPharmacy.deliveryOptions?.includes('delivery') && !bookingPharmacy.deliveryOptions?.includes('both') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            serviceType === 'delivery'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoHomeOutline className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Home Delivery</span>
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
                    <p className="text-sm text-slate-600">Prescription and details will be shared with the pharmacy</p>
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

                  {/* Pharmacy & Prescription PDF */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 text-base font-semibold text-slate-900">{bookingPharmacy.pharmacyName}</h4>
                        <p className="text-sm text-slate-600">{formatAddress(bookingPharmacy.address)}</p>
                      </div>

                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-sm font-medium text-slate-600">Service Type</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {serviceType === 'delivery' ? 'Home Delivery' : 'In-Pharmacy Pickup'}
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

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                {bookingStep > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep(bookingStep - 1)
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Back
                  </button>
                )}
                {bookingStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bookingStep === 1 && selectedPrescription) {
                        setBookingStep(2)
                      }
                    }}
                    disabled={!selectedPrescription}
                    className="ml-auto flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <IoArrowForwardOutline className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bookingPharmacy || !selectedPrescription) return
                      
                      setIsSubmitting(true)
                      
                      // Prepare booking request data
                      const bookingRequest = {
                        pharmacyId: bookingPharmacy.id,
                        pharmacyName: bookingPharmacy.pharmacyName,
                        pharmacyAddress: bookingPharmacy.address,
                        pharmacyPhone: bookingPharmacy.phone,
                        pharmacyEmail: bookingPharmacy.email,
                        serviceType: serviceType, // 'pickup' or 'delivery'
                        patientDetails: {
                          firstName: mockPatientData.firstName,
                          lastName: mockPatientData.lastName,
                          email: mockPatientData.email,
                          phone: mockPatientData.phone,
                          bloodGroup: mockPatientData.bloodGroup,
                          address: mockPatientData.address,
                        },
                        doctorDetails: {
                          name: selectedPrescription.doctor.name,
                          specialty: selectedPrescription.doctor.specialty,
                          phone: selectedPrescription.doctor.phone,
                          email: selectedPrescription.doctor.email,
                        },
                        prescriptionDetails: {
                          id: selectedPrescription.id,
                          diagnosis: selectedPrescription.diagnosis,
                          issuedAt: selectedPrescription.issuedAt,
                          doctor: selectedPrescription.doctor,
                          // Include full prescription data
                          medications: selectedPrescription.medications || [],
                          investigations: selectedPrescription.investigations || [],
                          advice: selectedPrescription.advice || '',
                        },
                        requestDate: new Date().toISOString(),
                        status: 'pending',
                      }
                      
                      // Simulate API call to send request to pharmacy
                      try {
                        await new Promise((resolve) => setTimeout(resolve, 1500))
                        
                        // Log the booking request (in real app, this would be an API call)
                        console.log('Booking request sent to pharmacy:', bookingRequest)
                        
                        // Show success message
                        alert(`Booking request sent successfully to ${bookingPharmacy.pharmacyName}!\n\nThey will review your request and respond with availability and pricing.`)
                        
                        // Close modal and reset state
                        setBookingPharmacyId(null)
                        setBookingStep(1)
                        setSelectedPrescription(null)
                        setServiceType('pickup')
                      } catch (error) {
                        console.error('Error sending booking request:', error)
                        alert('Failed to send booking request. Please try again.')
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    disabled={isSubmitting || !bookingPharmacy || !selectedPrescription}
                    className="ml-auto flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Confirm Booking
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PatientPharmacy

