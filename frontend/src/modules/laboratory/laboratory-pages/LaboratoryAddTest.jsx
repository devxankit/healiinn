import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IoFlaskOutline,
} from 'react-icons/io5'

const LaboratoryAddTest = () => {
  const navigate = useNavigate()
  const { testId } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (testId) {
      // Load test data for editing
      const tests = JSON.parse(localStorage.getItem('laboratoryAvailableTests') || '[]')
      const test = tests.find(t => t.id === testId)
      if (test) {
        setFormData({
          name: test.name,
          price: test.price,
        })
        setIsEditing(true)
      } else {
        // Test not found, navigate back
        navigate('/laboratory/available-tests')
      }
    }
  }, [testId, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price.trim()) {
      alert('Please fill in all required fields')
      return
    }

    const tests = JSON.parse(localStorage.getItem('laboratoryAvailableTests') || '[]')

    if (isEditing && testId) {
      // Update existing test
      const updatedTests = tests.map(test =>
        test.id === testId
          ? {
              ...test,
              name: formData.name.trim(),
              price: formData.price.trim(),
              updatedAt: new Date().toISOString(),
            }
          : test
      )
      localStorage.setItem('laboratoryAvailableTests', JSON.stringify(updatedTests))
      alert('Test updated successfully!')
    } else {
      // Add new test
      const newTest = {
        id: `test-${Date.now()}`,
        name: formData.name.trim(),
        price: formData.price.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem('laboratoryAvailableTests', JSON.stringify([...tests, newTest]))
      alert('Test added successfully!')
    }

    navigate('/laboratory/available-tests')
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Test Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Complete Blood Count (CBC)"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 500"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)] transition-all"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/laboratory/available-tests')}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0d3a52] active:scale-95"
            >
              {isEditing ? 'Update Test' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default LaboratoryAddTest

