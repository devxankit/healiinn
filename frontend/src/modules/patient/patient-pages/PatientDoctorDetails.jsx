import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCallOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoPersonOutline,
  IoCardOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5'

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
    location: 'Sunrise Dental Care, New York',
    availability: 'Available today',
    nextSlot: '09:00 AM',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    languages: ['English', 'Spanish'],
    education: 'MD, Dental Surgery',
    about: 'Experienced dentist with expertise in cosmetic and restorative dentistry.',
    phone: '+1-555-214-0098',
  },
  'doc-2': {
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
    about: 'Board-certified cardiologist specializing in preventive heart care.',
    phone: '+1-555-909-4433',
  },
  'doc-3': {
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
    about: 'Specialist in joint replacement and sports medicine.',
    phone: '+1-555-712-0080',
  },
  'doc-4': {
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
    about: 'Expert in neurological disorders and brain health.',
    phone: '+1-555-367-5511',
  },
  'doc-5': {
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
    about: 'Comprehensive family medicine with focus on preventive care.',
    phone: '+1-555-211-0800',
  },
  'doc-6': {
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
    about: 'Passionate about pediatric and general dentistry.',
    phone: '+1-555-712-1100',
  },
}

const renderStars = (rating) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(<IoStar key={i} className="h-5 w-5 text-amber-400" />)
  }

  if (hasHalfStar) {
    stars.push(<IoStarOutline key="half" className="h-5 w-5 text-amber-400" />)
  }

  const remainingStars = 5 - Math.ceil(rating)
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<IoStarOutline key={`empty-${i}`} className="h-5 w-5 text-slate-300" />)
  }

  return stars
}

// Get next 7 days
const getAvailableDates = () => {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      isToday: i === 0,
      isTomorrow: i === 1,
    })
  }
  return dates
}

const PatientDoctorDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const doctor = mockDoctors[id]
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [appointmentType, setAppointmentType] = useState('in_person')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPrescriptions, setSelectedPrescriptions] = useState([]) // Prescriptions to share
  const [bookingStep, setBookingStep] = useState(1) // 1: Date/Time, 2: Details, 3: Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const availableDates = getAvailableDates()

  // Function to get session info and token availability for selected date
  const getSessionInfoForDate = (date) => {
    try {
      const doctorSessions = JSON.parse(localStorage.getItem('doctorSessions') || '[]')
      const sessionForDate = doctorSessions.find(
        (s) => s.date === date && (s.status === 'scheduled' || s.status === 'active')
      )
      
      if (!sessionForDate) {
        return { available: false, maxTokens: 0, currentBookings: 0, nextToken: null }
      }
      
      // Count existing appointments for this date and doctor
      const doctorAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]')
      const patientAppointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      
      // Combine both sources
      const allAppointments = [...doctorAppointments, ...patientAppointments]
      
      // Filter appointments for this date and doctor
      const appointmentsForDate = allAppointments.filter(
        (apt) => apt.appointmentDate === date && apt.doctorId === doctor.id && 
        apt.status !== 'cancelled' && apt.status !== 'no-show' && apt.status !== 'completed'
      )
      
      const currentBookings = appointmentsForDate.length
      const maxTokens = sessionForDate.maxTokens || 0
      const nextToken = currentBookings < maxTokens ? currentBookings + 1 : null
      const available = currentBookings < maxTokens
      
      return {
        available,
        maxTokens,
        currentBookings,
        nextToken,
        session: sessionForDate,
      }
    } catch (error) {
      console.error('Error getting session info:', error)
      return { available: false, maxTokens: 0, currentBookings: 0, nextToken: null }
    }
  }

  useEffect(() => {
    if (showBookingModal) {
      // Set default date to tomorrow or today if available
      const dates = getAvailableDates()
      const tomorrow = dates.find((d) => d.isTomorrow)
      if (tomorrow) {
        setSelectedDate(tomorrow.value)
      }
    }
  }, [showBookingModal])

  useEffect(() => {
    if (showBookingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showBookingModal])

  // Auto-open booking modal if 'book' query parameter is present
  useEffect(() => {
    if (doctor && searchParams.get('book') === 'true') {
      setShowBookingModal(true)
      // Remove the query parameter from URL
      navigate(`/patient/doctors/${id}`, { replace: true })
    }
  }, [doctor, searchParams, navigate, id])

  // Load patient prescriptions from localStorage
  const getPatientPrescriptions = () => {
    try {
      const patientId = 'pat-current' // In real app, get from auth
      const patientPrescriptionsKey = `patientPrescriptions_${patientId}`
      const saved = localStorage.getItem(patientPrescriptionsKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading patient prescriptions:', error)
    }
    return []
  }

  const handleBookingClick = () => {
    setShowBookingModal(true)
    setBookingStep(1)
    setSelectedDate('')
    setAppointmentType('in_person')
    setReason('')
    setNotes('')
    setSelectedPrescriptions([])
  }

  const handleCloseModal = () => {
    setShowBookingModal(false)
    setBookingStep(1)
  }

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedDate) {
      // Check if booking is available for selected date
      const sessionInfo = getSessionInfoForDate(selectedDate)
      if (!sessionInfo.available) {
        alert('This date is fully booked. Please select another date.')
        return
      }
      setBookingStep(2)
    } else if (bookingStep === 2) {
      setBookingStep(3)
    }
  }

  const handlePreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1)
    }
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    
    // Get shared prescription data
    const sharedPrescriptionsData = selectedPrescriptions.map((prescId) => {
      const patientPrescriptions = getPatientPrescriptions()
      return patientPrescriptions.find((p) => p.id === prescId)
    }).filter(Boolean)

    // Get token number for this booking
    const sessionInfo = getSessionInfoForDate(selectedDate)
    if (!sessionInfo.available || !sessionInfo.nextToken) {
      alert('This date is no longer available. Please select another date.')
      setIsSubmitting(false)
      setBookingStep(1)
      return
    }

    // Create appointment data
    const appointmentData = {
      id: `appt-${Date.now()}`,
      doctorId: doctor.id,
      patientId: 'pat-current', // In real app, get from auth
      patientName: 'Current Patient', // In real app, get from auth
      age: 30, // In real app, get from patient profile
      gender: 'male', // In real app, get from patient profile
      appointmentDate: selectedDate,
      appointmentType: appointmentType === 'in_person' ? 'New' : 'Follow-up',
      status: 'waiting',
      queueNumber: sessionInfo.nextToken, // Assign token number
      reason: reason || 'Consultation',
      patientImage: `https://ui-avatars.com/api/?name=Patient&background=11496c&color=fff&size=160`,
      patientPhone: '+1-555-000-0000', // In real app, get from patient profile
      patientEmail: 'patient@example.com', // In real app, get from patient profile
      patientAddress: '123 Patient Street', // In real app, get from patient profile
      sharedPrescriptions: sharedPrescriptionsData, // Prescriptions shared by patient
      sharedPrescriptionIds: selectedPrescriptions, // IDs of shared prescriptions
      createdAt: new Date().toISOString(),
    }
    
    // Save appointment to localStorage (this will be picked up by doctor's session)
    try {
      const existingAppointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]')
      existingAppointments.push(appointmentData)
      localStorage.setItem('patientAppointments', JSON.stringify(existingAppointments))
      
      // Also add to doctor's appointments if session exists for that date
      const doctorSessions = JSON.parse(localStorage.getItem('doctorSessions') || '[]')
      const sessionForDate = doctorSessions.find(
        (s) => s.date === selectedDate && (s.status === 'scheduled' || s.status === 'active')
      )
      
      if (sessionForDate) {
        const doctorAppointments = JSON.parse(localStorage.getItem('doctorAppointments') || '[]')
        doctorAppointments.push(appointmentData)
        localStorage.setItem('doctorAppointments', JSON.stringify(doctorAppointments))
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
    }
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Booking confirmed:', appointmentData)
    
    setIsSubmitting(false)
    alert('Appointment booked successfully! You will receive a confirmation shortly.')
    
    // Show success and close after delay
    setTimeout(() => {
      handleCloseModal()
    }, 2000)
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-semibold text-slate-700">Doctor not found</p>
        <button
          onClick={() => navigate('/patient/doctors')}
          className="rounded-lg bg-[#11496c] px-4 py-2 text-white font-semibold hover:bg-[#0d3a52]"
        >
          Back to Doctors
        </button>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6 pb-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative shrink-0">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl object-cover ring-2 ring-slate-100 bg-slate-100"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=160&bold=true`
              }}
            />
            {doctor.availability.includes('today') && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <IoCheckmarkCircleOutline className="h-4 w-4 text-white" aria-hidden="true" />
              </span>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{doctor.name}</h1>
              <p className="mt-1 text-base font-medium text-[#11496c]">{doctor.specialty}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">{renderStars(doctor.rating)}</div>
                <span className="text-sm font-semibold text-slate-700">{doctor.rating}</span>
                <span className="text-sm text-slate-500">({doctor.reviewCount} reviews)</span>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="ml-2 text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] underline"
                >
                  Rate & Review
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <IoLocationOutline className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{doctor.location}</span>
                <span className="font-semibold text-slate-700">{doctor.distance}</span>
              </div>

              <div className="flex items-center gap-2">
                <IoTimeOutline className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="font-medium text-slate-700">{doctor.availability}</span>
                {doctor.nextSlot && (
                  <span className="rounded-full bg-[rgba(17,73,108,0.1)] px-3 py-1 text-sm font-semibold text-[#11496c]">
                    {doctor.nextSlot}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <IoCalendarOutline className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{doctor.experience} experience</span>
              </div>
            </div>

            <div className="flex flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleBookingClick}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
              >
                <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                Book Appointment
              </button>
              <button
                type="button"
                onClick={() => {
                  if (doctor.phone) {
                    window.location.href = `tel:${doctor.phone}`
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
              >
                <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                Call
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
          <p className="text-sm text-slate-600">{doctor.about}</p>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Book Appointment</h2>
                <p className="text-sm text-slate-600">{doctor.name} - {doctor.specialty}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                      bookingStep >= step
                        ? 'bg-[#11496c] text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {bookingStep > step ? <IoCheckmarkCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-1 w-12 transition ${
                        bookingStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Date Selection */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Select Date</h3>
                    <p className="mb-4 text-sm text-slate-600">
                      Select your preferred date. The system will automatically assign you a time slot based on availability.
                    </p>
                    
                    <div className="mb-6">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 p-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
                        <div className="flex gap-2">
                          {availableDates.map((date) => {
                            const sessionInfo = getSessionInfoForDate(date.value)
                            const isFull = !sessionInfo.available
                            return (
                              <button
                                key={date.value}
                                type="button"
                                onClick={() => !isFull && setSelectedDate(date.value)}
                                disabled={isFull}
                                className={`shrink-0 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                                  isFull
                                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : selectedDate === date.value
                                    ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)] text-[#0d3a52]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className="text-xs text-slate-500">{date.label.split(',')[0]}</div>
                                <div className="mt-1 whitespace-nowrap">{date.label.split(',')[1]?.trim()}</div>
                                {isFull && (
                                  <div className="mt-1 text-[10px] text-red-500">Full</div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Token and Availability Info */}
                    {selectedDate && (() => {
                      const sessionInfo = getSessionInfoForDate(selectedDate)
                      if (!sessionInfo.available && sessionInfo.maxTokens === 0) {
                        return (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-medium text-amber-800">
                              No session available for this date. Please select another date.
                            </p>
                          </div>
                        )
                      }
                      if (!sessionInfo.available) {
                        return (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-800">
                              This date is fully booked. Please select another date.
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Current bookings: {sessionInfo.currentBookings} / {sessionInfo.maxTokens}
                            </p>
                          </div>
                        )
                      }
                      return (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-emerald-900">
                                Your Token Number: <span className="text-lg">{sessionInfo.nextToken}</span>
                              </p>
                              <p className="text-xs text-emerald-700 mt-1">
                                {sessionInfo.currentBookings} of {sessionInfo.maxTokens} slots booked
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-700">{sessionInfo.nextToken}</div>
                              <div className="text-[10px] text-emerald-600">Token</div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Step 2: Appointment Details */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Appointment Details</h3>
                    
                    <div className="mb-6">
                      <label className="mb-3 block text-sm font-semibold text-slate-700">Appointment Type</label>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setAppointmentType('in_person')}
                          className="flex w-full max-w-xs items-center gap-3 rounded-xl border-2 border-[#11496c] bg-[rgba(17,73,108,0.1)] p-4 transition"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#11496c] text-white">
                            <IoPersonOutline className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">In-Person</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="reason" className="mb-2 block text-sm font-semibold text-slate-700">
                        Reason for Visit
                      </label>
                      <input
                        id="reason"
                        type="text"
                        placeholder="e.g., General checkup, Follow-up, Consultation"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-700">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        placeholder="Any additional information you'd like to share..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                      />
                    </div>

                    {/* Share Prescriptions Section */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-700">
                        Share Previous Prescriptions (Optional)
                      </label>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-3 text-xs text-slate-600">
                          Select prescriptions from other doctors to share with {doctor.name}
                        </p>
                        {getPatientPrescriptions().length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No previous prescriptions available</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {getPatientPrescriptions().map((prescription) => (
                              <label
                                key={prescription.id}
                                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-[#11496c]/30 transition"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPrescriptions.includes(prescription.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPrescriptions([...selectedPrescriptions, prescription.id])
                                    } else {
                                      setSelectedPrescriptions(selectedPrescriptions.filter((id) => id !== prescription.id))
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {prescription.doctor?.name || 'Previous Doctor'}
                                      </p>
                                      <p className="text-xs text-slate-600">
                                        {prescription.doctor?.specialty || 'General'} • {prescription.diagnosis || 'Consultation'}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                        }) : 'Date not available'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {bookingStep === 3 && (() => {
                const sessionInfo = getSessionInfoForDate(selectedDate)
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)]">
                        <IoCheckmarkCircle className="h-10 w-10 text-[#11496c]" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-slate-900">Confirm Your Appointment</h3>
                      <p className="text-sm text-slate-600">Please review your appointment details</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-sm text-slate-600">{doctor.specialty}</p>
                            <p className="mt-1 text-sm text-slate-500">{doctor.location}</p>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Date</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {selectedDate
                                ? new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Time</span>
                            <span className="text-sm font-semibold text-slate-900">
                              Will be assigned by system
                            </span>
                          </div>
                          {sessionInfo.nextToken && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Token Number</span>
                              <span className="text-lg font-bold text-[#11496c]">
                                #{sessionInfo.nextToken}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Type</span>
                            <span className="text-sm font-semibold text-slate-900">
                              In-Person
                            </span>
                          </div>
                          {reason && (
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-slate-600">Reason</span>
                              <span className="text-right text-sm font-semibold text-slate-900">{reason}</span>
                            </div>
                          )}
                          {selectedPrescriptions.length > 0 && (
                            <div className="flex items-start justify-between border-t border-slate-200 pt-3">
                              <span className="text-sm text-slate-600">Shared Prescriptions</span>
                              <span className="text-right text-sm font-semibold text-slate-900">
                                {selectedPrescriptions.length} prescription(s)
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-base font-semibold text-slate-900">Consultation Fee</span>
                            <span className="text-lg font-bold text-slate-900">₹{doctor.consultationFee}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                {bookingStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}
                {bookingStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={bookingStep === 1 && (!selectedDate || !getSessionInfoForDate(selectedDate).available)}
                    className="flex-1 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-400/40 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <IoCardOutline className="h-5 w-5" />
                        Confirm & Pay
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Rating Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReviewModal(false)
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rate & Review</h2>
                <p className="text-sm text-slate-600">{doctor.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Rating Selection */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Your Rating
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform active:scale-95"
                      >
                        {star <= reviewRating ? (
                          <IoStar className="h-8 w-8 text-amber-400" />
                        ) : (
                          <IoStarOutline className="h-8 w-8 text-slate-300" />
                        )}
                      </button>
                    ))}
                  </div>
                  {reviewRating > 0 && (
                    <p className="mt-2 text-center text-sm text-slate-600">
                      {reviewRating === 1 && 'Poor'}
                      {reviewRating === 2 && 'Fair'}
                      {reviewRating === 3 && 'Good'}
                      {reviewRating === 4 && 'Very Good'}
                      {reviewRating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Review Comment */}
                <div>
                  <label htmlFor="reviewComment" className="mb-2 block text-sm font-semibold text-slate-700">
                    Your Review (Optional)
                  </label>
                  <textarea
                    id="reviewComment"
                    rows={4}
                    placeholder="Share your experience with this doctor..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false)
                    setReviewRating(0)
                    setReviewComment('')
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (reviewRating === 0) {
                      alert('Please select a rating')
                      return
                    }
                    setIsSubmittingReview(true)
                    // Simulate API call
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                    console.log('Review submitted:', {
                      doctorId: doctor.id,
                      rating: reviewRating,
                      comment: reviewComment,
                    })
                    setIsSubmittingReview(false)
                    setShowReviewModal(false)
                    setReviewRating(0)
                    setReviewComment('')
                    // Show success message
                    alert('Thank you for your review!')
                  }}
                  disabled={isSubmittingReview || reviewRating === 0}
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PatientDoctorDetails

