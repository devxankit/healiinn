import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoBagHandleOutline,
  IoFlaskOutline,
  IoCardOutline,
  IoReceiptOutline,
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
  const navigate = useNavigate()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

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
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      handleClosePaymentModal()
      // Update request status to confirmed
      // In real app, this would be an API call
      alert(`Payment successful! Your ${selectedRequest.type === 'lab' ? 'test' : 'medicine'} booking is confirmed.`)
    }, 2000)
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
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
            aria-label="Go back"
          >
            <IoArrowBackOutline className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">Requests & Responses</h1>
            <p className="text-xs text-slate-600">Manage your booking requests and payments</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6">
        <div className="space-y-3">
          {mockRequests.map((request) => (
            <article
              key={request.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Main Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900">
                          {request.type === 'lab' ? request.testName : request.medicineName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600">{request.providerName}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {formatDate(request.requestDate)} • {request.responseDate && formatDate(request.responseDate)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    {/* Payment Info - Inline */}
                    {request.status === 'accepted' && (
                      <div className="mt-3 rounded-lg border border-[rgba(17,73,108,0.2)] bg-[rgba(17,73,108,0.1)]/50 p-2.5">
                        <p className="text-xs text-[#0a2d3f] leading-relaxed">{request.message}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Total Amount:</span>
                          <span className="text-lg font-bold text-[#11496c]">{formatCurrency(request.totalAmount)}</span>
                        </div>
                      </div>
                    )}

                    {/* Confirmed Status - Compact */}
                    {request.status === 'confirmed' && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
                        <IoCheckmarkCircleOutline className="h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
                          Booking confirmed! {request.type === 'lab' ? 'Test' : 'Medicine'} will be delivered as scheduled.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {request.status === 'accepted' && (
                <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-3">
                  <button
                    type="button"
                    onClick={() => handlePayClick(request)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98]"
                  >
                    <IoCardOutline className="h-4 w-4" />
                    Pay & Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Generate and download PDF receipt
                      const downloadReceipt = () => {
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
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
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
    .amount-box {
      background-color: #eff6ff;
      border: 2px solid #3b82f6;
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
      color: #1e40af;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      background-color: #dbeafe;
      color: #1e40af;
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

  ${request.message ? `
  <div class="section">
    <div class="section-title">Provider Message</div>
    <p style="color: #1e293b; line-height: 1.6;">${request.message}</p>
  </div>
  ` : ''}

  <div class="amount-box">
    <div class="amount-row">
      <span>Total Amount:</span>
      <span>${formatCurrency(request.totalAmount)}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is an electronically generated receipt.</p>
    <p>For any queries, please contact ${request.providerName}</p>
    <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>
                        `
                        
                        // Create print window
                        const printWindow = window.open('', '_blank')
                        printWindow.document.write(receiptContent)
                        printWindow.document.close()
                        
                        // Wait for content to load, then trigger print
                        setTimeout(() => {
                          printWindow.focus()
                          printWindow.print()
                        }, 250)
                      }
                      
                      downloadReceipt()
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
                    aria-label="Download receipt"
                  >
                    <IoReceiptOutline className="h-5 w-5" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>

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

