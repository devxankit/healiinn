import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoFlaskOutline,
  IoMedicalOutline,
  IoCloseOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoCallOutline,
  IoLocationOutline,
} from 'react-icons/io5'

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

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const LaboratoryRequestOrders = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, completed

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
      // Get lab ID (in real app, get from auth)
      const labId = 'lab-1' // Mock lab ID - in real app, get from auth
      
      // Load orders from lab-specific localStorage key
      const labOrders = JSON.parse(localStorage.getItem(`labOrders_${labId}`) || '[]')
      
      // Also load from adminRequests - check both single lab and multiple labs structure
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const labTestRequests = allRequests.filter(r => {
        if (r.type !== 'book_test_visit') return false
        // Check if this lab is in the response (single lab or multiple labs)
        if (r.adminResponse?.lab?.id === labId) return true
        if (r.adminResponse?.labs && Array.isArray(r.adminResponse.labs)) {
          return r.adminResponse.labs.some(l => l.id === labId)
        }
        return false
      })
      
      // Transform adminRequests to order format
      const transformedRequests = labTestRequests.map(req => ({
        id: req.id,
        requestId: req.id,
        patientName: req.patientName,
        patientPhone: req.patientPhone,
        patientAddress: req.patientAddress,
        patientEmail: req.patientEmail,
        prescription: {
          ...req.prescription,
          pdfUrl: req.prescriptionPdfUrl || req.prescription?.pdfUrl, // Include prescription PDF URL
        },
        prescriptionPdfUrl: req.prescriptionPdfUrl || req.prescription?.pdfUrl, // Include at request level too
        visitType: req.visitType || 'lab', // Include visitType
        investigations: req.adminResponse?.investigations || req.prescription?.investigations || [],
        totalAmount: req.adminResponse?.totalAmount || 0,
        status: req.status === 'confirmed' && req.paymentPending ? 'payment_pending' : req.status === 'confirmed' ? 'confirmed' : req.status === 'rejected' ? 'rejected' : req.status === 'accepted' ? 'accepted' : 'pending',
        labAccepted: req.labAccepted || false,
        labRejected: req.labRejected || false,
        acceptedAt: req.labAcceptedAt || req.acceptedAt,
        rejectedAt: req.labRejectedAt || req.rejectedAt,
        createdAt: req.createdAt || req.responseDate,
        paymentConfirmed: req.paymentConfirmed || false,
        paidAt: req.paidAt,
      }))
      
      // Combine and deduplicate - preserve visitType from labOrders
      const combined = [...labOrders.map(order => ({
        ...order,
        visitType: order.visitType || 'lab', // Ensure visitType is present
      })), ...transformedRequests]
      const unique = combined.filter((req, idx, self) => 
        idx === self.findIndex(r => (r.id === req.id || r.requestId === req.requestId || r.id === req.requestId) && 
                                    (r.requestId === req.requestId || r.requestId === req.id))
      )
      
      // Sort by date (newest first)
      unique.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      
      setRequests(unique)
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests([])
    }
  }

  const handleRejectOrder = async (orderId) => {
    try {
      // Confirm rejection
      const confirmReject = window.confirm(
        'Are you sure you want to reject this order? This action cannot be undone.'
      )
      if (!confirmReject) return

      const labId = 'lab-1' // Mock lab ID
      const labOrders = JSON.parse(localStorage.getItem(`labOrders_${labId}`) || '[]')
      const orderToUpdate = labOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update lab orders - set status as 'rejected'
      const updatedOrders = labOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'Laboratory',
            labRejected: true,
          }
        }
        return order
      })
      localStorage.setItem(`labOrders_${labId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labRejected: true,
            labRejectedAt: new Date().toISOString(),
            rejectedBy: 'Laboratory',
            rejectionMessage: `Order rejected by laboratory`,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Create notification for admin
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
      const request = allRequests.find(r => r.id === requestId)
      const labInfo = request?.adminResponse?.lab || request?.adminResponse?.labs?.[0] || {}
      adminNotifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'laboratory_rejected',
        title: 'Laboratory Order Rejected',
        message: `Laboratory ${labInfo?.labName || 'Laboratory'} has rejected the order for patient ${request?.patientName || 'Patient'}. Order ID: ${requestId}`,
        requestId: requestId,
        patientName: request?.patientName || 'Patient',
        laboratoryName: labInfo?.labName || 'Laboratory',
        orderType: 'laboratory',
        createdAt: new Date().toISOString(),
        read: false,
      })
      localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labRejected: true,
            labRejectedAt: new Date().toISOString(),
            rejectedBy: 'Laboratory',
            status: 'rejected',
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && (order.type === 'lab' || order.type === 'laboratory')) {
          return {
            ...order,
            status: 'rejected',
            labRejected: true,
            labRejectedAt: new Date().toISOString(),
            rejectedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            labRejected: true,
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order rejected successfully. Admin and patient have been notified.')
    } catch (error) {
      console.error('Error rejecting order:', error)
      alert('Error rejecting order. Please try again.')
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      const labId = 'lab-1' // Mock lab ID
      const labOrders = JSON.parse(localStorage.getItem(`labOrders_${labId}`) || '[]')
      const orderToUpdate = labOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update lab orders - set status as 'accepted'
      const updatedOrders = labOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            acceptedBy: 'Laboratory',
            labAccepted: true,
          }
        }
        return order
      })
      localStorage.setItem(`labOrders_${labId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labAccepted: true,
            labAcceptedAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Create notification for admin
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
      const request = allRequests.find(r => r.id === requestId)
      const labInfo = request?.adminResponse?.lab || request?.adminResponse?.labs?.[0] || {}
      adminNotifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'laboratory_accepted',
        title: 'Laboratory Order Accepted',
        message: `Laboratory ${labInfo?.labName || 'Laboratory'} has accepted the order for patient ${request?.patientName || 'Patient'}. Order ID: ${requestId}`,
        requestId: requestId,
        patientName: request?.patientName || 'Patient',
        laboratoryName: labInfo?.labName || 'Laboratory',
        orderType: 'laboratory',
        createdAt: new Date().toISOString(),
        read: false,
      })
      localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labAccepted: true,
            labAcceptedAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && (order.type === 'lab' || order.type === 'laboratory')) {
          return {
            ...order,
            status: 'accepted',
            labAccepted: true,
            labAcceptedAt: new Date().toISOString(),
            acceptedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            labAccepted: true,
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order accepted successfully!')
    } catch (error) {
      console.error('Error accepting order:', error)
      alert('Error accepting order. Please try again.')
    }
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      const labId = 'lab-1' // Mock lab ID
      const labOrders = JSON.parse(localStorage.getItem(`labOrders_${labId}`) || '[]')
      const orderToUpdate = labOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update lab orders
      const updatedOrders = labOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'completed',
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'Laboratory',
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem(`labOrders_${labId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labConfirmed: true,
            labConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            labConfirmed: true,
            labConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'lab') {
          return {
            ...order,
            status: 'completed',
            labConfirmed: true,
            labConfirmedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update admin orders - check for both 'lab' and 'laboratory' type
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]')
      const updatedAdminOrders = adminOrders.map(order => {
        // Match by requestId and labId, and check for both 'lab' and 'laboratory' types
        if (order.requestId === requestId && 
            (order.type === 'lab' || order.type === 'laboratory') && 
            order.labId === labId) {
          return {
            ...order,
            type: 'laboratory', // Ensure type is 'laboratory' for consistency
            status: 'completed',
            labConfirmed: true,
            labConfirmedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('adminOrders', JSON.stringify(updatedAdminOrders))
      
      loadRequests()
      alert('Order confirmed successfully!')
    } catch (error) {
      console.error('Error confirming order:', error)
      alert('Error confirming order. Please try again.')
    }
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    if (filter === 'pending') return request.status === 'pending'
    if (filter === 'completed') return request.status === 'completed'
    return true
  })

  const generatePDF = (request) => {
    const prescription = request.prescription
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108]
    const lightBlueColor = [230, 240, 255]
    const lightGrayColor = [245, 245, 245]
    let yPos = margin

    // Header
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Healiinn Prescription', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Doctor Name and Specialty
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescription?.doctorName || 'Doctor', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(prescription?.doctorSpecialty || 'Specialty', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Patient Info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Information', margin, yPos)
    yPos += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${request.patientName || 'N/A'}`, margin, yPos)
    yPos += 4
    if (request.patientPhone) {
      doc.text(`Phone: ${request.patientPhone}`, margin, yPos)
      yPos += 4
    }
    if (request.patientAddress) {
      const addressLines = doc.splitTextToSize(`Address: ${request.patientAddress}`, pageWidth - 2 * margin)
      addressLines.forEach(line => {
        doc.text(line, margin, yPos)
        yPos += 4
      })
    } else {
      yPos += 4
    }
    yPos += 2

    // Diagnosis
    if (prescription?.diagnosis) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Diagnosis', margin, yPos)
      yPos += 6
      const diagnosisHeight = 8
      doc.setFillColor(...lightBlueColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.diagnosis, margin + 4, yPos + 2)
      yPos += diagnosisHeight + 4
    }

    // Investigations/Tests
    if (prescription?.investigations && prescription.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Lab Tests Required', margin, yPos)
      yPos += 6

      prescription.investigations.forEach((test, idx) => {
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }

        const cardHeight = 18
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')

        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
        doc.text(testName, margin + 4, yPos + 3)

        if (typeof test === 'object' && test.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          const notesLines = doc.splitTextToSize(test.notes, pageWidth - 2 * margin - 8)
          notesLines.forEach((line, lineIdx) => {
            doc.text(line, margin + 4, yPos + 8 + (lineIdx * 4))
          })
        }

        yPos += cardHeight + 4
      })
    }

    // Date
    yPos += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Issued: ${formatDate(prescription?.issuedAt)}`, margin, yPos)

    return doc
  }

  const handleViewPDF = (request) => {
    const doc = generatePDF(request)
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const handleDownloadPDF = (request) => {
    const doc = generatePDF(request)
    const fileName = `Prescription_${request.patientName || 'Patient'}_${request.id}.pdf`
    doc.save(fileName)
  }

  const handleMarkCompleted = (requestId) => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(r => 
        r.id === requestId ? { ...r, status: 'completed' } : r
      )
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      loadRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-[#11496c] text-white shadow-md shadow-[rgba(17,73,108,0.3)]'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:bg-[rgba(17,73,108,0.05)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <IoFlaskOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No requests found</p>
            <p className="text-xs text-slate-400 mt-1">Patient lab test requests will appear here</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const getStatusIcon = (status) => {
              if (status === 'completed') return IoCheckmarkCircleOutline
              if (status === 'confirmed' || status === 'payment_pending') return IoCheckmarkCircleOutline
              return IoTimeOutline
            }
            const StatusIcon = getStatusIcon(request.status)
            const investigations = request.investigations || request.prescription?.investigations || []
            const investigationsCount = investigations.length

            return (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`rounded-lg border p-3 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98] ${
                  request.visitType === 'home'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - Smaller */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                    <IoPersonOutline className="h-5 w-5" />
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        {/* Patient Name and Visit Type Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{request.patientName || request.patient?.name || 'Unknown Patient'}</h3>
                          {request.visitType && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold border shrink-0 ${
                              request.visitType === 'home'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {request.visitType === 'home' ? (
                                <>
                                  <IoHomeOutline className="h-2.5 w-2.5" />
                                  HOME
                                </>
                              ) : (
                                <>
                                  <IoBusinessOutline className="h-2.5 w-2.5" />
                                  LAB
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        
                        {/* Patient Contact Info - Very Compact */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mb-1">
                          {(request.patientPhone || request.patient?.phone) && (
                            <div className="flex items-center gap-0.5">
                              <IoCallOutline className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[120px]">{request.patientPhone || request.patient?.phone}</span>
                            </div>
                          )}
                          {(request.patientAddress || request.patient?.address) && (
                            <div className="flex items-center gap-0.5">
                              <IoLocationOutline className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{request.patientAddress || request.patient?.address}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Doctor Info - Compact */}
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-600 mb-1">
                          <div className="flex items-center gap-0.5">
                            <IoMedicalOutline className="h-3 w-3" />
                            <span className="truncate">{request.prescription?.doctorName || 'Doctor'}</span>
                          </div>
                          {request.prescription?.doctorSpecialty && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="truncate">{request.prescription.doctorSpecialty}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Diagnosis - Compact */}
                        {request.prescription?.diagnosis && (
                          <p className="text-[10px] text-slate-600 truncate mb-1">
                            Diagnosis: {request.prescription.diagnosis}
                          </p>
                        )}
                        
                        {/* Tests Info - Compact */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 border border-blue-200">
                            <IoFlaskOutline className="h-2.5 w-2.5" />
                            {investigationsCount} Test{investigationsCount !== 1 ? 's' : ''}
                          </span>
                          {investigations.slice(0, 2).map((test, idx) => {
                            const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                            return (
                              <span key={idx} className="text-[9px] text-slate-500 truncate max-w-[100px]">
                                {testName}
                                {idx < Math.min(2, investigations.length - 1) ? ',' : ''}
                              </span>
                            )
                          })}
                          {investigations.length > 2 && (
                            <span className="text-[9px] text-slate-500">+{investigations.length - 2} more</span>
                          )}
                        </div>
                        
                        {/* Date and Time - Compact */}
                        {request.createdAt && (
                          <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-500">
                            <IoCalendarOutline className="h-2.5 w-2.5" />
                            <span>{formatDateTime(request.createdAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge - Top Right */}
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : request.status === 'payment_pending'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : request.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : request.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {request.status === 'pending' ? 'Pending' : 
                         request.status === 'payment_pending' ? 'Payment' :
                         request.status === 'confirmed' ? 'Confirmed' :
                         request.status === 'completed' ? 'Done' : request.status}
                      </span>
                    </div>
                    
                    {/* Action Buttons - Accept/Reject */}
                    {((request.paymentConfirmed || request.status === 'payment_pending' || request.status === 'pending' || request.status === 'confirmed') && !request.labAccepted && !request.labRejected && request.status !== 'completed' && request.status !== 'rejected' && request.status !== 'accepted') && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRejectOrder(request.id || request.requestId)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                        >
                          <IoCloseCircleOutline className="h-3 w-3" />
                          Reject
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcceptOrder(request.id || request.requestId)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                          Accept
                        </button>
                      </div>
                    )}
                    {/* Confirm Order Button - Show when order is accepted and payment confirmed but not yet confirmed */}
                    {(request.status === 'accepted' || request.status === 'confirmed' || request.status === 'payment_pending') && request.labAccepted && !request.labConfirmed && request.paymentConfirmed && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmOrder(request.id || request.requestId)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                          Confirm
                        </button>
                      </div>
                    )}
                    {/* Rejected Status Badge */}
                    {(request.status === 'rejected' || request.labRejected) && (
                      <div className="mt-2 flex justify-end">
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-300">
                          <IoCloseCircleOutline className="h-3 w-3" />
                          Rejected
                        </span>
                      </div>
                    )}
                    {/* Accepted Status Badge */}
                    {request.status === 'accepted' && request.labAccepted && !request.labConfirmed && (
                      <div className="mt-2 flex justify-end">
                        <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold bg-green-100 text-green-700 border border-green-300">
                          <IoCheckmarkCircleOutline className="h-3 w-3" />
                          Accepted
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Request Details</h2>
                  <p className="text-xs text-white/80">{selectedRequest.patientName || 'Patient'}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Visit Type Badge */}
              {selectedRequest.visitType && (
                <div className={`rounded-xl border p-4 ${
                  selectedRequest.visitType === 'home'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedRequest.visitType === 'home' ? (
                      <>
                        <IoHomeOutline className="h-5 w-5 text-emerald-700" />
                        <div>
                          <h3 className="text-sm font-semibold text-emerald-900">Home Sample Collection</h3>
                          <p className="text-xs text-emerald-700 mt-0.5">Sample will be collected from patient's home address</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <IoBusinessOutline className="h-5 w-5 text-blue-700" />
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">Lab Visit</h3>
                          <p className="text-xs text-blue-700 mt-0.5">Patient will visit the lab for sample collection</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Information */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Name:</span>
                    <span className="ml-2 text-slate-900 font-semibold">{selectedRequest.patientName || selectedRequest.patient?.name || 'N/A'}</span>
                  </div>
                  {(selectedRequest.patientPhone || selectedRequest.patient?.phone) && (
                    <div className="flex items-center gap-2">
                      <IoCallOutline className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-700">Phone:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.patientPhone || selectedRequest.patient?.phone}</span>
                      </div>
                    </div>
                  )}
                  {(selectedRequest.patientAddress || selectedRequest.patient?.address) && (
                    <div className="flex items-start gap-2">
                      <IoLocationOutline className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-slate-700">Address:</span>
                        <p className="mt-0.5 text-slate-900 leading-relaxed">{selectedRequest.patientAddress || selectedRequest.patient?.address}</p>
                        {selectedRequest.visitType === 'home' && (
                          <span className="mt-1 inline-block text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Sample Collection Address</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(selectedRequest.patientEmail || selectedRequest.patient?.email) && (
                    <div>
                      <span className="font-medium text-slate-700">Email:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientEmail || selectedRequest.patient?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Information */}
              {selectedRequest.prescription && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <IoMedicalOutline className="h-4 w-4" />
                    Doctor Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorName || 'N/A'}</span>
                    </div>
                    {selectedRequest.prescription.doctorSpecialty && (
                      <div>
                        <span className="font-medium text-slate-700">Specialty:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorSpecialty}</span>
                      </div>
                    )}
                    {selectedRequest.prescription.diagnosis && (
                      <div>
                        <span className="font-medium text-slate-700">Diagnosis:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.diagnosis}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lab Tests */}
              {(selectedRequest.investigations && selectedRequest.investigations.length > 0) || (selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <IoFlaskOutline className="h-4 w-4" />
                    Lab Tests Required ({(selectedRequest.investigations || selectedRequest.prescription?.investigations || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(selectedRequest.investigations || selectedRequest.prescription?.investigations || []).map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testNotes = typeof test === 'object' ? test.notes : null
                      const testPrice = typeof test === 'object' ? test.price : null
                      return (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-start gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#11496c] text-[10px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{testName}</p>
                              {testNotes && (
                                <p className="mt-1 text-xs text-slate-600">{testNotes}</p>
                              )}
                              {testPrice && (
                                <p className="mt-1 text-xs font-semibold text-[#11496c]">Price: ₹{Number(testPrice).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Prescription PDF */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoDocumentTextOutline className="h-4 w-4" />
                  Prescription PDF {selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl ? '(From Doctor)' : ''}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const pdfUrl = selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl
                      if (pdfUrl && pdfUrl !== '#' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                        window.open(pdfUrl, '_blank')
                      } else {
                        handleViewPDF(selectedRequest)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white hover:shadow-md"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                    <span>View PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      const pdfUrl = selectedRequest.prescriptionPdfUrl || selectedRequest.prescription?.pdfUrl
                      if (pdfUrl && pdfUrl !== '#' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                        const link = document.createElement('a')
                        link.href = pdfUrl
                        link.download = `Prescription_${selectedRequest.patientName || selectedRequest.patient?.name || 'Patient'}_${selectedRequest.id || Date.now()}.pdf`
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      } else {
                        handleDownloadPDF(selectedRequest)
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoDownloadOutline className="h-4 w-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Request Date */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <IoTimeOutline className="h-4 w-4" />
                <span>Request Date: {formatDateTime(selectedRequest.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                {/* Reject and Accept Buttons - Show when payment confirmed and order not yet accepted/rejected */}
                {((selectedRequest.paymentConfirmed || selectedRequest.status === 'payment_pending' || selectedRequest.status === 'pending' || selectedRequest.status === 'confirmed') && !selectedRequest.labAccepted && !selectedRequest.labRejected && selectedRequest.status !== 'completed' && selectedRequest.status !== 'rejected' && selectedRequest.status !== 'accepted') && (
                  <>
                    <button
                      onClick={() => {
                        handleRejectOrder(selectedRequest.id || selectedRequest.requestId)
                        setSelectedRequest(null)
                      }}
                      className="w-full rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <IoCloseCircleOutline className="h-5 w-5" />
                      <span>Reject Order</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAcceptOrder(selectedRequest.id || selectedRequest.requestId)
                        setSelectedRequest(null)
                      }}
                      className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      <span>Accept Order</span>
                    </button>
                  </>
                )}
                {/* Confirm Order Button - Show when order is accepted and payment confirmed but not yet confirmed */}
                {(selectedRequest.status === 'accepted' || selectedRequest.status === 'confirmed' || selectedRequest.status === 'payment_pending') && selectedRequest.labAccepted && !selectedRequest.labConfirmed && selectedRequest.paymentConfirmed && (
                  <button
                    onClick={() => {
                      handleConfirmOrder(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Confirm Order</span>
                  </button>
                )}
                {/* Rejected Status Badge */}
                {(selectedRequest.status === 'rejected' || selectedRequest.labRejected) && (
                  <div className="w-full rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 flex items-center justify-center gap-2">
                    <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Order Rejected</span>
                  </div>
                )}
                {/* Accepted Status Badge */}
                {selectedRequest.status === 'accepted' && selectedRequest.labAccepted && !selectedRequest.labConfirmed && (
                  <div className="w-full rounded-xl bg-green-50 border-2 border-green-200 px-4 py-3 flex items-center justify-center gap-2">
                    <IoCheckmarkCircleOutline className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Order Accepted</span>
                  </div>
                )}
                {/* Mark as Completed Button - Show when status is pending */}
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleMarkCompleted(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LaboratoryRequestOrders

