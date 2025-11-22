import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoShareSocialOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoFlaskOutline,
  IoMedicalOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from 'react-icons/io5'

// Mock data for lab reports
const mockLabReports = [
  {
    id: 'report-1',
    testName: 'Complete Blood Count (CBC)',
    labName: 'MediCare Diagnostics',
    labId: 'lab-1',
    date: '2025-01-10',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-1', // Doctor with whom appointment was booked
    doctorName: 'Dr. Sarah Mitchell',
    doctorSpecialty: 'Cardiology',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'report-2',
    testName: 'Lipid Profile',
    labName: 'HealthFirst Lab',
    labId: 'lab-2',
    date: '2025-01-08',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-2',
    doctorName: 'Dr. John Smith',
    doctorSpecialty: 'General Medicine',
    doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'report-3',
    testName: 'Thyroid Function Test',
    labName: 'Precision Labs',
    labId: 'lab-3',
    date: '2025-01-12',
    status: 'ready',
    downloadUrl: '#',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Mitchell',
    doctorSpecialty: 'Cardiology',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'report-4',
    testName: 'Liver Function Test',
    labName: 'MediCare Diagnostics',
    labId: 'lab-1',
    date: '2025-01-15',
    status: 'ready',
    downloadUrl: '#',
    doctorId: null, // No doctor associated
    doctorName: null,
    doctorSpecialty: null,
    doctorImage: null,
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

const PatientReports = () => {
  const navigate = useNavigate()
  const [showShareModal, setShowShareModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isSharing, setIsSharing] = useState(false)

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

  const [selectedDoctorId, setSelectedDoctorId] = useState(null)

  const handleViewClick = (report) => {
    setSelectedReport(report)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedReport(null)
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

  const handleShareWithDoctor = async () => {
    if (!selectedReport) return

    setIsSharing(true)
    
    const patientId = 'pat-current' // In real app, get from auth
    const selectedDoctor = mockDoctors.find(doc => doc.id === selectedDoctorId)
    
    // If sharing with associated doctor (direct share)
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
        alert(`Report shared successfully with ${selectedReport.doctorName}`)
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

  const handleDownload = (report) => {
    // Generate and download PDF report
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Medical Report - ${report.testName}</title>
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
  </style>
</head>
<body>
  <div class="header">
    <h1>Medical Test Report</h1>
    <div style="color: #64748b; margin-top: 5px; font-size: 14px;">Healiinn - Your Health Partner</div>
  </div>
  <div class="section">
    <div class="section-title">Report Information</div>
    <div class="info-row">
      <span class="info-label">Test Name:</span>
      <span class="info-value">${report.testName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Laboratory:</span>
      <span class="info-value">${report.labName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Report Date:</span>
      <span class="info-value">${formatDate(report.date)}</span>
    </div>
  </div>
</body>
</html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(pdfContent)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
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
            <h1 className="text-lg font-bold text-slate-900">Lab Reports</h1>
            <p className="text-xs text-slate-600">Share reports with your doctors</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-4">
          {mockLabReports.map((report) => (
            <article
              key={report.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md flex flex-col min-h-[180px]"
            >
              {/* Header Section */}
              <div className="flex items-start gap-4 p-5 pb-4 flex-1 min-h-[120px]">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ 
                  background: 'linear-gradient(to bottom right, rgba(17, 73, 108, 0.8), #11496c)',
                  boxShadow: '0 10px 15px -3px rgba(17, 73, 108, 0.3)'
                }}>
                  <IoFlaskOutline className="h-8 w-8" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">{report.testName}</h3>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-1">{report.labName}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <IoTimeOutline className="h-3.5 w-3.5 shrink-0" />
                        <span className="whitespace-nowrap">{formatDate(report.date)}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                      Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                <button
                  type="button"
                  onClick={() => handleDownload(report)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-[0.98]"
                >
                  <IoDownloadOutline className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewClick(report)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-95"
                  aria-label="View report"
                >
                  <IoEyeOutline className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareClick(report)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-[rgba(17,73,108,0.4)] hover:bg-[rgba(17,73,108,0.1)] hover:text-[#11496c] hover:shadow active:scale-95"
                  aria-label="Share with doctor"
                >
                  <IoShareSocialOutline className="h-5 w-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

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
              </div>

              {/* Associated Doctor - Direct Share */}
              {selectedReport.doctorId && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Your Appointed Doctor (Direct Share):</p>
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
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{selectedReport.doctorName}</h3>
                        <p className="text-xs text-slate-600">{selectedReport.doctorSpecialty}</p>
                      </div>
                      {selectedDoctorId === selectedReport.doctorId && (
                        <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#11496c]">✓ Can share directly (appointment already booked)</p>
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
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                          selectedDoctorId === doctor.id
                            ? 'border-[#11496c] bg-[rgba(17,73,108,0.1)]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                            <p className="text-xs text-slate-600">{doctor.specialty}</p>
                          </div>
                          {selectedDoctorId === doctor.id && (
                            <IoCheckmarkCircleOutline className="h-5 w-5 text-[#11496c] shrink-0" />
                          )}
                        </div>
                        <p className="mt-2 text-xs text-amber-600">⚠ Requires booking appointment</p>
                      </button>
                    ))}
                </div>
              </div>

              {selectedDoctorId && (
                <div className="mt-4 rounded-lg bg-[rgba(17,73,108,0.1)] p-3">
                  <p className="text-xs text-[#0a2d3f]">
                    {selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId ? (
                      <>
                        <strong>Direct Share:</strong> Report will be shared immediately with {selectedReport.doctorName}.
                      </>
                    ) : (
                      <>
                        <strong>Note:</strong> To share with this doctor, you'll need to book an appointment first. The booking page will open after sharing.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-6 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCloseShareModal}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
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
                    {selectedReport.doctorId && selectedDoctorId === selectedReport.doctorId
                      ? 'Share Now'
                      : 'Share & Book'}
                  </>
                )}
              </button>
            </div>
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
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      {selectedReport.status === 'ready' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

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
                      <span className="text-xs font-semibold text-emerald-700">
                        {selectedReport.status === 'ready' ? 'Ready' : 'Pending'}
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
                  handleCloseViewModal()
                  handleDownload(selectedReport)
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52]"
              >
                <IoDownloadOutline className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientReports

