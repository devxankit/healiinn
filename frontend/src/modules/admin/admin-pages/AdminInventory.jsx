import { useState, useEffect, useMemo } from 'react'
import {
  IoMedicalOutline,
  IoSearchOutline,
  IoBusinessOutline,
  IoBagHandleOutline,
  IoPricetagOutline,
  IoCubeOutline,
  IoCheckmarkCircleOutline,
  IoArrowBackOutline,
} from 'react-icons/io5'

const AdminInventory = () => {
  const [pharmacyList, setPharmacyList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [activeTab, setActiveTab] = useState('total') // 'total' or 'pharmacy'

  useEffect(() => {
    loadPharmacyInventory()
  }, [])

  const loadPharmacyInventory = () => {
    const availabilityList = JSON.parse(localStorage.getItem('allPharmacyAvailability') || '[]')
    setPharmacyList(availabilityList)
  }

  // Calculate total inventory statistics
  const totalInventory = useMemo(() => {
    const allMedicines = pharmacyList.flatMap(pharmacy => 
      (pharmacy.medicines || []).map(med => ({
        ...med,
        pharmacyId: pharmacy.pharmacyId,
        pharmacyName: pharmacy.pharmacyName,
      }))
    )
    
    // Group by medicine name and dosage
    const medicineMap = new Map()
    allMedicines.forEach(med => {
      const key = `${med.name}_${med.dosage || ''}`
      if (!medicineMap.has(key)) {
        medicineMap.set(key, {
          name: med.name,
          dosage: med.dosage || 'N/A',
          manufacturer: med.manufacturer || 'N/A',
          totalQuantity: 0,
          totalPrice: 0,
          pharmacies: [],
        })
      }
      const existing = medicineMap.get(key)
      const quantity = parseInt(med.quantity) || 0
      const price = parseFloat(med.price) || 0
      existing.totalQuantity += quantity
      existing.totalPrice += price * quantity
      existing.pharmacies.push({
        pharmacyId: med.pharmacyId,
        pharmacyName: med.pharmacyName,
        quantity,
        price,
      })
    })

    return {
      totalPharmacies: pharmacyList.length,
      totalMedicines: allMedicines.length,
      uniqueMedicines: medicineMap.size,
      totalStock: allMedicines.reduce((sum, med) => sum + (parseInt(med.quantity) || 0), 0),
      totalValue: allMedicines.reduce((sum, med) => {
        const quantity = parseInt(med.quantity) || 0
        const price = parseFloat(med.price) || 0
        return sum + (quantity * price)
      }, 0),
      medicineMap: Array.from(medicineMap.values()),
    }
  }, [pharmacyList])

  const filteredPharmacies = pharmacyList.filter(pharmacy =>
    pharmacy.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.medicines.some(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Filter total inventory medicines by search term
  const filteredTotalInventory = useMemo(() => {
    if (!searchTerm.trim()) return totalInventory.medicineMap
    
    const searchLower = searchTerm.toLowerCase()
    return totalInventory.medicineMap.filter(med =>
      med.name.toLowerCase().includes(searchLower) ||
      med.dosage.toLowerCase().includes(searchLower) ||
      med.manufacturer.toLowerCase().includes(searchLower)
    )
  }, [totalInventory.medicineMap, searchTerm])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateString
    }
  }

  // Pharmacy Detail View
  if (selectedPharmacy) {
    const pharmacyTotalValue = selectedPharmacy.medicines.reduce((sum, med) => {
      const quantity = parseInt(med.quantity) || 0
      const price = parseFloat(med.price) || 0
      return sum + (quantity * price)
    }, 0)

    return (
      <section className="flex flex-col gap-4 pb-4">
        {/* Back Button and Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedPharmacy(null)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selectedPharmacy.pharmacyName}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {selectedPharmacy.medicines.length} {selectedPharmacy.medicines.length === 1 ? 'medicine' : 'medicines'} in inventory
            </p>
          </div>
        </div>

        {/* Pharmacy Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-4 text-center shadow-sm">
            <IoBagHandleOutline className="mx-auto h-6 w-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{selectedPharmacy.medicines.length}</p>
            <p className="text-xs font-semibold text-blue-700">Medicines</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-4 text-center shadow-sm">
            <IoCubeOutline className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              {selectedPharmacy.medicines.reduce((sum, med) => sum + (parseInt(med.quantity) || 0), 0)}
            </p>
            <p className="text-xs font-semibold text-emerald-700">Total Units</p>
          </div>
          <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/60 p-4 text-center shadow-sm col-span-2 sm:col-span-1">
            <IoPricetagOutline className="mx-auto h-6 w-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(pharmacyTotalValue)}</p>
            <p className="text-xs font-semibold text-purple-700">Total Value</p>
          </div>
        </div>

        {/* Medicines List */}
        <div className="space-y-3">
          {selectedPharmacy.medicines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">No medicines in inventory</p>
            </div>
          ) : (
            selectedPharmacy.medicines.map((medicine, index) => {
              const quantity = parseInt(medicine.quantity) || 0
              const price = parseFloat(medicine.price) || 0
              const totalValue = quantity * price

              return (
                <article
                  key={index}
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="font-semibold text-slate-600">Units:</span>
                              <p className="text-slate-900 font-bold">{quantity}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-600">Price/Unit:</span>
                              <p className="text-slate-900 font-bold">{formatCurrency(price)}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-600">Dosage:</span>
                              <p className="text-slate-900 font-bold">{medicine.dosage || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-600">Total Value:</span>
                              <p className="text-[#11496c] font-bold">{formatCurrency(totalValue)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>
    )
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
          placeholder={activeTab === 'total' ? 'Search medicines...' : 'Search by pharmacy name or medicine...'}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('total')}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'total'
              ? 'text-[#11496c] border-[#11496c]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Total Inventory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pharmacy')}
          className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'pharmacy'
              ? 'text-[#11496c] border-[#11496c]'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Pharmacy Inventory
        </button>
      </div>

      {/* Total Inventory Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
              <IoBusinessOutline className="h-6 w-6 text-[#11496c]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Total Pharmacies</p>
              <p className="text-2xl font-bold text-slate-900">{totalInventory.totalPharmacies}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <IoCubeOutline className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Total Stock</p>
              <p className="text-2xl font-bold text-slate-900">{totalInventory.totalStock.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <IoPricetagOutline className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalInventory.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'total' ? (
        /* Total Inventory Tab */
        <div className="space-y-3">
          {filteredTotalInventory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                {searchTerm ? 'No medicines found' : 'No medicines in inventory'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm ? 'Try a different search term' : 'Medicines will appear here once pharmacies add them'}
              </p>
            </div>
          ) : (
            filteredTotalInventory.map((med, idx) => (
              <article
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                    <IoMedicalOutline className="h-6 w-6 text-[#11496c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">{med.name}</h3>
                    <p className="text-sm text-slate-600 mb-2">Dosage: {med.dosage}</p>
                    {med.manufacturer && med.manufacturer !== 'N/A' && (
                      <p className="text-xs text-slate-500 mb-3">Manufacturer: {med.manufacturer}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-slate-600">Total Units:</span>
                        <p className="text-slate-900 font-bold text-sm mt-0.5">{med.totalQuantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Total Value:</span>
                        <p className="text-[#11496c] font-bold text-sm mt-0.5">{formatCurrency(med.totalPrice)}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Available at:</span>
                        <p className="text-slate-900 font-bold text-sm mt-0.5">{med.pharmacies.length} {med.pharmacies.length === 1 ? 'pharmacy' : 'pharmacies'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Avg. Price:</span>
                        <p className="text-slate-900 font-bold text-sm mt-0.5">
                          {med.totalQuantity > 0 ? formatCurrency(med.totalPrice / med.totalQuantity) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {/* Pharmacy List */}
                    {med.pharmacies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Available at:</p>
                        <div className="flex flex-wrap gap-2">
                          {med.pharmacies.map((pharm, pIdx) => (
                            <span
                              key={pIdx}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              <IoBusinessOutline className="h-3 w-3" />
                              {pharm.pharmacyName} ({pharm.quantity} units)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        /* Pharmacy Inventory Tab */
        <div className="space-y-3">
          {filteredPharmacies.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <IoMedicalOutline className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                {searchTerm ? 'No pharmacies found' : 'No pharmacies have added medicines yet'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm ? 'Try a different search term' : 'Pharmacies will appear here once they add their medicines'}
              </p>
            </div>
          ) : (
            filteredPharmacies.map((pharmacy) => {
              const pharmacyTotalValue = pharmacy.medicines.reduce((sum, med) => {
                const quantity = parseInt(med.quantity) || 0
                const price = parseFloat(med.price) || 0
                return sum + (quantity * price)
              }, 0)
              const pharmacyTotalStock = pharmacy.medicines.reduce((sum, med) => sum + (parseInt(med.quantity) || 0), 0)

              return (
                <article
                  key={pharmacy.pharmacyId}
                  onClick={() => setSelectedPharmacy(pharmacy)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.3)] hover:shadow-md cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,73,108,0.1)]">
                      <IoBusinessOutline className="h-6 w-6 text-[#11496c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-slate-900 mb-1">{pharmacy.pharmacyName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <IoMedicalOutline className="h-3 w-3" />
                              <span className="font-semibold text-slate-700">{pharmacy.medicines.length}</span>
                              <span>{pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'}</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoCubeOutline className="h-3 w-3" />
                              <span className="font-semibold text-slate-700">{pharmacyTotalStock}</span>
                              <span>units</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="flex items-center gap-1">
                              <IoPricetagOutline className="h-3 w-3" />
                              <span className="font-semibold text-[#11496c]">{formatCurrency(pharmacyTotalValue)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                            Active
                          </span>
                        </div>
                      </div>
                      
                      {/* Sample Medicines Preview */}
                      {pharmacy.medicines.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {pharmacy.medicines.slice(0, 3).map((med, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              <IoMedicalOutline className="h-3 w-3" />
                              {med.name} ({med.dosage}) - {med.quantity} units
                            </span>
                          ))}
                          {pharmacy.medicines.length > 3 && (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                              +{pharmacy.medicines.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}

export default AdminInventory

