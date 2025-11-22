import { useState, useMemo } from 'react'
import {
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoCalendarOutline,
  IoAddOutline,
  IoShareSocialOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoSearchOutline,
} from 'react-icons/io5'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const LaboratoryTestReports = () => {
  // Mock confirmed orders (orders that are confirmed/ready/completed)
  const [confirmedOrders, setConfirmedOrders] = useState([
    {
      id: 'order-1',
      orderId: 'ORD-2025-001',
      patientId: 'pat-1',
      patientName: 'John Doe',
      patientImage: 'https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff&size=160&bold=true',
      patientPhone: '+1-555-123-4567',
      patientEmail: 'john.doe@example.com',
      status: 'ready',
      testName: 'Complete Blood Count (CBC)',
      orderDate: '2025-01-15T10:30:00.000Z',
      hasReport: false,
    },
    {
      id: 'order-2',
      orderId: 'ORD-2025-002',
      patientId: 'pat-2',
      patientName: 'Sarah Smith',
      patientImage: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=ec4899&color=fff&size=160&bold=true',
      patientPhone: '+1-555-234-5678',
      patientEmail: 'sarah.smith@example.com',
      status: 'completed',
      testName: 'Lipid Profile',
      orderDate: '2025-01-14T14:15:00.000Z',
      hasReport: true,
      reportShared: true,
    },
    {
      id: 'order-3',
      orderId: 'ORD-2025-003',
      patientId: 'pat-3',
      patientName: 'Mike Johnson',
      patientImage: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10b981&color=fff&size=160&bold=true',
      patientPhone: '+1-555-345-6789',
      patientEmail: 'mike.johnson@example.com',
      status: 'ready',
      testName: 'Liver Function Test (LFT)',
      orderDate: '2025-01-13T16:45:00.000Z',
      hasReport: false,
    },
    {
      id: 'order-4',
      orderId: 'ORD-2025-004',
      patientId: 'pat-4',
      patientName: 'Emily Brown',
      patientImage: 'https://ui-avatars.com/api/?name=Emily+Brown&background=8b5cf6&color=fff&size=160&bold=true',
      patientPhone: '+1-555-456-7890',
      patientEmail: 'emily.brown@example.com',
      status: 'completed',
      testName: 'Kidney Function Test (KFT)',
      orderDate: '2024-12-20T11:00:00.000Z',
      hasReport: true,
      reportShared: false,
    },
    {
      id: 'order-5',
      orderId: 'ORD-2025-005',
      patientId: 'pat-5',
      patientName: 'David Wilson',
      patientImage: 'https://ui-avatars.com/api/?name=David+Wilson&background=f59e0b&color=fff&size=160&bold=true',
      patientPhone: '+1-555-567-8901',
      patientEmail: 'david.wilson@example.com',
      status: 'completed',
      testName: 'Thyroid Function Test',
      orderDate: '2024-11-15T09:30:00.000Z',
      hasReport: true,
      reportShared: true,
    },
    {
      id: 'order-6',
      orderId: 'ORD-2025-006',
      patientId: 'pat-6',
      patientName: 'Lisa Anderson',
      patientImage: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=ef4444&color=fff&size=160&bold=true',
      patientPhone: '+1-555-678-9012',
      patientEmail: 'lisa.anderson@example.com',
      status: 'ready',
      testName: 'Vitamin D Test',
      orderDate: new Date().toISOString(), // Today
      hasReport: false,
    },
  ])

  const [historyFilter, setHistoryFilter] = useState('all') // 'all', 'day', 'month', 'year'
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrderForReport, setSelectedOrderForReport] = useState(null)
  const [showAddReportModal, setShowAddReportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0)

  // Filter orders based on history filter and search term
  const filteredOrdersByHistory = useMemo(() => {
    let filtered = confirmedOrders

    // Filter by history (date range)
    if (historyFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate)
        
        switch (historyFilter) {
          case 'day':
            // Today's orders
            return orderDate >= today
          case 'month':
            // Current month's orders
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return orderDate >= monthStart
          case 'year':
            // Current year's orders
            const yearStart = new Date(now.getFullYear(), 0, 1)
            return orderDate >= yearStart
          default:
            return true
        }
      })
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter((order) =>
        order.patientName.toLowerCase().includes(normalizedSearch) ||
        order.orderId.toLowerCase().includes(normalizedSearch) ||
        order.testName.toLowerCase().includes(normalizedSearch) ||
        order.patientPhone.includes(normalizedSearch) ||
        order.patientEmail.toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered
  }, [confirmedOrders, historyFilter, searchTerm])

  // Get counts for each filter
  const getFilterCount = (filterType) => {
    if (filterType === 'all') {
      return confirmedOrders.length
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return confirmedOrders.filter((order) => {
      const orderDate = new Date(order.orderDate)
      
      switch (filterType) {
        case 'day':
          return orderDate >= today
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return orderDate >= monthStart
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1)
          return orderDate >= yearStart
        default:
          return true
      }
    }).length
  }

  const handleAddReport = (order) => {
    setSelectedOrderForReport(order)
    setShowAddReportModal(true)
    setSelectedFile(null)
  }

  const handleShareReport = async (order) => {
    if (!order.hasReport) {
      alert('Please add report first before sharing')
      return
    }

    if (!window.confirm(`Share test report with ${order.patientName}?`)) {
      return
    }

    setIsSending(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Update order to mark as shared
      setConfirmedOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, reportShared: true }
            : o
        )
      )
      
      alert(`Test report shared with ${order.patientName} successfully!`)
    } catch (error) {
      alert('Failed to share report. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF file')
    }
  }

  const handleSaveReport = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }

    if (!selectedOrderForReport) {
      return
    }

    setIsSending(true)
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 150)

      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      
      // Update order to have report
      setConfirmedOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrderForReport.id
            ? { ...order, hasReport: true }
            : order
        )
      )
      
      setTimeout(() => {
        setShowAddReportModal(false)
        setSelectedOrderForReport(null)
        setSelectedFile(null)
        setUploadStatus(null)
        setUploadProgress(0)
        alert('Report added successfully!')
      }, 1500)
    } catch (error) {
      setUploadStatus('error')
      setUploadProgress(0)
      alert('Failed to add report. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseAddReportModal = () => {
    setShowAddReportModal(false)
    setSelectedOrderForReport(null)
    setSelectedFile(null)
    setUploadStatus(null)
    setUploadProgress(0)
  }

  const handleFilterSelect = (filter) => {
    setHistoryFilter(filter)
    setShowDropdown(false)
  }

  const getFilterLabel = () => {
    switch (historyFilter) {
      case 'day':
        return 'Days'
      case 'month':
        return 'Month'
      case 'year':
        return 'Year'
      default:
        return 'All'
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar with Dropdown */}
      <div className="flex gap-3">
        {/* Search Bar - Bigger */}
        <div className="flex-[2] relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by patient name, order ID, test name, phone, or email..."
            className="w-full rounded-lg border border-[rgba(17,73,108,0.2)] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* History Filter Dropdown - Smaller */}
        <div className="relative w-20 sm:w-24">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-3 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#11496c] to-[#0d3a52] text-white flex items-center justify-between border border-[#11496c] hover:from-[#0d3a52] hover:to-[#0a2d3f] transition-all shadow-md shadow-[rgba(17,73,108,0.2)] hover:shadow-lg hover:shadow-[rgba(17,73,108,0.3)]"
          >
            <span className="truncate">{getFilterLabel()}</span>
            {showDropdown ? (
              <IoChevronUpOutline className="h-3.5 w-3.5 ml-1 shrink-0" />
            ) : (
              <IoChevronDownOutline className="h-3.5 w-3.5 ml-1 shrink-0" />
            )}
          </button>

          {/* Dropdown Menu - Smaller */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg z-[10] overflow-hidden">
              <button
                onClick={() => handleFilterSelect('all')}
                className={`w-full px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  historyFilter === 'all'
                    ? 'bg-[rgba(17,73,108,0.1)] text-[#11496c]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterSelect('day')}
                className={`w-full px-3 py-2 text-xs font-semibold text-left transition-colors border-t border-slate-100 ${
                  historyFilter === 'day'
                    ? 'bg-[rgba(17,73,108,0.1)] text-[#11496c]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Days
              </button>
              <button
                onClick={() => handleFilterSelect('month')}
                className={`w-full px-3 py-2 text-xs font-semibold text-left transition-colors border-t border-slate-100 ${
                  historyFilter === 'month'
                    ? 'bg-[rgba(17,73,108,0.1)] text-[#11496c]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => handleFilterSelect('year')}
                className={`w-full px-3 py-2 text-xs font-semibold text-left transition-colors border-t border-slate-100 ${
                  historyFilter === 'year'
                    ? 'bg-[rgba(17,73,108,0.1)] text-[#11496c]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Year
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Confirmed Orders List */}
      <div className="space-y-3">
        {filteredOrdersByHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoDocumentTextOutline className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">
              No confirmed orders found for {historyFilter === 'day' ? 'today' : historyFilter === 'month' ? 'this month' : historyFilter === 'year' ? 'this year' : 'the selected period'}
            </p>
          </div>
        ) : (
          filteredOrdersByHistory.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Patient Image */}
                <img
                  src={order.patientImage}
                  alt={order.patientName}
                  className="h-16 w-16 rounded-xl object-cover bg-slate-100 border-2 border-slate-200"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.patientName)}&background=11496c&color=fff&size=160&bold=true`
                  }}
                />

                {/* Patient Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900">{order.patientName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Order ID: {order.orderId}</p>
                      <p className="text-sm font-medium text-slate-700 mt-1">{order.testName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      order.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      order.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {order.status === 'ready' ? <IoCheckmarkCircleOutline className="h-3 w-3" /> : null}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
                    <a href={`tel:${order.patientPhone}`} className="flex items-center gap-1 hover:text-[#11496c]">
                      <IoCallOutline className="h-3 w-3" />
                      {order.patientPhone}
                    </a>
                    <span className="text-slate-300">•</span>
                    <a href={`mailto:${order.patientEmail}`} className="flex items-center gap-1 hover:text-[#11496c]">
                      <IoMailOutline className="h-3 w-3" />
                      {order.patientEmail}
                    </a>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1">
                      <IoCalendarOutline className="h-3 w-3" />
                      {formatDate(order.orderDate)}
                    </div>
                  </div>

                  {/* Report Status */}
                  {order.hasReport && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      <IoCheckmarkCircleOutline className="h-3 w-3" />
                      Report Added
                      {order.reportShared && (
                        <>
                          <span className="text-slate-300 mx-1">•</span>
                          <span>Shared</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                {!order.hasReport ? (
                  <button
                    onClick={() => handleAddReport(order)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95"
                  >
                    <IoAddOutline className="h-4 w-4" />
                    Add Lab Report
                  </button>
                ) : (
                  <button
                    onClick={() => handleShareReport(order)}
                    disabled={isSending || order.reportShared}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
                      order.reportShared
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-500 text-white shadow-emerald-400/40 hover:bg-emerald-600'
                    }`}
                  >
                    <IoShareSocialOutline className="h-4 w-4" />
                    {order.reportShared ? 'Already Shared' : 'Share with Patient'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Lab Report Modal */}
      {showAddReportModal && selectedOrderForReport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={handleCloseAddReportModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#11496c] to-[#0d3a52] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <IoAddOutline className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Add Lab Report</h2>
                    <p className="text-xs text-white/80">{selectedOrderForReport.patientName}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAddReportModal}
                  className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status Bar */}
            {uploadStatus && (
              <div className="px-4 sm:px-6 pt-4">
                <div className={`rounded-xl p-3 ${
                  uploadStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-700">Uploading...</span>
                        <span className="text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Report added successfully!</span>
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2">
                      <IoCloseCircleOutline className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Failed to add report</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-5">
              {/* Patient Info */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Patient Information</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrderForReport.patientName}</p>
                  <p><span className="font-medium">Order ID:</span> {selectedOrderForReport.orderId}</p>
                  <p><span className="font-medium">Test:</span> {selectedOrderForReport.testName}</p>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Upload Report PDF</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="report-upload"
                  />
                  <label
                    htmlFor="report-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[rgba(17,73,108,0.3)] rounded-xl bg-[rgba(17,73,108,0.05)] cursor-pointer transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.1)]"
                  >
                    {selectedFile ? (
                      <>
                        <IoDocumentTextOutline className="h-8 w-8 text-[#11496c] mb-2" />
                        <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <IoCloudUploadOutline className="h-8 w-8 text-[#11496c] mb-2" />
                        <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                        <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCloseAddReportModal}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={!selectedFile || isSending}
                  className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Adding...' : 'Add Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LaboratoryTestReports

