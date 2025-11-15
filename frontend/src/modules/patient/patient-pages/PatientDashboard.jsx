import { useNavigate } from 'react-router-dom'
import {
  IoLocationOutline,
  IoChevronDownOutline,
  IoSearchOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPulseOutline,
  IoHeartOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoReceiptOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoShareSocialOutline,
  IoNotificationsOutline,
} from 'react-icons/io5'
import { TbStethoscope, TbVaccine } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'

const upcomingAppointment = {
  doctor: 'Dr. Alana Rueter',
  specialty: 'Dentist Consultation',
  status: 'Confirmed',
  type: 'In-person visit',
  token: 'Token #12',
  countdown: 'In 3 days',
  date: 'Monday, 26 July',
  time: '09:00 - 09:45',
  duration: '45 min',
  clinic: 'Sunrise Dental Care',
  location: '115 W 45th St, New York, NY',
  note: 'Bring your recent x-rays and insurance card for review.',
}

const specialties = [
  { 
    id: 'dentist', 
    label: 'Dentist', 
    icon: TbStethoscope,
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50',
    iconBg: 'bg-gradient-to-br from-cyan-100 to-blue-100',
    textColor: 'text-cyan-700',
    shadowColor: 'shadow-cyan-200/50',
  },
  { 
    id: 'cardio', 
    label: 'Cardiology', 
    icon: IoHeartOutline,
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50',
    iconBg: 'bg-gradient-to-br from-rose-100 to-pink-100',
    textColor: 'text-rose-700',
    shadowColor: 'shadow-rose-200/50',
  },
  { 
    id: 'ortho', 
    label: 'Orthopedic', 
    icon: MdOutlineEscalatorWarning,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-gradient-to-br from-emerald-100 to-teal-100',
    textColor: 'text-emerald-700',
    shadowColor: 'shadow-emerald-200/50',
  },
  { 
    id: 'neuro', 
    label: 'Neurology', 
    icon: IoPulseOutline,
    gradient: 'from-purple-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50',
    iconBg: 'bg-gradient-to-br from-purple-100 to-indigo-100',
    textColor: 'text-purple-700',
    shadowColor: 'shadow-purple-200/50',
  },
  { 
    id: 'vaccine', 
    label: 'Vaccines', 
    icon: TbVaccine,
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-amber-100 to-orange-100',
    textColor: 'text-amber-700',
    shadowColor: 'shadow-amber-200/50',
  },
]

const hospitals = [
  {
    id: 'elevate',
    name: 'ElevateDental',
    rating: 4.8,
    distance: '1.2 km',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-4'], // Doctor IDs associated with this hospital
  },
  {
    id: 'dentacare',
    name: 'DentaCare Clinic',
    rating: 4.6,
    distance: '2.0 km',
    image:
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    doctors: ['doc-1', 'doc-5'], // Doctor IDs associated with this hospital
  },
]

