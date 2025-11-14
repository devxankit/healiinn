import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5'

const hospitals = [
  {
    id: 'elevate',
    name: 'ElevateDental',
    rating: 4.8,
    distance: '1.2 km',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-4'],
  },
  {
    id: 'dentacare',
    name: 'DentaCare Clinic',
    rating: 4.6,
    distance: '2.0 km',
    image:
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-5'],
  },
]

const PatientHospitals = () => {
  const navigate = useNavigate()

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
          <h1 className="text-2xl font-bold text-slate-900">All Hospitals</h1>
          <p className="text-sm text-slate-600">{hospitals.length} hospitals available</p>
        </div>
      </div>

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((hospital) => (
          <article
            key={hospital.id}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <figure className="relative h-48 w-full overflow-hidden">
              <img 
                src={hospital.image} 
                alt={hospital.name} 
                className="h-full w-full object-cover bg-slate-100" 
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(hospital.name)}&background=3b82f6&color=fff&size=128&bold=true`
                }}
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-blue-600 shadow-sm">
                ⭐ {hospital.rating}
              </span>
            </figure>
            <div className="space-y-3 p-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{hospital.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <IoLocationOutline className="h-4 w-4" />
                  <span>Distance {hospital.distance}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/patient/hospitals/${hospital.id}/doctors`)}
                className="w-full rounded-2xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-transform hover:bg-blue-600 active:scale-[0.98]"
              >
                <IoCalendarOutline className="inline h-4 w-4 mr-1.5" />
                Book appointment
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PatientHospitals

