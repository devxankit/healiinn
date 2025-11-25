import { useState } from 'react'
import jsPDF from 'jspdf'
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
} from 'react-icons/io5'

const mockPrescriptions = [
  {
    id: 'presc-1',
    doctor: {
      name: 'Dr. Emily Davis',
      specialty: 'General Physician',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98765 43210',
      email: 'emily.davis@cityhealthclinic.com',
    },
    patient: {
      name: 'John Doe',
      age: 32,
      gender: 'Male',
      phone: '+91 98765 12345',
      email: 'john.doe@example.com',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
      },
    },
    clinic: {
      name: 'City Health Clinic',
      address: '123 Health Street, Medical District, City - 400001',
      phone: '+91 98765 43210',
      email: 'info@cityhealthclinic.com',
    },
    issuedAt: '2024-12-15',
    diagnosis: 'Seasonal Flu',
    symptoms: ['High fever (102°F)', 'Headache', 'Body ache', 'Sore throat', 'Runny nose'],
    medications: [
      {
        id: 1,
        name: 'Paracetamol',
        strength: '500mg',
        dosage: '1 tablet',
        frequency: 'Every 6 hours',
        duration: '5 days',
        instructions: 'Take after meals',
      },
      {
        id: 2,
        name: 'Azithromycin',
        strength: '500mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '3 days',
        instructions: 'Take on empty stomach',
      },
      {
        id: 3,
        name: 'Cetirizine',
        strength: '10mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime',
        duration: '5 days',
        instructions: 'May cause drowsiness',
      },
    ],
    recommendedTests: [
      {
        name: 'Complete Blood Count (CBC)',
        instructions: 'Fasting not required',
      },
    ],
    medicalAdvice: [
      'Take adequate rest for 3-5 days',
      'Drink plenty of fluids (8-10 glasses of water daily)',
      'Avoid cold foods and beverages',
      'Use warm salt water gargling 3-4 times daily',
      'Return if fever persists beyond 3 days',
    ],
    followUpAt: '2024-12-22',
    pdfUrl: '#',
  },
  {
    id: 'presc-2',
    doctor: {
      name: 'Dr. Robert Wilson',
      specialty: 'Orthopedist',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98765 43211',
      email: 'robert.wilson@bonejointcare.com',
    },
    patient: {
      name: 'Sarah Smith',
      age: 28,
      gender: 'Female',
      phone: '+91 98765 23456',
      email: 'sarah.smith@example.com',
      address: {
        line1: '456 Oak Avenue',
        line2: '',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
      },
    },
    clinic: {
      name: 'Bone & Joint Care',
      address: '456 Medical Avenue, Health District, City - 400002',
      phone: '+91 98765 43211',
      email: 'info@bonejointcare.com',
    },
    issuedAt: '2024-11-20',
    diagnosis: 'Lower Back Pain',
    symptoms: ['Lower back stiffness', 'Pain on movement', 'Limited range of motion'],
    medications: [
      {
        id: 1,
        name: 'Ibuprofen',
        strength: '400mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '7 days',
        instructions: 'Take with food',
      },
      {
        id: 2,
        name: 'Muscle Relaxant',
        strength: '10mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime',
        duration: '5 days',
        instructions: 'May cause drowsiness',
      },
    ],
    recommendedTests: [
      {
        name: 'X-Ray Lumbar Spine',
        instructions: 'No special preparation required',
      },
      {
        name: 'MRI Lower Back',
        instructions: 'Fasting not required',
      },
      {
        name: 'Blood Test - ESR',
        instructions: 'Fasting not required',
      },
    ],
    medicalAdvice: [
      'Avoid heavy lifting for 2 weeks',
      'Apply hot compress 2-3 times daily',
      'Practice gentle stretching exercises',
      'Maintain proper posture while sitting',
    ],
    followUpAt: '2024-12-20',
    pdfUrl: '#',
  },
  {
    id: 'presc-3',
    doctor: {
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98765 43212',
      email: 'sarah.johnson@heartcareclinic.com',
    },
    patient: {
      name: 'Mike Johnson',
      age: 45,
      gender: 'Male',
      phone: '+91 98765 34567',
      email: 'mike.johnson@example.com',
      address: {
        line1: '789 Pine Street',
        line2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        postalCode: '10003',
      },
    },
    clinic: {
      name: 'Heart Care Clinic',
      address: '789 Cardiac Road, Medical Complex, City - 400003',
      phone: '+91 98765 43212',
      email: 'info@heartcareclinic.com',
    },
    issuedAt: '2024-12-15',
    diagnosis: 'Hypertension Management',
    symptoms: ['Elevated blood pressure', 'Occasional headaches'],
    medications: [
      {
        id: 1,
        name: 'Amlodipine',
        strength: '5mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in the morning',
      },
      {
        id: 2,
        name: 'Losartan',
        strength: '50mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with or without food',
      },
      {
        id: 3,
        name: 'Aspirin',
        strength: '75mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take after breakfast',
      },
      {
        id: 4,
        name: 'Atorvastatin',
        strength: '20mg',
        dosage: '1 tablet',
        frequency: 'Once daily at bedtime',
        duration: '30 days',
        instructions: 'Take with food',
      },
    ],
    recommendedTests: [
      {
        name: 'ECG',
        instructions: 'Routine checkup',
      },
      {
        name: 'Blood Pressure Monitoring',
        instructions: 'Daily',
      },
    ],
    medicalAdvice: [
      'Maintain a low-sodium diet',
      'Regular exercise (30 minutes daily)',
      'Monitor blood pressure daily',
      'Limit alcohol consumption',
      'Reduce stress through meditation',
    ],
    followUpAt: '2025-01-15',
    pdfUrl: '#',
  },
]

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
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPrescriptions = mockPrescriptions.filter((presc) => {
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-4 sm:p-5 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/40 hover:scale-[1.02] hover:border-emerald-300/80">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />
          <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-emerald-100/30 blur-xl transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="relative text-3xl sm:text-4xl font-bold text-emerald-600 drop-shadow-sm">{mockPrescriptions.length}</p>
          <p className="relative mt-2 text-xs sm:text-sm font-semibold text-emerald-700">Prescriptions</p>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.1)] via-[rgba(17,73,108,0.08)] to-[rgba(17,73,108,0.15)] p-4 sm:p-5 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(17,73,108,0.1)] hover:scale-[1.02] hover:border-[rgba(17,73,108,0.3)]">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[rgba(17,73,108,0.1)] blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />
          <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-[rgba(17,73,108,0.08)] blur-xl transition-opacity group-hover:opacity-100 opacity-50" />
          <p className="relative text-3xl sm:text-4xl font-bold text-[#11496c] drop-shadow-sm">
            {mockPrescriptions.reduce((sum, p) => sum + p.medications.length, 0)}
          </p>
          <p className="relative mt-2 text-xs sm:text-sm font-semibold text-[#11496c]">Medications</p>
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">No prescriptions found</p>
          <p className="mt-1 text-xs text-slate-500">Prescriptions shared with your pharmacy will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[rgba(17,73,108,0.2)] hover:shadow-md"
            >
              {/* Header Section - Name and Action Buttons */}
              <div className="flex items-start justify-between mb-3">
                {/* Patient Name - Heading */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{prescription.patient.name}</h3>
                  
                  {/* Follow-up Section - Orange Background (Below Name) */}
                  {prescription.followUpAt && (
                    <div className="flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1 mt-1.5 border border-orange-100 w-fit">
                      <IoCalendarOutline className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                      <span className="text-[10px] font-semibold text-orange-600">Follow-up:</span>
                      <span className="text-[10px] font-bold text-orange-700">{formatDate(prescription.followUpAt)}</span>
                    </div>
                  )}
                    </div>
                
                {/* Download Icon - Top Right */}
                <div className="flex items-center shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(prescription)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#11496c] bg-[#11496c] text-white shadow-sm transition-all hover:bg-[#0d3a52] hover:border-[#0d3a52] active:scale-95"
                    aria-label="Download PDF"
                    title="Download PDF"
                  >
                    <IoDownloadOutline className="h-5 w-5" />
                  </button>
                </div>
                    </div>

              {/* Information - Line by Line */}
              <div className="space-y-2.5">
                {/* Age and Gender */}
                <p className="text-sm text-slate-600">Age: {prescription.patient.age} years • {prescription.patient.gender}</p>
                
                {/* Condition/Diagnosis - Bold Heading */}
                <div>
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{prescription.diagnosis}</p>
                  </div>

                {/* Clinic Name */}
                <p className="text-sm text-slate-500">{prescription.clinic.name}</p>
                
                {/* Date */}
                <p className="text-sm text-slate-600">{formatDate(prescription.issuedAt)}</p>
                    </div>

              {/* Summary Pills - Light Blue Background */}
              <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
                <div className="flex items-center gap-1.5 rounded-full bg-[rgba(59,130,246,0.1)] px-2.5 py-1 border border-[rgba(59,130,246,0.2)]">
                  <IoBagHandleOutline className="h-3.5 w-3.5 text-blue-700" />
                  <span className="text-xs font-semibold text-blue-700">{prescription.medications.length} meds</span>
                    </div>
                {prescription.recommendedTests.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-[rgba(59,130,246,0.1)] px-2.5 py-1 border border-[rgba(59,130,246,0.2)]">
                    <IoFlaskOutline className="h-3.5 w-3.5 text-blue-700" />
                    <span className="text-xs font-semibold text-blue-700">{prescription.recommendedTests.length} tests</span>
                      </div>
                    )}
                  </div>

              {/* View Details Button - Dark Blue */}
                  <button
                    type="button"
                    onClick={() => setSelectedPrescription(prescription)}
                className="w-full rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95"
                  >
                    View Details
                  </button>
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
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
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

            {/* Prescription Content */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
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
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">Medications</h4>
                <div className="space-y-3 sm:space-y-4">
                  {selectedPrescription.medications.map((med) => (
                    <div
                      key={med.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[rgba(17,73,108,0.2)]"
                    >
                      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-100/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute right-3 top-3 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 text-xs sm:text-sm font-bold text-emerald-700 shadow-sm">
                        {med.id}
                      </span>
                      <h5 className="pr-10 sm:pr-12 text-base sm:text-lg font-bold text-slate-900 mb-3">
                        {med.name} {med.strength}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-600">Dosage:</span>
                          <p className="text-slate-900">{med.dosage}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Frequency:</span>
                          <p className="text-slate-900">{med.frequency}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Duration:</span>
                          <p className="text-slate-900">{med.duration}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-600">Instructions:</span>
                          <p className="text-slate-900">{med.instructions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Tests */}
              {selectedPrescription.recommendedTests && selectedPrescription.recommendedTests.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">Recommended Tests</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {selectedPrescription.recommendedTests.map((test, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start justify-between rounded-xl border border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-purple-50/40 p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300"
                      >
                        <div className="flex-1">
                          <p className="text-sm sm:text-base font-semibold text-slate-900">{test.name}</p>
                          {test.instructions && (
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">{test.instructions}</p>
                          )}
                        </div>
                        <IoFlaskOutline className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-purple-600 transition-transform group-hover:scale-110" />
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

              {/* Action Buttons - At Bottom */}
              <div className="flex flex-row gap-2 sm:gap-3 border-t border-slate-200 pt-4 sm:pt-5 mt-4 sm:mt-5">
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
        </div>
      )}
    </section>
  )
}

export default PharmacyPrescriptions

