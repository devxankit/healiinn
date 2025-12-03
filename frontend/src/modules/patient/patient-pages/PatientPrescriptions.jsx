import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import { 
  getPatientPrescriptions, 
  getDoctors, 
  getDiscoveryPharmacies, 
  getDiscoveryLaboratories,
  createPatientRequest
} from '../patient-services/patientService'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoShareSocialOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoSearchOutline,
  IoPeopleOutline,
  IoStar,
  IoStarOutline,
  IoInformationCircleOutline,
  IoHomeOutline,
  IoBusinessOutline,
} from 'react-icons/io5'

// Default prescriptions (will be replaced by API data)
const defaultPrescriptions = []

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

const PatientPrescriptions = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharePrescriptionId, setSharePrescriptionId] = useState(null)
  const [selectedDoctors, setSelectedDoctors] = useState([])
  const [shareSearchTerm, setShareSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  
  // Lab report sharing and viewing states
  const [selectedLabReport, setSelectedLabReport] = useState(null)
  const [showLabShareModal, setShowLabShareModal] = useState(false)
  const [showLabViewModal, setShowLabViewModal] = useState(false)
  const [selectedLabDoctorId, setSelectedLabDoctorId] = useState(null)
  const [isSharingLabReport, setIsSharingLabReport] = useState(false)
  
  // Test visit modal states
  const [showTestVisitModal, setShowTestVisitModal] = useState(false)
  const [testVisitPrescription, setTestVisitPrescription] = useState(null)
  
  // Get active tab from URL params, default to 'prescriptions'
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'lab-reports' ? 'lab-reports' : 'prescriptions')

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'lab-reports') {
      setActiveTab('lab-reports')
    } else {
      setActiveTab('prescriptions')
    }
  }, [searchParams])

  const [prescriptions, setPrescriptions] = useState(defaultPrescriptions)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getPatientPrescriptions()
        
        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.prescriptions || []
          
          // Transform API data to match component structure
          const transformed = prescriptionsData.map(presc => ({
            id: presc._id || presc.id,
            _id: presc._id || presc.id,
            doctor: presc.doctorId ? {
              name: presc.doctorId.firstName && presc.doctorId.lastName
                ? `Dr. ${presc.doctorId.firstName} ${presc.doctorId.lastName}`
                : presc.doctorId.name || 'Dr. Unknown',
              specialty: presc.doctorId.specialization || presc.doctorId.specialty || '',
              image: presc.doctorId.profileImage || presc.doctorId.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(presc.doctorId.firstName || 'Doctor')}&background=11496c&color=fff&size=128&bold=true`,
            } : presc.doctor || {},
            issuedAt: presc.createdAt ? new Date(presc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: presc.status || 'active',
            diagnosis: presc.diagnosis || '',
            symptoms: presc.symptoms || '',
            medications: presc.medicines || presc.medications || [],
            investigations: presc.investigations || [],
            advice: presc.advice || presc.notes || '',
            followUpAt: presc.followUpDate || presc.followUpAt || null,
            pdfUrl: presc.pdfUrl || '#',
            sharedWith: presc.sharedWith || {
              pharmacies: [],
              laboratories: [],
            },
            originalData: presc,
          }))
          
          setPrescriptions(transformed)
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err)
        setError(err.message || 'Failed to load prescriptions')
        toast.error('Failed to load prescriptions')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescriptions()
  }, [toast])

  const filteredPrescriptions = prescriptions.filter((presc) => {
    if (filter === 'all') return true
    return presc.status === filter
  })

  const currentPrescription = prescriptions.find((p) => p.id === sharePrescriptionId)

  useEffect(() => {
    if (showShareModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showShareModal])

  const handleShareClick = (prescriptionId) => {
    setSharePrescriptionId(prescriptionId)
    setSelectedDoctors([])
    setShareSearchTerm('')
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
    setSharePrescriptionId(null)
    setSelectedDoctors([])
    setShareSearchTerm('')
  }

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
    // Since we don't have clinic info, use doctor's name and specialty
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
    doc.text('Prescription Details', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${prescriptionData.doctor.name}`, margin, yPos)
    doc.text(`Specialty: ${prescriptionData.doctor.specialty}`, margin, yPos + 4)
    const issuedDate = formatDate(prescriptionData.issuedAt)
    doc.text(`Date: ${issuedDate}`, margin, yPos + 8)

    // Prescription Info (Right)
    doc.text(`Status: ${prescriptionData.status.charAt(0).toUpperCase() + prescriptionData.status.slice(1)}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Issued: ${issuedDate}`, pageWidth - margin, yPos + 4, { align: 'right' })
    if (prescriptionData.followUpAt) {
      const followUpDate = formatDate(prescriptionData.followUpAt)
      doc.text(`Follow-up: ${followUpDate}`, pageWidth - margin, yPos + 8, { align: 'right' })
    }

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

    // Symptoms Section with Green Bullet Points
    if (prescriptionData.symptoms) {
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
      const symptomLines = typeof prescriptionData.symptoms === 'string' 
        ? prescriptionData.symptoms.split('\n').filter(line => line.trim())
        : Array.isArray(prescriptionData.symptoms)
        ? prescriptionData.symptoms.filter(s => s && s.trim())
        : [String(prescriptionData.symptoms)]
      
      symptomLines.forEach((symptom) => {
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

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.investigations.forEach((inv) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = margin
        }
        
        // Light purple box for each test
        const testBoxHeight = inv.notes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(inv.name, margin + 4, yPos + 2)
        
        if (inv.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(inv.notes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.advice) {
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
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
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

  const handleDownloadPDF = (prescription) => {
    try {
      const doc = generatePDF(prescription)
      const fileName = `Prescription_${prescription.doctor.name.replace(/\s+/g, '_')}_${prescription.issuedAt}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const handleViewPDF = (prescription) => {
    try {
      const doc = generatePDF(prescription)
      // Generate PDF blob and open in new window
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 100)
    } catch (error) {
      console.error('Error viewing PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  const toggleDoctorSelection = (doctorId) => {
    setSelectedDoctors((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId)
      }
      return [...prev, doctorId]
    })
  }

  const handleShare = async () => {
    if (selectedDoctors.length === 0) {
      return
    }

    setIsSharing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Sharing prescription:', {
      prescriptionId: sharePrescriptionId,
      doctors: selectedDoctors,
    })
    setIsSharing(false)
    
    // Navigate to first doctor's booking page
    if (selectedDoctors.length > 0) {
      const firstDoctorId = selectedDoctors[0]
      handleCloseShareModal()
      // Navigate to doctor details page with booking modal open
      navigate(`/patient/doctors/${firstDoctorId}?book=true`)
    }
  }

  const handleBookTestVisit = (prescription) => {
    // Show modal to select Home or Lab
    setTestVisitPrescription(prescription)
    setShowTestVisitModal(true)
  }

  const handleTestVisitHome = async () => {
    if (!testVisitPrescription) return

    try {
      setIsSharing(true)
      
      // Get prescription ID
      const prescriptionId = testVisitPrescription._id || testVisitPrescription.id
      
      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'book_test_visit',
        prescriptionId,
        visitType: 'home',
      })

      if (response.success) {
        // Close modal
        setShowTestVisitModal(false)
        setTestVisitPrescription(null)
        toast.success('Home sample collection request sent successfully! Admin will review and approve your request.')
      }
    } catch (error) {
      console.error('Error sending home test visit request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleTestVisitLab = async () => {
    if (!testVisitPrescription) return

    try {
      setIsSharing(true)
      
      // Get prescription ID
      const prescriptionId = testVisitPrescription._id || testVisitPrescription.id
      
      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'book_test_visit',
        prescriptionId,
        visitType: 'lab',
      })

      if (response.success) {
        // Close modal
        setShowTestVisitModal(false)
        setTestVisitPrescription(null)
        toast.success('Lab visit request sent successfully! Admin will review and approve your request.')
      }
    } catch (error) {
      console.error('Error sending lab visit request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleOrderMedicine = async (prescription) => {
    try {
      setIsSharing(true)
      
      // Get prescription ID
      const prescriptionId = prescription._id || prescription.id
      
      if (!prescriptionId) {
        toast.error('Prescription ID not found')
        setIsSharing(false)
        return
      }

      // Create request via API
      const response = await createPatientRequest({
        type: 'order_medicine',
        prescriptionId,
      })

      if (response.success) {
        toast.success('Medicine order request sent successfully!')
      }
    } catch (error) {
      console.error('Error sending medicine order request:', error)
      toast.error(error.message || 'Error sending request. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  // Calculate prescription counts
  const activePrescriptionsCount = prescriptions.filter((p) => p.status === 'active').length
  const totalPrescriptionsCount = prescriptions.length

  // Load lab reports from API
  const [labReports, setLabReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  
  // State for doctors, pharmacies, and labs
  const [doctors, setDoctors] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [labs, setLabs] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingPharmacies, setLoadingPharmacies] = useState(false)
  const [loadingLabs, setLoadingLabs] = useState(false)
  
  // Filter doctors for sharing (must be after doctors state declaration)
  const filteredDoctors = doctors.filter((doctor) => {
    if (!doctor.isActive) return false
    
    const search = shareSearchTerm.toLowerCase()
    const doctorName = doctor.firstName && doctor.lastName 
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
      : doctor.name || ''
    const specialty = doctor.specialization || doctor.specialty || ''
    const location = doctor.clinicDetails?.clinicName || doctor.location || ''
    
    return (
      doctorName.toLowerCase().includes(search) ||
      specialty.toLowerCase().includes(search) ||
      location.toLowerCase().includes(search)
    )
  })
  
  // Fetch doctors for sharing
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true)
        const response = await getDoctors({ limit: 50 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          setDoctors(items)
        }
      } catch (error) {
        console.error('Error fetching doctors:', error)
        setDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }
    
    if (showShareModal || showLabShareModal) {
      fetchDoctors()
    }
  }, [showShareModal, showLabShareModal])
  
  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoadingPharmacies(true)
        const response = await getDiscoveryPharmacies({ limit: 20 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          setPharmacies(items)
        }
      } catch (error) {
        console.error('Error fetching pharmacies:', error)
        setPharmacies([])
      } finally {
        setLoadingPharmacies(false)
      }
    }
    
    fetchPharmacies()
  }, [])
  
  // Fetch labs
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoadingLabs(true)
        const response = await getDiscoveryLaboratories({ limit: 20 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          setLabs(items)
        }
      } catch (error) {
        console.error('Error fetching labs:', error)
        setLabs([])
      } finally {
        setLoadingLabs(false)
      }
    }
    
    fetchLabs()
  }, [])
  
  useEffect(() => {
    const fetchLabReports = async () => {
      try {
        setLoadingReports(true)
        // Lab reports are fetched from PatientReports page API
        // For now, we'll keep it empty or fetch from API if needed
        setLabReports([])
      } catch (error) {
        console.error('Error loading lab reports:', error)
        setLabReports([])
      } finally {
        setLoadingReports(false)
      }
    }
    
    fetchLabReports()
    // Refresh every 30 seconds to get new reports
    const interval = setInterval(fetchLabReports, 30000)
    return () => clearInterval(interval)
  }, [])

  // Calculate lab reports count
  const labReportsCount = labReports.length

  // State for patient appointments
  const [patientAppointments, setPatientAppointments] = useState([])
  
  // Fetch patient appointments to check if doctor has appointment
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { getPatientAppointments } = await import('../patient-services/patientService')
        const response = await getPatientAppointments({ limit: 100 })
        if (response.success && response.data) {
          const items = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || []
          setPatientAppointments(items)
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setPatientAppointments([])
      }
    }
    
    if (showShareModal || showLabShareModal) {
      fetchAppointments()
    }
  }, [showShareModal, showLabShareModal])
  
  // Check if patient has appointment with a doctor
  const checkPatientHasAppointment = (doctorId) => {
    return patientAppointments.some(
      (apt) =>
        (apt.doctorId?._id || apt.doctorId?.id || apt.doctorId) === doctorId &&
        (apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'completed')
    )
  }

  // Lab report handlers
  const handleShareLabReportClick = (report) => {
    setSelectedLabReport(report)
    setSelectedLabDoctorId(null)
    setShowLabShareModal(true)
  }

  const handleCloseLabShareModal = () => {
    setShowLabShareModal(false)
    setSelectedLabReport(null)
    setSelectedLabDoctorId(null)
  }

  const handleViewLabReportClick = (report) => {
    // Check if PDF is available
    if (report.pdfFileUrl && report.pdfFileUrl !== '#') {
      // If it's a base64 data URL, open directly
      if (report.pdfFileUrl.startsWith('data:')) {
      window.open(report.pdfFileUrl, '_blank')
      } else {
        // For other URLs, open in new tab
        window.open(report.pdfFileUrl, '_blank')
      }
    } else {
      // Fallback: show modal if PDF not available
      setSelectedLabReport(report)
      setShowLabViewModal(true)
    }
  }

  const handleCloseLabViewModal = () => {
    setShowLabViewModal(false)
    setSelectedLabReport(null)
  }

  const handleShareLabReportWithDoctor = async () => {
    if (!selectedLabReport || !selectedLabDoctorId) return

    setIsSharingLabReport(true)
    
    const selectedDoctor = doctors.find(doc => (doc._id || doc.id) === selectedLabDoctorId)
    
    if (!selectedDoctor) {
      setIsSharingLabReport(false)
      toast.error('Doctor not found')
      return
    }
    
    const doctorName = selectedDoctor.firstName && selectedDoctor.lastName 
      ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`
      : selectedDoctor.name || 'Doctor'

    // Check if patient has appointment with this doctor
    const hasAppointment = checkPatientHasAppointment(selectedLabDoctorId)
    
    if (hasAppointment || (selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId)) {
      // Direct share - TODO: Implement API for sharing reports with doctors
      // For now, just show success message
      setTimeout(() => {
        setIsSharingLabReport(false)
        handleCloseLabShareModal()
        toast.success(`Report will be shared with ${doctorName}. Note: This feature will be available via API soon.`)
      }, 1000)
    } else {
      // Share with other doctor - requires booking
      setTimeout(() => {
        setIsSharingLabReport(false)
        handleCloseLabShareModal()
        toast.info(`To share with ${doctorName}, please book an appointment first.`)
        // Navigate to doctor details page with booking modal
        navigate(`/patient/doctors/${selectedLabDoctorId}?book=true`)
      }, 1000)
    }
  }

  const handleDownloadLabReport = async (report) => {
    // If PDF file URL is available, download the lab-uploaded PDF
    if (report.pdfFileUrl && report.pdfFileUrl !== '#') {
      try {
        // Check if we have stored PDF in localStorage (from previous download)
        const storedPdfs = JSON.parse(localStorage.getItem('patientLabReportPdfs') || '{}')
        const storedPdf = storedPdfs[report.id]
        
        if (storedPdf && storedPdf.base64Data) {
          // Use stored PDF if available
          const link = document.createElement('a')
          link.href = storedPdf.base64Data
          link.download = storedPdf.pdfFileName || report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return
        }
        
        // Check if URL is from same origin or is a data URL
        const isSameOrigin = report.pdfFileUrl.startsWith(window.location.origin) || report.pdfFileUrl.startsWith('/')
        const isDataUrl = report.pdfFileUrl.startsWith('data:')
        
        if (isDataUrl) {
          // Direct download for data URLs
          const link = document.createElement('a')
          link.href = report.pdfFileUrl
          link.download = report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return
        }
        
        // Only try fetch for same-origin URLs to avoid CORS errors
        if (isSameOrigin) {
          try {
            const response = await fetch(report.pdfFileUrl, {
              method: 'GET',
            })
            
            if (response.ok) {
              const blob = await response.blob()
              
              // Create a blob URL for download
              const blobUrl = URL.createObjectURL(blob)
              
              // Create download link
              const link = document.createElement('a')
              link.href = blobUrl
              link.download = report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              // Clean up blob URL
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl)
              }, 100)
              
              // Store PDF in localStorage for offline access
              try {
                const reader = new FileReader()
                reader.onloadend = () => {
                  const base64Data = reader.result
                  const updatedStoredPdfs = JSON.parse(localStorage.getItem('patientLabReportPdfs') || '{}')
                  updatedStoredPdfs[report.id] = {
                    pdfFileUrl: report.pdfFileUrl,
                    pdfFileName: report.pdfFileName || `${report.testName?.replace(/\s+/g, '_') || 'Report'}_${report.date || 'Report'}.pdf`,
                    base64Data: base64Data,
                    downloadedAt: new Date().toISOString(),
                  }
                  localStorage.setItem('patientLabReportPdfs', JSON.stringify(updatedStoredPdfs))
                }
                reader.readAsDataURL(blob)
              } catch (storageError) {
                console.error('Error storing PDF:', storageError)
              }
              return
            }
          } catch (fetchError) {
            // Silently handle fetch errors for same-origin (shouldn't happen but handle gracefully)
            console.warn('Fetch failed for same-origin URL')
          }
        }
        
        // For external URLs (cross-origin), don't try fetch (will cause CORS error)
        // Just open in new tab - browser will handle download if server allows
        window.open(report.pdfFileUrl, '_blank')
      } catch (error) {
        console.error('Error downloading PDF:', error)
        // Last resort: open in new tab
        window.open(report.pdfFileUrl, '_blank')
      }
      return
    }
    
    // Fallback: Generate and download PDF report if no PDF file URL
    // Generate and download PDF report
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lab Report - ${report.testName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 28px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 15px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    .info-value {
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Lab Test Report</h1>
    <div style="color: #64748b; margin-top: 5px; font-size: 14px;">Healiinn - Your Health Partner</div>
  </div>
  <div class="section">
    <div class="section-title">Report Information</div>
    <div class="info-row">
      <span class="info-label">Test Name:</span>
      <span class="info-value">${report.testName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Laboratory:</span>
      <span class="info-value">${report.labName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Report Date:</span>
      <span class="info-value">${formatDate(report.date)}</span>
    </div>
  </div>
</body>
</html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(pdfContent)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Prescription and Lab Report Cards - Scrolls with Page */}
      <div className="grid grid-cols-2 gap-3">
        {/* Prescription Card */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('prescriptions')
            setFilter('all')
            setSearchParams({ tab: 'prescriptions' })
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
            activeTab === 'prescriptions'
              ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Prescription</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalPrescriptionsCount}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{activePrescriptionsCount} Active</p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#14B8A6' }}
            >
              <IoDocumentTextOutline className="h-4 w-4 text-white" />
            </div>
          </div>
        </button>

        {/* Lab Report Card */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('lab-reports')
            setSearchParams({ tab: 'lab-reports' })
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`relative overflow-hidden rounded-2xl border-2 p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
            activeTab === 'lab-reports'
              ? 'border-[#11496c] bg-[rgba(17,73,108,0.05)]'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Lab Report</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{labReportsCount}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Available</p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#14B8A6' }}
            >
              <IoFlaskOutline className="h-4 w-4 text-white" />
            </div>
          </div>
        </button>
      </div>
      {/* Prescriptions Content */}
      {activeTab === 'prescriptions' && (
        <>
          {/* Filter Tabs */}
          <div id="filter-tabs" className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
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

          {/* Prescriptions List */}
          <div id="prescriptions-section">
      {filteredPrescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No prescriptions found</p>
          <p className="mt-1 text-xs text-slate-500">Prescriptions shared by doctors will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: 'rgba(17, 73, 108, 0.1)' }} />

              <div className="relative">
                {/* Doctor Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={prescription.doctor.image}
                    alt={prescription.doctor.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-100"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{prescription.doctor.name}</h3>
                    <p className="text-sm text-[#11496c]">{prescription.doctor.specialty}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          prescription.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {prescription.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <IoCalendarOutline className="h-3 w-3" />
                        <span>Issued {formatDate(prescription.issuedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  {/* First Row: Download PDF, View, Share */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(prescription)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                    >
                      <IoDownloadOutline className="h-4 w-4" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewPDF(prescription)}
                      className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                      aria-label="View PDF"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareClick(prescription.id)}
                      className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                      aria-label="Share prescription"
                    >
                      <IoShareSocialOutline className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Second Row: Book Test Visit, Order Medicine */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleBookTestVisit(prescription)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                    >
                      <IoFlaskOutline className="h-4 w-4" />
                      Book Test Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrderMedicine(prescription)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                    >
                      <IoBagHandleOutline className="h-4 w-4" />
                      Order Medicine
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
          </div>
        </>
      )}

      {/* Lab Reports Content */}
      {activeTab === 'lab-reports' && (
        <div id="lab-reports-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Lab Reports</h2>
          <p className="text-xs text-slate-600">Share reports with your doctors</p>
        </div>

        {labReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">No lab reports found</p>
            <p className="mt-1 text-xs text-slate-500">Lab reports will appear here when laboratory shares them</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labReports.map((report) => (
              <article
                key={report.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md flex flex-col min-h-[180px]"
              >
                {/* Header Section */}
                <div className="flex items-start gap-4 p-5 pb-4 flex-1 min-h-[120px]">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ 
                    background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                    boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                  }}>
                    <IoFlaskOutline className="h-8 w-8" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">{report.testName}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-1">{report.labName}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <IoCalendarOutline className="h-3.5 w-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(report.date)}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                  <button
                    type="button"
                    onClick={() => handleDownloadLabReport(report)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98]"
                  >
                    <IoDownloadOutline className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewLabReportClick(report)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
                    aria-label="View report"
                  >
                    <IoEyeOutline className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareLabReportClick(report)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-[rgba(17,73,108,0.4)] hover:bg-[rgba(17,73,108,0.1)] hover:text-[#11496c] hover:shadow active:scale-95"
                    aria-label="Share with doctor"
                  >
                    <IoShareSocialOutline className="h-5 w-5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && currentPrescription && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseShareModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Share Prescription</h2>
                <p className="text-sm text-slate-600">
                  {currentPrescription.doctor.name} - {currentPrescription.doctor.specialty}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Header for Doctors */}
            <div className="flex items-center justify-center border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <IoPeopleOutline className="h-5 w-5 text-[#11496c]" />
                <h3 className="text-base font-semibold text-slate-900">Select Doctors</h3>
                {selectedDoctors.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                    {selectedDoctors.length}
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IoSearchOutline className="h-5 w-5" />
                </span>
                <input
                  type="search"
                  placeholder="Search doctors..."
                  value={shareSearchTerm}
                  onChange={(e) => setShareSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                {/* Info Banner */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <IoInformationCircleOutline className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Note</p>
                      <p className="text-xs text-amber-800 mt-1">
                        Doctors will need to book an appointment to view this prescription.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-600">No doctors found</p>
                  </div>
                ) : (
                  filteredDoctors.map((doctor) => {
                    const isSelected = selectedDoctors.includes(doctor.id)
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => toggleDoctorSelection(doctor.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 p-4 transition text-left ${
                          isSelected
                            ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className={`h-12 w-12 rounded-xl object-cover ring-2 bg-slate-100 ${
                              isSelected ? 'ring-[#11496c]' : 'ring-slate-200'
                            }`}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-slate-900">{doctor.name}</h4>
                            <p className="text-xs text-[#11496c] mt-0.5">{doctor.specialty}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                              <IoLocationOutline className="h-3 w-3" />
                              <span>{doctor.location}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {renderStars(doctor.rating)}
                              <span className="text-xs font-semibold text-slate-700 ml-1">{doctor.rating}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">
                  {selectedDoctors.length} selected
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoctors([])
                  }}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Clear All
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseShareModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={selectedDoctors.length === 0 || isSharing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <IoShareSocialOutline className="h-4 w-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Share Modal */}
      {showLabShareModal && selectedLabReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Share Report with Doctor</h2>
              <button
                type="button"
                onClick={handleCloseLabShareModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Report:</p>
                <p className="text-sm text-slate-600">{selectedLabReport.testName}</p>
              </div>

              {/* Associated Doctor - Direct Share */}
              {selectedLabReport.doctorId && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Your Appointed Doctor (Direct Share):</p>
                  <button
                    type="button"
                    onClick={() => setSelectedLabDoctorId(selectedLabReport.doctorId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                      selectedLabDoctorId === selectedLabReport.doctorId
                        ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedLabReport.doctorImage}
                        alt={selectedLabReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{selectedLabReport.doctorName}</h3>
                        <p className="text-xs text-slate-600">{selectedLabReport.doctorSpecialty}</p>
                      </div>
                      {selectedLabDoctorId === selectedLabReport.doctorId && (
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
                  </button>
                </div>
              )}

              {/* Other Doctors - Check for appointments */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Other Doctors:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingDoctors ? (
                    <p className="text-xs text-slate-500 text-center py-4">Loading doctors...</p>
                  ) : filteredDoctors.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No doctors found</p>
                  ) : (
                    filteredDoctors
                      .filter((doc) => {
                        const docId = doc._id || doc.id
                        return !selectedLabReport?.doctorId || docId !== selectedLabReport.doctorId
                      })
                      .map((doctor) => {
                        const doctorId = doctor._id || doctor.id
                        const doctorName = doctor.firstName && doctor.lastName 
                          ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                          : doctor.name || 'Doctor'
                        const specialty = doctor.specialization || doctor.specialty || ''
                        const hasAppointment = checkPatientHasAppointment(doctorId)
                        return (
                          <button
                            key={doctorId}
                            type="button"
                            onClick={() => setSelectedLabDoctorId(doctorId)}
                            className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                              selectedLabDoctorId === doctorId
                                ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={doctor.profileImage || doctor.image || ''}
                                alt={doctorName}
                                className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=3b82f6&color=fff&size=128&bold=true`
                                }}
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{doctorName}</h3>
                                <p className="text-xs text-slate-600">{specialty}</p>
                              </div>
                              {selectedLabDoctorId === doctorId && (
                                <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                              )}
                            </div>
                            {hasAppointment ? (
                              <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
                            ) : (
                              <p className="mt-2 text-xs text-amber-600">⚠ Requires booking appointment</p>
                            )}
                          </button>
                        )
                      })
                  )}
                </div>
              </div>

              {selectedLabDoctorId && (
                <div className="mt-4 rounded-lg bg-[rgba(17,73,108,0.1)] p-3">
                  <p className="text-xs text-[#0a2d3f]">
                    {(selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId) || checkPatientHasAppointment(selectedLabDoctorId) ? (
                      <>
                        <strong>Direct Share:</strong> Report will be shared immediately with {doctors.find(d => (d._id || d.id) === selectedLabDoctorId) ? (doctors.find(d => (d._id || d.id) === selectedLabDoctorId).firstName && doctors.find(d => (d._id || d.id) === selectedLabDoctorId).lastName ? `Dr. ${doctors.find(d => (d._id || d.id) === selectedLabDoctorId).firstName} ${doctors.find(d => (d._id || d.id) === selectedLabDoctorId).lastName}` : doctors.find(d => (d._id || d.id) === selectedLabDoctorId).name) : selectedLabReport?.doctorName || 'Doctor'}.
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> To share with this doctor, you'll need to book an appointment first. The booking page will open after sharing.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseLabShareModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareLabReportWithDoctor}
                disabled={isSharingLabReport || !selectedLabDoctorId}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharingLabReport ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <IoShareSocialOutline className="h-4 w-4" />
                    {(selectedLabReport.doctorId && selectedLabDoctorId === selectedLabReport.doctorId) || checkPatientHasAppointment(selectedLabDoctorId)
                      ? 'Share Now'
                      : 'Share & Book'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Visit Selection Modal */}
      {showTestVisitModal && testVisitPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Choose Test Visit Type</h2>
              <button
                type="button"
                onClick={() => {
                  setShowTestVisitModal(false)
                  setTestVisitPrescription(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Prescription:</p>
                <p className="text-sm text-slate-600">
                  {testVisitPrescription.doctor?.name || 'Doctor'} - {testVisitPrescription.diagnosis || 'Test'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Home Option */}
                <button
                  type="button"
                  onClick={handleTestVisitHome}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                      <IoHomeOutline className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Home Sample Collection</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Sample will be collected from your home. Request will be sent to admin for approval.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Lab Option */}
                <button
                  type="button"
                  onClick={handleTestVisitLab}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <IoBusinessOutline className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Visit Lab</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Visit the lab for sample collection. Request will be sent to admin for approval.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => {
                  setShowTestVisitModal(false)
                  setTestVisitPrescription(null)
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report View Modal */}
      {showLabViewModal && selectedLabReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Lab Report - {selectedLabReport.testName}</h2>
              <button
                type="button"
                onClick={handleCloseLabViewModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
              {selectedLabReport.pdfFileUrl && selectedLabReport.pdfFileUrl !== '#' ? (
                <>
                  <iframe
                    src={`${selectedLabReport.pdfFileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full flex-1 border-0"
                    title={`Lab Report - ${selectedLabReport.testName}`}
                    onError={(e) => {
                      console.error('Error loading PDF:', e)
                    }}
                  />
                  <div className="p-3 bg-white border-t border-slate-200">
                    <p className="text-xs text-slate-600 text-center">
                      If PDF doesn't load, click "Download PDF" to view it
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <IoFlaskOutline className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-600">PDF not available</p>
                    <p className="text-xs text-slate-500 mt-1">The lab report PDF has not been uploaded yet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseLabViewModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadLabReport(selectedLabReport)
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52]"
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

export default PatientPrescriptions

