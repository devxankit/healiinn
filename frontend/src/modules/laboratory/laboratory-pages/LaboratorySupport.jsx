import { useState } from 'react'
import { IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'

const LaboratorySupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    labName: '',
    email: '',
    contactNumber: '',
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // TODO: Replace with actual API call
    // await submitSupportRequest({ ...formData, role: 'laboratory' })

    setIsSubmitting(false)
    setShowSuccessModal(true)
    setFormData({
      name: '',
      labName: '',
      email: '',
      contactNumber: '',
      note: '',
    })
  }

  const isFormValid = formData.name && formData.labName && formData.email && formData.contactNumber && formData.note

  return (
    <div className="mx-auto max-w-2xl py-6 lg:max-w-xl lg:py-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:rounded-xl lg:p-4">
        <div className="mb-6 lg:mb-4">
          <h1 className="text-2xl font-bold text-slate-900 lg:text-xl">Support Request</h1>
          <p className="mt-2 text-sm text-slate-600 lg:mt-1.5 lg:text-xs">Fill out the form below and we'll get back to you soon.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-3.5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-xs">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 lg:px-3 lg:py-2 lg:text-xs"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="labName" className="mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-xs">
              Laboratory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="labName"
              name="labName"
              value={formData.labName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 lg:px-3 lg:py-2 lg:text-xs"
              placeholder="Enter your laboratory name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-xs">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 lg:px-3 lg:py-2 lg:text-xs"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-xs">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 lg:px-3 lg:py-2 lg:text-xs"
              placeholder="Enter your contact number"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-2 block text-sm font-semibold text-slate-700 lg:mb-1.5 lg:text-xs">
              Note/Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              required
              rows={5}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 lg:px-3 lg:py-2 lg:text-xs lg:rows-4"
              placeholder="Describe your issue or question..."
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full rounded-lg bg-[#11496c] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50 lg:px-3 lg:py-2 lg:text-xs"
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

export default LaboratorySupport

