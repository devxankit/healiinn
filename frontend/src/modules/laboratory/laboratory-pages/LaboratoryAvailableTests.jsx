import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoAddOutline,
  IoSearchOutline,
  IoFlaskOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoBagHandleOutline,
} from 'react-icons/io5'

const LaboratoryAvailableTests = () => {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load tests from localStorage
  useEffect(() => {
    const savedTests = JSON.parse(localStorage.getItem('laboratoryAvailableTests') || '[]')
    setTests(savedTests)
  }, [])

  // Save tests to localStorage
  const saveTests = (updatedTests) => {
    localStorage.setItem('laboratoryAvailableTests', JSON.stringify(updatedTests))
    setTests(updatedTests)
  }

  const handleAddTest = () => {
    navigate('/laboratory/available-tests/add')
  }

  const handleEditTest = (test) => {
    navigate(`/laboratory/available-tests/edit/${test.id}`)
  }

  const handleDeleteTest = (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      const updatedTests = tests.filter(test => test.id !== testId)
      saveTests(updatedTests)
    }
  }

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalTests = tests.length
    const totalValue = tests.reduce((sum, test) => {
      const price = parseFloat(test.price) || 0
      return sum + price
    }, 0)

    return { totalTests, totalValue }
  }, [tests])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Search Bar and Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by test name..."
            className="w-full h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[#1a5f7a] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleAddTest}
          className="flex items-center justify-center h-[42px] rounded-lg bg-[#11496c] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a54] active:scale-95 shrink-0"
        >
          Add
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="group relative overflow-hidden rounded-lg border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/60 p-2 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-emerald-200/40 hover:scale-[1.01] hover:border-emerald-300/80">
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-emerald-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70" />
          <IoFlaskOutline className="relative mx-auto h-4 w-4 text-emerald-600 mb-0.5" />
          <p className="relative text-base font-bold text-emerald-600">{statistics.totalTests}</p>
          <p className="relative text-[10px] font-semibold text-emerald-700">Tests</p>
        </div>
        <div className="group relative overflow-hidden rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 p-2 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-200/40 hover:scale-[1.01] hover:border-blue-300/80">
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-blue-200/40 blur-lg transition-opacity group-hover:opacity-100 opacity-70" />
          <IoBagHandleOutline className="relative mx-auto h-4 w-4 text-blue-600 mb-0.5" />
          <p className="relative text-base font-bold text-blue-600">{formatCurrency(statistics.totalValue)}</p>
          <p className="relative text-[10px] font-semibold text-blue-700">Total Value</p>
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-2.5">
        {filteredTests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              {searchTerm ? 'No tests found' : 'No tests added yet'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm ? 'Try a different search term' : 'Click "Add" to get started'}
            </p>
          </div>
        ) : (
          filteredTests.map((test) => {
            return (
              <article
                key={test.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                        <IoFlaskOutline className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{test.name}</h3>
                        <div className="mt-1.5 flex items-center gap-3 text-xs">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(parseFloat(test.price) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditTest(test)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white active:scale-95"
                      aria-label="Edit test"
                    >
                      <IoPencilOutline className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white active:scale-95"
                      aria-label="Delete test"
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default LaboratoryAvailableTests

