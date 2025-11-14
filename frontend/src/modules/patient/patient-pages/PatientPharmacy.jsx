import { useEffect, useMemo, useState, useRef } from 'react'
import { HiChevronDown } from 'react-icons/hi'

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
      <div className={`relative z-0 ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={`flex w-full items-center justify-between rounded-lg border bg-white/95 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all sm:text-sm ${
            isOpen
              ? 'border-sky-400 bg-white shadow-md ring-2 ring-sky-400/30'
              : 'border-sky-200/60 hover:border-sky-300 hover:bg-white hover:shadow-md focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selectedOption?.label || 'Select...'}</span>
          <HiChevronDown
            className={`ml-1.5 h-3.5 w-3.5 flex-shrink-0 text-sky-500 transition-all duration-200 ${
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
                  className={`cursor-pointer px-4 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
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

const PatientPharmacy = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState('all')
  const [radiusFilter, setRadiusFilter] = useState('any')
  const [sortBy, setSortBy] = useState('relevance')
  const [showOnlyApproved, setShowOnlyApproved] = useState(true)
  const [detailPharmacyId, setDetailPharmacyId] = useState(null)

  const detailPharmacy = useMemo(
    () => mockOverview.pharmacies.find((pharmacy) => pharmacy.id === detailPharmacyId) || null,
    [detailPharmacyId]
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
      <div className="relative overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/90 via-blue-50/85 to-sky-50/90 backdrop-blur-md p-3 shadow-xl shadow-sky-200/30 ring-1 ring-white/50 sm:rounded-3xl sm:p-4">
        {/* Decorative gradient overlay */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-blue-300/15 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col gap-3">
          <div className="relative">
            <label htmlFor="pharmacy-directory-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700/80 sm:text-sm">
              Search pharmacies
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-500">
                🔍
              </span>
              <input
                id="pharmacy-directory-search"
                type="search"
                placeholder="Search by name, service, or medicine..."
                className="w-full rounded-lg border border-sky-200/60 bg-white/90 backdrop-blur-sm py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-sky-300 hover:bg-white hover:shadow-md focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/30 sm:text-base"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CustomDropdown
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
              id="status-filter"
              value={showOnlyApproved ? 'approved' : 'all'}
              onChange={(value) => setShowOnlyApproved(value === 'approved')}
              options={[
                { value: 'approved', label: 'Approved only' },
                { value: 'all', label: 'Include pending' },
              ]}
            />

            <CustomDropdown
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
        </div>
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
                <div>
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    {pharmacy.pharmacyName}
                  </h3>
                  <p className="text-xs text-slate-500">{formatAddress(pharmacy.address)}</p>
                  <p className="text-xs font-medium text-slate-600">
                    {(pharmacy.distanceKm ?? pharmacy.serviceRadiusKm)?.toFixed
                      ? `${(pharmacy.distanceKm ?? pharmacy.serviceRadiusKm).toFixed(1)} km away`
                      : 'Distance unavailable'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {typeof pharmacy.rating === 'number' && (
                    <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                      ★ {pharmacy.rating.toFixed(1)}
                    </span>
                  )}
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
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDetailPharmacyId(pharmacy.id)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  View details
                </button>
                <a
                  href={`tel:${normalizePhone(pharmacy.phone)}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Call
                </a>
                <a
                  href={`mailto:${pharmacy.email}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Email
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.pharmacyName} ${formatAddress(pharmacy.address)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Map
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {detailPharmacy && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-6 pt-10 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <article className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <button
              type="button"
              onClick={() => setDetailPharmacyId(null)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Close details"
            >
              ✕
            </button>

            <div className="flex flex-col gap-3 pr-6">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pharmacy overview
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  {detailPharmacy.pharmacyName}
                </h2>
                <p className="text-sm text-slate-500">{formatAddress(detailPharmacy.address)}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {(detailPharmacy.deliveryOptions || []).map((option) => (
                  <span
                    key={`${detailPharmacy.id}-${option}`}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {DELIVERY_LABELS[option] || option}
                  </span>
                ))}
                {detailPharmacy.responseTimeMinutes && (
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-600">
                    ~{detailPharmacy.responseTimeMinutes} min response
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600">
              <section className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    Phone:{' '}
                    <a href={`tel:${normalizePhone(detailPharmacy.phone)}`} className="font-semibold text-slate-700 underline-offset-2 hover:underline">
                      {detailPharmacy.phone}
                    </a>
                  </li>
                  <li>
                    Email:{' '}
                    <a href={`mailto:${detailPharmacy.email}`} className="font-semibold text-slate-700 underline-offset-2 hover:underline">
                      {detailPharmacy.email}
                    </a>
                  </li>
                  <li>
                    Contact person:{' '}
                    <span className="font-semibold text-slate-700">
                      {detailPharmacy.contactPerson?.name || 'Not listed'}
                    </span>
                  </li>
                  <li>
                    License #{' '}
                    <span className="font-semibold text-slate-700">
                      {detailPharmacy.licenseNumber || '—'}
                    </span>
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hours
                </h3>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {(detailPharmacy.timings || []).map((timing) => (
                    <li key={`${detailPharmacy.id}-${timing}`}>{timing}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Featured medications
                </h3>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {(detailPharmacy.featuredMedicines || []).map((medicine) => (
                    <li key={`${detailPharmacy.id}-${medicine.name}`} className="flex items-center justify-between gap-3">
                      <span>
                        {medicine.name}{medicine.brand ? ` · ${medicine.brand}` : ''}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(medicine.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {detailPharmacy.notes && (
                <section className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">{detailPharmacy.notes}</p>
                </section>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Last verified {formatDateTime(detailPharmacy.lastUpdated)}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detailPharmacy.pharmacyName} ${formatAddress(detailPharmacy.address)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Directions
                </a>
                <button
                  type="button"
                  onClick={() => setDetailPharmacyId(null)}
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
                >
                  Close
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default PatientPharmacy

