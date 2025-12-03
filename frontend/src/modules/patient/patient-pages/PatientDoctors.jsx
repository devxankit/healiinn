import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoPulseOutline,
  IoHeartOutline,
} from 'react-icons/io5'
import { TbStethoscope } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'
import { getDiscoveryDoctors, getSpecialties } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

// Default specialties (will be replaced by API data)
const defaultSpecialties = [
  { id: 'all', label: 'All Specialties', icon: TbStethoscope },
  { id: 'dentist', label: 'Dentist', icon: TbStethoscope },
  { id: 'cardio', label: 'Cardiology', icon: IoHeartOutline },
  { id: 'ortho', label: 'Orthopedic', icon: MdOutlineEscalatorWarning },
  { id: 'neuro', label: 'Neurology', icon: IoPulseOutline },
  { id: 'general', label: 'General', icon: TbStethoscope },
]

// Default doctors (will be replaced by API data)
const defaultDoctors = []

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  if (hasHalfStar) {
    stars.push(
      <svg key="half" className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`half-fill-${rating}`}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill={`url(#half-fill-${rating})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(
      <svg key={`empty-${i}`} className="h-3.5 w-3.5 fill-slate-300 text-slate-300" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    )
  }

  return stars
}

// Helper function to check if doctor is active
const isDoctorActive = (doctorName) => {
  try {
    const saved = localStorage.getItem('doctorProfile')
    if (saved) {
      const profile = JSON.parse(saved)
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      // Check if this doctor matches the saved profile
      if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
        return profile.isActive !== false // Default to true if not set
      }
    }
    // Check separate active status
    const activeStatus = localStorage.getItem('doctorProfileActive')
    if (activeStatus !== null && saved) {
      const isActive = JSON.parse(activeStatus)
      const profile = JSON.parse(saved)
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      if (doctorName.includes(profile.firstName) || doctorName.includes(profile.lastName) || doctorName === fullName) {
        return isActive
      }
    }
  } catch (error) {
    console.error('Error checking doctor active status:', error)
  }
  // Default: show all doctors if no profile found (for mock data)
  return true
}

const PatientDoctors = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [doctors, setDoctors] = useState(defaultDoctors)
  const [specialtiesList, setSpecialtiesList] = useState(defaultSpecialties)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const sortBy = 'relevance' // Default sort: by rating (highest first)

  // Fetch doctors and specialties from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First fetch specialties to get the mapping
        const specialtiesResponse = await getSpecialties().catch(() => ({ success: false, data: [] }))
        
        // Build filters object, only include defined values
        const filters = {}
        if (selectedSpecialty && selectedSpecialty !== 'all') {
          // Find the actual specialty name from the list
          let specialtyName = selectedSpecialty
          if (specialtiesResponse.success && specialtiesResponse.data) {
            const specialtiesData = Array.isArray(specialtiesResponse.data) 
              ? specialtiesResponse.data 
              : []
            const specialtyObj = specialtiesData.find(s => {
              const sName = typeof s === 'string' ? s : (s.name || s.label || '')
              const sId = sName.toLowerCase().replace(/\s+/g, '_')
              return sId === selectedSpecialty
            })
            if (specialtyObj) {
              specialtyName = typeof specialtyObj === 'string' ? specialtyObj : (specialtyObj.name || specialtyObj.label || selectedSpecialty)
            } else {
              // Fallback: try to convert ID back to name format
              specialtyName = selectedSpecialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          } else {
            // Fallback: try to convert ID back to name format
            specialtyName = selectedSpecialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
          filters.specialty = specialtyName
        }
        if (searchTerm && searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        const doctorsResponse = await getDiscoveryDoctors(filters)
        
        if (doctorsResponse.success && doctorsResponse.data) {
          const doctorsData = Array.isArray(doctorsResponse.data) 
            ? doctorsResponse.data 
            : doctorsResponse.data.items || []
          
          const transformed = doctorsData.map(doctor => ({
            id: doctor._id || doctor.id,
            _id: doctor._id || doctor.id,
            name: doctor.firstName && doctor.lastName
              ? `Dr. ${doctor.firstName} ${doctor.lastName}`
              : doctor.name || 'Dr. Unknown',
            specialty: doctor.specialization || doctor.specialty || 'General',
            experience: doctor.experienceYears 
              ? `${doctor.experienceYears} years` 
              : doctor.experience || 'N/A',
            rating: doctor.rating || 0,
            reviewCount: doctor.reviewCount || 0,
            consultationFee: doctor.consultationFee || 0,
            distance: doctor.distance || 'N/A',
            location: doctor.clinicDetails?.name 
              ? `${doctor.clinicDetails.name}, ${doctor.clinicDetails.address?.city || ''}`
              : doctor.location || 'Location not available',
            availability: 'Available', // TODO: Calculate from schedule
            nextSlot: 'N/A', // TODO: Get from schedule
            image: doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            languages: doctor.languages || ['English'],
            education: doctor.qualification || doctor.education || 'MBBS',
            bio: doctor.bio || '',
            originalData: doctor,
          }))
          
          setDoctors(transformed)
        }
        
        if (specialtiesResponse.success && specialtiesResponse.data) {
          const specialtiesData = Array.isArray(specialtiesResponse.data) 
            ? specialtiesResponse.data 
            : specialtiesResponse.data.specialties || []
          
          // Handle both string array and object array
          const processedSpecialties = specialtiesData.map(s => {
            if (typeof s === 'string') {
              return {
                id: s.toLowerCase().replace(/\s+/g, '_'),
                label: s,
                name: s,
              }
            }
            return {
              id: (s.name || s.label || s).toLowerCase().replace(/\s+/g, '_'),
              label: s.name || s.label || s,
              name: s.name || s.label || s,
            }
          })
          
          if (processedSpecialties.length > 0) {
            setSpecialtiesList([
              { id: 'all', label: 'All Specialties', icon: TbStethoscope, name: 'all' },
              ...processedSpecialties.map(s => ({
                id: s.id,
                label: s.label,
                name: s.name,
                icon: TbStethoscope,
              })),
            ])
          }
        }
      } catch (err) {
        console.error('Error fetching doctors:', err)
        setError(err.message || 'Failed to load doctors')
        toast.error('Failed to load doctors')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecialty, searchTerm, toast])

  // Set specialty from URL query parameter
  useEffect(() => {
    const specialtyFromUrl = searchParams.get('specialty')
    if (specialtyFromUrl) {
      setSelectedSpecialty(specialtyFromUrl)
    }
  }, [searchParams])

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    let filtered = doctors.filter((doctor) => {
      // Filter by active status first
      if (!isDoctorActive(doctor.name)) {
        return false
      }
      // Filter by specialty
      if (selectedSpecialty !== 'all') {
        // Find the actual specialty name from the list
        const specialtyObj = specialtiesList.find(s => s.id === selectedSpecialty)
        const selectedSpecialtyName = specialtyObj?.name || selectedSpecialty.replace(/_/g, ' ')
        const doctorSpecialty = (doctor.specialty || '').toLowerCase()
        const selectedSpecialtyLower = selectedSpecialtyName.toLowerCase()
        
        // Match by name (case-insensitive, partial match)
        if (!doctorSpecialty.includes(selectedSpecialtyLower) && !selectedSpecialtyLower.includes(doctorSpecialty)) {
          return false
        }
      }

      // Filter by search term
      if (normalizedSearch) {
        const searchableFields = [
          doctor.name,
          doctor.specialty,
          doctor.location,
          doctor.education,
          ...(doctor.languages || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        // Check if any word in search term matches
        const searchWords = normalizedSearch.split(/\s+/).filter(Boolean)
        const matches = searchWords.every((word) => searchableFields.includes(word))
        
        return matches
      }

      return true
    })

    // Sort results
    return filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating
      }
      if (sortBy === 'fee-low') {
        return a.consultationFee - b.consultationFee
      }
      if (sortBy === 'fee-high') {
        return b.consultationFee - a.consultationFee
      }
      if (sortBy === 'distance') {
        const aDist = parseFloat(a.distance.replace(' km', ''))
        const bDist = parseFloat(b.distance.replace(' km', ''))
        return aDist - bDist
      }
      return b.rating - a.rating
    })
  }, [searchTerm, selectedSpecialty, sortBy])

  const handleCardClick = (doctorId) => {
    navigate(`/patient/doctors/${doctorId}`)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar - Outside Card */}
      <div className="relative">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#11496c' }}>
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            id="doctor-search"
            type="text"
            placeholder="Search by name, specialty, or location..."
            className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:bg-white hover:shadow-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c] sm:text-base"
            style={{ borderColor: 'rgba(17, 73, 108, 0.3)' }}
            onFocus={(e) => {
              e.target.style.borderColor = '#11496c'
              e.target.style.boxShadow = '0 0 0 2px rgba(17, 73, 108, 0.2)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(17, 73, 108, 0.3)'
              e.target.style.boxShadow = ''
            }}
            onMouseEnter={(e) => {
              if (document.activeElement !== e.target) {
                e.target.style.borderColor = 'rgba(17, 73, 108, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.target) {
                e.target.style.borderColor = 'rgba(17, 73, 108, 0.3)'
              }
            }}
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value
              setSearchTerm(value)
            }}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Specialty Filters - Scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
        {specialtiesList.map((specialty) => {
          const Icon = specialty.icon
          const isSelected = selectedSpecialty === specialty.id
          return (
            <button
              key={specialty.id}
              type="button"
              onClick={() => setSelectedSpecialty(specialty.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'bg-white text-slate-700 border hover:bg-white hover:shadow-sm'
              }`}
              style={isSelected ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : { borderColor: 'rgba(17, 73, 108, 0.3)' }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(17, 73, 108, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(17, 73, 108, 0.3)'
                }
              }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{specialty.label}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
          <p className="mt-1 text-xs text-red-500">Please try again later.</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No doctors found matching your criteria.</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => handleCardClick(doctor.id)}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="p-4">
                {/* Doctor Info Row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight">{doctor.name}</h3>
                    <p className="text-xs text-slate-600 mb-0.5">{doctor.specialty}</p>
                    <p className="text-xs text-slate-500 mb-1.5">{doctor.location}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                      <span className="text-xs font-semibold text-slate-700">
                        {doctor.rating} ({doctor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-base font-bold text-slate-900">₹{doctor.consultationFee}</div>
                  </div>
                </div>

                {/* Availability Section */}
                {doctor.availability.includes('today') && doctor.nextSlot && (
                  <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)', border: '1px solid rgba(17, 73, 108, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-semibold text-slate-800">Now Serving</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1.5">Your ETA if you book now:</p>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900">Next Slot: {doctor.nextSlot}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{doctor.availability}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Take Token Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(doctor.id)
                  }}
                  className="w-full text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm"
                  style={{ backgroundColor: '#11496c' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0d3a52'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#11496c'
                  }}
                  onMouseDown={(e) => {
                    e.target.style.backgroundColor = '#0a2d3f'
                  }}
                  onMouseUp={(e) => {
                    e.target.style.backgroundColor = '#11496c'
                  }}
                >
                  Take Token • ₹{doctor.consultationFee}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default PatientDoctors

