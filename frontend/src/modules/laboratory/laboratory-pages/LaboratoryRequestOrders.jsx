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
      
      // Also load from adminRequests for backward compatibility
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const labTestRequests = allRequests.filter(r => r.type === 'book_test_visit' && r.adminResponse?.lab?.id === labId)
      
      // Combine and deduplicate
      const combined = [...labOrders, ...labTestRequests]
      const unique = combined.filter((req, idx, self) => 
        idx === self.findIndex(r => r.id === req.id || r.requestId === req.requestId)
      )
      
      setRequests(unique)
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests([])
    }
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      const labId = 'lab-1' // Mock lab ID
      const labOrders = JSON.parse(localStorage.getItem(`labOrders_${labId}`) || '[]')
      const updatedOrders = labOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'confirmed',
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'Laboratory',
          }
        }
        return order
      })
      localStorage.setItem(`labOrders_${labId}`, JSON.stringify(updatedOrders))
      
      // Also update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === orderId || req.id === labOrders.find(o => o.id === orderId || o.requestId === orderId)?.requestId) {
          return {
            ...req,
            labConfirmed: true,
            labConfirmedAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: requests.length },
          { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
          { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-[#11496c] text-white shadow-md shadow-[rgba(17,73,108,0.3)]'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-[rgba(17,73,108,0.3)] hover:bg-[rgba(17,73,108,0.05)]'
            }`}
          >
            {tab.label} ({tab.count})
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
            const StatusIcon = request.status === 'completed' ? IoCheckmarkCircleOutline : IoTimeOutline
            const investigations = request.prescription?.investigations || []
            const investigationsCount = investigations.length

            return (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                    <IoPersonOutline className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">{request.patientName || 'Unknown Patient'}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <IoMedicalOutline className="h-3.5 w-3.5" />
                            <span>{request.prescription?.doctorName || 'Doctor'}</span>
                          </div>
                          {request.prescription?.doctorSpecialty && (
                            <>
                              <span>•</span>
                              <span>{request.prescription.doctorSpecialty}</span>
                            </>
                          )}
                        </div>
                        {request.prescription?.diagnosis && (
                          <p className="mt-1.5 text-xs text-slate-600 line-clamp-1">
                            Diagnosis: {request.prescription.diagnosis}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 border border-blue-200">
                            <IoFlaskOutline className="h-3 w-3" />
                            {investigationsCount} Test{investigationsCount !== 1 ? 's' : ''}
                          </span>
                          {investigations.slice(0, 2).map((test, idx) => {
                            const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                            return (
                              <span key={idx} className="text-[10px] text-slate-500">
                                {testName}
                                {idx < Math.min(2, investigations.length - 1) ? ',' : ''}
                              </span>
                            )
                          })}
                          {investigations.length > 2 && (
                            <span className="text-[10px] text-slate-500">+{investigations.length - 2} more</span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : request.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        <StatusIcon className="h-3 w-3" />
                        {request.status === 'pending' ? 'Pending' : request.status === 'completed' ? 'Completed' : request.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <IoCalendarOutline className="h-3.5 w-3.5" />
                          <span>{formatDateTime(request.createdAt)}</span>
                        </div>
                      </div>
                      {(request.status === 'pending' || request.status === 'confirmed') && !request.labConfirmed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmOrder(request.id || request.requestId)
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                        >
                          <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                          Confirm Order
                        </button>
                      )}
                    </div>
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
              {/* Patient Information */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoPersonOutline className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Name:</span>
                    <span className="ml-2 text-slate-900">{selectedRequest.patientName || 'N/A'}</span>
                  </div>
                  {selectedRequest.patientPhone && (
                    <div>
                      <span className="font-medium text-slate-700">Phone:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientPhone}</span>
                    </div>
                  )}
                  {selectedRequest.patientAddress && (
                    <div>
                      <span className="font-medium text-slate-700">Address:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientAddress}</span>
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
              {selectedRequest.prescription?.investigations && selectedRequest.prescription.investigations.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <IoFlaskOutline className="h-4 w-4" />
                    Lab Tests Required ({selectedRequest.prescription.investigations.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedRequest.prescription.investigations.map((test, idx) => {
                      const testName = typeof test === 'string' ? test : test.name || test.testName || 'Test'
                      const testNotes = typeof test === 'object' ? test.notes : null
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
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Prescription PDF */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <IoDocumentTextOutline className="h-4 w-4" />
                  Prescription PDF
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white hover:shadow-md"
                  >
                    <IoEyeOutline className="h-4 w-4" />
                    <span>View PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedRequest)}
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

              {/* Action Button */}
              {selectedRequest.status === 'pending' && (
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleMarkCompleted(selectedRequest.id)}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Mark as Completed</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LaboratoryRequestOrders

