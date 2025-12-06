import { useState, useEffect, useMemo } from 'react'
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
import { getPatientAppointments, rescheduleAppointment } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

// Default appointments (will be replaced by API data)
const defaultAppointments = []

// Map backend status to frontend display status
const mapBackendStatusToDisplay = (backendStatus) => {
  switch (backendStatus) {
    case 'scheduled':
      return 'scheduled' // Backend 'scheduled' shows as 'scheduled' for patient
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'no_show':
      return 'no_show'
    default:
      return backendStatus || 'scheduled'
  }
}

// Helper function to convert time to 12-hour format
const convertTimeTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getStatusColor = (status) => {
  // Handle both backend and frontend statuses
  const displayStatus = mapBackendStatusToDisplay(status)
  
  switch (displayStatus) {
    case 'confirmed':
      return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
    case 'scheduled':
      return 'bg-blue-100 text-blue-700'
    case 'upcoming': // Legacy support
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    case 'no_show':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusIcon = (status) => {
  const displayStatus = mapBackendStatusToDisplay(status)
  switch (displayStatus) {
    case 'confirmed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'scheduled':
      return <IoCalendarOutline className="h-4 w-4" />
    case 'upcoming': // Legacy support
      return <IoCalendarOutline className="h-4 w-4" />
    case 'completed':
      return <IoCheckmarkCircleOutline className="h-4 w-4" />
    case 'cancelled':
      return <IoCloseCircleOutline className="h-4 w-4" />
    default:
      return null
  }
}

const PatientAppointments = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [appointments, setAppointments] = useState(defaultAppointments)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch appointments from API - Always fetch all appointments, filter on frontend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        // Always fetch all appointments, we'll filter on frontend
        const response = await getPatientAppointments({})
        
        if (response.success && response.data) {
          // Handle both array and object with items/appointments property
          const appointmentsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || response.data.appointments || []
          
          // Transform API data to match component structure
          const transformedAppointments = appointmentsData.map(apt => ({
            id: apt._id || apt.id,
            _id: apt._id || apt.id,
            doctor: apt.doctorId ? {
              id: apt.doctorId._id || apt.doctorId.id,
              name: apt.doctorId.firstName && apt.doctorId.lastName
                ? `Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`
                : apt.doctorId.name || 'Dr. Unknown',
              specialty: apt.doctorId.specialization || apt.doctorId.specialty || '',
              image: apt.doctorId.profileImage || apt.doctorId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorId.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            } : apt.doctor || {},
            date: apt.appointmentDate || apt.date,
            time: convertTimeTo12Hour(apt.time || ''),
            status: apt.status || 'scheduled',
            type: apt.appointmentType || apt.type || 'In-Person',
            clinic: apt.doctorId?.clinicDetails?.name || apt.clinicDetails?.name || apt.clinic || '',
            location: (() => {
              // Try to get location from doctor's clinicDetails first
              const doctorClinic = apt.doctorId?.clinicDetails;
              if (doctorClinic?.address) {
                const parts = [];
                if (doctorClinic.address.line1) parts.push(doctorClinic.address.line1);
                if (doctorClinic.address.city) parts.push(doctorClinic.address.city);
                if (doctorClinic.address.state) parts.push(doctorClinic.address.state);
                if (doctorClinic.address.pincode) parts.push(doctorClinic.address.pincode);
                return parts.join(', ').trim();
              }
              // Fallback to appointment's clinicDetails
              const aptClinic = apt.clinicDetails;
              if (aptClinic?.address) {
                const parts = [];
                if (aptClinic.address.line1) parts.push(aptClinic.address.line1);
                if (aptClinic.address.city) parts.push(aptClinic.address.city);
                if (aptClinic.address.state) parts.push(aptClinic.address.state);
                if (aptClinic.address.pincode) parts.push(aptClinic.address.pincode);
                return parts.join(', ').trim();
              }
              return apt.location || '';
            })(),
            token: apt.tokenNumber ? `Token #${apt.tokenNumber}` : apt.token || null,
            fee: apt.fee || apt.consultationFee || 0,
            cancelledBy: apt.cancelledBy,
            cancelReason: apt.cancelReason,
            rescheduledAt: apt.rescheduledAt,
            rescheduledBy: apt.rescheduledBy,
            rescheduleReason: apt.rescheduleReason,
            isRescheduled: !!apt.rescheduledAt, // Flag to identify rescheduled appointments
          }))
          
          setAppointments(transformedAppointments)
        }
      } catch (err) {
        console.error('Error fetching appointments:', err)
        setError(err.message || 'Failed to load appointments')
        toast.error('Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
    
    // Listen for appointment booking event to refresh
    const handleAppointmentBooked = () => {
      fetchAppointments()
    }
    window.addEventListener('appointmentBooked', handleAppointmentBooked)
    
    return () => {
      window.removeEventListener('appointmentBooked', handleAppointmentBooked)
    }
  }, [toast]) // Remove filter dependency - fetch all appointments once

  const handleRescheduleAppointment = (appointmentId, doctorId) => {
    navigate(`/patient/doctors/${doctorId}?reschedule=${appointmentId}`)
  }

  // Calculate filtered appointments - MUST be before early returns (React Hooks rule)
  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return []
    }
    
    if (filter === 'all') {
      return appointments
    } else if (filter === 'rescheduled') {
      return appointments.filter(apt => apt.isRescheduled)
    } else if (filter === 'scheduled') {
      return appointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        // Show scheduled appointments but exclude rescheduled ones
        return (displayStatus === 'scheduled' || apt.status === 'upcoming') && !apt.isRescheduled
      })
    } else {
      return appointments.filter(apt => {
        const displayStatus = mapBackendStatusToDisplay(apt.status)
        return displayStatus === filter
      })
    }
  }, [appointments, filter])

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
        {['all', 'scheduled', 'rescheduled', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              filter === status
                ? 'bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status === 'scheduled' ? 'Scheduled' : status === 'rescheduled' ? 'Rescheduled' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                {(() => {
                  const displayStatus = mapBackendStatusToDisplay(appointment.status)
                  return (displayStatus === 'confirmed' || displayStatus === 'scheduled' || appointment.status === 'upcoming')
                })() && (
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
                  {(() => {
                    const displayStatus = mapBackendStatusToDisplay(appointment.status)
                    // Show "Rescheduled" badge for rescheduled appointments
                    const statusText = appointment.isRescheduled 
                      ? 'Rescheduled' 
                      : displayStatus === 'scheduled' 
                        ? 'Scheduled' 
                        : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${appointment.isRescheduled ? 'bg-blue-100 text-blue-700' : getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {statusText}
                      </span>
                    )
                  })()}
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
                  {(appointment.location || appointment.clinic) && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{appointment.location || appointment.clinic || 'Location not available'}</span>
                    </div>
                  )}
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
                        handleRescheduleAppointment(appointment.id, appointment.doctor.id)
                      }}
                      className="flex-1 w-full rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      Reschedule Appointment
                    </button>
                  </div>
                )}
                {(appointment.status === 'confirmed' || appointment.status === 'scheduled' || appointment.status === 'upcoming') && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                      className="flex-1 rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      View Details
                    </button>
                    {!appointment.isRescheduled && (
                      <button
                        onClick={() => handleRescheduleAppointment(appointment.id, appointment.doctor.id)}
                        className="flex-1 rounded-xl border border-[#11496c] bg-white px-3 py-2 text-xs font-semibold text-[#11496c] transition hover:bg-[#11496c]/5 active:scale-95"
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                )}
                {appointment.isRescheduled && (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                      <p className="text-xs font-semibold text-blue-800 mb-1">
                        Rescheduled Appointment
                      </p>
                      {appointment.rescheduleReason && (
                        <p className="text-xs text-blue-700">
                          {appointment.rescheduleReason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/patient/doctors/${appointment.doctor.id}`)}
                        className="flex-1 rounded-xl bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && filteredAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <IoCalendarOutline className="h-8 w-8" />
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {appointments && appointments.length > 0 
              ? `No ${filter === 'all' ? '' : filter.charAt(0).toUpperCase() + filter.slice(1)} appointments found`
              : 'No appointments available'}
          </p>
          {appointments && appointments.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">Try selecting a different filter</p>
          )}
        </div>
      )}
    </section>
  )
}

export default PatientAppointments

