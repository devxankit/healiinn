import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoSearchOutline,
  IoFlaskOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPaperPlaneOutline,
  IoPrintOutline,
  IoCloseOutline,
  IoCallOutline,
  IoMailOutline,
  IoExpandOutline,
  IoShareSocialOutline,
  IoLocationOutline,
  IoPersonCircleOutline,
  IoMedicalOutline,
} from 'react-icons/io5'

const mockReports = [
  {
    id: 'report-1',
    patientName: 'John Doe',
    patientAge: 45,
    patientGender: 'Male',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'john.doe@example.com',
    testName: 'Complete Blood Count (CBC)',
    orderId: 'order-1',
    status: 'completed',
    completedAt: '2024-01-15T14:30:00.000Z',
    pdfUrl: '#',
    doctorName: 'Dr. Sarah Williams',
    doctorSpecialization: 'Cardiologist',
    doctorPhone: '+1-555-987-6543',
    doctorEmail: 'sarah.williams@example.com',
  },
  {
    id: 'report-2',
    patientName: 'Sarah Smith',
    patientAge: 32,
    patientGender: 'Female',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'sarah.smith@example.com',
    testName: 'Lipid Profile',
    orderId: 'order-2',
    status: 'pending',
    completedAt: null,
    pdfUrl: null,
    doctorName: 'Dr. Michael Chen',
    doctorSpecialization: 'Endocrinologist',
    doctorPhone: '+1-555-876-5432',
    doctorEmail: 'michael.chen@example.com',
  },
  {
    id: 'report-3',
    patientName: 'Mike Johnson',
    patientAge: 28,
    patientGender: 'Male',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'mike.johnson@example.com',
    testName: 'Liver Function Test (LFT)',
    orderId: 'order-3',
    status: 'completed',
    completedAt: '2024-01-13T18:00:00.000Z',
    pdfUrl: '#',
    doctorName: 'Dr. Emily Rodriguez',
    doctorSpecialization: 'Gastroenterologist',
    doctorPhone: '+1-555-765-4321',
    doctorEmail: 'emily.rodriguez@example.com',
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

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '0.00'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const LaboratoryReports = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showBillModal, setShowBillModal] = useState(false)
  const [billItems, setBillItems] = useState([])
  const [homeCollectionCharges, setHomeCollectionCharges] = useState(0)

  // Group reports by patient name
  const groupedByPatient = mockReports.reduce((acc, report) => {
    const patientName = report.patientName
    if (!acc[patientName]) {
      acc[patientName] = {
        patientName,
        patientAge: report.patientAge,
        patientGender: report.patientGender,
        patientPhone: report.patientPhone,
        patientEmail: report.patientEmail,
        reports: [],
      }
    }
    acc[patientName].reports.push(report)
    return acc
  }, {})

  // Filter patients based on search
  const filteredPatients = Object.values(groupedByPatient).filter((patient) => {
    if (!searchTerm.trim()) return true
    const search = searchTerm.toLowerCase()
    return (
      patient.patientName.toLowerCase().includes(search) ||
      patient.patientPhone?.toLowerCase().includes(search) ||
      patient.patientEmail?.toLowerCase().includes(search) ||
      patient.reports.some(
        (r) =>
          r.testName.toLowerCase().includes(search) ||
          r.orderId.toLowerCase().includes(search)
      )
    )
  })

  const handleDownloadPDF = (report) => {
    if (report.pdfUrl && report.pdfUrl !== '#') {
      alert(`Downloading report: ${report.testName} for ${report.patientName}`)
    } else {
      alert('Report is being generated. Please try again in a moment.')
    }
  }

  const handleGenerateBill = (report) => {
    // Initialize with one empty row for manual entry
    setBillItems([
      {
        id: Date.now(),
        testName: '',
        amount: 0,
        total: 0,
      },
    ])
    setHomeCollectionCharges(0) // Reset home collection charges
    setSelectedReport(report)
    setShowBillModal(true)
  }

  const handleBillItemChange = (id, field, value) => {
    setBillItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'amount') {
            updatedItem.total = updatedItem.amount || 0
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
        testName: '',
        amount: 0,
        total: 0,
      },
    ])
  }

  const handleDeleteBillRow = (id) => {
    setBillItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const calculateBillTotal = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.total || 0), 0)
    return subtotal + (homeCollectionCharges || 0)
  }

  const handlePrintBill = () => {
    window.print()
  }

  const handleSendBillToPatient = async () => {
    if (!selectedReport || billItems.length === 0) {
      alert('Please add at least one test item before sending to patient.')
      return
    }

    const totalAmount = calculateBillTotal()
    const billNumber = `BILL-${Date.now().toString().slice(-6)}`
    const patientName = selectedReport.patientName
    const patientEmail = selectedReport.patientEmail
    const patientPhone = selectedReport.patientPhone

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

      const subtotal = billItems.reduce((sum, item) => sum + (item.total || 0), 0)
      const homeCollection = homeCollectionCharges || 0
      const total = calculateBillTotal()

      // Generate HTML content for PDF
      const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Bill - ${patientName}</title>
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
      border-bottom: 3px solid #9333ea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #7e22ce;
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
      color: #7e22ce;
      font-size: 16px;
      margin-bottom: 10px;
      border-left: 4px solid #9333ea;
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
      background: linear-gradient(to right, #faf5ff, #f3e8ff);
      border: 2px solid #9333ea;
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
      color: #7e22ce;
    }
    .total-row {
      border-top: 2px solid #9333ea;
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
      color: #7e22ce;
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
    <h1>Laboratory Test Bill</h1>
    <div class="subtitle">Healiinn - Your Health Partner</div>
  </div>

  <div class="bill-info">
    <div class="info-section">
      <h3>Laboratory Information</h3>
      <div class="info-row">
        <span class="info-label">Laboratory:</span>
        <span class="info-value">MediLab Diagnostics</span>
      </div>
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value">123 Medical Street, Springfield, IL 62701</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">+1-555-214-0098</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">info@medilab.com</span>
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
        <span class="info-label">Test Report ID:</span>
        <span class="info-value">${selectedReport.id}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h3>Patient Information</h3>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${selectedReport.patientName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Age:</span>
      <span class="info-value">${selectedReport.patientAge} years</span>
    </div>
    <div class="info-row">
      <span class="info-label">Gender:</span>
      <span class="info-value">${selectedReport.patientGender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${selectedReport.patientPhone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${selectedReport.patientEmail || 'N/A'}</span>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th class="text-center">S.No</th>
          <th>Test Name</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${billItems.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.testName || 'N/A'}</td>
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
      <span class="summary-label">Home Collection Charge:</span>
      <span class="summary-value">${formatCurrency(homeCollection)}</span>
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
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const billData = {
        billNumber,
        reportId: selectedReport.id,
        orderId: selectedReport.orderId,
        patientId: 'pat-1',
        patientName,
        patientEmail,
        patientPhone,
        billItems: billItems.map(item => ({
          testName: item.testName,
          amount: item.amount,
          total: item.total,
        })),
        homeCollectionCharges: homeCollectionCharges || 0,
        totalAmount,
        pdfContent,
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
    if (!selectedReport || billItems.length === 0) {
      alert('Please add at least one test item before generating PDF.')
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
    const subtotal = billItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const homeCollection = homeCollectionCharges || 0
    const total = calculateBillTotal()

    // Generate HTML content for PDF
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Bill - ${selectedReport.patientName}</title>
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
      border-bottom: 3px solid #9333ea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #7e22ce;
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
      color: #7e22ce;
      font-size: 16px;
      margin-bottom: 10px;
      border-left: 4px solid #9333ea;
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
      background: linear-gradient(to right, #faf5ff, #f3e8ff);
      border: 2px solid #9333ea;
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
      color: #7e22ce;
    }
    .total-row {
      border-top: 2px solid #9333ea;
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
      color: #7e22ce;
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
    <h1>Laboratory Test Bill</h1>
    <div class="subtitle">Healiinn - Your Health Partner</div>
  </div>

  <div class="bill-info">
    <div class="info-section">
      <h3>Laboratory Information</h3>
      <div class="info-row">
        <span class="info-label">Laboratory:</span>
        <span class="info-value">MediLab Diagnostics</span>
      </div>
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value">123 Medical Street, Springfield, IL 62701</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">+1-555-214-0098</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">info@medilab.com</span>
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
        <span class="info-label">Test Report ID:</span>
        <span class="info-value">${selectedReport.id}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h3>Patient Information</h3>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${selectedReport.patientName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Age:</span>
      <span class="info-value">${selectedReport.patientAge} years</span>
    </div>
    <div class="info-row">
      <span class="info-label">Gender:</span>
      <span class="info-value">${selectedReport.patientGender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${selectedReport.patientPhone || 'N/A'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${selectedReport.patientEmail || 'N/A'}</span>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th class="text-center">S.No</th>
          <th>Test Name</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${billItems.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.testName || 'N/A'}</td>
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
      <span class="summary-label">Home Collection Charge:</span>
      <span class="summary-value">${formatCurrency(homeCollection)}</span>
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
        link.download = `TestBill_${selectedReport.patientName.replace(/\s+/g, '_')}_${billNumber}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 500)
    }, 250)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm text-slate-600">{filteredPatients.length} patients</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
        </span>
        <input
          type="search"
          placeholder="Search by patient name, phone, or email..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
            No patients found matching your search.
          </p>
        ) : (
          filteredPatients.map((patient) => (
            <article
              key={patient.patientName}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg sm:p-5"
            >
              {/* Patient Header */}
              <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <IoPersonOutline className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{patient.patientName}</h3>
                  <p className="text-xs text-slate-500">
                    {patient.patientAge} years, {patient.patientGender}
                  </p>
                  {patient.patientPhone && (
                    <p className="mt-1 text-xs text-slate-600">
                      <IoCallOutline className="mr-1 inline h-3 w-3" />
                      {patient.patientPhone}
                    </p>
                  )}
                  {patient.patientEmail && (
                    <p className="mt-1 text-xs text-slate-600">
                      <IoMailOutline className="mr-1 inline h-3 w-3" />
                      {patient.patientEmail}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Total Tests</p>
                  <p className="text-lg font-bold text-purple-600">{patient.reports.length}</p>
                </div>
              </div>

              {/* Test Reports List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Test Reports:</h4>
                {patient.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <IoFlaskOutline className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <p className="text-sm font-medium text-slate-900">{report.testName}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Order ID: {report.orderId}</p>
                        {report.completedAt && (
                          <p className="mt-1 text-xs text-slate-600">
                            <IoCalendarOutline className="mr-1 inline h-3 w-3" />
                            Completed: {formatDate(report.completedAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {report.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 whitespace-nowrap">
                            <IoCheckmarkCircleOutline className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 whitespace-nowrap">
                            <IoTimeOutline className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* First Row: Download PDF */}
                      {report.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadPDF(report)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 active:scale-95"
                        >
                          <IoDownloadOutline className="h-3.5 w-3.5" />
                          <span>Download PDF</span>
                        </button>
                      )}
                      {/* Second Row: View Details */}
                      <button
                        onClick={() => {
                          setShowBillModal(false)
                          setSelectedReport(report)
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                      >
                        <IoDocumentTextOutline className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Report Details Modal - PDF Format */}
      {selectedReport && !showBillModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6 animate-in fade-in duration-200"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex items-center justify-center rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                >
                  <IoArrowBackOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Test Report Details</h2>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-purple-50 hover:text-purple-600 active:scale-95"
                  aria-label="Zoom"
                >
                  <IoExpandOutline className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-purple-50 hover:text-purple-600 active:scale-95"
                  aria-label="Share"
                >
                  <IoShareSocialOutline className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-full p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95"
                >
                  <IoCloseOutline className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Report Content - PDF Format */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Laboratory Information */}
              <div className="relative overflow-hidden rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 p-4 sm:p-5 shadow-sm">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-200/20 blur-2xl" />
                <h3 className="relative text-lg sm:text-xl font-bold text-purple-700 mb-2">MediLab Diagnostics</h3>
                <p className="relative text-sm sm:text-base text-slate-700 mb-3">123 Medical Street, Springfield, IL 62701</p>
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                  <a
                    href="tel:+1-555-214-0098"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 hover:bg-white transition-all hover:shadow-sm"
                  >
                    <IoCallOutline className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    <span className="font-medium">+1-555-214-0098</span>
                  </a>
                  <a
                    href="mailto:info@medilab.com"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 hover:bg-white transition-all hover:shadow-sm"
                  >
                    <IoMailOutline className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    <span className="font-medium">info@medilab.com</span>
                  </a>
                </div>
                <div className="mt-4 h-0.5 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 rounded-full" />
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
                    <p className="text-slate-900 font-medium">{selectedReport.patientName}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Age:</span>
                    <p className="text-slate-900 font-medium">{selectedReport.patientAge} years</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Gender:</span>
                    <p className="text-slate-900 font-medium">{selectedReport.patientGender}</p>
                  </div>
                  {selectedReport.patientPhone && (
                    <div>
                      <span className="font-semibold text-slate-600">Phone:</span>
                      <a href={`tel:${selectedReport.patientPhone}`} className="text-purple-600 font-medium hover:text-purple-700 hover:underline">
                        {selectedReport.patientPhone}
                      </a>
                    </div>
                  )}
                  {selectedReport.patientEmail && (
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-600">Email:</span>
                      <a href={`mailto:${selectedReport.patientEmail}`} className="text-purple-600 font-medium hover:text-purple-700 hover:underline break-all">
                        {selectedReport.patientEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Information */}
              {selectedReport.doctorName && (
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50/50 to-white p-4 sm:p-5 shadow-sm">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <IoMedicalOutline className="h-5 w-5 text-blue-600" />
                    Consulting Doctor Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-600">Doctor Name:</span>
                      <p className="text-slate-900 font-medium">{selectedReport.doctorName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600">Specialization:</span>
                      <p className="text-slate-900 font-medium">{selectedReport.doctorSpecialization}</p>
                    </div>
                    {selectedReport.doctorPhone && (
                      <div>
                        <span className="font-semibold text-slate-600">Phone:</span>
                        <a href={`tel:${selectedReport.doctorPhone}`} className="text-purple-600 font-medium hover:text-purple-700 hover:underline">
                          {selectedReport.doctorPhone}
                        </a>
                      </div>
                    )}
                    {selectedReport.doctorEmail && (
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-slate-600">Email:</span>
                        <a href={`mailto:${selectedReport.doctorEmail}`} className="text-purple-600 font-medium hover:text-purple-700 hover:underline break-all">
                          {selectedReport.doctorEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Test Information */}
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-purple-50/30 p-4 sm:p-5 shadow-sm">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <IoFlaskOutline className="h-5 w-5 text-purple-600" />
                  Test Information
                </h4>
                <div className="space-y-3 sm:space-y-4">
                  <div className="group relative overflow-hidden rounded-xl border border-purple-200/60 bg-gradient-to-br from-white to-purple-50/50 p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-300">
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-100/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <h5 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
                        {selectedReport.testName}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-600">Order ID:</span>
                          <p className="text-slate-900 font-medium">{selectedReport.orderId}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Report ID:</span>
                          <p className="text-slate-900 font-medium">{selectedReport.id}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Status:</span>
                          <p className="mt-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              selectedReport.status === 'completed' 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {selectedReport.status === 'completed' ? (
                                <>
                                  <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <IoTimeOutline className="h-3.5 w-3.5" />
                                  Pending
                                </>
                              )}
                            </span>
                          </p>
                        </div>
                        {selectedReport.completedAt && (
                          <div>
                            <span className="font-semibold text-slate-600">Completed At:</span>
                            <p className="text-slate-900 font-medium flex items-center gap-1">
                              <IoCalendarOutline className="h-4 w-4 text-purple-600" />
                              {formatDate(selectedReport.completedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - At Bottom */}
              <div className="flex flex-row gap-2 sm:gap-3 border-t border-slate-200 pt-4 sm:pt-5 mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={() => {
                    handleGenerateBill(selectedReport)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-400/40 transition-all hover:bg-purple-600 active:scale-95"
                >
                  <IoReceiptOutline className="h-4 w-4" />
                  Generate Bill
                </button>
                {selectedReport.status === 'completed' && selectedReport.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedReport)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Generation Modal */}
      {showBillModal && selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6 animate-in fade-in duration-200"
          onClick={() => {
            setShowBillModal(false)
            setSelectedReport(null)
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bill Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <IoReceiptOutline className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Generate Test Bill</h2>
                  <p className="text-xs sm:text-sm text-slate-500">Patient: {selectedReport.patientName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBillModal(false)
                  setSelectedReport(null)
                }}
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
                  <h3 className="text-sm font-bold text-slate-900">Test Items Bill</h3>
                  <button
                    type="button"
                    onClick={handleAddBillRow}
                    className="flex items-center gap-1 rounded-lg bg-purple-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-purple-400/40 transition-all hover:bg-purple-600 active:scale-95"
                  >
                    <IoAddOutline className="h-3.5 w-3.5" />
                    Add Test
                  </button>
                </div>
                
                {/* Compact Table */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-1 bg-gradient-to-r from-slate-50 to-slate-100/50 px-2 py-1.5 border-b border-slate-200">
                    <div className="col-span-1 text-[10px] font-bold text-slate-700 text-center">No</div>
                    <div className="col-span-7 text-[10px] font-bold text-slate-700">Test Name</div>
                    <div className="col-span-3 text-[10px] font-bold text-slate-700 text-right">Amount</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-700 text-center">Action</div>
                  </div>
                  
                  {/* Data Rows */}
                  <div className="divide-y divide-slate-100">
                    {billItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-1 px-2 py-2 hover:bg-slate-50/50 transition-colors">
                        {/* S.No */}
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-600">{index + 1}</span>
                        </div>
                        
                        {/* Test Name */}
                        <div className="col-span-7">
                          <input
                            type="text"
                            value={item.testName}
                            onChange={(e) => handleBillItemChange(item.id, 'testName', e.target.value)}
                            placeholder="Test name"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/30"
                          />
                        </div>
                        
                        {/* Amount */}
                        <div className="col-span-3">
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
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 text-right focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/30"
                          />
                        </div>
                        
                        {/* Action */}
                        <div className="col-span-1 flex items-center justify-center">
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

              {/* Home Collection Charge */}
              <div className="rounded-lg border border-purple-200/60 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label htmlFor="homeCollectionCharges" className="text-sm font-semibold text-slate-700">
                    Home Collection Charge:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="homeCollectionCharges"
                      min="0"
                      step="0.01"
                      value={homeCollectionCharges || ''}
                      onChange={(e) => setHomeCollectionCharges(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-32 rounded-md border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 text-right focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Charges for home collection service at patient's location for sample collection</p>
              </div>

              {/* Total Amount Display */}
              <div className="rounded-xl border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Total Amount</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatCurrency(calculateBillTotal())}</p>
                </div>
              </div>

              {/* Patient Information Display */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Bill will be sent to:</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><span className="font-semibold">Patient:</span> {selectedReport.patientName}</p>
                  <p><span className="font-semibold">Email:</span> {selectedReport.patientEmail || 'N/A'}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedReport.patientPhone || 'N/A'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendBillToPatient}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-400/40 transition-all hover:bg-purple-600 active:scale-95"
                >
                  <IoPaperPlaneOutline className="h-4 w-4" />
                  Send to Patient
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBillPDF}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                >
                  <IoDownloadOutline className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrintBill}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 active:scale-95"
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

export default LaboratoryReports

