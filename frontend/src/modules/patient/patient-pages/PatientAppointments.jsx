import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCallOutline,
} from 'react-icons/io5'

const mockAppointments = [
  {
    id: 'appt-1',
    doctor: {
      id: 'doc-1',
      name: 'Dr. Rajesh Kumar',
      specialty: 'General Physician',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    },
    date: '2025-01-15',
    time: '10:00 AM',
    status: 'upcoming',
    type: 'In-Person',
    clinic: 'Shivaji Nagar Clinic',
    location: '123 Market Street, Pune, Maharashtra',
    token: 'Token #12',
    fee: 500,
  },
  {
    id: 'appt-2',
    doctor: {
      id: 'doc-2',
      name: 'Dr. Priya Sharma',
      specialty: 'Pediatrician',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    },
    date: '2025-01-16',
    time: '02:30 PM',
    status: 'upcoming',
    type: 'In-Person',
    clinic: 'Central Hospital',
    location: '77 Elm Avenue, Pune, Maharashtra',
    token: 'Token #8',
    fee: 600,
  },
  {
    id: 'appt-3',
    doctor: {
      id: 'doc-3',
      name: 'Dr. Amit Patel',
      specialty: 'Cardiologist',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    },
    date: '2025-01-17',
    time: '11:00 AM',
    status: 'upcoming',
    type: 'In-Person',
    clinic: 'Heart Care Center',
    location: '200 Park Ave, Pune, Maharashtra',
    token: 'Token #15',
    fee: 800,
  },
  {
    id: 'appt-4',
    doctor: {
      id: 'doc-4',
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    },
    date: '2024-12-20',
    time: '10:30 AM',
    status: 'completed',
    type: 'In-Person',
    clinic: 'Heart Care Center',
    location: '200 Park Ave, New York, NY',
    token: 'Token #8',
    fee: 800,
  },
  {
    id: 'appt-5',
    doctor: {
      id: 'doc-5',
      name: 'Dr. James Wilson',
      specialty: 'Orthopedic',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    },
    date: '2024-12-18',
    time: '02:00 PM',
    status: 'completed',
    type: 'Video Call',
    clinic: 'Bone & Joint Clinic',
    location: '150 Broadway, New York, NY',
    token: null,
    fee: 750,
  },
  {
    id: 'appt-6',
    doctor: {
      id: 'doc-6',
      name: 'Dr. Emily Chen',
      specialty: 'Neurology',
      image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
    },
    date: '2025-01-15',
    time: '11:15 AM',
    status: 'cancelled',
    type: 'In-Person',
    clinic: 'Neuro Care Institute',
    location: '100 Main St, New York, NY',
    token: null,
    fee: 900,
    cancelledBy: 'doctor',
    cancelReason: 'Doctor unavailable due to emergency',
  },
  {
    id: 'appt-7',
    doctor: {
      id: 'doc-7',
      name: 'Dr. Michael Brown',
      specialty: 'General',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    },
    date: '2024-12-12',
    time: '03:30 PM',
    status: 'completed',
    type: 'In-Person',
    clinic: 'Family Health Clinic',
    location: '50 State St, New York, NY',
    token: 'Token #5',
    fee: 600,
  },
]

const PatientAppointments = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filteredAppointments = filter === 'all'
    ? mockAppointments
    : mockAppointments.filter(apt => apt.status === filter)

  // Ensure we have data
  if (!mockAppointments || mockAppointments.length === 0) {
    return (
      <section className="flex flex-col gap-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No appointments available</p>
        </div>
      </section>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
      case 'upcoming':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <IoCheckmarkCircleOutline className="h-4 w-4" />
      case 'upcoming':
        return <IoCalendarOutline className="h-4 w-4" />
      case 'completed':
        return <IoCheckmarkCircleOutline className="h-4 w-4" />
      case 'cancelled':
        return <IoCloseCircleOutline className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'upcoming', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={appointment.doctor.image}
                  alt={appointment.doctor.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                {(appointment.status === 'confirmed' || appointment.status === 'upcoming') && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white">
                    <IoCalendarOutline className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{appointment.doctor.name}</h3>
                    <p className="text-sm text-[#11496c]">{appointment.doctor.specialty}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {appointment.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <IoCalendarOutline className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoTimeOutline className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{appointment.time}</span>
                    {appointment.token && (
                      <span className="ml-2 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-xs font-semibold text-[#11496c]">
                        {appointment.token}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{appointment.clinic}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">{appointment.type}</span>
                    <span className="text-sm font-semibold text-slate-900">₹{appointment.fee}</span>
                  </div>
                </div>

                {appointment.status === 'cancelled' && (
                  <div className="mt-3 space-y-2">
                    {appointment.cancelledBy === 'doctor' && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5">
                        <p className="text-xs font-semibold text-orange-800 mb-1">
                          Cancelled by Doctor
                        </p>
                        {appointment.cancelReason && (
                          <p className="text-xs text-orange-700">
                            Reason: {appointment.cancelReason}
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Navigate to doctor details page with booking modal open for rescheduling
                        navigate(`/patient/doctors/${appointment.doctor.id}?book=true&reschedule=${appointment.id}`)
                      }}
                      className="flex-1 w-full rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      Reschedule Appointment
                    </button>
                  </div>
                )}
                {(appointment.status === 'confirmed' || appointment.status === 'upcoming') && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                      className="flex-1 rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      View Details
                    </button>
                    <button
                      className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:bg-slate-50 active:scale-95"
                    >
                      <IoCallOutline className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoCalendarOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">No appointments found</p>
          <p className="text-sm text-slate-500">Try selecting a different filter</p>
        </div>
      )}
    </section>
  )
}

export default PatientAppointments

