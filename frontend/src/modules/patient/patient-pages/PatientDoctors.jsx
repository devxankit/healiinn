import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoPulseOutline,
  IoHeartOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5'
import { TbStethoscope } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'
import { getDiscoveryDoctors, getSpecialties } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'
import Pagination from '../../../components/Pagination'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Debug: Log doctors state changes
  useEffect(() => {
    console.log('📊 Doctors state updated:', {
      count: doctors.length,
      doctors: doctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty })),
    })
  }, [doctors])

  // Fetch all doctors first to build specialties list (only once on mount)
  useEffect(() => {
    const fetchAllDoctorsForSpecialties = async () => {
      try {
        console.log('🔄 Fetching all doctors for specialties list...') // Debug log
        // Fetch all doctors without filters to build complete specialties list
        const allDoctorsResponse = await getDiscoveryDoctors({ limit: 1000, page: 1, _t: Date.now() })
        console.log('📊 All doctors response:', allDoctorsResponse) // Debug log
        
        if (allDoctorsResponse && allDoctorsResponse.success && allDoctorsResponse.data) {
          const allDoctorsData = Array.isArray(allDoctorsResponse.data) 
            ? allDoctorsResponse.data 
            : (allDoctorsResponse.data.items || [])
          
          console.log('📋 All doctors data extracted:', allDoctorsData.length) // Debug log
          
          // Extract unique specialties from ALL doctors
          const doctorSpecialties = new Set()
          allDoctorsData.forEach(doctor => {
            const specialty = doctor.specialization || doctor.specialty
            if (specialty && specialty.trim()) {
              doctorSpecialties.add(specialty.trim())
            }
          })
          
          // Fetch API specialties
          const specialtiesResponse = await getSpecialties().catch(() => ({ success: false, data: [] }))
          
          // Process API specialties
          const apiSpecialties = new Map()
          if (specialtiesResponse.success && specialtiesResponse.data) {
            const specialtiesData = Array.isArray(specialtiesResponse.data) 
              ? specialtiesResponse.data 
              : specialtiesResponse.data.specialties || []
            
            specialtiesData.forEach(s => {
              const sName = typeof s === 'string' ? s : (s.name || s.label || '')
              if (sName && sName.trim()) {
                const normalized = sName.trim()
                apiSpecialties.set(normalized.toLowerCase(), {
                  id: normalized.toLowerCase().replace(/\s+/g, '_'),
                  label: normalized,
                  name: normalized,
                })
              }
            })
          }
          
          // Merge API specialties with doctor specialties
          const allSpecialties = new Map(apiSpecialties)
          doctorSpecialties.forEach(specialty => {
            const normalized = specialty.toLowerCase()
            if (!allSpecialties.has(normalized)) {
              allSpecialties.set(normalized, {
                id: specialty.toLowerCase().replace(/\s+/g, '_'),
                label: specialty,
                name: specialty,
              })
            }
          })
          
          // Convert to array and sort
          const processedSpecialties = Array.from(allSpecialties.values())
            .sort((a, b) => a.label.localeCompare(b.label))
          
          // Set specialties list with "All Specialties" first
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
      } catch (err) {
        console.error('Error fetching all doctors for specialties:', err)
        // Still try to set specialties from API
        const specialtiesResponse = await getSpecialties().catch(() => ({ success: false, data: [] }))
        if (specialtiesResponse.success && specialtiesResponse.data) {
          const specialtiesData = Array.isArray(specialtiesResponse.data) 
            ? specialtiesResponse.data 
            : specialtiesResponse.data.specialties || []
          
          const processedSpecialties = specialtiesData.map(s => {
            const sName = typeof s === 'string' ? s : (s.name || s.label || '')
            return {
              id: sName.toLowerCase().replace(/\s+/g, '_'),
              label: sName,
              name: sName,
            }
          }).filter(s => s.label)
          
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
      }
    }
    
    // Only fetch once on mount to build specialties list
    fetchAllDoctorsForSpecialties()
  }, []) // Empty dependency array - only run once
  
  // Fetch doctors based on selected specialty and search term
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build filters object, only include defined values
        const filters = {
          limit: 1000, // Fetch all doctors (up to 1000)
          page: 1,
          _t: Date.now(), // Cache busting parameter
        }
        if (selectedSpecialty && selectedSpecialty !== 'all') {
          // Find the actual specialty name from the current specialties list
          const specialtyObj = specialtiesList.find(s => s.id === selectedSpecialty)
          if (specialtyObj && specialtyObj.name && specialtyObj.name !== 'all') {
            filters.specialty = specialtyObj.name
          } else if (specialtiesList.length > 0) {
            // If specialty not found in list, try to convert ID back to name format
            filters.specialty = selectedSpecialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
          // If specialties list is empty, skip specialty filter (will fetch all)
        }
        // When "all" is selected, don't add specialty filter - fetch all doctors
        if (searchTerm && searchTerm.trim()) {
          filters.search = searchTerm.trim()
        }
        
        console.log('🔍 Fetching doctors with filters:', filters) // Debug log
        console.log('🔍 Selected specialty:', selectedSpecialty) // Debug log
        console.log('🔍 Specialties list length:', specialtiesList.length) // Debug log
        
        let doctorsResponse
        try {
          doctorsResponse = await getDiscoveryDoctors(filters)
          console.log('📊 Doctors API response received:', doctorsResponse) // Debug log
          console.log('📊 Response type:', typeof doctorsResponse) // Debug log
          console.log('📊 Response success:', doctorsResponse?.success) // Debug log
          console.log('📊 Response data type:', typeof doctorsResponse?.data) // Debug log
          console.log('📊 Response data:', doctorsResponse?.data) // Debug log
          console.log('📊 Is data array?', Array.isArray(doctorsResponse?.data)) // Debug log
          console.log('📊 Data items?', doctorsResponse?.data?.items) // Debug log
        } catch (apiError) {
          console.error('❌ API Error:', apiError) // Debug log
          console.error('❌ API Error message:', apiError.message) // Debug log
          console.error('❌ API Error response:', apiError.response) // Debug log
          throw apiError
        }
        
        if (doctorsResponse && doctorsResponse.success) {
          // Handle response data structure
          let doctorsData = []
          
          console.log('🔍 Parsing response data structure...') // Debug log
          console.log('🔍 Full response structure:', JSON.stringify(doctorsResponse, null, 2)) // Debug log
          
          if (Array.isArray(doctorsResponse.data)) {
            // If data is directly an array
            doctorsData = doctorsResponse.data
            console.log('📋 Data is array, count:', doctorsData.length) // Debug log
          } else if (doctorsResponse.data && doctorsResponse.data.items) {
            // If data has items property
            doctorsData = Array.isArray(doctorsResponse.data.items) 
              ? doctorsResponse.data.items 
              : []
            console.log('📋 Data has items property, count:', doctorsData.length) // Debug log
            console.log('📋 First item in items array:', doctorsData[0]) // Debug log
          } else if (doctorsResponse.data) {
            // Try to extract any array from data
            doctorsData = []
            console.warn('⚠️ Unexpected data structure:', doctorsResponse.data) // Debug log
            console.warn('⚠️ Data keys:', Object.keys(doctorsResponse.data || {})) // Debug log
          } else {
            console.error('❌ No data property in response!') // Debug log
            console.error('❌ Response keys:', Object.keys(doctorsResponse || {})) // Debug log
          }
          
          console.log('📋 Final doctors data array:', doctorsData) // Debug log
          console.log('📋 Doctors count:', doctorsData.length) // Debug log
          
          if (doctorsData.length === 0) {
            console.warn('⚠️ No doctors found in response data') // Debug log
            console.warn('⚠️ Full response for debugging:', JSON.stringify(doctorsResponse, null, 2)) // Debug log
            setDoctors([])
            setLoading(false)
            return
          }
          
          console.log('✅ Starting transformation of', doctorsData.length, 'doctors') // Debug log
          
          const transformed = doctorsData.map((doctor, index) => {
            console.log(`🔄 Transforming doctor ${index + 1}/${doctorsData.length}:`, {
              id: doctor._id || doctor.id,
              firstName: doctor.firstName,
              lastName: doctor.lastName,
              specialization: doctor.specialization,
              hasClinicDetails: !!doctor.clinicDetails,
            }) // Debug log
            // Format full address
            const formatFullAddress = (clinicDetails) => {
              if (!clinicDetails) return 'Location not available'
              
              const parts = []
              if (clinicDetails.name) parts.push(clinicDetails.name)
              
              if (clinicDetails.address) {
                const addr = clinicDetails.address
                if (addr.line1) parts.push(addr.line1)
                if (addr.line2) parts.push(addr.line2)
                if (addr.city) parts.push(addr.city)
                if (addr.state) parts.push(addr.state)
                if (addr.postalCode) parts.push(addr.postalCode)
                if (addr.country) parts.push(addr.country)
              }
              
              return parts.length > 0 ? parts.join(', ') : 'Location not available'
            }
            
            return {
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
              location: formatFullAddress(doctor.clinicDetails),
              clinicName: doctor.clinicDetails?.name || '',
              clinicAddress: doctor.clinicDetails?.address || {},
            availability: 'Available', // TODO: Calculate from schedule
            nextSlot: 'N/A', // TODO: Get from schedule
            image: doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            languages: doctor.languages || ['English'],
            education: doctor.qualification || doctor.education || 'MBBS',
            bio: doctor.bio || '',
            originalData: doctor,
            }
          })
          
          console.log('✅ Transformation complete. Setting', transformed.length, 'doctors') // Debug log
          console.log('✅ First transformed doctor:', transformed[0]) // Debug log
          
          setDoctors(transformed)
          console.log('✅ Doctors state updated successfully:', transformed.length) // Debug log
        } else {
          console.warn('⚠️ No doctors data in response:', doctorsResponse) // Debug log
          setDoctors([])
        }
      } catch (err) {
        console.error('❌ Error fetching doctors:', err) // Debug log
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response,
        }) // Debug log
        setError(err.message || 'Failed to load doctors')
        toast.error('Failed to load doctors')
        setDoctors([]) // Ensure doctors array is empty on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecialty, searchTerm, toast, specialtiesList])

  // Set specialty from URL query parameter
  useEffect(() => {
    const specialtyFromUrl = searchParams.get('specialty')
    if (specialtyFromUrl) {
      setSelectedSpecialty(specialtyFromUrl)
    }
  }, [searchParams])

  const filteredDoctors = useMemo(() => {
    console.log('🔄 Computing filteredDoctors...', {
      doctorsCount: doctors.length,
      selectedSpecialty,
      searchTerm,
      specialtiesListLength: specialtiesList.length,
    }) // Debug log
    
    const normalizedSearch = searchTerm.trim().toLowerCase()

    let filtered = doctors.filter((doctor) => {
      // For patient view, show all doctors from backend
      // The backend already filters by status: approved and isActive: true
      // So we don't need to filter here
      // Only filter by specialty and search term
      
      // Filter by specialty
      if (selectedSpecialty !== 'all') {
        // Find the actual specialty name from the list
        const specialtyObj = specialtiesList.find(s => s.id === selectedSpecialty)
        const selectedSpecialtyName = specialtyObj?.name || selectedSpecialty.replace(/_/g, ' ')
        const doctorSpecialty = (doctor.specialty || '').toLowerCase()
        const selectedSpecialtyLower = selectedSpecialtyName.toLowerCase()
        
        console.log('🔍 Filtering by specialty:', {
          selectedSpecialty,
          selectedSpecialtyName,
          doctorSpecialty,
          match: doctorSpecialty.includes(selectedSpecialtyLower) || selectedSpecialtyLower.includes(doctorSpecialty),
        }) // Debug log
        
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
        const matches = searchWords.some((word) => searchableFields.includes(word))
        
        return matches
      }

      return true
    })

    console.log('✅ Filtered doctors count:', filtered.length) // Debug log

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
  }, [doctors, searchTerm, selectedSpecialty, sortBy, specialtiesList])

  // Calculate paginated doctors
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDoctors.slice(startIndex, endIndex)
  }, [filteredDoctors, currentPage])

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage)
  const totalItems = filteredDoctors.length

  // Reset to page 1 when search or specialty changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedSpecialty])

  const handleCardClick = (doctorId) => {
    navigate(`/patient/doctors/${doctorId}`)
  }

  return (
    <section className="bg-[#f8fafc] min-h-screen pb-32 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Find Your Specialist</h1>
             <p className="text-sm text-slate-500 font-medium">Book appointments with top-rated doctors near you</p>
          </div>
          
          {/* Search Bar - Responsive width */}
          <div className="relative w-full md:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#11496c' }}>
              <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
            </span>
            <input
              id="doctor-search"
              type="text"
              placeholder="Search by name, specialty, or location..."
              className="w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#11496c]/10 focus:border-[#11496c]"
              style={{ borderColor: 'rgba(17, 73, 108, 0.2)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Specialty Filters - Enhanced Scrollable/Grid */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide [-webkit-overflow-scrolling:touch] px-4 md:px-0">
          {specialtiesList.map((specialty) => {
            const Icon = specialty.icon
            const isSelected = selectedSpecialty === specialty.id
            return (
              <button
                key={specialty.id}
                type="button"
                onClick={() => setSelectedSpecialty(specialty.id)}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-bold transition-all border ${
                  isSelected
                    ? 'text-white shadow-lg'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#11496c]/40 hover:bg-slate-50'
                }`}
                style={isSelected ? { backgroundColor: '#11496c', borderColor: '#11496c', boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.2)' } : {}}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{specialty.label}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 animate-pulse">
                <div className="flex gap-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                   <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                   </div>
                </div>
                <div className="h-32 bg-slate-50 rounded-2xl"></div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[40px] border-2 border-dashed border-red-100 bg-red-50/50 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
               <IoPulseOutline className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-bold text-red-900">Oops! {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-[40px] border-2 border-dashed border-slate-200 bg-white p-16 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <IoSearchOutline className="h-10 w-10" />
            </div>
            <div className="space-y-1">
               <p className="text-xl font-bold text-slate-900">No doctors found matching your criteria</p>
               <p className="text-slate-500 font-medium">Try adjusting your search or filters to find more results</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedDoctors.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => handleCardClick(doctor.id)}
                className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
              >
                <div className="p-6 flex flex-col flex-1 gap-6">
                  {/* Doctor Info Row */}
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="h-20 w-20 rounded-2xl object-cover border border-slate-100 shadow-sm"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=11496c&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white h-6 w-6 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                         <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-[#11496c] transition-colors">{doctor.name}</h3>
                         <span className="text-base font-bold text-slate-900 shrink-0">₹{doctor.consultationFee}</span>
                      </div>
                      <p className="text-[10px] font-bold text-[#11496c] uppercase tracking-wider">{doctor.specialty}</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                        <span className="text-[10px] font-medium text-slate-500">
                          {doctor.rating} ({doctor.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 flex-1">
                     {doctor.clinicName && (
                       <div className="flex items-center gap-3 text-slate-600">
                          <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                             <IoLocationOutline className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-[10px] font-bold text-slate-900 truncate">{doctor.clinicName}</span>
                             <span className="text-[10px] text-slate-400 truncate font-medium">{doctor.location}</span>
                          </div>
                       </div>
                     )}

                     {/* Availability Badge */}
                     <div className="rounded-2xl p-3.5 bg-slate-50 border border-slate-100 group-hover:bg-[#11496c]/5 group-hover:border-[#11496c]/10 transition-colors">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c]" />
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Next Available Slot</span>
                           </div>
                           <span className="text-[9px] font-bold text-emerald-600">Today</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1.5">{doctor.nextSlot || 'Available Now'}</p>
                     </div>
                  </div>

                  {/* Take Token Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCardClick(doctor.id)
                    }}
                    className="w-full text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-lg shadow-[#11496c]/10 hover:shadow-[#11496c]/20 flex items-center justify-center gap-2 active:scale-95"
                    style={{ backgroundColor: '#11496c' }}
                  >
                    Book Appointment <IoArrowForwardOutline className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredDoctors.length > 0 && totalPages > 1 && (
          <div className="pt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default PatientDoctors

