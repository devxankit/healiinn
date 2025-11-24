import { useState, useEffect } from 'react'
import {
  IoAddOutline,
  IoCloseOutline,
  IoSearchOutline,
  IoMedicalOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
} from 'react-icons/io5'

const PharmacyMedicines = () => {
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    quantity: '',
    price: '',
    manufacturer: '',
  })

  // Load medicines from localStorage
  useEffect(() => {
    const savedMedicines = JSON.parse(localStorage.getItem('pharmacyMedicines') || '[]')
    setMedicines(savedMedicines)
  }, [])

  // Save medicines to localStorage
  const saveMedicines = (updatedMedicines) => {
    localStorage.setItem('pharmacyMedicines', JSON.stringify(updatedMedicines))
    setMedicines(updatedMedicines)
    
    // Also update pharmacy availability list for admin
    updatePharmacyAvailabilityList(updatedMedicines)
  }

  // Update pharmacy availability list for admin
  const updatePharmacyAvailabilityList = (medicinesList) => {
    const pharmacyId = 'pharmacy-1' // In real app, get from auth context
    const pharmacyName = 'City Pharmacy' // In real app, get from auth context
    
    const pharmacyAvailability = {
      pharmacyId,
      pharmacyName,
      medicines: medicinesList.map(med => ({
        name: med.name,
        dosage: med.dosage,
        quantity: med.quantity,
        price: med.price,
        manufacturer: med.manufacturer,
      })),
      lastUpdated: new Date().toISOString(),
    }

    // Get existing pharmacy availability list
    const existingList = JSON.parse(localStorage.getItem('allPharmacyAvailability') || '[]')
    
    // Find if this pharmacy already exists
    const existingIndex = existingList.findIndex(p => p.pharmacyId === pharmacyId)
    
    if (existingIndex >= 0) {
      // Update existing pharmacy
      existingList[existingIndex] = pharmacyAvailability
    } else {
      // Add new pharmacy
      existingList.push(pharmacyAvailability)
    }

    localStorage.setItem('allPharmacyAvailability', JSON.stringify(existingList))
  }

  const handleAddMedicine = () => {
    setEditingMedicine(null)
    setFormData({
      name: '',
      dosage: '',
      quantity: '',
      price: '',
      manufacturer: '',
    })
    setShowAddModal(true)
  }

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setFormData({
      name: medicine.name,
      dosage: medicine.dosage,
      quantity: medicine.quantity,
      price: medicine.price,
      manufacturer: medicine.manufacturer || '',
    })
    setShowAddModal(true)
  }

  const handleDeleteMedicine = (medicineId) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      const updatedMedicines = medicines.filter(med => med.id !== medicineId)
      saveMedicines(updatedMedicines)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.dosage.trim() || !formData.quantity.trim() || !formData.price.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (editingMedicine) {
      // Update existing medicine
      const updatedMedicines = medicines.map(med =>
        med.id === editingMedicine.id
          ? {
              ...med,
              name: formData.name.trim(),
              dosage: formData.dosage.trim(),
              quantity: formData.quantity.trim(),
              price: formData.price.trim(),
              manufacturer: formData.manufacturer.trim(),
              updatedAt: new Date().toISOString(),
            }
          : med
      )
      saveMedicines(updatedMedicines)
    } else {
      // Add new medicine
      const newMedicine = {
        id: `med-${Date.now()}`,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        quantity: formData.quantity.trim(),
        price: formData.price.trim(),
        manufacturer: formData.manufacturer.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      saveMedicines([...medicines, newMedicine])
    }

    setShowAddModal(false)
    setFormData({
      name: '',
      dosage: '',
      quantity: '',
      price: '',
      manufacturer: '',
    })
  }

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.manufacturer && med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by medicine name, dosage, or manufacturer..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add Medicine Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAddMedicine}
          className="flex items-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54] active:scale-95"
        >
          <IoAddOutline className="h-5 w-5" />
          Add Medicine
        </button>
      </div>

      {/* Medicines List */}
      <div className="space-y-3">
        {filteredMedicines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              {searchTerm ? 'No medicines found' : 'No medicines added yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm ? 'Try a different search term' : 'Click "Add Medicine" to get started'}
            </p>
          </div>
        ) : (
          filteredMedicines.map((medicine) => (
            <article
              key={medicine.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                  <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 mb-1">{medicine.name}</h3>
                      <p className="text-sm text-slate-600 mb-1">Dosage: {medicine.dosage}</p>
                      {medicine.manufacturer && (
                        <p className="text-xs text-slate-500 mb-2">Manufacturer: {medicine.manufacturer}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">Quantity:</span>
                          <span>{medicine.quantity}</span>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">Price:</span>
                          <span className="text-[#11496c] font-bold">{formatCurrency(parseFloat(medicine.price))}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditMedicine(medicine)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        aria-label="Edit medicine"
                      >
                        <IoPencilOutline className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(medicine.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50"
                        aria-label="Delete medicine"
                      >
                        <IoTrashOutline className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., Paracetamol"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dosage"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., 500mg"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="quantity"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    placeholder="e.g., 100 strips"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                    placeholder="e.g., 50.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                  placeholder="e.g., Cipla Ltd"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54]"
                >
                  {editingMedicine ? 'Update' : 'Add'} Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyMedicines

