import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  IoSearchOutline,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoFlaskOutline,
  IoDocumentTextOutline,
  IoCallOutline,
  IoArrowForwardOutline,
  IoPulseOutline,
  IoWaterOutline,
  IoMedicalOutline,
  IoHeartOutline,
  IoEyeOutline,
  IoBodyOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoCheckmarkCircle,
  IoCardOutline,
  IoPersonOutline,
  IoMailOutline,
  IoShareSocialOutline,
  IoDownloadOutline,
} from 'react-icons/io5'

const testCategories = [
  { id: 'all', label: 'All Tests', icon: IoFlaskOutline, color: 'blue' },
  { id: 'blood', label: 'Blood Tests', icon: IoPulseOutline, color: 'red' },
  { id: 'urine', label: 'Urine Tests', icon: IoWaterOutline, color: 'yellow' },
  { id: 'imaging', label: 'Imaging', icon: IoMedicalOutline, color: 'purple' },
  { id: 'cardiac', label: 'Cardiac', icon: IoHeartOutline, color: 'pink' },
  { id: 'vision', label: 'Vision', icon: IoEyeOutline, color: 'indigo' },
  { id: 'body', label: 'Body Scan', icon: IoBodyOutline, color: 'green' },
]

const mockLabs = [
  {
    id: 'lab-1',
    labName: 'MediCare Diagnostics',
    rating: 4.8,
    reviewCount: 234,
    distance: '1.2 km',
    location: '123 Health Street, New York',
    phone: '+1-555-123-4567',
    email: 'info@medicarediagnostics.com',
    availability: 'Available today',
    nextSlot: '10:00 AM',
    homeCollection: true,
    reportTime: '24 hours',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Complete Blood Count (CBC)', price: 350, category: 'blood' },
      { name: 'Lipid Profile', price: 450, category: 'blood' },
      { name: 'Liver Function Test', price: 600, category: 'blood' },
      { name: 'Urine Analysis', price: 200, category: 'urine' },
      { name: 'X-Ray Chest', price: 800, category: 'imaging' },
    ],
    timings: ['Mon – Sat · 7:00 AM – 8:00 PM', 'Sunday · 8:00 AM – 6:00 PM'],
    certifications: ['NABL Accredited', 'ISO 15189'],
  },
  {
    id: 'lab-2',
    labName: 'HealthFirst Lab',
    rating: 4.6,
    reviewCount: 189,
    distance: '2.5 km',
    location: '456 Medical Avenue, New York',
    phone: '+1-555-234-5678',
    email: 'contact@healthfirstlab.com',
    availability: 'Available tomorrow',
    nextSlot: '09:00 AM',
    homeCollection: true,
    reportTime: '48 hours',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Thyroid Function Test', price: 550, category: 'blood' },
      { name: 'Diabetes Panel', price: 750, category: 'blood' },
      { name: 'ECG', price: 400, category: 'cardiac' },
      { name: 'Ultrasound Abdomen', price: 1200, category: 'imaging' },
    ],
    timings: ['Mon – Fri · 8:00 AM – 7:00 PM', 'Saturday · 9:00 AM – 5:00 PM'],
    certifications: ['NABL Accredited'],
  },
  {
    id: 'lab-3',
    labName: 'Precision Labs',
    rating: 4.9,
    reviewCount: 312,
    distance: '0.8 km',
    location: '789 Wellness Boulevard, New York',
    phone: '+1-555-345-6789',
    email: 'info@precisionlabs.com',
    availability: 'Available today',
    nextSlot: '11:30 AM',
    homeCollection: true,
    reportTime: '12 hours',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Vitamin D Test', price: 650, category: 'blood' },
      { name: 'HbA1c', price: 500, category: 'blood' },
      { name: 'MRI Scan', price: 3500, category: 'imaging' },
      { name: 'CT Scan', price: 2800, category: 'imaging' },
      { name: 'Eye Examination', price: 600, category: 'vision' },
    ],
    timings: ['24/7 Emergency Services', 'Regular: Mon – Sat · 6:00 AM – 10:00 PM'],
    certifications: ['NABL Accredited', 'ISO 15189', 'CAP Certified'],
  },
  {
    id: 'lab-4',
    labName: 'City Lab Center',
    rating: 4.5,
    reviewCount: 156,
    distance: '3.1 km',
    location: '321 Diagnostic Road, New York',
    phone: '+1-555-456-7890',
    email: 'support@citylabcenter.com',
    availability: 'Available today',
    nextSlot: '02:00 PM',
    homeCollection: false,
    reportTime: '36 hours',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=600&q=80',
    testsOffered: [
      { name: 'Kidney Function Test', price: 500, category: 'blood' },
      { name: 'Urine Culture', price: 400, category: 'urine' },
      { name: 'Stool Analysis', price: 300, category: 'body' },
    ],
    timings: ['Mon – Fri · 9:00 AM – 6:00 PM', 'Saturday · 9:00 AM – 4:00 PM'],
    certifications: ['NABL Accredited'],
  },
]