const PatientDashboard = () => {
  const navigate = useNavigate()
  
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())


  return (
    <section className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100/70 bg-gradient-to-br from-sky-400/85 via-sky-300/85 to-blue-400/80 text-slate-900 shadow-lg shadow-sky-300/60 backdrop-blur-xl">
        <div className="absolute inset-x-6 bottom-3 h-24 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -left-24 bottom-6 h-40 w-40 rounded-full bg-sky-500/40 blur-3xl" />
        <div className="absolute right-4 top-6 h-16 w-16 rounded-full border border-white/60 bg-white/40 blur-2xl" />
        <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-blue-500/25 blur-[100px]" />

        <div className="relative space-y-4 p-4 sm:p-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">Today</p>
              <p className="text-lg font-semibold leading-tight text-white">{todayLabel}</p>
              <p className="text-sm text-white/80">Stay on track with your care journey.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/locations')}
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/60 bg-white/75 px-3 py-1.5 text-xs font-semibold text-sky-900 shadow-sm shadow-sky-200/60 backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-400 sm:self-auto"
            >
              <IoLocationOutline className="text-sm text-sky-700" aria-hidden="true" />
              <span>New York, USA</span>
              <IoChevronDownOutline className="text-xs" aria-hidden="true" />
            </button>
          </header>

          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl border border-white/50 bg-white/15 opacity-90 blur-md transition group-hover:opacity-100" />
            <div className="relative flex items-center gap-3 rounded-2xl border border-white/60 bg-gradient-to-r from-white/65 via-white/55 to-white/60 px-3 py-2 text-slate-600 shadow-inner shadow-sky-200/40 backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 shadow-sm shadow-sky-300/40">
                <IoSearchOutline className="text-base" aria-hidden="true" />
              </span>
            <input
              type="search"
              placeholder="Search doctors, services, or symptoms"
                className="w-full min-w-0 border-none bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-sky-100/70 bg-sky-600/90 px-3 py-2 text-white shadow-sm shadow-sky-900/20 backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-500"
            >
              Book quick consult
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/75 px-3 py-2 text-sky-900 shadow-sm shadow-sky-200/70 backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sky-400"
            >
              View health records
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article 
          onClick={() => navigate('/patient/appointments')}
          className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-4 shadow-sm shadow-emerald-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">Total Appointments</p>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-xs text-slate-600">This month</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-300/50">
              <IoCalendarOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article 
          onClick={() => navigate('/patient/orders')}
          className="relative overflow-hidden rounded-3xl border border-orange-100/60 bg-gradient-to-br from-orange-50/90 via-white to-orange-50/70 p-4 shadow-sm shadow-orange-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-orange-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-700">Orders</p>
              <p className="text-2xl font-bold text-slate-900">6</p>
              <p className="text-xs text-slate-600">Lab & Pharmacy</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-300/50">
              <IoBagHandleOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article 
          onClick={() => navigate('/patient/prescriptions')}
          className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/70 p-4 shadow-sm shadow-blue-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">Active Prescriptions</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-slate-600">Currently active</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-300/50">
              <IoDocumentTextOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article 
          onClick={() => navigate('/patient/transactions')}
          className="relative overflow-hidden rounded-3xl border border-purple-100/60 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/70 p-4 shadow-sm shadow-purple-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-purple-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-700">Transactions</p>
              <p className="text-2xl font-bold text-slate-900">5</p>
              <p className="text-xs text-slate-600">Recent transactions</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-300/50">
              <IoReceiptOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article 
          onClick={() => navigate('/patient/reports')}
          className="relative overflow-hidden rounded-3xl border border-teal-100/60 bg-gradient-to-br from-teal-50/90 via-white to-teal-50/70 p-4 shadow-sm shadow-teal-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-teal-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-teal-700">Lab Reports</p>
              <p className="text-2xl font-bold text-slate-900">4</p>
              <p className="text-xs text-slate-600">Ready to share</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-300/50">
              <IoFlaskOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article 
          onClick={() => navigate('/patient/requests')}
          className="relative overflow-hidden rounded-3xl border border-pink-100/60 bg-gradient-to-br from-pink-50/90 via-white to-pink-50/70 p-4 shadow-sm shadow-pink-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-pink-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-pink-700">Requests & Responses</p>
              <p className="text-2xl font-bold text-slate-900">2</p>
              <p className="text-xs text-slate-600">Pending payment</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-300/50">
              <IoNotificationsOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>

      <section aria-labelledby="upcoming-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="upcoming-title" className="text-base font-semibold text-slate-900">
              Upcoming Schedule
            </h2>
            <span className="flex h-6 min-w-[1.75rem] items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-600">
              1
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/patient/upcoming-schedules')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>

        <article className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600/95 via-blue-500/95 to-blue-600/90 px-4 py-4 text-white shadow-lg shadow-blue-600/30 sm:px-5">
          <div className="pointer-events-none absolute -right-16 top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 h-24 w-24 rounded-full bg-blue-400/25 blur-3xl" />

          <div className="relative space-y-4">
            <header className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm shadow-blue-300/40">
                  <span className="text-sm font-semibold">AR</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{upcomingAppointment.doctor}</h3>
                  <p className="text-xs text-blue-100">{upcomingAppointment.specialty}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-inner shadow-blue-400/30 transition-transform active:scale-95"
                aria-label="Call doctor"
              >
                <IoCallOutline className="text-base" aria-hidden="true" />
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/90">
              <span className="inline-flex items-center rounded-full bg-emerald-400/90 px-2.5 py-1 text-emerald-950">
                {upcomingAppointment.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                <IoCalendarOutline className="text-xs" aria-hidden="true" />
                {upcomingAppointment.countdown}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-2.5 py-1 text-white/95">
                {upcomingAppointment.type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/90">
                {upcomingAppointment.token}
              </span>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                  <IoCalendarOutline aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-blue-100">Date</dt>
                  <dd className="text-sm font-semibold text-white">{upcomingAppointment.date}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                  <IoTimeOutline aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-blue-100">Time</dt>
                  <dd className="text-sm font-semibold text-white">{upcomingAppointment.time}</dd>
                  <p className="text-[11px] text-blue-100/80">Duration {upcomingAppointment.duration}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white">
                  <IoLocationOutline aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-blue-100">Clinic</dt>
                  <dd className="text-sm font-semibold text-white">{upcomingAppointment.clinic}</dd>
                  <p className="text-[11px] text-blue-100/80">{upcomingAppointment.location}</p>
                </div>
              </div>
            </dl>

            <p className="rounded-2xl border border-white/10 bg-white/10 p-3 text-[11px] font-medium text-blue-50/90">
              {upcomingAppointment.note}
            </p>

            <footer className="flex flex-wrap gap-3 text-xs font-semibold">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-blue-600 shadow-sm shadow-blue-400/30 transition-transform active:scale-95"
              >
                <IoCalendarOutline className="text-sm" aria-hidden="true" />
                Reschedule
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-600"
              >
                <IoLocationOutline className="text-sm" aria-hidden="true" />
                Directions
              </button>
            </footer>
          </div>
        </article>
      </section>

      <section aria-labelledby="speciality-title" className="space-y-3">
        <header className="flex items-center justify-between px-1">
          <h2 id="speciality-title" className="text-base font-semibold text-slate-900">
            Doctor Speciality
          </h2>
          <button
            type="button"
            onClick={() => navigate('/patient/specialties')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch]">
          {specialties.map(({ id, label, icon: Icon, gradient, bgGradient, iconBg, textColor, shadowColor }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                // Map dashboard specialty IDs to specialty doctors page
                const specialtyMap = {
                  'dentist': 'dentist',
                  'cardio': 'cardio',
                  'ortho': 'ortho',
                  'neuro': 'neuro',
                  'vaccine': 'all', // Vaccine doesn't have a direct match, show all
                }
                const specialtyId = specialtyMap[id] || 'all'
                navigate(`/patient/specialties/${specialtyId}/doctors`)
              }}
              className="group relative shrink-0 snap-start flex flex-col items-center gap-2.5 px-1.5 py-1.5 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} shadow-md ${shadowColor} transition-transform group-active:scale-110`}>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-active:opacity-10`} />
                <Icon className={`relative text-xl ${textColor} transition-transform group-active:scale-110`} aria-hidden="true" />
              </div>
              <span className={`text-xs font-semibold ${textColor} transition-colors whitespace-nowrap`}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="hospitals-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="hospitals-title" className="text-base font-semibold text-slate-900">
            Nearby Hospitals
          </h2>
          <button
            type="button"
            onClick={() => navigate('/patient/hospitals')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {hospitals.map(({ id, name, rating, distance, image }) => (
            <article
              key={id}
              className="snap-start w-[240px] shrink-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            >
              <figure className="relative h-32 w-full overflow-hidden">
                <img 
                  src={image} 
                  alt={name} 
                  className="h-full w-full object-cover bg-slate-100" 
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128&bold=true`
                  }}
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-blue-600 shadow-sm">
                  ⭐ {rating}
                </span>
              </figure>
              <div className="space-y-2 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500">Distance {distance}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/patient/hospitals/${id}/doctors`)}
                  className="w-full rounded-2xl bg-blue-500 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-transform active:scale-[0.98]"
                >
                  Book appointment
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>


    </section>
  )
}

export default PatientDashboard
