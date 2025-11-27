import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoBagHandleOutline,
  IoMedicalOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoBusinessOutline,
  IoChevronDownOutline,
  IoLocationOutline,
  IoCallOutline,
  IoMailOutline,
  IoStar,
  IoStarOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoFlaskOutline,
  IoSearchOutline,
  IoChatbubbleOutline,
  IoHomeOutline,
} from 'react-icons/io5'

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

const AdminRequests = () => {
  const [labRequests, setLabRequests] = useState([])
  const [pharmacyRequests, setPharmacyRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [activeSection, setActiveSection] = useState('pharmacy') // 'lab' or 'pharmacy'
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [pharmacies, setPharmacies] = useState([])
  const [labs, setLabs] = useState([])
  const [showPharmacyDropdown, setShowPharmacyDropdown] = useState(false)
  const [showLabDropdown, setShowLabDropdown] = useState(false)
  const [selectedPharmacies, setSelectedPharmacies] = useState([])
  const [selectedLabs, setSelectedLabs] = useState([]) // Changed to array for multiple labs
  const [selectedLab, setSelectedLab] = useState(null) // Keep for backward compatibility, but will use selectedLabs
  const pharmacyDropdownRef = useRef(null)
  const labDropdownRef = useRef(null)
  const [adminMedicines, setAdminMedicines] = useState([]) // Medicines added by admin
  const [adminResponse, setAdminResponse] = useState('') // Admin's response message
  const [totalAmount, setTotalAmount] = useState(0) // Total amount calculated from medicines
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [pharmacyMedicineSearch, setPharmacyMedicineSearch] = useState('') // Search term for pharmacy medicines
  const [expandedPharmacyId, setExpandedPharmacyId] = useState(null) // Track which pharmacy's medicines are expanded
  const [expandedPharmacySearch, setExpandedPharmacySearch] = useState('') // Search term for expanded pharmacy medicines
  const [expandedLabId, setExpandedLabId] = useState(null) // Track which lab's tests are expanded
  const [expandedLabSearch, setExpandedLabSearch] = useState('') // Search term for expanded lab tests
  const [labTestSearch, setLabTestSearch] = useState('') // Search term for lab tests (keep for backward compatibility)
  const [showCancelModal, setShowCancelModal] = useState(false) // Show cancel reason modal
  const [cancelReason, setCancelReason] = useState('') // Cancel reason text
  const [requestToCancel, setRequestToCancel] = useState(null) // Request to cancel
  const [selectedMedicinesFromPharmacy, setSelectedMedicinesFromPharmacy] = useState([]) // {pharmacyId, pharmacyName, medicine, quantity, price}
  const [selectedTestsFromLab, setSelectedTestsFromLab] = useState([]) // {labId, labName, test, price}

  useEffect(() => {
    loadRequests()
    loadPharmacies()
    loadLabs()
    // Refresh every 2 seconds to get new requests
    const interval = setInterval(() => {
      loadRequests()
      loadPharmacies()
      loadLabs()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPharmacyDropdown && pharmacyDropdownRef.current && !pharmacyDropdownRef.current.contains(event.target)) {
        setShowPharmacyDropdown(false)
      }
      if (showLabDropdown && labDropdownRef.current && !labDropdownRef.current.contains(event.target)) {
        setShowLabDropdown(false)
    }
    }
    if (showPharmacyDropdown || showLabDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPharmacyDropdown, showLabDropdown])

  const loadLabs = () => {
    try {
      let labList = JSON.parse(localStorage.getItem('allLabAvailability') || '[]')
      
      // If no data, use dummy data
      if (labList.length === 0) {
        labList = [
          {
            labId: 'lab-1',
            labName: 'MediCare Diagnostics',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 11111',
            email: 'medicare@lab.com',
            address: '123 Health Street, Pune, Maharashtra 411001',
            rating: 4.9,
            tests: [
              { name: 'Complete Blood Count (CBC)', price: 500 },
              { name: 'Lipid Profile', price: 800 },
              { name: 'ECG', price: 300 },
            ],
          },
          {
            labId: 'lab-2',
            labName: 'HealthFirst Lab',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 22222',
            email: 'healthfirst@lab.com',
            address: '456 Test Avenue, Mumbai, Maharashtra 400001',
            rating: 4.7,
            tests: [
              { name: 'Blood Pressure Monitoring', price: 200 },
              { name: 'Blood Sugar Test', price: 250 },
            ],
          },
        ]
        localStorage.setItem('allLabAvailability', JSON.stringify(labList))
      }
      
      // Get only approved and active labs
      const approvedLabs = labList.filter(
        (lab) => lab.status === 'approved' && lab.isActive
      )
      setLabs(approvedLabs)
    } catch (error) {
      console.error('Error loading labs:', error)
      setLabs([])
    }
  }

  const loadPharmacies = () => {
    try {
      let availabilityList = JSON.parse(localStorage.getItem('allPharmacyAvailability') || '[]')
      
      // If no data, use dummy data
      if (availabilityList.length === 0) {
        availabilityList = [
          {
            pharmacyId: 'pharm-1',
            pharmacyName: 'Apollo Pharmacy',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 12345',
            email: 'apollo@pharmacy.com',
            address: '123 Main Street, Pune, Maharashtra 411001',
            rating: 4.8,
            medicines: [
              { name: 'Paracetamol', dosage: '500mg', manufacturer: 'Cipla', quantity: 150, price: 25 },
              { name: 'Amoxicillin', dosage: '250mg', manufacturer: 'Sun Pharma', quantity: 80, price: 45 },
              { name: 'Cetirizine', dosage: '10mg', manufacturer: 'Dr. Reddy\'s', quantity: 120, price: 30 },
            ],
          },
          {
            pharmacyId: 'pharm-2',
            pharmacyName: 'MedPlus Pharmacy',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 23456',
            email: 'medplus@pharmacy.com',
            address: '456 Market Road, Mumbai, Maharashtra 400001',
            rating: 4.6,
            medicines: [
              { name: 'Paracetamol', dosage: '500mg', manufacturer: 'Cipla', quantity: 200, price: 24 },
              { name: 'Ibuprofen', dosage: '400mg', manufacturer: 'Mankind', quantity: 90, price: 35 },
              { name: 'Azithromycin', dosage: '500mg', manufacturer: 'Pfizer', quantity: 60, price: 120 },
            ],
          },
          {
            pharmacyId: 'pharm-3',
            pharmacyName: 'Wellness Forever',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 34567',
            email: 'wellness@pharmacy.com',
            address: '789 Health Avenue, Delhi, Delhi 110001',
            rating: 4.7,
            medicines: [
              { name: 'Cetirizine', dosage: '10mg', manufacturer: 'Dr. Reddy\'s', quantity: 100, price: 32 },
              { name: 'Omeprazole', dosage: '20mg', manufacturer: 'Torrent', quantity: 75, price: 55 },
            ],
          },
          {
            pharmacyId: 'pharm-4',
            pharmacyName: 'Health Plus Pharmacy',
            status: 'approved',
            isActive: true,
            phone: '+91 98765 45678',
            email: 'healthplus@pharmacy.com',
            address: '321 Care Street, Bangalore, Karnataka 560001',
            rating: 4.9,
            medicines: [
              { name: 'Amoxicillin', dosage: '250mg', manufacturer: 'Sun Pharma', quantity: 110, price: 48 },
              { name: 'Paracetamol', dosage: '500mg', manufacturer: 'Cipla', quantity: 180, price: 26 },
              { name: 'Metformin', dosage: '500mg', manufacturer: 'USV', quantity: 95, price: 40 },
            ],
          },
        ]
        localStorage.setItem('allPharmacyAvailability', JSON.stringify(availabilityList))
      }
      
      // Get only approved and active pharmacies
      const approvedPharmacies = availabilityList.filter(
        (pharm) => pharm.status === 'approved' && pharm.isActive
      )
      setPharmacies(approvedPharmacies)
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      setPharmacies([])
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<IoStar key={i} className="h-3 w-3 text-amber-400" />)
    }

    if (hasHalfStar) {
      stars.push(<IoStarOutline key="half" className="h-3 w-3 text-amber-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<IoStarOutline key={`empty-${i}`} className="h-3 w-3 text-slate-300" />)
    }

    return stars
  }

  const loadRequests = () => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      
      // Separate lab and pharmacy requests
      const labReqs = allRequests.filter((req) => req.type === 'book_test_visit')
      const pharmacyReqs = allRequests.filter((req) => req.type === 'order_medicine')
      
      // Sort by creation date (newest first)
      labReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      pharmacyReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setLabRequests(labReqs)
      setPharmacyRequests(pharmacyReqs)
    } catch (error) {
      console.error('Error loading requests:', error)
      setLabRequests([])
      setPharmacyRequests([])
    }
  }

  const getFilteredRequests = (requestsList) => {
    return requestsList.filter((req) => {
      if (filter === 'all') return true
      return req.status === filter
    })
  }

  const handleStatusChange = (requestId, newStatus) => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      loadRequests()
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      const request = filteredRequests.find(req => req.id === requestId)
      if (!request) return

      // Update admin request status to accepted
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            acceptedBy: 'Admin',
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Create patient request notification
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const existingIndex = patientRequests.findIndex(req => req.id === requestId)
      
      const patientRequestData = {
        id: requestId,
        type: activeSection === 'pharmacy' ? 'pharmacy' : 'lab',
        providerName: 'Healiinn',
        providerId: 'admin',
        medicineName: activeSection === 'pharmacy' ? 'Prescription Medicines' : 'Lab Tests',
        testName: activeSection === 'lab' ? 'Lab Test Request' : undefined,
        status: 'accepted',
        requestDate: request.createdAt,
        responseDate: new Date().toISOString(),
        totalAmount: 0, // Will be set when admin adds medicines
        message: `Your ${activeSection === 'pharmacy' ? 'medicine order' : 'lab test'} request has been accepted by admin. Please wait for further details.`,
        prescriptionId: request.prescriptionId,
        patient: {
          name: request.patientName,
          phone: request.patientPhone,
          email: request.patientEmail || 'patient@example.com',
          address: request.patientAddress,
          age: 32,
          gender: 'Male',
        },
        providerResponse: {
          message: `Your request has been accepted. Admin will add ${activeSection === 'pharmacy' ? 'medicines' : 'test details'} shortly.`,
          responseBy: 'Healiinn Team',
          responseTime: new Date().toISOString(),
        },
        doctor: {
          name: request.prescription?.doctorName || 'Doctor',
          specialty: request.prescription?.doctorSpecialty || 'Specialty',
          phone: '+91 98765 43210',
        },
        prescription: request.prescription,
      }

      if (existingIndex >= 0) {
        patientRequests[existingIndex] = patientRequestData
      } else {
        patientRequests.push(patientRequestData)
      }
      localStorage.setItem('patientRequests', JSON.stringify(patientRequests))

      // Don't open modal - just update status. Admin can click "Add Medicine"/"Add Lab" button to open modal
      loadRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
    }
  }

  const handleCancelRequest = (requestId) => {
    const request = filteredRequests.find(req => req.id === requestId)
    if (request) {
      setRequestToCancel(request)
      setShowCancelModal(true)
    }
  }

  const handleConfirmCancel = async () => {
    if (!requestToCancel || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }

    try {
      // Update admin request status to cancelled
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === requestToCancel.id) {
          return {
            ...req,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'Admin',
            cancelReason: cancelReason.trim(),
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Update patient request with cancellation message
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const existingIndex = patientRequests.findIndex(req => req.id === requestToCancel.id)
      
      const cancelledRequestData = {
        id: requestToCancel.id,
        type: activeSection === 'pharmacy' ? 'pharmacy' : 'lab',
        providerName: 'Admin',
        providerId: 'admin',
        medicineName: activeSection === 'pharmacy' ? 'Prescription Medicines' : 'Lab Tests',
        status: 'cancelled',
        requestDate: requestToCancel.createdAt,
        responseDate: new Date().toISOString(),
        totalAmount: 0,
        message: `Your ${activeSection === 'pharmacy' ? 'medicine order' : 'lab test'} request has been cancelled. Reason: ${cancelReason.trim()}`,
        prescriptionId: requestToCancel.prescriptionId,
        patient: {
          name: requestToCancel.patientName,
          phone: requestToCancel.patientPhone,
          email: requestToCancel.patientEmail || 'patient@example.com',
          address: requestToCancel.patientAddress,
        },
        providerResponse: {
          message: `Your request has been cancelled. Reason: ${cancelReason.trim()}`,
          responseBy: 'Admin',
          responseTime: new Date().toISOString(),
        },
        doctor: {
          name: requestToCancel.prescription?.doctorName || 'Doctor',
          specialty: requestToCancel.prescription?.doctorSpecialty || 'Specialty',
        },
        prescription: requestToCancel.prescription,
        cancelReason: cancelReason.trim(),
      }

      if (existingIndex >= 0) {
        patientRequests[existingIndex] = cancelledRequestData
      } else {
        patientRequests.push(cancelledRequestData)
      }
      localStorage.setItem('patientRequests', JSON.stringify(patientRequests))

      // Close modal and reset
      setShowCancelModal(false)
      setCancelReason('')
      setRequestToCancel(null)
      setSelectedRequest(null)
      
      loadRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
    }
  }

  // Initialize medicines when request is selected
  useEffect(() => {
    if (selectedRequest) {
      // For pharmacy requests: Initialize with prescription medications
      if (activeSection === 'pharmacy' && selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0) {
      const initialMedicines = selectedRequest.prescription.medications.map((med, idx) => ({
        ...med,
          id: `med-${Date.now()}-${idx}`,
          price: '',
          quantity: '',
        available: true,
      }))
      setAdminMedicines(initialMedicines)
      setTotalAmount(0)
      setAdminResponse('')
      } 
      // For lab requests: Initialize with prescription investigations (tests will be shown in lab selection)
      else if (activeSection === 'lab' && selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0) {
        // Lab tests are handled in the lab selection section, but we clear medicines
        setAdminMedicines([])
        setTotalAmount(0)
        setAdminResponse('')
      } 
      else {
        setAdminMedicines([])
        setTotalAmount(0)
        setAdminResponse('')
      }
    } else {
      setAdminMedicines([])
      setTotalAmount(0)
      setAdminResponse('')
    }
  }, [selectedRequest, activeSection])

  // Calculate total amount when medicines change
  useEffect(() => {
    const total = adminMedicines.reduce((sum, med) => sum + ((med.price || 0) * (med.quantity || 0)), 0)
    setTotalAmount(total)
  }, [adminMedicines])

  // Add new medicine
  const handleAddMedicine = () => {
    const newMedicine = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      price: '',
      quantity: '',
      available: true,
    }
    setAdminMedicines([...adminMedicines, newMedicine])
  }

  // Add medicine from pharmacy
  const handleAddMedicineFromPharmacy = (pharmacyMed, pharmacyId, pharmacyName) => {
    // Check if medicine already added from this pharmacy
    const existingIndex = selectedMedicinesFromPharmacy.findIndex(
      med => med.medicine.name.toLowerCase() === pharmacyMed.name.toLowerCase() && 
             med.medicine.dosage === pharmacyMed.dosage &&
             med.pharmacyId === pharmacyId
    )
    
    if (existingIndex >= 0) {
      // Remove if already added
      setSelectedMedicinesFromPharmacy(selectedMedicinesFromPharmacy.filter((_, i) => i !== existingIndex))
      return
    }

    // Add new medicine with default quantity 1
    const newMedicine = {
      pharmacyId,
      pharmacyName,
      medicine: pharmacyMed,
      quantity: 1,
      price: parseFloat(pharmacyMed.price) || 0,
    }
    setSelectedMedicinesFromPharmacy([...selectedMedicinesFromPharmacy, newMedicine])
  }

  // Update medicine quantity
  const handleUpdateMedicineQuantity = (index, quantity) => {
    const updated = [...selectedMedicinesFromPharmacy]
    updated[index].quantity = Math.max(1, parseInt(quantity) || 1)
    setSelectedMedicinesFromPharmacy(updated)
  }

  // Add test from lab
  const handleAddTestFromLab = (labTest, labId, labName) => {
    // Check if test already added
    const existingIndex = selectedTestsFromLab.findIndex(
      test => test.test.name === labTest.name && test.labId === labId
    )
    
    if (existingIndex >= 0) {
      // Remove if already added
      setSelectedTestsFromLab(selectedTestsFromLab.filter((_, i) => i !== existingIndex))
      return
    }

    // Add new test - ensure price is properly converted to number
    const testPrice = typeof labTest.price === 'string' 
      ? parseFloat(labTest.price.replace(/[^0-9.]/g, '')) || 0
      : Number(labTest.price) || 0
    
    const newTest = {
      labId,
      labName,
      test: labTest,
      price: testPrice,
    }
    setSelectedTestsFromLab([...selectedTestsFromLab, newTest])
  }

  // Calculate total amount from selected medicines and tests
  useEffect(() => {
    const medicinesTotal = selectedMedicinesFromPharmacy.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      return sum + (quantity * price)
    }, 0)
    const testsTotal = selectedTestsFromLab.reduce((sum, item) => {
      const price = Number(item.price) || 0
      return sum + price
    }, 0)
    setTotalAmount(medicinesTotal + testsTotal)
  }, [selectedMedicinesFromPharmacy, selectedTestsFromLab])


  // Update medicine
  const handleUpdateMedicine = (medId, field, value) => {
    setAdminMedicines(adminMedicines.map(med => 
      med.id === medId ? { ...med, [field]: value } : med
    ))
  }

  // Remove medicine
  const handleRemoveMedicine = (medId) => {
    setAdminMedicines(adminMedicines.filter(med => med.id !== medId))
  }

  // Share to patient (when clicking Share button from card)
  const handleShareToPatient = async (request) => {
    if (!request || !request.adminResponse) {
      alert('Please configure the request first')
      return
    }

    try {
      // Update request status to confirmed (patient can now pay)
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === request.id) {
          return {
            ...req,
            status: 'confirmed',
            paymentPending: true,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Update patient request status
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const patientReqIndex = patientRequests.findIndex(req => req.id === request.id)
      if (patientReqIndex >= 0) {
        patientRequests[patientReqIndex] = {
          ...patientRequests[patientReqIndex],
          status: 'accepted',
          paymentPending: true,
          adminMedicines: request.adminResponse?.medicines || patientRequests[patientReqIndex].adminMedicines,
          totalAmount: request.adminResponse?.totalAmount || patientRequests[patientReqIndex].totalAmount,
        }
        localStorage.setItem('patientRequests', JSON.stringify(patientRequests))
      }

      // Update pharmacy/lab order status
      if (activeSection === 'pharmacy' && request.adminResponse.pharmacy?.id) {
        const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${request.adminResponse.pharmacy.id}`) || '[]')
        const orderIndex = pharmacyOrders.findIndex(order => order.requestId === request.id)
        if (orderIndex >= 0) {
          pharmacyOrders[orderIndex] = {
            ...pharmacyOrders[orderIndex],
            status: 'payment_pending',
          }
          localStorage.setItem(`pharmacyOrders_${request.adminResponse.pharmacy.id}`, JSON.stringify(pharmacyOrders))
        }
      } else if (activeSection === 'lab' && request.adminResponse.lab?.id) {
        const labOrders = JSON.parse(localStorage.getItem(`labOrders_${request.adminResponse.lab.id}`) || '[]')
        const orderIndex = labOrders.findIndex(order => order.requestId === request.id)
        if (orderIndex >= 0) {
          labOrders[orderIndex] = {
            ...labOrders[orderIndex],
            status: 'payment_pending',
          }
          localStorage.setItem(`labOrders_${request.adminResponse.lab.id}`, JSON.stringify(labOrders))
        }
      }

      alert('Request shared to patient successfully! Patient can now make payment.')
      loadRequests()
    } catch (error) {
      console.error('Error sharing to patient:', error)
      alert('Error sharing to patient. Please try again.')
    }
  }

  // Send response to patient
  const handleSendResponse = async () => {
      if (activeSection === 'pharmacy') {
        if (!selectedRequest || selectedPharmacies.length === 0) {
      alert('Please select a pharmacy first')
      return
    }
        if (selectedMedicinesFromPharmacy.length === 0) {
          alert('Please select at least one medicine')
      return
    }
      } else if (activeSection === 'lab') {
        if (!selectedRequest || selectedLabs.length === 0) {
          alert('Please select at least one lab first')
          return
        }
        if (selectedTestsFromLab.length === 0) {
          alert('Please select at least one test')
          return
        }
      }

    setIsSendingResponse(true)

    try {
      let adminResponseData = {}
      let patientRequest = {}
      let providerOrder = {}

      if (activeSection === 'pharmacy') {
        // For multiple pharmacies, use first pharmacy for response data
        const primaryPharmacy = selectedPharmacies[0]
        const pharmacyNames = selectedPharmacies.map(p => p.pharmacyName).join(', ')
        
        // Prepare medicines list for patient request
        const adminMedicinesList = selectedMedicinesFromPharmacy.map(item => ({
          name: item.medicine.name,
          dosage: item.medicine.dosage || '',
          manufacturer: item.medicine.manufacturer || '',
          quantity: item.quantity,
          price: item.price,
          pharmacyId: item.pharmacyId,
          pharmacyName: item.pharmacyName,
        }))
        
        adminResponseData = {
          message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
          pharmacies: selectedPharmacies.map(p => ({
            id: p.pharmacyId,
            name: p.pharmacyName,
            address: p.address,
            phone: p.phone,
            email: p.email,
          })),
          medicines: adminMedicinesList,
              totalAmount: totalAmount,
              respondedAt: new Date().toISOString(),
              respondedBy: 'Admin',
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'pharmacy',
          providerName: pharmacyNames, // All pharmacy names
          providerId: selectedPharmacies.map(p => p.pharmacyId).join(','), // All pharmacy IDs
          medicineName: 'Prescription Medicines',
          status: 'accepted',
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: totalAmount,
          adminMedicines: adminMedicinesList,
          message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
          prescriptionId: selectedRequest.prescriptionId,
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
            age: 32,
            gender: 'Male',
          },
          providerResponse: {
            message: adminResponse || `Pharmacy request accepted. Selected pharmacies: ${pharmacyNames}.`,
            responseBy: 'Admin',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
        }

        // Get prescription PDF URL from patient prescriptions if available
        let prescriptionPdfUrl = null
        try {
          if (selectedRequest.prescriptionId) {
            const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
            const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
            const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
            if (matchingPrescription?.pdfUrl) {
              prescriptionPdfUrl = matchingPrescription.pdfUrl
            }
          }
        } catch (error) {
          console.error('Error loading prescription PDF:', error)
        }

        // Send order to each selected pharmacy with their medicines
        selectedPharmacies.forEach((pharmacy) => {
          // Get medicines for this pharmacy
          const pharmacyMedicines = selectedMedicinesFromPharmacy
            .filter(item => item.pharmacyId === pharmacy.pharmacyId)
            .map(item => ({
              name: item.medicine.name,
              dosage: item.medicine.dosage || '',
              manufacturer: item.medicine.manufacturer || '',
              quantity: item.quantity,
              price: item.price,
            }))
          
          const pharmacyTotal = pharmacyMedicines.reduce((sum, med) => sum + (med.quantity * med.price), 0)
          
          providerOrder = {
            id: `order-${Date.now()}-${pharmacy.pharmacyId}`,
            requestId: selectedRequest.id,
            type: 'pharmacy',
            pharmacyId: pharmacy.pharmacyId,
            pharmacyName: pharmacy.pharmacyName,
            patient: {
              name: selectedRequest.patientName,
              phone: selectedRequest.patientPhone,
              email: selectedRequest.patientEmail || 'patient@example.com',
              address: selectedRequest.patientAddress,
            },
            medicines: pharmacyMedicines,
            totalAmount: pharmacyTotal,
            status: 'pending',
            createdAt: new Date().toISOString(),
            prescription: {
              ...selectedRequest.prescription,
              pdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Include prescription PDF URL
            },
            prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Also include at order level
          }

          // Save to pharmacy orders
          const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacy.pharmacyId}`) || '[]')
          pharmacyOrders.push(providerOrder)
          localStorage.setItem(`pharmacyOrders_${pharmacy.pharmacyId}`, JSON.stringify(pharmacyOrders))
        })

      } else if (activeSection === 'lab') {
        // For multiple labs, use first lab for response data
        const primaryLab = selectedLabs[0]
        const labNames = selectedLabs.map(l => l.labName).join(', ')
        
        // Use selected tests instead of prescription investigations
        const investigations = selectedTestsFromLab.map(item => ({
          name: item.test.name,
          price: item.price,
        }))
        const calculatedTotal = selectedTestsFromLab.reduce((sum, item) => sum + item.price, 0)

        adminResponseData = {
          message: adminResponse || `Lab tests are available. Selected laboratories: ${labNames}. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          labs: selectedLabs.map(l => ({
            id: l.labId,
            name: l.labName,
            address: l.address,
            phone: l.phone,
            email: l.email,
          })),
          investigations: investigations,
          totalAmount: calculatedTotal,
          respondedAt: new Date().toISOString(),
          respondedBy: 'Admin',
        }

        // Get prescription PDF URL from patient prescriptions if available
        let prescriptionPdfUrl = null
        try {
          if (selectedRequest.prescriptionId) {
            const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
            const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
            const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
            if (matchingPrescription?.pdfUrl) {
              prescriptionPdfUrl = matchingPrescription.pdfUrl
            }
          }
        } catch (error) {
          console.error('Error loading prescription PDF:', error)
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'lab',
          visitType: selectedRequest.visitType || 'lab', // Pass visitType to patient
          providerName: labNames, // All lab names
          providerId: selectedLabs.map(l => l.labId).join(','), // All lab IDs
          testName: 'Lab Test Request',
          status: 'accepted', // Payment pending
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: calculatedTotal,
          message: adminResponse || `Lab tests are available. Selected laboratories: ${labNames}. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          prescriptionId: selectedRequest.prescriptionId,
          prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Include prescription PDF URL
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
            age: 32,
            gender: 'Male',
          },
          providerResponse: {
            message: adminResponse || `All prescribed tests are available. We can schedule your visit. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
            responseBy: 'Healiinn Team',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
          investigations: investigations,
        }

        // Send order to each selected lab with their tests
        selectedLabs.forEach((lab) => {
          // Get tests for this lab
          const labTests = selectedTestsFromLab
            .filter(item => item.labId === lab.labId)
            .map(item => ({
              name: item.test.name,
              price: item.price,
            }))
          
          const labTotal = labTests.reduce((sum, test) => sum + test.price, 0)
          
          // Get prescription PDF URL from patient prescriptions if available
          let prescriptionPdfUrl = null
          try {
            if (selectedRequest.prescriptionId) {
              const patientPrescriptionsKey = `patientPrescriptions_${selectedRequest.patientId || 'pat-current'}`
              const patientPrescriptions = JSON.parse(localStorage.getItem(patientPrescriptionsKey) || '[]')
              const matchingPrescription = patientPrescriptions.find(p => p.id === selectedRequest.prescriptionId || p.consultationId === selectedRequest.prescriptionId)
              if (matchingPrescription?.pdfUrl) {
                prescriptionPdfUrl = matchingPrescription.pdfUrl
              }
            }
          } catch (error) {
            console.error('Error loading prescription PDF:', error)
          }

          providerOrder = {
            id: `order-${Date.now()}-${lab.labId}`,
            requestId: selectedRequest.id,
            type: 'lab',
            visitType: selectedRequest.visitType || 'lab', // Pass visitType to lab
            labId: lab.labId,
            labName: lab.labName,
            patient: {
              name: selectedRequest.patientName,
              phone: selectedRequest.patientPhone,
              email: selectedRequest.patientEmail || 'patient@example.com',
              address: selectedRequest.patientAddress,
            },
            investigations: labTests,
            totalAmount: labTotal,
            status: 'pending', // Lab needs to confirm
            createdAt: new Date().toISOString(),
            prescription: {
              ...selectedRequest.prescription,
              pdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Include prescription PDF URL
            },
            prescriptionPdfUrl: prescriptionPdfUrl || selectedRequest.prescriptionPdfUrl, // Also include at order level
          }

          // Save to lab orders
          const labOrders = JSON.parse(localStorage.getItem(`labOrders_${lab.labId}`) || '[]')
          labOrders.push(providerOrder)
          localStorage.setItem(`labOrders_${lab.labId}`, JSON.stringify(labOrders))
        })
      }

      // Update request with admin response - directly enable payment
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            status: 'confirmed',
            paymentPending: true,
            adminResponse: adminResponseData,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Update patient requests - find existing or create new - enable payment
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const existingIndex = patientRequests.findIndex(req => req.id === selectedRequest.id)
      if (existingIndex >= 0) {
        // Update existing request
        patientRequests[existingIndex] = {
          ...patientRequests[existingIndex],
          ...patientRequest,
          adminResponse: adminResponseData, // Include admin response with labs and investigations
          status: 'accepted',
          paymentPending: true, // Enable payment directly
        }
      } else {
        // Create new entry if doesn't exist
        patientRequests.push({
          ...patientRequest,
          adminResponse: adminResponseData, // Include admin response with labs and investigations
          paymentPending: true, // Enable payment directly
        })
      }
      localStorage.setItem('patientRequests', JSON.stringify(patientRequests))

      // Update pharmacy/lab orders to payment_pending status
      if (activeSection === 'pharmacy') {
        selectedPharmacies.forEach((pharmacy) => {
          const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacy.pharmacyId}`) || '[]')
          const orderIndex = pharmacyOrders.findIndex(order => order.requestId === selectedRequest.id)
          if (orderIndex >= 0) {
            pharmacyOrders[orderIndex] = {
              ...pharmacyOrders[orderIndex],
              status: 'payment_pending',
            }
            localStorage.setItem(`pharmacyOrders_${pharmacy.pharmacyId}`, JSON.stringify(pharmacyOrders))
          }
        })
      } else if (activeSection === 'lab' && selectedLabs.length > 0) {
        selectedLabs.forEach((lab) => {
          const labOrders = JSON.parse(localStorage.getItem(`labOrders_${lab.labId}`) || '[]')
          const orderIndex = labOrders.findIndex(order => order.requestId === selectedRequest.id)
          if (orderIndex >= 0) {
            labOrders[orderIndex] = {
              ...labOrders[orderIndex],
              status: 'payment_pending',
            }
            localStorage.setItem(`labOrders_${lab.labId}`, JSON.stringify(labOrders))
          }
        })
      }

      // Show success message
      // Response sent to patient and provider successfully
      
      // Close modal and reload
      setSelectedRequest(null)
      setShowPharmacyDropdown(false)
      setShowLabDropdown(false)
      setSelectedPharmacy(null)
      setSelectedLab(null)
      setSelectedPharmacies([])
      setSelectedLabs([])
      setAdminMedicines([])
      setAdminResponse('')
      setTotalAmount(0)
      setSelectedMedicinesFromPharmacy([])
      setSelectedTestsFromLab([])
      setExpandedPharmacyId(null)
      setExpandedPharmacySearch('')
      setExpandedLabId(null)
      setExpandedLabSearch('')
      setLabTestSearch('')
      loadRequests()
    } catch (error) {
      console.error('Error sending response:', error)
      // Error sending response
    } finally {
      setIsSendingResponse(false)
    }
  }

  const generatePDF = (request) => {
    // Convert request data to prescription format matching PatientPrescriptions
    const prescriptionData = {
      doctor: {
        name: request.prescription?.doctorName || 'Doctor',
        specialty: request.prescription?.doctorSpecialty || 'Specialty',
      },
      diagnosis: request.prescription?.diagnosis || 'N/A',
      medications: request.prescription?.medications || [],
      issuedAt: request.prescription?.issuedAt || new Date().toISOString().split('T')[0],
      status: 'active',
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Healiinn Prescription', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Doctor Name and Specialty (Centered)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescriptionData.doctor.name, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(prescriptionData.doctor.specialty, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${prescriptionData.doctor.name}`, margin, yPos)
    doc.text(`Specialty: ${prescriptionData.doctor.specialty}`, margin, yPos + 4)
    const issuedDate = formatDate(prescriptionData.issuedAt)
    doc.text(`Date: ${issuedDate}`, margin, yPos + 8)

    // Patient Info (Right)
    doc.text(`Name: ${request.patientName || 'N/A'}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Patient ID: ${request.patientId || 'N/A'}`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Issued: ${issuedDate}`, pageWidth - margin, yPos + 8, { align: 'right' })

    yPos += 15

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page (with more space check)
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Calculate card height based on instructions
        const hasInstructions = med.instructions && med.instructions.trim()
        let cardHeight = 22 // Base height
        
        // Calculate how many lines instructions will take (using right column width)
        if (hasInstructions) {
          doc.setFontSize(7)
          const rightColMaxWidth = (pageWidth - 2 * margin) / 2 - 5
          const instructionsLines = doc.splitTextToSize(med.instructions.trim(), rightColMaxWidth)
          // Add extra height for instructions (label + text lines)
          // Label takes 4 units, each line takes 4 units
          cardHeight += 4 + (instructionsLines.length * 4)
        }
        
        // Medication card with light gray background
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage || 'N/A'}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency || 'N/A'}`, rightColX, startY)
        
        // Instructions - displayed right below frequency in right column
        if (hasInstructions) {
          const instructionsText = med.instructions.trim()
          // Calculate max width for right column (half of page width minus margins)
          const rightColMaxWidth = (pageWidth - 2 * margin) / 2 - 5
          const instructionsLines = doc.splitTextToSize(instructionsText, rightColMaxWidth)
          
          // Instructions label (bold)
          doc.setFont('helvetica', 'bold')
          doc.text('Instructions:', rightColX, startY + 4)
          doc.setFont('helvetica', 'normal')
          
          // Instructions text (can wrap to multiple lines, right below label)
          instructionsLines.forEach((line, lineIdx) => {
            doc.text(line, rightColX, startY + 8 + (lineIdx * 4))
          })
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Footer with Doctor Signature (Right side)
    // Calculate space needed for signature - ensure everything fits on one page
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Draw a line for signature
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    
    // Doctor name and designation below signature (centered under signature area)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescriptionData.doctor.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(prescriptionData.doctor.specialty, signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    return doc
  }

  const handleDownloadPDF = (request) => {
    try {
      const doc = generatePDF(request)
      const fileName = `Prescription_${request.prescription?.doctorName?.replace(/\s+/g, '_') || 'Prescription'}_${request.prescription?.issuedAt || Date.now()}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const handleViewPDF = (request) => {
    try {
      const doc = generatePDF(request)
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 100)
    } catch (error) {
      console.error('Error viewing PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const currentRequests = activeSection === 'lab' ? labRequests : pharmacyRequests
  const filteredRequests = getFilteredRequests(currentRequests)

  // Debug: Log to console
  useEffect(() => {
    console.log('AdminRequests Component Loaded')
    console.log('Lab Requests:', labRequests.length)
    console.log('Pharmacy Requests:', pharmacyRequests.length)
    console.log('Active Section:', activeSection)
    console.log('Filtered Requests:', filteredRequests.length)
  }, [labRequests, pharmacyRequests, activeSection, filteredRequests])

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            Patient prescription requests for lab tests and pharmacy orders
          </p>
        </div>

        {/* Section Tabs - Lab and Pharmacy */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveSection('pharmacy')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === 'pharmacy'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeSection === 'pharmacy' ? { backgroundColor: '#11496c' } : {}}
          >
            <IoBagHandleOutline className="h-5 w-5" />
            Pharmacy ({pharmacyRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('lab')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeSection === 'lab'
                ? 'text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeSection === 'lab' ? { backgroundColor: '#11496c' } : {}}
          >
            <IoFlaskOutline className="h-5 w-5" />
            Lab ({labRequests.length})
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === tab.value
                  ? 'text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={filter === tab.value ? { backgroundColor: '#11496c' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            {activeSection === 'pharmacy' ? (
              <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-400" />
            ) : (
              <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
            )}
            <p className="mt-4 text-sm font-medium text-slate-600">No requests found</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeSection === 'pharmacy' 
                ? 'Medicine order requests from patients will appear here'
                : 'Lab test requests from patients will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }}
                />

                <div className="relative">
                  {/* Patient Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-slate-100 ${
                      activeSection === 'lab' 
                        ? 'bg-[rgba(17,73,108,0.1)]' 
                        : 'bg-[rgba(17,73,108,0.1)]'
                    }`}>
                      <IoPersonOutline className={`h-6 w-6 ${activeSection === 'lab' ? 'text-[#11496c]' : 'text-[#11496c]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {request.patientName || 'Patient'}
                      </h3>
                      <p className="text-xs text-[#11496c] truncate mt-0.5">
                        {request.prescription?.doctorName || 'Doctor'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {request.prescription?.doctorSpecialty || 'Specialty'}
                      </p>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{request.patientPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-700 line-clamp-1 text-[10px]">{request.patientAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        request.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : request.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : request.status === 'accepted' || request.status === 'admin_responded'
                          ? 'bg-blue-100 text-blue-700'
                          : request.status === 'completed' || request.status === 'confirmed' || request.paymentConfirmed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {request.status === 'pending' 
                        ? 'Pending' 
                        : request.status === 'cancelled'
                        ? request.cancelledBy === 'patient' ? 'Cancelled by Patient' : 'Cancelled'
                        : request.status === 'accepted' || request.status === 'admin_responded'
                        ? 'Accepted'
                        : request.status === 'completed' || request.status === 'confirmed' || request.paymentConfirmed
                        ? 'Payment Confirmed' 
                        : 'Active'}
                    </span>
                    {request.paymentConfirmed && request.paidAt && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-green-100 text-green-700">
                        Paid: {formatDate(request.paidAt)}
                      </span>
                    )}
                    {request.cancelledBy === 'patient' && (
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-red-100 text-red-700">
                        Patient Cancelled
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <IoCalendarOutline className="h-2.5 w-2.5" />
                      <span>{formatDate(request.prescription?.issuedAt)}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {request.prescription?.diagnosis && (
                    <div className="mb-2">
                      <p className="text-[9px] text-slate-600 mb-0.5">Diagnosis:</p>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {request.prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Medications/Investigations Count */}
                  {activeSection === 'pharmacy' && request.prescription?.medications && request.prescription.medications.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-[rgba(59,130,246,0.1)] px-2 py-0.5 border border-[rgba(59,130,246,0.2)] w-fit mb-2">
                      <IoBagHandleOutline className="h-3 w-3 text-blue-700" />
                      <span className="text-[10px] font-semibold text-blue-700">
                        {request.prescription.medications.length} {request.prescription.medications.length === 1 ? 'medicine' : 'medicines'}
                      </span>
                    </div>
                  )}
                  {activeSection === 'lab' && request.prescription?.investigations && request.prescription.investigations.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 border border-[rgba(17,73,108,0.2)] w-fit mb-2">
                      <IoFlaskOutline className="h-3 w-3 text-[#11496c]" />
                      <span className="text-[10px] font-semibold text-[#11496c]">
                        {request.prescription.investigations.length} {request.prescription.investigations.length === 1 ? 'test' : 'tests'}
                      </span>
                    </div>
                  )}

                  {/* Visit Type Badge for Lab Requests */}
                  {activeSection === 'lab' && request.visitType && (
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 border w-fit mb-2 ${
                      request.visitType === 'home'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      {request.visitType === 'home' ? (
                        <>
                          <IoHomeOutline className="h-3 w-3 text-emerald-700" />
                          <span className="text-[10px] font-semibold text-emerald-700">Home Collection</span>
                        </>
                      ) : (
                        <>
                          <IoBusinessOutline className="h-3 w-3 text-blue-700" />
                          <span className="text-[10px] font-semibold text-blue-700">Lab Visit</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Prescription Actions - Icons Only */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowPrescriptionModal(true)
                      }}
                        className="flex items-center justify-center rounded-lg bg-[#11496c] p-2 text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                        title="View"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(request)}
                        className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                        title="Download"
                    >
                      <IoDownloadOutline className="h-4 w-4" />
                    </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex items-center justify-center rounded-lg bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            title="Accept"
                          >
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(request.id)}
                            className="flex items-center justify-center rounded-lg bg-red-600 p-2 text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                            title="Cancel"
                          >
                            <IoCloseCircleOutline className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {request.status === 'accepted' && request.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                          className="flex items-center justify-center rounded-lg border border-[#11496c] bg-white p-2 text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                          title={activeSection === 'pharmacy' ? 'Add Medicines' : 'Select Lab'}
                        >
                          {activeSection === 'pharmacy' ? (
                            <IoBagHandleOutline className="h-4 w-4" />
                          ) : (
                            <IoFlaskOutline className="h-4 w-4" />
                          )}
                    </button>
                      )}
                      {request.status === 'cancelled' && (
                        <span className="text-[9px] font-semibold text-red-600 px-2 py-1 rounded bg-red-50">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Request Time */}
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <IoTimeOutline className="h-2.5 w-2.5" />
                      <span>Requested {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Prescription View Modal */}
      {showPrescriptionModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPrescriptionModal(false)
              setSelectedRequest(null)
            }
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Prescription</h2>
                <p className="text-sm text-slate-600">View prescription details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedRequest)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleViewPDF(selectedRequest)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <IoEyeOutline className="h-4 w-4" />
                  Open in New Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrescriptionModal(false)
                    setSelectedRequest(null)
                  }}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Prescription Content - PDF Viewer */}
            <div className="p-6">
              <div className="w-full h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                {(() => {
                  try {
                    const doc = generatePDF(selectedRequest)
                    const pdfBlob = doc.output('blob')
                    const pdfUrl = URL.createObjectURL(pdfBlob)
                    return (
                      <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full"
                        aria-label="Prescription PDF"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <IoDocumentTextOutline className="h-16 w-16 text-slate-400 mb-4" />
                          <p className="text-sm font-medium text-slate-600 mb-2">
                            PDF viewer not supported in your browser
                          </p>
                          <button
                            type="button"
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="flex items-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                          >
                            <IoEyeOutline className="h-4 w-4" />
                            Open PDF in New Tab
                          </button>
                        </div>
                      </object>
                    )
                  } catch (error) {
                    console.error('Error generating PDF:', error)
                    return (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <IoDocumentTextOutline className="h-16 w-16 text-slate-400 mb-4" />
                        <p className="text-sm font-medium text-slate-600">
                          Error loading prescription. Please try again.
                        </p>
                      </div>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && !showPrescriptionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedRequest(null)
              setShowPharmacyDropdown(false)
              setShowLabDropdown(false)
              setSelectedPharmacy(null)
              setSelectedLab(null)
              setSelectedPharmacies([])
              setSelectedLabs([])
              setAdminMedicines([])
              setAdminResponse('')
              setTotalAmount(0)
              setSelectedMedicinesFromPharmacy([])
              setSelectedTestsFromLab([])
              setExpandedPharmacyId(null)
              setExpandedPharmacySearch('')
              setExpandedLabId(null)
              setExpandedLabSearch('')
              setLabTestSearch('')
            }
          }}
        >
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Request Details</h2>
                <p className="text-xs text-slate-600">{activeSection === 'pharmacy' ? 'Medicine Order Request' : 'Lab Test Request'}</p>
              </div>
              <button
                type="button"
              onClick={() => {
                setSelectedRequest(null)
                setShowPharmacyDropdown(false)
                setShowLabDropdown(false)
                setSelectedPharmacy(null)
                setSelectedLab(null)
                setSelectedPharmacies([])
                setSelectedLabs([])
                setAdminMedicines([])
                setAdminResponse('')
                setTotalAmount(0)
                setSelectedMedicinesFromPharmacy([])
                setSelectedTestsFromLab([])
                setExpandedPharmacyId(null)
                setExpandedPharmacySearch('')
                setExpandedLabId(null)
                setExpandedLabSearch('')
                setLabTestSearch('')
              }}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Patient Information */}
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <IoPersonOutline className="h-3.5 w-3.5" />
                  Patient Information
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.patientName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Phone:</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.patientPhone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Address:</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%] text-[11px]">{selectedRequest.patientAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Prescription Details */}
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <IoDocumentTextOutline className="h-3.5 w-3.5" />
                  Prescription Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-600">Doctor:</span>
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedRequest.prescription?.doctorName || 'N/A'} - {selectedRequest.prescription?.doctorSpecialty || 'N/A'}
                    </p>
                  </div>
                  {selectedRequest.prescription?.diagnosis && (
                    <div>
                      <span className="text-[10px] text-slate-600">Diagnosis:</span>
                      <p className="text-xs font-semibold text-slate-900">{selectedRequest.prescription.diagnosis}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-600">Issued Date:</span>
                    <p className="text-xs font-semibold text-slate-900">{formatDate(selectedRequest.prescription?.issuedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDownloadOutline className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="View PDF"
                  >
                    <IoEyeOutline className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Prescription Medications - Show only for pharmacy requests */}
              {activeSection === 'pharmacy' && selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoBagHandleOutline className="h-3.5 w-3.5" />
                    Prescribed Medicines
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRequest.prescription.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-900">{med.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                          {med.frequency && <span>Frequency: {med.frequency}</span>}
                          {med.duration && <span>Duration: {med.duration}</span>}
                        </div>
                        {med.instructions && (
                          <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">Instructions: {med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescribed Lab Tests - Show for lab requests */}
              {activeSection === 'lab' && selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoFlaskOutline className="h-3.5 w-3.5" />
                    Prescribed Lab Tests
                    </h3>
                  <div className="space-y-1.5">
                    {selectedRequest.prescription.investigations.map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testNotes = typeof test === 'object' ? test.notes : null
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <p className="text-xs font-semibold text-slate-900">{testName}</p>
                          {testNotes && (
                            <p className="mt-1 text-[10px] text-slate-500 line-clamp-1">Notes: {testNotes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pharmacy Selection Dropdown - Only for pharmacy requests (not cancelled) */}
              {activeSection === 'pharmacy' && selectedRequest.status !== 'cancelled' && (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <IoBusinessOutline className="h-3.5 w-3.5" />
                  Select Pharmacy
                </h3>
                
                {/* Dropdown Button */}
                <div className="relative" ref={pharmacyDropdownRef}>
                    <button
                      type="button"
                    onClick={() => setShowPharmacyDropdown(!showPharmacyDropdown)}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-[#11496c] hover:bg-slate-50 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <IoBusinessOutline className="h-3.5 w-3.5 text-[#11496c]" />
                      <span className="truncate">
                        {selectedPharmacies.length === 0 
                          ? 'Select pharmacy(s)' 
                          : selectedPharmacies.length === 1
                          ? selectedPharmacies[0].pharmacyName
                          : `${selectedPharmacies.length} pharmacies selected`}
                      </span>
                    </span>
                    <IoChevronDownOutline 
                      className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${showPharmacyDropdown ? 'rotate-180' : ''}`} 
                    />
                    </button>

                  {/* Dropdown Menu */}
                  {showPharmacyDropdown && (
                    <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                      {pharmacies.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No pharmacies available
                        </div>
                      ) : (
                        <div className="p-1.5">
                          {pharmacies.map((pharmacy) => {
                            const isSelected = selectedPharmacies.some(p => p.pharmacyId === pharmacy.pharmacyId)
                            const isExpanded = expandedPharmacyId === pharmacy.pharmacyId
                            return (
                              <div
                                key={pharmacy.pharmacyId}
                                className={`rounded-lg border mb-1.5 transition ${
                                  isSelected
                                    ? 'border-[#11496c] bg-blue-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {/* Pharmacy Header - Clickable for selection */}
                                <div 
                                  className="flex items-start justify-between p-2.5 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isSelected) {
                                      setSelectedPharmacies(selectedPharmacies.filter(p => p.pharmacyId !== pharmacy.pharmacyId))
                                    } else {
                                      setSelectedPharmacies([...selectedPharmacies, pharmacy])
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // Handled by parent onClick
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c] cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-xs font-semibold text-slate-900 mb-0.5 truncate">
                                        {pharmacy.pharmacyName}
                                      </h4>
                                      {pharmacy.rating && (
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <div className="flex items-center gap-0.5">
                                            {renderStars(pharmacy.rating)}
                                          </div>
                                          <span className="text-[10px] font-semibold text-slate-700">
                                            {pharmacy.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                  </div>

                                {/* Pharmacy Details */}
                                <div className="px-2.5 pb-2.5 space-y-1 text-[10px] text-slate-600">
                                  {pharmacy.address && (
                                    <div className="flex items-start gap-1">
                                      <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                      <span className="flex-1 line-clamp-1">{pharmacy.address}</span>
                                    </div>
                                  )}
                                  {pharmacy.phone && (
                                    <div className="flex items-center gap-1">
                                      <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span>{pharmacy.phone}</span>
                                    </div>
                                  )}
                                  {pharmacy.medicines && pharmacy.medicines.length > 0 && (
                                    <div 
                                      className="flex items-center justify-between pt-1.5 border-t border-slate-200 cursor-pointer hover:bg-slate-50 -mx-2.5 px-2.5 py-1 rounded"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const newExpandedId = isExpanded ? null : pharmacy.pharmacyId
                                        setExpandedPharmacyId(newExpandedId)
                                        if (!newExpandedId) {
                                          setExpandedPharmacySearch('') // Clear search when collapsing
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-1">
                                        <IoBagHandleOutline className="h-3 w-3 text-blue-600 shrink-0" />
                                        <span className="font-semibold text-blue-700">
                                          {pharmacy.medicines.length} {pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'}
                                        </span>
                                      </div>
                                      <IoChevronDownOutline 
                                        className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Expanded Medicines List */}
                                {isExpanded && pharmacy.medicines && pharmacy.medicines.length > 0 && (
                                  <div className="px-2.5 pb-2.5 border-t border-slate-200 bg-slate-50">
                                    {/* Search Input for Medicines */}
                                    <div className="mt-2 mb-2">
                                      <div className="relative">
                                        <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                            <input
                              type="text"
                                          value={expandedPharmacyId === pharmacy.pharmacyId ? expandedPharmacySearch : ''}
                                          onChange={(e) => {
                                            if (expandedPharmacyId === pharmacy.pharmacyId) {
                                              setExpandedPharmacySearch(e.target.value)
                                            }
                                          }}
                                          placeholder="Search medicine name, dosage..."
                                          className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1.5 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                                          onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                                    </div>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                      {pharmacy.medicines
                                        .filter((med) => {
                                          if (expandedPharmacyId !== pharmacy.pharmacyId || !expandedPharmacySearch) return true
                                          const searchTerm = expandedPharmacySearch.toLowerCase()
                                          return (
                                            med.name?.toLowerCase().includes(searchTerm) ||
                                            med.dosage?.toLowerCase().includes(searchTerm) ||
                                            med.name?.toLowerCase().includes(searchTerm)
                                          )
                                        })
                                        .map((med, idx) => {
                                          const isSelected = selectedMedicinesFromPharmacy.some(
                                            item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                     item.medicine.dosage === med.dosage &&
                                                     item.pharmacyId === pharmacy.pharmacyId
                                          )
                                          const selectedItem = selectedMedicinesFromPharmacy.find(
                                            item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                     item.medicine.dosage === med.dosage &&
                                                     item.pharmacyId === pharmacy.pharmacyId
                                          )
                                          
                                          return (
                                            <div 
                                              key={idx}
                                              className={`rounded border p-2 text-[10px] transition ${
                                                isSelected 
                                                  ? 'border-[#11496c] bg-blue-50' 
                                                  : 'border-slate-200 bg-white hover:border-slate-300'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 mb-1">
                          <button
                            type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAddMedicineFromPharmacy(med, pharmacy.pharmacyId, pharmacy.pharmacyName)
                                                      }}
                                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                                        isSelected
                                                          ? 'border-[#11496c] bg-[#11496c] text-white'
                                                          : 'border-slate-300 bg-white text-slate-600 hover:border-[#11496c] hover:text-[#11496c]'
                                                      }`}
                                                    >
                                                      {isSelected ? (
                                                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                                                      ) : (
                                                        <IoAddOutline className="h-3 w-3" />
                                                      )}
                          </button>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="font-semibold text-slate-900">
                                                        {med.name}
                                                      </p>
                                                      {med.dosage && (
                                                        <p className="text-slate-600 text-[9px]">
                                                          Dosage: {med.dosage}
                                                        </p>
                                                      )}
                        </div>
                        </div>
                                                  <div className="flex items-center gap-3 text-slate-600 ml-6">
                                                    {med.quantity && (
                                                      <span>Available: {med.quantity} tablets</span>
                                                    )}
                                                    {med.price && (
                                                      <span className="font-semibold text-[#11496c]">
                                                        ₹{med.price} per tablet
                                                      </span>
                                                    )}
                                                  </div>
                                                  {isSelected && selectedItem && (
                                                    <div className="mt-1.5 ml-6 flex items-center gap-2">
                                                      <label className="text-[9px] font-medium text-slate-700">
                                                        Quantity (Tablets):
                                                      </label>
                          <input
                            type="number"
                            min="1"
                                                        max={med.quantity || 999}
                                                        value={selectedItem.quantity}
                                                        onChange={(e) => {
                                                          const index = selectedMedicinesFromPharmacy.findIndex(
                                                            item => item.medicine.name.toLowerCase() === med.name.toLowerCase() &&
                                                                     item.medicine.dosage === med.dosage &&
                                                                     item.pharmacyId === pharmacy.pharmacyId
                                                          )
                                                          if (index >= 0) {
                                                            handleUpdateMedicineQuantity(index, e.target.value)
                                                          }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-16 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#11496c]"
                                                      />
                                                      <span className="text-[9px] font-semibold text-[#11496c]">
                                                        = ₹{(selectedItem.quantity * selectedItem.price).toFixed(2)}
                                                      </span>
                          </div>
                                                  )}
                        </div>
                      </div>
                                            </div>
                                          )
                                        })}
                                      {pharmacy.medicines.filter((med) => {
                                        if (expandedPharmacyId !== pharmacy.pharmacyId || !expandedPharmacySearch) return true
                                        const searchTerm = expandedPharmacySearch.toLowerCase()
                                        return (
                                          med.name?.toLowerCase().includes(searchTerm) ||
                                          med.dosage?.toLowerCase().includes(searchTerm)
                                        )
                                      }).length === 0 && expandedPharmacySearch && (
                                        <div className="text-center py-3 text-[10px] text-slate-500">
                                          No medicines found matching "{expandedPharmacySearch}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      </div>
                    )}
                  </div>

                {/* Selected Medicines Summary */}
                {selectedMedicinesFromPharmacy.length > 0 && (
                  <div className="mt-3 rounded-lg border-2 border-[#11496c] bg-blue-50 p-2.5">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <IoBagHandleOutline className="h-3.5 w-3.5" />
                      Selected Medicines
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedMedicinesFromPharmacy.map((item, idx) => (
                        <div key={idx} className="rounded border border-blue-200 bg-white p-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900">
                                {item.medicine.name} ({item.medicine.dosage})
                              </p>
                              <p className="text-slate-600">
                                {item.pharmacyName} • Qty: {item.quantity} tablets
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#11496c]">
                                ₹{(item.quantity * item.price).toFixed(2)}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMedicinesFromPharmacy(selectedMedicinesFromPharmacy.filter((_, i) => i !== idx))
                                }}
                                className="mt-0.5 text-red-600 hover:text-red-700"
                                title="Remove"
                              >
                                <IoTrashOutline className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Total Amount:</span>
                      <span className="text-sm font-bold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Lab Selection Dropdown - Only for lab requests (not cancelled) */}
              {activeSection === 'lab' && selectedRequest.status !== 'cancelled' && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoFlaskOutline className="h-3.5 w-3.5" />
                    Select Laboratory
                </h3>
                
                {/* Dropdown Button */}
                  <div className="relative" ref={labDropdownRef}>
                  <button
                    type="button"
                      onClick={() => setShowLabDropdown(!showLabDropdown)}
                      className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-[#11496c] hover:bg-slate-50 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c]" />
                        <span className="truncate">
                          {selectedLabs.length > 0 
                            ? `${selectedLabs.length} ${selectedLabs.length === 1 ? 'laboratory' : 'laboratories'} selected`
                            : 'Select a laboratory'}
                        </span>
                    </span>
                    <IoChevronDownOutline 
                        className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${showLabDropdown ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                    {showLabDropdown && (
                      <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                        {labs.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No laboratories available
                        </div>
                      ) : (
                          <div className="p-1.5">
                            {labs.map((lab) => {
                              const isSelected = selectedLabs.some(l => l.labId === lab.labId)
                              const isExpanded = expandedLabId === lab.labId
                              
                              return (
                                <div
                                  key={lab.labId}
                                  className={`rounded-lg border mb-1.5 transition ${
                                    isSelected
                                  ? 'border-[#11496c] bg-blue-50'
                                      : 'border-slate-200 bg-white hover:border-slate-300'
                                  }`}
                                >
                                  {/* Lab Header */}
                                  <div className="p-2.5">
                                    <div className="flex items-start justify-between mb-1.5">
                                      <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            if (isSelected) {
                                              setSelectedLabs(selectedLabs.filter(l => l.labId !== lab.labId))
                                            } else {
                                              setSelectedLabs([...selectedLabs, lab])
                                            }
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c] cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-xs font-semibold text-slate-900 mb-0.5 truncate">
                                            {lab.labName}
                                  </h4>
                                          {lab.rating && (
                                            <div className="flex items-center gap-1 mb-0.5">
                                      <div className="flex items-center gap-0.5">
                                                {renderStars(lab.rating)}
                                      </div>
                                              <span className="text-[10px] font-semibold text-slate-700">
                                                {lab.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                      </div>
                              </div>

                                    {/* Lab Details */}
                                    <div className="space-y-1 text-[10px] text-slate-600">
                                      {lab.address && (
                                        <div className="flex items-start gap-1">
                                          <IoLocationOutline className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                          <span className="flex-1 line-clamp-1">{lab.address}</span>
                                  </div>
                                )}
                                      {lab.phone && (
                                        <div className="flex items-center gap-1">
                                          <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                                          <span>{lab.phone}</span>
                                  </div>
                                )}
                                      {lab.tests && lab.tests.length > 0 && (
                                        <div 
                                          className="flex items-center justify-between pt-1.5 border-t border-slate-200 cursor-pointer hover:bg-slate-50 -mx-2.5 px-2.5 py-1 rounded"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const newExpandedId = isExpanded ? null : lab.labId
                                            setExpandedLabId(newExpandedId)
                                            if (!newExpandedId) {
                                              setExpandedLabSearch('') // Clear search when collapsing
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-1">
                                            <IoFlaskOutline className="h-3 w-3 text-blue-600 shrink-0" />
                                    <span className="font-semibold text-blue-700">
                                              {lab.tests.length} {lab.tests.length === 1 ? 'test' : 'tests'}
                                    </span>
                                          </div>
                                          <IoChevronDownOutline 
                                            className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                          />
                                  </div>
                                )}
                                    </div>
                                  </div>

                                  {/* Expanded Tests Section */}
                                  {isExpanded && lab.tests && lab.tests.length > 0 && (
                                    <div className="border-t border-slate-200 bg-slate-50 p-2">
                                      {/* Search Input */}
                                      <div className="mb-2">
                                        <div className="relative">
                                          <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                                          <input
                                            type="text"
                                            value={expandedLabId === lab.labId ? expandedLabSearch : ''}
                                            onChange={(e) => {
                                              if (expandedLabId === lab.labId) {
                                                setExpandedLabSearch(e.target.value)
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Search test name..."
                                            className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                                          />
                                        </div>
                                      </div>

                                      {/* Tests List */}
                                      <div className="space-y-1 max-h-48 overflow-y-auto">
                                        {lab.tests.filter((test) => {
                                          if (expandedLabId !== lab.labId || !expandedLabSearch) return true
                                          const searchTerm = expandedLabSearch.toLowerCase()
                                          return test.name?.toLowerCase().includes(searchTerm)
                                        }).map((test, idx) => {
                                          const isTestSelected = selectedTestsFromLab.some(
                                            item => item.test.name === test.name && item.labId === lab.labId
                                          )
                                          
                                          return (
                                            <div 
                                              key={idx}
                                              className={`rounded border p-2 text-[10px] transition ${
                                                isTestSelected 
                                                  ? 'border-[#11496c] bg-blue-50' 
                                                  : 'border-slate-200 bg-white hover:border-slate-300'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 mb-1">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAddTestFromLab(test, lab.labId, lab.labName)
                                                      }}
                                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                                        isTestSelected
                                                          ? 'border-[#11496c] bg-[#11496c] text-white'
                                                          : 'border-slate-300 bg-white text-slate-600 hover:border-[#11496c] hover:text-[#11496c]'
                                                      }`}
                                                    >
                                                      {isTestSelected ? (
                                                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                                                      ) : (
                                                        <IoAddOutline className="h-3 w-3" />
                                                      )}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="font-semibold text-slate-900">
                                                        {test.name}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-3 text-slate-600 ml-6">
                                                    {test.price && (
                                                      <span className="font-semibold text-[#11496c]">
                                                        ₹{test.price}
                                  </span>
                                                    )}
                                </div>
                              </div>
                            </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                      {lab.tests.filter((test) => {
                                        if (expandedLabId !== lab.labId || !expandedLabSearch) return true
                                        const searchTerm = expandedLabSearch.toLowerCase()
                                        return test.name?.toLowerCase().includes(searchTerm)
                                      }).length === 0 && expandedLabSearch && (
                                        <div className="text-center py-3 text-[10px] text-slate-500">
                                          No tests found matching "{expandedLabSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Tests Summary */}
                  {selectedTestsFromLab.length > 0 && (
                    <div className="mt-3 rounded-lg border-2 border-[#11496c] bg-blue-50 p-2.5">
                      <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                        <IoFlaskOutline className="h-3.5 w-3.5" />
                        Selected Tests
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedTestsFromLab.map((item, idx) => (
                          <div key={idx} className="rounded border border-blue-200 bg-white p-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {item.test.name}
                                </p>
                                <p className="text-slate-600">
                                  {item.labName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#11496c]">
                                  ₹{(Number(item.price) || 0).toFixed(2)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTestsFromLab(selectedTestsFromLab.filter((_, i) => i !== idx))
                                  }}
                                  className="mt-0.5 text-red-600 hover:text-red-700"
                                  title="Remove"
                                >
                                  <IoTrashOutline className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Total Amount:</span>
                        <span className="text-sm font-bold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Response Message - Only show if status is pending */}
              {selectedRequest.status === 'pending' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <IoDocumentTextOutline className="h-4 w-4" />
                    Response Message
                  </h3>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter response message for patient (optional)..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                  />
                </div>
              )}

              {/* Admin Response Display - If already responded */}
              {selectedRequest.status === 'admin_responded' && selectedRequest.adminResponse && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCheckmarkCircleOutline className="h-3.5 w-3.5 text-green-600" />
                    Response Sent
                  </h3>
                  <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.adminResponse.message}</p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    <p>Total Amount: ₹{selectedRequest.adminResponse.totalAmount || 0}</p>
                    {selectedRequest.adminResponse.pharmacies && selectedRequest.adminResponse.pharmacies.length > 0 && (
                      <p>Pharmacies: {selectedRequest.adminResponse.pharmacies.map(p => p.name).join(', ')}</p>
                    )}
                    {selectedRequest.adminResponse.pharmacy?.name && (
                      <p>Pharmacy: {selectedRequest.adminResponse.pharmacy.name}</p>
                    )}
                    {selectedRequest.adminResponse.lab?.name && (
                      <p>Lab: {selectedRequest.adminResponse.lab.name}</p>
                    )}
                    <p>Sent: {formatDate(selectedRequest.adminResponse.respondedAt)}</p>
                  </div>
                </div>
              )}

              {/* Payment Confirmation Display */}
              {selectedRequest.paymentConfirmed && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCheckmarkCircleOutline className="h-3.5 w-3.5 text-emerald-600" />
                    Payment Confirmed
                  </h3>
                  <p className="text-xs text-slate-700 mb-1.5">
                    {selectedRequest.confirmationMessage || `Payment confirmed! Order has been created for patient ${selectedRequest.patientName || 'Patient'}.`}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    {selectedRequest.paidAt && (
                      <p>Paid At: {formatDate(selectedRequest.paidAt)}</p>
                    )}
                    <p>Total Amount: ₹{selectedRequest.adminResponse?.totalAmount || selectedRequest.totalAmount || 0}</p>
                  </div>
                </div>
              )}

              {/* Cancellation Display */}
              {selectedRequest.status === 'cancelled' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoCloseCircleOutline className="h-3.5 w-3.5 text-red-600" />
                    {selectedRequest.cancelledBy === 'patient' ? 'Cancelled by Patient' : 'Cancelled'}
                  </h3>
                  {selectedRequest.cancelReason && (
                    <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.cancelReason}</p>
                  )}
                  {selectedRequest.cancellationMessage && (
                    <p className="text-xs text-slate-700 mb-1.5">{selectedRequest.cancellationMessage}</p>
                  )}
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600">
                    {selectedRequest.cancelledAt && (
                      <p>Cancelled At: {formatDate(selectedRequest.cancelledAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Response Message - Only show if status is pending */}
              {selectedRequest.status === 'pending' && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <IoChatbubbleOutline className="h-3.5 w-3.5" />
                    Admin Response Message
                  </h3>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter your response message to the patient..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null)
                    setShowPharmacyDropdown(false)
                    setShowLabDropdown(false)
                    setSelectedPharmacy(null)
                    setSelectedLab(null)
                    setSelectedPharmacies([])
                    setSelectedLabs([])
                    setAdminMedicines([])
                    setAdminResponse('')
                    setTotalAmount(0)
                    setSelectedMedicinesFromPharmacy([])
                    setSelectedTestsFromLab([])
                    setExpandedPharmacyId(null)
                    setExpandedPharmacySearch('')
                    setExpandedLabId(null)
                    setExpandedLabSearch('')
                    setLabTestSearch('')
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedRequest.status !== 'cancelled' && selectedRequest.status !== 'confirmed' && !selectedRequest.paymentConfirmed && (
                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={
                      isSendingResponse || 
                      (activeSection === 'pharmacy' && (selectedPharmacies.length === 0 || selectedMedicinesFromPharmacy.length === 0)) ||
                      (activeSection === 'lab' && (selectedLabs.length === 0 || selectedTestsFromLab.length === 0))
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingResponse ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                        Send
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && requestToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCancelModal(false)
              setCancelReason('')
              setRequestToCancel(null)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cancel Request</h2>
                <p className="text-xs text-slate-600">Please provide a reason for cancellation</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setRequestToCancel(null)
                }}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancelling this request..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] resize-none"
                />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">Patient:</p>
                <p className="text-xs text-slate-900">{requestToCancel.patientName || 'N/A'}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2 mb-1">Doctor:</p>
                <p className="text-xs text-slate-900">{requestToCancel.prescription?.doctorName || 'N/A'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelReason('')
                  setRequestToCancel(null)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoCloseCircleOutline className="h-3.5 w-3.5" />
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequests

