import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  IoTimeOutline,
  IoDocumentTextOutline,
  IoBriefcaseOutline,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoImageOutline,
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
  consultationModes: ['in_person'],
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
  averageConsultationMinutes: 20, // Default 20 minutes per patient
  documents: {
    license: 'https://example.com/license.pdf',
    identityProof: 'https://example.com/id.pdf',
  },
  digitalSignature: {
    imageUrl: '',
    uploadedAt: null,
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
  const location = useLocation()
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
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

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          digitalSignature: {
            imageUrl: reader.result,
            uploadedAt: new Date(),
          },
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveSignature = () => {
    setFormData((prev) => ({
      ...prev,
      digitalSignature: {
        imageUrl: '',
        uploadedAt: null,
      },
    }))
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    // Save to localStorage so it can be used in PDF generation
    localStorage.setItem('doctorProfile', JSON.stringify(formData))
    // TODO: Send digitalSignature.digitalSignature.imageUrl to backend
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
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
            {/* Profile Header */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-indigo-50/85 to-[rgba(17,73,108,0.05)] backdrop-blur-md p-4 sm:p-6 shadow-lg shadow-[rgba(17,73,108,0.1)] ring-1 ring-white/50">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[rgba(17,73,108,0.1)] blur-3xl pointer-events-none" />
              <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-indigo-300/15 blur-2xl pointer-events-none" />

              <div className="relative flex flex-col gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative shrink-0">
                    <div className="relative h-16 w-16 sm:h-24 sm:w-24">
                      <img
                        src={formData.profileImage}
                        alt={`${formData.firstName} ${formData.lastName}`}
                        className="h-full w-full rounded-full object-cover ring-2 sm:ring-4 ring-white shadow-lg bg-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName + ' ' + formData.lastName)}&background=11496c&color=fff&size=128&bold=true`
                        }}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#11496c] text-white shadow-lg transition hover:bg-[#0d3a52]"
                        >
                          <IoCameraOutline className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 sm:text-2xl">
                      {formData.firstName} {formData.lastName}
                    </h1>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600 truncate">{formData.email}</p>
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#11496c]">
                        <IoMedicalOutline className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {formData.specialization}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-700">
                        <IoPersonOutline className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                      </span>
                      {formData.rating > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-amber-700">
                          <IoStarOutline className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {formData.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                      >
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <IoCloseOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                        className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                      >
                        <IoCreateOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                        className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-red-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 active:scale-95"
                      >
                        <IoLogOutOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Personal Information */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Doctor Personal Information</h2>
                {(activeSection === 'personal' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'personal' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'professional' ? null : 'professional')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Professional Details</h2>
                {(activeSection === 'professional' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'professional' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Specialization
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{formData.licenseNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 leading-snug">{formData.bio || 'Not set'}</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="pt-4 sm:pt-5 border-t border-slate-200">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Education</h3>
                    {formData.education && formData.education.length > 0 ? (
                      <div className="space-y-2 sm:space-y-3">
                        {formData.education.map((edu, index) => (
                          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Institution"
                                    value={edu.institution || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'institution', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Degree"
                                    value={edu.degree || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Year"
                                    value={edu.year || ''}
                                    onChange={(e) => handleArrayItemChange('education', index, 'year', parseInt(e.target.value) || '')}
                                    className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                                <IoSchoolOutline className="h-4 w-4 text-[#11496c] shrink-0" />
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
                  <div className="pt-4 sm:pt-5 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-slate-900">Languages</h3>
                        {formData.languages && formData.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.languages.map((lang, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#11496c]"
                              >
                                <IoLanguageOutline className="h-2.5 w-2.5 shrink-0" />
                                {lang}
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => handleArrayRemove('languages', index)}
                                    className="ml-0.5 text-[#11496c] hover:text-[#0a2d3f] shrink-0"
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
                              className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                              className="flex items-center justify-center rounded-md bg-[#11496c] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0d3a52] shrink-0"
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
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.consultationModes?.includes('in_person') || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleArrayAdd('consultationModes', 'in_person')
                                  } else {
                                    const index = formData.consultationModes?.indexOf('in_person')
                                    if (index !== undefined && index !== -1) {
                                      handleArrayRemove('consultationModes', index)
                                    }
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c] shrink-0"
                              />
                              <span className="text-xs font-medium text-slate-900 capitalize">
                                In Person
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.consultationModes && formData.consultationModes.length > 0 ? (
                              formData.consultationModes.map((mode, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                                >
                                  <IoPersonOutline className="h-2.5 w-2.5 shrink-0" />
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'clinic' ? null : 'clinic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Clinic Information</h2>
                {(activeSection === 'clinic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'clinic' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Clinic Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.clinicDetails?.name || ''}
                        onChange={(e) => handleInputChange('clinicDetails.name', e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={formData.clinicDetails?.address?.line2 || ''}
                          onChange={(e) => handleInputChange('clinicDetails.address.line2', e.target.value)}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={formData.clinicDetails?.address?.city || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.city', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={formData.clinicDetails?.address?.state || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.state', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={formData.clinicDetails?.address?.postalCode || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.postalCode', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={formData.clinicDetails?.address?.country || ''}
                            onChange={(e) => handleInputChange('clinicDetails.address.country', e.target.value)}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'timings' ? null : 'timings')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Sessions & Timings</h2>
                {(activeSection === 'timings' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'timings' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-4 sm:space-y-5 pt-4 sm:pt-5">
                  <div>
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Available Timings</h3>
                    {formData.availableTimings && formData.availableTimings.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availableTimings.map((timing, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 hover:bg-slate-50 transition-colors">
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
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                                <IoTimeOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
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

                  <div className="border-t border-slate-200 pt-4 sm:pt-5">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Availability Days</h3>
                    {formData.availability && formData.availability.length > 0 ? (
                      <div className="space-y-2">
                        {formData.availability.map((avail, index) => (
                          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2 sm:p-2.5 hover:bg-slate-50 transition-colors">
                            {isEditing ? (
                              <>
                                <select
                                  value={avail.day}
                                  onChange={(e) => handleArrayItemChange('availability', index, 'day', e.target.value)}
                                  className="flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                                  />
                                  <span className="text-slate-500 text-[10px]">to</span>
                                  <input
                                    type="time"
                                    value={avail.endTime}
                                    onChange={(e) => handleArrayItemChange('availability', index, 'endTime', e.target.value)}
                                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
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
                                <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
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

                  {/* Average Consultation Minutes */}
                  <div className="border-t border-slate-200 pt-4 sm:pt-5">
                    <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-900">Average Consultation Time Per Patient</h3>
                    <p className="mb-2 text-[10px] sm:text-xs text-slate-500">
                      Set the approximate time (in minutes) you spend per patient during consultations. This helps in scheduling and queue management.
                    </p>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={formData.averageConsultationMinutes ?? ''}
                            onChange={(e) => {
                              const inputValue = e.target.value
                              
                              // Allow empty input while typing
                              if (inputValue === '') {
                                handleInputChange('averageConsultationMinutes', '')
                                return
                              }
                              
                              // Parse the number
                              const numValue = parseInt(inputValue, 10)
                              
                              // If it's a valid number and within range
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 60) {
                                handleInputChange('averageConsultationMinutes', numValue)
                              }
                            }}
                            onBlur={(e) => {
                              // On blur, ensure we have a valid value (default to 20 if empty)
                              const inputValue = e.target.value.trim()
                              if (inputValue === '') {
                                handleInputChange('averageConsultationMinutes', 20)
                              } else {
                                const numValue = parseInt(inputValue, 10)
                                if (isNaN(numValue) || numValue < 0 || numValue > 60) {
                                  handleInputChange('averageConsultationMinutes', 20)
                                } else {
                                  handleInputChange('averageConsultationMinutes', numValue)
                                }
                              }
                            }}
                            className="w-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">minutes</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Range: 0 - 60 minutes
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
                        <IoTimeOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] shrink-0" />
                        <span className="text-sm sm:text-base font-semibold text-slate-900">
                          {formData.averageConsultationMinutes || 20} minutes per patient
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* KYC & Verification */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'kyc' ? null : 'kyc')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">KYC & Verification</h2>
                {activeSection === 'kyc' ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {activeSection === 'kyc' && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <IoShieldCheckmarkOutline className="h-4 w-4 text-[#11496c] shrink-0" />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        License Document
                      </label>
                      {formData.documents?.license ? (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 hover:bg-slate-50 transition-colors">
                          <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                          <a
                            href={formData.documents.license}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#11496c] hover:text-[#11496c] hover:underline truncate"
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
                          <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                          <a
                            href={formData.documents.identityProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#11496c] hover:underline truncate"
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

            {/* Digital Signature */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'signature' ? null : 'signature')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Digital Signature</h2>
                {(activeSection === 'signature' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {(activeSection === 'signature' || isEditing) && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  {formData.digitalSignature?.imageUrl ? (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Signature Preview */}
                      <div className="rounded-lg border-2 border-slate-200 bg-slate-50/50 p-4 sm:p-6">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative mb-3">
                            <img
                              src={formData.digitalSignature.imageUrl}
                              alt="Digital Signature"
                              className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-lg shadow-md bg-white p-2 border border-slate-200"
                              style={{ imageRendering: 'crisp-edges' }}
                            />
                          </div>
                          {formData.digitalSignature.uploadedAt && (
                            <p className="text-xs text-slate-500 mt-2">
                              Uploaded: {formatDate(formData.digitalSignature.uploadedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Edit Options */}
                      {isEditing && (
                        <div className="space-y-2">
                          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Update Signature
                          </p>
                          <div className="flex flex-row gap-2">
                            <label 
                              htmlFor="gallery-input-signature-update"
                              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-[#11496c] hover:bg-slate-50 hover:text-[#11496c] cursor-pointer shadow-sm"
                            >
                              <IoImageOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                              Upload from Gallery
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="hidden"
                                id="gallery-input-signature-update"
                              />
                            </label>
                            <label 
                              htmlFor="camera-input-signature-update"
                              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-[#11496c] bg-[#11496c] px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#0d3a52] hover:border-[#0d3a52] cursor-pointer shadow-sm"
                            >
                              <IoCameraOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                              Capture from Camera
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleSignatureUpload}
                                className="hidden"
                                id="camera-input-signature-update"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveSignature}
                            className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50"
                          >
                            <IoTrashOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                            Remove Signature
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Empty State */}
                      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 sm:p-8 text-center">
                        <IoImageOutline className="h-10 w-10 sm:h-14 sm:w-14 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm sm:text-base font-semibold text-slate-700 mb-1">
                          No signature uploaded
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Upload your digital signature image
                        </p>
                      </div>
                      
                      {/* Upload Options */}
                      {isEditing && (
                        <div className="space-y-2">
                          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Choose Upload Method
                          </p>
                          <div className="flex flex-row gap-2">
                            <label 
                              htmlFor="gallery-input-signature-empty"
                              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2 sm:px-3 py-2 text-center transition hover:border-[#11496c] hover:bg-slate-50 cursor-pointer shadow-sm"
                            >
                              <IoImageOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 shrink-0" />
                              <span className="text-xs sm:text-sm font-semibold text-slate-700">Upload from Gallery</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="hidden"
                                id="gallery-input-signature-empty"
                              />
                            </label>
                            <label 
                              htmlFor="camera-input-signature-empty"
                              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-[#11496c] bg-[#11496c] px-2 sm:px-3 py-2 text-center transition hover:bg-[#0d3a52] hover:border-[#0d3a52] cursor-pointer shadow-sm"
                            >
                              <IoCameraOutline className="h-4 w-4 sm:h-5 sm:w-5 text-white shrink-0" />
                              <span className="text-xs sm:text-sm font-semibold text-white">Capture from Camera</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleSignatureUpload}
                                className="hidden"
                                id="camera-input-signature-empty"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!isEditing && formData.digitalSignature?.imageUrl && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        Click "Edit Profile" to change or remove your digital signature
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Change Password</h2>
                {activeSection === 'password' ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {activeSection === 'password' && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Change Password submitted')
                      alert('Password change functionality will be implemented')
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoLockClosedOutline className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              )}
            </div>

            {/* Support History */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'support' ? null : 'support')}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Support History</h2>
                {activeSection === 'support' ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>

              {activeSection === 'support' && (
                <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 space-y-3 sm:space-y-4 pt-4 sm:pt-5">
                  <SupportHistory role="doctor" />
                </div>
              )}
            </div>
      </section>
    </>
  )
}

// Support History Component
const SupportHistory = ({ role }) => {
  const [supportRequests, setSupportRequests] = useState([])

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchSupportHistory = async () => {
    //   const response = await fetch(`/api/${role}/support/history`)
    //   const data = await response.json()
    //   setSupportRequests(data)
    // }
    // fetchSupportHistory()

    // Mock data
    const mockRequests = [
      {
        id: '1',
        note: 'Need help with prescription management system.',
        status: 'resolved',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
        adminNote: 'Issue resolved. Prescription system updated.',
      },
      {
        id: '2',
        note: 'Unable to access patient records.',
        status: 'in_progress',
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-01-20T11:30:00Z',
        adminNote: 'Working on the issue.',
      },
    ]
    setSupportRequests(mockRequests)
  }, [role])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (supportRequests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">No support requests yet</p>
        <p className="mt-1 text-xs text-slate-500">Your support request history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {supportRequests.map((request) => (
        <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900 flex-1">{request.note}</p>
            {getStatusBadge(request.status)}
          </div>
          {request.adminNote && (
            <div className="mt-2 rounded bg-blue-50 p-2">
              <p className="text-xs font-semibold text-blue-900">Admin Response:</p>
              <p className="mt-1 text-xs text-blue-800">{request.adminNote}</p>
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>Submitted: {formatDate(request.createdAt)}</span>
            {request.updatedAt !== request.createdAt && (
              <span>Updated: {formatDate(request.updatedAt)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default DoctorProfile
