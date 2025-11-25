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
  IoFlaskOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoHelpCircleOutline,
  IoPulseOutline,
  IoLogOutOutline,
  IoArrowForwardOutline,
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
}

const LaboratoryProfile = () => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [formData, setFormData] = useState(mockLaboratoryData)

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

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <section className="flex flex-col gap-6 pb-4">
      {/* Profile Card with Blue Background - Reference Image Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#11496c] via-[#1a5f7a] to-[#2a8ba8] p-6 shadow-xl">
        {/* Dotted Pattern Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        
        <div className="relative flex flex-col items-center">
          {/* Profile Picture */}
          <div className="mb-4">
            <div className="relative">
              <img
                src={formData.profileImage}
                alt={formData.laboratoryName}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.laboratoryName)}&background=ffffff&color=11496c&size=128&bold=true`
                }}
              />
              {isEditing && (
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm text-white shadow-lg transition hover:bg-white/40"
                >
                  <IoCameraOutline className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {formData.laboratoryName}
          </h2>

          {/* Email */}
          <p className="text-sm text-white/90 mb-4">
            {formData.email}
          </p>

          {/* Demographic Tags */}
          <div className="flex gap-2 mb-6">
            {formData.bloodGroup && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10">
                <IoPulseOutline className="h-3.5 w-3.5" />
                {formData.bloodGroup}
              </span>
            )}
            {formData.gender && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10">
                <IoPersonOutline className="h-3.5 w-3.5" />
                {formData.gender}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/30 active:scale-[0.98]"
            >
              <IoCreateOutline className="h-5 w-5" />
              Edit Profile
            </button>
            
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/30 active:scale-[0.98]"
            >
              <IoArrowForwardOutline className="h-5 w-5" />
              Sign Out
            </button>
          </div>

          {/* Save/Cancel Buttons when Editing */}
          {isEditing && (
            <div className="w-full mt-3 pt-3 border-t border-white/20 flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/40 active:scale-95"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/30 active:scale-95"
              >
                Cancel
              </button>
            </div>
          )}
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Laboratory Name</label>
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

        {/* Services */}
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <button
            onClick={() => toggleSection('services')}
            className="flex w-full items-center justify-between"
          >
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <IoFlaskOutline className="h-5 w-5 text-slate-600" />
              Services
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Available Services</label>
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
              <SupportHistory role="laboratory" />
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

