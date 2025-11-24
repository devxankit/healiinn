import { useState, useMemo } from 'react'
import {
  IoSearchOutline,
  IoBagHandleOutline,
  IoBusinessOutline,
  IoFlaskOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoLocationOutline,
} from 'react-icons/io5'

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generate dates relative to today
const today = new Date()
const todayStr = formatDate(today)
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const yesterdayStr = formatDate(yesterday)
const twoDaysAgo = new Date(today)
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
const twoDaysAgoStr = formatDate(twoDaysAgo)
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
const threeDaysAgoStr = formatDate(threeDaysAgo)
const fourDaysAgo = new Date(today)
fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
const fourDaysAgoStr = formatDate(fourDaysAgo)
const fiveDaysAgo = new Date(today)
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
const fiveDaysAgoStr = formatDate(fiveDaysAgo)
// For monthly view - dates from earlier in the month
const tenDaysAgo = new Date(today)
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
const tenDaysAgoStr = formatDate(tenDaysAgo)
const fifteenDaysAgo = new Date(today)
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
const fifteenDaysAgoStr = formatDate(fifteenDaysAgo)
// For yearly view - dates from previous months
const lastMonth = new Date(today)
lastMonth.setMonth(lastMonth.getMonth() - 1)
const lastMonthStr = formatDate(lastMonth)
const twoMonthsAgo = new Date(today)
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
const twoMonthsAgoStr = formatDate(twoMonthsAgo)
const threeMonthsAgo = new Date(today)
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
const threeMonthsAgoStr = formatDate(threeMonthsAgo)

