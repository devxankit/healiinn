import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import DoctorNavbar from '../doctor-components/DoctorNavbar'
import jsPDF from 'jspdf'
import { useToast } from '../../../contexts/ToastContext'
import { getDoctorConsultations, getAllDoctorConsultations, getConsultationById, createConsultation, updateConsultation, getPatientById, getPatientHistory, createPrescription, getPrescriptions } from '../doctor-services/doctorService'
import {
  IoDocumentTextOutline,
  IoSearchOutline,
  IoPersonOutline,
  IoMedicalOutline,
  IoFlaskOutline,
  IoAddOutline,
  IoCloseOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoAttachOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoBodyOutline,
  IoThermometerOutline,
  IoPulseOutline,
  IoWaterOutline,
  IoPrintOutline,
  IoEyeOutline,
  IoArrowBackOutline,
  IoCreateOutline,
} from 'react-icons/io5'

// Get doctor info from localStorage (set when doctor saves profile)
const getDoctorInfo = () => {
  try {
    const savedProfile = localStorage.getItem('doctorProfile')
    if (savedProfile) {
      const profile = JSON.parse(savedProfile)
      console.log('Loaded profile from localStorage:', profile)
      console.log('Digital Signature:', profile.digitalSignature)
      
      // Get signature - check multiple possible paths
      let signature = ''
      if (profile.digitalSignature?.imageUrl) {
        signature = profile.digitalSignature.imageUrl
      } else if (profile.digitalSignature) {
        // If it's a string directly
        signature = typeof profile.digitalSignature === 'string' ? profile.digitalSignature : ''
      }
      
      return {
        name: `${profile.firstName || 'Dr.'} ${profile.lastName || ''}`.trim() || profile.name || 'Dr. Unknown',
        qualification: profile.qualification || 'MBBS',
        licenseNumber: profile.licenseNumber || 'N/A',
        clinicName: profile.clinicDetails?.name || profile.clinicName || 'Clinic',
        clinicAddress: profile.clinicDetails?.address 
          ? `${profile.clinicDetails.address.line1 || ''}${profile.clinicDetails.address.line2 ? ', ' + profile.clinicDetails.address.line2 : ''}, ${profile.clinicDetails.address.city || ''}, ${profile.clinicDetails.address.state || ''} - ${profile.clinicDetails.address.postalCode || ''}`
          : profile.clinicAddress || '',
        phone: profile.phone || profile.contactNumber || '',
        email: profile.email || '',
        specialization: profile.specialization || 'General Physician',
        digitalSignature: signature,
      }
    }
  } catch (error) {
    console.error('Error loading doctor profile:', error)
  }
  
  // Default fallback
  return {
    name: 'Dr. Sarah Mitchell',
    qualification: 'MBBS, MD (Cardiology)',
    licenseNumber: 'MD-12345',
    clinicName: 'Heart Care Clinic',
    clinicAddress: '123 Medical Center Drive, Suite 200, New York, NY 10001',
    phone: '+1-555-123-4567',
    email: 'sarah.mitchell@example.com',
    specialization: 'General Physician',
    digitalSignature: '',
  }
}

