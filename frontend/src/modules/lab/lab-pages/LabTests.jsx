import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoFlaskOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'

const mockTests = [
  {
    id: 'test-1',
    testName: 'Complete Blood Count (CBC)',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientPhone: '+1-555-123-4567',
    patientEmail: 'john.doe@example.com',
    doctorName: 'Dr. Emily Davis',
    status: 'pending',
    requestedAt: '2024-01-15T10:30:00.000Z',
    scheduledAt: '2024-01-16T09:00:00.000Z',
    price: 25.0,
    instructions: 'Fasting not required',
  },
  {
    id: 'test-2',
    testName: 'Blood Glucose (Fasting)',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    patientPhone: '+1-555-234-5678',
    patientEmail: 'sarah.smith@example.com',
    doctorName: 'Dr. Robert Wilson',
    status: 'in-progress',
    requestedAt: '2024-01-14T14:15:00.000Z',
    scheduledAt: '2024-01-15T08:00:00.000Z',
    price: 15.0,
    instructions: 'Fasting required for 8-12 hours',
  },
  {
    id: 'test-3',
    testName: 'Lipid Profile',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    patientPhone: '+1-555-345-6789',
    patientEmail: 'mike.johnson@example.com',
    doctorName: 'Dr. Sarah Johnson',
    status: 'completed',
    requestedAt: '2024-01-13T16:45:00.000Z',
    scheduledAt: '2024-01-14T10:00:00.000Z',
    completedAt: '2024-01-14T11:30:00.000Z',
    price: 35.0,
    instructions: 'Fasting required for 12 hours',
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: IoTimeOutline },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: IoFlaskOutline },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: IoCheckmarkCircleOutline },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: IoCloseCircleOutline },
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const LabTests = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTest, setSelectedTest] = useState(null)

  const filteredTests = useMemo(() => {
    let tests = mockTests

    if (filter !== 'all') {
      tests = tests.filter((test) => test.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      tests = tests.filter(
        (test) =>
          test.patientName.toLowerCase().includes(normalizedSearch) ||
          test.testName.toLowerCase().includes(normalizedSearch) ||
          test.id.toLowerCase().includes(normalizedSearch) ||
          test.doctorName.toLowerCase().includes(normalizedSearch)
      )
    }

    return tests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  }, [filter, searchTerm])

  const handleStatusUpdate = async (testId, newStatus) => {
    const test = mockTests.find((t) => t.id === testId)
    if (!test) {
      alert('Test not found')
      return
    }

    const statusLabel = statusConfig[newStatus]?.label || newStatus
    const patientName = test.patientName
    const testName = test.testName

    const confirmMessage = `Update test status to "${statusLabel}"?\n\nPatient: ${patientName}\nTest: ${testName}\nTest ID: ${testId}\n\nThis will send a notification to the patient.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const notificationData = {
        testId,
        patientId: test.patientId,
        patientName,
        patientEmail: test.patientEmail,
        patientPhone: test.patientPhone,
        testName,
        status: newStatus,
        statusLabel,
        price: test.price,
        updatedAt: new Date().toISOString(),
      }

      let notificationTitle = ''
      let notificationMessage = ''

      switch (newStatus) {
        case 'pending':
          notificationTitle = '📋 Test Request Received'
          notificationMessage = `Your test request for "${testName}" has been received. Test ID: ${testId}. Please prepare as per instructions.`
          break
        case 'in-progress':
          notificationTitle = '🔬 Test In Progress'
          notificationMessage = `Your test "${testName}" is currently being processed. Test ID: ${testId}. Results will be available soon.`
          break
        case 'completed':
          notificationTitle = '✅ Test Completed'
          notificationMessage = `Your test "${testName}" has been completed. Test ID: ${testId}. Report is ready for download.`
          break
        default:
          notificationTitle = 'Test Status Updated'
          notificationMessage = `Your test "${testName}" status has been updated to ${statusLabel}. Test ID: ${testId}.`
      }

      console.log('Sending test status notification to patient:', {
        type: 'TEST_STATUS_UPDATE',
        recipient: {
          role: 'patient',
          userId: test.patientId,
          email: test.patientEmail,
          phone: test.patientPhone,
        },
        notification: {
          title: notificationTitle,
          message: notificationMessage,
          data: notificationData,
        },
      })

      alert(`✅ Test status updated to "${statusLabel}"!\n\n📱 Notification sent to ${patientName}\n\n${notificationTitle}\n${notificationMessage}`)
    } catch (error) {
      console.error('Error updating test status:', error)
      alert('Failed to update test status. Please try again.')
    }
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/lab/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          aria-label="Go back"
        >
          <IoArrowBackOutline className="text-xl" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Test Requests</h1>
          <p className="text-sm text-slate-600">Manage laboratory test requests</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === status
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-400/40'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {statusConfig[status]?.label || status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search tests, patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <IoFlaskOutline className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No tests found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          filteredTests.map((test) => {
            const StatusIcon = statusConfig[test.status]?.icon || IoTimeOutline
            return (
              <article
                key={test.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{test.testName}</h3>
                        <p className="mt-1 text-sm text-slate-600">Test ID: {test.id}</p>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          statusConfig[test.status]?.color || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {statusConfig[test.status]?.label || test.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoPersonOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>{test.patientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoDocumentTextOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>{test.doctorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <IoCalendarOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>Requested: {formatDateTime(test.requestedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium text-slate-900">Price: {formatCurrency(test.price)}</span>
                      </div>
                    </div>

                    {test.instructions && (
                      <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        <span className="font-medium">Instructions: </span>
                        {test.instructions}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    {test.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(test.id, 'in-progress')}
                        className="bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                      >
                        Start Test
                      </button>
                    )}
                    {test.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(test.id, 'completed')}
                        className="bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-400/40 transition-all hover:bg-emerald-600 active:scale-95"
                      >
                        Mark Complete
                      </button>
                    )}
                    <a
                      href={`tel:${test.patientPhone}`}
                      className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      <IoCallOutline className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      href={`mailto:${test.patientEmail}`}
                      className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      <IoMailOutline className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedTest(test)}
                      className="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-bold text-slate-900">Test Details</h2>
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close"
              >
                <IoCloseCircleOutline className="text-xl" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedTest.testName}</h3>
                  <p className="text-sm text-slate-600">Test ID: {selectedTest.id}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Patient</p>
                    <p className="text-sm text-slate-900">{selectedTest.patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Doctor</p>
                    <p className="text-sm text-slate-900">{selectedTest.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Requested At</p>
                    <p className="text-sm text-slate-900">{formatDateTime(selectedTest.requestedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Scheduled At</p>
                    <p className="text-sm text-slate-900">{formatDateTime(selectedTest.scheduledAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Price</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(selectedTest.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        statusConfig[selectedTest.status]?.color || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusConfig[selectedTest.status]?.label || selectedTest.status}
                    </span>
                  </div>
                </div>
                {selectedTest.instructions && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Instructions</p>
                    <p className="mt-1 text-sm text-slate-900">{selectedTest.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default LabTests