const mockOrders = [
  {
    id: 'ord-1',
    orderId: 'ORD-2025-001',
    type: 'pharmacy',
    patientName: 'John Doe',
    providerName: 'City Pharmacy',
    date: todayStr,
    time: '10:00 AM',
    status: 'completed',
    amount: 1250,
    items: ['Paracetamol 500mg', 'Cough Syrup'],
  },
  {
    id: 'ord-2',
    type: 'laboratory',
    orderId: 'LAB-2025-001',
    patientName: 'Sarah Smith',
    providerName: 'HealthLab Diagnostics',
    date: todayStr,
    time: '11:30 AM',
    status: 'pending',
    amount: 800,
    items: ['Complete Blood Count', 'Blood Glucose'],
  },
  {
    id: 'ord-3',
    type: 'pharmacy',
    orderId: 'ORD-2025-002',
    patientName: 'Mike Johnson',
    providerName: 'MediCare Pharmacy',
    date: todayStr,
    time: '02:00 PM',
    status: 'completed',
    amount: 950,
    items: ['Antibiotics', 'Vitamin D'],
  },
  {
    id: 'ord-4',
    type: 'laboratory',
    orderId: 'LAB-2025-002',
    patientName: 'Emily Brown',
    providerName: 'TestLab Services',
    date: todayStr,
    time: '09:00 AM',
    status: 'pending',
    amount: 1200,
    items: ['Lipid Profile', 'Liver Function Test'],
  },
  {
    id: 'ord-5',
    type: 'pharmacy',
    orderId: 'ORD-2025-003',
    patientName: 'David Wilson',
    providerName: 'QuickMed Pharmacy',
    date: todayStr,
    time: '03:30 PM',
    status: 'completed',
    amount: 600,
    items: ['Pain Relief Gel'],
  },
  {
    id: 'ord-6',
    type: 'laboratory',
    orderId: 'LAB-2025-003',
    patientName: 'Priya Sharma',
    providerName: 'Precision Labs',
    date: todayStr,
    time: '01:00 PM',
    status: 'completed',
    amount: 1500,
    items: ['Thyroid Function Test', 'Vitamin B12'],
  },
  {
    id: 'ord-7',
    type: 'pharmacy',
    orderId: 'ORD-2025-004',
    patientName: 'Rajesh Kumar',
    providerName: 'Wellness Pharmacy',
    date: todayStr,
    time: '04:00 PM',
    status: 'pending',
    amount: 450,
    items: ['Antacid Tablets'],
  },
  {
    id: 'ord-8',
    type: 'laboratory',
    orderId: 'LAB-2025-004',
    patientName: 'Anjali Mehta',
    providerName: 'HealthLab Diagnostics',
    date: todayStr,
    time: '05:00 PM',
    status: 'pending',
    amount: 900,
    items: ['Hemoglobin Test'],
  },
  // This week orders for monthly view
  {
    id: 'ord-9',
    type: 'pharmacy',
    orderId: 'ORD-2025-005',
    patientName: 'Ravi Verma',
    providerName: 'City Pharmacy',
    date: yesterdayStr,
    time: '10:30 AM',
    status: 'completed',
    amount: 750,
    items: ['Antibiotics', 'Pain Killers'],
  },
  {
    id: 'ord-10',
    type: 'laboratory',
    orderId: 'LAB-2025-005',
    patientName: 'Sneha Patel',
    providerName: 'TestLab Services',
    date: yesterdayStr,
    time: '02:30 PM',
    status: 'completed',
    amount: 1100,
    items: ['Complete Blood Count', 'ESR'],
  },
  {
    id: 'ord-11',
    type: 'pharmacy',
    orderId: 'ORD-2025-006',
    patientName: 'Amit Singh',
    providerName: 'MediCare Pharmacy',
    date: twoDaysAgoStr,
    time: '11:00 AM',
    status: 'completed',
    amount: 550,
    items: ['Cough Syrup', 'Throat Lozenges'],
  },
  {
    id: 'ord-12',
    type: 'laboratory',
    orderId: 'LAB-2025-006',
    patientName: 'Kavita Reddy',
    providerName: 'Precision Labs',
    date: twoDaysAgoStr,
    time: '03:00 PM',
    status: 'pending',
    amount: 1300,
    items: ['Diabetes Panel', 'HbA1c'],
  },
  {
    id: 'ord-13',
    type: 'pharmacy',
    orderId: 'ORD-2025-007',
    patientName: 'Vikram Malhotra',
    providerName: 'QuickMed Pharmacy',
    date: threeDaysAgoStr,
    time: '09:30 AM',
    status: 'completed',
    amount: 850,
    items: ['Multivitamins', 'Calcium Tablets'],
  },
  {
    id: 'ord-14',
    type: 'laboratory',
    orderId: 'LAB-2025-007',
    patientName: 'Meera Iyer',
    providerName: 'HealthLab Diagnostics',
    date: threeDaysAgoStr,
    time: '01:30 PM',
    status: 'completed',
    amount: 950,
    items: ['Liver Function Test'],
  },
  {
    id: 'ord-15',
    type: 'pharmacy',
    orderId: 'ORD-2025-008',
    patientName: 'Arjun Nair',
    providerName: 'Wellness Pharmacy',
    date: fourDaysAgoStr,
    time: '04:00 PM',
    status: 'pending',
    amount: 680,
    items: ['Antihistamine', 'Nasal Spray'],
  },
  {
    id: 'ord-16',
    type: 'laboratory',
    orderId: 'LAB-2025-008',
    patientName: 'Divya Menon',
    providerName: 'TestLab Services',
    date: fourDaysAgoStr,
    time: '10:00 AM',
    status: 'completed',
    amount: 1400,
    items: ['Cardiac Profile', 'Lipid Profile'],
  },
  {
    id: 'ord-17',
    type: 'pharmacy',
    orderId: 'ORD-2025-009',
    patientName: 'Nikhil Joshi',
    providerName: 'City Pharmacy',
    date: fiveDaysAgoStr,
    time: '02:00 PM',
    status: 'completed',
    amount: 420,
    items: ['Antacid', 'Digestive Enzymes'],
  },
  {
    id: 'ord-18',
    type: 'laboratory',
    orderId: 'LAB-2025-009',
    patientName: 'Pooja Desai',
    providerName: 'Precision Labs',
    date: fiveDaysAgoStr,
    time: '11:30 AM',
    status: 'pending',
    amount: 1050,
    items: ['Thyroid Function Test'],
  },
  // Earlier this month for monthly view
  {
    id: 'ord-19',
    type: 'pharmacy',
    orderId: 'ORD-2025-010',
    patientName: 'Rahul Gupta',
    providerName: 'MediCare Pharmacy',
    date: tenDaysAgoStr,
    time: '10:00 AM',
    status: 'completed',
    amount: 720,
    items: ['Antibiotics'],
  },
  {
    id: 'ord-20',
    type: 'laboratory',
    orderId: 'LAB-2025-010',
    patientName: 'Sunita Rao',
    providerName: 'HealthLab Diagnostics',
    date: tenDaysAgoStr,
    time: '02:00 PM',
    status: 'completed',
    amount: 1150,
    items: ['Complete Blood Count'],
  },
  {
    id: 'ord-21',
    type: 'pharmacy',
    orderId: 'ORD-2025-011',
    patientName: 'Karan Mehta',
    providerName: 'QuickMed Pharmacy',
    date: fifteenDaysAgoStr,
    time: '11:00 AM',
    status: 'completed',
    amount: 580,
    items: ['Pain Killers'],
  },
  {
    id: 'ord-22',
    type: 'laboratory',
    orderId: 'LAB-2025-011',
    patientName: 'Neha Shah',
    providerName: 'TestLab Services',
    date: fifteenDaysAgoStr,
    time: '03:30 PM',
    status: 'pending',
    amount: 1250,
    items: ['Liver Function Test', 'Kidney Function Test'],
  },
  // Previous months for yearly view
  {
    id: 'ord-23',
    type: 'pharmacy',
    orderId: 'ORD-2025-012',
    patientName: 'Vishal Kumar',
    providerName: 'City Pharmacy',
    date: lastMonthStr,
    time: '09:00 AM',
    status: 'completed',
    amount: 650,
    items: ['Cough Syrup', 'Antibiotics'],
  },
  {
    id: 'ord-24',
    type: 'laboratory',
    orderId: 'LAB-2025-012',
    patientName: 'Deepika Nair',
    providerName: 'Precision Labs',
    date: lastMonthStr,
    time: '01:00 PM',
    status: 'completed',
    amount: 1350,
    items: ['Thyroid Function Test', 'Vitamin D'],
  },
  {
    id: 'ord-25',
    type: 'pharmacy',
    orderId: 'ORD-2025-013',
    patientName: 'Aditya Singh',
    providerName: 'Wellness Pharmacy',
    date: twoMonthsAgoStr,
    time: '10:30 AM',
    status: 'completed',
    amount: 480,
    items: ['Antacid'],
  },
  {
    id: 'ord-26',
    type: 'laboratory',
    orderId: 'LAB-2025-013',
    patientName: 'Shreya Patel',
    providerName: 'HealthLab Diagnostics',
    date: twoMonthsAgoStr,
    time: '02:30 PM',
    status: 'pending',
    amount: 1100,
    items: ['Complete Blood Count', 'ESR'],
  },
  {
    id: 'ord-27',
    type: 'pharmacy',
    orderId: 'ORD-2025-014',
    patientName: 'Manish Verma',
    providerName: 'MediCare Pharmacy',
    date: threeMonthsAgoStr,
    time: '11:30 AM',
    status: 'completed',
    amount: 890,
    items: ['Multivitamins'],
  },
  {
    id: 'ord-28',
    type: 'laboratory',
    orderId: 'LAB-2025-014',
    patientName: 'Anita Iyer',
    providerName: 'TestLab Services',
    date: threeMonthsAgoStr,
    time: '04:00 PM',
    status: 'completed',
    amount: 1450,
    items: ['Cardiac Profile'],
  },
]

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, pharmacy, laboratory
  const [periodFilter, setPeriodFilter] = useState('daily') // daily, monthly, yearly
  const [orders] = useState(mockOrders)

  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter((order) => {
      const orderDate = new Date(order.date)
      orderDate.setHours(0, 0, 0, 0)

      if (periodFilter === 'daily') {
        return orderDate.getTime() === today.getTime()
      } else if (periodFilter === 'monthly') {
        return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear()
      } else if (periodFilter === 'yearly') {
        return orderDate.getFullYear() === today.getFullYear()
      }
      return true
    })

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((order) => order.type === typeFilter)
    }

    // Filter by search
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.patientName.toLowerCase().includes(normalizedSearch) ||
          order.providerName.toLowerCase().includes(normalizedSearch) ||
          order.orderId.toLowerCase().includes(normalizedSearch)
      )
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateB - dateA
    })
  }, [orders, searchTerm, typeFilter, periodFilter])

  // Provider aggregation for all views
  const providerAggregation = useMemo(() => {
    const providerMap = new Map()
    
    filteredOrders.forEach((order) => {
      // Use provider name + type as key to separate same name providers of different types
      const key = `${order.providerName}_${order.type}`
      
      if (!providerMap.has(key)) {
        providerMap.set(key, {
          providerName: order.providerName,
          type: order.type,
          completed: 0,
          pending: 0,
          revenue: 0,
          totalOrders: 0,
        })
      }
      
      const provider = providerMap.get(key)
      provider.totalOrders++
      provider.revenue += order.amount
      
      if (order.status === 'completed') {
        provider.completed++
      } else if (order.status === 'pending') {
        provider.pending++
      }
    })
    
    // Filter by search if provided
    let providers = Array.from(providerMap.values())
    
    // Filter by type if not 'all'
    if (typeFilter !== 'all') {
      providers = providers.filter((provider) => provider.type === typeFilter)
    }
    
    // Filter by search if provided
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      providers = providers.filter((provider) =>
        provider.providerName.toLowerCase().includes(normalizedSearch)
      )
    }
    
    // Sort by revenue descending
    return providers.sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders, typeFilter, searchTerm])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return IoCheckmarkCircleOutline
      default:
        return IoTimeOutline
    }
  }

  const getTypeIcon = (type) => {
    return type === 'pharmacy' ? IoBusinessOutline : IoFlaskOutline
  }

  const getTypeColor = (type) => {
    return type === 'pharmacy' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = useMemo(() => {
    const total = filteredOrders.length
    const pharmacy = filteredOrders.filter((order) => order.type === 'pharmacy').length
    const laboratory = filteredOrders.filter((order) => order.type === 'laboratory').length
    const completed = filteredOrders.filter((order) => order.status === 'completed').length
    const pending = filteredOrders.filter((order) => order.status === 'pending').length
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.amount, 0)
    
    // Provider stats - always calculate from aggregation
    const providerStats = {
      totalProviders: providerAggregation.length,
      totalCompleted: providerAggregation.reduce((sum, p) => sum + p.completed, 0),
      totalPending: providerAggregation.reduce((sum, p) => sum + p.pending, 0),
      totalRevenue: providerAggregation.reduce((sum, p) => sum + p.revenue, 0),
    }

    return { total, pharmacy, laboratory, completed, pending, totalAmount, providerStats }
  }, [filteredOrders, providerAggregation])

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage pharmacy and laboratory orders</p>
        </div>
      </header>

      {/* Period Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['daily', 'monthly', 'yearly'].map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              periodFilter === period
                ? 'bg-[#11496c] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.providerStats.totalProviders}</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Pharmacy</p>
          <p className="mt-1 text-2xl font-bold text-purple-700">{stats.pharmacy}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Laboratory</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.laboratory}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.providerStats.totalCompleted}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.providerStats.totalPending}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(stats.providerStats.totalRevenue)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IoSearchOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by patient name, provider name, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pharmacy', 'laboratory'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === type
                  ? type === 'all'
                    ? 'bg-[#11496c] text-white'
                    : type === 'pharmacy'
                    ? 'bg-purple-600 text-white'
                    : 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-3">
        {providerAggregation.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <IoBagHandleOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              {typeFilter === 'all' ? 'No providers found' : `No ${typeFilter} providers found`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm.trim()
                ? 'No providers match your search criteria.'
                : `No ${typeFilter === 'all' ? '' : typeFilter + ' '}orders for ${periodFilter} period.`}
            </p>
          </div>
        ) : (
          providerAggregation.map((provider) => {
            const TypeIcon = getTypeIcon(provider.type)
            return (
              <article
                key={`${provider.providerName}_${provider.type}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(provider.type)}`}>
                    <TypeIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{provider.providerName}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getTypeColor(provider.type)}`}>
                            <TypeIcon className="h-3 w-3" />
                            {provider.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(provider.revenue)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">{provider.totalOrders}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
                        <p className="mt-1 text-xl font-bold text-emerald-700">{provider.completed}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending</p>
                        <p className="mt-1 text-xl font-bold text-amber-700">{provider.pending}</p>
                      </div>
                    </div>
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

export default AdminOrders


