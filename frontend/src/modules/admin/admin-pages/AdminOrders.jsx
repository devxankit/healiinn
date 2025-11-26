import { useState, useMemo, useEffect } from 'react'
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
  IoArrowBackOutline,
  IoChevronDownOutline,
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
    providerId: 'pharmacy-city',
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
    providerId: 'lab-healthlab',
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
    providerId: 'pharmacy-medicare',
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
    providerId: 'lab-testlab',
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
    providerId: 'pharmacy-quickmed',
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
    providerId: 'lab-precision',
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
    providerId: 'pharmacy-wellness',
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
    providerId: 'lab-healthlab',
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
    providerId: 'pharmacy-city',
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
    providerId: 'lab-testlab',
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
    providerId: 'pharmacy-medicare',
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
    providerId: 'lab-precision',
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
    providerId: 'pharmacy-quickmed',
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
    providerId: 'lab-healthlab',
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
    providerId: 'pharmacy-wellness',
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
    providerId: 'lab-testlab',
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
    providerId: 'pharmacy-city',
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
    providerId: 'lab-precision',
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
    providerId: 'pharmacy-medicare',
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
    providerId: 'lab-healthlab',
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
    providerId: 'pharmacy-quickmed',
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
    providerId: 'lab-testlab',
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
    providerId: 'pharmacy-city',
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
    providerId: 'lab-precision',
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
    providerId: 'pharmacy-wellness',
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
    providerId: 'lab-healthlab',
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
    providerId: 'pharmacy-medicare',
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
    providerId: 'lab-testlab',
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
  const [orders, setOrders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null) // Track selected provider to show orders

  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      try {
        const allOrders = []
        
        // Load pharmacy orders from all pharmacies
        const allPharmacyAvailability = JSON.parse(localStorage.getItem('allPharmacyAvailability') || '[]')
        allPharmacyAvailability.forEach((pharmacy) => {
          const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacy.pharmacyId}`) || '[]')
          pharmacyOrders.forEach((order) => {
            allOrders.push({
              ...order,
              orderId: order.id || `ORD-${Date.now()}`,
              date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              patientName: order.patient?.name || 'Unknown Patient',
              providerName: order.pharmacyName || pharmacy.pharmacyName,
              providerId: order.pharmacyId || pharmacy.pharmacyId,
              amount: order.totalAmount || 0,
              items: order.medicines?.map(m => m.name || `${m.dosage || ''}`).filter(Boolean) || [],
            })
          })
        })
        
        // Load laboratory orders from all labs
        const allLabAvailability = JSON.parse(localStorage.getItem('allLabAvailability') || '[]')
        allLabAvailability.forEach((lab) => {
          const labOrders = JSON.parse(localStorage.getItem(`labOrders_${lab.labId}`) || '[]')
          labOrders.forEach((order) => {
            allOrders.push({
              ...order,
              orderId: order.id || `LAB-${Date.now()}`,
              date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              time: order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              patientName: order.patient?.name || 'Unknown Patient',
              providerName: order.labName || lab.labName,
              providerId: order.labId || lab.labId,
              amount: order.totalAmount || 0,
              items: order.investigations?.map(i => i.name).filter(Boolean) || [],
            })
          })
        })
        
        // Merge with mock data for backward compatibility
        const merged = [...allOrders, ...mockOrders]
        const unique = merged.filter((order, idx, self) => 
          idx === self.findIndex(o => o.id === order.id || o.orderId === order.orderId)
        )
        
        setOrders(unique)
      } catch (error) {
        console.error('Error loading orders:', error)
        setOrders(mockOrders)
      }
    }
    
    loadOrders()
    // Refresh every 2 seconds to get new orders
    const interval = setInterval(loadOrders, 2000)
    return () => clearInterval(interval)
  }, [])

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
      // Use provider ID + type as key to separate same name providers of different types
      const key = `${order.providerId || order.providerName}_${order.type}`
      
      if (!providerMap.has(key)) {
        providerMap.set(key, {
          providerName: order.providerName,
          providerId: order.providerId || order.providerName,
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

  // Get orders for selected provider
  const selectedProviderOrders = useMemo(() => {
    if (!selectedProvider) return []
    return filteredOrders.filter(
      order => 
        (order.providerId || order.providerName) === selectedProvider.providerId &&
        order.type === selectedProvider.type
    )
  }, [filteredOrders, selectedProvider])

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

      {/* Provider Cards or Orders List */}
      {selectedProvider ? (
        /* Show Orders for Selected Provider */
        <div className="space-y-4">
          {/* Back Button */}
          <button
            onClick={() => setSelectedProvider(null)}
            className="flex items-center gap-2 text-sm font-medium text-[#11496c] hover:text-[#0d3a52] transition"
          >
            <IoArrowBackOutline className="h-4 w-4" />
            <span>Back to Providers</span>
          </button>

          {/* Provider Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(selectedProvider.type)}`}>
                {(() => {
                  const TypeIcon = getTypeIcon(selectedProvider.type)
                  return <TypeIcon className="h-6 w-6" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-slate-900">{selectedProvider.providerName}</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getTypeColor(selectedProvider.type)}`}>
                    {(() => {
                      const TypeIcon = getTypeIcon(selectedProvider.type)
                      return <TypeIcon className="h-3 w-3" />
                    })()}
                    {selectedProvider.type}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{selectedProvider.totalOrders}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">{selectedProvider.completed}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">{selectedProvider.pending}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total Revenue</span>
                    <span className="text-lg font-bold text-[#11496c]">{formatCurrency(selectedProvider.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List for Selected Provider */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Orders ({selectedProviderOrders.length})</h3>
            {selectedProviderOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <IoBagHandleOutline className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No orders found for this provider</p>
              </div>
            ) : (
              selectedProviderOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status)
                return (
                  <article
                    key={order.id || order.orderId}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getTypeColor(order.type)}`}>
                        {(() => {
                          const TypeIcon = getTypeIcon(order.type)
                          return <TypeIcon className="h-5 w-5" />
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-slate-900">{order.patientName}</h3>
                            </div>
                            <p className="text-xs text-slate-500">Order ID: {order.orderId}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                            <StatusIcon className="h-3 w-3" />
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2">
                          <div className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            <span>{order.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            <span>{order.time}</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="flex items-center gap-1">
                              {order.type === 'pharmacy' ? (
                                <IoBagHandleOutline className="h-3.5 w-3.5" />
                              ) : (
                                <IoFlaskOutline className="h-3.5 w-3.5" />
                              )}
                              <span>{order.items.length} {order.type === 'pharmacy' ? (order.items.length === 1 ? 'item' : 'items') : (order.items.length === 1 ? 'test' : 'tests')}</span>
                            </div>
                          )}
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                                  order.type === 'pharmacy' 
                                    ? 'bg-slate-100 text-slate-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {item}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                                order.type === 'pharmacy' 
                                  ? 'bg-slate-100 text-slate-500' 
                                  : 'bg-amber-100 text-amber-600'
                              }`}>
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Total Amount</span>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(order.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      ) : (
        /* Show Provider Cards */
        <div className="space-y-6">
          {/* Pharmacy Providers Section */}
          {(typeFilter === 'all' || typeFilter === 'pharmacy') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoBusinessOutline className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Pharmacy</h2>
                  <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-purple-100 px-2 text-xs font-medium text-purple-700">
                    {providerAggregation.filter(p => p.type === 'pharmacy').length}
                  </span>
                </div>
              </div>
              
              {providerAggregation.filter(p => p.type === 'pharmacy').length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <IoBusinessOutline className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No pharmacy providers found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {searchTerm.trim() ? 'No providers match your search criteria.' : `No pharmacy orders for ${periodFilter} period.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providerAggregation.filter(p => p.type === 'pharmacy').map((provider) => {
                    const TypeIcon = getTypeIcon(provider.type)
                    return (
                      <article
                        key={`${provider.providerId}_${provider.type}`}
                        onClick={() => setSelectedProvider(provider)}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(provider.type)}`}>
                            <TypeIcon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 mb-1">{provider.providerName}</h3>
                                <p className="text-xs text-slate-500">{provider.totalOrders} {provider.totalOrders === 1 ? 'order' : 'orders'}</p>
                              </div>
                              <IoChevronDownOutline className="h-5 w-5 text-slate-400 shrink-0" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
                                <p className="mt-0.5 text-sm font-bold text-slate-900">{provider.totalOrders}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Done</p>
                                <p className="mt-0.5 text-sm font-bold text-emerald-700">{provider.completed}</p>
                              </div>
                              <div className="rounded-lg bg-amber-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Pending</p>
                                <p className="mt-0.5 text-sm font-bold text-amber-700">{provider.pending}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">Revenue</span>
                                <span className="text-sm font-bold text-[#11496c]">{formatCurrency(provider.revenue)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Laboratory Providers Section */}
          {(typeFilter === 'all' || typeFilter === 'laboratory') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoFlaskOutline className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Laboratory</h2>
                  <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-700">
                    {providerAggregation.filter(p => p.type === 'laboratory').length}
                  </span>
                </div>
              </div>
              
              {providerAggregation.filter(p => p.type === 'laboratory').length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <IoFlaskOutline className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No laboratory providers found</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {searchTerm.trim() ? 'No providers match your search criteria.' : `No laboratory orders for ${periodFilter} period.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providerAggregation.filter(p => p.type === 'laboratory').map((provider) => {
                    const TypeIcon = getTypeIcon(provider.type)
                    return (
                      <article
                        key={`${provider.providerId}_${provider.type}`}
                        onClick={() => setSelectedProvider(provider)}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getTypeColor(provider.type)}`}>
                            <TypeIcon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-slate-900 mb-1">{provider.providerName}</h3>
                                <p className="text-xs text-slate-500">{provider.totalOrders} {provider.totalOrders === 1 ? 'order' : 'orders'}</p>
                              </div>
                              <IoChevronDownOutline className="h-5 w-5 text-slate-400 shrink-0" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="rounded-lg bg-slate-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
                                <p className="mt-0.5 text-sm font-bold text-slate-900">{provider.totalOrders}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Done</p>
                                <p className="mt-0.5 text-sm font-bold text-emerald-700">{provider.completed}</p>
                              </div>
                              <div className="rounded-lg bg-amber-50 p-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Pending</p>
                                <p className="mt-0.5 text-sm font-bold text-amber-700">{provider.pending}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">Revenue</span>
                                <span className="text-sm font-bold text-[#11496c]">{formatCurrency(provider.revenue)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </section>
  )
}

export default AdminOrders


