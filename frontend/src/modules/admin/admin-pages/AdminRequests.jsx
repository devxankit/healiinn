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
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [pharmacies, setPharmacies] = useState([])
  const [showPharmacyDropdown, setShowPharmacyDropdown] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const pharmacyDropdownRef = useRef(null)

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
      // Filter only medicine order requests
      const medicineRequests = allRequests.filter((req) => req.type === 'order_medicine')
      // Sort by creation date (newest first)
      medicineRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setRequests(medicineRequests)
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests([])
    }
  }

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true
    return req.status === filter
  })

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

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Request</h1>
          <p className="mt-1 text-sm text-slate-600">
            Patient medicine order requests from prescriptions
          </p>
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
            <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">No requests found</p>
            <p className="mt-1 text-xs text-slate-500">
              Medicine order requests from patients will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }}
                />

                <div className="relative">
                  {/* Patient Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[rgba(17,73,108,0.1)] ring-2 ring-slate-100">
                      <IoPersonOutline className="h-8 w-8 text-[#11496c]" />
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

                  {/* Status Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        request.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : request.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {request.status === 'pending' ? 'Pending' : request.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <IoCalendarOutline className="h-3 w-3" />
                      <span>Issued {formatDate(request.prescription?.issuedAt)}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {request.prescription?.diagnosis && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {request.prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Medications Count */}
                  {request.prescription?.medications && request.prescription.medications.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-[rgba(59,130,246,0.1)] px-2.5 py-1 border border-[rgba(59,130,246,0.2)] w-fit">
                      <IoBagHandleOutline className="h-3.5 w-3.5 text-blue-700" />
                      <span className="text-xs font-semibold text-blue-700">
                        {request.prescription.medications.length} {request.prescription.medications.length === 1 ? 'medicine' : 'medicines'}
                      </span>
                    </div>
                  )}

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

      {/* Request Details Modal */}
      {selectedRequest && (
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
              {/* Prescription PDF Actions */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <IoDocumentTextOutline className="h-4 w-4" />
                  Prescription PDF
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    aria-label="View PDF"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                  </button>
                </div>
              </div>

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
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRequests

