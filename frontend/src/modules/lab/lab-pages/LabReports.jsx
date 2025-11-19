import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5'

const mockReports = [
  {
    id: 'report-1',
    testName: 'Complete Blood Count (CBC)',
    patientId: 'pat-1',
    patientName: 'John Doe',
    status: 'completed',
    completedAt: '2024-01-14T11:30:00.000Z',
    requestedAt: '2024-01-13T10:00:00.000Z',
    doctorName: 'Dr. Emily Davis',
    pdfUrl: '#',
  },
  {
    id: 'report-2',
    testName: 'Blood Glucose (Fasting)',
    patientId: 'pat-2',
    patientName: 'Sarah Smith',
    status: 'completed',
    completedAt: '2024-01-15T09:15:00.000Z',
    requestedAt: '2024-01-14T08:00:00.000Z',
    doctorName: 'Dr. Robert Wilson',
    pdfUrl: '#',
  },
  {
    id: 'report-3',
    testName: 'Lipid Profile',
    patientId: 'pat-3',
    patientName: 'Mike Johnson',
    status: 'completed',
    completedAt: '2024-01-13T14:20:00.000Z',
    requestedAt: '2024-01-12T16:00:00.000Z',
    doctorName: 'Dr. Sarah Johnson',
    pdfUrl: '#',
  },
]

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const LabReports = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredReports = useMemo(() => {
    let reports = mockReports

    if (filter !== 'all') {
      reports = reports.filter((report) => report.status === filter)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      reports = reports.filter(
        (report) =>
          report.patientName.toLowerCase().includes(normalizedSearch) ||
          report.testName.toLowerCase().includes(normalizedSearch) ||
          report.id.toLowerCase().includes(normalizedSearch) ||
          report.doctorName.toLowerCase().includes(normalizedSearch)
      )
    }

    return reports.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  }, [filter, searchTerm])

  const handleDownloadReport = (report) => {
    // In real app, this would download the PDF report
    console.log('Downloading report:', report.id)
    alert(`Downloading report: ${report.testName} for ${report.patientName}`)
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
          <h1 className="text-xl font-bold text-slate-900">Test Reports</h1>
          <p className="text-sm text-slate-600">Manage completed test reports</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'completed'].map((status) => (
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
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search reports, patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <IoDocumentTextOutline className="mx-auto mb-3 text-4xl text-slate-400" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-600">No reports found</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <article
              key={report.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{report.testName}</h3>
                      <p className="mt-1 text-sm text-slate-600">Report ID: {report.id}</p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <IoCheckmarkCircleOutline className="h-3.5 w-3.5" aria-hidden="true" />
                      Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoPersonOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{report.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoDocumentTextOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>{report.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <IoCalendarOutline className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>Completed: {formatDateTime(report.completedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-col">
                  <button
                    type="button"
                    onClick={() => handleDownloadReport(report)}
                    className="bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-400/40 transition-all hover:bg-blue-600 active:scale-95"
                  >
                    <IoDownloadOutline className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default LabReports

