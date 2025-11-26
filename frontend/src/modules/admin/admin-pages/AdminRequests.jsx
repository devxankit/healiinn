import { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoShareSocialOutline,
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
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [selectedLab, setSelectedLab] = useState(null)
  const pharmacyDropdownRef = useRef(null)
  const labDropdownRef = useRef(null)
  const [adminMedicines, setAdminMedicines] = useState([]) // Medicines added by admin
  const [adminResponse, setAdminResponse] = useState('') // Admin's response message
  const [totalAmount, setTotalAmount] = useState(0) // Total amount calculated from medicines
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [pharmacyMedicineSearch, setPharmacyMedicineSearch] = useState('') // Search term for pharmacy medicines
  const [labTestSearch, setLabTestSearch] = useState('') // Search term for lab tests
  const [showCancelModal, setShowCancelModal] = useState(false) // Show cancel reason modal
  const [cancelReason, setCancelReason] = useState('') // Cancel reason text
  const [requestToCancel, setRequestToCancel] = useState(null) // Request to cancel

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
        providerName: 'Admin',
        providerId: 'admin',
        medicineName: activeSection === 'pharmacy' ? 'Prescription Medicines' : 'Lab Tests',
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
        },
        providerResponse: {
          message: `Your request has been accepted. Admin will add ${activeSection === 'pharmacy' ? 'medicines' : 'test details'} shortly.`,
          responseBy: 'Admin',
          responseTime: new Date().toISOString(),
        },
        doctor: {
          name: request.prescription?.doctorName || 'Doctor',
          specialty: request.prescription?.doctorSpecialty || 'Specialty',
        },
        prescription: request.prescription,
      }

      if (existingIndex >= 0) {
        patientRequests[existingIndex] = patientRequestData
      } else {
        patientRequests.push(patientRequestData)
      }
      localStorage.setItem('patientRequests', JSON.stringify(patientRequests))

      // Set selected request to show Add Medicine button
      setSelectedRequest({ ...request, status: 'accepted' })
      
      alert('Request accepted! Patient has been notified. You can now add medicines/select lab.')
      loadRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Error accepting request. Please try again.')
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
      
      alert('Request cancelled successfully! Patient has been notified.')
      loadRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Error cancelling request. Please try again.')
    }
  }

  // Initialize medicines when request is selected
  useEffect(() => {
    if (selectedRequest && selectedRequest.prescription?.medications) {
      // Initialize with prescription medications, add price and quantity fields
      const initialMedicines = selectedRequest.prescription.medications.map((med, idx) => ({
        ...med,
        id: `med-${idx}`,
        price: 0,
        quantity: 1,
        available: true,
      }))
      setAdminMedicines(initialMedicines)
      setTotalAmount(0)
      setAdminResponse('')
    } else {
      setAdminMedicines([])
      setTotalAmount(0)
      setAdminResponse('')
    }
  }, [selectedRequest])

  // Calculate total amount when medicines change
  useEffect(() => {
    const total = adminMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0)
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
      price: 0,
      quantity: 1,
      available: true,
    }
    setAdminMedicines([...adminMedicines, newMedicine])
  }

  // Add medicine from pharmacy
  const handleAddMedicineFromPharmacy = (pharmacyMed) => {
    // Check if medicine already added
    const alreadyAdded = adminMedicines.some(med => 
      med.name.toLowerCase() === pharmacyMed.name.toLowerCase() && 
      med.dosage === pharmacyMed.dosage
    )
    
    if (alreadyAdded) {
      // Remove if already added
      setAdminMedicines(adminMedicines.filter(med => 
        !(med.name.toLowerCase() === pharmacyMed.name.toLowerCase() && med.dosage === pharmacyMed.dosage)
      ))
      return
    }

    const newMedicine = {
      id: `med-${Date.now()}`,
      name: pharmacyMed.name,
      dosage: pharmacyMed.dosage || '',
      frequency: '',
      duration: '',
      instructions: '',
      price: pharmacyMed.price || 0,
      quantity: 1,
      available: true,
    }
    setAdminMedicines([...adminMedicines, newMedicine])
    setPharmacyMedicineSearch('') // Clear search after adding
  }

  // Add test from lab
  const handleAddTestFromLab = (labTest) => {
    // For lab, we don't add to medicines, but we'll handle it in the response
    // This is just for UI consistency
    setLabTestSearch('')
  }

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
      if (!selectedRequest || !selectedPharmacy) {
        alert('Please select a pharmacy first')
        return
      }

      if (adminMedicines.length === 0) {
        alert('Please add at least one medicine')
        return
      }

      if (totalAmount <= 0) {
        alert('Please set prices for medicines')
        return
      }
    } else if (activeSection === 'lab') {
      if (!selectedRequest || !selectedLab) {
        alert('Please select a lab first')
        return
      }
    }

    setIsSendingResponse(true)

    try {
      let adminResponseData = {}
      let patientRequest = {}
      let providerOrder = {}

      if (activeSection === 'pharmacy') {
        // Calculate total amount for pharmacy
        const calculatedTotal = adminMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0)
        
        adminResponseData = {
          message: adminResponse || `Medicines are available. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          medicines: adminMedicines,
          pharmacy: {
            id: selectedPharmacy.pharmacyId,
            name: selectedPharmacy.pharmacyName,
            address: selectedPharmacy.address,
            phone: selectedPharmacy.phone,
            email: selectedPharmacy.email,
          },
          totalAmount: calculatedTotal,
          respondedAt: new Date().toISOString(),
          respondedBy: 'Admin',
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'pharmacy',
          providerName: selectedPharmacy.pharmacyName,
          providerId: selectedPharmacy.pharmacyId,
          medicineName: 'Prescription Medicines',
          status: 'accepted', // Payment pending
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: calculatedTotal,
          message: adminResponse || `Medicines are available. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
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
            message: adminResponse || `All prescribed medicines are available in stock. We can deliver to your address. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
            responseBy: selectedPharmacy.pharmacyName + ' Team',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
          adminMedicines: adminMedicines,
        }

        // Send order to pharmacy
        providerOrder = {
          id: `order-${Date.now()}`,
          requestId: selectedRequest.id,
          type: 'pharmacy',
          pharmacyId: selectedPharmacy.pharmacyId,
          pharmacyName: selectedPharmacy.pharmacyName,
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
          },
          medicines: adminMedicines,
          totalAmount: calculatedTotal,
          status: 'pending', // Pharmacy needs to confirm
          createdAt: new Date().toISOString(),
          prescription: selectedRequest.prescription,
        }

        // Save to pharmacy orders
        const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${selectedPharmacy.pharmacyId}`) || '[]')
        pharmacyOrders.push(providerOrder)
        localStorage.setItem(`pharmacyOrders_${selectedPharmacy.pharmacyId}`, JSON.stringify(pharmacyOrders))

      } else if (activeSection === 'lab') {
        // Calculate total for lab tests
        const investigations = selectedRequest.prescription?.investigations || []
        const calculatedTotal = investigations.reduce((sum, inv) => {
          const test = selectedLab.tests?.find(t => t.name === inv.name)
          return sum + (test?.price || 0)
        }, 0)

        adminResponseData = {
          message: adminResponse || `Lab tests are available. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
          lab: {
            id: selectedLab.labId,
            name: selectedLab.labName,
            address: selectedLab.address,
            phone: selectedLab.phone,
            email: selectedLab.email,
          },
          investigations: investigations,
          totalAmount: calculatedTotal,
          respondedAt: new Date().toISOString(),
          respondedBy: 'Admin',
        }

        patientRequest = {
          id: selectedRequest.id,
          type: 'lab',
          providerName: selectedLab.labName,
          providerId: selectedLab.labId,
          testName: 'Prescription Tests',
          status: 'accepted', // Payment pending
          requestDate: selectedRequest.createdAt,
          responseDate: new Date().toISOString(),
          totalAmount: calculatedTotal,
          message: adminResponse || `Lab tests are available. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
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
            message: adminResponse || `All prescribed tests are available. We can schedule your visit. Total amount: ₹${calculatedTotal}. Please confirm and proceed with payment.`,
            responseBy: selectedLab.labName + ' Team',
            responseTime: new Date().toISOString(),
          },
          doctor: {
            name: selectedRequest.prescription?.doctorName || 'Doctor',
            specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
            phone: '+91 98765 43210',
          },
          investigations: investigations,
        }

        // Send order to lab
        providerOrder = {
          id: `order-${Date.now()}`,
          requestId: selectedRequest.id,
          type: 'lab',
          labId: selectedLab.labId,
          labName: selectedLab.labName,
          patient: {
            name: selectedRequest.patientName,
            phone: selectedRequest.patientPhone,
            email: selectedRequest.patientEmail || 'patient@example.com',
            address: selectedRequest.patientAddress,
          },
          investigations: investigations,
          totalAmount: calculatedTotal,
          status: 'pending', // Lab needs to confirm
          createdAt: new Date().toISOString(),
          prescription: selectedRequest.prescription,
        }

        // Save to lab orders
        const labOrders = JSON.parse(localStorage.getItem(`labOrders_${selectedLab.labId}`) || '[]')
        labOrders.push(providerOrder)
        localStorage.setItem(`labOrders_${selectedLab.labId}`, JSON.stringify(labOrders))
      }

      // Update request with admin response
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            status: 'admin_responded',
            adminResponse: adminResponseData,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Save to patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const existingIndex = patientRequests.findIndex(req => req.id === selectedRequest.id)
      if (existingIndex >= 0) {
        patientRequests[existingIndex] = patientRequest
      } else {
        patientRequests.push(patientRequest)
      }
      localStorage.setItem('patientRequests', JSON.stringify(patientRequests))

      // Show success message
      alert(`Response sent to patient and ${activeSection === 'pharmacy' ? 'pharmacy' : 'lab'} successfully!`)
      
      // Close modal and reload
      setSelectedRequest(null)
      setShowPharmacyDropdown(false)
      setShowLabDropdown(false)
      setSelectedPharmacy(null)
      setSelectedLab(null)
      setAdminMedicines([])
      setAdminResponse('')
      setTotalAmount(0)
      loadRequests()
    } catch (error) {
      console.error('Error sending response:', error)
      alert('Error sending response. Please try again.')
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
                          : request.status === 'accepted'
                          ? 'bg-blue-100 text-blue-700'
                          : request.status === 'completed' || request.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {request.status === 'pending' 
                        ? 'Pending' 
                        : request.status === 'cancelled'
                        ? 'Cancelled'
                        : request.status === 'accepted'
                        ? 'Accepted'
                        : request.status === 'completed' || request.status === 'confirmed' 
                        ? 'Completed' 
                        : 'Active'}
                    </span>
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
                      {/* Share Button - Only show if status is admin_responded */}
                      {request.status === 'admin_responded' && (
                        <button
                          type="button"
                          onClick={async () => {
                            // Set the request and trigger share
                            setSelectedRequest(request)
                            // Load the medicines/pharmacy/lab from the response
                            if (request.adminResponse) {
                              if (activeSection === 'pharmacy' && request.adminResponse.medicines) {
                                setAdminMedicines(request.adminResponse.medicines)
                                // Find and set selected pharmacy
                                const pharm = pharmacies.find(p => p.pharmacyId === request.adminResponse.pharmacy?.id)
                                if (pharm) setSelectedPharmacy(pharm)
                              } else if (activeSection === 'lab') {
                                // Find and set selected lab
                                const lab = labs.find(l => l.labId === request.adminResponse.lab?.id)
                                if (lab) setSelectedLab(lab)
                              }
                            }
                            // Trigger share (send to patient)
                            await handleShareToPatient(request)
                          }}
                          className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                          title="Share to Patient"
                        >
                          <IoShareSocialOutline className="h-4 w-4" />
                        </button>
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

              {/* Prescription Medications */}
              {selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0 && (
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

              {/* Admin Medicines Section - Only show if status is accepted or pending and pharmacy request (not cancelled) */}
              {(selectedRequest.status === 'accepted' || selectedRequest.status === 'pending') && selectedRequest.status !== 'cancelled' && activeSection === 'pharmacy' && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <IoBagHandleOutline className="h-3.5 w-3.5" />
                      Add Medicines & Prices
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="flex items-center gap-1 rounded-lg bg-[#11496c] px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-[#0d3a52]"
                    >
                      <IoAddOutline className="h-3 w-3" />
                      Add
                    </button>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {adminMedicines.map((med, idx) => (
                      <div key={med.id} className="rounded-lg border border-blue-300 bg-white p-2">
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                              placeholder="Medicine name"
                              className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(med.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                          >
                            <IoTrashOutline className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(med.id, 'dosage', e.target.value)}
                            placeholder="Dosage"
                            className="rounded border border-slate-300 px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                            placeholder="Frequency"
                            className="rounded border border-slate-300 px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="number"
                            value={med.quantity}
                            onChange={(e) => handleUpdateMedicine(med.id, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                            min="1"
                            className="rounded border border-slate-300 px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <input
                            type="number"
                            value={med.price}
                            onChange={(e) => handleUpdateMedicine(med.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Price (₹)"
                            min="0"
                            step="0.01"
                            className="rounded border border-slate-300 px-1.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <div className="flex items-center justify-center rounded border border-slate-300 bg-slate-50 px-1.5 py-1 text-[10px] font-semibold text-slate-700">
                            ₹{((med.price || 0) * (med.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {adminMedicines.length === 0 && (
                      <div className="text-center py-3 text-xs text-slate-500">
                        Click "Add" to add medicines
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  {adminMedicines.length > 0 && (
                    <div className="mt-3 rounded-lg border-2 border-[#11496c] bg-white p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Total Amount:</span>
                        <span className="text-base font-bold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
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
                      <span className="truncate">{selectedPharmacy ? selectedPharmacy.pharmacyName : 'Select a pharmacy'}</span>
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
                          {pharmacies.map((pharmacy) => (
                            <div
                              key={pharmacy.pharmacyId}
                              onClick={() => {
                                setSelectedPharmacy(pharmacy)
                                setShowPharmacyDropdown(false)
                              }}
                              className={`rounded-lg border p-2.5 mb-1.5 cursor-pointer transition ${
                                selectedPharmacy?.pharmacyId === pharmacy.pharmacyId
                                  ? 'border-[#11496c] bg-blue-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {/* Pharmacy Header */}
                              <div className="flex items-start justify-between mb-1.5">
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
                                {selectedPharmacy?.pharmacyId === pharmacy.pharmacyId && (
                                  <IoCheckmarkCircleOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                                )}
                              </div>

                              {/* Pharmacy Details */}
                              <div className="space-y-1 text-[10px] text-slate-600">
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
                                  <div className="flex items-center gap-1 pt-0.5 border-t border-slate-200">
                                    <IoBagHandleOutline className="h-3 w-3 text-blue-600 shrink-0" />
                                    <span className="font-semibold text-blue-700">
                                      {pharmacy.medicines.length} {pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Pharmacy Details */}
                {selectedPharmacy && (
                  <div className="mt-3 rounded-lg border border-[#11496c] bg-blue-50 p-2.5">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">
                      Selected: {selectedPharmacy.pharmacyName}
                    </h4>
                    <div className="space-y-1.5 text-[10px]">
                      {selectedPharmacy.address && (
                        <p className="flex items-start gap-1.5">
                          <IoLocationOutline className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700 line-clamp-1">{selectedPharmacy.address}</span>
                        </p>
                      )}
                      {selectedPharmacy.phone && (
                        <p className="flex items-center gap-1.5">
                          <IoCallOutline className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="text-slate-700">{selectedPharmacy.phone}</span>
                        </p>
                      )}
                      {selectedPharmacy.medicines && selectedPharmacy.medicines.length > 0 && (
                        <div className="pt-1.5 border-t border-blue-200">
                          <p className="font-semibold text-blue-900 mb-1.5 text-[10px]">
                            Search Medicines ({selectedPharmacy.medicines.length})
                          </p>
                          {/* Search Input */}
                          <div className="mb-1.5">
                            <div className="relative">
                              <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                              <input
                                type="text"
                                value={pharmacyMedicineSearch}
                                onChange={(e) => setPharmacyMedicineSearch(e.target.value)}
                                placeholder="Search medicine name..."
                                className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                              />
                            </div>
                          </div>
                          {/* Filtered Medicines List */}
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedPharmacy.medicines
                              .filter(med => 
                                !pharmacyMedicineSearch || 
                                med.name.toLowerCase().includes(pharmacyMedicineSearch.toLowerCase()) ||
                                (med.dosage && med.dosage.toLowerCase().includes(pharmacyMedicineSearch.toLowerCase()))
                              )
                              .map((med, idx) => {
                                const isAlreadyAdded = adminMedicines.some(adminMed => 
                                  adminMed.name.toLowerCase() === med.name.toLowerCase() && 
                                  adminMed.dosage === med.dosage
                                )
                                return (
                                  <div key={idx} className={`flex items-center justify-between gap-1.5 text-[10px] bg-white rounded px-1.5 py-1 ${
                                    isAlreadyAdded ? 'border border-emerald-500 bg-emerald-50' : ''
                                  }`}>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-slate-900 truncate block">
                                        {med.name} {med.dosage && `(${med.dosage})`}
                                      </span>
                                      <span className="text-slate-600 text-[9px]">
                                        Qty: {med.quantity} | ₹{med.price}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAddMedicineFromPharmacy(med)}
                                      className={`flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-semibold transition shrink-0 ${
                                        isAlreadyAdded
                                          ? 'bg-red-600 text-white hover:bg-red-700'
                                          : 'bg-[#11496c] text-white hover:bg-[#0d3a52]'
                                      }`}
                                      title={isAlreadyAdded ? 'Remove medicine' : 'Add medicine'}
                                    >
                                      {isAlreadyAdded ? (
                                        <>
                                          <IoCloseCircleOutline className="h-2.5 w-2.5 mr-0.5" />
                                          Remove
                                        </>
                                      ) : (
                                        <>
                                          <IoAddOutline className="h-2.5 w-2.5 mr-0.5" />
                                          Add
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )
                              })}
                            {selectedPharmacy.medicines.filter(med => 
                              !pharmacyMedicineSearch || 
                              med.name.toLowerCase().includes(pharmacyMedicineSearch.toLowerCase()) ||
                              (med.dosage && med.dosage.toLowerCase().includes(pharmacyMedicineSearch.toLowerCase()))
                            ).length === 0 && (
                              <div className="text-center py-2 text-[9px] text-slate-500">
                                {pharmacyMedicineSearch ? 'No medicines found' : 'No medicines available'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                      <span className="truncate">{selectedLab ? selectedLab.labName : 'Select a laboratory'}</span>
                    </span>
                    <IoChevronDownOutline 
                      className={`h-3.5 w-3.5 text-slate-500 transition-transform shrink-0 ${showLabDropdown ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showLabDropdown && (
                    <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                      {labs.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No laboratories available
                        </div>
                      ) : (
                        <div className="p-1.5">
                          {labs.map((lab) => (
                            <div
                              key={lab.labId}
                              onClick={() => {
                                setSelectedLab(lab)
                                setShowLabDropdown(false)
                              }}
                              className={`rounded-lg border p-2.5 mb-1.5 cursor-pointer transition ${
                                selectedLab?.labId === lab.labId
                                  ? 'border-[#11496c] bg-blue-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {/* Lab Header */}
                              <div className="flex items-start justify-between mb-1.5">
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
                                {selectedLab?.labId === lab.labId && (
                                  <IoCheckmarkCircleOutline className="h-4 w-4 text-[#11496c] shrink-0" />
                                )}
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
                                  <div className="flex items-center gap-1 pt-0.5 border-t border-slate-200">
                                    <IoFlaskOutline className="h-3 w-3 text-[#11496c] shrink-0" />
                                    <span className="font-semibold text-[#11496c]">
                                      {lab.tests.length} {lab.tests.length === 1 ? 'test' : 'tests'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Lab Details */}
                {selectedLab && (
                  <div className="mt-3 rounded-lg border border-[#11496c] bg-blue-50 p-2.5">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">
                      Selected: {selectedLab.labName}
                    </h4>
                    <div className="space-y-1.5 text-[10px]">
                      {selectedLab.address && (
                        <p className="flex items-start gap-1.5">
                          <IoLocationOutline className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700 line-clamp-1">{selectedLab.address}</span>
                        </p>
                      )}
                      {selectedLab.phone && (
                        <p className="flex items-center gap-1.5">
                          <IoCallOutline className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="text-slate-700">{selectedLab.phone}</span>
                        </p>
                      )}
                      {selectedLab.tests && selectedLab.tests.length > 0 && (
                        <div className="pt-1.5 border-t border-blue-200">
                          <p className="font-semibold text-[#11496c] mb-1.5 text-[10px]">
                            Search Tests ({selectedLab.tests.length})
                          </p>
                          {/* Search Input */}
                          <div className="mb-1.5">
                            <div className="relative">
                              <IoSearchOutline className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                              <input
                                type="text"
                                value={labTestSearch}
                                onChange={(e) => setLabTestSearch(e.target.value)}
                                placeholder="Search test name..."
                                className="w-full rounded border border-slate-300 bg-white pl-7 pr-2 py-1 text-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                              />
                            </div>
                          </div>
                          {/* Filtered Tests List */}
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedLab.tests
                              .filter(test => 
                                !labTestSearch || 
                                test.name.toLowerCase().includes(labTestSearch.toLowerCase())
                              )
                              .map((test, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-1.5 text-[10px] bg-white rounded px-1.5 py-1">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-slate-900 truncate block">
                                      {test.name}
                                    </span>
                                    <span className="text-slate-600 text-[9px]">
                                      ₹{test.price}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            {selectedLab.tests.filter(test => 
                              !labTestSearch || 
                              test.name.toLowerCase().includes(labTestSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="text-center py-2 text-[9px] text-slate-500">
                                {labTestSearch ? 'No tests found' : 'No tests available'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                    <p>Total Amount: ₹{selectedRequest.adminResponse.totalAmount}</p>
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
                    setAdminMedicines([])
                    setAdminResponse('')
                    setTotalAmount(0)
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && selectedRequest.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={
                      isSendingResponse || 
                      (activeSection === 'pharmacy' && (!selectedPharmacy || adminMedicines.length === 0 || totalAmount <= 0)) ||
                      (activeSection === 'lab' && !selectedLab)
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
                        Send Response
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

