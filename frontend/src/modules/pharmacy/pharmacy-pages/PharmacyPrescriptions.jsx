import { useState } from 'react'
import {
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoShareSocialOutline,
  IoCloseOutline,
  IoFlaskOutline,
  IoBagHandleOutline,
  IoCalendarOutline,
  IoSearchOutline,
  IoPrintOutline,
  IoExpandOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCheckmarkCircleOutline,
  IoPersonCircleOutline,
  IoReceiptOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoTrashOutline,
  IoPaperPlaneOutline,
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
  const [showBillModal, setShowBillModal] = useState(false)
  const [billItems, setBillItems] = useState([])
  const [deliveryCharge, setDeliveryCharge] = useState(0)

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

  const handleDownloadPDF = (prescription) => {
    if (prescription.pdfUrl && prescription.pdfUrl !== '#') {
      const link = document.createElement('a')
      link.href = prescription.pdfUrl
      link.download = `prescription-${prescription.doctor.name.replace(/\s+/g, '-')}-${prescription.issuedAt}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('PDF is being generated. Please try again in a moment.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleGenerateBill = (prescription) => {
    // Initialize with one empty row for manual entry
    setBillItems([
      {
        id: Date.now(),
        tabletName: '',
        amount: 0,
        days: 0,
        total: 0,
      },
    ])
    setDeliveryCharge(0) // Reset delivery charge
    setShowBillModal(true)
  }

  const handleBillItemChange = (id, field, value) => {
    setBillItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'amount' || field === 'days') {
            updatedItem.total = (updatedItem.amount || 0) * (updatedItem.days || 0)
          }
          return updatedItem
        }
        return item
      })
    )
  }

  const handleAddBillRow = () => {
    setBillItems((prevItems) => [
      ...prevItems,
      {
        id: Date.now() + Math.random(),
        tabletName: '',
        amount: 0,
        days: 0,
        total: 0,
      },
    ])
  }

  const handleDeleteBillRow = (id) => {
    setBillItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const calculateBillTotal = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.total || 0), 0)
    return subtotal + (deliveryCharge || 0)
  }

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const handlePrintBill = () => {
    window.print()
  }

  const handleSendBillToPatient = async () => {
    if (!selectedPrescription || billItems.length === 0) {
      alert('Please add at least one bill item before sending to patient.')
      return
    }

    const totalAmount = calculateBillTotal()
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`
    const patientName = selectedPrescription.patient.name
    const patientEmail = selectedPrescription.patient.email
    const patientPhone = selectedPrescription.patient.phone

    // Confirm before sending
    const confirmMessage = `Send bill PDF to patient?\n\nPatient: ${patientName}\nEmail: ${patientEmail || 'N/A'}\nPhone: ${patientPhone || 'N/A'}\nTotal Amount: ${formatCurrency(totalAmount)}\n\nThe bill will be sent in PDF format to the patient.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // Generate PDF content first
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const subtotal = calculateSubtotal()
      const tax = 0
      const delivery = deliveryCharge || 0
      const total = subtotal + tax + delivery

      // Generate HTML content for PDF (same as handleDownloadBillPDF)
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill - ${patientName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1e293b;
      background: white;
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
      font-weight: bold;
    }
    .header .subtitle {
      color: #64748b;
      margin-top: 5px;
      font-size: 14px;
    }
    .bill-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .info-section {
      flex: 1;
      min-width: 250px;
      margin-bottom: 20px;
    }
    .info-section h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    .info-value {
      color: #1e293b;
      text-align: right;
    }
    .table-container {
      margin: 30px 0;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background: linear-gradient(to right, #f1f5f9, #e2e8f0);
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      color: #1e293b;
      border-bottom: 2px solid #cbd5e1;
      font-size: 14px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    tbody tr:hover {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(to right, #dbeafe, #e0f2fe);
      border: 2px solid #3b82f6;
      border-radius: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .summary-label {
      font-weight: 600;
      color: #1e293b;
    }
    .summary-value {
      font-weight: bold;
      color: #1e40af;
    }
    .total-row {
      border-top: 2px solid #3b82f6;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
    }
    .total-label {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
    }
    .total-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Pharmacy Bill</h1>
    <div class="subtitle">Healiinn - Your Health Partner</div>
  </div>

  <div class="bill-info">
    <div class="info-section">
      <h3>Pharmacy Information</h3>
      <div class="info-row">
        <span class="info-label">Pharmacy:</span>
        <span class="info-value">${selectedPrescription.clinic.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value">${selectedPrescription.clinic.address || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${selectedPrescription.clinic.phone || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${selectedPrescription.clinic.email || 'N/A'}</span>
      </div>
    </div>

    <div class="info-section">
      <h3>Bill Details</h3>
      <div class="info-row">
        <span class="info-label">Bill Number:</span>
        <span class="info-value">${billNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${currentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">${currentTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Prescription ID:</span>
        <span class="info-value">${selectedPrescription.id}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h3>Patient Information</h3>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${selectedPrescription.patient.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Age:</span>
      <span class="info-value">${selectedPrescription.patient.age} years</span>
    </div>
    <div class="info-row">
      <span class="info-label">Gender:</span>
      <span class="info-value">${selectedPrescription.patient.gender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${selectedPrescription.patient.phone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${selectedPrescription.patient.email || 'N/A'}</span>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th class="text-center">S.No</th>
          <th>Medicine Name</th>
          <th class="text-right">Amount/Day</th>
          <th class="text-center">Days</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${billItems.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.tabletName || 'N/A'}</td>
            <td class="text-right">${formatCurrency(item.amount || 0)}</td>
            <td class="text-center">${item.days || 0}</td>
            <td class="text-right"><strong>${formatCurrency(item.total || 0)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row">
      <span class="summary-label">Subtotal:</span>
      <span class="summary-value">${formatCurrency(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Tax (GST):</span>
      <span class="summary-value">${formatCurrency(tax)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Delivery Charge:</span>
      <span class="summary-value">${formatCurrency(delivery)}</span>
    </div>
    <div class="summary-row total-row">
      <span class="total-label">Total Amount:</span>
      <span class="total-value">${formatCurrency(total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This is a computer-generated bill. No signature required.</p>
    <p style="margin-top: 10px;">Generated on ${currentDate} at ${currentTime}</p>
  </div>
</body>
</html>
      `

      // Simulate API call to send bill PDF to patient
      // In real app, this would be an API call to backend that sends PDF via email/SMS
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const billData = {
        billNumber,
        prescriptionId: selectedPrescription.id,
        patientId: selectedPrescription.patient.id || 'pat-1',
        patientName,
        patientEmail,
        patientPhone,
        billItems: billItems.map(item => ({
          tabletName: item.tabletName,
          amount: item.amount,
          days: item.days,
          total: item.total,
        })),
        subtotal: calculateSubtotal(),
        tax: 0,
        deliveryCharge: deliveryCharge || 0,
        totalAmount,
        pdfContent, // Include PDF content
        generatedAt: new Date().toISOString(),
      }

      // Log the bill request (in real app, this would be an API call)
      console.log('Bill PDF sent to patient:', billData)

      // Show success message
      alert(`Bill PDF sent successfully to ${patientName}!\n\nBill Number: ${billNumber}\nTotal Amount: ${formatCurrency(totalAmount)}\n\nThe patient will receive the bill in PDF format via email/notification.`)

    } catch (error) {
      console.error('Error sending bill to patient:', error)
      alert('Failed to send bill to patient. Please try again.')
    }
  }

  const handleDownloadBillPDF = () => {
    if (!selectedPrescription || billItems.length === 0) {
      alert('Please add at least one bill item before generating PDF.')
      return
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const billNumber = `BILL-${Date.now().toString().slice(-6)}`
    const subtotal = calculateSubtotal()
    const tax = 0 // GST can be calculated if needed
    const delivery = deliveryCharge || 0
    const total = subtotal + tax + delivery

    // Generate HTML content for PDF
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill - ${selectedPrescription.patient.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1e293b;
      background: white;
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
      font-weight: bold;
    }
    .header .subtitle {
      color: #64748b;
      margin-top: 5px;
      font-size: 14px;
    }
    .bill-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .info-section {
      flex: 1;
      min-width: 250px;
      margin-bottom: 20px;
    }
    .info-section h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #475569;
    }
    .info-value {
      color: #1e293b;
      text-align: right;
    }
    .table-container {
      margin: 30px 0;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background: linear-gradient(to right, #f1f5f9, #e2e8f0);
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      color: #1e293b;
      border-bottom: 2px solid #cbd5e1;
      font-size: 14px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    tbody tr:hover {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(to right, #dbeafe, #e0f2fe);
      border: 2px solid #3b82f6;
      border-radius: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .summary-label {
      font-weight: 600;
      color: #1e293b;
    }
    .summary-value {
      font-weight: bold;
      color: #1e40af;
    }
    .total-row {
      border-top: 2px solid #3b82f6;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
    }
    .total-label {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
    }
    .total-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Pharmacy Bill</h1>
    <div class="subtitle">Healiinn - Your Health Partner</div>
  </div>

  <div class="bill-info">
    <div class="info-section">
      <h3>Pharmacy Information</h3>
      <div class="info-row">
        <span class="info-label">Pharmacy:</span>
        <span class="info-value">${selectedPrescription.clinic.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value">${selectedPrescription.clinic.address || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${selectedPrescription.clinic.phone || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${selectedPrescription.clinic.email || 'N/A'}</span>
      </div>
    </div>

    <div class="info-section">
      <h3>Bill Details</h3>
      <div class="info-row">
        <span class="info-label">Bill Number:</span>
        <span class="info-value">${billNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${currentDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">${currentTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Prescription ID:</span>
        <span class="info-value">${selectedPrescription.id}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h3>Patient Information</h3>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${selectedPrescription.patient.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Age:</span>
      <span class="info-value">${selectedPrescription.patient.age} years</span>
    </div>
    <div class="info-row">
      <span class="info-label">Gender:</span>
      <span class="info-value">${selectedPrescription.patient.gender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${selectedPrescription.patient.phone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${selectedPrescription.patient.email || 'N/A'}</span>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th class="text-center">S.No</th>
          <th>Medicine Name</th>
          <th class="text-right">Amount/Day</th>
          <th class="text-center">Days</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${billItems.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.tabletName || 'N/A'}</td>
            <td class="text-right">${formatCurrency(item.amount || 0)}</td>
            <td class="text-center">${item.days || 0}</td>
            <td class="text-right"><strong>${formatCurrency(item.total || 0)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row">
      <span class="summary-label">Subtotal:</span>
      <span class="summary-value">${formatCurrency(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Tax (GST):</span>
      <span class="summary-value">${formatCurrency(tax)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Delivery Charge:</span>
      <span class="summary-value">${formatCurrency(delivery)}</span>
    </div>
    <div class="summary-row total-row">
      <span class="total-label">Total Amount:</span>
      <span class="total-value">${formatCurrency(total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This is a computer-generated bill. No signature required.</p>
    <p style="margin-top: 10px;">Generated on ${currentDate} at ${currentTime}</p>
  </div>
</body>
</html>
    `

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank')
    printWindow.document.write(pdfContent)
    printWindow.document.close()

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()

      // Also provide download option
      setTimeout(() => {
        const link = document.createElement('a')
        const blob = new Blob([pdfContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = `Bill_${selectedPrescription.patient.name.replace(/\s+/g, '_')}_${billNumber}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 500)
    }, 250)
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
              <div className="flex items-start justify-between mb-4">
                {/* Patient Name - Heading */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{prescription.patient.name}</h3>
                </div>
                
                {/* Download and Share Icons - Top Right */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(prescription)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                    aria-label="Download"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                    aria-label="Share"
                  >
                    <IoShareSocialOutline className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Information - Line by Line */}
              <div className="space-y-2.5">
                {/* Age and Gender */}
                <p className="text-sm text-slate-600">Age: {prescription.patient.age} years • {prescription.patient.gender}</p>
                
                {/* Condition/Diagnosis */}
                <div>
                  <p className="text-sm font-bold text-slate-900">{prescription.diagnosis}</p>
                </div>
                
                {/* Clinic Name */}
                <p className="text-xs text-slate-500">{prescription.clinic.name}</p>
                
                {/* Date */}
                <p className="text-xs text-slate-600">{formatDate(prescription.issuedAt)}</p>
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

              {/* Follow-up Section - Orange Background */}
              {prescription.followUpAt && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-2.5 py-1.5 mb-3 border border-orange-100">
                  <IoCalendarOutline className="h-4 w-4 text-orange-600 shrink-0" />
                  <span className="text-xs font-semibold text-orange-600">Follow-up:</span>
                  <span className="text-xs font-bold text-orange-700">{formatDate(prescription.followUpAt)}</span>
                </div>
              )}

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
                  type="button"
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-[rgba(17,73,108,0.1)] hover:text-[#11496c] active:scale-95"
                  aria-label="Share"
                >
                  <IoShareSocialOutline className="h-5 w-5" />
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
                  onClick={() => handleGenerateBill(selectedPrescription)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                >
                  <IoReceiptOutline className="h-4 w-4" />
                  Generate Bill
                </button>
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

      {/* Bill Generation Modal */}
      {showBillModal && selectedPrescription && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6 animate-in fade-in duration-200"
          onClick={() => setShowBillModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bill Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <IoReceiptOutline className="h-6 w-6 sm:h-7 sm:w-7 text-[#11496c]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Generate Bill</h2>
                  <p className="text-xs sm:text-sm text-slate-500">Patient: {selectedPrescription.patient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95"
              >
                <IoCloseOutline className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Bill Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Bill Items Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Medicines Bill</h3>
                  <button
                    type="button"
                    onClick={handleAddBillRow}
                    className="flex items-center gap-1 rounded-lg bg-[#11496c] px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoAddOutline className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                
                {/* Compact Table - No Scroll Required */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-1 bg-gradient-to-r from-slate-50 to-slate-100/50 px-2 py-1.5 border-b border-slate-200">
                    <div className="col-span-1 text-[10px] font-bold text-slate-700 text-center">No</div>
                    <div className="col-span-4 text-[10px] font-bold text-slate-700">Tablet Name</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-700 text-right">Amount</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-700 text-center">Days</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-700 text-right">Total</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-700 text-center">Action</div>
                  </div>
                  
                  {/* Data Rows */}
                  <div className="divide-y divide-slate-100">
                    {billItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-slate-50/50 transition-colors">
                        {/* S.No */}
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-600">{index + 1}</span>
                        </div>
                        
                        {/* Tablet Name */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={item.tabletName}
                            onChange={(e) => handleBillItemChange(item.id, 'tabletName', e.target.value)}
                            placeholder="Tablet name"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[rgba(17,73,108,0.2)]"
                          />
                        </div>
                        
                        {/* Amount */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              handleBillItemChange(item.id, 'amount', val)
                            }}
                            placeholder="0.00"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 text-right focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[rgba(17,73,108,0.2)]"
                          />
                        </div>
                        
                        {/* Days */}
                        <div className="col-span-1">
                          <input
                            type="number"
                            min="0"
                            value={item.days || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              handleBillItemChange(item.id, 'days', val)
                            }}
                            placeholder="0"
                            className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1.5 text-xs font-semibold text-slate-900 text-center focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[rgba(17,73,108,0.2)]"
                          />
                        </div>
                        
                        {/* Total */}
                        <div className="col-span-2 flex items-center justify-end">
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-900 w-full text-right">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                        
                        {/* Action */}
                        <div className="col-span-2 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteBillRow(item.id)}
                            className="flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1 text-red-600 transition-all hover:bg-red-100 hover:border-red-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={billItems.length === 1}
                            title="Delete row"
                          >
                            <IoTrashOutline className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="rounded-xl border-2 border-[rgba(17,73,108,0.2)] bg-gradient-to-br from-[rgba(17,73,108,0.1)] via-white to-[rgba(17,73,108,0.05)] p-4 sm:p-5 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">Bill Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Tax (GST):</span>
                    <span className="font-semibold">0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 pt-2 border-t border-[rgba(17,73,108,0.2)]">
                    <label htmlFor="deliveryCharge" className="font-semibold text-slate-700">
                      Delivery Charge:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        id="deliveryCharge"
                        min="0"
                        step="0.01"
                        value={deliveryCharge || ''}
                        onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-24 rounded-md border border-[rgba(17,73,108,0.3)] bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 text-right focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t-2 border-[rgba(17,73,108,0.3)] mt-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Total Amount</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-[#11496c]">{formatCurrency(calculateBillTotal())}</p>
                  </div>
                </div>
              </div>

              {/* Patient Information Display */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Bill will be sent to:</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><span className="font-semibold">Patient:</span> {selectedPrescription.patient.name}</p>
                  <p><span className="font-semibold">Email:</span> {selectedPrescription.patient.email || 'N/A'}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedPrescription.patient.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendBillToPatient}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                >
                  <IoPaperPlaneOutline className="h-4 w-4" />
                  Send to Patient
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBillPDF}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrintBill}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                >
                  <IoPrintOutline className="h-4 w-4" />
                  Print Bill
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

