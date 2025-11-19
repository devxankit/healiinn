import { useNavigate } from 'react-router-dom'
import {
  IoFlaskOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoNotificationsOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5'

const LabDashboard = () => {
  const navigate = useNavigate()

  return (
    <section className="space-y-6 pb-4">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-100/70 bg-gradient-to-br from-sky-400/85 via-sky-300/85 to-blue-400/80 text-slate-900 shadow-lg shadow-sky-300/60 backdrop-blur-xl">
        <div className="absolute inset-x-6 bottom-3 h-24 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute -left-24 bottom-6 h-40 w-40 rounded-full bg-sky-500/40 blur-3xl" />

        <div className="relative space-y-4 p-4 sm:p-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">Welcome</p>
              <p className="text-lg font-semibold leading-tight text-white">Laboratory Dashboard</p>
              <p className="text-sm text-white/80">Manage your tests and reports.</p>
            </div>
          </header>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article
          onClick={() => navigate('/lab/tests')}
          className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-4 shadow-sm shadow-emerald-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">Total Tests</p>
              <p className="text-2xl font-bold text-slate-900">48</p>
              <p className="text-xs text-slate-600">This month</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-300/50">
              <IoFlaskOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article
          onClick={() => navigate('/lab/reports')}
          className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/70 p-4 shadow-sm shadow-blue-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-700">Completed Reports</p>
              <p className="text-2xl font-bold text-slate-900">42</p>
              <p className="text-xs text-slate-600">This month</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-300/50">
              <IoDocumentTextOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article
          onClick={() => navigate('/lab/tests')}
          className="relative overflow-hidden rounded-3xl border border-orange-100/60 bg-gradient-to-br from-orange-50/90 via-white to-orange-50/70 p-4 shadow-sm shadow-orange-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-orange-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-orange-700">Pending Tests</p>
              <p className="text-2xl font-bold text-slate-900">6</p>
              <p className="text-xs text-slate-600">Awaiting results</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-300/50">
              <IoCheckmarkCircleOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article
          className="relative overflow-hidden rounded-3xl border border-purple-100/60 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/70 p-4 shadow-sm shadow-purple-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-purple-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-purple-700">Active Patients</p>
              <p className="text-2xl font-bold text-slate-900">89</p>
              <p className="text-xs text-slate-600">Currently active</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-300/50">
              <IoPeopleOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article
          className="relative overflow-hidden rounded-3xl border border-indigo-100/60 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/70 p-4 shadow-sm shadow-indigo-100/50 backdrop-blur-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-200/30 blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-20 w-20 rounded-full bg-indigo-300/20 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-700">Notifications</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-slate-600">New alerts</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-lg shadow-indigo-300/50">
              <IoNotificationsOutline className="text-xl" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default LabDashboard

