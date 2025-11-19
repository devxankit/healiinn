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

// Mock doctors data
const mockDoctors = {
  'doc-1': {
    id: 'doc-1',
    name: 'Dr. Alana Rueter',
    specialty: 'Dentist',
    experience: '12 years',
    rating: 4.8,
    reviewCount: 124,
    consultationFee: 500,
    distance: '1.2 km',
    location: 'ElevateDental, New York',
    availability: 'Available today',
    nextSlot: '09:00 AM',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Spanish'],
    education: 'MD, Dental Surgery',
  },
  'doc-4': {
    id: 'doc-4',
    name: 'Dr. Emily Chen',
    specialty: 'Dentist',
    experience: '8 years',
    rating: 4.7,
    reviewCount: 89,
    consultationFee: 450,
    distance: '1.2 km',
    location: 'ElevateDental, New York',
    availability: 'Available tomorrow',
    nextSlot: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Mandarin'],
    education: 'DDS, Dental Medicine',
  },
  'doc-5': {
    id: 'doc-5',
    name: 'Dr. Michael Thompson',
    specialty: 'Dentist',
    experience: '10 years',
    rating: 4.6,
    reviewCount: 95,
    consultationFee: 480,
    distance: '2.0 km',
    location: 'DentaCare Clinic, New York',
    availability: 'Available today',
    nextSlot: '11:30 AM',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    languages: ['English'],
    education: 'DDS, Oral Surgery',
  },
}

const hospitals = {
  'elevate': {
    id: 'elevate',
    name: 'ElevateDental',
    rating: 4.8,
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-4'],
  },
  'dentacare': {
    id: 'dentacare',
    name: 'DentaCare Clinic',
    rating: 4.6,
    distance: '2.0 km',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-5'],
  },
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

const PatientHospitalDoctors = () => {
  const { hospitalId } = useParams()
  const navigate = useNavigate()
  
  const hospital = hospitals[hospitalId]
  const hospitalDoctors = hospital 
    ? hospital.doctors.map(doctorId => mockDoctors[doctorId]).filter(Boolean)
    : []

  if (!hospital) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-slate-700">
        <h1 className="text-2xl font-bold">Hospital Not Found</h1>
        <p className="mt-2">The hospital you are looking for does not exist.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-[#11496c] text-white rounded-lg shadow hover:bg-[#0d3a52]"
        >
          Go Back
        </button>
      </section>
    )
  }

  const handleDoctorClick = (doctorId) => {
    navigate(`/patient/doctors/${doctorId}?book=true`)
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
          <h1 className="text-2xl font-bold text-slate-900">Doctors at {hospital.name}</h1>
          <p className="text-sm text-slate-600">{hospitalDoctors.length} doctor(s) available</p>
        </div>
      </div>

      {/* Doctors List */}
      {hospitalDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No doctors available at this hospital.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {hospitalDoctors.map((doctor) => (
            <article
              key={doctor.id}
              onClick={() => handleDoctorClick(doctor.id)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
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
                    <div className="mt-3 space-y-2 text-xs text-slate-600 sm:text-sm">
                      <div className="flex items-center gap-2">
                        <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{doctor.location}</span>
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
                          handleDoctorClick(doctor.id)
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#11496c] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
                      >
                        <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PatientHospitalDoctors

