import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
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
} from 'react-icons/io5'

const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: {
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-10',
    status: 'active',
    diagnosis: 'Hypertension',
    symptoms: 'High blood pressure\nHeadaches\nChest discomfort',
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take with food. Monitor blood pressure regularly.' },
      { name: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning. Avoid potassium supplements.' },
    ],
    investigations: [
      { name: 'ECG', notes: 'Routine checkup' },
      { name: 'Blood Pressure Monitoring', notes: 'Daily' },
    ],
    advice: 'Maintain a low-sodium diet and regular exercise. Monitor blood pressure daily.',
    followUpAt: '2025-02-10',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Rx Care Pharmacy'],
      laboratories: ['MediCare Diagnostics'],
    },
  },
  {
    id: 'presc-2',
    doctor: {
      name: 'Dr. Alana Rueter',
      specialty: 'Dentist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-08',
    status: 'active',
    diagnosis: 'Dental Caries',
    symptoms: 'Tooth pain\nSensitivity to hot and cold',
    medications: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Complete the full course. Take with meals to avoid stomach upset.' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed for pain', duration: '5 days', instructions: 'Take with food. Do not exceed recommended dosage.' },
    ],
    investigations: [],
    advice: 'Maintain good oral hygiene. Avoid hard foods for the next few days.',
    followUpAt: '2025-01-22',
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['HealthHub Pharmacy'],
      laboratories: [],
    },
  },
  {
    id: 'presc-3',
    doctor: {
      name: 'Dr. Michael Brown',
      specialty: 'General Medicine',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
    },
    issuedAt: '2025-01-05',
    status: 'completed',
    diagnosis: 'Common Cold',
    medications: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed', duration: '5 days' },
    ],
    investigations: [],
    advice: 'Rest and stay hydrated. If symptoms persist, consult again.',
    followUpAt: null,
    pdfUrl: '#',
    sharedWith: {
      pharmacies: ['Neighborhood Family Pharmacy'],
      laboratories: [],
    },
  },
]

const mockPharmacies = [
  {
    id: 'pharm-1',
    name: 'Rx Care Pharmacy',
    distance: '0.9 km',
    location: '123 Market Street, New York',
    rating: 4.8,
    phone: '+1-555-214-0098',
  },
  {
    id: 'pharm-2',
    name: 'HealthHub Pharmacy',
    distance: '1.5 km',
    location: '77 Elm Avenue, New York',
    rating: 4.6,
    phone: '+1-555-909-4433',
  },
  {
    id: 'pharm-3',
    name: 'Neighborhood Family Pharmacy',
    distance: '2.6 km',
    location: '452 Cedar Lane, New York',
    rating: 4.2,
    phone: '+1-555-712-0080',
  },
  {
    id: 'pharm-4',
    name: 'City Center Wellness Pharmacy',
    distance: '3.1 km',
    location: '15 Harbor Road, New York',
    rating: 4.9,
    phone: '+1-555-367-5511',
  },
]

const mockLabs = [
  {
    id: 'lab-1',
    name: 'MediCare Diagnostics',
    distance: '1.2 km',
    location: '123 Health Street, New York',
    rating: 4.8,
    phone: '+1-555-123-4567',
  },
  {
    id: 'lab-2',
    name: 'HealthFirst Lab',
    distance: '2.5 km',
    location: '456 Medical Avenue, New York',
    rating: 4.6,
    phone: '+1-555-234-5678',
  },
  {
    id: 'lab-3',
    name: 'Precision Labs',
    distance: '0.8 km',
    location: '789 Wellness Boulevard, New York',
    rating: 4.9,
    phone: '+1-555-345-6789',
  },
  {
    id: 'lab-4',
    name: 'City Lab Center',
    distance: '3.1 km',
    location: '321 Diagnostic Road, New York',
    rating: 4.5,
    phone: '+1-555-456-7890',
  },
]

const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Alana Rueter',
    specialty: 'Dentist',
    distance: '1.2 km',
    location: 'Sunrise Dental Care, New York',
    rating: 4.8,
    consultationFee: 500,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-2',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic',
    distance: '3.1 km',
    location: 'Bone & Joint Clinic, New York',
    rating: 4.7,
    consultationFee: 750,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Chen',
    specialty: 'Neurology',
    distance: '1.8 km',
    location: 'Neuro Care Institute, New York',
    rating: 4.6,
    consultationFee: 900,
    image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-4',
    name: 'Dr. Michael Brown',
    specialty: 'General Medicine',
    distance: '0.9 km',
    location: 'Family Health Clinic, New York',
    rating: 4.9,
    consultationFee: 600,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
  },
]

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
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharePrescriptionId, setSharePrescriptionId] = useState(null)
  const [selectedDoctors, setSelectedDoctors] = useState([])
  const [shareSearchTerm, setShareSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)

  const filteredPrescriptions = mockPrescriptions.filter((presc) => {
    if (filter === 'all') return true
    return presc.status === filter
  })

  const currentPrescription = mockPrescriptions.find((p) => p.id === sharePrescriptionId)

  const filteredDoctors = mockDoctors.filter((doctor) => {
    const search = shareSearchTerm.toLowerCase()
    return (
      doctor.name.toLowerCase().includes(search) ||
      doctor.specialty.toLowerCase().includes(search) ||
      doctor.location.toLowerCase().includes(search)
    )
  })

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
      alert('Error generating PDF. Please try again.')
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
      alert('Error generating PDF. Please try again.')
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

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1">
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
                <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
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
              </div>
            </article>
          ))}
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
                              <span className="font-semibold">{doctor.distance}</span>
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
    </section>
  )
}

export default PatientPrescriptions

