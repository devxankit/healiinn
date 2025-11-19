import { useState } from 'react'
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
  IoArrowBackOutline,
} from 'react-icons/io5'

const mockPharmacyData = {
  pharmacyName: 'Rx Care Pharmacy',
  ownerName: 'John Smith',
  email: 'support@rxcare.com',
  phone: '+1-555-214-0098',
  licenseNumber: 'RX-45287',
  profileImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Profile</h1>
          <p className="text-sm text-slate-600">Manage your pharmacy information</p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/90 via-indigo-50/85 to-blue-50/90 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-blue-200/20 ring-1 ring-white/50">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-indigo-300/15 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <img
                    src={formData.profileImage}
                    alt={formData.pharmacyName}
                    className="h-full w-full rounded-full object-cover ring-4 ring-white shadow-lg bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.pharmacyName)}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                  {isEditing && (
                    <button
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600"
                    >
                      <IoCameraOutline className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {!isEditing && (
                  <div className="mt-3 flex w-full gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/pharmacy/login')}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{formData.pharmacyName}</h2>
                  <p className="mt-1 text-sm text-slate-600">{formData.ownerName}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <IoShieldCheckmarkOutline className="h-3 w-3" />
                      {formData.status === 'approved' ? 'Verified' : 'Pending'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">⭐ {formData.rating}</span>
                  </div>
                </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    <input
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={(e) => handleInputChange('contactPerson.phone', e.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    <input
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={(e) => handleInputChange('contactPerson.email', e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    <input
                      type="text"
                      value={formData.address.line2}
                      onChange={(e) => handleInputChange('address.line2', e.target.value)}
                      placeholder="Address Line 2"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="City"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      />
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                      />
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        placeholder="Country"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                        <span className="text-xs text-slate-500">to</span>
                        <input
                          type="time"
                          value={timing.endTime}
                          onChange={(e) => handleTimingChange(index, 'endTime', e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                        />
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={timing.isOpen}
                            onChange={(e) => handleTimingChange(index, 'isOpen', e.target.checked)}
                            className="h-3 w-3 rounded border-slate-300 text-blue-500"
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
                          ? 'border-blue-400 bg-blue-500 text-white shadow-sm shadow-blue-400/40'
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
                          ? 'border-blue-400 bg-blue-500 text-white shadow-sm shadow-blue-400/40'
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
                        className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    min="0"
                  />
                ) : (
                  <p className="text-sm text-slate-900">~{formData.responseTimeMinutes} minutes</p>
                )}
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default PharmacyProfile