// Mock data removed - using API data now

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const DoctorConsultations = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') || 'all'
  const isDashboardPage = location.pathname === '/doctor/dashboard' || location.pathname === '/doctor/'
  
  const [loadingConsultations, setLoadingConsultations] = useState(false)
  const [consultationsError, setConsultationsError] = useState(null)
          
          // Helper function to calculate age from dateOfBirth
  const calculateAge = useCallback((dateOfBirth) => {
            if (!dateOfBirth) return null
    try {
            const birthDate = new Date(dateOfBirth)
      if (isNaN(birthDate.getTime())) return null
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return null
          }
  }, [])

  // Helper function to transform consultation data from API
  const transformConsultationData = useCallback((cons) => {
            const patientDateOfBirth = cons.patientId?.dateOfBirth
            const calculatedAge = patientDateOfBirth ? calculateAge(patientDateOfBirth) : (cons.patientId?.age || cons.age || null)
    
    // Format patient address properly
    let formattedAddress = 'Not provided'
    
    // Debug: Log address data
    if (cons.patientId?.address) {
      console.log('Address found for patient:', cons.patientId._id || cons.patientId.id, cons.patientId.address)
    }
    
    if (cons.patientId?.address) {
      const address = cons.patientId.address
      // Check if address object has any non-empty values
      const hasAddressData = address && typeof address === 'object' && (
        address.line1 || 
        address.line2 || 
        address.city || 
        address.state || 
        address.postalCode || 
        address.country
      )
      
      if (hasAddressData) {
        const addressParts = [
          address.line1,
          address.line2,
          address.city,
          address.state,
          address.postalCode,
          address.country
        ].filter(part => part && typeof part === 'string' && part.trim() !== '')
        
        if (addressParts.length > 0) {
          formattedAddress = addressParts.join(', ')
        }
      }
    } else if (cons.patientAddress && typeof cons.patientAddress === 'string' && cons.patientAddress.trim() !== '') {
      formattedAddress = cons.patientAddress
    }
            
            return {
              id: cons._id || cons.id,
              _id: cons._id || cons.id,
              patientId: cons.patientId?._id || cons.patientId?.id || cons.patientId || 'pat-unknown',
              patientName: cons.patientId?.firstName && cons.patientId?.lastName
                ? `${cons.patientId.firstName} ${cons.patientId.lastName}`
                : cons.patientId?.name || cons.patientName || 'Unknown Patient',
              age: calculatedAge,
              gender: cons.patientId?.gender || cons.gender || 'male',
      appointmentTime: (() => {
        if (cons.appointmentId?.appointmentDate) {
          const dateStr = typeof cons.appointmentId.appointmentDate === 'string' 
            ? cons.appointmentId.appointmentDate.split('T')[0]
            : cons.appointmentId.appointmentDate instanceof Date
            ? cons.appointmentId.appointmentDate.toISOString().split('T')[0]
            : null
          if (dateStr) {
            return `${dateStr}T${cons.appointmentId.time || '00:00'}`
          }
        }
        if (cons.appointmentTime) return cons.appointmentTime
        if (cons.consultationDate) {
          const dateStr = typeof cons.consultationDate === 'string'
            ? cons.consultationDate.split('T')[0]
            : cons.consultationDate instanceof Date
            ? cons.consultationDate.toISOString().split('T')[0]
            : null
          if (dateStr) return `${dateStr}T00:00`
        }
        return new Date().toISOString()
      })(),
      appointmentDate: (() => {
        const dateValue = cons.appointmentId?.appointmentDate || cons.appointmentDate || cons.consultationDate
        if (!dateValue) return null
        if (typeof dateValue === 'string') {
          return dateValue.split('T')[0]
        }
        if (dateValue instanceof Date) {
          if (isNaN(dateValue.getTime())) return null
          return dateValue.toISOString().split('T')[0]
        }
        return null
      })(),
              appointmentType: cons.appointmentId?.appointmentType || cons.appointmentType || 'New',
              status: cons.status || 'pending',
              reason: cons.chiefComplaint || cons.reason || 'Consultation',
              patientImage: cons.patientId?.profileImage || cons.patientId?.image || cons.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(cons.patientId?.firstName || 'Patient')}&background=3b82f6&color=fff&size=160`,
              patientPhone: cons.patientId?.phone || cons.patientPhone || '',
              patientEmail: cons.patientId?.email || cons.patientEmail || '',
      patientAddress: formattedAddress,
              diagnosis: cons.diagnosis || '',
              vitals: cons.vitals || {},
              medications: cons.medications || [],
              investigations: cons.investigations || [],
              advice: cons.advice || cons.notes || '',
              attachments: cons.attachments || [],
              originalData: cons,
            }
  }, [calculateAge])

  // Fetch consultations from API
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoadingConsultations(true)
        setConsultationsError(null)
        const response = await getDoctorConsultations()
        
        if (response.success && response.data) {
          const consultationsData = Array.isArray(response.data) 
            ? response.data 
            : response.data.consultations || response.data.items || []
          
          // Transform API data to match component structure
          const transformed = consultationsData.map(transformConsultationData)
          
          // Set consultations from API data only
          setConsultations(transformed)
        }
      } catch (err) {
        console.error('Error fetching consultations:', err)
        // Check if it's a connection error
        const isConnectionError = err.message?.includes('Failed to fetch') || 
                                  err.message?.includes('ERR_CONNECTION_REFUSED') ||
                                  err.message?.includes('NetworkError') ||
                                  err instanceof TypeError && err.message === 'Failed to fetch'
        
        if (isConnectionError) {
          setConsultationsError('Unable to connect to server. Please check if the backend server is running.')
        } else {
          setConsultationsError(err.message || 'Failed to load consultations')
        }
        // Don't show toast here as it might be too frequent
      } finally {
        setLoadingConsultations(false)
      }
    }
    
    // Only fetch if not viewing from all consultations page
    if (!location.state?.loadSavedData) {
      fetchConsultations()
      // Refresh every 30 seconds
      const interval = setInterval(fetchConsultations, 30000)
      return () => clearInterval(interval)
    }
  }, [location.state?.loadSavedData])
  
  // Consultations state - loaded from API only
  const [consultations, setConsultations] = useState([])
  
  // Filter consultations based on URL parameter
  const filteredConsultations = useMemo(() => {
    let filtered = consultations
    
    if (filterParam === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      filtered = consultations.filter((consultation) => {
        const appointmentDate = new Date(consultation.appointmentTime)
        return appointmentDate >= today && appointmentDate < tomorrow
      })
    } else if (filterParam === 'pending') {
      filtered = consultations.filter((consultation) => 
        consultation.status === 'waiting' || consultation.status === 'pending'
      )
    }
    
    // Sort by status: in-progress/called first, then completed
    return filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return 0
    })
  }, [consultations, filterParam])
  
  // Check if consultation is passed via navigation state
  const passedConsultation = location.state?.selectedConsultation
  
  const [selectedConsultation, setSelectedConsultation] = useState(() => {
    // First check if consultation is passed via navigation state (from all consultations page or called patient)
    if (location.state?.selectedConsultation) {
      // If loadSavedData flag is set, we're viewing from all consultations - don't check session
      if (location.state?.loadSavedData) {
        return location.state.selectedConsultation
      }
      // Otherwise, check if session is active (for called patients)
      try {
        const session = localStorage.getItem('doctorCurrentSession')
        if (!session) {
          // No active session, but if consultation is passed, still show it
          return location.state.selectedConsultation
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
      return location.state.selectedConsultation
    }
    
    // If no passed consultation, check for active session before loading from localStorage
    try {
      const session = localStorage.getItem('doctorCurrentSession')
      if (!session) {
        // No active session, clear consultation data
        localStorage.removeItem('doctorSelectedConsultation')
        localStorage.removeItem('doctorConsultations')
        return null
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
    
    // If no passed consultation, try to load from localStorage (for persistence when navigating back)
    try {
      const saved = localStorage.getItem('doctorSelectedConsultation')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Only load if it's an active consultation (not completed) and session is active
        if (parsed.status === 'in-progress' || parsed.status === 'called') {
          // Double check session is still active
          const session = localStorage.getItem('doctorCurrentSession')
          if (session) {
            return parsed
          }
        }
      }
    } catch (error) {
      console.error('Error loading selected consultation from localStorage:', error)
    }
    
    // Don't auto-select from filteredConsultations - only show if explicitly called
    return null
  })
  
  // Save consultations to localStorage whenever they change
  useEffect(() => {
    try {
      // Save all consultations (only called patients, no mock data)
      if (consultations.length > 0) {
        localStorage.setItem('doctorConsultations', JSON.stringify(consultations))
      } else {
        localStorage.removeItem('doctorConsultations')
      }
    } catch (error) {
      console.error('Error saving consultations to localStorage:', error)
    }
  }, [consultations])
  
  // Save selectedConsultation to localStorage for persistence
  useEffect(() => {
    try {
      if (selectedConsultation) {
        // Only save if it's an active consultation (not completed)
        if (selectedConsultation.status === 'in-progress' || selectedConsultation.status === 'called') {
          localStorage.setItem('doctorSelectedConsultation', JSON.stringify(selectedConsultation))
        } else {
          // Remove from localStorage if completed
          localStorage.removeItem('doctorSelectedConsultation')
        }
      } else {
        localStorage.removeItem('doctorSelectedConsultation')
      }
    } catch (error) {
      console.error('Error saving selected consultation to localStorage:', error)
    }
  }, [selectedConsultation])

  // Add passed consultation to consultations list and set as selected
  useEffect(() => {
    if (passedConsultation) {
      // Create a mutable copy of passedConsultation
      let updatedConsultation = { ...passedConsultation }
      
      // Load saved prescription data if loadSavedData flag is set
      if (location.state?.loadSavedData && passedConsultation.id) {
        const loadSavedData = async () => {
        try {
          // Load prescription from API using consultation ID
          const consultationResponse = await getConsultationById(passedConsultation.id)
          if (consultationResponse.success && consultationResponse.data) {
            const consultation = consultationResponse.data
            
            // Transform consultation data to get updated patient info (age, email, address)
            const transformedConsultation = transformConsultationData(consultation)
            
            // Load prescription data from consultation
            if (consultation.medications && consultation.medications.length > 0) {
              // Load prescription data into form
                setDiagnosis(consultation.diagnosis || '')
                setSymptoms(consultation.symptoms || '')
                setMedications(consultation.medications || [])
                setInvestigations(consultation.investigations || [])
                setAdvice(consultation.advice || '')
                setFollowUpDate(consultation.followUpDate || '')
                setVitals(consultation.vitals || {
              bloodPressure: { systolic: '', diastolic: '' },
              temperature: '',
              pulse: '',
              respiratoryRate: '',
              oxygenSaturation: '',
              weight: '',
              height: '',
              bmi: '',
            })
            }
            
            // Update consultation with fresh patient data and prescription data
            updatedConsultation = {
              ...transformedConsultation,
                  diagnosis: consultation.diagnosis || updatedConsultation.diagnosis || '',
                  symptoms: consultation.symptoms || updatedConsultation.symptoms || '',
                  vitals: consultation.vitals || updatedConsultation.vitals || {},
                  medications: consultation.medications || updatedConsultation.medications || [],
                  investigations: consultation.investigations || updatedConsultation.investigations || [],
                  advice: consultation.advice || updatedConsultation.advice || '',
                  followUpDate: consultation.followUpDate || updatedConsultation.followUpDate || '',
            }
          }
        } catch (error) {
          console.error('Error loading saved prescription data:', error)
        }
        }
        loadSavedData()
      }
      
      setConsultations((prev) => {
        // Check if consultation already exists
        const exists = prev.find((c) => c.id === updatedConsultation.id || c.patientId === updatedConsultation.patientId)
        if (!exists) {
          // Add new consultation at the beginning
          return [updatedConsultation, ...prev]
        }
        // Update existing consultation with passed data (but preserve status if it was completed)
        return prev.map((c) => {
          if (c.id === updatedConsultation.id || c.patientId === updatedConsultation.patientId) {
            // If existing consultation is completed, don't overwrite with in-progress
            if (c.status === 'completed') {
              return c
            }
            return updatedConsultation
          }
          return c
        })
      })
      setSelectedConsultation(updatedConsultation)
      
      // Load shared prescriptions from consultation data (if patient shared them during booking)
      if (updatedConsultation.sharedPrescriptions && updatedConsultation.sharedPrescriptions.length > 0) {
        // Shared prescriptions are already in consultation data
        console.log('Shared prescriptions loaded:', updatedConsultation.sharedPrescriptions)
      }
      
      // Load patient history from API
      if (passedConsultation.patientId) {
        const loadPatientHistory = async () => {
        try {
          // Extract patient ID - handle both string and object
          const patientId = typeof passedConsultation.patientId === 'object' 
            ? (passedConsultation.patientId._id || passedConsultation.patientId.id || passedConsultation.patientId)
            : passedConsultation.patientId
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            // Patient history will be used in history tab
            // If viewing from all consultations page, show history tab
            if (location.state?.loadSavedData) {
              setActiveTab('history')
            }
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
        }
        }
        loadPatientHistory()
      }
      
      // Clear the navigation state after using it
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [passedConsultation, location.state?.loadSavedData, transformConsultationData]) // Run when passedConsultation changes
  
  // Consultations are managed via API - no localStorage session checks needed
  
  // Update selected consultation when filter changes (but only if consultation was passed)
  useEffect(() => {
    // Don't override if we just set it from passed consultation
    if (passedConsultation && selectedConsultation?.id === passedConsultation.id) {
      return
    }
    
    // Only update if a consultation was explicitly passed (patient was called)
    // Don't auto-select from filteredConsultations
    if (filteredConsultations.length === 0 && selectedConsultation) {
      // If no consultations match filter and we have a selected one, keep it if it was passed
      if (!passedConsultation) {
        setSelectedConsultation(null)
      }
    }
  }, [filteredConsultations, filterParam, passedConsultation])
  const [activeTab, setActiveTab] = useState('vitals') // vitals, prescription, history, saved
  const [showAddMedication, setShowAddMedication] = useState(false)
  const [showAddInvestigation, setShowAddInvestigation] = useState(false)
  
  // Saved prescriptions - loaded from consultation data or patient history
  const [savedPrescriptions, setSavedPrescriptions] = useState([])
  
  const [viewingPrescription, setViewingPrescription] = useState(null)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null)
  const [sharedLabReports, setSharedLabReports] = useState([])
  const [showReportViewer, setShowReportViewer] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Function to load shared lab reports from API
  const loadSharedLabReports = async (patientId, doctorId) => {
    try {
      // Extract patient ID - handle both string and object
      const patientIdString = typeof patientId === 'object' 
        ? (patientId._id || patientId.id || patientId)
        : patientId
      // Fetch patient history which includes shared lab reports
      const { getPatientHistory } = await import('../doctor-services/doctorService')
      const response = await getPatientHistory(patientIdString)
      
      if (response.success && response.data) {
        // Get shared lab reports from patient history
        const sharedReports = response.data.sharedLabReports || []
      
        // Transform reports to match component structure
        const transformedReports = sharedReports.map(report => ({
          id: report._id || report.id,
          _id: report._id || report.id,
          testName: report.testName || report.test?.name || 'Lab Test',
          labName: report.laboratoryId?.labName || report.labName || 'Laboratory',
          date: report.createdAt || report.date || new Date().toISOString().split('T')[0],
          status: report.status || 'ready',
          pdfFileUrl: report.pdfFileUrl || null,
          downloadUrl: report.pdfFileUrl || '#',
          pdfFileName: report.pdfFileName || `${report.testName || 'Report'}_${new Date(report.createdAt || Date.now()).toISOString().split('T')[0]}.pdf`,
          originalData: report,
        }))
        
        setSharedLabReports(transformedReports)
      } else {
        setSharedLabReports([])
      }
    } catch (error) {
      console.error('Error loading shared lab reports:', error)
      setSharedLabReports([])
    }
  }

  // Download lab report PDF (same as patient implementation)
  const handleDownloadLabReport = async (report) => {
    const pdfUrl = report.pdfFileUrl || report.downloadUrl
    if (!pdfUrl || pdfUrl === '#') {
      toast.info('PDF report is not available yet. The lab will share the report PDF once it is ready.')
      return
    }

    try {
      // Check if we have stored PDF in localStorage (from previous download)
      const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
      const storedPdf = storedPdfs[report.id]
      
      if (storedPdf && storedPdf.base64Data) {
        // Use stored PDF if available
        const link = document.createElement('a')
        link.href = storedPdf.base64Data
        link.download = storedPdf.pdfFileName || report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Check if URL is from same origin or is a data URL
      const isSameOrigin = pdfUrl.startsWith(window.location.origin) || pdfUrl.startsWith('/')
      const isDataUrl = pdfUrl.startsWith('data:')
      
      if (isDataUrl) {
        // Direct download for data URLs
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Only try fetch for same-origin URLs to avoid CORS errors
      if (isSameOrigin) {
        try {
          const response = await fetch(pdfUrl, {
            method: 'GET',
          })
          
          if (response.ok) {
            const blob = await response.blob()
            
            // Create a blob URL for download
            const blobUrl = URL.createObjectURL(blob)
            
            // Create download link
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up blob URL
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl)
            }, 100)
            
            // Store PDF in localStorage for offline access
            try {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64Data = reader.result
                const updatedStoredPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                updatedStoredPdfs[report.id] = {
                  pdfFileUrl: pdfUrl,
                  pdfFileName: report.pdfFileName || `${(report.testName || report.reportName || 'Report').replace(/\s+/g, '_')}_${report.date || 'Report'}.pdf`,
                  base64Data: base64Data,
                  downloadedAt: new Date().toISOString(),
                }
                localStorage.setItem('doctorLabReportPdfs', JSON.stringify(updatedStoredPdfs))
              }
              reader.readAsDataURL(blob)
            } catch (storageError) {
              console.error('Error storing PDF:', storageError)
            }
            return
          }
        } catch (fetchError) {
          // Silently handle fetch errors for same-origin (shouldn't happen but handle gracefully)
          console.warn('Fetch failed for same-origin URL')
        }
      }
      
      // For external URLs (cross-origin), don't try fetch (will cause CORS error)
      // Just open in new tab - browser will handle download if server allows
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // Last resort: open in new tab
      window.open(pdfUrl, '_blank')
    }
  }

  // View lab report PDF (open in new tab like patient)
  const handleViewLabReport = (report) => {
    // Check for PDF URL (check multiple possible fields)
    const pdfUrl = report.pdfFileUrl || report.downloadUrl || report.reportFileUrl
    
    // If PDF URL is available and not a placeholder
    if (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
      // Open the lab-uploaded PDF in a new tab (same as patient implementation)
      window.open(pdfUrl, '_blank')
    } else {
      // Fallback: show modal if PDF not available
      console.log('PDF not available for report:', report)
      console.log('pdfFileUrl:', report.pdfFileUrl)
      console.log('downloadUrl:', report.downloadUrl)
      setSelectedReport(report)
      setShowReportViewer(true)
    }
  }

  // Load shared reports when consultation is selected
  useEffect(() => {
    if (selectedConsultation?.patientId) {
      loadSharedLabReports(selectedConsultation.patientId, selectedConsultation.doctorId)
    } else {
      setSharedLabReports([])
    }
  }, [selectedConsultation?.patientId, selectedConsultation?.doctorId])

  // Get doctor info once and store in state to avoid multiple calls
  const [doctorInfo, setDoctorInfo] = useState(() => getDoctorInfo())

  // Update doctor info when component mounts or when needed
  useEffect(() => {
    setDoctorInfo(getDoctorInfo())
  }, [])

  // Prescriptions are saved via API when consultation is updated - no localStorage needed

  // Form states
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    bmi: '',
  })

  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [medications, setMedications] = useState([])
  const [investigations, setInvestigations] = useState([])
  const [advice, setAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  })
  
  // Medicine dropdown state
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false)
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('')
  const [availableMedicines, setAvailableMedicines] = useState([])
  
  // Load medicines - TODO: Add API endpoint for pharmacy medicines
  // For now, using empty array - medicines can be entered manually
  useEffect(() => {
    // Medicines should come from pharmacy API in future
    // For now, allow manual entry only
    setAvailableMedicines([])
  }, [])
  
  // Filter medicines based on search term
  const filteredMedicines = useMemo(() => {
    if (!medicineSearchTerm.trim()) {
      return availableMedicines
    }
    const search = medicineSearchTerm.toLowerCase()
    return availableMedicines.filter(med => 
      med.name.toLowerCase().includes(search) ||
      med.dosage.toLowerCase().includes(search) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(search))
    )
  }, [availableMedicines, medicineSearchTerm])
  
  // Handle medicine selection
  const handleMedicineSelect = (medicine) => {
    setNewMedication({
      ...newMedication,
      name: medicine.name,
      dosage: medicine.dosage, // Auto-fill dosage if available
    })
    setShowMedicineDropdown(false)
    setMedicineSearchTerm('')
  }
  
  // Handle manual medicine name input
  const handleMedicineNameChange = (value) => {
    setNewMedication({ ...newMedication, name: value })
    setMedicineSearchTerm(value)
    // Show dropdown if there's a search term or if medicines are available
    if (value.trim() || availableMedicines.length > 0) {
      setShowMedicineDropdown(true)
    }
  }
  const [newInvestigation, setNewInvestigation] = useState({
    name: '',
    notes: '',
  })
  
  // Test dropdown state
  const [showTestDropdown, setShowTestDropdown] = useState(false)
  const [testSearchTerm, setTestSearchTerm] = useState('')
  const [availableTests, setAvailableTests] = useState([])
  
  // Load tests - TODO: Add API endpoint for laboratory tests
  // For now, using empty array - tests can be entered manually
  useEffect(() => {
    // Tests should come from laboratory API in future
    // For now, allow manual entry only
    setAvailableTests([])
  }, [])
  
  // Filter tests based on search term
  const filteredTests = useMemo(() => {
    if (!testSearchTerm.trim()) {
      return availableTests
    }
    const search = testSearchTerm.toLowerCase()
    return availableTests.filter(test => 
      test.name.toLowerCase().includes(search) ||
      (test.category && test.category.toLowerCase().includes(search))
    )
  }, [availableTests, testSearchTerm])
  
  // Handle test selection
  const handleTestSelect = (test) => {
    setNewInvestigation({
      ...newInvestigation,
      name: test.name,
    })
    setShowTestDropdown(false)
    setTestSearchTerm('')
  }
  
  // Handle manual test name input
  const handleTestNameChange = (value) => {
    setNewInvestigation({ ...newInvestigation, name: value })
    setTestSearchTerm(value)
    // Show dropdown if there's a search term or if tests are available
    if (value.trim() || availableTests.length > 0) {
      setShowTestDropdown(true)
    }
  }
  
  const [attachments, setAttachments] = useState([])

  // Patient history - loaded from API
  const [patientHistory, setPatientHistory] = useState(null)
  
  // Load patient history when consultation is selected
  useEffect(() => {
    const loadPatientHistory = async () => {
      if (selectedConsultation?.patientId) {
        try {
          // Extract patient ID - handle both string and object
          const patientId = typeof selectedConsultation.patientId === 'object' 
            ? (selectedConsultation.patientId._id || selectedConsultation.patientId.id || selectedConsultation.patientId)
            : selectedConsultation.patientId
          const historyResponse = await getPatientHistory(patientId)
          if (historyResponse.success && historyResponse.data) {
            setPatientHistory(historyResponse.data)
          } else {
            setPatientHistory(null)
          }
        } catch (error) {
          console.error('Error loading patient history:', error)
          setPatientHistory(null)
        }
      } else {
        setPatientHistory(null)
      }
    }
    
    loadPatientHistory()
  }, [selectedConsultation?.patientId])

  const handleCalculateBMI = () => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = parseFloat(vitals.height) / 100
      const weightInKg = parseFloat(vitals.weight)
      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
      setVitals({ ...vitals, bmi })
    }
  }

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      setMedications([...medications, { ...newMedication, id: Date.now() }])
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
      setShowAddMedication(false)
      setShowMedicineDropdown(false)
      setMedicineSearchTerm('')
    }
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMedicineDropdown && !event.target.closest('.medicine-dropdown-container')) {
        setShowMedicineDropdown(false)
      }
    }
    
    if (showMedicineDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMedicineDropdown])
  
  // Reset medicine dropdown when modal closes
  useEffect(() => {
    if (!showAddMedication) {
      setShowMedicineDropdown(false)
      setMedicineSearchTerm('')
    }
  }, [showAddMedication])

  const handleRemoveMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id))
  }

  const handleAddInvestigation = () => {
    if (newInvestigation.name) {
      setInvestigations([...investigations, { ...newInvestigation, id: Date.now() }])
      setNewInvestigation({ name: '', notes: '' })
      setShowAddInvestigation(false)
      setShowTestDropdown(false)
      setTestSearchTerm('')
    }
  }
  
  // Close test dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTestDropdown && !event.target.closest('.test-dropdown-container')) {
        setShowTestDropdown(false)
      }
    }
    
    if (showTestDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showTestDropdown])
  
  // Reset test dropdown when modal closes
  useEffect(() => {
    if (!showAddInvestigation) {
      setShowTestDropdown(false)
      setTestSearchTerm('')
    }
  }, [showAddInvestigation])

  const handleRemoveInvestigation = (id) => {
    setInvestigations(investigations.filter((inv) => inv.id !== id))
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }))
    setAttachments([...attachments, ...newAttachments])
  }

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((att) => att.id !== id))
  }

  const generatePDF = (prescriptionData) => {
    const doctorInfo = getDoctorInfo()
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    let patientYPos = yPos
    doc.text(`Name: ${prescriptionData.patientName}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Age: ${selectedConsultation?.age || 'N/A'} years`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Gender: ${selectedConsultation?.gender || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    
    // Add patient phone and address if available
    if (prescriptionData.patientPhone || selectedConsultation?.patientPhone) {
      doc.text(`Phone: ${prescriptionData.patientPhone || selectedConsultation?.patientPhone || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
      patientYPos += 4
    }
    if (prescriptionData.patientAddress || selectedConsultation?.patientAddress) {
      const addressText = prescriptionData.patientAddress || selectedConsultation?.patientAddress || 'N/A'
      const addressLines = doc.splitTextToSize(`Address: ${addressText}`, pageWidth / 2 - margin)
      addressLines.forEach((line, index) => {
        doc.text(line, pageWidth - margin, patientYPos + (index * 4), { align: 'right' })
      })
      patientYPos += (addressLines.length - 1) * 4
    }

    // Set yPos to the maximum of doctor info end or patient info end
    yPos = Math.max(yPos + 12, patientYPos) + 3

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Symptoms Section with Green Bullet Points
    if (prescriptionData.symptoms) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const symptomLines = prescriptionData.symptoms.split('\n').filter(line => line.trim())
      symptomLines.forEach((symptom) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(symptom.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page (with more space check)
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Medication card with light gray background
        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.investigations.forEach((inv) => {
        // Light purple box for each test
        const testBoxHeight = inv.notes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(inv.name, margin + 4, yPos + 2)
        
        if (inv.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(inv.notes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(advice.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    // Calculate space needed for signature - ensure everything fits on one page
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Add digital signature image if available
    if (doctorInfo.digitalSignature && doctorInfo.digitalSignature.trim() !== '') {
      try {
        console.log('Adding signature to PDF:', doctorInfo.digitalSignature.substring(0, 50) + '...')
        
        // Check if it's a base64 data URL
        let imageData = doctorInfo.digitalSignature.trim()
        
        // Determine image format from data URL
        let imageFormat = 'PNG'
        if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
          imageFormat = 'JPEG'
        } else if (imageData.includes('data:image/png')) {
          imageFormat = 'PNG'
        } else if (imageData.includes('data:image/')) {
          // Extract format from data URL
          const match = imageData.match(/data:image\/(\w+);/)
          if (match) {
            imageFormat = match[1].toUpperCase()
          }
        }
        
        // Add signature image above the signature line (width: 50, height: 20)
        // Position it above the line
        doc.addImage(imageData, imageFormat, signatureX, signatureY - 18, 50, 20)
        console.log('Signature added successfully')
      } catch (error) {
        console.error('Error adding signature image to PDF:', error)
        // Fallback to line if image fails
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(signatureX, signatureY, signatureX + 50, signatureY)
      }
    } else {
      console.log('No signature found in doctorInfo')
      // Draw a line for signature if no image
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    }
    
    // Doctor name and designation below signature (centered under signature area)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Save PDF
    const fileName = `Prescription_${prescriptionData.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const handleDownloadPrescription = (prescription) => {
    generatePDF(prescription)
  }

  const handleEditPrescription = (prescription) => {
    // Load prescription data into form
    setDiagnosis(prescription.diagnosis || '')
    setSymptoms(prescription.symptoms || '')
    setMedications(prescription.medications || [])
    setInvestigations(prescription.investigations || [])
    setAdvice(prescription.advice || '')
    setFollowUpDate(prescription.followUpDate || '')
    setVitals(prescription.vitals || {
      bloodPressure: { systolic: '', diastolic: '' },
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: '',
    })
    
    // Set editing mode
    setEditingPrescriptionId(prescription.id)
    
    // Switch to prescription tab
    setActiveTab('prescription')
    
    // Scroll to prescription form
    setTimeout(() => {
      const prescriptionSection = document.querySelector('[data-prescription-section]')
      if (prescriptionSection) {
        prescriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleViewPrescriptionPDF = (prescriptionData) => {
    const doctorInfo = getDoctorInfo()
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const tealColor = [17, 73, 108] // Teal color for header
    const lightBlueColor = [230, 240, 255] // Light blue for diagnosis
    const lightGrayColor = [245, 245, 245] // Light gray for medications
    const lightPurpleColor = [240, 230, 250] // Light purple for tests
    const lightYellowColor = [255, 255, 200] // Light yellow for follow-up
    let yPos = margin

    // Header Section - Clinic Name in Teal (Large, Bold)
    doc.setTextColor(...tealColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(doctorInfo.clinicName || 'Medical Clinic', pageWidth / 2, yPos, { align: 'center' })
    yPos += 7

    // Clinic Address (Centered)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const addressLines = doc.splitTextToSize(doctorInfo.clinicAddress || 'Address not provided', pageWidth - 2 * margin)
    addressLines.forEach((line) => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' })
      yPos += 4
    })

    // Contact Information (Left: Phone, Right: Email)
    yPos += 1
    doc.setFontSize(8)
    const contactY = yPos
    // Phone icon and number (left)
    doc.setFillColor(200, 0, 0) // Red circle for phone
    doc.circle(margin + 2, contactY - 1, 1.5, 'F')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.phone || 'N/A', margin + 6, contactY)
    
    // Email icon and address (right)
    doc.setFillColor(100, 100, 100) // Gray circle for email
    doc.circle(pageWidth - margin - 2, contactY - 1, 1.5, 'F')
    doc.text(doctorInfo.email || 'N/A', pageWidth - margin, contactY, { align: 'right' })
    yPos += 5

    // Teal horizontal line separator
    doc.setDrawColor(...tealColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // Doctor Information (Left) and Patient Information (Right)
    const infoStartY = yPos
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Information', margin, infoStartY)
    doc.text('Patient Information', pageWidth - margin, infoStartY, { align: 'right' })
    
    yPos = infoStartY + 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    
    // Doctor Info (Left)
    doc.text(`Name: ${doctorInfo.name}`, margin, yPos)
    doc.text(`Specialty: ${doctorInfo.specialization || 'General Physician'}`, margin, yPos + 4)
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    doc.text(`Date: ${currentDate}`, margin, yPos + 8)

    // Patient Info (Right)
    let patientYPos = yPos
    doc.text(`Name: ${prescriptionData.patientName}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Age: ${selectedConsultation?.age || 'N/A'} years`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    doc.text(`Gender: ${selectedConsultation?.gender || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
    patientYPos += 4
    
    // Add patient phone and address if available
    if (prescriptionData.patientPhone || selectedConsultation?.patientPhone) {
      doc.text(`Phone: ${prescriptionData.patientPhone || selectedConsultation?.patientPhone || 'N/A'}`, pageWidth - margin, patientYPos, { align: 'right' })
      patientYPos += 4
    }
    if (prescriptionData.patientAddress || selectedConsultation?.patientAddress) {
      const addressText = prescriptionData.patientAddress || selectedConsultation?.patientAddress || 'N/A'
      const addressLines = doc.splitTextToSize(`Address: ${addressText}`, pageWidth / 2 - margin)
      addressLines.forEach((line, index) => {
        doc.text(line, pageWidth - margin, patientYPos + (index * 4), { align: 'right' })
      })
      patientYPos += (addressLines.length - 1) * 4
    }

    // Set yPos to the maximum of doctor info end or patient info end
    yPos = Math.max(yPos + 12, patientYPos) + 3

    // Diagnosis Section with Light Blue Background Box
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis', margin, yPos)
    yPos += 6
    
    // Light blue rounded box for diagnosis
    const diagnosisHeight = 8
    doc.setFillColor(...lightBlueColor)
    doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, diagnosisHeight, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const diagnosisText = prescriptionData.diagnosis || 'N/A'
    doc.text(diagnosisText, margin + 4, yPos + 2)
    yPos += diagnosisHeight + 4

    // Symptoms Section with Green Bullet Points
    if (prescriptionData.symptoms) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Symptoms', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const symptomLines = prescriptionData.symptoms.split('\n').filter(line => line.trim())
      symptomLines.forEach((symptom) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(symptom.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Medications Section with Numbered Cards (Light Gray Background)
    if (prescriptionData.medications && prescriptionData.medications.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medications', margin, yPos)
      yPos += 6
      
      prescriptionData.medications.forEach((med, idx) => {
        // Check if we need a new page (with more space check)
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = margin
        }
        
        // Medication card with light gray background
        const cardHeight = 22
        doc.setFillColor(...lightGrayColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, cardHeight, 2, 2, 'F')
        
        // Numbered square in teal (top-right corner)
        const numberSize = 8
        const numberX = pageWidth - margin - numberSize - 3
        const numberY = yPos - 1
        doc.setFillColor(...tealColor)
        doc.roundedRect(numberX, numberY, numberSize, numberSize, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(`${idx + 1}`, numberX + numberSize / 2, numberY + numberSize / 2 + 1, { align: 'center' })
        
        // Medication name (bold, top)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(med.name, margin + 4, yPos + 3)
        
        // Medication details in 2 columns (left and right)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const leftColX = margin + 4
        const rightColX = margin + (pageWidth - 2 * margin) / 2 + 5
        const startY = yPos + 7
        
        // Left column
        doc.text(`Dosage: ${med.dosage}`, leftColX, startY)
        doc.text(`Duration: ${med.duration || 'N/A'}`, leftColX, startY + 4)
        
        // Right column
        doc.text(`Frequency: ${med.frequency}`, rightColX, startY)
        if (med.instructions) {
          doc.text(`Instructions: ${med.instructions}`, rightColX, startY + 4)
        }
        
        yPos += cardHeight + 4
      })
      yPos += 2
    }

    // Recommended Tests Section (Light Purple Boxes)
    if (prescriptionData.investigations && prescriptionData.investigations.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Recommended Tests', margin, yPos)
      yPos += 6
      
      prescriptionData.investigations.forEach((inv) => {
        // Light purple box for each test
        const testBoxHeight = inv.notes ? 14 : 9
        doc.setFillColor(...lightPurpleColor)
        doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, testBoxHeight, 2, 2, 'F')
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(inv.name, margin + 4, yPos + 2)
        
        if (inv.notes) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(80, 80, 80)
          doc.text(inv.notes, margin + 4, yPos + 8)
        }
        
        yPos += testBoxHeight + 3
      })
      yPos += 2
    }

    // Medical Advice Section with Green Bullet Points
    if (prescriptionData.advice) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Advice', margin, yPos)
      yPos += 6
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const adviceLines = prescriptionData.advice.split('\n').filter(line => line.trim())
      adviceLines.forEach((advice) => {
        // Green bullet point
        doc.setFillColor(34, 197, 94) // Green color
        doc.circle(margin + 1.5, yPos - 1, 1.2, 'F')
        doc.setTextColor(0, 0, 0)
        doc.text(advice.trim(), margin + 5, yPos)
        yPos += 4
      })
      yPos += 2
    }

    // Follow-up Appointment (Light Yellow Box)
    if (prescriptionData.followUpDate) {
      const followUpHeight = 12
      doc.setFillColor(...lightYellowColor)
      doc.roundedRect(margin, yPos - 3, pageWidth - 2 * margin, followUpHeight, 2, 2, 'F')
      
      // Calendar icon (small square)
      doc.setFillColor(255, 200, 0)
      doc.roundedRect(margin + 2, yPos + 1, 3, 3, 0.5, 0.5, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Follow-up Appointment', margin + 7, yPos + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const followUpDate = new Date(prescriptionData.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      doc.text(followUpDate, margin + 7, yPos + 8)
      yPos += followUpHeight + 5
    }

    // Footer with Doctor Signature (Right side)
    const signatureSpace = 30
    const minYPos = pageHeight - signatureSpace - 5
    if (yPos < minYPos) {
      yPos = minYPos
    }

    // Doctor Signature (Right side)
    const signatureX = pageWidth - margin - 55
    const signatureY = yPos
    
    // Add digital signature image if available
    if (doctorInfo.digitalSignature && doctorInfo.digitalSignature.trim() !== '') {
      try {
        let imageData = doctorInfo.digitalSignature.trim()
        let imageFormat = 'PNG'
        if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
          imageFormat = 'JPEG'
        } else if (imageData.includes('data:image/png')) {
          imageFormat = 'PNG'
        } else if (imageData.includes('data:image/')) {
          const match = imageData.match(/data:image\/(\w+);/)
          if (match) {
            imageFormat = match[1].toUpperCase()
          }
        }
        doc.addImage(imageData, imageFormat, signatureX, signatureY - 18, 50, 20)
      } catch (error) {
        console.error('Error adding signature image to PDF:', error)
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.line(signatureX, signatureY, signatureX + 50, signatureY)
      }
    } else {
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(signatureX, signatureY, signatureX + 50, signatureY)
    }
    
    // Doctor name and designation below signature
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(doctorInfo.name, signatureX + 25, signatureY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(doctorInfo.specialization || 'General Physician', signatureX + 25, signatureY + 12, { align: 'center' })

    // Disclaimer at bottom center
    const disclaimerY = pageHeight - 6
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text('This is a digitally generated prescription. For any queries, please contact the clinic.', pageWidth / 2, disclaimerY, { align: 'center' })

    // Open PDF in new window for viewing
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
    }, 1000)
  }

  const handleSavePrescription = async () => {
    if (!diagnosis) {
      toast.warning('Please enter a diagnosis')
      return
    }

    if (medications.length === 0) {
      toast.warning('Please add at least one medication')
      return
    }

    const prescriptionData = {
      id: editingPrescriptionId || Date.now().toString(),
      consultationId: selectedConsultation.id,
      patientId: selectedConsultation.patientId,
      patientName: selectedConsultation.patientName,
      patientImage: selectedConsultation.patientImage,
      patientPhone: selectedConsultation.patientPhone,
      patientEmail: selectedConsultation.patientEmail,
      patientAddress: selectedConsultation.patientAddress,
      diagnosis,
      symptoms,
      vitals,
      medications: [...medications],
      investigations: [...investigations],
      advice,
      followUpDate,
      date: new Date().toISOString(),
      savedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      updatedAt: editingPrescriptionId ? new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : undefined,
    }

    // Update or add prescription
    if (editingPrescriptionId) {
      // Update existing prescription
      setSavedPrescriptions((prev) =>
        prev.map((presc) =>
          presc.id === editingPrescriptionId ? prescriptionData : presc
        )
      )
      
      // Update prescription via API
      try {
        // Prescription is saved as part of consultation update
        // The updateConsultation API will handle prescription data
        toast.success('Prescription updated successfully!')
      } catch (error) {
        console.error('Error updating prescription:', error)
        toast.error('Failed to update prescription')
      }
    } else {
      // Create new prescription via API
      try {
        const prescriptionResponse = await createPrescription({
          ...prescriptionData,
          consultationId: selectedConsultation?.id,
          patientId: selectedConsultation?.patientId,
        })
        
        if (prescriptionResponse.success) {
          setSavedPrescriptions((prev) => [prescriptionResponse.data, ...prev])
          toast.success('Prescription saved successfully!')
        }
      } catch (error) {
        console.error('Error creating prescription:', error)
        toast.error('Failed to save prescription')
      }
    }
    
    // Update consultation status in both consultations list and selectedConsultation
    const updatedConsultation = {
      ...selectedConsultation,
      status: 'completed',
      diagnosis,
      vitals,
      medications,
      investigations,
      advice,
    }
    
    setConsultations((prev) =>
      prev.map((cons) =>
        cons.id === selectedConsultation.id ? updatedConsultation : cons
      )
    )
    
    // Also update selectedConsultation state
    setSelectedConsultation(updatedConsultation)

    // Reset form and editing state
    setDiagnosis('')
    setSymptoms('')
    setMedications([])
    setInvestigations([])
    setAdvice('')
    setFollowUpDate('')
    setVitals({
      bloodPressure: { systolic: '', diastolic: '' },
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: '',
    })
    setEditingPrescriptionId(null)

    console.log('Prescription saved:', prescriptionData)
    
    // Switch to saved prescriptions tab
    setActiveTab('saved')
  }

  // Get filter label
  const getFilterLabel = () => {
    switch (filterParam) {
      case 'today':
        return 'Today\'s Appointments'
      case 'pending':
        return 'Pending Consultations'
      case 'all':
      default:
        return 'All Consultations'
    }
  }

  return (
    <>
      <DoctorNavbar />
      <section className={`flex flex-col gap-4 pb-24 ${isDashboardPage ? '-mt-20' : ''}`}>
        {/* Filter Header */}
        {filterParam !== 'all' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{getFilterLabel()}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredConsultations.length} {filteredConsultations.length === 1 ? 'consultation' : 'consultations'} found
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.history.pushState({}, '', '/doctor/consultations')}
                className="text-sm font-medium text-[#11496c] hover:text-[#0d3a52]"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {/* Consultations List View - Only show if patient was called */}
        {!selectedConsultation && filteredConsultations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              {filterParam !== 'all' ? getFilterLabel() : 'Active Consultations'}
            </h2>
            <div className="space-y-3">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={async () => {
                    // Refresh consultation data from API to get latest patient info
                    try {
                      const response = await getConsultationById(consultation.id)
                      if (response.success && response.data) {
                        const refreshedConsultation = transformConsultationData(response.data)
                        setSelectedConsultation(refreshedConsultation)
                      } else {
                        setSelectedConsultation(consultation)
                      }
                    } catch (error) {
                      console.error('Error refreshing consultation:', error)
                      setSelectedConsultation(consultation)
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-[#11496c]/30 active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={consultation.patientImage}
                      alt={consultation.patientName}
                      className="h-12 w-12 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900">{consultation.patientName}</h3>
                          <p className="mt-1 text-sm text-slate-600">{consultation.reason}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          consultation.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : consultation.status === 'waiting' || consultation.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : consultation.status === 'in-progress' || consultation.status === 'called'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {consultation.status === 'in-progress' ? 'IN-PROGRESS' : 
                           consultation.status === 'called' ? 'IN-PROGRESS' :
                           consultation.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <IoTimeOutline className="h-4 w-4" />
                          <span>{formatDateTime(consultation.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{consultation.age} years • {consultation.gender}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Consultations Message - Only show when no patient was called and not viewing from all consultations */}
        {!selectedConsultation && filteredConsultations.length === 0 && !location.state?.loadSavedData && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <IoPersonOutline className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Patient Selected</h3>
            <p className="mt-2 text-sm text-slate-600">
              Please call a patient from the queue to start consultation.
            </p>
            <button
              type="button"
              onClick={() => navigate('/doctor/patients')}
              className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3a52] active:scale-95"
            >
              <IoArrowBackOutline className="h-4 w-4" />
              Go to Patient Queue
            </button>
          </div>
        )}

        {/* Consultation Detail View */}
          {selectedConsultation ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                {/* Left Column - Patient Info & History */}
                <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                  {/* Patient Card */}
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                      <img
                        src={selectedConsultation.patientImage}
                        alt={selectedConsultation.patientName}
                        className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">{selectedConsultation.patientName}</h3>
                      <div className="mt-1 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-600">
                        <p>
                          {selectedConsultation.age !== null && selectedConsultation.age !== undefined 
                            ? `${selectedConsultation.age} years` 
                            : 'Age not available'} • {selectedConsultation.gender ? selectedConsultation.gender.charAt(0).toUpperCase() + selectedConsultation.gender.slice(1) : 'N/A'}
                        </p>
                        <p className="flex items-center gap-1">
                          <IoTimeOutline className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span className="truncate text-[10px] sm:text-xs">
                            {selectedConsultation.appointmentDate 
                              ? formatDate(selectedConsultation.appointmentDate) 
                              : formatDateTime(selectedConsultation.appointmentTime)}
                          </span>
                        </p>
                      </div>
                      <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm font-medium text-slate-700 line-clamp-2">{selectedConsultation.reason}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Consultation Form */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {/* Tabs */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch] pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vitals')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'vitals'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'vitals' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    Vitals & Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prescription')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'prescription'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'prescription' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'history'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'history' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('saved')}
                    className={`shrink-0 rounded-lg sm:rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                      activeTab === 'saved'
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-slate-600 shadow-md shadow-slate-200/50 hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-200/80'
                    }`}
                    style={activeTab === 'saved' ? { backgroundColor: '#11496c', boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.2)' } : {}}
                  >
                    Saved
                  </button>
                </div>

                {/* Vitals & Examination Tab */}
                {activeTab === 'vitals' && (
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-4 shadow-md shadow-slate-200/50">
                    <h3 className="mb-3 sm:mb-4 lg:mb-3 text-sm sm:text-base lg:text-base font-bold text-slate-900">Vitals & Examination</h3>
                    <div className="grid gap-2.5 sm:gap-3 lg:gap-3 sm:grid-cols-2">
                      {/* Blood Pressure */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoHeartOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-red-600 shrink-0" />
                          Blood Pressure
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.bloodPressure.systolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bloodPressure: { ...vitals.bloodPressure, systolic: e.target.value },
                              })
                            }
                            placeholder="Systolic"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-xs sm:text-sm lg:text-xs text-slate-500">/</span>
                          <input
                            type="number"
                            value={vitals.bloodPressure.diastolic}
                            onChange={(e) =>
                              setVitals({
                                ...vitals,
                                bloodPressure: { ...vitals.bloodPressure, diastolic: e.target.value },
                              })
                            }
                            placeholder="Diastolic"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">mmHg</span>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoThermometerOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-orange-600 shrink-0" />
                          Temperature
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.temperature}
                            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                            placeholder="98.6"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">°F</span>
                        </div>
                      </div>

                      {/* Pulse */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-red-50/50 to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoPulseOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-red-600 shrink-0" />
                          Pulse Rate
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.pulse}
                            onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                            placeholder="72"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">bpm</span>
                        </div>
                      </div>

                      {/* Respiratory Rate */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-[#11496c] shrink-0" />
                          Respiratory Rate
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.respiratoryRate}
                            onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                            placeholder="16"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">/min</span>
                        </div>
                      </div>

                      {/* Oxygen Saturation */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-slate-50/80 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoWaterOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-[#11496c] shrink-0" />
                          SpO2
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.oxygenSaturation}
                            onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                            placeholder="98"
                            max="100"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">%</span>
                        </div>
                      </div>

                      {/* Weight */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
                          Weight
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.weight || ''}
                            onChange={(e) => {
                              const weightValue = e.target.value
                              setVitals((prev) => {
                                const updated = { ...prev, weight: weightValue }
                                if (updated.height && weightValue) {
                                  setTimeout(() => {
                                    const heightInMeters = parseFloat(updated.height) / 100
                                    const weightInKg = parseFloat(weightValue)
                                    if (heightInMeters > 0 && weightInKg > 0) {
                                      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
                                      setVitals((prevVitals) => ({ ...prevVitals, bmi }))
                                    }
                                  }, 100)
                                }
                                return updated
                              })
                            }}
                            placeholder="70"
                            min="0"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">kg</span>
                        </div>
                      </div>

                      {/* Height */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
                          Height
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="number"
                            value={vitals.height || ''}
                            onChange={(e) => {
                              const heightValue = e.target.value
                              setVitals((prev) => {
                                const updated = { ...prev, height: heightValue }
                                if (updated.weight && heightValue) {
                                  setTimeout(() => {
                                    const heightInMeters = parseFloat(heightValue) / 100
                                    const weightInKg = parseFloat(updated.weight)
                                    if (heightInMeters > 0 && weightInKg > 0) {
                                      const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
                                      setVitals((prevVitals) => ({ ...prevVitals, bmi }))
                                    }
                                  }, 100)
                                }
                                return updated
                              })
                            }}
                            placeholder="170"
                            min="0"
                            step="0.1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 lg:px-2 py-1.5 sm:py-2 lg:py-1.5 text-xs sm:text-sm lg:text-xs text-slate-900 focus:outline-none focus:ring-2"
                          />
                          <span className="text-[10px] sm:text-xs lg:text-[10px] text-slate-500">cm</span>
                        </div>
                      </div>

                      {/* BMI */}
                      <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-2.5 sm:p-3 lg:p-2.5 hover:shadow-md transition-shadow">
                        <label className="mb-1.5 sm:mb-2 lg:mb-1.5 flex items-center gap-1.5 sm:gap-2 lg:gap-1.5 text-xs sm:text-sm lg:text-xs font-semibold text-slate-900">
                          <IoBodyOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 text-slate-600 shrink-0" />
                          BMI
                        </label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <input
                            type="text"
                            value={vitals.bmi || ''}
                            readOnly
                            placeholder="Auto calculated"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add Vitals Button */}
                    <div className="mt-4 sm:mt-5">
                      <button
                        type="button"
                        onClick={() => {
                          // Save vitals to patient history
                          if (selectedConsultation && patientHistory) {
                            try {
                            const vitalsData = {
                              ...vitals,
                              date: new Date().toISOString(),
                              recordedAt: new Date().toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                            }
                            
                            // Vitals are saved as part of consultation update via API
                            // Patient history is managed by backend
                            toast.success('Vitals saved successfully!')
                              
                              // Reset vitals form
                              setVitals({
                                bloodPressure: { systolic: '', diastolic: '' },
                                temperature: '',
                                pulse: '',
                                respiratoryRate: '',
                                oxygenSaturation: '',
                                weight: '',
                                height: '',
                                bmi: '',
                              })
                            } catch (error) {
                              console.error('Error saving vitals to history:', error)
                              toast.error('Error saving vitals. Please try again.')
                            }
                          } else {
                            toast.warning('Please select a patient first')
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                      >
                        <IoAddOutline className="h-5 w-5" />
                        Add to Patient History
                      </button>
                    </div>
                  </div>
                )}

                {/* Prescription Tab */}
                {activeTab === 'prescription' && (
                  <div className="space-y-3 sm:space-y-4 lg:space-y-4" data-prescription-section>
                    {/* Shared Lab Reports from Patient */}
                    {sharedLabReports && sharedLabReports.length > 0 && (
                      <div className="rounded-xl sm:rounded-2xl border-2 border-blue-200 bg-blue-50 p-3 sm:p-4 lg:p-4 shadow-md mb-4">
                        <div className="mb-3 sm:mb-4 flex items-center gap-2">
                          <IoFlaskOutline className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
                          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-900">
                            Shared Lab Reports from Patient
                          </h3>
                        </div>
                        <p className="mb-4 text-xs sm:text-sm text-blue-800">
                          Patient has shared {sharedLabReports.length} lab report(s) with you
                        </p>
                        <div className="space-y-3 sm:space-y-4">
                          {sharedLabReports.map((report, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-blue-300 bg-white p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition"
                              onClick={() => {
                                // Try to view PDF first, if not available show modal
                                const pdfUrl = report.pdfFileUrl || report.downloadUrl || report.reportFileUrl
                                if (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '' && pdfUrl !== 'undefined' && pdfUrl !== 'null') {
                                  window.open(pdfUrl, '_blank')
                                } else {
                                  setSelectedReport(report)
                                  setShowReportViewer(true)
                                }
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm sm:text-base font-bold text-slate-900">
                                    {report.testName || report.reportName || 'Lab Report'}
                                  </p>
                                  {report.labName && (
                                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                      {report.labName}
                                    </p>
                                  )}
                                  {report.date && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      Report Date: {formatDate(report.date)}
                                    </p>
                                  )}
                                  {report.sharedAt && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Shared: {formatDate(report.sharedAt)}
                                    </p>
                                  )}
                                  {report.status && (
                                    <span
                                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        report.status === 'Normal' || report.status === 'ready'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {report.status}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewLabReport(report)
                                    }}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100"
                                    title="View Report"
                                  >
                                    <IoEyeOutline className="h-4 w-4" />
                                  </button>
                                  {(report.pdfFileUrl || (report.downloadUrl && report.downloadUrl !== '#')) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadLabReport(report)
                                      }}
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#11496c] transition hover:bg-[rgba(17,73,108,0.1)]"
                                      title="Download Report"
                                    >
                                      <IoDownloadOutline className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shared Prescriptions from Other Doctors */}
                    {selectedConsultation?.sharedPrescriptions && selectedConsultation.sharedPrescriptions.length > 0 && (
                      <div className="rounded-xl sm:rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 sm:p-4 lg:p-4 shadow-md">
                        <div className="mb-3 sm:mb-4 flex items-center gap-2">
                          <IoDocumentTextOutline className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
                          <h3 className="text-sm sm:text-base lg:text-lg font-bold text-amber-900">
                            Shared Prescriptions from Other Doctors
                          </h3>
                        </div>
                        <p className="mb-4 text-xs sm:text-sm text-amber-800">
                          Patient has shared {selectedConsultation.sharedPrescriptions.length} prescription(s) from previous consultations
                        </p>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedConsultation.sharedPrescriptions.map((sharedPresc, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-amber-300 bg-white p-3 sm:p-4 shadow-sm"
                            >
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm sm:text-base font-bold text-slate-900">
                                    {sharedPresc.doctor?.name || 'Previous Doctor'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-slate-600">
                                    {sharedPresc.doctor?.specialty || 'General'} • {sharedPresc.diagnosis || 'Consultation'}
                                  </p>
                                  {sharedPresc.issuedAt && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      Issued: {new Date(sharedPresc.issuedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {sharedPresc.diagnosis && (
                                <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 p-2">
                                  <p className="text-xs font-semibold text-blue-900 mb-1">Diagnosis</p>
                                  <p className="text-xs sm:text-sm text-blue-800">{sharedPresc.diagnosis}</p>
                                </div>
                              )}
                              
                              {sharedPresc.medications && sharedPresc.medications.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-slate-700 mb-2">Medications ({sharedPresc.medications.length})</p>
                                  <div className="space-y-2">
                                    {sharedPresc.medications.map((med, medIdx) => (
                                      <div key={medIdx} className="rounded border border-slate-200 bg-slate-50 p-2">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900">{med.name}</p>
                                        <div className="text-xs text-slate-600 mt-1">
                                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                                          {med.frequency && <span className="ml-2">Frequency: {med.frequency}</span>}
                                          {med.duration && <span className="ml-2">Duration: {med.duration}</span>}
                                        </div>
                                        {med.instructions && (
                                          <p className="text-xs text-slate-500 mt-1">{med.instructions}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {sharedPresc.investigations && sharedPresc.investigations.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-slate-700 mb-2">Investigations ({sharedPresc.investigations.length})</p>
                                  <div className="space-y-1">
                                    {sharedPresc.investigations.map((inv, invIdx) => (
                                      <div key={invIdx} className="rounded border border-purple-200 bg-purple-50 p-2">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900">{inv.name}</p>
                                        {inv.notes && <p className="text-xs text-slate-600 mt-1">{inv.notes}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {sharedPresc.advice && (
                                <div className="rounded-lg bg-green-50 border border-green-200 p-2">
                                  <p className="text-xs font-semibold text-green-900 mb-1">Advice</p>
                                  <p className="text-xs sm:text-sm text-green-800">{sharedPresc.advice}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Prescription Header */}
                    <div className="rounded-xl sm:rounded-2xl border-2 border-[#11496c] bg-gradient-to-br from-[rgba(17,73,108,0.05)] to-white p-4 sm:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-4 border-b-2 border-[#11496c] pb-3">
                        <h2 className="text-lg sm:text-xl font-bold text-[#11496c] text-center">PRESCRIPTION</h2>
                        <p className="text-xs sm:text-sm text-slate-600 text-center mt-1">{doctorInfo.clinicName}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Patient Information */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Patient Information</h3>
                          <div className="space-y-1 text-[10px] sm:text-xs text-slate-700">
                            <p><span className="font-semibold">Name:</span> {selectedConsultation.patientName || 'N/A'}</p>
                            <p>
                              <span className="font-semibold">Age:</span> {selectedConsultation.age !== null && selectedConsultation.age !== undefined ? `${selectedConsultation.age} years` : 'N/A'} | <span className="font-semibold">Gender:</span> {selectedConsultation.gender ? selectedConsultation.gender.charAt(0).toUpperCase() + selectedConsultation.gender.slice(1) : 'N/A'}
                            </p>
                            {selectedConsultation.patientPhone ? (
                              <p><span className="font-semibold">Phone:</span> {selectedConsultation.patientPhone}</p>
                            ) : (
                              <p><span className="font-semibold">Phone:</span> Not provided</p>
                            )}
                            {selectedConsultation.patientEmail ? (
                              <p><span className="font-semibold">Email:</span> {selectedConsultation.patientEmail}</p>
                            ) : (
                              <p><span className="font-semibold">Email:</span> Not provided</p>
                            )}
                            {selectedConsultation.patientAddress ? (
                              <p><span className="font-semibold">Address:</span> {selectedConsultation.patientAddress}</p>
                            ) : (
                              <p><span className="font-semibold">Address:</span> Not provided</p>
                            )}
                          </div>
                        </div>

                        {/* Doctor Information */}
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">Doctor Information</h3>
                          <div className="space-y-1 text-[10px] sm:text-xs text-slate-700">
                            <p className="font-semibold">{doctorInfo.name}</p>
                            <p>{doctorInfo.qualification}</p>
                            <p>{doctorInfo.clinicName}</p>
                            {doctorInfo.phone && (
                              <p><span className="font-semibold">Phone:</span> {doctorInfo.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-[10px] sm:text-xs text-slate-600">
                          <span className="font-semibold">Date:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Diagnosis *</label>
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 sm:p-4">
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Enter diagnosis..."
                          className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Symptoms</label>
                      <div className="space-y-2">
                        {symptoms.split('\n').filter(line => line.trim()).map((symptom, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
                            <span className="text-xs sm:text-sm text-slate-700">{symptom.trim()}</span>
                          </div>
                        ))}
                        <textarea
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Enter symptoms (one per line)...&#10;Example:&#10;High fever (102°F)&#10;Headache&#10;Body ache"
                          rows="4"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Medications *</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddMedication(true)}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95 w-full sm:w-auto"
                        >
                          <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add </span>Medication
                        </button>
                      </div>

                      {medications.length === 0 ? (
                        <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No medications added</p>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {medications.map((med, idx) => (
                            <div
                              key={med.id}
                              className="relative rounded-lg sm:rounded-xl border border-slate-200 bg-gray-50 p-3 sm:p-4 hover:shadow-md transition-shadow"
                            >
                              {/* Numbered badge in top-right corner */}
                              <div className="absolute top-2 right-2 h-6 w-6 sm:h-7 sm:w-7 rounded bg-[#11496c] flex items-center justify-center">
                                <span className="text-white text-xs sm:text-sm font-bold">{idx + 1}</span>
                              </div>
                              <div className="pr-8 sm:pr-10">
                                <p className="text-sm sm:text-base font-bold text-slate-900 mb-2">{med.name}</p>
                                <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                                  <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>
                                  <p><span className="font-semibold">Duration:</span> {med.duration || 'N/A'}</p>
                                  <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>
                                  {med.instructions && (
                                    <p><span className="font-semibold">Instructions:</span> {med.instructions}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedication(med.id)}
                                className="absolute bottom-2 right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              >
                                <IoTrashOutline className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Investigations */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Investigations / Tests</h3>
                        <button
                          type="button"
                          onClick={() => setShowAddInvestigation(true)}
                          className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 w-full sm:w-auto"
                        >
                          <IoAddOutline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add </span>Test
                        </button>
                      </div>

                      {investigations.length === 0 ? (
                        <p className="py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-500">No investigations added</p>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {investigations.map((inv) => (
                            <div
                              key={inv.id}
                              className="relative rounded-lg sm:rounded-xl border border-purple-200 bg-purple-50 p-3 sm:p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1 min-w-0 pr-8">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 mb-1">{inv.name}</p>
                                {inv.notes && <p className="text-xs text-slate-700">{inv.notes}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvestigation(inv.id)}
                                className="absolute top-2 right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              >
                                <IoTrashOutline className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advice */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Medical Advice</label>
                      <div className="space-y-2 mb-3">
                        {advice.split('\n').filter(line => line.trim()).map((adv, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 shrink-0"></div>
                            <span className="text-xs sm:text-sm text-slate-700">{adv.trim()}</span>
                          </div>
                        ))}
                      </div>
                      <textarea
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        placeholder="Enter medical advice (one per line)...&#10;Example:&#10;Take adequate rest for 3-5 days&#10;Drink plenty of fluids&#10;Avoid cold foods"
                        rows="4"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Follow-up Appointment */}
                    <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 lg:p-6 shadow-md shadow-slate-200/50">
                      <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">Follow-up Appointment (Optional)</label>
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 w-4 rounded bg-yellow-400 flex items-center justify-center shrink-0">
                            <IoCalendarOutline className="h-3 w-3 text-yellow-900" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900">Follow-up Appointment</span>
                        </div>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-semibold text-slate-900"
                        />
                        {followUpDate && (
                          <p className="text-xs sm:text-sm text-slate-700 mt-1">
                            {new Date(followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Prescription Footer */}
                    <div className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 shadow-md shadow-slate-200/50">
                      <div className="border-t-2 border-slate-200 pt-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                          {/* Doctor Details */}
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{doctorInfo.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-700">{doctorInfo.qualification}</p>
                            <p className="text-[10px] sm:text-xs text-slate-700">{doctorInfo.clinicName}</p>
                            <p className="text-[10px] sm:text-xs text-slate-600">License: {doctorInfo.licenseNumber}</p>
                          </div>

                          {/* Digital Signature */}
                          <div className="flex flex-col items-end">
                            {doctorInfo.digitalSignature && doctorInfo.digitalSignature.trim() !== '' ? (
                              <div className="mb-2">
                                <img
                                  src={doctorInfo.digitalSignature}
                                  alt="Doctor Signature"
                                  className="h-12 w-32 sm:h-16 sm:w-40 object-contain border border-slate-200 rounded bg-white p-1"
                                  onError={(e) => {
                                    // Silently handle error - hide image and show placeholder
                                    e.target.style.display = 'none'
                                    // Show placeholder instead
                                    const placeholder = e.target.nextElementSibling
                                    if (placeholder && placeholder.classList.contains('signature-placeholder')) {
                                      placeholder.style.display = 'flex'
                                    }
                                  }}
                                />
                                <div className="signature-placeholder h-12 w-32 sm:h-16 sm:w-40 border-2 border-dashed border-slate-300 rounded bg-slate-50 items-center justify-center mb-2 hidden">
                                  <p className="text-[8px] sm:text-[10px] text-slate-400 text-center px-1">No Signature</p>
                                </div>
                              </div>
                            ) : (
                              <div className="h-12 w-32 sm:h-16 sm:w-40 border-2 border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center mb-2">
                                <p className="text-[8px] sm:text-[10px] text-slate-400 text-center px-1">No Signature</p>
                              </div>
                            )}
                            <p className="text-[10px] sm:text-xs text-slate-600">Digital Signature</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleSavePrescription}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#11496c] px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] active:scale-95"
                      >
                        <IoCheckmarkCircleOutline className="h-5 w-5" />
                        Save Prescription
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tempPrescription = {
                            patientName: selectedConsultation.patientName,
                            patientPhone: selectedConsultation.patientPhone,
                            patientAddress: selectedConsultation.patientAddress,
                            diagnosis,
                            symptoms,
                            medications,
                            investigations,
                            advice,
                            followUpDate,
                          }
                          generatePDF(tempPrescription)
                        }}
                        disabled={!diagnosis || medications.length === 0}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#11496c] bg-white px-6 py-3.5 text-sm font-semibold text-[#11496c] shadow-sm transition hover:bg-[rgba(17,73,108,0.05)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IoPrintOutline className="h-5 w-5" />
                        <span className="hidden sm:inline">Generate </span>PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Saved Prescriptions Tab */}
                {activeTab === 'saved' && (
                  <div className="space-y-4 lg:space-y-3">
                    {viewingPrescription ? (
                      /* Full Page View Prescription */
                      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-4 py-4 lg:py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setViewingPrescription(null)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                            >
                              <IoArrowBackOutline className="h-5 w-5" />
                            </button>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Prescription Details</h2>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                          {/* Patient Info */}
                          <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                            <div className="h-14 w-14 rounded-lg bg-[#11496c] flex items-center justify-center shrink-0 shadow-sm">
                              <span className="text-white text-lg font-bold">
                                {viewingPrescription.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#11496c]">{viewingPrescription.patientName}</h3>
                              <p className="text-sm text-slate-600">Saved on {viewingPrescription.savedAt}</p>
                            </div>
                          </div>

                          {/* Diagnosis */}
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Diagnosis</p>
                            <p className="text-base font-semibold text-slate-900">{viewingPrescription.diagnosis}</p>
                          </div>

                          {/* Symptoms */}
                          {viewingPrescription.symptoms && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Symptoms</p>
                              <div className="space-y-1">
                                {viewingPrescription.symptoms.split('\n').filter(line => line.trim()).map((symptom, idx) => (
                                  <p key={idx} className="text-sm text-slate-700">• {symptom.trim()}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medications */}
                          {viewingPrescription.medications && viewingPrescription.medications.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                                Medications ({viewingPrescription.medications.length})
                              </p>
                              <div className="space-y-2">
                                {viewingPrescription.medications.map((med, idx) => (
                                  <div key={idx} className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                    <p className="text-sm font-semibold text-emerald-900">{med.name}</p>
                                    <p className="text-xs text-emerald-700 mt-1">
                                      Dosage: {med.dosage} • Frequency: {med.frequency}
                                      {med.duration && ` • Duration: ${med.duration}`}
                                    </p>
                                    {med.instructions && (
                                      <p className="text-xs text-emerald-600 mt-1">Instructions: {med.instructions}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Investigations */}
                          {viewingPrescription.investigations && viewingPrescription.investigations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                                Recommended Tests ({viewingPrescription.investigations.length})
                              </p>
                              <div className="space-y-2">
                                {viewingPrescription.investigations.map((inv, idx) => (
                                  <div key={idx} className="rounded-lg bg-[rgba(17,73,108,0.1)] border border-[rgba(17,73,108,0.2)] p-3">
                                    <p className="text-sm font-semibold text-[#0a2d3f]">{inv.name}</p>
                                    {inv.notes && (
                                      <p className="text-xs text-[#11496c] mt-1">{inv.notes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Advice */}
                          {viewingPrescription.advice && (
                            <div>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Medical Advice</p>
                              <div className="space-y-1">
                                {viewingPrescription.advice.split('\n').filter(line => line.trim()).map((advice, idx) => (
                                  <p key={idx} className="text-sm text-slate-700">• {advice.trim()}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up */}
                          {viewingPrescription.followUpDate && (
                            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Follow-up Appointment</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {new Date(viewingPrescription.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white p-4 sm:p-6">
                          <button
                            type="button"
                            onClick={() => setViewingPrescription(null)}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDownloadPrescription(viewingPrescription)
                            }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52]"
                          >
                            <IoDownloadOutline className="h-5 w-5" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Saved Prescriptions List */
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
                        {/* Filter prescriptions for current patient only */}
                        {(() => {
                          const filteredPrescriptions = selectedConsultation 
                            ? savedPrescriptions.filter((prescription) => 
                                prescription.patientId === selectedConsultation.patientId
                              )
                            : []
                          
                          return (
                            <>
                              <div className="mb-5 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Saved Prescriptions</h3>
                                <span className="rounded-full bg-[rgba(17,73,108,0.15)] px-3 py-1 text-xs font-semibold text-[#11496c]">
                                  {filteredPrescriptions.length} {filteredPrescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
                                </span>
                              </div>

                              {!selectedConsultation ? (
                                <div className="py-12 text-center">
                                  <IoPersonOutline className="mx-auto h-16 w-16 text-slate-300" />
                                  <p className="mt-4 text-sm font-medium text-slate-600">Please select a patient</p>
                                  <p className="mt-1 text-xs text-slate-500">Select a patient to view their saved prescriptions</p>
                                </div>
                              ) : filteredPrescriptions.length === 0 ? (
                                <div className="py-12 text-center">
                                  <IoDocumentTextOutline className="mx-auto h-16 w-16 text-slate-300" />
                                  <p className="mt-4 text-sm font-medium text-slate-600">No saved prescriptions for {selectedConsultation.patientName}</p>
                                  <p className="mt-1 text-xs text-slate-500">Prescriptions you save for this patient will appear here</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {filteredPrescriptions.map((prescription) => (
                            <div
                              key={prescription.id}
                              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-[#11496c]/30 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                {/* Patient Avatar */}
                                <img
                                  src={prescription.patientImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.patientName)}&background=11496c&color=fff&size=160&bold=true`}
                                  alt={prescription.patientName}
                                  className="h-10 w-10 rounded-lg object-cover ring-2 ring-slate-100 shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(prescription.patientName)}&background=11496c&color=fff&size=160&bold=true`
                                  }}
                                />

                                {/* Patient Name */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-bold text-slate-900 truncate">
                                    {prescription.patientName}
                                  </h4>
                                </div>
                              </div>

                              {/* Diagnosis */}
                              {prescription.diagnosis && (
                                <p className="text-sm text-slate-900 mb-2 line-clamp-1">
                                  {prescription.diagnosis}
                                </p>
                              )}

                              {/* Additional Information */}
                              <div className="flex flex-wrap items-center gap-2.5 mb-3 text-xs text-slate-600">
                                {prescription.savedAt && (
                                  <div className="flex items-center gap-1">
                                    <IoTimeOutline className="h-3.5 w-3.5 text-slate-500" />
                                    <span>{prescription.savedAt}</span>
                                  </div>
                                )}
                                {prescription.medications && prescription.medications.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <IoMedicalOutline className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="font-medium text-emerald-700">
                                      {prescription.medications.length} {prescription.medications.length === 1 ? 'Medication' : 'Medications'}
                                    </span>
                                  </div>
                                )}
                                {prescription.investigations && prescription.investigations.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <IoFlaskOutline className="h-3.5 w-3.5 text-purple-600" />
                                    <span className="font-medium text-purple-700">
                                      {prescription.investigations.length} {prescription.investigations.length === 1 ? 'Test' : 'Tests'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPrescription(prescription)}
                                  className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 bg-white text-[#11496c] shadow-sm transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                                  title="Download Prescription PDF"
                                >
                                  <IoDownloadOutline className="h-4 w-4" />
                                  <span className="text-xs font-semibold">Download</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditPrescription(prescription)}
                                  className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-[#11496c] text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition-all hover:bg-[#0d3a52] hover:shadow-md active:scale-95"
                                  title="Edit Prescription"
                                >
                                  <IoCreateOutline className="h-4 w-4" />
                                  <span className="text-xs font-semibold">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleViewPrescriptionPDF(prescription)}
                                  className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 bg-white text-[#11496c] shadow-sm transition-all hover:border-[#11496c] hover:bg-[rgba(17,73,108,0.05)] active:scale-95"
                                  title="View Prescription PDF"
                                >
                                  <IoEyeOutline className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-4 shadow-md shadow-slate-200/50">
                    <h3 className="mb-4 sm:mb-5 lg:mb-3 text-base sm:text-lg lg:text-base font-bold text-slate-900">Patient Medical History</h3>
                    {patientHistory ? (
                    <div className="space-y-6">
                      {/* Personal Info */}
                      {patientHistory.personalInfo && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Personal Information
                        </h4>
                        <div className="rounded-lg bg-slate-50 p-4">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-slate-600">Blood Group</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {patientHistory.personalInfo?.bloodGroup || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Phone</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {patientHistory.personalInfo?.phone || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      {/* Conditions */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Conditions
                        </h4>
                        <div className="space-y-2">
                          {patientHistory.conditions && Array.isArray(patientHistory.conditions) && patientHistory.conditions.length > 0 ? (
                          patientHistory.conditions.map((condition, idx) => (
                            <div key={idx} className="rounded-lg bg-slate-50 p-3">
                              <p className="text-sm font-semibold text-slate-900">{condition.name}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                Since {formatDate(condition.diagnosedDate)} • {condition.status}
                              </p>
                            </div>
                          ))
                          ) : (
                            <p className="text-sm text-slate-500">No conditions recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Allergies */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Allergies
                        </h4>
                        <div className="space-y-2">
                          {patientHistory.allergies && Array.isArray(patientHistory.allergies) && patientHistory.allergies.length > 0 ? (
                          patientHistory.allergies.map((allergy, idx) => (
                            <div key={idx} className="rounded-lg bg-red-50 p-3">
                              <p className="text-sm font-semibold text-red-900">{allergy.name}</p>
                              <p className="text-xs text-red-700 mt-1">
                                {allergy.severity} • {allergy.reaction}
                              </p>
                            </div>
                          ))
                          ) : (
                            <p className="text-sm text-slate-500">No allergies recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Current Medications */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Current Medications
                        </h4>
                        <div className="space-y-2">
                          {patientHistory.medications && Array.isArray(patientHistory.medications) && patientHistory.medications.length > 0 ? (
                          patientHistory.medications.map((med, idx) => (
                            <div key={idx} className="rounded-lg bg-emerald-50 p-3">
                              <p className="text-sm font-semibold text-emerald-900">{med.name}</p>
                              <p className="text-xs text-emerald-700 mt-1">
                                {med.dosage} • {med.frequency}
                              </p>
                              <p className="text-xs text-emerald-600 mt-1">Since {formatDate(med.startDate)}</p>
                            </div>
                          ))
                          ) : (
                            <p className="text-sm text-slate-500">No medications recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Vitals Records */}
                      {(() => {
                        try {
                          const historyKey = `patientHistory_${selectedConsultation?.patientId}`
                          const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}')
                          const vitalsRecords = savedHistory.vitalsRecords || []
                          
                          if (vitalsRecords.length > 0) {
                            return (
                              <div>
                                <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                                  Vitals Records
                                </h4>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {vitalsRecords.map((vital, idx) => (
                                    <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-slate-600">
                                          {vital.recordedAt || formatDate(vital.date)}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        {vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic && (
                                          <div>
                                            <p className="text-slate-600">BP</p>
                                            <p className="font-semibold text-slate-900">
                                              {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                                            </p>
                                          </div>
                                        )}
                                        {vital.temperature && (
                                          <div>
                                            <p className="text-slate-600">Temp</p>
                                            <p className="font-semibold text-slate-900">{vital.temperature} °F</p>
                                          </div>
                                        )}
                                        {vital.pulse && (
                                          <div>
                                            <p className="text-slate-600">Pulse</p>
                                            <p className="font-semibold text-slate-900">{vital.pulse} bpm</p>
                                          </div>
                                        )}
                                        {vital.respiratoryRate && (
                                          <div>
                                            <p className="text-slate-600">RR</p>
                                            <p className="font-semibold text-slate-900">{vital.respiratoryRate} /min</p>
                                          </div>
                                        )}
                                        {vital.oxygenSaturation && (
                                          <div>
                                            <p className="text-slate-600">SpO2</p>
                                            <p className="font-semibold text-slate-900">{vital.oxygenSaturation}%</p>
                                          </div>
                                        )}
                                        {vital.weight && (
                                          <div>
                                            <p className="text-slate-600">Weight</p>
                                            <p className="font-semibold text-slate-900">{vital.weight} kg</p>
                                          </div>
                                        )}
                                        {vital.height && (
                                          <div>
                                            <p className="text-slate-600">Height</p>
                                            <p className="font-semibold text-slate-900">{vital.height} cm</p>
                                          </div>
                                        )}
                                        {vital.bmi && (
                                          <div>
                                            <p className="text-slate-600">BMI</p>
                                            <p className="font-semibold text-slate-900">{vital.bmi}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                        } catch (error) {
                          console.error('Error loading vitals records:', error)
                        }
                        return null
                      })()}

                      {/* Previous Consultations */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Previous Consultations
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {patientHistory.previousConsultations && Array.isArray(patientHistory.previousConsultations) && patientHistory.previousConsultations.length > 0 ? (
                          patientHistory.previousConsultations.map((consult, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{consult.diagnosis}</p>
                                  <p className="mt-1 text-xs text-slate-600">{formatDate(consult.date)}</p>
                                  <p className="mt-1 text-xs text-slate-600">Dr. {consult.doctor}</p>
                                  {consult.medications && consult.medications.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {consult.medications.map((med, medIdx) => (
                                        <span
                                          key={medIdx}
                                          className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                        >
                                          {med}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                          ) : (
                            <p className="text-sm text-slate-500">No previous consultations</p>
                          )}
                        </div>
                      </div>

                      {/* Lab Reports */}
                      <div>
                        <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">
                          Lab Reports
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {/* Shared Lab Reports from Patient */}
                          {sharedLabReports && sharedLabReports.length > 0 && sharedLabReports.map((report, idx) => {
                            // Get PDF URL from report
                            const pdfUrl = report.pdfFileUrl || report.downloadUrl
                            return (
                            <div key={`shared-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-3">
                                <div className="flex-1">
                                  {/* Test Name - Bold */}
                                  <p className="font-bold text-base text-slate-900 mb-1">{report.testName || report.reportName || 'Lab Report'}</p>
                                  {/* Result Value */}
                                  {report.result && (
                                    <p className="text-sm text-slate-700 mb-1">{report.result}</p>
                                  )}
                                  {/* Date */}
                                  {report.date && (
                                    <p className="text-xs text-slate-600 mb-2">{formatDate(report.date)}</p>
                                  )}
                                  {/* Status Badge */}
                                  {report.status && (
                                    <span
                                      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                        report.status === 'Normal' || report.status === 'ready' || report.status === 'completed'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {report.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* View and Download Buttons */}
                              <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewLabReport(report)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <IoEyeOutline className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadLabReport(report)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52]"
                                >
                                  <IoDownloadOutline className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                            )
                          })}
                          
                          {/* Patient History Lab Reports */}
                          {patientHistory.labReports && Array.isArray(patientHistory.labReports) && patientHistory.labReports.length > 0 ? (
                          patientHistory.labReports.map((report, idx) => {
                            const pdfUrl = report.pdfFileUrl || report.downloadUrl
                            return (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-3">
                                <div className="flex-1">
                                  {/* Test Name - Bold */}
                                  <p className="font-bold text-base text-slate-900 mb-1">{report.testName}</p>
                                  {/* Result Value */}
                                  {report.result && (
                                    <p className="text-sm text-slate-700 mb-1">{report.result}</p>
                                  )}
                                  {/* Date */}
                                  {report.date && (
                                    <p className="text-xs text-slate-600 mb-2">{formatDate(report.date)}</p>
                                  )}
                                  {/* Status Badge */}
                                  {report.status && (
                                    <span
                                      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                        report.status === 'Normal'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {report.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* View and Download Buttons */}
                              <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleViewLabReport(report)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <IoEyeOutline className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownloadLabReport(report)
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#11496c] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0d3a52]"
                                >
                                  <IoDownloadOutline className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                            )
                          })
                          ) : null}
                          
                          {/* Show message if no reports */}
                          {(!sharedLabReports || sharedLabReports.length === 0) && (!patientHistory.labReports || patientHistory.labReports.length === 0) && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                              <IoFlaskOutline className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                              <p className="text-sm font-medium text-slate-600">No lab reports available</p>
                              <p className="text-xs text-slate-500 mt-1">Patient can share lab reports with you</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    ) : (
                      <div className="py-12 text-center">
                        <IoMedicalOutline className="mx-auto h-16 w-16 text-slate-300" />
                        <p className="mt-4 text-sm font-medium text-slate-600">No medical history available</p>
                        <p className="mt-1 text-xs text-slate-500">This appears to be the patient's first visit</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <IoDocumentTextOutline className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No active consultation</p>
              <p className="mt-1 text-xs text-slate-500">Select a patient from the Patients tab to start</p>
            </div>
          )}
      </section>

      {/* Add Medication Modal */}
      {showAddMedication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMedication(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Medication</h2>
              <button
                type="button"
                onClick={() => setShowAddMedication(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="relative medicine-dropdown-container">
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Medication Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newMedication.name}
                    onChange={(e) => handleMedicineNameChange(e.target.value)}
                    onFocus={() => {
                      if (availableMedicines.length > 0) {
                        setShowMedicineDropdown(true)
                      }
                    }}
                    placeholder="Search or type medicine name..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  />
                  <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                  
                  {/* Medicine Dropdown */}
                  {showMedicineDropdown && (filteredMedicines.length > 0 || medicineSearchTerm.trim()) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleMedicineSelect(medicine)}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{medicine.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                                  {medicine.dosage}
                                  {medicine.manufacturer && ` • ${medicine.manufacturer}`}
                                </p>
                              </div>
                              <IoMedicalOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] ml-2 shrink-0" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-xs sm:text-sm text-slate-600">
                            No medicine found. You can type manually to add "{medicineSearchTerm}".
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Dosage *</label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 5mg"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Frequency *</label>
                <input
                  type="text"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  placeholder="e.g., Once daily"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Duration</label>
                <input
                  type="text"
                  value={newMedication.duration}
                  onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                  placeholder="e.g., 30 days"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Instructions</label>
                <textarea
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  placeholder="Additional instructions..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddMedication(false)
                  setShowMedicineDropdown(false)
                  setMedicineSearchTerm('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Investigation Modal */}
      {showAddInvestigation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddInvestigation(false)
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:p-6">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900">Add Investigation</h2>
              <button
                type="button"
                onClick={() => setShowAddInvestigation(false)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <IoCloseOutline className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="relative test-dropdown-container">
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Test Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newInvestigation.name}
                    onChange={(e) => handleTestNameChange(e.target.value)}
                    onFocus={() => {
                      if (availableTests.length > 0) {
                        setShowTestDropdown(true)
                      }
                    }}
                    placeholder="Search or type test name..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:border-[#11496c]"
                  />
                  <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 pointer-events-none" />
                  
                  {/* Test Dropdown */}
                  {showTestDropdown && (filteredTests.length > 0 || testSearchTerm.trim()) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTests.length > 0 ? (
                        filteredTests.map((test, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleTestSelect(test)}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{test.name}</p>
                                {test.category && (
                                  <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                                    {test.category}
                                  </p>
                                )}
                              </div>
                              <IoFlaskOutline className="h-4 w-4 sm:h-5 sm:w-5 text-[#11496c] ml-2 shrink-0" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-xs sm:text-sm text-slate-600">
                            No test found. You can type manually to add "{testSearchTerm}".
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Notes</label>
                <textarea
                  value={newInvestigation.notes}
                  onChange={(e) => setNewInvestigation({ ...newInvestigation, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 border-t border-slate-200 p-3 sm:p-4 lg:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddInvestigation(false)
                  setShowTestDropdown(false)
                  setTestSearchTerm('')
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddInvestigation}
                disabled={!newInvestigation.name}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-[#11496c] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[rgba(17,73,108,0.2)] transition hover:bg-[#0d3a52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Viewer Modal */}
      {showReportViewer && selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => {
            setShowReportViewer(false)
            setSelectedReport(null)
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4 rounded-t-2xl">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {selectedReport.testName || selectedReport.reportName || 'Lab Report'}
                </h2>
                {selectedReport.labName && (
                  <p className="text-sm text-slate-600 mt-1">{selectedReport.labName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  // Check if PDF is available (either from report or stored)
                  const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                  const storedPdf = storedPdfs[selectedReport.id]
                  const pdfUrl = selectedReport.pdfFileUrl || selectedReport.downloadUrl
                  const hasPdf = (pdfUrl && pdfUrl !== '#') || (storedPdf && storedPdf.base64Data)
                  
                  return hasPdf ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadLabReport(selectedReport)
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      title="Download PDF"
                    >
                      <IoDownloadOutline className="h-5 w-5" />
                    </button>
                  ) : null
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setShowReportViewer(false)
                    setSelectedReport(null)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                >
                  <IoCloseOutline className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content - Always show PDF if available, otherwise show message */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {(() => {
                // Check if PDF is available (either from report or stored)
                const storedPdfs = JSON.parse(localStorage.getItem('doctorLabReportPdfs') || '{}')
                const storedPdf = storedPdfs[selectedReport.id]
                const pdfUrl = selectedReport.pdfFileUrl || selectedReport.downloadUrl
                const hasPdf = (pdfUrl && pdfUrl !== '#' && pdfUrl.trim() !== '') || (storedPdf && storedPdf.base64Data)
                const displayUrl = storedPdf?.base64Data || pdfUrl
                
                return hasPdf ? (
                  <div className="w-full h-full min-h-[500px] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                    <object
                      data={`${displayUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      type="application/pdf"
                      className="w-full h-full min-h-[500px]"
                      style={{ border: 'none' }}
                    >
                      <iframe
                        src={`${displayUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                        className="w-full h-full min-h-[500px]"
                        style={{ border: 'none' }}
                        title="Lab Report PDF"
                      />
                      <div className="p-6 text-center">
                        <p className="text-sm text-slate-600 mb-4">Unable to display PDF in browser.</p>
                        <button
                          type="button"
                          onClick={() => {
                            handleViewLabReport(selectedReport)
                          }}
                          className="rounded-lg bg-[#11496c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3a52]"
                        >
                          Open PDF in New Tab
                        </button>
                      </div>
                    </object>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                    <IoFlaskOutline className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                    <p className="text-sm font-medium text-slate-600 mb-2">PDF Report Not Available</p>
                    <p className="text-xs text-slate-500">
                      PDF report will be available once the lab uploads it.
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DoctorConsultations
