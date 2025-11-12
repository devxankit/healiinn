import { useNavigate } from 'react-router-dom'
import {
  IoLocationOutline,
  IoChevronDownOutline,
  IoSearchOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPulseOutline,
  IoWaterOutline,
  IoHeartOutline,
} from 'react-icons/io5'
import { TbStethoscope, TbVaccine } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'

const upcomingAppointment = {
  doctor: 'Dr. Alana Rueter',
  specialty: 'Dentist Consultation',
  date: 'Monday, 26 July',
  time: '09:00 - 10:00',
  location: 'Sunrise Dental Care, NYC',
}

const vitals = [
  { id: 'heart', label: 'Heart Rate', value: '78 bpm', icon: IoHeartOutline, trend: '+3', tone: 'bg-rose-100 text-rose-600' },
  { id: 'oxygen', label: 'Oxygen', value: '97%', icon: IoWaterOutline, trend: '+1', tone: 'bg-cyan-100 text-cyan-600' },
  { id: 'steps', label: 'Daily Steps', value: '6 532', icon: IoPulseOutline, trend: '+12%', tone: 'bg-indigo-100 text-indigo-600' },
]

const specialties = [
  { id: 'dentist', label: 'Dentist', icon: TbStethoscope },
  { id: 'cardio', label: 'Cardiology', icon: IoHeartOutline },
  { id: 'ortho', label: 'Orthopedic', icon: MdOutlineEscalatorWarning },
  { id: 'neuro', label: 'Neurology', icon: IoPulseOutline },
  { id: 'vaccine', label: 'Vaccines', icon: TbVaccine },
]

const hospitals = [
  {
    id: 'elevate',
    name: 'ElevateDental',
    rating: 4.8,
    distance: '1.2 km',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'dentacare',
    name: 'DentaCare Clinic',
    rating: 4.6,
    distance: '2.0 km',
    image:
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
  },
]

const careGuides = [
  {
    id: 'nutrition',
    title: 'Nutrition tips for stronger teeth',
    description: 'Daily routines and foods that keep your smile bright.',
  },
  {
    id: 'wellness',
    title: 'Create a personal wellness plan',
    description: 'Set reminders for medications, hydration, and steps.',
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-blue-400/30 blur-3xl" />

        <div className="relative space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Today</p>
              <p className="text-base font-semibold">{todayLabel}</p>
              <p className="mt-1 text-sm text-blue-100/80">Stay on track with your care journey.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/locations')}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-500"
            >
              <IoLocationOutline className="text-sm" aria-hidden="true" />
              <span>New York, USA</span>
              <IoChevronDownOutline className="text-xs" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center rounded-2xl border border-white/40 bg-white/95 px-3 py-2 text-slate-600 shadow-inner shadow-blue-200/40">
            <IoSearchOutline className="text-lg text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search doctors, services, or symptoms"
              className="ml-3 w-full min-w-0 border-none bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-blue-50">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book quick consult
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View health records
            </button>
          </div>
        </div>
      </section>

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
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>

        <article className="rounded-3xl bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 p-4 shadow-lg shadow-blue-500/30 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-blue-600 shadow-sm shadow-blue-400/40">
              <span className="text-base font-semibold">AR</span>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-semibold">{upcomingAppointment.doctor}</h3>
              <p className="text-sm text-blue-100">{upcomingAppointment.specialty}</p>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-inner shadow-blue-400/40 transition-transform active:scale-95"
              aria-label="Call doctor"
            >
              <IoCallOutline aria-hidden="true" />
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm font-medium text-white/90 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <IoCalendarOutline aria-hidden="true" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-blue-100">Date</dt>
                <dd>{upcomingAppointment.date}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <IoTimeOutline aria-hidden="true" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-blue-100">Time</dt>
                <dd>{upcomingAppointment.time}</dd>
              </div>
            </div>
            <div className="col-span-1 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 sm:col-span-2">
              <IoLocationOutline aria-hidden="true" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-blue-100">Location</dt>
                <dd>{upcomingAppointment.location}</dd>
              </div>
            </div>
          </dl>
        </article>
      </section>

      <section aria-labelledby="vitals-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="vitals-title" className="text-base font-semibold text-slate-900">
            Wellness Tracking
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            View details
          </button>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {vitals.map(({ id, label, value, icon: Icon, trend, tone }) => (
            <article
              key={id}
              className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-lg font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">Week change</p>
              </div>
              <div className={`flex flex-col items-center gap-2 rounded-2xl px-3 py-2 ${tone}`}>
                <Icon aria-hidden="true" />
                <span className="text-xs font-semibold">{trend}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="speciality-title" className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 id="speciality-title" className="text-base font-semibold text-slate-900">
            Doctor Speciality
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        </header>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {specialties.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="snap-start rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner shadow-blue-100">
                <Icon className="text-lg" aria-hidden="true" />
              </span>
              {label}
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
                <img src={image} alt={name} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-blue-600 shadow-sm">
                  ⭐ {rating}
                </span>
              </figure>
              <div className="space-y-2 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{name}</h3>
                <p className="text-xs text-slate-500">Distance {distance}</p>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-blue-500 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-transform active:scale-[0.98]"
                >
                  Book appointment
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="guides-title" className="space-y-3 pb-3">
        <header className="flex items-center justify-between">
          <h2 id="guides-title" className="text-base font-semibold text-slate-900">
            Personal Care Guides
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
          >
            View all
          </button>
        </header>

        <div className="space-y-3">
          {careGuides.map(({ id, title, description }) => (
            <article
              key={id}
              className="rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
              >
                Read guide
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default PatientDashboard
