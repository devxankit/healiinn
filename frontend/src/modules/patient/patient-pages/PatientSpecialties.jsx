import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoPulseOutline,
  IoHeartOutline,
} from 'react-icons/io5'
import { TbStethoscope, TbVaccine } from 'react-icons/tb'
import { MdOutlineEscalatorWarning } from 'react-icons/md'

// Mock doctors data to count by specialty (matching PatientDoctors page)
const mockDoctors = [
  { id: 'doc-1', specialty: 'Dentist' },
  { id: 'doc-6', specialty: 'Dentist' },
  { id: 'doc-2', specialty: 'Cardiology' },
  { id: 'doc-3', specialty: 'Orthopedic' },
  { id: 'doc-4', specialty: 'Neurology' },
  { id: 'doc-5', specialty: 'General' },
]

const specialties = [
  {
    id: 'dentist',
    label: 'Dentist',
    icon: TbStethoscope,
    gradient: 'from-cyan-400 to-teal-500',
    bgGradient: 'bg-gradient-to-br from-cyan-50 to-teal-50',
    iconBg: 'bg-gradient-to-br from-cyan-50 to-teal-50',
    textColor: 'text-teal-600',
    shadowColor: 'shadow-cyan-200/50',
    doctorCount: mockDoctors.filter(d => d.specialty === 'Dentist').length,
  },
  {
    id: 'cardio',
    label: 'Cardiology',
    icon: IoHeartOutline,
    gradient: 'from-pink-400 to-rose-500',
    bgGradient: 'bg-gradient-to-br from-pink-50 to-rose-50',
    iconBg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    textColor: 'text-rose-600',
    shadowColor: 'shadow-pink-200/50',
    doctorCount: mockDoctors.filter(d => d.specialty === 'Cardiology').length,
  },
  {
    id: 'ortho',
    label: 'Orthopedic',
    icon: MdOutlineEscalatorWarning,
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'bg-gradient-to-br from-emerald-50 to-green-50',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    textColor: 'text-green-600',
    shadowColor: 'shadow-emerald-200/50',
    doctorCount: mockDoctors.filter(d => d.specialty === 'Orthopedic').length,
  },
  {
    id: 'neuro',
    label: 'Neurology',
    icon: IoPulseOutline,
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-50',
    iconBg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    textColor: 'text-violet-600',
    shadowColor: 'shadow-purple-200/50',
    doctorCount: mockDoctors.filter(d => d.specialty === 'Neurology').length,
  },
  {
    id: 'general',
    label: 'General',
    icon: TbStethoscope,
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    textColor: 'text-indigo-600',
    shadowColor: 'shadow-blue-200/50',
    doctorCount: mockDoctors.filter(d => d.specialty === 'General').length,
  },
  {
    id: 'vaccine',
    label: 'Vaccines',
    icon: TbVaccine,
    gradient: 'from-amber-400 to-orange-500',
    bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    textColor: 'text-amber-700',
    shadowColor: 'shadow-amber-200/50',
    doctorCount: 0, // No doctors for vaccines
  },
]

const PatientSpecialties = () => {
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
          <h1 className="text-2xl font-bold text-slate-900">Doctor Specialities</h1>
          <p className="text-sm text-slate-600">{specialties.length} specialities available</p>
        </div>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-3 gap-3">
        {specialties.map(({ id, label, icon: Icon, gradient, iconBg, textColor, shadowColor, doctorCount }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(`/patient/specialties/${id}/doctors`)}
            className="group relative flex flex-col items-center gap-2.5 p-4 transition-all active:scale-95"
          >
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} shadow-md ${shadowColor} transition-transform group-hover:scale-110`}>
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-10`} />
              <Icon className={`relative text-xl ${textColor} transition-transform group-hover:scale-110`} aria-hidden="true" />
            </div>
            <span className={`text-xs font-semibold ${textColor} transition-colors text-center`}>{label}</span>
            <span className="text-[10px] font-medium text-slate-500">{doctorCount} doctor{doctorCount !== 1 ? 's' : ''}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default PatientSpecialties

