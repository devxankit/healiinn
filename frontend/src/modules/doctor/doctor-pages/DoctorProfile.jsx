import { useState } from 'react'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoMedicalOutline,
  IoLockClosedOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoVideocamOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoBriefcaseOutline,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'

const mockDoctorData = {
  firstName: 'Dr. Sarah',
  lastName: 'Mitchell',
  email: 'sarah.mitchell@example.com',
  phone: '+1-555-123-4567',
  gender: 'female',
  profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  specialization: 'Cardiology',
  licenseNumber: 'MD-12345',
  experienceYears: 10,
  qualification: 'MBBS, MD (Cardiology)',
  bio: 'Experienced cardiologist with expertise in preventive cardiology and heart disease management.',
  consultationFee: 1500,
  education: [
    { institution: 'Harvard Medical School', degree: 'MD', year: 2014 },
    { institution: 'Johns Hopkins Hospital', degree: 'Residency', year: 2018 },
  ],
  languages: ['English', 'Spanish', 'French'],
  consultationModes: ['in_person', 'video', 'audio'],
  clinicDetails: {
    name: 'Heart Care Clinic',
    address: {
      line1: '123 Medical Center Drive',
      line2: 'Suite 200',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
  },
  availableTimings: ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'],
  availability: [
    { day: 'Monday', startTime: '09:00', endTime: '17:00' },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
    { day: 'Friday', startTime: '09:00', endTime: '17:00' },
  ],
  documents: {
    license: 'https://example.com/license.pdf',
    identityProof: 'https://example.com/id.pdf',
  },
  status: 'approved',
  rating: 4.8,
  letterhead: {
    logo: '',
    clinicName: '',
    tagline: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
  },
}

const DoctorProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [formData, setFormData] = useState(mockDoctorData)

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const formatAddress = (address) => {
    if (!address) return '—'
    const parts = [
      address.line1,
      address.line2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
      address.country,
    ].filter(Boolean)
    return parts.join(', ') || '—'
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }))
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent]?.[child],
              [grandchild]: value,
            },
          },
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleArrayAdd = (field, newItem) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem],
    }))
  }

  const handleArrayRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleArrayItemChange = (field, index, subField, value) => {
    setFormData((prev) => {
      const updated = [...(prev[field] || [])]
      updated[index] = { ...updated[index], [subField]: value }
      return { ...prev, [field]: updated }
    })
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setIsEditing(false)
    setActiveSection(null)
  }

  const handleCancel = () => {
    setFormData(mockDoctorData)
    setIsEditing(false)
    setActiveSection(null)
  }

  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-6 pb-4">
            {/* Profile Header */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/90 via-indigo-50/85 to-blue-50/90 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-blue-200/20 ring-1 ring-white/50">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-indigo-300/15 blur-2xl pointer-events-none" />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                      <img
                        src={formData.profileImage}
                        alt={`${formData.firstName} ${formData.lastName}`}
                        className="h-full w-full rounded-full object-cover ring-4 ring-white shadow-lg bg-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName + ' ' + formData.lastName)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          className="absolute -bottom-1 -right-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600"
                        >
                          <IoCameraOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {formData.firstName} {formData.lastName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">{formData.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <IoMedicalOutline className="h-3 w-3" />
                        {formData.specialization}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <IoPersonOutline className="h-3 w-3" />
                        {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                      </span>
                      {formData.rating > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <IoStarOutline className="h-3 w-3" />
                          {formData.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <IoCloseOutline className="h-4 w-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true)
                          setActiveSection('personal')
                        }}
                        className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                      >
                        <IoCreateOutline className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to sign out?')) {
                            localStorage.removeItem('doctorAuthToken')
                            sessionStorage.removeItem('doctorAuthToken')
                            window.location.href = '/doctor/login'
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 active:scale-95"
                      >
                        <IoLogOutOutline className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Personal Information */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">Doctor Personal Information</h2>
                {(activeSection === 'personal' || isEditing) ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {(activeSection === 'personal' || isEditing) && (
                <div className="px-5 pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Gender
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">
                          {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoMailOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{formData.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'professional' ? null : 'professional')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">Professional Details</h2>
                {(activeSection === 'professional' || isEditing) ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {(activeSection === 'professional' || isEditing) && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-5 pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Specialization
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.specialization}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        License Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.licenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Experience (Years)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.experienceYears || 0} years</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Consultation Fee
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={formData.consultationFee}
                          onChange={(e) => handleInputChange('consultationFee', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">₹{formData.consultationFee || 0}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Qualification
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        placeholder="e.g., MBBS, MD (Cardiology)"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{formData.qualification || 'Not set'}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows="2"
                        placeholder="Write about your experience and expertise..."
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 leading-snug">{formData.bio || 'Not set'}</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="pt-5 border-t border-slate-200">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Education</h3>
                    {formData.education && formData.education.length > 0 ? (
                      <div className="space-y-3">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Institution"
                                    value={edu.institution || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'institution', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Degree"
                                    value={edu.degree || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Year"
                                    value={edu.year || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'year', parseInt(e.target.value) || '')}
                                    className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('education', index)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                  >
                                    <IoTrashOutline className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">{edu.institution}</p>
                                  <p className="mt-0.5 text-[10px] text-slate-600 truncate">{edu.degree}</p>
                                  {edu.year && (
                                    <p className="mt-0.5 text-[10px] text-slate-500">Year: {edu.year}</p>
                                  )}
                                </div>
                                <IoSchoolOutline className="h-4 w-4 text-blue-500 shrink-0" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No education records</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('education', { institution: '', degree: '', year: '' })}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Education
                      </button>
                    )}
                  </div>

                  {/* Languages & Consultation Modes */}
                  <div className="pt-5 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-900">Languages</h3>
                        {formData.languages && formData.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.languages.map((lang, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                              >
                                <IoLanguageOutline className="h-2.5 w-2.5 shrink-0" />
                                {lang}
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('languages', index)}
                                    className="ml-0.5 text-blue-600 hover:text-blue-800 shrink-0"
                                  >
                                    <IoCloseOutline className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No languages added</p>
                        )}
                        {isEditing && (
                          <div className="mt-2 flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Add language"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  handleArrayAdd('languages', e.target.value.trim())
                                  e.target.value = ''
                                }
                              }}
                              className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.target.previousElementSibling
                                if (input.value.trim()) {
                                  handleArrayAdd('languages', input.value.trim())
                                  input.value = ''
                                }
                              }}
                              className="flex items-center justify-center rounded-md bg-blue-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600 shrink-0"
                            >
                              <IoAddOutline className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-900">Consultation Modes</h3>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            {['in_person', 'video', 'audio', 'chat'].map((mode) => (
                              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.consultationModes?.includes(mode) || false}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleArrayAdd('consultationModes', mode)
                                    } else {
                                      const index = formData.consultationModes?.indexOf(mode)
                                      if (index !== undefined && index !== -1) {
                                        handleArrayRemove('consultationModes', index)
                                      }
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-400 shrink-0"
                                />
                                <span className="text-xs font-medium text-slate-900 capitalize">
                                  {mode.replace('_', ' ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.consultationModes && formData.consultationModes.length > 0 ? (
                              formData.consultationModes.map((mode, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                                >
                                  <IoVideocamOutline className="h-2.5 w-2.5 shrink-0" />
                                  {mode.replace('_', ' ')}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500">No consultation modes set</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clinic Information */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'clinic' ? null : 'clinic')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">Clinic Information</h2>
                {(activeSection === 'clinic' || isEditing) ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {(activeSection === 'clinic' || isEditing) && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.clinicDetails?.name || ''}
                        onChange={(e) => handleInputChange('clinicDetails.name', e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{formData.clinicDetails?.name || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Address
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={formData.clinicDetails?.address?.line1 || ''}
                          onChange={(e) => handleInputChange('clinicDetails.address.line1', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={formData.clinicDetails?.address?.line2 || ''}
                          onChange={(e) => handleInputChange('clinicDetails.address.line2', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={formData.clinicDetails?.address?.city || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.city', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={formData.clinicDetails?.address?.state || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.state', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={formData.clinicDetails?.address?.postalCode || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.postalCode', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={formData.clinicDetails?.address?.country || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.country', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <IoLocationOutline className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span className="break-words font-medium">{formatAddress(formData.clinicDetails?.address)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sessions & Timings */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'timings' ? null : 'timings')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">Sessions & Timings</h2>
                {(activeSection === 'timings' || isEditing) ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {(activeSection === 'timings' || isEditing) && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-5 pt-5">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Available Timings</h3>
                    {formData.availableTimings && formData.availableTimings.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availableTimings.map((timing, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={timing}
                                  onChange={(e) => {
                                    const updated = [...(formData.availableTimings || [])]
                                    updated[index] = e.target.value
                                    setFormData((prev) => ({ ...prev, availableTimings: updated }))
                                  }}
                                  placeholder="e.g., 09:00 AM - 12:00 PM"
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleArrayRemove('availableTimings', index)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                >
                                  <IoTrashOutline className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <IoTimeOutline className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-900">{timing}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No timings set</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('availableTimings', '')}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Timing
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Availability Days</h3>
                    {formData.availability && formData.availability.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availability.map((avail, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <select
                                  value={avail.day}
                                  onChange={(e) => handleArrayItemChange('availability', index, 'day', e.target.value)}
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                >
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    value={avail.startTime}
                                    onChange={(e) => handleArrayItemChange('availability', index, 'startTime', e.target.value)}
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                  />
                                  <span className="text-slate-500 text-[10px]">to</span>
                                  <input
                                    type="time"
                                    value={avail.endTime}
                                    onChange={(e) => handleArrayItemChange('availability', index, 'endTime', e.target.value)}
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('availability', index)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                  >
                                    <IoTrashOutline className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <IoCalendarOutline className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-900">{avail.day}: {avail.startTime} - {avail.endTime}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No availability set</p>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleArrayAdd('availability', { day: 'Monday', startTime: '09:00', endTime: '17:00' })}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        <IoAddOutline className="h-3.5 w-3.5" />
                        Add Availability Day
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* KYC & Verification */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'kyc' ? null : 'kyc')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">KYC & Verification</h2>
                {activeSection === 'kyc' ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {activeSection === 'kyc' && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-5">
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <IoShieldCheckmarkOutline className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-900">Verification Status</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      formData.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : formData.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1) : 'Not Verified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        License Document
                      </label>
                      {formData.documents?.license ? (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 hover:bg-slate-50 transition-colors">
                          <IoDocumentTextOutline className="h-4 w-4 text-blue-500 shrink-0" />
                          <a
                            href={formData.documents.license}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate"
                          >
                            View License
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No license document uploaded</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Identity Proof
                      </label>
                      {formData.documents?.identityProof ? (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 hover:bg-slate-50 transition-colors">
                          <IoDocumentTextOutline className="h-4 w-4 text-blue-500 shrink-0" />
                          <a
                            href={formData.documents.identityProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline truncate"
                          >
                            View Identity Proof
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No identity proof uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                {activeSection === 'password' ? (
                  <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
                ) : (
                  <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
                )}
              </button>

              {activeSection === 'password' && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-4 pt-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Change Password submitted')
                      alert('Password change functionality will be implemented')
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                  >
                    <IoLockClosedOutline className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              )}
          </div>
          </section>
        </div>
      </div>
    </>
  )
}

export default DoctorProfile