const mockReports = [
  {
    id: 'report-1',
    testName: 'Complete Blood Count (CBC)',
    labName: 'MediCare Diagnostics',
    date: '2025-01-10',
    status: 'completed',
    pdfFileUrl: null, // Actual PDF file URL uploaded by lab (null means not uploaded yet, or use sample PDF)
    pdfFileName: 'CBC_Report_2025-01-10.pdf', // Name of the PDF file
    downloadUrl: null, // Will be set from pdfFileUrl
    doctorId: 'doc-1', // Doctor who prescribed the test (treating doctor)
    doctorName: 'Dr. Sarah Mitchell',
    doctorSpecialty: 'Cardiology',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'report-2',
    testName: 'Lipid Profile',
    labName: 'HealthFirst Lab',
    date: '2025-01-08',
    status: 'completed',
    pdfFileUrl: null, // Actual PDF file URL uploaded by lab
    pdfFileName: 'Lipid_Profile_2025-01-08.pdf',
    downloadUrl: null,
    doctorId: 'doc-2', // Doctor who prescribed the test (treating doctor)
    doctorName: 'Dr. John Smith',
    doctorSpecialty: 'General Medicine',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'report-3',
    testName: 'Thyroid Function Test',
    labName: 'Precision Labs',
    date: '2025-01-12',
    status: 'pending',
    pdfFileUrl: null, // No PDF yet as status is pending
    pdfFileName: null,
    downloadUrl: null,
    doctorId: null, // No doctor associated with this test
    doctorName: null,
    doctorSpecialty: null,
    doctorImage: null,
  },
]

const mockUpcomingTests = [
  {
    id: 'test-1',
    testName: 'Liver Function Test',
    labName: 'MediCare Diagnostics',
    date: '2025-01-15',
    time: '10:00 AM',
    type: 'Home Collection',
    status: 'scheduled',
  },
  {
    id: 'test-2',
    testName: 'ECG',
    labName: 'HealthFirst Lab',
    date: '2025-01-16',
    time: '02:00 PM',
    type: 'Lab Visit',
    status: 'scheduled',
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Mock Prescriptions
const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: {
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-123-4567',
      email: 'sarah.mitchell@example.com',
    },
    issuedAt: '2025-01-10',
    status: 'active',
    diagnosis: 'Hypertension',
  },
  {
    id: 'presc-2',
    doctor: {
      name: 'Dr. Alana Rueter',
      specialty: 'Dentist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-234-5678',
      email: 'alana.rueter@example.com',
    },
    issuedAt: '2025-01-08',
    status: 'active',
    diagnosis: 'Dental Caries',
  },
  {
    id: 'presc-3',
    doctor: {
      name: 'Dr. Michael Brown',
      specialty: 'General Medicine',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031a?auto=format&fit=crop&w=400&q=80',
      phone: '+1-555-345-6789',
      email: 'michael.brown@example.com',
    },
    issuedAt: '2025-01-05',
    status: 'active',
    diagnosis: 'Common Cold',
  },
]

// Mock Patient Data
const mockPatientData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  dateOfBirth: '1990-05-15',
  gender: 'male',
  bloodGroup: 'O+',
  address: {
    line1: '123 Main Street',
    line2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
  },
}

// Mock doctors list for sharing
const mockDoctors = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiology',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-2',
    name: 'Dr. John Smith',
    specialty: 'General Medicine',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-3',
    name: 'Dr. James Wilson',
    specialty: 'Orthopedic',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'doc-4',
    name: 'Dr. Emily Chen',
    specialty: 'Neurology',
    image: 'https://images.unsplash.com/photo-1594824476968-48fd8d2d7dc2?auto=format&fit=crop&w=400&q=80',
  },
]

const PatientLaboratory = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [showHomeCollection, setShowHomeCollection] = useState('all')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [collectionType, setCollectionType] = useState('lab') // 'lab' or 'home'
  const [bookingStep, setBookingStep] = useState(1) // 1: Prescription, 2: Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [detailLabId, setDetailLabId] = useState(null)
  const [showAllReports, setShowAllReports] = useState(false)
  const [showAllTests, setShowAllTests] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [selectedDoctorId, setSelectedDoctorId] = useState(null)

  const detailLab = useMemo(
    () => mockLabs.find((lab) => lab.id === detailLabId) || null,
    [detailLabId]
  )

  const filteredLabs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return mockLabs
      .filter((lab) => {
        if (showHomeCollection === 'home' && !lab.homeCollection) return false
        if (showHomeCollection === 'lab' && lab.homeCollection) return false

        if (normalizedSearch) {
          const searchableText = [
            lab.labName,
            lab.location,
            ...lab.testsOffered.map((t) => t.name),
            ...lab.certifications,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(normalizedSearch)
        }

        if (selectedCategory !== 'all') {
          return lab.testsOffered.some((test) => test.category === selectedCategory)
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.rating - a.rating
        }
        if (sortBy === 'distance') {
          const aDist = parseFloat(a.distance.replace(' km', ''))
          const bDist = parseFloat(b.distance.replace(' km', ''))
          return aDist - bDist
        }
        return b.rating - a.rating
      })
  }, [searchTerm, selectedCategory, sortBy, showHomeCollection])

  useEffect(() => {
    if (showBookingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showBookingModal])

  useEffect(() => {
    if (!detailLab) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDetailLabId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [detailLab])

  const handleBookTest = (labId) => {
    const lab = mockLabs.find((l) => l.id === labId)
    if (lab) {
      setSelectedLab(lab)
      setSelectedPrescription(null)
      setCollectionType(lab.homeCollection ? 'home' : 'lab')
      setBookingStep(1)
      setShowBookingModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowBookingModal(false)
    setSelectedLab(null)
    setSelectedPrescription(null)
    setBookingStep(1)
  }

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedPrescription) {
      setBookingStep(2)
    }
  }

  const handlePreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1)
    }
  }

  // Format date helper
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

  // Generate PDF from prescription data (matching doctor's format)
  const generatePrescriptionPDF = (prescriptionData) => {
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

    // Get clinic info from prescription or use defaults
    const clinicName = prescriptionData.doctor?.clinicName || 'Medical Clinic'
    const clinicAddress = prescriptionData.doctor?.clinicAddress || 'Address not provided'
    const doctorPhone = prescriptionData.doctor?.phone || 'N/A'
    const doctorEmail = prescriptionData.doctor?.email || 'N/A'

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(clinicName, pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(clinicAddress, pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorPhone, margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorEmail, pageWidth - margin, contactY, { align: 'right' })
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
    doc.text(`Specialty: ${prescriptionData.doctor.specialty || 'General Physician'}`, margin, yPos + 4)
    const issuedDate = formatDate(prescriptionData.issuedAt)
    doc.text(`Date: ${issuedDate}`, margin, yPos + 8)

    // Patient Info (Right) - Get from prescription data or use defaults
    const patientName = prescriptionData.patientName || 'Patient Name'
    const patientAge = prescriptionData.patientAge || prescriptionData.age || 'N/A'
    const patientGender = prescriptionData.patientGender || prescriptionData.gender || 'N/A'
    doc.text(`Name: ${patientName}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${patientAge} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${patientGender}`, pageWidth - margin, yPos + 8, { align: 'right' })

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
        
        // Medication card with light gray background
        const cardHeight = 22
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
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
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
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = margin
        }
        
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

  // Handle View PDF button click
  const handleViewPrescriptionPDF = () => {
    if (!selectedPrescription) return
    
    try {
      const doc = generatePrescriptionPDF(selectedPrescription)
      // Generate PDF blob and open in new window
      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 1000)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedLab || !selectedPrescription) return
    
    setIsSubmitting(true)
    
    // Prepare booking request data with all details
    const bookingRequest = {
      labId: selectedLab.id,
      labName: selectedLab.labName,
      labAddress: selectedLab.location,
      labPhone: selectedLab.phone,
      labEmail: selectedLab.email || '',
      collectionType: collectionType, // 'lab' or 'home'
      patientDetails: {
        firstName: mockPatientData.firstName,
        lastName: mockPatientData.lastName,
        email: mockPatientData.email,
        phone: mockPatientData.phone,
        bloodGroup: mockPatientData.bloodGroup,
        address: mockPatientData.address,
      },
      doctorDetails: {
        name: selectedPrescription.doctor.name,
        specialty: selectedPrescription.doctor.specialty,
        phone: selectedPrescription.doctor.phone,
        email: selectedPrescription.doctor.email,
      },
      prescriptionDetails: {
        id: selectedPrescription.id,
        diagnosis: selectedPrescription.diagnosis,
        issuedAt: selectedPrescription.issuedAt,
        doctor: selectedPrescription.doctor,
        // Include full prescription data
        medications: selectedPrescription.medications || [],
        investigations: selectedPrescription.investigations || [],
        advice: selectedPrescription.advice || '',
      },
      requestDate: new Date().toISOString(),
      status: 'pending',
    }
    
    // Simulate API call to send request to lab
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Log the booking request (in real app, this would be an API call)
      console.log('Booking request sent to lab:', bookingRequest)
      
      // Show success message
      alert(`Booking request sent successfully to ${selectedLab.labName}!\n\nThey will review your request and respond with availability and pricing.`)
      
      // Close modal and reset state
      handleCloseModal()
    } catch (error) {
      console.error('Error sending booking request:', error)
      alert('Failed to send booking request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShareClick = (report) => {
    setSelectedReport(report)
    setSelectedDoctorId(null)
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
    setSelectedReport(null)
    setSelectedDoctorId(null)
  }

  const handleViewClick = (report) => {
    if (!report.pdfFileUrl) {
      alert('PDF report is not available yet. The lab will share the report PDF once it is ready.')
      return
    }
    setSelectedReport(report)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedReport(null)
  }

  const handleShareWithDoctor = async () => {
    if (!selectedReport) return

    setIsSharing(true)
    
    const patientId = 'pat-current' // In real app, get from auth
    const selectedDoctor = mockDoctors.find(doc => doc.id === selectedDoctorId)
    
    // If sharing with treating doctor (direct share)
    if (selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId) {
      // Direct share - save to localStorage for doctor to access
      try {
        const sharedReport = {
          ...selectedReport,
          sharedWithDoctorId: selectedDoctorId,
          sharedAt: new Date().toISOString(),
          patientId: patientId,
          // Ensure PDF URL is included
          pdfFileUrl: selectedReport.pdfFileUrl || selectedReport.downloadUrl,
          pdfFileName: selectedReport.pdfFileName || `${selectedReport.testName?.replace(/\s+/g, '_') || 'Report'}_${selectedReport.date || 'Report'}.pdf`,
        }
        
        // Save to patient-specific key
        const sharedReportsKey = `sharedLabReports_${patientId}`
        const existingReports = JSON.parse(localStorage.getItem(sharedReportsKey) || '[]')
        // Check if already shared
        const alreadyShared = existingReports.find(r => r.id === selectedReport.id && r.sharedWithDoctorId === selectedDoctorId)
        if (!alreadyShared) {
          existingReports.push(sharedReport)
          localStorage.setItem(sharedReportsKey, JSON.stringify(existingReports))
        }
        
        // Also save to doctor-specific key for easy access
        const doctorSharedReportsKey = `doctorSharedLabReports_${selectedDoctorId}`
        const doctorReports = JSON.parse(localStorage.getItem(doctorSharedReportsKey) || '[]')
        if (!doctorReports.find(r => r.id === selectedReport.id && r.patientId === patientId)) {
          doctorReports.push(sharedReport)
          localStorage.setItem(doctorSharedReportsKey, JSON.stringify(doctorReports))
        }
      } catch (error) {
        console.error('Error saving shared report:', error)
      }
      
      setTimeout(() => {
        setIsSharing(false)
        handleCloseShareModal()
        alert(`Report "${selectedReport.testName}" shared successfully with ${selectedReport.doctorName}!`)
      }, 1000)
    } else if (selectedDoctorId && selectedDoctor) {
      // Share with other doctor - requires booking, but save for when appointment is booked
      try {
        const sharedReport = {
          ...selectedReport,
          sharedWithDoctorId: selectedDoctorId,
          sharedAt: new Date().toISOString(),
          patientId: patientId,
          pendingAppointment: true, // Mark as pending appointment
        }
        
        // Save to patient-specific key
        const sharedReportsKey = `sharedLabReports_${patientId}`
        const existingReports = JSON.parse(localStorage.getItem(sharedReportsKey) || '[]')
        const alreadyShared = existingReports.find(r => r.id === selectedReport.id && r.sharedWithDoctorId === selectedDoctorId)
        if (!alreadyShared) {
          existingReports.push(sharedReport)
          localStorage.setItem(sharedReportsKey, JSON.stringify(existingReports))
        }
      } catch (error) {
        console.error('Error saving shared report:', error)
      }
      
      setTimeout(() => {
        setIsSharing(false)
        handleCloseShareModal()
        alert(`Report "${selectedReport.testName}" will be shared with ${selectedDoctor.name} after booking appointment.`)
        // Navigate to doctor details page with booking modal
        navigate(`/patient/doctors/${selectedDoctorId}?book=true`)
      }, 1000)
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar - Outside Card */}
          <div className="relative">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#11496c]">
                <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
              </span>
              <input
                id="lab-search"
                type="search"
                placeholder="Search by lab name, test, or location..."
            className="w-full rounded-lg border border-[rgba(17,73,108,0.3)] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.4)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

      {/* Category Filters - Scrollable with Icons and Text */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
              {testCategories.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategory === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                      isSelected
                        ? 'bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
                  : 'bg-white text-slate-700 border border-[rgba(17,73,108,0.3)] hover:bg-white hover:border-[rgba(17,73,108,0.4)] hover:shadow-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>

      {/* Home Collection / Lab Visit Filters */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHomeCollection('all')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'all'
                  ? 'border-[#11496c] bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
              : 'border-[rgba(17,73,108,0.3)] bg-white text-slate-700 hover:border-[rgba(17,73,108,0.4)] hover:bg-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setShowHomeCollection('home')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'home'
                  ? 'border-[#11496c] bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
              : 'border-[rgba(17,73,108,0.3)] bg-white text-slate-700 hover:border-[rgba(17,73,108,0.4)] hover:bg-white'
              }`}
            >
              Home Collection
            </button>
            <button
              type="button"
              onClick={() => setShowHomeCollection('lab')}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                showHomeCollection === 'lab'
                  ? 'border-[#11496c] bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)]'
              : 'border-[rgba(17,73,108,0.3)] bg-white text-slate-700 hover:border-[rgba(17,73,108,0.4)] hover:bg-white'
              }`}
            >
              Lab Visit
            </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reports</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{mockReports.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{mockUpcomingTests.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Labs</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{filteredLabs.length}</p>
        </div>
      </div>

      {/* Recent Reports Section */}
      {mockReports.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
              onClick={() => setShowAllReports(!showAllReports)}
            >
              {showAllReports ? 'Show Less' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {(showAllReports ? mockReports : mockReports.slice(0, 2)).map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
              >
                {/* Header with Report Info and Status Badge */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  {/* Report Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{report.testName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{report.labName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(report.date)}</p>
                  </div>

                  {/* Status Badge - Right Side */}
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${
                        report.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {report.status === 'completed' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Download and Share Parallel */}
                {report.status === 'completed' && (
                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Download actual PDF file uploaded by lab
                        if (report.pdfFileUrl) {
                          // If lab has uploaded a PDF file, download it
                          const link = document.createElement('a')
                          link.href = report.pdfFileUrl
                          link.download = report.pdfFileName || `${report.testName.replace(/\s+/g, '_')}_Report_${report.date}.pdf`
                          link.target = '_blank'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        } else {
                          // If no PDF uploaded yet, show message
                          alert('PDF report is not available yet. The lab will share the report PDF once it is ready.')
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
                    >
                      <IoDownloadOutline className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareClick(report)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#11496c] bg-white px-3 py-2 text-xs font-semibold text-[#11496c] transition-all hover:bg-[rgba(17,73,108,0.1)] active:scale-95"
                    >
                      <IoShareSocialOutline className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewClick(report)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-white shadow-sm shadow-[rgba(51,65,85,0.3)] transition-all hover:bg-slate-800 hover:shadow active:scale-95"
                      aria-label="View report details"
                    >
                      <IoEyeOutline className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tests Section */}
      {mockUpcomingTests.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Tests</h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#11496c] hover:text-[#0d3a52] transition-colors"
              onClick={() => setShowAllTests(!showAllTests)}
            >
              {showAllTests ? 'Show Less' : 'View All'}
            </button>
          </div>
          <div className="space-y-2">
            {(showAllTests ? mockUpcomingTests : mockUpcomingTests.slice(0, 2)).map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{test.testName}</p>
                  <p className="text-xs text-slate-600">{test.labName}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <IoCalendarOutline className="h-3 w-3" />
                    <span>{formatDate(test.date)}</span>
                    <IoTimeOutline className="h-3 w-3 ml-2" />
                    <span>{test.time}</span>
                  </div>
                </div>
                <span className="rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-1 text-[10px] font-semibold text-[#11496c]">
                  {test.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labs List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Available Laboratories</h2>
        <span className="text-sm text-slate-600">{filteredLabs.length} labs found</span>
      </div>

      {filteredLabs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">No laboratories found matching your criteria.</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLabs.map((lab) => (
            <article
              key={lab.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.15)]/30 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{lab.labName}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-0.5">{renderStars(lab.rating)}</div>
                          <span className="text-xs font-semibold text-slate-700">{lab.rating}</span>
                          <span className="text-xs text-slate-500">({lab.reviewCount})</span>
                        </div>
                      </div>
                      {lab.homeCollection && (
                        <span className="shrink-0 rounded-full bg-[rgba(17,73,108,0.1)] px-2.5 py-1 text-[10px] font-semibold text-[#11496c]">
                          Home Collection
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-600 sm:text-sm">
                      <div className="flex items-center gap-2">
                        <IoLocationOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{lab.location}</span>
                        <span className="shrink-0 font-semibold text-slate-700">{lab.distance}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="font-medium text-slate-700">{lab.availability}</span>
                        {lab.nextSlot && (
                          <span className="shrink-0 rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-xs font-semibold text-[#11496c]">
                            {lab.nextSlot}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <IoDocumentTextOutline className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>Reports in {lab.reportTime}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {lab.certifications.slice(0, 2).map((cert) => (
                        <span
                          key={cert}
                          className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBookTest(lab.id)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 sm:text-sm"
                  >
                    <IoCalendarOutline className="h-4 w-4" aria-hidden="true" />
                    Book Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLabId(lab.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
                  >
                    View
                  </button>
                  <a
                    href={`tel:${lab.phone.replace(/[^+\d]/g, '')}`}
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lab.labName} ${lab.location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <IoLocationOutline className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedLab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 py-3 sm:py-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Book Lab Test</h2>
                <p className="text-xs sm:text-sm text-slate-600">{selectedLab.labName}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-1.5 sm:p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 bg-slate-50 px-3 sm:px-6 py-2 sm:py-3">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                      bookingStep >= step
                        ? 'bg-[#11496c] text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {bookingStep > step ? <IoCheckmarkCircle className="h-5 w-5" /> : step}
                  </div>
                  {step < 2 && (
                    <div
                      className={`h-1 w-12 transition ${
                        bookingStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                      </div>
                    ))}
            </div>

            {/* Content */}
            <div className="p-3 sm:p-6">
              {/* Step 1: Select Tests & Prescription */}
              {bookingStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Collection Type */}
                  <div>
                    <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-slate-700">Collection Type</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setCollectionType('lab')}
                        disabled={!selectedLab.homeCollection && collectionType === 'home'}
                        className={`flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-4 transition ${
                          collectionType === 'lab'
                            ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${!selectedLab.homeCollection && collectionType === 'home' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 ${
                            collectionType === 'lab'
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoFlaskOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">Lab Visit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollectionType('home')}
                        disabled={!selectedLab.homeCollection}
                        className={`flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-4 transition ${
                          collectionType === 'home'
                            ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${!selectedLab.homeCollection ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div
                          className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 ${
                            collectionType === 'home'
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <IoHomeOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">Home Collection</span>
                      </button>
                    </div>
                  </div>

                  {/* Select Prescription */}
                  <div>
                    <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Select Prescription</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {mockPrescriptions.map((prescription) => {
                        const isSelected = selectedPrescription?.id === prescription.id
  return (
                          <button
                            key={prescription.id}
                            type="button"
                            onClick={() => setSelectedPrescription(prescription)}
                            className={`w-full flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-4 transition text-left ${
                              isSelected
                                ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={prescription.doctor.image}
                              alt={prescription.doctor.name}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl object-cover bg-slate-100 shrink-0"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{prescription.doctor.name}</p>
                              <p className="text-[10px] sm:text-xs text-[#11496c]">{prescription.doctor.specialty}</p>
                              <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-600">Diagnosis: {prescription.diagnosis}</p>
                            </div>
                            {isSelected && (
                              <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] shrink-0" />
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              </div>
              )}

              {/* Step 2: Confirmation */}
              {bookingStep === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                    <div className="mx-auto mb-2 sm:mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[rgba(17,73,108,0.15)]">
                      <IoShareSocialOutline className="h-6 w-6 sm:h-8 sm:w-8 text-[#11496c]" />
                    </div>
                    <h3 className="mb-1 sm:mb-2 text-lg sm:text-xl font-bold text-slate-900">Share & Confirm Booking</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Prescription and details will be shared with the lab</p>
                  </div>

                  {/* Patient Details */}
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                    <h4 className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold text-slate-900">
                      <IoPersonOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                      Patient Details
                    </h4>
                    <div className="space-y-2 sm:space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Name</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.firstName} {mockPatientData.lastName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Email</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right max-w-[55%] break-all">
                          {mockPatientData.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Phone</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.phone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Blood Group</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                          {mockPatientData.bloodGroup}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Address</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right max-w-[55%] break-words">
                          {mockPatientData.address.line1}, {mockPatientData.address.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Details */}
                  {selectedPrescription && (
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                      <h4 className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold text-slate-900">
                        <IoMedicalOutline className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                        Doctor Details
                      </h4>
                      <div className="flex flex-col items-center gap-2 sm:gap-3">
                        <img
                          src={selectedPrescription.doctor.image}
                          alt={selectedPrescription.doctor.name}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl object-cover ring-2 ring-slate-100 bg-slate-100"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPrescription.doctor.name)}&background=3b82f6&color=fff&size=160&bold=true`
                          }}
                        />
                        <div className="w-full space-y-2 sm:space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-600">Name</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                              {selectedPrescription.doctor.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-600">Specialty</span>
                            <span className="text-xs sm:text-sm font-semibold text-[#11496c] text-right">
                              {selectedPrescription.doctor.specialty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-600">Phone</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                              {selectedPrescription.doctor.phone}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-600">Email</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right max-w-[55%] break-all">
                              {selectedPrescription.doctor.email}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-slate-600">Diagnosis</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right max-w-[55%] break-words">
                              {selectedPrescription.diagnosis}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lab & Prescription PDF */}
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <h4 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold text-slate-900">{selectedLab.labName}</h4>
                        <p className="text-xs sm:text-sm text-slate-600">{selectedLab.location}</p>
                      </div>

                      <div className="space-y-2 sm:space-y-3 border-t border-slate-200 pt-2 sm:pt-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-2.5">
                          <span className="text-xs sm:text-sm font-medium text-slate-600">Collection Type</span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-900">
                            {collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}
                          </span>
                        </div>
                        <div>
                          <p className="mb-2 sm:mb-2.5 text-xs sm:text-sm font-medium text-slate-600">Prescription PDF</p>
                          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-red-50 shrink-0">
                                <IoDocumentTextOutline className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                  {selectedPrescription?.doctor.name} - Prescription
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-600">
                                  Issued: {selectedPrescription?.issuedAt ? formatDate(selectedPrescription.issuedAt) : '—'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleViewPrescriptionPDF}
                                className="rounded-lg bg-[rgba(17,73,108,0.1)] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#11496c] hover:bg-[rgba(17,73,108,0.15)] shrink-0 transition"
                              >
                                View PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex gap-2 sm:gap-3">
                {bookingStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                )}
                {bookingStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!selectedPrescription}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <IoArrowForwardOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span className="hidden sm:inline">Sending...</span>
                        <span className="sm:hidden">Sending</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Confirm Booking</span>
                        <span className="sm:hidden">Confirm</span>
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Details Modal */}
      {detailLab && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailLabId(null)
            }
          }}
        >
          <article className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setDetailLabId(null)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                aria-label="Close details"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-2 pr-8">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Laboratory overview
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    {detailLab.labName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">{detailLab.location}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(detailLab.rating)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{detailLab.rating}</span>
                  <span className="text-xs text-slate-500">({detailLab.reviewCount})</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {detailLab.homeCollection && (
                    <span className="rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#11496c]">
                      Home Collection
                    </span>
                  )}
                  {detailLab.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-700"
                    >
                      {cert}
                    </span>
          ))}
        </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 text-sm text-slate-600">
                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Contact Information
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Phone:</span>
                      <a
                        href={`tel:${detailLab.phone.replace(/[^+\d]/g, '')}`}
                        className="font-semibold text-[#11496c] hover:text-[#0d3a52] hover:underline break-all"
                      >
                        {detailLab.phone}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Email:</span>
                      <a
                        href={`mailto:${detailLab.email}`}
                        className="font-semibold text-[#11496c] hover:text-[#0d3a52] hover:underline break-all"
                      >
                        {detailLab.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[70px] sm:min-w-[80px] shrink-0">Distance:</span>
                      <span className="font-semibold text-slate-700">{detailLab.distance}</span>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Availability
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <li className="flex items-center gap-2 text-slate-700">
                      <IoTimeOutline className="h-4 w-4 text-slate-400" />
                      <span>{detailLab.availability}</span>
                      {detailLab.nextSlot && (
                        <span className="rounded-full bg-[rgba(17,73,108,0.1)] px-2 py-0.5 text-xs font-semibold text-[#11496c]">
                          {detailLab.nextSlot}
                        </span>
                      )}
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <IoDocumentTextOutline className="h-4 w-4 text-slate-400" />
                      <span>Reports in {detailLab.reportTime}</span>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4">
                  <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 sm:mb-3">
                    Operating Hours
                  </h3>
                  <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {detailLab.timings.map((timing) => (
                      <li key={timing} className="text-slate-700">
                        {timing}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className="flex-shrink-0 mt-auto border-t border-slate-200 p-4 sm:p-5">
              <div className="flex flex-row gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${detailLab.labName} ${detailLab.location}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Directions
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setDetailLabId(null)
                    handleBookTest(detailLab.id)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#11496c] px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52]"
                >
                  <IoCalendarOutline className="h-4 w-4" />
                  Book Test
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Share Report with Doctor</h2>
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900 mb-1">Report:</p>
                <p className="text-sm text-slate-600">{selectedReport.testName}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedReport.labName}</p>
              </div>

              {/* Treating Doctor - Direct Share */}
              {selectedReport.doctorId && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Your Treating Doctor (Direct Share):</p>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorId(selectedReport.doctorId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                      selectedDoctorId === selectedReport.doctorId
                        ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedReport.doctorImage}
                        alt={selectedReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.doctorName)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{selectedReport.doctorName}</h3>
                        <p className="text-xs text-slate-600">{selectedReport.doctorSpecialty}</p>
                      </div>
                      {selectedDoctorId === selectedReport.doctorId && (
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (treatment ongoing)</p>
                  </button>
                </div>
              )}

              {/* Other Doctors - Requires Booking */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Other Doctors {selectedReport.doctorId && '(Requires Booking)'}:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mockDoctors
                    .filter((doc) => !selectedReport.doctorId || doc.id !== selectedReport.doctorId)
                    .map((doctor) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          // Other doctor selected - directly open appointment booking
                          handleCloseShareModal()
                          // Navigate to doctor details page with booking modal
                          navigate(`/patient/doctors/${doctor.id}?book=true`)
                        }}
                        className="w-full rounded-xl border-2 p-3 text-left transition-all border-slate-200 bg-white hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=3b82f6&color=fff&size=128&bold=true`
                            }}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                            <p className="text-xs text-slate-600">{doctor.specialty}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-amber-600">⚠ Click to book appointment</p>
                      </button>
                    ))}
                </div>
              </div>

              {/* Info message only for treating doctor */}
              {selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId && (
                <div className="mt-4 rounded-lg bg-[rgba(17,73,108,0.1)] p-3">
                  <p className="text-xs text-[#0a2d3f]">
                    <strong>Direct Share:</strong> Report will be shared immediately with {selectedReport.doctorName}.
                  </p>
                </div>
              )}
            </div>

            {/* Footer buttons - only show for treating doctor */}
            {selectedReport.doctorId && (
              <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseShareModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                {selectedDoctorId === selectedReport.doctorId && (
                  <button
                    type="button"
                    onClick={handleShareWithDoctor}
                    disabled={isSharing || !selectedDoctorId}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSharing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <IoShareSocialOutline className="h-4 w-4" />
                        Share Now
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {/* If no treating doctor, show just close button */}
            {!selectedReport.doctorId && (
              <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseShareModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Report Details</h2>
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Report Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ 
                  background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                  boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                }}>
                  <IoFlaskOutline className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{selectedReport.testName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedReport.labName}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-3.5 w-3.5" />
                      <span>{formatDate(selectedReport.date)}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      selectedReport.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedReport.status === 'completed' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PDF Viewer - Show actual PDF file uploaded by lab */}
              {selectedReport.pdfFileUrl ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Report PDF</h4>
                  <div className="rounded-lg border border-slate-200 bg-white overflow-hidden" style={{ minHeight: '400px' }}>
                    <iframe
                      src={selectedReport.pdfFileUrl}
                      className="w-full h-full"
                      style={{ minHeight: '400px', border: 'none' }}
                      title={`${selectedReport.testName} Report`}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    PDF report is not available yet. The lab will share the report PDF once it is ready.
                  </p>
                </div>
              )}

              {/* Report Information */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Report Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Report ID:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Test Name:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.testName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Laboratory:</span>
                      <span className="text-xs font-semibold text-slate-900">{selectedReport.labName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Report Date:</span>
                      <span className="text-xs font-semibold text-slate-900">{formatDate(selectedReport.date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Status:</span>
                      <span className={`text-xs font-semibold ${
                        selectedReport.status === 'completed'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}>
                        {selectedReport.status === 'completed' ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associated Doctor Info */}
                {selectedReport.doctorName && (
                  <div className="rounded-2xl border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.1)]/50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Associated Doctor</h4>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedReport.doctorImage}
                        alt={selectedReport.doctorName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-[rgba(17,73,108,0.2)]"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedReport.doctorName)}&background=3b82f6&color=fff&size=128&bold=true`
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{selectedReport.doctorName}</p>
                        <p className="text-xs text-slate-600">{selectedReport.doctorSpecialty}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedReport.pdfFileUrl) {
                    // Download actual PDF file uploaded by lab
                    const link = document.createElement('a')
                    link.href = selectedReport.pdfFileUrl
                    link.download = selectedReport.pdfFileName || `${selectedReport.testName.replace(/\s+/g, '_')}_Report_${selectedReport.date}.pdf`
                    link.target = '_blank'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    handleCloseViewModal()
                  } else {
                    alert('PDF report is not available yet. The lab will share the report PDF once it is ready.')
                  }
                }}
                disabled={!selectedReport.pdfFileUrl}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50 disabled:cursor-not-allowed"
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

export default PatientLaboratory
