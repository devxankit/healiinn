import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5'

const upcomingAppointments = [
  {
    id: 'appt-1',
    doctor: 'Dr. Alana Rueter',
    specialty: 'Dentist Consultation',
    status: 'CONFIRMED',
    countdown: 'IN 3 DAYS',
    type: 'IN-PERSON VISIT',
    token: 'TOKEN #12',
    date: 'Monday, 26 July',
    time: '09:00 - 09:45',
    duration: 'Duration 45 min',
    clinic: 'Sunrise Dental Care',
    address: '115 W 45th St, New York, NY',
    note: 'Bring your recent x-rays and insurance card for review.',
  },
  {
    id: 'appt-2',
    doctor: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology Consultation',
    status: 'CONFIRMED',
    countdown: 'IN 5 DAYS',
    type: 'VIDEO CALL',
    token: 'TOKEN #8',
    date: 'Wednesday, 28 July',
    time: '10:30 - 11:00',
    duration: 'Duration 30 min',
    clinic: 'Heart Care Center',
    address: '200 Park Ave, New York, NY',
    note: 'Please have your recent test reports ready.',
  },
]

const PatientUpcomingSchedules = () => {
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
          <h1 className="text-2xl font-bold text-slate-900">Upcoming Schedules</h1>
          <p className="text-sm text-slate-600">{upcomingAppointments.length} appointment(s) scheduled</p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {upcomingAppointments.map((appointment) => (
          <article
            key={appointment.id}
            className="relative overflow-hidden rounded-3xl border text-white shadow-lg"
            style={{ 
              borderColor: 'rgba(17, 73, 108, 0.2)',
              background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.95), rgba(17, 73, 108, 0.95), rgba(17, 73, 108, 0.9))',
              boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
            }}
          >
            <div className="pointer-events-none absolute -right-16 top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-6 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.15)] blur-3xl" />

            <div className="relative space-y-4 px-4 py-4 sm:px-5">
              <header className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#11496c] shadow-sm shadow-[rgba(17,73,108,0.2)]">
                    <span className="text-sm font-semibold">
                      {appointment.doctor
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(-2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight text-white">{appointment.doctor}</h3>
                    <p className="text-xs text-white/90">{appointment.specialty}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#11496c] shadow-inner shadow-[rgba(17,73,108,0.15)] transition-transform active:scale-95"
                  aria-label="Call doctor"
                >
                  <IoCallOutline className="text-base" aria-hidden="true" />
                </button>
              </header>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                <span className="inline-flex items-center rounded-full bg-emerald-400/90 px-2.5 py-1 text-emerald-950">
                  {appointment.status}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  <IoCalendarOutline className="text-xs" aria-hidden="true" />
                  {appointment.countdown}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.4)] px-2.5 py-1 text-white/95">
                  {appointment.type}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/90">
                  {appointment.token}
                </span>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                    <IoCalendarOutline aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-white/90">Date</dt>
                    <dd className="text-sm font-semibold text-white">{appointment.date}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                    <IoTimeOutline aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-white/90">Time</dt>
                    <dd className="text-sm font-semibold text-white">{appointment.time}</dd>
                    <dd className="text-xs text-white/90">{appointment.duration}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                    <IoLocationOutline aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-white/90">Clinic</dt>
                    <dd className="text-sm font-semibold text-white">{appointment.clinic}</dd>
                    <dd className="text-xs text-white/90">{appointment.address}</dd>
                  </div>
                </div>
              </dl>

              {appointment.note && (
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-xs leading-relaxed text-white/95">{appointment.note}</p>
                </div>
              )}

              <footer className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                >
                  <IoCalendarOutline className="text-base" aria-hidden="true" />
                  Reschedule
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
                >
                  <IoLocationOutline className="text-base" aria-hidden="true" />
                  Directions
                </button>
              </footer>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PatientUpcomingSchedules

