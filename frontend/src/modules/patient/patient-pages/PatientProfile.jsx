import { useState } from 'react'
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoPulseOutline,
  IoMedicalOutline,
  IoWarningOutline,
  IoLockClosedOutline,
  IoNotificationsOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCameraOutline,
  IoArrowForwardOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5'

const mockPatientData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  bloodGroup: 'O+',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  address: {
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
  },
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+1-555-987-6543',
    relation: 'Spouse',
  },
  medicalHistory: [
    { condition: 'Hypertension', diagnosedAt: '2020-03-15', notes: 'Controlled with medication' },
    { condition: 'Type 2 Diabetes', diagnosedAt: '2018-06-20', notes: 'Well managed' },
  ],
  allergies: ['Penicillin', 'Peanuts'],
}

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null) // All sections closed by default
  const [formData, setFormData] = useState(mockPatientData)

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
      const [parent, child] = field.split('.')
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSave = () => {
    // Save logic here
    console.log('Saving profile:', formData)
    setIsEditing(false)
    setActiveSection(null)
  }

  const handleCancel = () => {
    setFormData(mockPatientData)
    setIsEditing(false)
    setActiveSection(null)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/85 to-blue-50/90 backdrop-blur-md p-4 sm:p-6 shadow-xl shadow-blue-200/30 ring-1 ring-white/50">
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
                  <IoPulseOutline className="h-3 w-3" />
                  {formData.bloodGroup || 'Not set'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <IoPersonOutline className="h-3 w-3" />
                  {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                </span>
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
                         // Open all sections when editing
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
                         console.log('Sign out clicked')
                         // Handle sign out
                         if (window.confirm('Are you sure you want to sign out?')) {
                           // Navigate to login or clear session
                           window.location.href = '/patient/login'
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

      {/* Personal Information */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
          {(activeSection === 'personal' || isEditing) ? (
            <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
          ) : (
            <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {(activeSection === 'personal' || isEditing) && (
          <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{formData.firstName}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{formData.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IoCalendarOutline className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(formData.dateOfBirth)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Blood Group
            </label>
            {isEditing ? (
              <select
                value={formData.bloodGroup}
                onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <IoPulseOutline className="h-4 w-4 text-slate-400" />
                <span>{formData.bloodGroup || 'Not set'}</span>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'contact' ? null : 'contact')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
          {(activeSection === 'contact' || isEditing) ? (
            <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
          ) : (
            <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {(activeSection === 'contact' || isEditing) && (
          <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <IoMailOutline className="h-4 w-4 text-slate-400" />
                <span>{formData.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <IoCallOutline className="h-4 w-4 text-slate-400" />
                <span>{formData.phone}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Address
            </label>
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={formData.address?.line1 || ''}
                  onChange={(e) => handleInputChange('address.line1', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={formData.address?.line2 || ''}
                  onChange={(e) => handleInputChange('address.line2', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={formData.address?.postalCode || ''}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <IoLocationOutline className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                <span>{formatAddress(formData.address)}</span>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Medical Information */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'medical' ? null : 'medical')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-900">Medical Information</h2>
          {(activeSection === 'medical' || isEditing) ? (
            <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
          ) : (
            <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {(activeSection === 'medical' || isEditing) && (
          <div className="px-5 pb-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allergies
            </label>
            {formData.allergies && formData.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                  >
                    <IoWarningOutline className="h-3 w-3" />
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No allergies recorded</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Medical History
            </label>
            {formData.medicalHistory && formData.medicalHistory.length > 0 ? (
              <div className="space-y-2">
                {formData.medicalHistory.map((history, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{history.condition}</p>
                        <p className="mt-1 text-xs text-slate-600">{history.notes}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Diagnosed: {formatDate(history.diagnosedAt)}
                        </p>
                      </div>
                      <IoMedicalOutline className="h-5 w-5 text-blue-500 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No medical history recorded</p>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'emergency' ? null : 'emergency')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-900">Emergency Contact</h2>
          {(activeSection === 'emergency' || isEditing) ? (
            <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
          ) : (
            <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {(activeSection === 'emergency' || isEditing) && (
          <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {formData.emergencyContact?.name || 'Not set'}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Relation
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.relation || ''}
                  onChange={(e) => handleInputChange('emergencyContact.relation', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">
                  {formData.emergencyContact?.relation || 'Not set'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.emergencyContact?.phone || ''}
                onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <IoCallOutline className="h-4 w-4 text-slate-400" />
                <span>{formData.emergencyContact?.phone || 'Not set'}</span>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
        >
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
          {activeSection === 'password' ? (
            <IoChevronUpOutline className="h-5 w-5 text-slate-500" />
          ) : (
            <IoChevronDownOutline className="h-5 w-5 text-slate-500" />
          )}
        </button>

        {activeSection === 'password' && (
          <div className="px-5 pb-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                console.log('Change Password submitted')
                // Handle change password
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
  )
}

export default PatientProfile
