import { useState, useEffect } from 'react'
import { IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'
import { createSupportTicket, getSupportTickets } from '../pharmacy-services/pharmacyService'
import { useToast } from '../../../contexts/ToastContext'

const PharmacySupport = () => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [activeTab, setActiveTab] = useState('new') // 'new' or 'tickets'

  // Fetch support tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (activeTab === 'tickets') {
        try {
          setLoadingTickets(true)
          const response = await getSupportTickets()
          if (response.success && response.data) {
            const ticketsList = response.data.items || response.data || []
            setTickets(ticketsList)
          }
        } catch (error) {
          console.error('Error fetching tickets:', error)
          toast.error('Failed to load support tickets')
        } finally {
          setLoadingTickets(false)
        }
      }
    }

    fetchTickets()
  }, [activeTab, toast])

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
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority || 'medium',
      })

      if (response.success) {
        setIsSubmitting(false)
        setShowSuccessModal(true)
        setFormData({
          subject: '',
          message: '',
          priority: 'medium',
        })
        toast.success('Support ticket created successfully!')
      } else {
        throw new Error(response.message || 'Failed to create support ticket')
      }
    } catch (error) {
      console.error('Error creating support ticket:', error)
      toast.error(error.message || 'Failed to create support ticket. Please try again.')
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'closed':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isFormValid = formData.subject && formData.message

  return (
    <div className="mx-auto max-w-4xl py-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
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
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'tickets'
              ? 'border-b-2 border-[#11496c] text-[#11496c]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Tickets
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
              <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-slate-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                placeholder="Enter subject"
              />
            </div>

            <div>
              <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-semibold text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
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

      {/* My Tickets List */}
      {activeTab === 'tickets' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My Support Tickets</h1>
            <p className="mt-2 text-sm text-slate-600">View all your support requests and their status.</p>
          </div>

          {loadingTickets ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#11496c] border-t-transparent" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-600">No support tickets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id || ticket.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-bold text-slate-900">{ticket.subject || 'No Subject'}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status || 'open'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{ticket.message || ticket.note || ''}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>ID: {ticket._id || ticket.id}</span>
                        <span>{formatDate(ticket.createdAt || ticket.date)}</span>
                        {ticket.priority && (
                          <span className="capitalize">Priority: {ticket.priority}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

export default PharmacySupport

