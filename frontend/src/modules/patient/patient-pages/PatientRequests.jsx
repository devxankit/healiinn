import { useState, useEffect } from 'react'
import {
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoCloseCircleOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoCardOutline,
  IoReceiptOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoDownloadOutline,
} from 'react-icons/io5'

// Mock data for booking requests and responses
const mockRequests = [
  {
    id: 'req-1',
    type: 'lab', // 'lab' or 'pharmacy'
    providerName: 'MediCare Diagnostics',
    providerId: 'lab-1',
    testName: 'Complete Blood Count (CBC)',
    status: 'accepted', // 'pending', 'accepted', 'paid', 'confirmed'
    requestDate: '2025-01-10',
    responseDate: '2025-01-11',
    totalAmount: 350,
    message: 'Your booking request has been accepted. Please proceed with payment.',
    prescriptionId: 'presc-1',
    // Patient Information
    patient: {
      name: 'John Doe',
      phone: '+91 98765 12345',
      email: 'john.doe@example.com',
      address: '123 Main Street, Pune, Maharashtra 411001',
      age: 32,
      gender: 'Male',
    },
    // Provider Response
    providerResponse: {
      message: 'Your booking request has been accepted. Sample collection can be scheduled at your home address on Jan 15, 2025. Total amount: ₹350. Please proceed with payment.',
      responseBy: 'MediCare Diagnostics Team',
      responseTime: '2025-01-11T10:30:00',
    },
    // Doctor Information (from prescription)
    doctor: {
      name: 'Dr. Rajesh Kumar',
      specialty: 'General Physician',
      phone: '+91 98765 43210',
    },
  },
  {
    id: 'req-2',
    type: 'pharmacy',
    providerName: 'City Pharmacy',
    providerId: 'pharmacy-1',
    medicineName: 'Prescription Medicines',
    status: 'accepted',
    requestDate: '2025-01-12',
    responseDate: '2025-01-13',
    totalAmount: 1250,
    message: 'Medicines are available. Total amount: ₹1,250. Please confirm and pay.',
    prescriptionId: 'presc-2',
    // Patient Information
    patient: {
      name: 'John Doe',
      phone: '+91 98765 12345',
      email: 'john.doe@example.com',
      address: '123 Main Street, Pune, Maharashtra 411001',
      age: 32,
      gender: 'Male',
    },
    // Provider Response
    providerResponse: {
      message: 'All prescribed medicines are available in stock. We can deliver to your address within 2-3 hours. Total amount: ₹1,250. Please confirm and proceed with payment.',
      responseBy: 'City Pharmacy Team',
      responseTime: '2025-01-13T14:20:00',
    },
    // Doctor Information (from prescription)
    doctor: {
      name: 'Dr. Priya Sharma',
      specialty: 'Cardiologist',
      phone: '+91 98765 54321',
    },
  },
  {
    id: 'req-3',
    type: 'lab',
    providerName: 'HealthLab Center',
    providerId: 'lab-2',
    testName: 'Blood Glucose Test',
    status: 'pending',
    requestDate: '2025-01-14',
    responseDate: null,
    totalAmount: null,
    message: null,
    prescriptionId: 'presc-3',
    // Patient Information
    patient: {
      name: 'John Doe',
      phone: '+91 98765 12345',
      email: 'john.doe@example.com',
      address: '123 Main Street, Pune, Maharashtra 411001',
      age: 32,
      gender: 'Male',
    },
    // Provider Response (pending)
    providerResponse: null,
    // Doctor Information (from prescription)
    doctor: {
      name: 'Dr. Rajesh Kumar',
      specialty: 'General Physician',
      phone: '+91 98765 43210',
    },
  },
]

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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PatientRequests = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [requests, setRequests] = useState([])
  const [, setCancelledRequests] = useState([])
  const [receiptPdfUrl, setReceiptPdfUrl] = useState(null)

  // Load requests from localStorage
  useEffect(() => {
    loadRequests()
    // Refresh every 2 seconds to get new requests
    const interval = setInterval(() => {
      loadRequests()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadRequests = () => {
    try {
      // Load from patientRequests localStorage (set by admin)
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      // Also check mockRequests for backward compatibility
      const allRequests = [...patientRequests, ...mockRequests]
      // Remove duplicates by id
      const uniqueRequests = allRequests.filter((req, idx, self) => 
        idx === self.findIndex(r => r.id === req.id)
      )
      // Sort by date (newest first)
      uniqueRequests.sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))
      setRequests(uniqueRequests)
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests(mockRequests)
    }
  }

  const handleViewReceipt = (request) => {
    setSelectedRequest(request)
    // Generate PDF and display in viewer
    generateReceiptPDF(request)
    setShowReceiptModal(true)
  }

  const generateReceiptPDF = (request) => {
    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Receipt - ${request.type === 'lab' ? request.testName : request.medicineName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #11496c;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #11496c;
      margin: 0;
      font-size: 28px;
    }
    .header .subtitle {
      color: #64748b;
      margin-top: 5px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 15px;
      border-left: 4px solid #11496c;
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
    .amount-box {
      background-color: rgba(17, 73, 108, 0.05);
      border: 2px solid #11496c;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      color: #11496c;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      background-color: rgba(17, 73, 108, 0.15);
      color: #11496c;
      font-weight: 600;
      font-size: 14px;
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
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Receipt</h1>
    <div class="subtitle">Healiinn - Your Health Partner</div>
  </div>

  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="info-row">
      <span class="info-label">Request ID:</span>
      <span class="info-value">${request.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Type:</span>
      <span class="info-value">${request.type === 'lab' ? 'Laboratory Test' : 'Pharmacy Order'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${request.type === 'lab' ? 'Test Name' : 'Medicine'}:</span>
      <span class="info-value">${request.type === 'lab' ? request.testName : request.medicineName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Provider:</span>
      <span class="info-value">${request.providerName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status:</span>
      <span class="info-value">
        <span class="status-badge">${getStatusLabel(request.status)}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Timeline</div>
    <div class="info-row">
      <span class="info-label">Requested Date:</span>
      <span class="info-value">${formatDate(request.requestDate)}</span>
    </div>
    ${request.responseDate ? `
    <div class="info-row">
      <span class="info-label">Response Date:</span>
      <span class="info-value">${formatDate(request.responseDate)}</span>
    </div>
    ` : ''}
  </div>

  ${request.patient ? `
  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span class="info-value">${request.patient.name} • ${request.patient.age} yrs, ${request.patient.gender}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Phone:</span>
      <span class="info-value">${request.patient.phone}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span class="info-value">${request.patient.email}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span class="info-value">${request.patient.address}</span>
    </div>
  </div>
  ` : ''}

  ${request.providerResponse ? `
  <div class="section">
    <div class="section-title">Provider Message</div>
    <p style="color: #1e293b; line-height: 1.6;">${request.providerResponse.message}</p>
  </div>
  ` : ''}

  ${request.totalAmount ? `
  <div class="amount-box">
    <div class="amount-row">
      <span>Total Amount:</span>
      <span>${formatCurrency(request.totalAmount)}</span>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This is an electronically generated receipt.</p>
    <p>For any queries, please contact ${request.providerName}</p>
    <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>
    `
    
    // Create blob URL for PDF
    const blob = new Blob([receiptContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setReceiptPdfUrl(url)
  }

  useEffect(() => {
    return () => {
      // Cleanup blob URL when component unmounts or modal closes
      if (receiptPdfUrl) {
        URL.revokeObjectURL(receiptPdfUrl)
      }
    }
  }, [receiptPdfUrl])

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false)
    setSelectedRequest(null)
    // Cleanup blob URL
    if (receiptPdfUrl) {
      URL.revokeObjectURL(receiptPdfUrl)
      setReceiptPdfUrl(null)
    }
  }


  const handlePayClick = (request) => {
    setSelectedRequest(request)
    setShowPaymentModal(true)
  }

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedRequest(null)
    setPaymentMethod('card')
  }

  const handleConfirmPayment = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update request status to confirmed
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedRequests = patientRequests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: 'confirmed', paidAt: new Date().toISOString() }
          : req
      )
      localStorage.setItem('patientRequests', JSON.stringify(updatedRequests))

      // Send confirmation to admin
      const allAdminRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedAdminRequests = allAdminRequests.map(req => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            status: 'confirmed',
            paymentConfirmed: true,
            paidAt: new Date().toISOString(),
            confirmationMessage: `Payment confirmed! Order has been created for patient ${selectedRequest.patient?.name || 'Patient'}.`,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedAdminRequests))

      // Create order
      const order = {
        id: `order-${Date.now()}`,
        requestId: selectedRequest.id,
        type: selectedRequest.type,
        patientId: 'pat-current',
        patientName: selectedRequest.patient?.name || 'Patient',
        pharmacyId: selectedRequest.providerId,
        pharmacyName: selectedRequest.providerName,
        medicines: selectedRequest.adminMedicines || selectedRequest.medicines || [],
        totalAmount: selectedRequest.totalAmount,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      }

      // Save order
      const orders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      orders.push(order)
      localStorage.setItem('patientOrders', JSON.stringify(orders))

      // Also save to admin orders
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]')
      adminOrders.push(order)
      localStorage.setItem('adminOrders', JSON.stringify(adminOrders))

      // Update admin wallet with payment
      try {
        const adminWallet = JSON.parse(localStorage.getItem('adminWallet') || '{"balance": 0, "transactions": []}')
        adminWallet.balance = (adminWallet.balance || 0) + selectedRequest.totalAmount
        const transaction = {
          id: `txn-${Date.now()}`,
          type: 'credit',
          amount: selectedRequest.totalAmount,
          description: `Payment received from ${selectedRequest.patient?.name || 'Patient'} for ${selectedRequest.type === 'lab' ? 'lab test' : 'medicine'} order`,
          orderId: order.id,
          requestId: selectedRequest.id,
          providerId: selectedRequest.providerId,
          providerName: selectedRequest.providerName,
          patientName: selectedRequest.patient?.name || 'Patient',
          createdAt: new Date().toISOString(),
        }
        adminWallet.transactions = adminWallet.transactions || []
        adminWallet.transactions.unshift(transaction) // Add to beginning
        localStorage.setItem('adminWallet', JSON.stringify(adminWallet))
      } catch (error) {
        console.error('Error updating admin wallet:', error)
      }

      // Update pharmacy/lab order status to confirmed
      if (selectedRequest.type === 'pharmacy') {
        try {
          const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${selectedRequest.providerId}`) || '[]')
          const updatedPharmacyOrders = pharmacyOrders.map(pharmOrder => {
            if (pharmOrder.requestId === selectedRequest.id) {
              return {
                ...pharmOrder,
                status: 'confirmed',
                paidAt: new Date().toISOString(),
                paymentConfirmed: true,
              }
            }
            return pharmOrder
          })
          localStorage.setItem(`pharmacyOrders_${selectedRequest.providerId}`, JSON.stringify(updatedPharmacyOrders))
        } catch (error) {
          console.error('Error updating pharmacy order:', error)
        }
      } else if (selectedRequest.type === 'lab') {
        try {
          const labOrders = JSON.parse(localStorage.getItem(`labOrders_${selectedRequest.providerId}`) || '[]')
          const updatedLabOrders = labOrders.map(labOrder => {
            if (labOrder.requestId === selectedRequest.id) {
              return {
                ...labOrder,
                status: 'confirmed',
                paidAt: new Date().toISOString(),
                paymentConfirmed: true,
              }
            }
            return labOrder
          })
          localStorage.setItem(`labOrders_${selectedRequest.providerId}`, JSON.stringify(updatedLabOrders))
        } catch (error) {
          console.error('Error updating lab order:', error)
        }
      }

      setIsProcessing(false)
      handleClosePaymentModal()
      loadRequests()
      alert(`Payment successful! Your ${selectedRequest.type === 'lab' ? 'test' : 'medicine'} order has been confirmed.`)
    } catch (error) {
      console.error('Error processing payment:', error)
      setIsProcessing(false)
      alert('Error processing payment. Please try again.')
    }
  }

  const handleCancelRequest = async (request) => {
    if (!request) return

    // Confirm cancellation
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel this ${request.type === 'lab' ? 'lab test' : 'pharmacy'} request?`
    )

    if (!confirmCancel) return

    setIsProcessing(true)

    // Simulate sending cancel request to pharmacy/laboratory
    setTimeout(() => {
      setIsProcessing(false)
      
      // In real app, this would be an API call to send cancel message to provider
      const cancelMessage = {
        requestId: request.id,
        type: request.type,
        providerId: request.providerId,
        providerName: request.providerName,
        message: `Request has been cancelled by patient. Request ID: ${request.id}`,
        cancelledAt: new Date().toISOString(),
      }
      
      // Log cancel request (in real app, this would be an API call)
      console.log('Cancel request sent to provider:', cancelMessage)
      
      // Remove the request from the list (actually cancel it)
      setRequests(prevRequests => prevRequests.filter(req => req.id !== request.id))
      setCancelledRequests(prev => [...prev, { ...request, status: 'cancelled', cancelledAt: new Date().toISOString() }])
      
      // Show success message
      alert(`Request cancelled successfully. Cancellation message sent to ${request.providerName}.`)
    }, 1500)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'accepted':
        return 'bg-[rgba(17,73,108,0.15)] text-[#11496c]'
      case 'paid':
        return 'bg-purple-100 text-purple-700'
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <IoTimeOutline className="h-3 w-3" />
      case 'accepted':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      case 'paid':
        return <IoCardOutline className="h-3 w-3" />
      case 'confirmed':
        return <IoCheckmarkCircleOutline className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'accepted':
        return 'Payment Pending'
      case 'paid':
        return 'Processing'
      case 'confirmed':
        return 'Confirmed'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-4 py-5 sm:px-6">
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Main Content */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    request.type === 'lab' 
                      ? 'text-white shadow-lg' 
                      : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-300/50 text-white shadow-lg'
                  }`}
                  style={request.type === 'lab' ? { 
                    background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                    boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                  } : {}}>
                    {request.type === 'lab' ? (
                      <IoFlaskOutline className="h-6 w-6" />
                    ) : (
                      <IoBagHandleOutline className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Title and Status - Prevent Overlap */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="flex-1 min-w-0 text-base font-bold text-slate-900 leading-tight pr-2 line-clamp-2">
                          {request.type === 'lab' ? request.testName : request.medicineName}
                        </h3>
                        <div className="shrink-0">
                          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span>{getStatusLabel(request.status)}</span>
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{request.providerName}</p>
                      <p className="text-[10px] text-slate-500">
                        {formatDate(request.requestDate)} • {request.responseDate && formatDate(request.responseDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patient Information Section - Full Width */}
                {request.patient && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <IoPersonOutline className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Patient Information</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-700">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{request.patient.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 text-[9px]">{request.patient.age} yrs, {request.patient.gender}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoCallOutline className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{request.patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoMailOutline className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{request.patient.email}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <IoLocationOutline className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{request.patient.address}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Medicines List - If available */}
                {request.adminMedicines && request.adminMedicines.length > 0 && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <IoBagHandleOutline className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Medicines Added by Admin</h4>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {request.adminMedicines.map((med, idx) => (
                        <div key={med.id || idx} className="flex items-center justify-between text-[10px] bg-white rounded px-2 py-1 border border-blue-100">
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-900">{med.name}</span>
                            {med.dosage && <span className="text-slate-600 ml-1">({med.dosage})</span>}
                            {med.quantity > 1 && <span className="text-slate-500 ml-1">x{med.quantity}</span>}
                          </div>
                          <span className="font-semibold text-blue-700 shrink-0 ml-2">₹{((med.price || 0) * (med.quantity || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provider Response Section - Full Width */}
                {request.providerResponse ? (
                  <div className="mt-3 rounded-lg border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.05)] p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      {request.type === 'lab' ? (
                        <IoFlaskOutline className="h-3.5 w-3.5 text-[#11496c] shrink-0" />
                      ) : (
                        <IoBagHandleOutline className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      )}
                      <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                        Response from {request.providerName}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-700 leading-relaxed line-clamp-2">{request.providerResponse.message}</p>
                      {request.totalAmount && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-slate-600 uppercase tracking-wide">Total Amount:</span>
                          <span className="text-sm font-bold text-[#11496c]">{formatCurrency(request.totalAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-slate-200/50">
                        <span className="truncate flex-1 mr-2">{request.providerResponse.responseBy}</span>
                        {request.providerResponse.responseTime && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            <IoTimeOutline className="h-2.5 w-2.5" />
                            {formatDate(request.providerResponse.responseTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-medium text-amber-900 leading-tight">
                        Waiting for admin response...
                      </p>
                    </div>
                  </div>
                )}

                {/* Doctor Information */}
                {request.doctor && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 px-1">
                    <IoDocumentTextOutline className="h-3 w-3 shrink-0" />
                    <span className="leading-tight">Prescribed by: <span className="font-medium text-slate-700">{request.doctor.name}</span> ({request.doctor.specialty})</span>
                  </div>
                )}

                {/* Confirmed Status - Compact */}
                {request.status === 'confirmed' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <IoCheckmarkCircleOutline className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
                      Booking confirmed! {request.type === 'lab' ? 'Test' : 'Medicine'} will be delivered as scheduled.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {request.status === 'accepted' && (
                <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-2.5 sm:p-3">
                  <button
                    type="button"
                    onClick={() => handlePayClick(request)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#11496c] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IoCardOutline className="h-3 w-3 shrink-0" />
                    Pay & Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelRequest(request)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm shadow-[rgba(220,38,38,0.3)] transition-all hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IoCloseCircleOutline className="h-3 w-3 shrink-0" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewReceipt(request)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-white shadow-sm shadow-[rgba(51,65,85,0.3)] transition-all hover:bg-slate-800 hover:shadow active:scale-95"
                    aria-label="View receipt"
                  >
                    <IoReceiptOutline className="h-4 w-4" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>

      {/* Receipt Detail Modal - PDF View */}
      {showReceiptModal && selectedRequest && receiptPdfUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-900"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReceiptModal()
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#11496c]">Booking Receipt</h2>
              <p className="text-xs text-slate-600">Healiinn - Your Health Partner</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Download PDF
                  const link = document.createElement('a')
                  link.href = receiptPdfUrl
                  link.download = `Receipt_${selectedRequest.id}_${selectedRequest.type === 'lab' ? selectedRequest.testName : selectedRequest.medicineName}.html`
                  link.target = '_blank'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                title="Download PDF"
              >
                <IoDownloadOutline className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleCloseReceiptModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-slate-100">
            <iframe
              src={receiptPdfUrl}
              className="w-full h-full border-0"
              title="Booking Receipt"
              style={{ minHeight: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">Confirm Payment</h2>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedRequest.type === 'lab' ? selectedRequest.testName : selectedRequest.medicineName}
                    </p>
                    <p className="text-xs text-slate-600">{selectedRequest.providerName}</p>
                  </div>
                  <span className="text-lg font-bold text-[#11496c]">
                    {formatCurrency(selectedRequest.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-900">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-[#11496c]"
                    />
                    <IoCardOutline className="h-5 w-5 text-slate-600" />
                    <span className="flex-1 text-sm font-medium text-slate-900">Credit/Debit Card</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-[#11496c]"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-900">UPI</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-[#11496c]"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-900">Wallet</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="h-4 w-4" />
                    Pay {formatCurrency(selectedRequest.totalAmount)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientRequests

