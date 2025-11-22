import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoFlaskOutline,
  IoMedicalOutline,
  IoNotificationsOutline,
  IoMenuOutline,
  IoHomeOutline,
  IoBagHandleOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoWalletOutline,
  IoHelpCircleOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5'
import PatientSidebar from '../patient-components/PatientSidebar'

// Category cards data
const categoryCards = [
  {
    id: 'appointments',
    title: 'APPOINTMENTS',
    value: '12',
    description: 'Upcoming',
    iconBgColor: '#1976D2', // dark blue
    icon: IoCalendarOutline,
    route: '/patient/appointments',
  },
  {
    id: 'prescriptions',
    title: 'PRESCRIPTIONS',
    value: '8',
    description: 'Active',
    iconBgColor: '#14B8A6', // teal-green
    icon: IoDocumentTextOutline,
    route: '/patient/prescriptions',
  },
  {
    id: 'lab-tests',
    title: 'LAB TESTS',
    value: '5',
    description: 'Pending',
    iconBgColor: '#F97316', // orange
    icon: IoFlaskOutline,
    route: '/patient/laboratory',
  },
  {
    id: 'medicines',
    title: 'MEDICINES',
    value: '15',
    description: 'Available',
    iconBgColor: '#EC4899', // pink/magenta
    icon: IoStarOutline,
    route: '/patient/pharmacy',
  },
  {
    id: 'orders',
    title: 'ORDERS',
    value: '3',
    description: 'Recent',
    iconBgColor: '#3B82F6', // blue
    icon: IoBagHandleOutline,
    route: '/patient/orders',
  },
  {
    id: 'requests',
    title: 'REQUESTS',
    value: '2',
    description: 'Responses',
    iconBgColor: '#8B5CF6', // purple
    icon: IoChatbubbleOutline,
    route: '/patient/requests',
  },
]

// Mock upcoming appointments data
const mockUpcomingAppointments = [
  {
    id: 'apt-1',
    doctorName: 'Dr. Rajesh Kumar',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    specialty: 'General Physician',
    clinic: 'Shivaji Nagar Clinic',
    date: '2025-01-15',
    time: '10:00 AM',
    status: 'confirmed',
  },
  {
    id: 'apt-2',
    doctorName: 'Dr. Priya Sharma',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    specialty: 'Pediatrician',
    clinic: 'Central Hospital',
    date: '2025-01-16',
    time: '02:30 PM',
    status: 'confirmed',
  },
  {
    id: 'apt-3',
    doctorName: 'Dr. Amit Patel',
    doctorImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    specialty: 'Cardiologist',
    clinic: 'Heart Care Center',
    date: '2025-01-17',
    time: '11:00 AM',
    status: 'pending',
  },
]

// Mock doctors data matching the image
const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Rajesh Kumar',
    specialty: 'General Physician',
    clinic: 'Shivaji Nagar Clinic',
    rating: 4.8,
    reviewCount: 245,
    fee: 500,
    distance: '2.3 km',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    isServing: true,
    currentToken: 18,
    eta: '11:35',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Sharma',
    specialty: 'Pediatrician',
    clinic: 'Central Hospital',
    rating: 4.9,
    reviewCount: 189,
    fee: 600,
    distance: '1.8 km',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    isServing: true,
    currentToken: 12,
    eta: '10:20',
  },
]

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

const navItems = [
  { id: 'home', label: 'Home', to: '/patient/dashboard', Icon: IoHomeOutline },
  { id: 'pharmacy', label: 'Pharmacy', to: '/patient/pharmacy', Icon: IoBagHandleOutline },
  { id: 'doctors', label: 'Doctors', to: '/patient/doctors', Icon: IoPeopleOutline },
  { id: 'laboratory', label: 'Laboratory', to: '/patient/laboratory', Icon: IoFlaskOutline },
  { id: 'support', label: 'Support', to: '/patient/support', Icon: IoHelpCircleOutline },
  { id: 'profile', label: 'Profile', to: '/patient/profile', Icon: IoPersonCircleOutline },
]

