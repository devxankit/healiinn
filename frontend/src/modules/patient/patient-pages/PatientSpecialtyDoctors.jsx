import { useParams, useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5'

// Mock doctors data - matching with PatientDoctors page
const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Alana Rueter',
    specialty: 'Dentist',
    experience: '12 years',
    rating: 4.8,
    reviewCount: 124,
    consultationFee: 500,
    distance: '1.2 km',
    location: 'Sunrise Dental Care, New York',
    availability: 'Available today',
    nextSlot: '09:00 AM',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Spanish'],
    education: 'MD, Dental Surgery',
  },
  {
    id: 'doc-6',
    name: 'Dr. Priya Sharma',
    specialty: 'Dentist',
    experience: '8 years',
    rating: 4.5,
    reviewCount: 67,
    consultationFee: 450,
    distance: '2.3 km',
    location: 'Smile Dental Studio, New York',
    availability: 'Available tomorrow',
    nextSlot: '09:30 AM',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Hindi'],
    education: 'BDS, Dental Surgery',
  },
  {
    id: 'doc-2',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology',
    experience: '15 years',
    rating: 4.9,
    reviewCount: 203,
    consultationFee: 800,
    distance: '2.5 km',
    location: 'Heart Care Center, New York',
    availability: 'Available tomorrow',
    nextSlot: '10:30 AM',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    languages: ['English'],
    education: 'MD, Cardiology',
  },
  {
    id: 'doc-3',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic',
    experience: '18 years',
    rating: 4.7,
    reviewCount: 156,
    consultationFee: 750,
    distance: '3.1 km',
    location: 'Bone & Joint Clinic, New York',
    availability: 'Available today',
    nextSlot: '02:00 PM',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'French'],
    education: 'MD, Orthopedic Surgery',
  },
  {
    id: 'doc-4',
    name: 'Dr. Emily Chen',
    specialty: 'Neurology',
    experience: '10 years',
    rating: 4.6,
    reviewCount: 89,
    consultationFee: 900,
    distance: '1.8 km',
    location: 'Neuro Care Institute, New York',
    availability: 'Available today',
    nextSlot: '11:15 AM',
    image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Mandarin'],
    education: 'MD, Neurology',
  },
  {
    id: 'doc-5',
    name: 'Dr. Michael Brown',
    specialty: 'General',
    experience: '20 years',
    rating: 4.9,
    reviewCount: 312,
    consultationFee: 600,
    distance: '0.9 km',
    location: 'Family Health Clinic, New York',
    availability: 'Available today',
    nextSlot: '03:30 PM',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Spanish'],
    education: 'MD, General Medicine',
  },
]

const specialtyLabels = {
  'dentist': 'Dentist',
  'cardio': 'Cardiology',
  'ortho': 'Orthopedic',
  'neuro': 'Neurology',
  'general': 'General',
}

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-3 w-3 text-yellow-400 fill-current" />)
  }
  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-3 w-3 text-yellow-400" />)
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(<IoStarOutline key={i} className="h-3 w-3 text-slate-300" />)
  }
  return stars
}

const PatientSpecialtyDoctors = () => {
  const { specialtyId } = useParams()
  const navigate = useNavigate()
  
  const specialtyLabel = specialtyLabels[specialtyId] || 'All Specialties'
  
  // Filter doctors by specialty
  const filteredDoctors = mockDoctors.filter((doctor) => {
    if (specialtyId === 'all') return true
    const specialtyMap = {
      'dentist': 'Dentist',
      'cardio': 'Cardiology',
      'ortho': 'Orthopedic',
      'neuro': 'Neurology',
      'general': 'General',
    }
    return doctor.specialty.toLowerCase() === specialtyMap[specialtyId]?.toLowerCase()
  })

  const handleCardClick = (doctorId) => {
    navigate(`/patient/doctors/${doctorId}`)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{specialtyLabel} Doctors</h1>
          <p className="text-sm text-slate-600">{filteredDoctors.length} doctor(s) available</p>
        </div>
      </div>

      {/* Doctors List */}
      {filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No doctors found in this specialty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <article
              key={doctor.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              onClick={() => handleCardClick(doctor.id)}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.15)] blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                      }}
                    />
                    {doctor.availability.includes('today') && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-white" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{doctor.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#11496c] sm:text-sm">{doctor.specialty}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                      <span className="text-xs font-semibold text-slate-700">{doctor.rating}</span>
                      <span className="text-xs text-slate-500">({doctor.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 sm:text-sm">
                  <div className="flex items-center gap-2">
                    <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{doctor.location}</span>
                    <span className="shrink-0 font-semibold text-slate-700">{doctor.distance}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="font-medium text-slate-700">{doctor.availability}</span>
                    {doctor.nextSlot && (
                      <span className="shrink-0 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-xs font-semibold text-[#11496c]">
                        {doctor.nextSlot}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Consultation Fee</p>
                    <p className="text-base font-bold text-slate-900">₹{doctor.consultationFee}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/patient/doctors/${doctor.id}`)
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-[rgba(17,73,108,0.1)]0 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
                  >
                    <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                    Book
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PatientSpecialtyDoctors

