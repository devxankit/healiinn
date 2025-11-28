import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LaboratoryNavbar from '../laboratory-components/LaboratoryNavbar'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoFlaskOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoPulseOutline,
  IoLogOutOutline,
  IoArrowForwardOutline,
  IoPowerOutline,
  IoStarOutline,
} from 'react-icons/io5'

const mockLaboratoryData = {
  laboratoryName: 'MediLab Diagnostics',
  ownerName: 'Dr. James Wilson',
  email: 'info@medilab.com',
  phone: '+1-555-214-0098',
  licenseNumber: 'LAB-45287',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  bio: 'Your trusted diagnostic laboratory providing accurate and timely test results.',
  bloodGroup: 'O+',
  gender: 'Male',
  address: {
    line1: '123 Medical Street',
    line2: 'Suite 210',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'USA',
  },
  contactPerson: {
    name: 'Lauren Patel',
    phone: '+1-555-211-0800',
    email: 'lauren.patel@medilab.com',
  },
  timings: [
    { day: 'Monday', startTime: '08:00', endTime: '20:00', isOpen: true },
    { day: 'Tuesday', startTime: '08:00', endTime: '20:00', isOpen: true },
    { day: 'Wednesday', startTime: '08:00', endTime: '20:00', isOpen: true },
    { day: 'Thursday', startTime: '08:00', endTime: '20:00', isOpen: true },
    { day: 'Friday', startTime: '08:00', endTime: '20:00', isOpen: true },
    { day: 'Saturday', startTime: '09:00', endTime: '18:00', isOpen: true },
    { day: 'Sunday', startTime: '10:00', endTime: '16:00', isOpen: true },
  ],
  services: ['Blood Tests', 'Urine Tests', 'X-Ray', 'Ultrasound', 'ECG'],
  serviceRadius: 10,
  responseTimeMinutes: 45,
  documents: {
    license: 'https://example.com/license.pdf',
    identityProof: 'https://example.com/id.pdf',
  },
  status: 'approved',
  rating: 4.9,
  isActive: true,
}

const LaboratoryProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('laboratoryProfile')
    if (saved) {
      try {
        return { ...mockLaboratoryData, ...JSON.parse(saved) }
      } catch (e) {
        return mockLaboratoryData
      }
    }
    return mockLaboratoryData
  })
  const isDashboardPage = location.pathname === '/laboratory/dashboard'

  const handleLogout = () => {
    localStorage.removeItem('laboratoryAuthToken')
    sessionStorage.removeItem('laboratoryAuthToken')
    navigate('/laboratory/login', { replace: true })
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

  const handleTimingChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.timings]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, timings: updated }
    })
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setIsEditing(false)
    setActiveSection(null)
    alert('Profile updated successfully!')
  }

  const handleCancel = () => {
    setFormData(mockLaboratoryData)
    setIsEditing(false)
    setActiveSection(null)
  }

  const handleToggleActive = () => {
    const newActiveStatus = !formData.isActive
    const updatedFormData = { ...formData, isActive: newActiveStatus }
    setFormData(updatedFormData)
    localStorage.setItem('laboratoryProfile', JSON.stringify(updatedFormData))
    
    if (newActiveStatus) {
      alert('Your profile is now active and visible to patients.')
    } else {
      alert('Your profile is now inactive and will not be visible to patients.')
    }
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <>
      <LaboratoryNavbar />
      <section className={`flex flex-col gap-4 pb-24 lg:pb-8 ${isDashboardPage ? '-mt-20' : ''} lg:mt-0`}>
        {/* Desktop Layout: Two Column Grid */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-4 lg:max-w-5xl lg:mx-auto lg:px-4">
          {/* Left Column - Profile Header Card (Desktop) */}
          <div className="lg:col-span-1">
            {/* Profile Header - Desktop Enhanced */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-5 shadow-xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />

              <div className="relative flex flex-col items-center gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="relative h-24 w-24">
                    <img
                      src={formData.profileImage}
                      alt={formData.laboratoryName}
                      className="h-full w-full rounded-full object-cover ring-4 ring-white/50 shadow-2xl bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.laboratoryName)}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#11496c] shadow-xl transition hover:bg-slate-50 hover:scale-110"
                      >
                        <IoCameraOutline className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white mb-1.5">
                    {formData.laboratoryName}
                  </h1>
                  <p className="text-sm text-white/90 mb-3">
                    {formData.email}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-col items-center gap-2 mb-3">
                    {formData.licenseNumber && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white border border-white/30">
                        <IoFlaskOutline className="h-3.5 w-3.5" />
                        {formData.licenseNumber}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {formData.gender && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white border border-white/30">
                          <IoPersonOutline className="h-3 w-3" />
                          {formData.gender}
                        </span>
                      )}
                      {formData.rating > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white border border-white/30">
                          <IoStarOutline className="h-3 w-3" />
                          {formData.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="w-full">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      formData.isActive
                        ? 'bg-emerald-500/90 backdrop-blur-sm text-white border border-emerald-400/50 hover:bg-emerald-500 shadow-lg'
                        : 'bg-slate-500/90 backdrop-blur-sm text-white border border-slate-400/50 hover:bg-slate-500 shadow-lg'
                    }`}
                  >
                    {formData.isActive ? (
                      <>
                        <IoCheckmarkCircleOutline className="h-5 w-5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <IoPowerOutline className="h-5 w-5" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-white/70 text-center mt-2">
                    {formData.isActive ? 'Visible to patients' : 'Hidden from patients'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2 mt-1">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 hover:scale-105 shadow-lg"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 hover:scale-105"
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
                          setActiveSection('basic')
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoLogOutOutline className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Header - Mobile (Unchanged) */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-6 sm:p-8 shadow-lg lg:hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              
              <div className="relative flex flex-col items-center gap-4 sm:gap-5">
                {/* Profile Picture - Centered */}
                <div className="relative">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                    <img
                      src={formData.profileImage}
                      alt={formData.laboratoryName}
                      className="h-full w-full rounded-full object-cover ring-2 ring-white/50 shadow-lg bg-slate-100"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.laboratoryName)}&background=ffffff&color=11496c&size=128&bold=true`
                      }}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#11496c] shadow-lg transition hover:bg-slate-50"
                      >
                        <IoCameraOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Name - Centered */}
                <h1 className="text-xl sm:text-2xl font-bold text-white text-center">
                  {formData.laboratoryName}
                </h1>

                {/* Email - Centered */}
                <p className="text-sm sm:text-base text-white/90 text-center truncate max-w-full">
                  {formData.email}
                </p>

                {/* Demographic/Status Info - Small Rounded Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                  {formData.licenseNumber && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-white border border-white/30">
                      <IoFlaskOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {formData.licenseNumber}
                    </span>
                  )}
                  {formData.gender && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-white border border-white/30">
                      <IoPersonOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {formData.gender}
                    </span>
                  )}
                  {formData.rating > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-semibold text-white border border-white/30">
                      <IoStarOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {formData.rating}
                    </span>
                  )}
                </div>

                {/* Active Status - Top Right */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      formData.isActive
                        ? 'bg-emerald-500/90 backdrop-blur-sm text-white border border-emerald-400/50 hover:bg-emerald-500'
                        : 'bg-slate-500/90 backdrop-blur-sm text-white border border-slate-400/50 hover:bg-slate-500'
                    }`}
                  >
                    {formData.isActive ? (
                      <>
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <IoPowerOutline className="h-3.5 w-3.5" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-white/70 text-right max-w-[100px]">
                    {formData.isActive ? 'Visible to patients' : 'Hidden from patients'}
                  </p>
                </div>

                {/* Action Buttons - Full Width, Stacked */}
                <div className="w-full flex flex-col gap-2.5 sm:gap-3 mt-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
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
                          setActiveSection('basic')
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/30 active:scale-95"
                      >
                        <IoCreateOutline className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white/90 border border-white/20 transition-all hover:bg-white/20 active:scale-95"
                      >
                        <IoLogOutOutline className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Information Sections (Desktop) */}
          <div className="lg:col-span-2 lg:space-y-4">

            {/* Basic Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Basic Information</h2>
                {(activeSection === 'basic' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'basic' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 lg:pt-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Laboratory Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.laboratoryName}
                          onChange={(e) => handleInputChange('laboratoryName', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.laboratoryName}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Owner Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.ownerName}</p>
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
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.licenseNumber}</p>
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
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-sm text-slate-900">{formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    ) : (
                      <p className="text-sm text-slate-600">{formData.bio}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('contact')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Contact Information</h2>
                {(activeSection === 'contact' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'contact' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 lg:pt-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.phone}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Address
                      </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.address.line1}
                      onChange={(e) => handleInputChange('address.line1', e.target.value)}
                      placeholder="Address Line 1"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="text"
                      value={formData.address.line2}
                      onChange={(e) => handleInputChange('address.line2', e.target.value)}
                      placeholder="Address Line 2"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="City"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-900">{formatAddress(formData.address)}</p>
                )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('hours')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Operating Hours</h2>
                {(activeSection === 'hours' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'hours' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="pt-3 sm:pt-4 lg:pt-3 space-y-2">
                    {formData.timings.map((timing, index) => (
                      <div key={timing.day} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{timing.day}</p>
                          {isEditing ? (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="time"
                                value={timing.startTime}
                                onChange={(e) => handleTimingChange(index, 'startTime', e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                              />
                              <span className="text-xs text-slate-500">to</span>
                              <input
                                type="time"
                                value={timing.endTime}
                                onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                              />
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={timing.isOpen}
                                  onChange={(e) => handleTimingChange(index, 'isOpen', e.target.checked)}
                                  className="h-3 w-3 rounded border-slate-300 text-[#11496c]"
                                />
                                Open
                              </label>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600">
                              {timing.isOpen ? `${timing.startTime} - ${timing.endTime}` : 'Closed'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('services')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Services</h2>
                {(activeSection === 'services' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'services' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="pt-3 sm:pt-4 lg:pt-3 space-y-3">
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Available Services</label>
                <div className="flex flex-wrap gap-2">
                  {formData.services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-3 py-1 text-xs font-medium text-[#11496c]"
                    >
                      <IoFlaskOutline className="h-3 w-3" />
                      {service}
                    </span>
                  ))}
                </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Service Radius (km)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.serviceRadius}
                          onChange={(e) => handleInputChange('serviceRadius', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                          min="0"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">{formData.serviceRadius} km</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Average Response Time (minutes)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.responseTimeMinutes}
                          onChange={(e) => handleInputChange('responseTimeMinutes', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                          min="0"
                        />
                      ) : (
                        <p className="text-sm text-slate-900">~{formData.responseTimeMinutes} minutes</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Support History */}
            <div className="rounded-xl sm:rounded-2xl lg:rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200 lg:shadow-xl lg:hover:shadow-2xl">
              <button
                type="button"
                onClick={() => toggleSection('support')}
                className="w-full flex items-center justify-between px-3 sm:px-5 lg:px-4 py-3 sm:py-4 lg:py-3 hover:bg-slate-50/50 transition-colors"
              >
                <h2 className="text-sm sm:text-base lg:text-base font-bold text-slate-900">Support History</h2>
                {(activeSection === 'support' || isEditing) ? (
                  <IoChevronUpOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                ) : (
                  <IoChevronDownOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
                )}
              </button>
              {(activeSection === 'support' || isEditing) && (
                <div className="px-3 sm:px-5 lg:px-4 pb-4 sm:pb-5 lg:pb-4 border-t border-slate-100">
                  <div className="pt-3 sm:pt-4 lg:pt-3">
                    <SupportHistory role="laboratory" />
                  </div>
                </div>
              )}
            </div>
          </div>
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
    const mockRequests = [
      {
        id: '1',
        note: 'Report generation taking too long.',
        status: 'pending',
        createdAt: '2024-01-16T08:45:00Z',
        updatedAt: '2024-01-16T08:45:00Z',
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

export default LaboratoryProfile