const PatientDashboard = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleButtonRef = useRef(null)

  const filteredDoctors = useMemo(() => {
    let doctors = [...mockDoctors]

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      doctors = doctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(normalizedSearch) ||
          doctor.specialty.toLowerCase().includes(normalizedSearch) ||
          doctor.clinic.toLowerCase().includes(normalizedSearch)
      )
    }

    // Apply filters
    if (activeFilter === 'Nearest') {
      doctors.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    } else if (activeFilter === 'Shortest Wait') {
      doctors.sort((a, b) => a.currentToken - b.currentToken)
    } else if (activeFilter === 'Highest') {
      doctors.sort((a, b) => b.rating - a.rating)
    }

    return doctors
  }, [searchTerm, activeFilter])

  const handleTakeToken = (doctorId, fee) => {
    navigate(`/patient/doctors/${doctorId}?book=true`)
  }

  const handleSidebarToggle = () => {
    if (isSidebarOpen) {
      handleSidebarClose()
    } else {
      setIsSidebarOpen(true)
    }
  }

  const handleSidebarClose = () => {
    toggleButtonRef.current?.focus({ preventScroll: true })
    setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    handleSidebarClose()
    localStorage.removeItem('patientAuthToken')
    localStorage.removeItem('patientRefreshToken')
    sessionStorage.removeItem('patientAuthToken')
    sessionStorage.removeItem('patientRefreshToken')
    navigate('/patient/login', { replace: true })
  }

  return (
    <section className="flex flex-col gap-4 pb-4 -mt-20">
      {/* Top Header with Gradient Background */}
      <header 
        className="relative text-white -mx-4 mb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #11496c 0%, #1a5a7a 50%, #2a7a9a 100%)'
        }}
      >
        <div className="px-4 pt-5 pb-4">
          {/* Top Row: Brand and Icons */}
          <div className="flex items-start justify-between mb-3.5">
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-white leading-tight mb-0.5">Healiinn</h1>
              <p className="text-sm font-normal text-white/95 leading-tight">Digital Healthcare</p>
            </div>
            <div className="flex items-center gap-4 pt-0.5">
              <IoNotificationsOutline className="h-6 w-6 text-white" strokeWidth={1.5} />
              <button
                type="button"
                ref={toggleButtonRef}
                onClick={handleSidebarToggle}
                className="flex items-center justify-center p-1 rounded-lg transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Toggle navigation menu"
              >
                <IoMenuOutline className="h-6 w-6 text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* Location Row */}
          <div className="flex items-center gap-1.5">
            <IoLocationOutline className="h-4 w-4 text-white" strokeWidth={2} />
            <span className="text-xs font-normal text-white">Pune, Maharashtra • 15 km radius</span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors or specialties"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
            onFocus={(e) => {
              e.target.style.borderColor = '#11496c'
              e.target.style.boxShadow = '0 0 0 2px rgba(17, 73, 108, 0.2)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = ''
              e.target.style.boxShadow = ''
            }}
          />
        </div>
      </div>

      {/* Category Cards - 3x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categoryCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-left transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 leading-tight flex-1 min-w-0 pr-1">
                  {card.title}
                </h3>
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: card.iconBgColor }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-0.5 leading-none">{card.value}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{card.description}</p>
            </button>
          )
        })}
      </div>

      {/* Upcoming Schedule Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Schedule</h2>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="flex items-center gap-1 text-sm font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
          >
            <span>See All</span>
            <IoArrowForwardOutline className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {mockUpcomingAppointments.slice(0, 2).map((appointment) => (
            <div
              key={appointment.id}
              onClick={() => {
                // Navigate to appointment details or appointments page with appointment ID
                navigate(`/patient/appointments?appointment=${appointment.id}`)
              }}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#11496c] hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <img
                src={appointment.doctorImage}
                alt={appointment.doctorName}
                className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.doctorName)}&background=11496c&color=fff&size=128&bold=true`
                }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-0.5 leading-tight">{appointment.doctorName}</h3>
                <p className="text-xs text-slate-600 mb-1.5">{appointment.specialty}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-1">
                  <div className="flex items-center gap-1">
                    <IoCalendarOutline className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IoTimeOutline className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{appointment.time}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{appointment.clinic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Filter Buttons */}
        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['All', 'Nearest', 'Shortest Wait', 'Highest'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
              style={activeFilter === filter ? { backgroundColor: '#11496c' } : {}}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Doctor Cards */}
        <div className="space-y-4">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => navigate(`/patient/doctors/${doctor.id}`)}
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
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=11496c&color=fff&size=128&bold=true`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight">{doctor.name}</h3>
                    <p className="text-xs text-slate-600 mb-0.5">{doctor.specialty}</p>
                    <p className="text-xs text-slate-500 mb-1.5">{doctor.clinic}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                      <span className="text-xs font-semibold text-slate-700">
                        {doctor.rating} ({doctor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-base font-bold text-slate-900 mb-1">₹{doctor.fee}</div>
                    <div className="flex items-center justify-end gap-1 text-xs text-slate-600">
                      <IoLocationOutline className="h-3.5 w-3.5" />
                      <span>{doctor.distance}</span>
                    </div>
                  </div>
                </div>

                {/* Availability Section */}
                {doctor.isServing && (
                  <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)', border: '1px solid rgba(17, 73, 108, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-semibold text-slate-800">Now Serving</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1.5">Your ETA if you book now:</p>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900">Token #{doctor.currentToken}</span>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <IoTimeOutline className="h-3.5 w-3.5" />
                        <span className="font-medium">{doctor.eta}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Take Token Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTakeToken(doctor.id, doctor.fee)
                  }}
                  className="w-full text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm"
                  style={{ 
                    backgroundColor: '#11496c',
                  }}
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
                  Take Token • ₹{doctor.fee}
                </button>
              </div>
            </div>
          ))}
        </div>

      {/* Sidebar */}
      <PatientSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </section>
  )
}

export default PatientDashboard
