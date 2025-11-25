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
  const [showPharmacyDropdown, setShowPharmacyDropdown] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const pharmacyDropdownRef = useRef(null)
  const [adminMedicines, setAdminMedicines] = useState([]) // Medicines added by admin
  const [adminResponse, setAdminResponse] = useState('') // Admin's response message
  const [totalAmount, setTotalAmount] = useState(0) // Total amount calculated from medicines
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  useEffect(() => {
    loadRequests()
    loadPharmacies()
    // Refresh every 2 seconds to get new requests
    const interval = setInterval(() => {
      loadRequests()
      loadPharmacies()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPharmacyDropdown && pharmacyDropdownRef.current && !pharmacyDropdownRef.current.contains(event.target)) {
        setShowPharmacyDropdown(false)
      }
    }
    if (showPharmacyDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPharmacyDropdown])

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

  // Send response to patient
  const handleSendResponse = async () => {
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

    setIsSendingResponse(true)

    try {
      // Update request with admin response
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map((req) => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            status: 'admin_responded',
            adminResponse: {
              message: adminResponse || `Medicines are available. Total amount: ₹${totalAmount}. Please confirm and proceed with payment.`,
              medicines: adminMedicines,
              pharmacy: {
                id: selectedPharmacy.pharmacyId,
                name: selectedPharmacy.pharmacyName,
                address: selectedPharmacy.address,
                phone: selectedPharmacy.phone,
                email: selectedPharmacy.email,
              },
              totalAmount: totalAmount,
              respondedAt: new Date().toISOString(),
              respondedBy: 'Admin',
            },
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))

      // Send to patient requests
      const patientRequest = {
        id: selectedRequest.id,
        type: 'pharmacy',
        providerName: selectedPharmacy.pharmacyName,
        providerId: selectedPharmacy.pharmacyId,
        medicineName: 'Prescription Medicines',
        status: 'accepted', // Payment pending
        requestDate: selectedRequest.createdAt,
        responseDate: new Date().toISOString(),
        totalAmount: totalAmount,
        message: adminResponse || `Medicines are available. Total amount: ₹${totalAmount}. Please confirm and proceed with payment.`,
        prescriptionId: selectedRequest.prescriptionId,
        patient: {
          name: selectedRequest.patientName,
          phone: selectedRequest.patientPhone,
          email: selectedRequest.patientEmail || 'patient@example.com',
          address: selectedRequest.patientAddress,
          age: 32, // Default, in real app get from patient profile
          gender: 'Male', // Default
        },
        providerResponse: {
          message: adminResponse || `All prescribed medicines are available in stock. We can deliver to your address. Total amount: ₹${totalAmount}. Please confirm and proceed with payment.`,
          responseBy: selectedPharmacy.pharmacyName + ' Team',
          responseTime: new Date().toISOString(),
        },
        doctor: {
          name: selectedRequest.prescription?.doctorName || 'Doctor',
          specialty: selectedRequest.prescription?.doctorSpecialty || 'Specialty',
          phone: '+91 98765 43210',
        },
        adminMedicines: adminMedicines, // Medicines added by admin
      }

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
      alert('Response sent to patient successfully!')
      
      // Close modal and reload
      setSelectedRequest(null)
      setShowPharmacyDropdown(false)
      setSelectedPharmacy(null)
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }}
                />

                <div className="relative">
                  {/* Patient Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-2 ring-slate-100 ${
                      activeSection === 'lab' 
                        ? 'bg-[rgba(17,73,108,0.1)]' 
                        : 'bg-[rgba(17,73,108,0.1)]'
                    }`}>
                      <IoPersonOutline className={`h-8 w-8 ${activeSection === 'lab' ? 'text-[#11496c]' : 'text-[#11496c]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {request.patientName || 'Patient'}
                      </h3>
                      <p className="text-sm text-[#11496c] truncate">
                        {request.prescription?.doctorName || 'Doctor'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {request.prescription?.doctorSpecialty || 'Specialty'}
                      </p>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{request.patientPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <IoLocationOutline className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-700 line-clamp-2">{request.patientAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        request.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : request.status === 'completed' || request.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {request.status === 'pending' ? 'Pending' : request.status === 'completed' || request.status === 'confirmed' ? 'Completed' : 'Active'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <IoCalendarOutline className="h-3 w-3" />
                      <span>Issued {formatDate(request.prescription?.issuedAt)}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {request.prescription?.diagnosis && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-600 mb-1">Diagnosis:</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {request.prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Medications/Investigations Count */}
                  {activeSection === 'pharmacy' && request.prescription?.medications && request.prescription.medications.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-[rgba(59,130,246,0.1)] px-2.5 py-1 border border-[rgba(59,130,246,0.2)] w-fit mb-3">
                      <IoBagHandleOutline className="h-3.5 w-3.5 text-blue-700" />
                      <span className="text-xs font-semibold text-blue-700">
                        {request.prescription.medications.length} {request.prescription.medications.length === 1 ? 'medicine' : 'medicines'}
                      </span>
                    </div>
                  )}
                  {activeSection === 'lab' && request.prescription?.investigations && request.prescription.investigations.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-[rgba(17,73,108,0.1)] px-2.5 py-1 border border-[rgba(17,73,108,0.2)] w-fit mb-3">
                      <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c]" />
                      <span className="text-xs font-semibold text-[#11496c]">
                        {request.prescription.investigations.length} {request.prescription.investigations.length === 1 ? 'test' : 'tests'}
                      </span>
                    </div>
                  )}

                  {/* Prescription Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowPrescriptionModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(request)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      <IoDownloadOutline className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#11496c] bg-white px-3 py-2 text-xs font-semibold text-[#11496c] transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                    >
                      {activeSection === 'pharmacy' ? 'Add Medicines' : 'Respond'}
                    </button>
                  </div>

                  {/* Request Time */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <IoTimeOutline className="h-3 w-3" />
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
              setSelectedPharmacy(null)
            }
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Request Details</h2>
                <p className="text-sm text-slate-600">Medicine Order Request</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null)
                  setShowPharmacyDropdown(false)
                  setSelectedPharmacy(null)
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
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
                    <span className="font-semibold text-slate-900 text-right max-w-[60%]">{selectedRequest.patientAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Prescription Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IoDocumentTextOutline className="h-4 w-4" />
                  Prescription Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-600">Doctor:</span>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedRequest.prescription?.doctorName || 'N/A'} - {selectedRequest.prescription?.doctorSpecialty || 'N/A'}
                    </p>
                  </div>
                  {selectedRequest.prescription?.diagnosis && (
                    <div>
                      <span className="text-xs text-slate-600">Diagnosis:</span>
                      <p className="text-sm font-semibold text-slate-900">{selectedRequest.prescription.diagnosis}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-600">Issued Date:</span>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(selectedRequest.prescription?.issuedAt)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="View PDF"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Prescription Medications */}
              {selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <IoBagHandleOutline className="h-4 w-4" />
                    Prescribed Medicines
                  </h3>
                  <div className="space-y-2">
                    {selectedRequest.prescription.medications.map((med, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{med.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                          {med.frequency && <span>Frequency: {med.frequency}</span>}
                          {med.duration && <span>Duration: {med.duration}</span>}
                        </div>
                        {med.instructions && (
                          <p className="mt-1 text-xs text-slate-500">Instructions: {med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Medicines Section - Only show if status is pending */}
              {selectedRequest.status === 'pending' && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <IoBagHandleOutline className="h-4 w-4" />
                      Add Medicines & Prices
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="flex items-center gap-1 rounded-lg bg-[#11496c] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0d3a52]"
                    >
                      <IoAddOutline className="h-3 w-3" />
                      Add Medicine
                    </button>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {adminMedicines.map((med, idx) => (
                      <div key={med.id} className="rounded-lg border border-blue-300 bg-white p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                              placeholder="Medicine name"
                              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(med.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                          >
                            <IoTrashOutline className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(med.id, 'dosage', e.target.value)}
                            placeholder="Dosage"
                            className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                            placeholder="Frequency"
                            className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={med.quantity}
                            onChange={(e) => handleUpdateMedicine(med.id, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                            min="1"
                            className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <input
                            type="number"
                            value={med.price}
                            onChange={(e) => handleUpdateMedicine(med.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Price (₹)"
                            min="0"
                            step="0.01"
                            className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11496c]"
                          />
                          <div className="flex items-center justify-center rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700">
                            Total: ₹{((med.price || 0) * (med.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {adminMedicines.length === 0 && (
                      <div className="text-center py-4 text-sm text-slate-500">
                        Click "Add Medicine" to add medicines
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  {adminMedicines.length > 0 && (
                    <div className="mt-4 rounded-lg border-2 border-[#11496c] bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">Total Amount:</span>
                        <span className="text-lg font-bold text-[#11496c]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pharmacy Selection Dropdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <IoBusinessOutline className="h-4 w-4" />
                  Select Pharmacy
                </h3>
                
                {/* Dropdown Button */}
                <div className="relative" ref={pharmacyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPharmacyDropdown(!showPharmacyDropdown)}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-[#11496c] hover:bg-slate-50 transition"
                  >
                    <span className="flex items-center gap-2">
                      <IoBusinessOutline className="h-4 w-4 text-[#11496c]" />
                      {selectedPharmacy ? selectedPharmacy.pharmacyName : 'Select a pharmacy'}
                    </span>
                    <IoChevronDownOutline 
                      className={`h-4 w-4 text-slate-500 transition-transform ${showPharmacyDropdown ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showPharmacyDropdown && (
                    <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                      {pharmacies.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No pharmacies available
                        </div>
                      ) : (
                        <div className="p-2">
                          {pharmacies.map((pharmacy) => (
                            <div
                              key={pharmacy.pharmacyId}
                              onClick={() => {
                                setSelectedPharmacy(pharmacy)
                                setShowPharmacyDropdown(false)
                              }}
                              className={`rounded-lg border p-4 mb-2 cursor-pointer transition ${
                                selectedPharmacy?.pharmacyId === pharmacy.pharmacyId
                                  ? 'border-[#11496c] bg-blue-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {/* Pharmacy Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                                    {pharmacy.pharmacyName}
                                  </h4>
                                  {pharmacy.rating && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div className="flex items-center gap-0.5">
                                        {renderStars(pharmacy.rating)}
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700">
                                        {pharmacy.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {selectedPharmacy?.pharmacyId === pharmacy.pharmacyId && (
                                  <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                                )}
                              </div>

                              {/* Pharmacy Details */}
                              <div className="space-y-1.5 text-xs text-slate-600">
                                {pharmacy.address && (
                                  <div className="flex items-start gap-1.5">
                                    <IoLocationOutline className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="flex-1">{pharmacy.address}</span>
                                  </div>
                                )}
                                {pharmacy.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <IoCallOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{pharmacy.phone}</span>
                                  </div>
                                )}
                                {pharmacy.email && (
                                  <div className="flex items-center gap-1.5">
                                    <IoMailOutline className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{pharmacy.email}</span>
                                  </div>
                                )}
                                {pharmacy.medicines && pharmacy.medicines.length > 0 && (
                                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                                    <IoBagHandleOutline className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                    <span className="font-semibold text-blue-700">
                                      {pharmacy.medicines.length} {pharmacy.medicines.length === 1 ? 'medicine' : 'medicines'} available
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      pharmacy.status === 'approved' && pharmacy.isActive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {pharmacy.status === 'approved' && pharmacy.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
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
                  <div className="mt-4 rounded-lg border border-[#11496c] bg-blue-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Selected: {selectedPharmacy.pharmacyName}
                    </h4>
                    <div className="space-y-2 text-xs">
                      {selectedPharmacy.address && (
                        <p className="flex items-start gap-2">
                          <IoLocationOutline className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                          <span className="text-slate-700">{selectedPharmacy.address}</span>
                        </p>
                      )}
                      {selectedPharmacy.phone && (
                        <p className="flex items-center gap-2">
                          <IoCallOutline className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="text-slate-700">{selectedPharmacy.phone}</span>
                        </p>
                      )}
                      {selectedPharmacy.email && (
                        <p className="flex items-center gap-2">
                          <IoMailOutline className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="text-slate-700">{selectedPharmacy.email}</span>
                        </p>
                      )}
                      {selectedPharmacy.medicines && selectedPharmacy.medicines.length > 0 && (
                        <div className="pt-2 border-t border-blue-200">
                          <p className="font-semibold text-blue-900 mb-2">
                            Available Medicines ({selectedPharmacy.medicines.length})
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedPharmacy.medicines.map((med, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                                <span className="font-medium text-slate-900">
                                  {med.name} {med.dosage && `(${med.dosage})`}
                                </span>
                                <span className="text-slate-600">
                                  Qty: {med.quantity} | ₹{med.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <IoCheckmarkCircleOutline className="h-4 w-4 text-green-600" />
                    Response Sent
                  </h3>
                  <p className="text-sm text-slate-700 mb-2">{selectedRequest.adminResponse.message}</p>
                  <div className="mt-2 text-xs text-slate-600">
                    <p>Total Amount: ₹{selectedRequest.adminResponse.totalAmount}</p>
                    <p>Pharmacy: {selectedRequest.adminResponse.pharmacy?.name}</p>
                    <p>Sent: {formatDate(selectedRequest.adminResponse.respondedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null)
                    setShowPharmacyDropdown(false)
                    setSelectedPharmacy(null)
                    setAdminMedicines([])
                    setAdminResponse('')
                    setTotalAmount(0)
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedRequest.status === 'pending' && (
                  <button
                    type="button"
                    onClick={handleSendResponse}
                    disabled={isSendingResponse || !selectedPharmacy || adminMedicines.length === 0 || totalAmount <= 0}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingResponse ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <IoCheckmarkCircleOutline className="h-4 w-4" />
                        Send Response to Patient
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequests

