import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  IoPeopleOutline,
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoCloseOutline,
  IoAddOutline,
  IoTrashOutline,
  IoHomeOutline,
  IoPaperPlaneOutline,
} from 'react-icons/io5'

// Mock test requests with prescription data from doctor
const mockTestRequests = [
  {
    id: 'req-1',
    requestId: 'test-3021',
    patientId: 'pat-1',
    patient: {
    name: 'John Doe',
    age: 45,
    gender: 'male',
    phone: '+1-555-123-4567',
    email: 'john.doe@example.com',
    address: {
      line1: '123 Main Street',
      line2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    },
    image: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160',
    },
    status: 'pending', // pending, accepted, bill_generated, paid, order_created, cancelled
    requestDate: '2025-01-15T10:00:00.000Z',
    // Doctor's prescription data
    prescription: {
      doctor: {
        name: 'Dr. Sarah Mitchell',
        qualification: 'MBBS, MD (Cardiology)',
        licenseNumber: 'MD-12345',
        clinicName: 'Heart Care Clinic',
        clinicAddress: '123 Medical Center Drive, Suite 200, New York, NY 10001',
        phone: '+1-555-123-4567',
        email: 'sarah.mitchell@example.com',
        specialization: 'Cardiologist',
      },
      diagnosis: 'Hypertension follow-up and routine checkup',
      investigations: [
        { name: 'Complete Blood Count (CBC)', notes: 'To check overall health status' },
        { name: 'Blood Glucose (Fasting)', notes: 'To monitor blood sugar levels' },
      ],
      medications: [
        { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take with food' },
      ],
      advice: 'Maintain a healthy diet and regular exercise. Monitor blood pressure daily.',
      followUpDate: '2025-02-15',
    },
    bill: null,
    orderId: null,
    collectionType: 'home', // 'home' or 'lab'
  },
  {
    id: 'req-2',
    requestId: 'test-3022',
    patientId: 'pat-2',
    patient: {
    name: 'Sarah Smith',
    age: 32,
    gender: 'female',
    phone: '+1-555-234-5678',
    email: 'sarah.smith@example.com',
    address: {
      line1: '456 Oak Avenue',
      line2: '',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
    },
    image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160',
    },
    status: 'accepted',
    requestDate: '2025-01-14T09:00:00.000Z',
    acceptedDate: '2025-01-14T14:00:00.000Z',
    collectionType: 'lab', // 'home' or 'lab'
    prescription: {
      doctor: {
        name: 'Dr. Priya Sharma',
        qualification: 'MBBS, MD',
        licenseNumber: 'MD-54321',
        clinicName: 'Wellness Clinic',
        clinicAddress: '456 Health Avenue, New York, NY 10002',
        phone: '+1-555-234-5678',
        email: 'priya.sharma@example.com',
        specialization: 'General Physician',
      },
      diagnosis: 'Routine health checkup',
      investigations: [
        { name: 'Lipid Profile', notes: 'To check cholesterol levels' },
      ],
      medications: [],
      advice: 'Continue with regular exercise and balanced diet.',
      followUpDate: null,
    },
    bill: null,
    orderId: null,
    collectionType: 'lab', // 'home' or 'lab'
  },
]

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatAddress = (address = {}) => {
  const { line1, line2, city, state, postalCode } = address
  return [line1, line2, [city, state].filter(Boolean).join(', '), postalCode]
    .filter(Boolean)
    .join(', ')
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'accepted':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'bill_generated':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'order_created':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'accepted':
      return 'Accepted'
    case 'bill_generated':
      return 'Bill Generated'
    case 'paid':
      return 'Paid'
    case 'order_created':
      return 'Order Created'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

const LaboratoryPatients = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [testRequests, setTestRequests] = useState(mockTestRequests)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBillGenerator, setShowBillGenerator] = useState(false)
  const [billRequest, setBillRequest] = useState(null)
  const [billItems, setBillItems] = useState([])
  const [deliveryCharge, setDeliveryCharge] = useState('50')
  const [additionalCharges, setAdditionalCharges] = useState('0')
  const [collectionFilter, setCollectionFilter] = useState('all') // 'all', 'home', 'lab'

  const filteredRequests = useMemo(() => {
    let filtered = testRequests

    // Filter by collection type
    if (collectionFilter !== 'all') {
      filtered = filtered.filter(request => request.collectionType === collectionFilter)
    }

    // Filter by search term
    if (searchTerm.trim()) {
    const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.patient.name.toLowerCase().includes(normalizedSearch) ||
          request.patient.phone.includes(normalizedSearch) ||
          request.patient.email.toLowerCase().includes(normalizedSearch) ||
          request.requestId.toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered
  }, [searchTerm, testRequests, collectionFilter])

  const handleAcceptRequest = async (request) => {
    if (!window.confirm(`Accept test request from ${request.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === request.id
            ? { ...req, status: 'accepted', acceptedDate: new Date().toISOString() }
            : req
        )
      )
      
      alert(`Request accepted! You can now generate bill manually.`)
    } catch (error) {
      alert('Failed to accept request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelRequest = async (request) => {
    if (!window.confirm(`Cancel test request from ${request.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === request.id
            ? { ...req, status: 'cancelled' }
            : req
        )
      )
      
      alert(`Request cancelled.`)
    } catch (error) {
      alert('Failed to cancel request. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenBillGenerator = (request) => {
    setBillRequest(request)
    // Initialize bill items with test names and default prices
    const testPrices = {
      'Complete Blood Count (CBC)': 450.0,
      'Blood Glucose (Fasting)': 250.0,
      'Lipid Profile': 600.0,
    }
    
    const items = request.prescription.investigations.map((inv) => ({
      name: inv.name,
      price: testPrices[inv.name] || 500.0,
    }))
    
    setBillItems(items)
    // Set delivery charge only for home collection
    if (request.collectionType === 'home') {
      setDeliveryCharge('50')
    } else {
      setDeliveryCharge('0')
    }
    setAdditionalCharges('0')
    setShowBillGenerator(true)
  }

  const handleCloseBillGenerator = () => {
    setShowBillGenerator(false)
    setBillRequest(null)
    setBillItems([])
    setDeliveryCharge('50')
    setAdditionalCharges('0')
  }

  const handleUpdateBillItemPrice = (index, price) => {
    const updatedItems = [...billItems]
    updatedItems[index].price = parseFloat(price) || 0
    setBillItems(updatedItems)
  }

  const handleUpdateBillItemName = (index, name) => {
    const updatedItems = [...billItems]
    updatedItems[index].name = name
    setBillItems(updatedItems)
  }

  const handleAddBillItem = () => {
    setBillItems([...billItems, { name: '', price: 0 }])
  }

  const handleRemoveBillItem = (index) => {
    const updatedItems = billItems.filter((_, i) => i !== index)
    setBillItems(updatedItems)
  }

  const handleGenerateBillManually = () => {
    if (!billRequest) return

    // Validate that all test items have names
    const emptyNames = billItems.filter(item => !item.name || item.name.trim() === '')
    if (emptyNames.length > 0) {
      alert('Please enter test name for all items')
      return
    }

    // Filter out items with empty names (just in case)
    const validItems = billItems.filter(item => item.name && item.name.trim() !== '')
    
    if (validItems.length === 0) {
      alert('Please add at least one test item')
      return
    }

    const testsAmount = validItems.reduce((sum, item) => sum + (item.price || 0), 0)
    // Add delivery charge only for home collection
    const delivery = billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0
    const additional = parseFloat(additionalCharges) || 0
    const totalAmount = testsAmount + delivery + additional

    if (totalAmount <= 0) {
      alert('Total amount must be greater than 0')
      return
    }

    const bill = {
      id: `bill-${billRequest.id}`,
      requestId: billRequest.requestId,
      testsAmount,
      deliveryCharge: delivery,
      additionalCharges: additional,
      totalAmount,
      items: validItems,
      generatedDate: new Date().toISOString(),
    }

    setTestRequests((prev) =>
      prev.map((req) =>
        req.id === billRequest.id
          ? { ...req, status: 'bill_generated', bill }
          : req
      )
    )

    handleCloseBillGenerator()
    alert(`Bill generated successfully! Total: ${formatCurrency(totalAmount)}`)
  }

  const handleSendBillToPatient = async (requestId) => {
    const request = testRequests.find((r) => r.id === requestId)
    if (!request || !request.bill) {
      alert('Bill not found. Please generate bill first.')
      return
    }

    if (!window.confirm(`Send bill to ${request.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      // Simulate API call to send bill to patient
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'bill_generated', billSent: true, billSentDate: new Date().toISOString() }
            : req
        )
      )
      
      alert(`Bill sent to ${request.patient.name} successfully!`)
    } catch (error) {
      alert('Failed to send bill. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateAndShareBill = async () => {
    if (!billRequest) return

    // Validate that all test items have names
    const emptyNames = billItems.filter(item => !item.name || item.name.trim() === '')
    if (emptyNames.length > 0) {
      alert('Please enter test name for all items')
      return
    }

    // Filter out items with empty names (just in case)
    const validItems = billItems.filter(item => item.name && item.name.trim() !== '')
    
    if (validItems.length === 0) {
      alert('Please add at least one test item')
      return
    }

    const testsAmount = validItems.reduce((sum, item) => sum + (item.price || 0), 0)
    // Add delivery charge only for home collection
    const delivery = billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0
    const additional = parseFloat(additionalCharges) || 0
    const totalAmount = testsAmount + delivery + additional

    if (totalAmount <= 0) {
      alert('Total amount must be greater than 0')
      return
    }

    if (!window.confirm(`Generate and share bill with ${billRequest.patient.name}?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const bill = {
        id: `bill-${billRequest.id}`,
        requestId: billRequest.requestId,
        testsAmount,
        deliveryCharge: delivery,
        additionalCharges: additional,
        totalAmount,
        items: validItems,
        generatedDate: new Date().toISOString(),
      }

      // Update request with bill
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === billRequest.id
            ? { ...req, status: 'bill_generated', bill }
            : req
        )
      )

      // Simulate API call to send bill to patient
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Update request with bill sent status
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === billRequest.id
            ? { ...req, status: 'bill_generated', bill, billSent: true, billSentDate: new Date().toISOString() }
            : req
        )
      )
      
      handleCloseBillGenerator()
      alert(`Bill generated and shared with ${billRequest.patient.name} successfully!`)
    } catch (error) {
      alert('Failed to generate and share bill. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsPaid = async (requestId) => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTestRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: 'paid' }
            : req
        )
      )
      
      // Create order after payment
      setTimeout(() => {
        handleCreateOrder(requestId)
      }, 500)
      
      alert(`Payment confirmed! Order will be created.`)
    } catch (error) {
      alert('Failed to mark as paid. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateOrder = async (requestId) => {
    const request = testRequests.find((r) => r.id === requestId)
    if (!request) return

    const orderId = `order-${Date.now()}`
    
    setTestRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: 'order_created', orderId }
          : req
      )
    )

    alert(`Order created: ${orderId}`)
    // Navigate to orders page
    navigate('/laboratory/orders')
  }

  const handleDownloadPDF = (request) => {
    // Generate PDF using jsPDF matching doctor module format exactly
    const prescriptionData = request.prescription
    const patientData = request.patient
    const doctorInfo = prescriptionData.doctor
    
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
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
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
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
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
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    doc.text(`Name: ${patientData.name}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${patientData.age} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${patientData.gender}`, pageWidth - margin, yPos + 8, { align: 'right' })

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
        // Check if we need a new page
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
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
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
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
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
    if (prescriptionData.followUpDate) {
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
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Save PDF
    const fileName = `Prescription_${patientData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleViewPDF = (request) => {
    // Generate PDF for viewing (same as download but opens in new window)
    const prescriptionData = request.prescription
    const patientData = request.patient
    const doctorInfo = prescriptionData.doctor
    
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
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
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
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
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
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    doc.text(`Name: ${patientData.name}`, pageWidth - margin, yPos, { align: 'right' })
    doc.text(`Age: ${patientData.age} years`, pageWidth - margin, yPos + 4, { align: 'right' })
    doc.text(`Gender: ${patientData.gender}`, pageWidth - margin, yPos + 8, { align: 'right' })

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
        // Check if we need a new page
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
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
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
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
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
    if (prescriptionData.followUpDate) {
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
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Open PDF in new window for viewing
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Filter Tabs - Home Collection & Lab Visit */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Requests', icon: IoFlaskOutline },
          { key: 'home', label: 'Home Collection', icon: IoHomeOutline },
          { key: 'lab', label: 'Lab Visit', icon: IoLocationOutline },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setCollectionFilter(tab.key)}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                collectionFilter === tab.key
                  ? 'bg-[#11496c] text-white shadow-md shadow-[rgba(17,73,108,0.3)]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:bg-[rgba(17,73,108,0.05)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, phone, email, or request ID..."
          className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Test Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No test requests found matching your search.
          </p>
        ) : (
          filteredRequests.map((request) => (
            <article
              key={request.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
            >
              {/* Header: Patient Name & Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{request.patient.name}</h3>
                  <p className="text-sm text-slate-600">Request ID: {request.requestId}</p>
                </div>
                {/* Status and Collection Type Badges - Stacked */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Status Badge - Smaller */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    request.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                      : request.status === 'accepted'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : request.status === 'cancelled'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  }`}>
                    {request.status === 'pending' && <IoTimeOutline className="h-3 w-3" />}
                    {request.status === 'accepted' && <IoCheckmarkCircleOutline className="h-3 w-3" />}
                    {request.status === 'cancelled' && <IoCloseCircleOutline className="h-3 w-3" />}
                    {getStatusLabel(request.status)}
                  </span>
                  {/* Collection Type Badge - Below Status */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    request.collectionType === 'home'
                      ? 'bg-orange-50 text-orange-700 border border-orange-300'
                      : 'bg-blue-50 text-blue-700 border border-blue-300'
                  }`}>
                    {request.collectionType === 'home' ? (
                      <>
                        <IoHomeOutline className="h-3 w-3" />
                        Home Collection
                      </>
                    ) : (
                      <>
                        <IoLocationOutline className="h-3 w-3" />
                        Lab Visit
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Contact Information - Line by line with proper spacing */}
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${request.patient.phone}`}
                  className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#11496c] transition-colors"
                >
                  <IoCallOutline className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-medium">{request.patient.phone}</span>
                </a>
                <a
                  href={`mailto:${request.patient.email}`}
                  className="flex items-center gap-3 text-sm text-slate-700 hover:text-[#11496c] transition-colors"
                >
                  <IoMailOutline className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-medium">{request.patient.email}</span>
                </a>
              </div>

              {/* Prescription Details - Light Grey Box */}
              <div className="rounded-lg bg-slate-100 p-4 border border-slate-200">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">Prescribed by:</span> <span className="font-bold text-slate-900">{request.prescription.doctor.name}</span>
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Diagnosis:</span> {request.prescription.diagnosis}
                  </p>
                  {/* Test Tags - Purple Badges with proper spacing */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {request.prescription.investigations.map((inv, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200"
                      >
                        <IoFlaskOutline className="h-3.5 w-3.5 shrink-0" />
                        <span>{inv.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bill Information */}
              {request.bill && (
                <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 border-2 border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <IoReceiptOutline className="h-4 w-4" />
                      Bill Generated
                    </p>
                    {request.billSent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-800 border border-emerald-300">
                        <IoCheckmarkCircleOutline className="h-3 w-3" />
                        Sent to Patient
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Tests Amount:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(request.bill.testsAmount || request.bill.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-emerald-300">
                      <span className="text-base font-bold text-emerald-900">Total:</span>
                      <span className="text-base font-bold text-emerald-900">{formatCurrency(request.bill.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Information */}
              {request.orderId && (
                <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                  <p className="text-xs font-semibold text-green-700">Order Created: {request.orderId}</p>
                </div>
              )}

              {/* Action Buttons - Enhanced Square Design */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                {/* Accept Button (only for pending) */}
                {request.status === 'pending' && (
                <button
                    onClick={() => handleAcceptRequest(request)}
                    disabled={isProcessing}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Accept"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                
                {/* Cancel Button (only for pending) */}
                {request.status === 'pending' && (
                  <button
                    onClick={() => handleCancelRequest(request)}
                    disabled={isProcessing}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-red-500 bg-white text-red-600 shadow-sm shadow-red-500/10 transition-all duration-200 hover:bg-red-50 hover:border-red-600 hover:shadow-md hover:shadow-red-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Cancel"
                  >
                    <IoCloseCircleOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                
                {/* Generate Bill Button (for accepted status without bill) */}
                {(request.status === 'accepted' || request.status === 'pending') && !request.bill && (
                  <button
                    onClick={() => handleOpenBillGenerator(request)}
                    disabled={isProcessing}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Generate Bill"
                  >
                    <IoReceiptOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Mark as Paid (for bill_generated status) */}
                {request.status === 'bill_generated' && (
                  <button
                    onClick={() => handleMarkAsPaid(request.id)}
                    disabled={isProcessing}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Mark as Paid"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Send Bill to Patient (for accepted/bill_generated status) */}
                {request.bill && !request.billSent && (
                  <button
                    onClick={() => handleSendBillToPatient(request.id)}
                    disabled={isProcessing}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/40 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Send Bill"
                  >
                    <IoMailOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Download Button (always visible) */}
                <button
                  onClick={() => handleDownloadPDF(request)}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white shadow-md shadow-[rgba(17,73,108,0.3)] transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(17,73,108,0.4)] hover:scale-105 active:scale-95"
                  aria-label="Download PDF"
                >
                  <IoDownloadOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
                
                {/* View Button (always visible) */}
                <button
                  onClick={() => handleViewPDF(request)}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-slate-700 shadow-sm shadow-slate-200/50 transition-all duration-200 hover:border-[#11496c] hover:bg-[#11496c] hover:text-white hover:shadow-md hover:shadow-[rgba(17,73,108,0.2)] hover:scale-105 active:scale-95"
                  aria-label="View PDF"
                >
                  <IoEyeOutline className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <h2 className="text-lg font-bold text-slate-900">Test Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Patient Information */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedRequest.patient.image}
                  alt={selectedRequest.patient.name}
                  className="h-20 w-20 rounded-xl object-cover bg-slate-100"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRequest.patient.name)}&background=3b82f6&color=fff&size=160&bold=true`
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRequest.patient.name}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.patient.age} years, {selectedRequest.patient.gender}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Request ID: {selectedRequest.requestId}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedRequest.patient.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedRequest.patient.email}</p>
                  <p><span className="font-medium">Address:</span> {formatAddress(selectedRequest.patient.address)}</p>
                </div>
              </div>

              {/* Doctor Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoMedicalOutline className="h-4 w-4" />
                  Doctor Information
                </h4>
                <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg">
                  <p><span className="font-medium">Name:</span> {selectedRequest.prescription.doctor.name}</p>
                  <p><span className="font-medium">Qualification:</span> {selectedRequest.prescription.doctor.qualification}</p>
                  <p><span className="font-medium">Clinic:</span> {selectedRequest.prescription.doctor.clinicName}</p>
                  <p><span className="font-medium">Specialization:</span> {selectedRequest.prescription.doctor.specialization}</p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Diagnosis</h4>
                <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-200">{selectedRequest.prescription.diagnosis}</p>
                </div>

              {/* Recommended Tests */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <IoFlaskOutline className="h-4 w-4" />
                  Recommended Tests
                </h4>
                <div className="space-y-2">
                  {selectedRequest.prescription.investigations.map((inv, idx) => (
                    <div key={idx} className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="font-medium text-sm text-purple-900">{inv.name}</p>
                      {inv.notes && <p className="text-xs text-purple-700 mt-1">{inv.notes}</p>}
              </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              {selectedRequest.prescription.medications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Medications</h4>
                  <div className="space-y-2">
                    {selectedRequest.prescription.medications.map((med, idx) => (
                      <div key={idx} className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <p className="font-medium text-sm text-amber-900">{med.name}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-amber-700">
                          <p>Dosage: {med.dosage}</p>
                          <p>Frequency: {med.frequency}</p>
                          <p>Duration: {med.duration}</p>
                          {med.instructions && <p>Instructions: {med.instructions}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical Advice */}
              {selectedRequest.prescription.advice && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Medical Advice</h4>
                  <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">{selectedRequest.prescription.advice}</p>
                </div>
              )}

              {/* Follow-up */}
              {selectedRequest.prescription.followUpDate && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <IoCalendarOutline className="h-4 w-4" />
                    Follow-up Appointment
                  </h4>
                  <p className="text-sm">{formatDate(selectedRequest.prescription.followUpDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Bill Generator Modal */}
      {showBillGenerator && billRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={handleCloseBillGenerator}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoReceiptOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Generate Bill</h2>
                    <p className="text-xs text-white/80">Create invoice for patient</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseBillGenerator}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              {/* Enhanced Patient Information */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200">
                <div className="flex items-center gap-4">
                  <img
                    src={billRequest.patient.image}
                    alt={billRequest.patient.name}
                    className="h-16 w-16 rounded-xl object-cover bg-white shadow-sm border-2 border-white"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(billRequest.patient.name)}&background=11496c&color=fff&size=160&bold=true`
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">{billRequest.patient.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <IoPersonOutline className="h-3.5 w-3.5" />
                        <span>{billRequest.patient.age} years, {billRequest.patient.gender}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <IoDocumentTextOutline className="h-3.5 w-3.5" />
                        <span>ID: {billRequest.requestId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <IoFlaskOutline className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Test Items</h4>
                  </div>
                  <button
                    onClick={handleAddBillItem}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.3)] transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoAddOutline className="h-4 w-4" />
                    Add Test
                  </button>
                </div>
                <div className="space-y-3">
                  {billItems.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <IoFlaskOutline className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No test items added</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Add Test" to add items</p>
                    </div>
                  ) : (
                    billItems.map((item, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                        <div className="flex items-end gap-3">
                          {/* Number Badge */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-xs font-bold text-purple-700">
                            {index + 1}
                          </div>
                          
                          {/* Test Name - Takes more space, bigger */}
                          <div className="flex-[2] min-w-0">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Item Name</label>
                            <input
                              type="text"
                              placeholder="Enter test name"
                              value={item.name}
                              onChange={(e) => handleUpdateBillItemName(index, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                            />
                          </div>
                          
                          {/* Amount - Smaller width */}
                          <div className="w-20 sm:w-24">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.price}
                              onChange={(e) => handleUpdateBillItemPrice(index, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                            />
                          </div>
                          
                          {/* Remove Button - Smaller */}
                          <button
                            onClick={() => handleRemoveBillItem(index)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all hover:bg-red-50 hover:border-red-300 hover:scale-110 active:scale-95 mb-0.5"
                            aria-label="Remove test"
                            title="Remove Test"
                          >
                            <IoTrashOutline className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivery Charge Input - Only for Home Collection */}
              {billRequest && billRequest.collectionType === 'home' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Delivery Charge
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter delivery charge"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Enhanced Bill Summary */}
              <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <IoReceiptOutline className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Bill Summary</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-600">Tests Amount</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(billItems.reduce((sum, item) => sum + (item.price || 0), 0))}</span>
                  </div>
                  {/* Delivery Charge - Only for Home Collection */}
                  {billRequest && billRequest.collectionType === 'home' && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-slate-600">Delivery Charge</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(deliveryCharge) || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-slate-300">
                    <span className="text-lg font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {formatCurrency(
                        billItems.reduce((sum, item) => sum + (item.price || 0), 0) +
                        (billRequest && billRequest.collectionType === 'home' ? (parseFloat(deliveryCharge) || 0) : 0) +
                        (parseFloat(additionalCharges) || 0)
                      )}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <IoCalendarOutline className="h-3.5 w-3.5" />
                    <span>Bill Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={handleCloseBillGenerator}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateBillManually}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <IoReceiptOutline className="h-4 w-4" />
                  Generate Bill
                </button>
                <button
                  onClick={handleGenerateAndShareBill}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#11496c] to-[#0d3a52] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(17,73,108,0.3)] transition-all hover:from-[#0d3a52] hover:to-[#0a2d3f] hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <>
                      <IoPaperPlaneOutline className="h-4 w-4" />
                      Share Bill
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

export default LaboratoryPatients
