import { useState, useEffect } from 'react'
import { IoCloseOutline, IoCheckmarkCircleOutline, IoTimeOutline, IoCheckmarkCircle, IoCloseCircle, IoHourglassOutline } from 'react-icons/io5'
import { createSupportTicket, getSupportTickets, getSupportHistory } from '../patient-services/patientService'
import { useToast } from '../../../contexts/ToastContext'

const PatientSupport = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('new') // 'new', 'tickets', 'history'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [tickets, setTickets] = useState([])
  const [history, setHistory] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await createSupportTicket({
        subject: `Support Request from ${formData.name}`,
        message: formData.note,
        priority: 'medium',
      })

      if (response.success) {
        toast.success('Support request submitted successfully')
        setShowSuccessModal(true)
        setFormData({
          name: '',
          email: '',
          contactNumber: '',
          note: '',
        })
      }
    } catch (error) {
      console.error('Error submitting support request:', error)
      toast.error(error.message || 'Failed to submit support request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch support tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true)
        const response = await getSupportTickets()
        if (response.success && response.data) {
          const ticketsData = Array.isArray(response.data)
            ? response.data
            : response.data.tickets || []
          setTickets(ticketsData)
        }
      } catch (error) {
        console.error('Error fetching support tickets:', error)
        setTickets([])
      } finally {
        setLoadingTickets(false)
      }
    }

    if (activeTab === 'tickets') {
      fetchTickets()
    }
  }, [activeTab])

  // Fetch support history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true)
        const response = await getSupportHistory()
        if (response.success && response.data) {
          const historyData = Array.isArray(response.data)
            ? response.data
            : response.data.history || []
          setHistory(historyData)
        }
      } catch (error) {
        console.error('Error fetching support history:', error)
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return <IoCheckmarkCircle className="h-5 w-5 text-green-600" />
      case 'open':
      case 'pending':
        return <IoHourglassOutline className="h-5 w-5 text-yellow-600" />
      case 'rejected':
        return <IoCloseCircle className="h-5 w-5 text-red-600" />
      default:
        return <IoTimeOutline className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-700'
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateString
    }
  }

  const isFormValid = formData.name && formData.email && formData.contactNumber && formData.note

  return (
    <div className="mx-auto max-w-2xl py-6">
      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'new'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          New Request
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'tickets'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'history'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          History
        </button>
      </div>

      {/* New Request Form */}
      {activeTab === 'new' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Support Request</h1>
            <p className="mt-2 text-sm text-slate-600">Fill out the form below and we'll get back to you soon.</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="mb-2 block text-sm font-semibold text-slate-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
              placeholder="Enter your contact number"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-2 block text-sm font-semibold text-slate-700">
              Note/Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              required
              rows={5}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
              placeholder="Describe your issue or question..."
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <IoCloseOutline className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <IoCheckmarkCircleOutline className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Request Submitted!</h2>
              <p className="mb-6 text-sm text-slate-600">
                Your support request has been sent successfully. We'll get back to you soon.
              </p>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientSupport

