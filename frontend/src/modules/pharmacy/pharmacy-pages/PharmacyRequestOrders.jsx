import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoEyeOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoMedicalOutline,
  IoCloseOutline,
  IoBagHandleOutline,
  IoLocationOutline,
  IoCallOutline,
  IoCarOutline,
  IoCheckmarkDoneOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoWalletOutline,
} from 'react-icons/io5'

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Helper functions for delivery status
const getStatusIcon = (status) => {
  if (status === 'completed' || status === 'delivered') return IoCheckmarkDoneOutline
  if (status === 'out_for_delivery') return IoCarOutline
  if (status === 'preparing') return IoBagHandleOutline
  if (status === 'confirmed' || status === 'payment_pending') return IoCheckmarkCircleOutline
  return IoTimeOutline
}

const getDeliveryStatusLabel = (status, deliveryStatus) => {
  if (deliveryStatus === 'delivered' || status === 'completed') return 'Delivered'
  if (deliveryStatus === 'out_for_delivery' || status === 'out_for_delivery') return 'Out for Delivery'
  if (deliveryStatus === 'preparing' || status === 'preparing') return 'Preparing'
  if (status === 'payment_pending') return 'Payment'
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'accepted') return 'Accepted'
  if (status === 'rejected') return 'Rejected'
  if (status === 'pending') return 'Pending'
  return status
}

const getDeliveryStatusColor = (status, deliveryStatus) => {
  if (deliveryStatus === 'delivered' || status === 'completed') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-300'
  }
  if (deliveryStatus === 'out_for_delivery' || status === 'out_for_delivery') {
    return 'bg-blue-100 text-blue-700 border border-blue-300'
  }
  if (deliveryStatus === 'preparing' || status === 'preparing') {
    return 'bg-amber-100 text-amber-700 border border-amber-300'
  }
  if (status === 'pending') {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
  }
  if (status === 'payment_pending') {
    return 'bg-blue-100 text-blue-800 border border-blue-300'
  }
  if (status === 'confirmed') {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  }
  if (status === 'accepted') {
    return 'bg-green-100 text-green-700 border border-green-300'
  }
  if (status === 'rejected') {
    return 'bg-red-100 text-red-700 border border-red-300'
  }
  return 'bg-slate-50 text-slate-800 border border-slate-200'
}

const PharmacyRequestOrders = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [pharmacyInfo, setPharmacyInfo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPharmacyInfo()
    loadRequests()
    // Refresh every 2 seconds to get new requests
    const interval = setInterval(() => {
      loadRequests()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadPharmacyInfo = () => {
    try {
      // Get pharmacy ID (in real app, get from auth)
      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      
      // Try to load from localStorage first
      const storedPharmacy = JSON.parse(localStorage.getItem(`pharmacy_${pharmacyId}`) || 'null')
      
      if (storedPharmacy) {
        setPharmacyInfo(storedPharmacy)
      } else {
        // Use mock data if not found in localStorage
        const mockPharmacyData = {
          pharmacyName: 'Rx Care Pharmacy',
          ownerName: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-214-0098',
          licenseNumber: 'RX-45287',
          address: {
            line1: '123 Market Street',
            line2: 'Suite 210',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'USA',
          },
          contactPerson: {
            name: 'Lauren Patel',
            phone: '+1-555-211-0800',
            email: 'lauren.patel@rxcare.com',
          },
        }
        setPharmacyInfo(mockPharmacyData)
      }
    } catch (error) {
      console.error('Error loading pharmacy info:', error)
      // Fallback to mock data
      setPharmacyInfo({
        pharmacyName: 'Rx Care Pharmacy',
        ownerName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-214-0098',
        address: {
          line1: '123 Market Street',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
        },
      })
    }
  }

  const formatPharmacyAddress = (address) => {
    if (!address) return 'Address not available'
    const parts = []
    if (address.line1) parts.push(address.line1)
    if (address.line2) parts.push(address.line2)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    return parts.join(', ') || 'Address not available'
  }

  // Dummy data for pharmacy requests
  const mockPharmacyRequests = [
    {
      id: 'pharm-req-1',
      requestId: 'pharm-req-1',
      patientName: 'Current Patient',
      patientPhone: '+1-555-000-0000',
      patientAddress: 'Address not provided',
      patientEmail: 'patient@example.com',
      status: 'completed',
      createdAt: '2025-11-26T17:59:00',
      paymentConfirmed: true,
      paidAt: '2025-11-26T17:59:00',
      prescription: {
        doctorName: 'Dr. Sarah Mitchell',
        doctorSpecialty: 'Cardiology',
        diagnosis: 'Hypertension',
        issuedAt: '2025-11-26',
        medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', quantity: 30, price: 16.3 },
          { name: 'Losartan', dosage: '50mg', frequency: 'Once daily', duration: '30 days', quantity: 30, price: 26.2 },
        ],
      },
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', quantity: 30, price: 16.3 },
        { name: 'Losartan', dosage: '50mg', quantity: 30, price: 26.2 },
      ],
      totalAmount: 1275,
      deliveryType: 'home',
    },
    {
      id: 'pharm-req-2',
      requestId: 'pharm-req-2',
      patientName: 'Current Patient',
      patientPhone: '+1-555-000-0000',
      patientAddress: 'Address not provided',
      patientEmail: 'patient@example.com',
      status: 'payment_pending',
      createdAt: '2025-11-26T17:31:00',
      paymentConfirmed: false,
      prescription: {
        doctorName: 'Dr. Sarah Mitchell',
        doctorSpecialty: 'Cardiology',
        diagnosis: 'Hypertension',
        issuedAt: '2025-11-26',
        medications: [
          { name: 'Lipid Profile Medicine', dosage: '10mg', frequency: 'Once daily', duration: '15 days', quantity: 15, price: 25 },
        ],
      },
      medicines: [
        { name: 'Lipid Profile Medicine', dosage: '10mg', quantity: 15, price: 25 },
      ],
      totalAmount: 375,
      deliveryType: 'home',
    },
    {
      id: 'pharm-req-3',
      requestId: 'pharm-req-3',
      patientName: 'John Doe',
      patientPhone: '+91 98765 12345',
      patientAddress: '123 Main Street, Pune, Maharashtra 411001',
      patientEmail: 'john.doe@example.com',
      status: 'pending',
      createdAt: '2025-11-25T10:00:00',
      paymentConfirmed: false,
      prescription: {
        doctorName: 'Dr. Rajesh Kumar',
        doctorSpecialty: 'General Physician',
        diagnosis: 'Fever',
        issuedAt: '2025-11-25',
        medications: [
          { name: 'Paracetamol', dosage: '500mg', frequency: '3 times daily', duration: '5 days', quantity: 15, price: 2.5 },
          { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '5 days', quantity: 5, price: 3 },
        ],
      },
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', quantity: 15, price: 2.5 },
        { name: 'Cetirizine', dosage: '10mg', quantity: 5, price: 3 },
      ],
      totalAmount: 52.5,
      deliveryType: 'home',
    },
  ]

  const loadRequests = () => {
    try {
      // Get pharmacy ID (in real app, get from auth)
      const pharmacyId = 'pharm-1' // Mock pharmacy ID - in real app, get from auth
      
      // Load orders from pharmacy-specific localStorage key
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      
      // Also load from adminRequests - check both single pharmacy and multiple pharmacies structure
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const medicineRequests = allRequests.filter(r => {
        if (r.type !== 'order_medicine') return false
        // Check if this pharmacy is in the response (single pharmacy or multiple pharmacies)
        if (r.adminResponse?.pharmacy?.id === pharmacyId) return true
        if (r.adminResponse?.pharmacies && Array.isArray(r.adminResponse.pharmacies)) {
          return r.adminResponse.pharmacies.some(p => p.id === pharmacyId)
        }
        // Check medicines for this pharmacy
        if (r.adminResponse?.medicines && Array.isArray(r.adminResponse.medicines)) {
          return r.adminResponse.medicines.some(m => m.pharmacyId === pharmacyId)
        }
        return false
      })
      
      // Transform adminRequests to order format
      const transformedRequests = medicineRequests.map(req => {
        // Get medicines for this specific pharmacy
        const pharmacyMedicines = req.adminResponse?.medicines?.filter(m => m.pharmacyId === pharmacyId) || []
        const pharmacyTotal = pharmacyMedicines.reduce((sum, med) => sum + ((med.quantity || 0) * (med.price || 0)), 0)
        
        return {
          id: req.id,
          requestId: req.id,
          patientName: req.patientName,
          patientPhone: req.patientPhone,
          patientAddress: req.patientAddress,
          prescription: req.prescription,
          medicines: pharmacyMedicines,
          totalAmount: pharmacyTotal,
          status: req.deliveryStatus || (req.status === 'confirmed' && req.paymentPending ? 'payment_pending' : req.status === 'confirmed' ? 'confirmed' : req.status === 'rejected' ? 'rejected' : req.status === 'accepted' ? 'accepted' : 'pending'),
          deliveryStatus: req.deliveryStatus || null,
          createdAt: req.createdAt || req.responseDate,
          paymentConfirmed: req.paymentConfirmed || false,
          paidAt: req.paidAt,
          preparingAt: req.preparingAt,
          outForDeliveryAt: req.outForDeliveryAt,
          deliveredAt: req.deliveredAt,
          estimatedDeliveryTime: req.estimatedDeliveryTime,
          pharmacyAccepted: req.pharmacyAccepted || false,
          pharmacyRejected: req.pharmacyRejected || false,
          acceptedAt: req.acceptedAt,
          rejectedAt: req.rejectedAt,
        }
      })
      
      // Combine with dummy data, pharmacy orders, and transformed requests
      const combined = [...mockPharmacyRequests, ...pharmacyOrders, ...transformedRequests]
      const unique = combined.filter((req, idx, self) => 
        idx === self.findIndex(r => (r.id === req.id || r.requestId === req.requestId || r.id === req.requestId) && 
                                    (r.requestId === req.requestId || r.requestId === req.id))
      )
      
      // Sort by date (newest first)
      unique.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      
      setRequests(unique)
    } catch (error) {
      console.error('Error loading requests:', error)
      setRequests(mockPharmacyRequests)
    }
  }

  const handleRejectOrder = async (orderId) => {
    try {
      // Confirm rejection
      const confirmReject = window.confirm(
        'Are you sure you want to reject this order? This action cannot be undone.'
      )
      if (!confirmReject) return

      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      const orderToUpdate = pharmacyOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update pharmacy orders - set status as 'rejected'
      const updatedOrders = pharmacyOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'Pharmacy',
            pharmacyRejected: true,
          }
        }
        return order
      })
      localStorage.setItem(`pharmacyOrders_${pharmacyId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            pharmacyRejected: true,
            pharmacyRejectedAt: new Date().toISOString(),
            rejectedBy: 'Pharmacy',
            rejectionMessage: `Order rejected by pharmacy ${pharmacyInfo?.pharmacyName || 'Pharmacy'}`,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            pharmacyRejected: true,
            pharmacyRejectedAt: new Date().toISOString(),
            rejectedBy: 'Pharmacy',
            status: 'rejected',
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy') {
          return {
            ...order,
            status: 'rejected',
            pharmacyRejected: true,
            pharmacyRejectedAt: new Date().toISOString(),
            rejectedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            pharmacyRejected: true,
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order rejected successfully. Admin and patient have been notified.')
    } catch (error) {
      console.error('Error rejecting order:', error)
      alert('Error rejecting order. Please try again.')
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      const orderToUpdate = pharmacyOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update pharmacy orders - set status as 'accepted'
      const updatedOrders = pharmacyOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            acceptedBy: 'Pharmacy',
            pharmacyAccepted: true,
          }
        }
        return order
      })
      localStorage.setItem(`pharmacyOrders_${pharmacyId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            pharmacyAccepted: true,
            pharmacyAcceptedAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            pharmacyAccepted: true,
            pharmacyAcceptedAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy') {
          return {
            ...order,
            pharmacyAccepted: true,
            pharmacyAcceptedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
            pharmacyAccepted: true,
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order accepted successfully! You can now confirm and prepare the order.')
    } catch (error) {
      console.error('Error accepting order:', error)
      alert('Error accepting order. Please try again.')
    }
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      const orderToUpdate = pharmacyOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update pharmacy orders - set status as 'preparing' for delivery
      const updatedOrders = pharmacyOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'preparing',
            deliveryStatus: 'preparing',
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'Pharmacy',
            preparingAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem(`pharmacyOrders_${pharmacyId}`, JSON.stringify(updatedOrders))
      
      // Also update the request in the current state
      const currentRequest = requests.find(r => r.id === orderId || r.requestId === orderId)
      if (currentRequest) {
        const updatedRequests = requests.map(r => {
          if (r.id === orderId || r.requestId === orderId) {
            return {
              ...r,
              status: 'preparing',
              deliveryStatus: 'preparing',
              confirmedAt: new Date().toISOString(),
              preparingAt: new Date().toISOString(),
            }
          }
          return r
        })
        setRequests(updatedRequests)
      }
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          // Check if all pharmacies for this request are confirmed
          const providerIds = req.adminResponse?.pharmacies?.map(p => p.id) || 
                            (req.adminResponse?.pharmacy?.id ? [req.adminResponse.pharmacy.id] : [])
          const allPharmacyConfirmed = providerIds.every(pid => {
            const pharmOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pid}`) || '[]')
            const pharmOrder = pharmOrders.find(o => o.requestId === requestId)
            return pharmOrder?.status === 'completed' || pharmOrder?.pharmacyConfirmed
          })
          
          return {
            ...req,
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed && allPharmacyConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          // Check if all pharmacies for this request are confirmed
          const providerIds = (req.providerId || '').split(',').filter(Boolean)
          const allPharmacyConfirmed = providerIds.every(pid => {
            const pharmOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pid}`) || '[]')
            const pharmOrder = pharmOrders.find(o => o.requestId === requestId)
            return pharmOrder?.status === 'completed' || pharmOrder?.pharmacyConfirmed
          })
          
          return {
            ...req,
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed && allPharmacyConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy') {
          const providerIds = order.providerIds || (order.providerId ? [order.providerId] : [])
          const allPharmacyConfirmed = providerIds.every(pid => {
            const pharmOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pid}`) || '[]')
            const pharmOrder = pharmOrders.find(o => o.requestId === requestId)
            return pharmOrder?.status === 'completed' || pharmOrder?.pharmacyConfirmed
          })
          
          return {
            ...order,
            status: order.paymentConfirmed && allPharmacyConfirmed ? 'completed' : order.status,
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            completedAt: order.paymentConfirmed && allPharmacyConfirmed ? new Date().toISOString() : order.completedAt,
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update admin orders
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]')
      const updatedAdminOrders = adminOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy' && order.pharmacyId === pharmacyId) {
          return {
            ...order,
            status: 'completed',
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('adminOrders', JSON.stringify(updatedAdminOrders))
      
      loadRequests()
      alert('Order confirmed! Order is now being prepared for delivery.')
    } catch (error) {
      console.error('Error confirming order:', error)
      alert('Error confirming order. Please try again.')
    }
  }

  const handleOutForDelivery = async (orderId) => {
    try {
      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      const orderToUpdate = pharmacyOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update pharmacy orders - set status as 'out_for_delivery'
      const updatedOrders = pharmacyOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'out_for_delivery',
            deliveryStatus: 'out_for_delivery',
            outForDeliveryAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
          }
        }
        return order
      })
      localStorage.setItem(`pharmacyOrders_${pharmacyId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            deliveryStatus: 'out_for_delivery',
            outForDeliveryAt: new Date().toISOString(),
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy') {
          return {
            ...order,
            deliveryStatus: 'out_for_delivery',
            outForDeliveryAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'out_for_delivery',
            deliveryStatus: 'out_for_delivery',
            outForDeliveryAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order is now out for delivery!')
    } catch (error) {
      console.error('Error updating delivery status:', error)
      alert('Error updating delivery status. Please try again.')
    }
  }

  const handleMarkAsDelivered = async (orderId) => {
    try {
      const pharmacyId = 'pharm-1' // Mock pharmacy ID
      const pharmacyOrders = JSON.parse(localStorage.getItem(`pharmacyOrders_${pharmacyId}`) || '[]')
      const orderToUpdate = pharmacyOrders.find(o => o.id === orderId || o.requestId === orderId)
      const requestId = orderToUpdate?.requestId || orderId
      
      // Update pharmacy orders - set status as 'delivered' (completed)
      const updatedOrders = pharmacyOrders.map(order => {
        if (order.id === orderId || order.requestId === orderId) {
          return {
            ...order,
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem(`pharmacyOrders_${pharmacyId}`, JSON.stringify(updatedOrders))
      
      // Update admin requests
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      
      // Update patient requests
      const patientRequests = JSON.parse(localStorage.getItem('patientRequests') || '[]')
      const updatedPatientRequests = patientRequests.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            status: req.paymentConfirmed ? 'completed' : req.status,
          }
        }
        return req
      })
      localStorage.setItem('patientRequests', JSON.stringify(updatedPatientRequests))
      
      // Update patient orders
      const patientOrders = JSON.parse(localStorage.getItem('patientOrders') || '[]')
      const updatedPatientOrders = patientOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy') {
          return {
            ...order,
            status: order.paymentConfirmed ? 'completed' : order.status,
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            completedAt: order.paymentConfirmed ? new Date().toISOString() : order.completedAt,
          }
        }
        return order
      })
      localStorage.setItem('patientOrders', JSON.stringify(updatedPatientOrders))
      
      // Update admin orders
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]')
      const updatedAdminOrders = adminOrders.map(order => {
        if (order.requestId === requestId && order.type === 'pharmacy' && order.pharmacyId === pharmacyId) {
          return {
            ...order,
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }
        }
        return order
      })
      localStorage.setItem('adminOrders', JSON.stringify(updatedAdminOrders))
      
      // Update current state
      const updatedRequestsState = requests.map(r => {
        if (r.id === orderId || r.requestId === orderId) {
          return {
            ...r,
            status: 'completed',
            deliveryStatus: 'delivered',
            deliveredAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            pharmacyConfirmed: true,
            pharmacyConfirmedAt: new Date().toISOString(),
          }
        }
        return r
      })
      setRequests(updatedRequestsState)
      
      loadRequests()
      alert('Order marked as delivered successfully!')
    } catch (error) {
      console.error('Error marking order as delivered:', error)
      alert('Error marking order as delivered. Please try again.')
    }
  }

  const filteredRequests = requests.filter(request => {
    // Filter by status
    let matchesFilter = true
    if (filter === 'pending') {
      matchesFilter = request.status === 'pending' || request.status === 'payment_pending' || request.status === 'confirmed'
    } else if (filter === 'completed') {
      matchesFilter = request.status === 'completed' || request.deliveryStatus === 'delivered'
    } else if (filter === 'accepted') {
      matchesFilter = request.pharmacyAccepted === true && request.status !== 'completed'
    } else if (filter === 'rejected') {
      matchesFilter = request.pharmacyRejected === true
    }
    
    // Filter by search term
    if (!matchesFilter) return false
    if (!searchTerm.trim()) return true
    
    const search = searchTerm.toLowerCase()
    return (
      (request.patientName || '').toLowerCase().includes(search) ||
      (request.patientPhone || '').includes(search) ||
      (request.prescription?.doctorName || '').toLowerCase().includes(search) ||
      (request.prescription?.diagnosis || '').toLowerCase().includes(search) ||
      (request.medicines || []).some(med => {
        const medName = typeof med === 'string' ? med : med.name || ''
        return medName.toLowerCase().includes(search)
      })
    )
  })

  const handleCardClick = (filterType) => {
    setFilter(filterType)
  }

  const generatePDF = (request) => {
    const prescription = request.prescription
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108]
    const lightBlueColor = [230, 240, 255]
    const lightGrayColor = [245, 245, 245]
    let yPos = margin

    // Header
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Healiinn Prescription', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Doctor Name and Specialty
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(prescription?.doctorName || 'Doctor', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(prescription?.doctorSpecialty || 'Specialty', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    // Line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Patient Info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Information', margin, yPos)
    yPos += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${request.patientName || 'N/A'}`, margin, yPos)
    yPos += 4
    if (request.patientPhone) {
      doc.text(`Phone: ${request.patientPhone}`, margin, yPos)
      yPos += 4
    }
    if (request.patientAddress) {
      const addressLines = doc.splitTextToSize(`Address: ${request.patientAddress}`, pageWidth - 2 * margin)
      addressLines.forEach(line => {
        doc.text(line, margin, yPos)
        yPos += 4
      })
    } else {
      yPos += 4
    }
    yPos += 2

    // Diagnosis
    if (prescription?.diagnosis) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Diagnosis', margin, yPos)
      yPos += 6
      const diagnosisHeight = 8
      doc.setFillColor(...lightBlueColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(prescription.diagnosis, margin + 4, yPos + 2)
      yPos += diagnosisHeight + 4
    }

    // Medications
    if (prescription?.medications && prescription.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6

      prescription.medications.forEach((med, idx) => {
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }

        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')

        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7

        doc.text(`Dosage: ${med.dosage || 'N/A'}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        doc.text(`Frequency: ${med.frequency || 'N/A'}`, rightColX, startY)

        if (med.instructions) {
          doc.setFont('helvetica', 'bold')
          doc.text('Instructions:', rightColX, startY + 4)
          doc.setFont('helvetica', 'normal')
          const instructionsLines = doc.splitTextToSize(med.instructions, (pageWidth - 2 * margin) / 2 - 5)
          instructionsLines.forEach((line, lineIdx) => {
            doc.text(line, rightColX, startY + 8 + (lineIdx * 4))
          })
        }

        yPos += cardHeight + 4
      })
    }

    // Date
    yPos += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Issued: ${formatDate(prescription?.issuedAt)}`, margin, yPos)

    return doc
  }

  const handleViewPDF = (request) => {
    const doc = generatePDF(request)
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const handleDownloadPDF = (request) => {
    const doc = generatePDF(request)
    const fileName = `Prescription_${request.patientName || 'Patient'}_${request.id}.pdf`
    doc.save(fileName)
  }

  const handleMarkCompleted = (requestId) => {
    try {
      const allRequests = JSON.parse(localStorage.getItem('adminRequests') || '[]')
      const updatedRequests = allRequests.map(r => 
        r.id === requestId ? { ...r, status: 'completed' } : r
      )
      localStorage.setItem('adminRequests', JSON.stringify(updatedRequests))
      loadRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#11496c]">
            <IoSearchOutline className="h-5 w-5" aria-hidden="true" />
          </span>
          <input
            type="search"
            placeholder="Search by patient name, phone, doctor, diagnosis, or medicine..."
            className="w-full rounded-xl border border-[rgba(17,73,108,0.2)] bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm transition-all placeholder:text-slate-400 hover:border-[rgba(17,73,108,0.3)] hover:bg-white hover:shadow-md focus:border-[#11496c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(17,73,108,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Summary */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <article
            onClick={() => handleCardClick('all')}
            className={`rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
              filter === 'all' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Total Orders</p>
                <p className="text-xl font-bold text-blue-900">{requests.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                <IoBagHandleOutline className="text-lg" />
              </div>
            </div>
          </article>
          <article
            onClick={() => handleCardClick('pending')}
            className={`rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
              filter === 'pending' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Pending</p>
                <p className="text-xl font-bold text-amber-900">{requests.filter(r => r.status === 'pending' || r.status === 'payment_pending' || r.status === 'confirmed').length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                <IoTimeOutline className="text-lg" />
              </div>
            </div>
          </article>
          <article
            onClick={() => handleCardClick('accepted')}
            className={`rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
              filter === 'accepted' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">Accepted</p>
                <p className="text-xl font-bold text-emerald-900">{requests.filter(r => r.pharmacyAccepted === true && r.status !== 'completed').length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <IoCheckmarkCircleOutline className="text-lg" />
              </div>
            </div>
          </article>
          <article
            onClick={() => handleCardClick('completed')}
            className={`rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
              filter === 'completed' ? 'ring-2 ring-slate-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 mb-1">Completed</p>
                <p className="text-xl font-bold text-slate-900">{requests.filter(r => r.status === 'completed' || r.deliveryStatus === 'delivered').length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500 text-white">
                <IoCheckmarkDoneOutline className="text-lg" />
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            <IoBagHandleOutline className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-base font-semibold text-slate-700 mb-1">
              {searchTerm ? 'No matching requests found' : 'No requests found'}
            </p>
            <p className="text-sm text-slate-500">
              {searchTerm 
                ? 'Try adjusting your search or filter criteria' 
                : 'Patient medicine order requests will appear here'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-sm font-medium text-[#11496c] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status || request.deliveryStatus)
            const medications = request.medicines || request.prescription?.medications || []
            const medicationsCount = medications.length

            return (
              <article
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#11496c]/30 hover:shadow-lg cursor-pointer active:scale-[0.99] sm:p-5"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  request.status === 'completed' || request.deliveryStatus === 'delivered' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : request.pharmacyAccepted 
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : request.pharmacyRejected
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : request.status === 'payment_pending' || request.status === 'confirmed'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600'
                }`} />
                
                <div className="flex items-start gap-4 pt-1">
                  {/* Patient Avatar */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white shadow-md group-hover:shadow-lg transition-shadow">
                    <IoPersonOutline className="h-7 w-7" />
                    {request.paymentConfirmed && (
                      <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
                        <IoCheckmarkCircleOutline className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-slate-900">{request.patientName || 'Unknown Patient'}</h3>
                          {request.totalAmount && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <IoWalletOutline className="h-3 w-3" />
                              ₹{request.totalAmount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-2">
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 border border-slate-200">
                            <IoMedicalOutline className="h-3.5 w-3.5 text-[#11496c]" />
                            <span className="font-medium">{request.prescription?.doctorName || 'Doctor'}</span>
                          </div>
                          {request.prescription?.doctorSpecialty && (
                            <span className="text-slate-500">{request.prescription.doctorSpecialty}</span>
                          )}
                        </div>
                        {request.prescription?.diagnosis && (
                          <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                            <p className="text-xs font-medium text-amber-900">
                              <span className="font-semibold">Diagnosis:</span> {request.prescription.diagnosis}
                            </p>
                          </div>
                        )}
                        {/* Pharmacy Information */}
                        {pharmacyInfo && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <IoBagHandleOutline className="h-3.5 w-3.5 text-[#11496c]" />
                              <span className="text-xs font-semibold text-[#11496c]">{pharmacyInfo.pharmacyName}</span>
                            </div>
                            <div className="space-y-1 text-[10px] text-slate-600">
                              {pharmacyInfo.address && (
                                <div className="flex items-start gap-1">
                                  <IoLocationOutline className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{formatPharmacyAddress(pharmacyInfo.address)}</span>
                                </div>
                              )}
                              {pharmacyInfo.phone && (
                                <div className="flex items-center gap-1">
                                  <IoCallOutline className="h-3 w-3 shrink-0" />
                                  <span>{pharmacyInfo.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
                            <IoBagHandleOutline className="h-3.5 w-3.5" />
                            {medicationsCount} Medicine{medicationsCount !== 1 ? 's' : ''}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {medications.slice(0, 2).map((med, idx) => {
                              const medName = typeof med === 'string' ? med : med.name || 'Medicine'
                              return (
                                <span key={idx} className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                                  {medName}
                                </span>
                              )
                            })}
                            {medications.length > 2 && (
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                                +{medications.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                        {request.deliveryType && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[10px] font-bold ${
                              request.deliveryType === 'home'
                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300'
                            }`}>
                              {request.deliveryType === 'home' ? (
                                <>
                                  <IoBagHandleOutline className="h-3.5 w-3.5" />
                                  HOME DELIVERY
                                </>
                              ) : (
                                <>
                                  <IoMedicalOutline className="h-3.5 w-3.5" />
                                  PICKUP
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm ${getDeliveryStatusColor(request.status, request.deliveryStatus)}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {getDeliveryStatusLabel(request.status, request.deliveryStatus)}
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 border border-slate-200">
                          <IoCalendarOutline className="h-3.5 w-3.5 text-[#11496c]" />
                          <span className="font-medium">{formatDateTime(request.createdAt)}</span>
                        </div>
                        {request.estimatedDeliveryTime && (request.deliveryStatus === 'out_for_delivery' || request.status === 'out_for_delivery') && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 border border-blue-200">
                            <IoTimeOutline className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-medium text-blue-700">ETA: {formatDateTime(request.estimatedDeliveryTime)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Reject and Accept Buttons - Show when payment confirmed and order not yet accepted/rejected */}
                        {((request.paymentConfirmed || request.status === 'payment_pending' || request.status === 'pending' || request.status === 'confirmed') && !request.pharmacyAccepted && !request.pharmacyRejected && request.status !== 'completed' && request.status !== 'rejected' && request.status !== 'accepted' && request.deliveryStatus !== 'preparing' && request.status !== 'preparing' && request.deliveryStatus !== 'out_for_delivery' && request.status !== 'out_for_delivery' && request.deliveryStatus !== 'delivered') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRejectOrder(request.id || request.requestId)
                              }}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                              <IoCloseCircleOutline className="h-4 w-4" />
                              Reject
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAcceptOrder(request.id || request.requestId)
                              }}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                              <IoCheckmarkCircleOutline className="h-4 w-4" />
                              Accept
                            </button>
                          </>
                        )}
                        {/* Deliver Order Button - Show when payment confirmed and not yet delivered */}
                        {request.paymentConfirmed && 
                         request.deliveryStatus !== 'delivered' && 
                         request.status !== 'completed' && 
                         (request.status === 'confirmed' || 
                          request.status === 'payment_pending' || 
                          request.deliveryStatus === 'preparing' || 
                          request.status === 'preparing' || 
                          request.deliveryStatus === 'out_for_delivery' || 
                          request.status === 'out_for_delivery') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsDelivered(request.id || request.requestId)
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <IoCheckmarkDoneOutline className="h-4 w-4" />
                            Deliver Order
                          </button>
                        )}
                        {/* Confirm Order Button - Show when order is accepted and payment confirmed but not yet preparing */}
                        {(request.status === 'accepted' || request.status === 'confirmed' || request.status === 'payment_pending') && request.pharmacyAccepted && !request.pharmacyConfirmed && request.paymentConfirmed && request.deliveryStatus !== 'preparing' && request.status !== 'preparing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConfirmOrder(request.id || request.requestId)
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Confirm Order
                          </button>
                        )}
                        {/* Rejected Status Badge */}
                        {(request.status === 'rejected' || request.pharmacyRejected) && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 border border-red-300 shadow-sm">
                            <IoCloseCircleOutline className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        )}
                        {/* Accepted Status Badge */}
                        {request.status === 'accepted' && request.pharmacyAccepted && !request.pharmacyConfirmed && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 border border-green-300 shadow-sm">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Accepted
                          </span>
                        )}
                        {/* Preparing - Show "Out for Delivery" button */}
                        {(request.deliveryStatus === 'preparing' || request.status === 'preparing') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOutForDelivery(request.id || request.requestId)
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <IoCarOutline className="h-4 w-4" />
                            Out for Delivery
                          </button>
                        )}
                        {/* Out for Delivery - Show "Mark as Delivered" button */}
                        {(request.deliveryStatus === 'out_for_delivery' || request.status === 'out_for_delivery') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsDelivered(request.id || request.requestId)
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                          >
                            <IoCheckmarkDoneOutline className="h-4 w-4" />
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm px-3 pb-3 sm:items-center sm:px-4 sm:pb-6"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-br from-[#11496c] via-[#0d3a52] to-[#11496c] p-5 rounded-t-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">Request Details</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white/90">{selectedRequest.patientName || 'Patient'}</p>
                    {selectedRequest.totalAmount && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-white border border-white/30">
                        <IoWalletOutline className="h-3 w-3" />
                        ₹{selectedRequest.totalAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-xl p-2 text-white/90 transition-all hover:bg-white/20 hover:text-white hover:scale-110 active:scale-95"
                >
                  <IoCloseOutline className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Pharmacy Information */}
              {pharmacyInfo && (
                <div className="rounded-2xl border-2 border-[#11496c]/20 bg-gradient-to-br from-[#11496c]/5 via-[#0d3a52]/5 to-[#11496c]/5 p-5 shadow-sm">
                  <h3 className="text-base font-bold text-[#11496c] mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11496c] text-white">
                      <IoBagHandleOutline className="h-4 w-4" />
                    </div>
                    Pharmacy Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Pharmacy Name:</span>
                      <span className="ml-2 text-slate-900 font-semibold">{pharmacyInfo.pharmacyName || 'N/A'}</span>
                    </div>
                    {pharmacyInfo.ownerName && (
                      <div>
                        <span className="font-medium text-slate-700">Owner:</span>
                        <span className="ml-2 text-slate-900">{pharmacyInfo.ownerName}</span>
                      </div>
                    )}
                    {pharmacyInfo.address && (
                      <div>
                        <span className="font-medium text-slate-700">Address:</span>
                        <span className="ml-2 text-slate-900">{formatPharmacyAddress(pharmacyInfo.address)}</span>
                      </div>
                    )}
                    {pharmacyInfo.phone && (
                      <div>
                        <span className="font-medium text-slate-700">Phone:</span>
                        <span className="ml-2 text-slate-900">{pharmacyInfo.phone}</span>
                      </div>
                    )}
                    {pharmacyInfo.email && (
                      <div>
                        <span className="font-medium text-slate-700">Email:</span>
                        <span className="ml-2 text-slate-900">{pharmacyInfo.email}</span>
                      </div>
                    )}
                    {pharmacyInfo.licenseNumber && (
                      <div>
                        <span className="font-medium text-slate-700">License Number:</span>
                        <span className="ml-2 text-slate-900">{pharmacyInfo.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Information */}
              <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                    <IoPersonOutline className="h-4 w-4" />
                  </div>
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Name:</span>
                    <span className="ml-2 text-slate-900">{selectedRequest.patientName || 'N/A'}</span>
                  </div>
                  {selectedRequest.patientPhone && (
                    <div>
                      <span className="font-medium text-slate-700">Phone:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientPhone}</span>
                    </div>
                  )}
                  {selectedRequest.patientAddress && (
                    <div>
                      <span className="font-medium text-slate-700">Address:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.patientAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Information */}
              {selectedRequest.prescription && (
                <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                      <IoMedicalOutline className="h-4 w-4" />
                    </div>
                    Doctor Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorName || 'N/A'}</span>
                    </div>
                    {selectedRequest.prescription.doctorSpecialty && (
                      <div>
                        <span className="font-medium text-slate-700">Specialty:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.doctorSpecialty}</span>
                      </div>
                    )}
                    {selectedRequest.prescription.diagnosis && (
                      <div>
                        <span className="font-medium text-slate-700">Diagnosis:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.prescription.diagnosis}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medications */}
              {(selectedRequest.medicines && selectedRequest.medicines.length > 0) || (selectedRequest.prescription?.medications && selectedRequest.prescription.medications.length > 0) ? (
                <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                      <IoBagHandleOutline className="h-4 w-4" />
                    </div>
                    Required Medicines ({(selectedRequest.medicines || selectedRequest.prescription?.medications || []).length})
                  </h3>
                  <div className="space-y-2">
                    {(selectedRequest.medicines || selectedRequest.prescription?.medications || []).map((med, idx) => {
                      const medName = typeof med === 'string' ? med : med.name || 'Medicine'
                      const dosage = typeof med === 'object' ? med.dosage : null
                      const frequency = typeof med === 'object' ? med.frequency : null
                      const duration = typeof med === 'object' ? med.duration : null
                      const instructions = typeof med === 'object' ? med.instructions : null
                      return (
                        <div key={idx} className="rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-xs font-bold text-white shadow-sm">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{medName}</p>
                              <div className="mt-1 space-y-1 text-xs text-slate-600">
                                {dosage && <p>Dosage: {dosage}</p>}
                                {frequency && <p>Frequency: {frequency}</p>}
                                {duration && <p>Duration: {duration}</p>}
                                {instructions && <p className="text-slate-500">Instructions: {instructions}</p>}
                                {typeof med === 'object' && med.quantity && (
                                  <p className="font-semibold text-[#11496c]">Quantity: {med.quantity} tablets</p>
                                )}
                                {typeof med === 'object' && med.price && (
                                  <p className="font-semibold text-[#11496c]">
                                    Price: ₹{((med.quantity || 1) * (med.price || 0)).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Prescription PDF */}
              <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                    <IoDocumentTextOutline className="h-4 w-4" />
                  </div>
                  Prescription PDF
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleViewPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-[#11496c] hover:bg-[#11496c] hover:text-white hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoEyeOutline className="h-5 w-5" />
                    <span>View PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#11496c] to-[#0d3a52] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    <IoDownloadOutline className="h-5 w-5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Request Date */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                  <IoTimeOutline className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Request Date</p>
                  <p className="text-sm font-bold text-slate-900">{formatDateTime(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Delivery Status Information */}
              {(selectedRequest.deliveryStatus || selectedRequest.status === 'preparing' || selectedRequest.status === 'out_for_delivery' || selectedRequest.status === 'completed') && (
                <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#11496c] to-[#0d3a52] text-white">
                      <IoCarOutline className="h-4 w-4" />
                    </div>
                    Delivery Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Status:</span>
                      {/* Simplified condition - clickable for all non-delivered orders */}
                      {(selectedRequest.deliveryStatus !== 'delivered' && selectedRequest.status !== 'completed') ? (
                        <button
                          onClick={() => {
                            handleMarkAsDelivered(selectedRequest.id || selectedRequest.requestId)
                          }}
                          className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 hover:shadow-md ${getDeliveryStatusColor(selectedRequest.status, selectedRequest.deliveryStatus)}`}
                          title="Click to mark as delivered"
                        >
                          {(() => {
                            const ModalStatusIcon = getStatusIcon(selectedRequest.status || selectedRequest.deliveryStatus)
                            const IconComponent = ModalStatusIcon
                            return <IconComponent className="h-3 w-3" />
                          })()}
                          <span>Deliver Order</span>
                        </button>
                      ) : (
                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getDeliveryStatusColor(selectedRequest.status, selectedRequest.deliveryStatus)}`}>
                          {(() => {
                            const ModalStatusIcon = getStatusIcon(selectedRequest.status || selectedRequest.deliveryStatus)
                            const IconComponent = ModalStatusIcon
                            return <IconComponent className="h-3 w-3" />
                          })()}
                          {getDeliveryStatusLabel(selectedRequest.status, selectedRequest.deliveryStatus)}
                        </span>
                      )}
                    </div>
                    {selectedRequest.preparingAt && (
                      <div>
                        <span className="font-medium text-slate-700">Preparing Started:</span>
                        <span className="ml-2 text-slate-900">{formatDateTime(selectedRequest.preparingAt)}</span>
                      </div>
                    )}
                    {selectedRequest.outForDeliveryAt && (
                      <div>
                        <span className="font-medium text-slate-700">Out for Delivery:</span>
                        <span className="ml-2 text-slate-900">{formatDateTime(selectedRequest.outForDeliveryAt)}</span>
                      </div>
                    )}
                    {selectedRequest.estimatedDeliveryTime && (
                      <div>
                        <span className="font-medium text-slate-700">Estimated Delivery:</span>
                        <span className="ml-2 text-blue-600 font-semibold">{formatDateTime(selectedRequest.estimatedDeliveryTime)}</span>
                      </div>
                    )}
                    {selectedRequest.deliveredAt && (
                      <div>
                        <span className="font-medium text-slate-700">Delivered At:</span>
                        <span className="ml-2 text-emerald-600 font-semibold">{formatDateTime(selectedRequest.deliveredAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                {/* Reject and Accept Buttons - Show when payment confirmed and order not yet accepted/rejected */}
                {((selectedRequest.paymentConfirmed || selectedRequest.status === 'payment_pending' || selectedRequest.status === 'pending' || selectedRequest.status === 'confirmed') && !selectedRequest.pharmacyAccepted && !selectedRequest.pharmacyRejected && selectedRequest.status !== 'completed' && selectedRequest.status !== 'rejected' && selectedRequest.status !== 'accepted' && selectedRequest.deliveryStatus !== 'preparing' && selectedRequest.status !== 'preparing' && selectedRequest.deliveryStatus !== 'out_for_delivery' && selectedRequest.status !== 'out_for_delivery' && selectedRequest.deliveryStatus !== 'delivered') && (
                  <>
                    <button
                      onClick={() => {
                        handleRejectOrder(selectedRequest.id || selectedRequest.requestId)
                        setSelectedRequest(null)
                      }}
                      className="w-full rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <IoCloseCircleOutline className="h-5 w-5" />
                      <span>Reject Order</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAcceptOrder(selectedRequest.id || selectedRequest.requestId)
                        setSelectedRequest(null)
                      }}
                      className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <IoCheckmarkCircleOutline className="h-5 w-5" />
                      <span>Accept Order</span>
                    </button>
                  </>
                )}
                {/* Deliver Order Button - Primary action when payment confirmed */}
                {selectedRequest.paymentConfirmed && 
                 selectedRequest.deliveryStatus !== 'delivered' && 
                 selectedRequest.status !== 'completed' && 
                 (selectedRequest.status === 'confirmed' || 
                  selectedRequest.status === 'payment_pending' || 
                  selectedRequest.deliveryStatus === 'preparing' || 
                  selectedRequest.status === 'preparing' || 
                  selectedRequest.deliveryStatus === 'out_for_delivery' || 
                  selectedRequest.status === 'out_for_delivery') && (
                  <button
                    onClick={() => {
                      handleMarkAsDelivered(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkDoneOutline className="h-5 w-5" />
                    <span>Deliver Order</span>
                  </button>
                )}
                {/* Confirm Order Button - Show when order is accepted and payment confirmed but not yet preparing */}
                {(selectedRequest.status === 'accepted' || selectedRequest.status === 'confirmed' || selectedRequest.status === 'payment_pending') && selectedRequest.pharmacyAccepted && !selectedRequest.pharmacyConfirmed && selectedRequest.paymentConfirmed && selectedRequest.deliveryStatus !== 'preparing' && selectedRequest.status !== 'preparing' && (
                  <button
                    onClick={() => {
                      handleConfirmOrder(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Confirm Order (Start Preparing)</span>
                  </button>
                )}
                {/* Out for Delivery Button */}
                {(selectedRequest.deliveryStatus === 'preparing' || selectedRequest.status === 'preparing') && (
                  <button
                    onClick={() => {
                      handleOutForDelivery(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCarOutline className="h-5 w-5" />
                    <span>Mark as Out for Delivery</span>
                  </button>
                )}
                {/* Mark as Delivered Button */}
                {(selectedRequest.deliveryStatus === 'out_for_delivery' || selectedRequest.status === 'out_for_delivery') && (
                  <button
                    onClick={() => {
                      handleMarkAsDelivered(selectedRequest.id || selectedRequest.requestId)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkDoneOutline className="h-5 w-5" />
                    <span>Mark as Delivered</span>
                  </button>
                )}
                {/* Legacy: Mark as Completed for pending orders */}
                {selectedRequest.status === 'pending' && !selectedRequest.paymentConfirmed && (
                  <button
                    onClick={() => {
                      handleMarkCompleted(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoCheckmarkCircleOutline className="h-5 w-5" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacyRequestOrders

