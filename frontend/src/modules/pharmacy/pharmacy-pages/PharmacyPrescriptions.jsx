import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import { getPharmacyPrescriptions } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoCalendarOutline,
  IoSearchOutline,
  IoExpandOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoPersonCircleOutline,
  IoTimeOutline,
  IoHomeOutline,
  IoEyeOutline,
} from 'react-icons/io5'

// Mock data removed - using API data now

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

const PharmacyPrescriptions = () => {
  const toast = useToast()
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPharmacyPrescriptions({ search: searchTerm, limit: 100 })
        
        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data.items) 
            ? response.data.items 
            : response.data.prescriptions || []
          
          // Transform backend data to frontend format
          const transformed = prescriptionsData.map((presc, index) => ({
            id: presc._id || presc.id || `presc-${index}`,
            doctor: {
              name: presc.doctorId?.firstName && presc.doctorId?.lastName
                ? `Dr. ${presc.doctorId.firstName} ${presc.doctorId.lastName}`
                : presc.doctorId?.name || 'Unknown Doctor',
              specialty: presc.doctorId?.specialization || 'General Physician',
              image: presc.doctorId?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(presc.doctorId?.firstName || 'Doctor')}&background=3b82f6&color=fff&size=128`,
              phone: presc.doctorId?.phone || '',
              email: presc.doctorId?.email || '',
            },
            patient: {
              name: presc.patientId?.firstName && presc.patientId?.lastName
                ? `${presc.patientId.firstName} ${presc.patientId.lastName}`
                : presc.patientId?.name || 'Unknown Patient',
              age: presc.patientId?.age || presc.patientId?.dateOfBirth 
                ? Math.floor((new Date() - new Date(presc.patientId.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : 0,
              gender: presc.patientId?.gender || '',
              phone: presc.patientId?.phone || '',
              email: presc.patientId?.email || '',
              address: presc.patientId?.address || {
                line1: '',
                line2: '',
                city: '',
                state: '',
                postalCode: '',
              },
            },
            clinic: {
              name: presc.clinicName || presc.clinic?.name || 'Clinic',
              address: presc.clinicAddress || presc.clinic?.address || '',
              phone: presc.clinicPhone || presc.clinic?.phone || '',
              email: presc.clinicEmail || presc.clinic?.email || '',
            },
            issuedAt: presc.createdAt || presc.issuedAt || new Date().toISOString(),
            diagnosis: presc.diagnosis || presc.consultationId?.diagnosis || 'N/A',
            symptoms: presc.symptoms || [],
            medications: Array.isArray(presc.medications) 
              ? presc.medications.map((med, idx) => ({
                  id: idx + 1,
                  name: med.name || '',
                  strength: med.strength || '',
                  dosage: med.dosage || '',
                  frequency: med.frequency || '',
                  duration: med.duration || '',
                  instructions: med.instructions || '',
                }))
              : [],
            recommendedTests: Array.isArray(presc.recommendedTests)
              ? presc.recommendedTests.map((test) => ({
                  name: test.name || test,
                  instructions: test.instructions || '',
                }))
              : [],
            medicalAdvice: presc.medicalAdvice || presc.notes ? [presc.notes].filter(Boolean) : [],
            followUpAt: presc.followUpDate || presc.followUpAt || null,
            pdfUrl: presc.pdfUrl || '#',
          }))
          
          setPrescriptions(transformed)
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err)
        setError(err.message || 'Failed to load prescriptions')
        toast.error('Failed to load prescriptions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const filteredPrescriptions = prescriptions.filter((presc) => {
    if (!searchTerm.trim()) return true
    const search = searchTerm.toLowerCase()
    return (
      presc.doctor.name.toLowerCase().includes(search) ||
      presc.doctor.specialty.toLowerCase().includes(search) ||
      presc.patient.name.toLowerCase().includes(search) ||
      presc.diagnosis.toLowerCase().includes(search) ||
      presc.clinic.name.toLowerCase().includes(search)
    )
  })

  const generatePDF = (prescriptionData) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Healiinn Prescription', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Name and Address (Centered)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescriptionData.clinic.name, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(prescriptionData.clinic.address, pageWidth / 2, yPos, { align: 'center' })
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
    if (prescriptionData.doctor.phone) {
      doc.text(`Phone: ${prescriptionData.doctor.phone}`, margin, yPos + 8)
    }
    const issuedDate = formatDate(prescriptionData.issuedAt)
    doc.text(`Date: ${issuedDate}`, margin, yPos + 12)

    // Patient Info (Right)
    doc.text(`Name: ${prescriptionData.patient.name}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${prescriptionData.patient.age} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${prescriptionData.patient.gender}`, pageWidth - margin, yPos + 8, { align: 'right' })
    if (prescriptionData.patient.phone) {
      doc.text(`Phone: ${prescriptionData.patient.phone}`, pageWidth - margin, yPos + 12, { align: 'right' })
    }
    // Patient Address
    let addressYPos = prescriptionData.patient.phone ? yPos + 16 : yPos + 12
    if (prescriptionData.patient.address) {
      let addressText = ''
      const address = prescriptionData.patient.address
      
      // Handle address as object (with line1, line2, city, state, postalCode)
      if (typeof address === 'object' && address !== null) {
        const addressParts = []
        if (address.line1) addressParts.push(address.line1)
        if (address.line2) addressParts.push(address.line2)
        if (address.city) addressParts.push(address.city)
        if (address.state) addressParts.push(address.state)
        if (address.postalCode) addressParts.push(address.postalCode)
        addressText = addressParts.join(', ')
      } else if (typeof address === 'string') {
        // Handle address as string
        addressText = address
      }
      
      if (addressText) {
        const addressLines = doc.splitTextToSize(addressText, (pageWidth - 2 * margin) / 2)
        addressLines.forEach((line, idx) => {
          doc.text(`${idx === 0 ? 'Address: ' : ''}${line}`, pageWidth - margin, addressYPos + (idx * 4), { align: 'right' })
        })
        addressYPos += (addressLines.length - 1) * 4
      }
    }
    yPos = addressYPos + 3

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

    // Symptoms Section with Green Bullet Points
    if (prescriptionData.symptoms && prescriptionData.symptoms.length > 0) {
      // Check if we need a new page
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      prescriptionData.symptoms.forEach((symptom) => {
        // Check if we need a new page for each line
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = margin
        }
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        const symptomText = typeof symptom === 'string' ? symptom.trim() : String(symptom)
        doc.text(symptomText, margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

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
        
        // Calculate how many lines instructions will take
        if (hasInstructions) {
          doc.setFontSize(7)
          const rightColMaxWidth = (pageWidth - 2 * margin) / 2 - 5
          const instructionsLines = doc.splitTextToSize(med.instructions.trim(), rightColMaxWidth)
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
        
        // Medication name with strength (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const medName = med.strength ? `${med.name} ${med.strength}` : med.name
        doc.text(medName, margin + 4, yPos + 3)
        
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
          const rightColMaxWidth = (pageWidth - 2 * margin) / 2 - 5
          const instructionsLines = doc.splitTextToSize(instructionsText, rightColMaxWidth)
          
          // Instructions label (bold)
          doc.setFont('helvetica', 'bold')
          doc.text('Instructions:', rightColX, startY + 4)
          doc.setFont('helvetica', 'normal')
          
          // Instructions text (can wrap to multiple lines)
          instructionsLines.forEach((line, lineIdx) => {
            doc.text(line, rightColX, startY + 8 + (lineIdx * 4))
          })
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.recommendedTests && prescriptionData.recommendedTests.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.recommendedTests.forEach((test) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = margin
        }
        
        // Light purple box for each test
        const testBoxHeight = test.instructions ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(test.name, margin + 4, yPos + 2)
        
        if (test.instructions) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(test.instructions, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.medicalAdvice && prescriptionData.medicalAdvice.length > 0) {
      // Check if we need a new page
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      prescriptionData.medicalAdvice.forEach((advice) => {
        // Check if we need a new page for each line
        if (yPos > pageHeight - 20) {
          doc.addPage()
          yPos = margin
        }
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(advice.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpAt) {
      // Check if we need a new page
      if (yPos > pageHeight - 20) {
        doc.addPage()
        yPos = margin
      }
      
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = formatDate(prescriptionData.followUpAt)
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = margin
    }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Digitally signed by Healiinn', pageWidth - margin, pageHeight - 10, { align: 'right' })

    return doc
  }

  const handleViewPDF = (prescription) => {
    try {
      const doc = generatePDF(prescription)
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const handleDownloadPDF = (prescription) => {
    try {
      const doc = generatePDF(prescription)
      const fileName = `Prescription_${prescription.patient.name.replace(/\s+/g, '_')}_${prescription.issuedAt}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <section className="flex flex-col gap-4 sm:gap-5 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search prescriptions, doctors, or conditions..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[#1a5f7a] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="group relative overflow-hidden rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-3 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/40 hover:scale-[1.02] hover:border-emerald-300/80">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-200/40 blur-xl transition-opacity group-hover:opacity-100 opacity-70" />
          <div className="absolute -left-3 -bottom-3 h-12 w-12 rounded-full bg-emerald-100/30 blur-lg transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="relative text-2xl font-bold text-emerald-600 drop-shadow-sm">{loading ? '...' : prescriptions.length}</p>
          <p className="relative mt-1 text-xs font-semibold text-emerald-700">Prescriptions</p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.1)] via-[rgba(17,73,108,0.08)] to-[rgba(17,73,108,0.15)] p-3 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(17,73,108,0.1)] hover:scale-[1.02] hover:border-[rgba(17,73,108,0.3)]">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[rgba(17,73,108,0.1)] blur-xl transition-opacity group-hover:opacity-100 opacity-70" />
          <div className="absolute -left-3 -bottom-3 h-12 w-12 rounded-full bg-[rgba(17,73,108,0.08)] blur-lg transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="relative text-2xl font-bold text-[#11496c] drop-shadow-sm">
            {loading ? '...' : prescriptions.reduce((sum, p) => sum + (p.medications?.length || 0), 0)}
          </p>
          <p className="relative mt-1 text-xs font-semibold text-[#11496c]">Medications</p>
        </div>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-400 animate-pulse" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading prescriptions...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-sm font-medium text-red-600">Error loading prescriptions</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No prescriptions found</p>
          <p className="mt-1 text-xs text-slate-500">Prescriptions shared with your pharmacy will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-[rgba(17,73,108,0.2)] hover:shadow-md"
            >
              {/* Patient Name with Meds and Tests Status - Parallel */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h3 className="text-lg font-bold text-slate-900 leading-tight flex-1 min-w-0">{prescription.patient.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 rounded-full bg-[rgba(59,130,246,0.1)] px-2 py-0.5 border border-[rgba(59,130,246,0.2)]">
                    <IoBagHandleOutline className="h-3 w-3 text-blue-700" />
                    <span className="text-[10px] font-semibold text-blue-700">{prescription.medications.length} meds</span>
                  </div>
                  {prescription.recommendedTests.length > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-[rgba(59,130,246,0.1)] px-2 py-0.5 border border-[rgba(59,130,246,0.2)]">
                      <IoFlaskOutline className="h-3 w-3 text-blue-700" />
                      <span className="text-[10px] font-semibold text-blue-700">{prescription.recommendedTests.length} tests</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Information - Line by Line with Enhanced Display */}
              <div className="space-y-1.5 mb-3">
                {/* Age and Gender */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-medium">Age:</span>
                  <span>{prescription.patient.age} years • {prescription.patient.gender}</span>
                </div>
                
                {/* Condition/Diagnosis */}
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-slate-600 shrink-0">Diagnosis:</span>
                  <span className="text-sm font-semibold text-slate-900">{prescription.diagnosis}</span>
                </div>

                {/* Clinic Name */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">Clinic:</span>
                  <span>{prescription.clinic.name}</span>
                </div>
                
                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(prescription.issuedAt)}</span>
                </div>
              </div>

              {/* Action Buttons - Download PDF and View Details */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(prescription)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleViewPDF(prescription)}
                  className="flex items-center justify-center rounded-lg border border-slate-200 bg-white w-10 h-10 text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  aria-label="View PDF"
                >
                  <IoEyeOutline className="h-5 w-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6 animate-in fade-in duration-200"
          onClick={() => setSelectedPrescription(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="flex items-center justify-center rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                >
                  <IoArrowBackOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Prescription Details</h2>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-[rgba(17,73,108,0.1)] hover:text-[#11496c] active:scale-95"
                  aria-label="Zoom"
                >
                  <IoExpandOutline className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="rounded-full p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95"
                >
                  <IoCloseOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            </div>
          </div>

            {/* Prescription Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Clinic Information */}
              <div className="relative overflow-hidden rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/80 via-white to-teal-50/40 p-4 sm:p-5 shadow-sm">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-200/20 blur-2xl" />
                <h3 className="relative text-lg sm:text-xl font-bold text-teal-700 mb-2">{selectedPrescription.clinic.name}</h3>
                <p className="relative text-sm sm:text-base text-slate-700 mb-3">{selectedPrescription.clinic.address}</p>
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                  <a
                    href={`tel:${selectedPrescription.clinic.phone}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 hover:bg-white transition-all hover:shadow-sm"
                  >
                    <IoCallOutline className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                    <span className="font-medium">{selectedPrescription.clinic.phone}</span>
                  </a>
                  <a
                    href={`mailto:${selectedPrescription.clinic.email}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 hover:bg-white transition-all hover:shadow-sm"
                  >
                    <IoMailOutline className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                    <span className="font-medium">{selectedPrescription.clinic.email}</span>
                  </a>
                </div>
                <div className="mt-4 h-0.5 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500 rounded-full" />
              </div>

              {/* Patient Information */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 to-white p-4 sm:p-5 shadow-sm">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <IoPersonCircleOutline className="h-5 w-5 text-emerald-600" />
                  Patient Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-600">Name:</span>
                    <p className="text-slate-900 font-medium">{selectedPrescription.patient.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Age:</span>
                    <p className="text-slate-900 font-medium">{selectedPrescription.patient.age} years</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Gender:</span>
                    <p className="text-slate-900 font-medium">{selectedPrescription.patient.gender}</p>
                  </div>
                  {selectedPrescription.patient.phone && (
                    <div>
                      <span className="font-semibold text-slate-600">Phone:</span>
                      <a href={`tel:${selectedPrescription.patient.phone}`} className="text-[#11496c] font-medium hover:text-[#0d3a52] hover:underline">
                        {selectedPrescription.patient.phone}
                      </a>
                    </div>
                  )}
                  {selectedPrescription.patient.email && (
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-600">Email:</span>
                      <a href={`mailto:${selectedPrescription.patient.email}`} className="text-[#11496c] font-medium hover:text-[#0d3a52] hover:underline break-all">
                        {selectedPrescription.patient.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3">Diagnosis</h4>
                <div className="rounded-xl bg-gradient-to-r from-[rgba(17,73,108,0.15)] via-[rgba(17,73,108,0.1)] to-[rgba(17,73,108,0.15)] px-4 sm:px-5 py-3 sm:py-4 border border-[rgba(17,73,108,0.2)] shadow-sm">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">{selectedPrescription.diagnosis}</p>
                </div>
              </div>

              {/* Symptoms */}
              {selectedPrescription.symptoms && selectedPrescription.symptoms.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-green-50/50 to-white p-4 sm:p-5 shadow-sm">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3">Symptoms</h4>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {selectedPrescription.symptoms.map((symptom, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 shadow-sm" />
                        <span className="font-medium">{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medications */}
              {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Medications</h4>
                  <div className="space-y-2">
                    {selectedPrescription.medications.map((med, idx) => (
                      <div
                        key={med.id || idx}
                        className="group relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-2.5 sm:p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[rgba(17,73,108,0.2)]"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 text-xs font-bold text-emerald-700 shadow-sm">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
                              {med.name} {med.dosage && `(${med.dosage})`}
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-700">
                              {med.dosage && (
                                <div>
                                  <span className="font-semibold text-slate-600">Dosage:</span>
                                  <p className="text-slate-900">{med.dosage}</p>
                                </div>
                              )}
                              {med.frequency && (
                                <div>
                                  <span className="font-semibold text-slate-600">Frequency:</span>
                                  <p className="text-slate-900">{med.frequency}</p>
                                </div>
                              )}
                              {med.duration && (
                                <div>
                                  <span className="font-semibold text-slate-600">Duration:</span>
                                  <p className="text-slate-900">{med.duration}</p>
                                </div>
                              )}
                              {med.instructions && (
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="font-semibold text-slate-600">Instructions:</span>
                                  <p className="text-slate-900 line-clamp-2">{med.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Tests */}
              {selectedPrescription.recommendedTests && selectedPrescription.recommendedTests.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Recommended Tests</h4>
                  <div className="space-y-2">
                    {selectedPrescription.recommendedTests.map((test, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start gap-2.5 rounded-lg border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-purple-50/40 p-2.5 sm:p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300"
                      >
                        <IoFlaskOutline className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-purple-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-slate-900">{test.name || test.testName}</p>
                          {(test.instructions || test.notes) && (
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">{test.instructions || test.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Advice */}
              {selectedPrescription.medicalAdvice && selectedPrescription.medicalAdvice.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-white p-4 sm:p-5 shadow-sm">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">Medical Advice</h4>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {selectedPrescription.medicalAdvice.map((advice, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500 shadow-sm" />
                        <span className="font-medium">{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Appointment */}
              {selectedPrescription.followUpAt && (
                <div className="relative overflow-hidden rounded-xl border-2 border-orange-200/80 bg-gradient-to-br from-orange-50/90 via-amber-50/70 to-orange-50/90 p-4 sm:p-5 shadow-sm">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange-200/30 blur-xl" />
                  <div className="relative flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <IoCalendarOutline className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">Follow-up Appointment</h4>
                  </div>
                  <p className="relative text-sm sm:text-base font-bold text-orange-700">{formatDate(selectedPrescription.followUpAt)}</p>
                </div>
              )}

            </div>

            {/* Action Buttons - At Bottom (Sticky) */}
            <div className="sticky bottom-0 flex flex-row gap-2 sm:gap-3 border-t border-slate-200 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm flex-shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedPrescription)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
              >
                <IoDownloadOutline className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PharmacyPrescriptions

