import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  IoBagHandleOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoPulseOutline,
} from 'react-icons/io5'

const mockPharmacyData = {
  pharmacyName: 'John Doe',
  ownerName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-214-0098',
  licenseNumber: 'RX-45287',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  bio: 'Your trusted neighborhood pharmacy providing quality medications and personalized care.',
  address: {
    line1: '123 Market Street',
    line2: 'Suite 210',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'USA',
  },
  contactPerson: {
    name: 'Lauren Patel',
    phone: '+1-555-211-0800',
    email: 'lauren.patel@rxcare.com',
  },
  timings: [
    { day: 'Monday', startTime: '08:00', endTime: '21:00', isOpen: true },
    { day: 'Tuesday', startTime: '08:00', endTime: '21:00', isOpen: true },
    { day: 'Wednesday', startTime: '08:00', endTime: '21:00', isOpen: true },
    { day: 'Thursday', startTime: '08:00', endTime: '21:00', isOpen: true },
    { day: 'Friday', startTime: '08:00', endTime: '21:00', isOpen: true },
    { day: 'Saturday', startTime: '09:00', endTime: '18:00', isOpen: true },
    { day: 'Sunday', startTime: '10:00', endTime: '16:00', isOpen: true },
  ],
  deliveryOptions: ['pickup', 'delivery'],
  serviceRadius: 8,
  responseTimeMinutes: 35,
  documents: {
    license: 'https://example.com/license.pdf',
    identityProof: 'https://example.com/id.pdf',
  },
  status: 'approved',
  rating: 4.8,
  bloodGroup: 'O+',
  gender: 'Male',
}

const PharmacyProfile = () => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [formData, setFormData] = useState(mockPharmacyData)

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

  const handleDeliveryOptionToggle = (option) => {
    setFormData((prev) => ({
      ...prev,
      deliveryOptions: prev.deliveryOptions.includes(option)
        ? prev.deliveryOptions.filter((o) => o !== option)
        : [...prev.deliveryOptions, option],
    }))
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setIsEditing(false)
    setActiveSection(null)
    alert('Profile updated successfully!')
  }

  const handleCancel = () => {
    setFormData(mockPharmacyData)
    setIsEditing(false)
    setActiveSection(null)
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Profile Card - Matching Reference Image */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{
          background: 'linear-gradient(135deg, #11496c 0%, #1a5f7a 50%, #2a8ba8 100%)',
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        
        <div className="relative flex flex-col items-center text-center">
          {/* Profile Picture */}
          <div className="relative mb-4">
            <img
              src={formData.profileImage}
              alt={formData.pharmacyName}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-white/20 shadow-xl bg-slate-100"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.pharmacyName)}&background=3b82f6&color=fff&size=128&bold=true`
              }}
            />
            {isEditing && (
              <button
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-lg transition hover:bg-white/30"
                aria-label="Change photo"
              >
                <IoCameraOutline className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {formData.pharmacyName}
          </h1>

          {/* Email */}
          <p className="text-sm sm:text-base text-white/90 mb-4">
            {formData.email}
          </p>

          {/* Badges */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-medium text-white">
              <IoPulseOutline className="h-4 w-4" />
              {formData.bloodGroup || 'O+'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs sm:text-sm font-medium text-white">
              <IoPersonOutline className="h-4 w-4" />
              {formData.gender || 'Male'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:border-white/40 active:scale-95"
            >
              <IoCreateOutline className="h-5 w-5" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('pharmacyAuthToken')
                sessionStorage.removeItem('pharmacyAuthToken')
                navigate('/pharmacy/login', { replace: true })
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/25 active:scale-95"
            >
              <IoLogOutOutline className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Profile Sections */}
      <div className="space-y-4">
        {/* Basic Information */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('basic')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoPersonOutline className="h-5 w-5 text-slate-600" />
              Basic Information
            </h3>
            {activeSection === 'basic' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'basic' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pharmacy Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pharmacyName}
                    onChange={(e) => handleInputChange('pharmacyName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  />
                ) : (
                  <p className="text-sm text-slate-900">{formData.pharmacyName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Name</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">License Number</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600">{formData.bio}</p>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Contact Information */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('contact')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoCallOutline className="h-5 w-5 text-slate-600" />
              Contact Information
            </h3>
            {activeSection === 'contact' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'contact' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Person</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.contactPerson.name}
                      onChange={(e) => handleInputChange('contactPerson.name', e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={(e) => handleInputChange('contactPerson.phone', e.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => handleInputChange('contactPerson.email', e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-slate-900">
                    <p>{formData.contactPerson.name}</p>
                    <p className="text-slate-600">{formData.contactPerson.phone}</p>
                    <p className="text-slate-600">{formData.contactPerson.email}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
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
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        placeholder="Country"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-900">{formatAddress(formData.address)}</p>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Operating Hours */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('hours')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoTimeOutline className="h-5 w-5 text-slate-600" />
              Operating Hours
            </h3>
            {activeSection === 'hours' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'hours' && (
            <div className="mt-4 space-y-2">
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
          )}
        </article>

        {/* Services & Delivery */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('services')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoBagHandleOutline className="h-5 w-5 text-slate-600" />
              Services & Delivery
            </h3>
            {activeSection === 'services' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'services' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Options</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeliveryOptionToggle('pickup')}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                        formData.deliveryOptions.includes('pickup')
                          ? 'border-[#11496c] bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <IoBagHandleOutline className="h-4 w-4" />
                      Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeliveryOptionToggle('delivery')}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                        formData.deliveryOptions.includes('delivery')
                          ? 'border-[#11496c] bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <IoHomeOutline className="h-4 w-4" />
                      Delivery
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.deliveryOptions.map((option) => (
                      <span
                        key={option}
                        className="inline-flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-3 py-1 text-xs font-medium text-[#11496c]"
                      >
                        {option === 'pickup' ? (
                          <>
                            <IoBagHandleOutline className="h-3 w-3" />
                            Pickup Available
                          </>
                        ) : (
                          <>
                            <IoHomeOutline className="h-3 w-3" />
                            Home Delivery
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {formData.deliveryOptions.includes('delivery') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Service Radius (km)</label>
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
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Average Response Time (minutes)</label>
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
          )}
        </article>

        {/* Support History */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('support')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoHelpCircleOutline className="h-5 w-5 text-slate-600" />
              Support History
            </h3>
            {activeSection === 'support' ? (
              <IoChevronUpOutline className="h-5 w-5 text-slate-400" />
            ) : (
              <IoChevronDownOutline className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {activeSection === 'support' && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <SupportHistory role="pharmacy" />
            </div>
          )}
        </article>
      </div>
    </section>
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
        note: 'Order delivery system not working properly.',
        status: 'resolved',
        createdAt: '2024-01-13T11:00:00Z',
        updatedAt: '2024-01-14T16:30:00Z',
        adminNote: 'Fixed delivery system issue.',
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

export default PharmacyProfile

