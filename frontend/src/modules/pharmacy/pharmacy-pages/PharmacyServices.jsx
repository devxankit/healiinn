import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoBagHandleOutline,
  IoHomeOutline,
} from 'react-icons/io5'

const mockServices = [
  {
    id: 'svc-1',
    name: 'Prescription Filling',
    description: 'Fast and accurate prescription filling service',
    category: 'prescription',
    price: 0,
    duration: '15-30 minutes',
    available: true,
    deliveryOptions: ['pickup', 'delivery'],
    serviceRadius: 10,
  },
  {
    id: 'svc-2',
    name: 'Medication Consultation',
    description: 'One-on-one consultation with licensed pharmacists',
    category: 'consultation',
    price: 25,
    duration: '30 minutes',
    available: true,
    deliveryOptions: ['pickup'],
    serviceRadius: 0,
  },
  {
    id: 'svc-3',
    name: 'Home Delivery',
    description: 'Same-day home delivery service for prescriptions',
    category: 'delivery',
    price: 5,
    duration: '2-4 hours',
    available: true,
    deliveryOptions: ['delivery'],
    serviceRadius: 15,
  },
  {
    id: 'svc-4',
    name: 'Medication Synchronization',
    description: 'Sync all medications to be refilled on the same day',
    category: 'prescription',
    price: 0,
    duration: 'Ongoing',
    available: true,
    deliveryOptions: ['pickup', 'delivery'],
    serviceRadius: 10,
  },
  {
    id: 'svc-5',
    name: 'Chronic Care Management',
    description: 'Specialized care for chronic conditions',
    category: 'consultation',
    price: 50,
    duration: '60 minutes',
    available: false,
    deliveryOptions: ['pickup'],
    serviceRadius: 0,
  },
]

const categoryConfig = {
  prescription: { label: 'Prescription', color: 'bg-blue-100 text-blue-700', icon: IoBagHandleOutline },
  consultation: { label: 'Consultation', color: 'bg-purple-100 text-purple-700', icon: IoFlaskOutline },
  delivery: { label: 'Delivery', color: 'bg-emerald-100 text-emerald-700', icon: IoHomeOutline },
}

const PharmacyServices = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState(mockServices)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'prescription',
    price: 0,
    duration: '',
    available: true,
    deliveryOptions: [],
    serviceRadius: 0,
  })

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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
    if (editingService) {
      setServices((prev) =>
        prev.map((svc) => (svc.id === editingService.id ? { ...editingService, ...formData } : svc))
      )
    } else {
      const newService = {
        id: `svc-${Date.now()}`,
        ...formData,
      }
      setServices((prev) => [...prev, newService])
    }
    setShowAddModal(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category: 'prescription',
      price: 0,
      duration: '',
      available: true,
      deliveryOptions: [],
      serviceRadius: 0,
    })
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData(service)
    setShowAddModal(true)
  }

  const handleDelete = (serviceId) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices((prev) => prev.filter((svc) => svc.id !== serviceId))
    }
  }

  const handleToggleAvailability = (serviceId) => {
    setServices((prev) =>
      prev.map((svc) => (svc.id === serviceId ? { ...svc, available: !svc.available } : svc))
    )
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-600">{services.length} services</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingService(null)
            setFormData({
              name: '',
              description: '',
              category: 'prescription',
              price: 0,
              duration: '',
              available: true,
              deliveryOptions: [],
              serviceRadius: 0,
            })
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          <IoAddOutline className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services.map((service) => {
          const categoryInfo = categoryConfig[service.category] || categoryConfig.prescription
          const CategoryIcon = categoryInfo.icon

          return (
            <article
              key={service.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${categoryInfo.color}`}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAvailability(service.id)}
                    className={`rounded-full p-2 transition ${
                      service.available
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {service.available ? (
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                    ) : (
                      <IoCloseCircleOutline className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {service.price === 0 ? 'Free' : service.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1">
                    <IoTimeOutline className="h-4 w-4" />
                    {service.duration}
                  </p>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="flex flex-wrap gap-2">
                {service.deliveryOptions.map((option) => (
                  <span
                    key={option}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700"
                  >
                    {option === 'pickup' ? (
                      <>
                        <IoBagHandleOutline className="h-3 w-3" />
                        Pickup
                      </>
                    ) : (
                      <>
                        <IoHomeOutline className="h-3 w-3" />
                        Delivery
                      </>
                    )}
                  </span>
                ))}
                {service.serviceRadius > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                    <IoLocationOutline className="h-3 w-3" />
                    {service.serviceRadius} km radius
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <IoPencilOutline className="mr-1 inline h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <IoTrashOutline className="h-4 w-4" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => {
            setShowAddModal(false)
            setEditingService(null)
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingService(null)
                }}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                >
                  <option value="prescription">Prescription</option>
                  <option value="consultation">Consultation</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    placeholder="e.g., 30 minutes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Options</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryOptionToggle('pickup')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      formData.deliveryOptions.includes('pickup')
                        ? 'border-blue-400 bg-blue-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <IoBagHandleOutline className="h-4 w-4" />
                    Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeliveryOptionToggle('delivery')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      formData.deliveryOptions.includes('delivery')
                        ? 'border-blue-400 bg-blue-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <IoHomeOutline className="h-4 w-4" />
                    Delivery
                  </button>
                </div>
              </div>

              {formData.deliveryOptions.includes('delivery') && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Service Radius (km)</label>
                  <input
                    type="number"
                    value={formData.serviceRadius}
                    onChange={(e) => handleInputChange('serviceRadius', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    min="0"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => handleInputChange('available', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-400/30"
                />
                <label htmlFor="available" className="text-sm font-medium text-slate-700">
                  Service is currently available
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingService(null)
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  {editingService ? 'Update' : 'Add'} Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyServices

