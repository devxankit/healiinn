import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoCallOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoMedicalOutline,
  IoSchoolOutline,
  IoLanguageOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoVideocamOutline,
  IoCloseOutline,
  IoAddOutline,
  IoSearchOutline,
} from 'react-icons/io5'
import { useToast } from '../../../contexts/ToastContext'
import {
  requestLoginOtp as requestDoctorOtp,
  loginDoctor,
  signupDoctor,
  storeDoctorTokens,
} from '../doctor-services/doctorService'
import {
  requestLoginOtp as requestPharmacyOtp,
  loginPharmacy,
  signupPharmacy,
  storePharmacyTokens,
} from '../../pharmacy/pharmacy-services/pharmacyService'
import {
  requestLoginOtp as requestLaboratoryOtp,
  loginLaboratory,
  signupLaboratory,
  storeLaboratoryTokens,
} from '../../laboratory/laboratory-services/laboratoryService'
import {
  requestLoginOtp as requestNurseOtp,
  loginNurse,
  signupNurse,
  storeNurseTokens,
} from '../../nurse/nurse-services/nurseService'

const DoctorLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Determine initial module based on URL path
  const getInitialModule = () => {
    const path = location.pathname
    if (path.includes('/pharmacy/')) return 'pharmacy'
    if (path.includes('/laboratory/')) return 'laboratory'
    if (path.includes('/nurse/')) return 'nurse'
    return 'doctor' // default
  }

  const [selectedModule, setSelectedModule] = useState(getInitialModule()) // 'doctor' | 'pharmacy' | 'laboratory' | 'nurse'
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  // Update selected module when URL changes
  useEffect(() => {
    const path = location.pathname
    if (path.includes('/pharmacy/')) {
      setSelectedModule('pharmacy')
    } else if (path.includes('/laboratory/')) {
      setSelectedModule('laboratory')
    } else if (path.includes('/nurse/')) {
      setSelectedModule('nurse')
    } else {
      setSelectedModule('doctor')
    }
  }, [location.pathname])

  // OTP-based login data states for each module
  const [doctorLoginData, setDoctorLoginData] = useState({ phone: '', otp: '', remember: true })
  const [pharmacyLoginData, setPharmacyLoginData] = useState({ phone: '', otp: '', remember: true })
  const [laboratoryLoginData, setLaboratoryLoginData] = useState({ phone: '', otp: '', remember: true })
  const [nurseLoginData, setNurseLoginData] = useState({ phone: '', otp: '', remember: true })

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  // Signup step state (applies to all modules)
  const [signupStep, setSignupStep] = useState(1)
  // Dynamic total steps: 4 for nurse, 3 for others
  const totalSignupSteps = selectedModule === 'nurse' ? 4 : 3


  // Refs for module buttons to measure their positions and widths
  const doctorButtonRef = useRef(null)
  const pharmacyButtonRef = useRef(null)
  const laboratoryButtonRef = useRef(null)
  const nurseButtonRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // OTP input refs
  const otpInputRefs = useRef([])

  // Specialization dropdown state (for doctor)
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [specializationSearchTerm, setSpecializationSearchTerm] = useState('')
  const [availableSpecializations, setAvailableSpecializations] = useState([])
  const specializationInputRef = useRef(null)
  const specializationDropdownRef = useRef(null)



  // Doctor signup state
  const initialDoctorSignupState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    gender: '',
    licenseNumber: '',
    experienceYears: '',
    qualification: '',
    bio: '',
    consultationFee: '',
    languages: [],
    consultationModes: [],
    education: [{ institution: '', degree: '', year: '' }],
    clinicDetails: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    documents: [],
    termsAccepted: false,
  }
  const [doctorSignupData, setDoctorSignupData] = useState(initialDoctorSignupState)

  // Pharmacy signup state
  const initialPharmacySignupState = {
    pharmacyName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    timings: '',
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    documents: [],
    termsAccepted: false,
  }
  const [pharmacySignupData, setPharmacySignupData] = useState(initialPharmacySignupState)

  // Laboratory signup state
  const initialLaboratorySignupState = {
    labName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    gstNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    testsOffered: '',
    timings: '',
    contactPerson: {
      name: '',
      phone: '',
      email: '',
    },
    operatingHours: {
      opening: '',
      closing: '',
      days: [],
    },
    documents: [],
    termsAccepted: false,
  }
  const [laboratorySignupData, setLaboratorySignupData] = useState(initialLaboratorySignupState)

  // Nurse signup state
  const initialNurseSignupState = {
    fullName: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
    },
    qualification: '',
    experienceYears: '',
    specialization: 'Home Care Nurse', // Default to Home Care Nurse
    fees: '',
    registrationNumber: '',
    registrationCouncilName: '',
    documents: [],
    termsAccepted: false,
  }
  const [nurseSignupData, setNurseSignupData] = useState(initialNurseSignupState)

  const isLogin = mode === 'login'

  // Get current login data based on selected module
  const getCurrentLoginData = () => {
    if (selectedModule === 'doctor') return doctorLoginData
    if (selectedModule === 'pharmacy') return pharmacyLoginData
    if (selectedModule === 'laboratory') return laboratoryLoginData
    if (selectedModule === 'nurse') return nurseLoginData
    return doctorLoginData // fallback
  }

  const setCurrentLoginData = (data) => {
    if (selectedModule === 'doctor') setDoctorLoginData(data)
    else if (selectedModule === 'pharmacy') setPharmacyLoginData(data)
    else if (selectedModule === 'laboratory') setLaboratoryLoginData(data)
    else if (selectedModule === 'nurse') setNurseLoginData(data)
  }

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  // Update indicator position and width based on selected button
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const container = doctorButtonRef.current?.parentElement
      if (!container) return

      const activeButtonRef =
        selectedModule === 'doctor'
          ? doctorButtonRef
          : selectedModule === 'pharmacy'
            ? pharmacyButtonRef
            : selectedModule === 'laboratory'
              ? laboratoryButtonRef
              : nurseButtonRef

      const activeButton = activeButtonRef.current
      if (!activeButton) return

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      })
    }

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateIndicatorPosition)
    }, 0)

    // Update on window resize
    window.addEventListener('resize', updateIndicatorPosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateIndicatorPosition)
    }
  }, [selectedModule])



  const handleModuleChange = (module) => {
    setSelectedModule(module)
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setSignupStep(1)
    // Reset OTP for all modules
    setDoctorLoginData({ phone: '', otp: '', remember: true })
    setPharmacyLoginData({ phone: '', otp: '', remember: true })
    setLaboratoryLoginData({ phone: '', otp: '', remember: true })
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setSignupStep(1)
  }

  // Get current signup data based on selected module
  const getCurrentSignupData = () => {
    if (selectedModule === 'doctor') return doctorSignupData
    if (selectedModule === 'pharmacy') return pharmacySignupData
    if (selectedModule === 'laboratory') return laboratorySignupData
    if (selectedModule === 'nurse') return nurseSignupData
    return null
  }

  // Handle next step in signup
  const handleNextStep = () => {
    const currentData = getCurrentSignupData()
    if (!currentData) return

    // Validate current step before proceeding
    if (signupStep === 1) {
      // Step 1 validation - Basic info (varies by module)
      if (selectedModule === 'doctor') {
        if (!currentData.firstName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'pharmacy') {
        if (!currentData.pharmacyName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'laboratory') {
        if (!currentData.labName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
      } else if (selectedModule === 'nurse') {
        if (!currentData.fullName || !currentData.email || !currentData.phone) {
          toast.error('Please fill in all required fields in Step 1')
          return
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(currentData.email.trim())) {
          toast.error('Please enter a valid email address')
          return
        }
        // Validate phone
        if (currentData.phone.length !== 10) {
          toast.error('Please enter a valid 10-digit mobile number')
          return
        }
      }
    } else if (signupStep === 2 && selectedModule === 'nurse') {
      // Step 2 validation - Address details
      if (!currentData.address.line1 || !currentData.address.city || !currentData.address.state || !currentData.address.postalCode) {
        toast.error('Please fill in all address fields in Step 2')
        return
      }
    } else if (signupStep === 3 && selectedModule === 'nurse') {
      // Step 3 validation - Professional details
      if (!currentData.qualification || !currentData.registrationNumber || !currentData.registrationCouncilName) {
        toast.error('Please fill in all required professional details in Step 3')
        return
      }
    }

    if (signupStep < totalSignupSteps) {
      setSignupStep(signupStep + 1)
    }
  }

  // Handle previous step in signup
  const handlePreviousStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1)
    }
  }

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    const currentData = getCurrentLoginData()
    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setCurrentLoginData({
        ...currentData,
        [name]: numericValue,
      })
      return
    }
    setCurrentLoginData({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const currentData = getCurrentLoginData()
    const otpArray = (currentData.otp || '').split('').slice(0, 6)
    otpArray[index] = value.slice(-1) // Take only last character
    const newOtp = otpArray.join('').padEnd(6, ' ').slice(0, 6).replace(/\s/g, '')

    setCurrentLoginData({
      ...currentData,
      otp: newOtp,
    })

    // Auto-focus next input
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const currentData = getCurrentLoginData()
      setCurrentLoginData({
        ...currentData,
        otp: pastedData,
      })
      // Focus last input
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus()
      }
    }
  }

  // Handle OTP key down (backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Send OTP function
  const handleSendOtp = async () => {
    const loginData = getCurrentLoginData()

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = loginData.phone.replace(/\D/g, '')

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid mobile number')
      return
    }

    setIsSendingOtp(true)

    try {
      let response
      if (selectedModule === 'doctor') {
        response = await requestDoctorOtp(cleanPhone)
      } else if (selectedModule === 'pharmacy') {
        response = await requestPharmacyOtp(cleanPhone)
      } else if (selectedModule === 'laboratory') {
        response = await requestLaboratoryOtp(cleanPhone)
      } else if (selectedModule === 'nurse') {
        response = await requestNurseOtp(cleanPhone)
      }

      if (response && response.success) {
        setOtpSent(true)
        setOtpTimer(60) // 60 seconds timer
        // Update phone in state with cleaned version
        setCurrentLoginData({ ...loginData, phone: cleanPhone })
        toast.success('OTP sent to your mobile number')
      } else {
        toast.error(response?.message || 'Failed to send OTP. Please try again.')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Resend OTP function
  const handleResendOtp = () => {
    setOtpTimer(0)
    setOtpSent(false)
    const currentData = getCurrentLoginData()
    setCurrentLoginData({ ...currentData, otp: '' })
    handleSendOtp()
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || isSendingOtp) return

    const loginData = getCurrentLoginData()

    // If OTP not sent, send it first
    if (!otpSent) {
      await handleSendOtp()
      return
    }

    // Verify OTP
    if (!loginData.otp || loginData.otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP')
      return
    }

    setIsSubmitting(true)

    try {
      // Dashboard routes for each module
      const dashboardRoutes = {
        doctor: '/doctor/dashboard',
        pharmacy: '/pharmacy/dashboard',
        laboratory: '/laboratory/dashboard',
        nurse: '/nurse/dashboard',
      }

      let response
      if (selectedModule === 'doctor') {
        response = await loginDoctor({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeDoctorTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'pharmacy') {
        response = await loginPharmacy({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storePharmacyTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'laboratory') {
        response = await loginLaboratory({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeLaboratoryTokens(response.data.tokens, loginData.remember)
        }
      } else if (selectedModule === 'nurse') {
        response = await loginNurse({ phone: loginData.phone, otp: loginData.otp })
        if (response.success && response.data?.tokens) {
          storeNurseTokens(response.data.tokens, loginData.remember)
        }
      }

      if (response && response.success && response.data?.tokens) {
        toast.success('Login successful! Redirecting...')
        setTimeout(() => {
          navigate(dashboardRoutes[selectedModule], { replace: true })
        }, 500)
      } else {
        toast.error(response?.message || 'Login failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      // Check if it's an approval error
      if (error.message && error.message.includes('approval')) {
        toast.error(error.message)
      } else {
        toast.error(error.message || 'An error occurred. Please try again.')
      }
      setIsSubmitting(false)
    }
  }

  const handleDoctorSignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setDoctorSignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('clinicDetails.address.')) {
      const key = name.split('.')[2]
      setDoctorSignupData((prev) => ({
        ...prev,
        clinicDetails: {
          ...prev.clinicDetails,
          address: {
            ...prev.clinicDetails.address,
            [key]: value,
          },
        },
      }))
      return
    }

    if (name.startsWith('clinicDetails.')) {
      const key = name.split('.')[1]
      setDoctorSignupData((prev) => ({
        ...prev,
        clinicDetails: {
          ...prev.clinicDetails,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('education.')) {
      const parts = name.split('.')
      const index = parseInt(parts[1])
      const field = parts[2]
      setDoctorSignupData((prev) => {
        const newEducation = [...prev.education]
        newEducation[index] = {
          ...newEducation[index],
          [field]: value,
        }
        return {
          ...prev,
          education: newEducation,
        }
      })
      return
    }

    if (name === 'consultationModes') {
      setDoctorSignupData((prev) => {
        const modes = prev.consultationModes || []
        if (checked && !modes.includes(value)) {
          return { ...prev, consultationModes: [...modes, value] }
        } else if (!checked && modes.includes(value)) {
          return { ...prev, consultationModes: modes.filter((m) => m !== value) }
        }
        return prev
      })
      return
    }

    if (name === 'languages') {
      const langValue = value.trim()
      if (langValue && !doctorSignupData.languages.includes(langValue)) {
        setDoctorSignupData((prev) => ({
          ...prev,
          languages: [...prev.languages, langValue],
        }))
      }
      return
    }

    // Handle specialization with dropdown
    if (name === 'specialization') {
      setDoctorSignupData((prev) => ({
        ...prev,
        specialization: value,
      }))
      // Update search term to match what user is typing
      setSpecializationSearchTerm(value)
      // Show dropdown if there's a search term or if specializations are available
      if (value.trim() || availableSpecializations.length > 0) {
        setShowSpecializationDropdown(true)
      } else {
        setShowSpecializationDropdown(false)
      }
      return
    }

    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setDoctorSignupData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    // Handle consultationFee - preserve exact value as string to avoid precision loss
    if (name === 'consultationFee') {
      // Remove any non-numeric characters except decimal point
      const cleanedValue = value.replace(/[^\d.]/g, '')
      // Ensure only one decimal point
      const parts = cleanedValue.split('.')
      const finalValue = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0]
      setDoctorSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    setDoctorSignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const addEducationEntry = () => {
    setDoctorSignupData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }],
    }))
  }

  const removeEducationEntry = (index) => {
    setDoctorSignupData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const removeLanguage = (lang) => {
    setDoctorSignupData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== lang),
    }))
  }

  // Document upload helper functions
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve({
        name: file.name,
        data: reader.result,
        type: file.type
      })
      reader.onerror = reject
    })
  }

  const handleDocumentUpload = async (event, userType) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validate files
    const maxSize = 5 * 1024 * 1024 // 5MB
    const maxFiles = 10

    for (const file of files) {
      // Check file type
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file. Only PDF files are allowed.`)
        continue
      }

      // Check file size
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`)
        continue
      }
    }

    // Check total files limit
    let currentDocsCount = 0
    if (userType === 'doctor') currentDocsCount = doctorSignupData.documents.length
    else if (userType === 'pharmacy') currentDocsCount = pharmacySignupData.documents.length
    else if (userType === 'laboratory') currentDocsCount = laboratorySignupData.documents.length
    else if (userType === 'nurse') currentDocsCount = nurseSignupData.documents?.length || 0

    if (currentDocsCount + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} documents allowed. Please remove some documents first.`)
      return
    }

    // Convert files to base64
    try {
      const base64Files = await Promise.all(files.map(convertFileToBase64))

      if (userType === 'doctor') {
        setDoctorSignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'pharmacy') {
        setPharmacySignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'laboratory') {
        setLaboratorySignupData((prev) => ({
          ...prev,
          documents: [...prev.documents, ...base64Files]
        }))
      } else if (userType === 'nurse') {
        setNurseSignupData((prev) => ({
          ...prev,
          documents: [...(prev.documents || []), ...base64Files]
        }))
      }
    } catch (error) {
      console.error('Error converting files to base64:', error)
      toast.error('Failed to process files. Please try again.')
    }

    // Reset input
    event.target.value = ''
  }

  const removeDocument = (index, userType) => {
    if (userType === 'doctor') {
      setDoctorSignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'pharmacy') {
      setPharmacySignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'laboratory') {
      setLaboratorySignupData((prev) => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }))
    } else if (userType === 'nurse') {
      setNurseSignupData((prev) => ({
        ...prev,
        documents: (prev.documents || []).filter((_, i) => i !== index)
      }))
    }
  }

  const handleDoctorSignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!doctorSignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!doctorSignupData.firstName || !doctorSignupData.email || !doctorSignupData.phone || !doctorSignupData.specialization || !doctorSignupData.gender || !doctorSignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate firstName
    if (doctorSignupData.firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(doctorSignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (doctorSignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        firstName: doctorSignupData.firstName,
        lastName: doctorSignupData.lastName || '',
        email: doctorSignupData.email,
        phone: doctorSignupData.phone,
        specialization: doctorSignupData.specialization,
        gender: doctorSignupData.gender,
        licenseNumber: doctorSignupData.licenseNumber,
        experienceYears: doctorSignupData.experienceYears ? Number(doctorSignupData.experienceYears) : undefined,
        qualification: doctorSignupData.qualification || undefined,
        bio: doctorSignupData.bio || undefined,
        consultationFee: doctorSignupData.consultationFee && doctorSignupData.consultationFee !== ''
          ? (() => {
            const feeStr = String(doctorSignupData.consultationFee).trim()
            const feeNum = parseFloat(feeStr)
            console.log('💰 Frontend Fee Conversion:', {
              original: doctorSignupData.consultationFee,
              string: feeStr,
              parsed: feeNum,
              isValid: !isNaN(feeNum) && isFinite(feeNum)
            })
            return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
          })()
          : undefined,
        languages: doctorSignupData.languages.length > 0 ? doctorSignupData.languages : undefined,
        consultationModes: doctorSignupData.consultationModes.length > 0 ? doctorSignupData.consultationModes : undefined,
        education: doctorSignupData.education.filter((edu) => edu.institution || edu.degree || edu.year).length > 0
          ? doctorSignupData.education.filter((edu) => edu.institution || edu.degree || edu.year)
          : undefined,
        clinicName: doctorSignupData.clinicDetails.name || undefined,
        clinicAddress: Object.values(doctorSignupData.clinicDetails.address).some((val) => val)
          ? doctorSignupData.clinicDetails.address
          : undefined,
        documents: doctorSignupData.documents.length > 0 ? doctorSignupData.documents : undefined,
      }

      const response = await signupDoctor(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setDoctorSignupData(initialDoctorSignupState)
        setSignupStep(1)
        setMode('login')
      } else {
        toast.error(response.message || 'Signup failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handlePharmacySignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setPharmacySignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setPharmacySignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('contactPerson.')) {
      const key = name.split('.')[1]
      setPharmacySignupData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }


    // Restrict phone fields to 10 digits only
    if (name === 'phone' || name === 'contactPerson.phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setPharmacySignupData((prev) => {
        if (name === 'phone') {
          return {
            ...prev,
            phone: numericValue,
          }
        }
        if (name.startsWith('contactPerson.')) {
          const key = name.split('.')[1]
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [key]: numericValue,
            },
          }
        }
        return prev
      })
      return
    }

    setPharmacySignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handlePharmacySignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!pharmacySignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!pharmacySignupData.pharmacyName || !pharmacySignupData.email || !pharmacySignupData.phone || !pharmacySignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate pharmacyName
    if (pharmacySignupData.pharmacyName.trim().length < 2) {
      toast.error('Pharmacy name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(pharmacySignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (pharmacySignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        pharmacyName: pharmacySignupData.pharmacyName,
        ownerName: pharmacySignupData.ownerName || undefined,
        email: pharmacySignupData.email,
        phone: pharmacySignupData.phone,
        licenseNumber: pharmacySignupData.licenseNumber,
        gstNumber: pharmacySignupData.gstNumber || undefined,
        address: Object.values(pharmacySignupData.address).some((val) => val) ? pharmacySignupData.address : undefined,
        timings: pharmacySignupData.timings ? [pharmacySignupData.timings] : undefined,
        contactPerson: Object.values(pharmacySignupData.contactPerson).some((val) => val) ? pharmacySignupData.contactPerson : undefined,
        documents: pharmacySignupData.documents.length > 0 ? pharmacySignupData.documents : undefined,
      }

      const response = await signupPharmacy(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setPharmacySignupData(initialPharmacySignupState)
        setSignupStep(1)
        setMode('login')
      } else {
        toast.error(response.message || 'Signup failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleLaboratorySignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setLaboratorySignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setLaboratorySignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('contactPerson.')) {
      const key = name.split('.')[1]
      setLaboratorySignupData((prev) => ({
        ...prev,
        contactPerson: {
          ...prev.contactPerson,
          [key]: value,
        },
      }))
      return
    }

    if (name.startsWith('operatingHours.')) {
      const key = name.split('.')[1]
      if (key === 'days') {
        const days = laboratorySignupData.operatingHours.days || []
        if (checked && !days.includes(value)) {
          setLaboratorySignupData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: [...days, value],
            },
          }))
        } else if (!checked && days.includes(value)) {
          setLaboratorySignupData((prev) => ({
            ...prev,
            operatingHours: {
              ...prev.operatingHours,
              days: days.filter((d) => d !== value),
            },
          }))
        }
        return
      }
      setLaboratorySignupData((prev) => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [key]: value,
        },
      }))
      return
    }


    // Restrict phone fields to 10 digits only
    if (name === 'phone' || name === 'contactPerson.phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setLaboratorySignupData((prev) => {
        if (name === 'phone') {
          return {
            ...prev,
            phone: numericValue,
          }
        }
        if (name.startsWith('contactPerson.')) {
          const key = name.split('.')[1]
          return {
            ...prev,
            contactPerson: {
              ...prev.contactPerson,
              [key]: numericValue,
            },
          }
        }
        return prev
      })
      return
    }

    // Limit text fields (allow spaces while typing, only limit length)
    if (name === 'labName' || name === 'ownerName') {
      const limitedValue = value.slice(0, 100)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      return
    }

    // Limit email
    if (name === 'email') {
      const trimmedValue = value.trim().slice(0, 100)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit license number
    if (name === 'licenseNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit GST number
    if (name === 'gstNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setLaboratorySignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    setLaboratorySignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleNurseSignupChange = (event) => {
    const { name, value, type, checked, files } = event.target

    // Handle file uploads - now using generic documents array
    if (type === 'file' && files && files.length > 0) {
      handleDocumentUpload(event, 'nurse')
      return
    }

    if (name === 'termsAccepted') {
      setNurseSignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      let limitedValue = value

      // Apply length limits based on field type
      if (key === 'line1') {
        limitedValue = value.slice(0, 200) // Address line can be longer
      } else if (key === 'city' || key === 'state') {
        limitedValue = value.slice(0, 100) // City and state names
      } else if (key === 'postalCode') {
        // Already handled separately below
        limitedValue = value
      } else if (key === 'country') {
        limitedValue = value.slice(0, 100)
      }

      setNurseSignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: limitedValue,
        },
      }))
      return
    }

    // Restrict phone fields to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setNurseSignupData((prev) => ({
        ...prev,
        phone: numericValue,
      }))
      return
    }

    // Handle specialization (now a simple select)
    if (name === 'specialization') {
      setNurseSignupData((prev) => ({
        ...prev,
        specialization: value,
      }))
      return
    }

    // Limit text fields
    if (name === 'fullName' || name === 'qualification' || name === 'registrationCouncilName') {
      const limitedValue = value.slice(0, 100)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }))
      return
    }

    // Limit email
    if (name === 'email') {
      const trimmedValue = value.trim().slice(0, 100)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit registration number
    if (name === 'registrationNumber') {
      const trimmedValue = value.trim().slice(0, 50)
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: trimmedValue,
      }))
      return
    }

    // Limit postal code (6 digits only)
    if (name === 'postalCode' || name === 'address.postalCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6)
      setNurseSignupData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          postalCode: numericValue,
        },
      }))
      return
    }

    // Limit experience years (0-50 years)
    if (name === 'experienceYears') {
      const numericValue = value.replace(/\D/g, '').slice(0, 2)
      const numValue = numericValue ? parseInt(numericValue, 10) : ''
      // Ensure value is between 0 and 50
      const finalValue = (numValue !== '' && !isNaN(numValue))
        ? (numValue > 50 ? '50' : (numValue < 0 ? '0' : String(numValue)))
        : numericValue
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    // Handle fees - preserve exact value as string to avoid precision loss
    if (name === 'fees') {
      // Remove any non-numeric characters except decimal point
      const cleanedValue = value.replace(/[^\d.]/g, '')
      // Ensure only one decimal point
      const parts = cleanedValue.split('.')
      const finalValue = parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : parts[0]
      setNurseSignupData((prev) => ({
        ...prev,
        [name]: finalValue,
      }))
      return
    }

    setNurseSignupData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleLaboratorySignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!laboratorySignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    if (!laboratorySignupData.labName || !laboratorySignupData.email || !laboratorySignupData.phone || !laboratorySignupData.licenseNumber) {
      toast.error('Please fill in all required fields.')
      return
    }

    // Validate labName
    if (laboratorySignupData.labName.trim().length < 2) {
      toast.error('Laboratory name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(laboratorySignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (laboratorySignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        labName: laboratorySignupData.labName,
        ownerName: laboratorySignupData.ownerName || undefined,
        email: laboratorySignupData.email,
        phone: laboratorySignupData.phone,
        licenseNumber: laboratorySignupData.licenseNumber,
        gstNumber: laboratorySignupData.gstNumber || undefined,
        address: Object.values(laboratorySignupData.address).some((val) => val) ? laboratorySignupData.address : undefined,
        timings: laboratorySignupData.timings ? [laboratorySignupData.timings] : undefined,
        contactPerson: Object.values(laboratorySignupData.contactPerson).some((val) => val) ? laboratorySignupData.contactPerson : undefined,
        operatingHours: Object.values(laboratorySignupData.operatingHours).some((val) => Array.isArray(val) ? val.length > 0 : val)
          ? laboratorySignupData.operatingHours
          : undefined,
        documents: laboratorySignupData.documents.length > 0 ? laboratorySignupData.documents : undefined,
      }

      const response = await signupLaboratory(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setLaboratorySignupData(initialLaboratorySignupState)
        setSignupStep(1)
        setMode('login')
      } else {
        toast.error(response.message || 'Signup failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleNurseSignupSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!nurseSignupData.termsAccepted) {
      toast.error('Please accept the terms to continue.')
      return
    }

    // Validate all required fields
    if (!nurseSignupData.fullName || !nurseSignupData.email || !nurseSignupData.phone) {
      toast.error('Please fill in all required fields in Step 1.')
      return
    }

    if (!nurseSignupData.address.line1 || !nurseSignupData.address.city || !nurseSignupData.address.state || !nurseSignupData.address.postalCode) {
      toast.error('Please fill in all address fields in Step 2.')
      return
    }

    if (!nurseSignupData.qualification || !nurseSignupData.registrationNumber || !nurseSignupData.registrationCouncilName) {
      toast.error('Please fill in all required professional details in Step 3.')
      return
    }

    // Validate fullName
    if (nurseSignupData.fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(nurseSignupData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    if (nurseSignupData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    // Validate postal code
    if (nurseSignupData.address.postalCode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    // Validate experience years if provided
    if (nurseSignupData.experienceYears && nurseSignupData.experienceYears !== '') {
      const expYears = parseInt(nurseSignupData.experienceYears, 10)
      if (isNaN(expYears) || expYears < 0 || expYears > 50) {
        toast.error('Experience years must be between 0 and 50')
        return
      }
    }

    // Validate fees if provided
    if (nurseSignupData.fees && nurseSignupData.fees !== '') {
      const feesValue = parseFloat(nurseSignupData.fees)
      if (isNaN(feesValue) || feesValue < 0 || feesValue > 999999) {
        toast.error('Fees must be between ₹0 and ₹999999')
        return
      }
    }

    // Validate address fields length
    if (nurseSignupData.address.line1.trim().length < 5) {
      toast.error('Address line 1 must be at least 5 characters')
      return
    }
    if (nurseSignupData.address.city.trim().length < 2) {
      toast.error('City name must be at least 2 characters')
      return
    }
    if (nurseSignupData.address.state.trim().length < 2) {
      toast.error('State name must be at least 2 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        fullName: nurseSignupData.fullName,
        email: nurseSignupData.email,
        phone: nurseSignupData.phone,
        address: nurseSignupData.address,
        qualification: nurseSignupData.qualification,
        experienceYears: nurseSignupData.experienceYears ? Number(nurseSignupData.experienceYears) : undefined,
        specialization: nurseSignupData.specialization || undefined,
        fees: nurseSignupData.fees && nurseSignupData.fees !== ''
          ? (() => {
            const feeStr = String(nurseSignupData.fees).trim()
            const feeNum = parseFloat(feeStr)
            return !isNaN(feeNum) && isFinite(feeNum) ? feeNum : undefined
          })()
          : undefined,
        registrationNumber: nurseSignupData.registrationNumber,
        registrationCouncilName: nurseSignupData.registrationCouncilName,
        documents: nurseSignupData.documents && nurseSignupData.documents.length > 0 ? nurseSignupData.documents : undefined,
      }

      const response = await signupNurse(payload)

      if (response.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.')
        setNurseSignupData(initialNurseSignupState)
        setSignupStep(1)
        setMode('login')
      } else {
        toast.error(response.message || 'Signup failed. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[rgba(17,73,108,0.08)] blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[rgba(17,73,108,0.06)] blur-3xl" />
      </div>

      {/* Main Content - Centered on mobile */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        {/* Form Section - Centered with max width */}
        <div className="w-full max-w-md mx-auto">
          {/* Title */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isLogin
                ? `Sign in to your ${selectedModule} account to continue.`
                : `Join Healiinn as a ${selectedModule} to get started.`}
            </p>
          </div>

          {/* Login/Signup Mode Toggle */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full max-w-xs">
              {/* Sliding background indicator */}
              <motion.div
                layoutId="loginSignupToggle"
                className="absolute rounded-xl bg-[#11496c] shadow-md shadow-[#11496c]/15"
                style={{
                  left: isLogin ? '0.375rem' : 'calc(50% + 0.1875rem)',
                  width: 'calc(50% - 0.5625rem)',
                  height: 'calc(100% - 0.75rem)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${isLogin
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Sign In
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${!isLogin
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Sign Up
              </motion.button>
            </div>
          </div>

          {/* Module Selection Toggle */}
          <div className="mb-8 flex items-center justify-center">
            <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full">
              {/* Sliding background indicator */}
              <motion.div
                layoutId="moduleToggle"
                className="absolute rounded-xl bg-[#11496c] shadow-md shadow-[#11496c]/15"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  height: 'calc(100% - 0.75rem)',
                  top: '0.375rem',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <motion.button
                ref={doctorButtonRef}
                type="button"
                onClick={() => handleModuleChange('doctor')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'doctor'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Doctor
              </motion.button>
              <motion.button
                ref={pharmacyButtonRef}
                type="button"
                onClick={() => handleModuleChange('pharmacy')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'pharmacy'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Pharmacy
              </motion.button>
              <motion.button
                ref={laboratoryButtonRef}
                type="button"
                onClick={() => handleModuleChange('laboratory')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'laboratory'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Laboratory
              </motion.button>
              <motion.button
                ref={nurseButtonRef}
                type="button"
                onClick={() => handleModuleChange('nurse')}
                className={`relative z-10 flex-1 rounded-xl py-2 text-xs font-semibold text-center sm:py-2.5 sm:text-sm ${selectedModule === 'nurse'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Nurse
              </motion.button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key={`login-${selectedModule}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
                onSubmit={handleLoginSubmit}
              >
                {/* Mobile Number Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-phone" className="text-sm font-semibold text-slate-700">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      id="login-phone"
                      name="phone"
                      type="tel"
                      value={getCurrentLoginData().phone}
                      onChange={handleLoginChange}
                      autoComplete="tel"
                      required
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      disabled={otpSent}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                    />
                  </div>
                </div>

                {/* OTP Input Section - Show after OTP is sent */}
                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <label className="text-sm font-semibold text-slate-700">
                      Enter OTP
                    </label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={getCurrentLoginData().otp[index] || ''}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 text-center text-lg font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {otpTimer > 0 ? (
                          `Resend OTP in ${otpTimer}s`
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                          >
                            Resend OTP
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false)
                          setOtpTimer(0)
                          const currentData = getCurrentLoginData()
                          setCurrentLoginData({ ...currentData, otp: '' })
                        }}
                        className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                      >
                        Change Number
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Remember me checkbox */}
                <div className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={getCurrentLoginData().remember}
                      onChange={handleLoginChange}
                      className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSendingOtp}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                >
                  {isSubmitting ? (
                    otpSent ? 'Verifying...' : 'Sending OTP...'
                  ) : isSendingOtp ? (
                    'Sending OTP...'
                  ) : otpSent ? (
                    <>
                      Verify OTP
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Send OTP
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-600">
                  New to Healiinn?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Create an account
                  </button>
                </p>
              </motion.form>
            ) : selectedModule === 'doctor' ? (
              <motion.div
                key="signup-doctor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${signupStep === step
                            ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                            : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={`h-1.5 w-12 sm:w-16 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Information'}
                      {signupStep === 2 && 'Professional Details'}
                      {signupStep === 3 && 'Additional Information'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleDoctorSignupSubmit} className="flex flex-col gap-5 sm:gap-6">
                  {/* Step 1: Basic Information */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Basic Information</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              value={doctorSignupData.firstName}
                              onChange={handleDoctorSignupChange}
                              required
                              placeholder="John"
                              maxLength={50}
                              minLength={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={doctorSignupData.lastName}
                            onChange={handleDoctorSignupChange}
                            placeholder="Doe"
                            maxLength={50}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="doctor-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="doctor-email"
                              name="email"
                              type="email"
                              value={doctorSignupData.email}
                              onChange={handleDoctorSignupChange}
                              autoComplete="email"
                              required
                              placeholder="you@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="doctor-phone" className="text-sm font-semibold text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="doctor-phone"
                              name="phone"
                              type="tel"
                              value={doctorSignupData.phone}
                              onChange={handleDoctorSignupChange}
                              autoComplete="tel"
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                    </motion.div>
                  )}

                  {/* Step 2: Professional Information */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Professional Information</h3>
                        <p className="text-xs text-slate-500">Tell us about your professional background</p>
                      </div>
                      {/* Professional Information */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="specialization" className="text-sm font-semibold text-slate-700">
                            Specialization <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c] z-10">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              ref={specializationInputRef}
                              id="specialization"
                              name="specialization"
                              type="text"
                              value={doctorSignupData.specialization}
                              onChange={handleDoctorSignupChange}
                              onFocus={() => {
                                if (availableSpecializations.length > 0 || doctorSignupData.specialization.trim()) {
                                  setShowSpecializationDropdown(true)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && showSpecializationDropdown) {
                                  e.preventDefault()
                                  if (filteredSpecializations.length > 0) {
                                    // Select first filtered result
                                    setDoctorSignupData(prev => ({ ...prev, specialization: filteredSpecializations[0] }))
                                    setSpecializationSearchTerm('')
                                    setShowSpecializationDropdown(false)
                                  } else if (specializationSearchTerm.trim()) {
                                    // Use typed value
                                    setDoctorSignupData(prev => ({ ...prev, specialization: specializationSearchTerm.trim() }))
                                    setSpecializationSearchTerm('')
                                    setShowSpecializationDropdown(false)
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowSpecializationDropdown(false)
                                }
                              }}
                              required
                              placeholder="Type or select specialization (e.g., Cardiology, General Medicine)"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                            {doctorSignupData.specialization && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDoctorSignupData(prev => ({ ...prev, specialization: '' }))
                                  setSpecializationSearchTerm('')
                                  setShowSpecializationDropdown(false)
                                  setTimeout(() => {
                                    if (specializationInputRef.current) {
                                      specializationInputRef.current.focus()
                                    }
                                  }, 0)
                                }}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 z-10"
                              >
                                <IoCloseOutline className="h-4 w-4" />
                              </button>
                            )}
                            {/* Dropdown */}
                            {showSpecializationDropdown && (
                              <div
                                ref={specializationDropdownRef}
                                className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg"
                              >
                                {filteredSpecializations.length > 0 ? (
                                  <div className="py-1">
                                    {filteredSpecializations.map((spec, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                          setDoctorSignupData(prev => ({ ...prev, specialization: spec }))
                                          setSpecializationSearchTerm(spec)
                                          setShowSpecializationDropdown(false)
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-[#11496c] hover:text-white transition-colors flex items-center gap-2"
                                      >
                                        <IoMedicalOutline className="h-4 w-4 flex-shrink-0" />
                                        <span>{spec}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="px-4 py-3 text-sm text-slate-500">
                                    No matching specializations found. You can type your own.
                                  </div>
                                )}
                                {/* Option to use typed value - show when user has typed something that doesn't match any option */}
                                {doctorSignupData.specialization.trim() &&
                                  !filteredSpecializations.some(s => s.toLowerCase() === doctorSignupData.specialization.trim().toLowerCase()) && (
                                    <div className="border-t border-slate-200">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Value is already set in the input, just close dropdown
                                          setShowSpecializationDropdown(false)
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-[#11496c] hover:bg-[#11496c] hover:text-white transition-colors flex items-center gap-2 font-medium"
                                      >
                                        <IoAddOutline className="h-4 w-4 flex-shrink-0" />
                                        <span>Use "{doctorSignupData.specialization.trim()}" (Press Enter or click)</span>
                                      </button>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Select from list or type your own specialization
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="gender" className="text-sm font-semibold text-slate-700">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={doctorSignupData.gender}
                            onChange={handleDoctorSignupChange}
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="licenseNumber" className="text-sm font-semibold text-slate-700">
                            License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="licenseNumber"
                              name="licenseNumber"
                              type="text"
                              value={doctorSignupData.licenseNumber}
                              onChange={handleDoctorSignupChange}
                              required
                              placeholder="Enter your medical license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="experienceYears" className="text-sm font-semibold text-slate-700">
                            Experience (Years)
                          </label>
                          <input
                            id="experienceYears"
                            name="experienceYears"
                            type="number"
                            min="0"
                            value={doctorSignupData.experienceYears}
                            onChange={handleDoctorSignupChange}
                            placeholder="5"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="qualification" className="text-sm font-semibold text-slate-700">
                            Qualification
                          </label>
                          <input
                            id="qualification"
                            name="qualification"
                            value={doctorSignupData.qualification}
                            onChange={handleDoctorSignupChange}
                            placeholder="MBBS, MD, etc."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                            Bio
                          </label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={doctorSignupData.bio}
                            onChange={handleDoctorSignupChange}
                            rows="3"
                            placeholder="Tell us about your professional background..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="consultationFee" className="text-sm font-semibold text-slate-700">
                            Consultation Fee (₹)
                          </label>
                          <input
                            id="consultationFee"
                            name="consultationFee"
                            type="number"
                            min="0"
                            step="1"
                            value={doctorSignupData.consultationFee}
                            onChange={handleDoctorSignupChange}
                            placeholder="500"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Consultation Modes */}
                      <section>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Consultation Modes
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                            <input
                              type="checkbox"
                              name="consultationModes"
                              value="in_person"
                              checked={doctorSignupData.consultationModes.includes('in_person')}
                              onChange={handleDoctorSignupChange}
                              className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                            />
                            <IoPersonOutline className="h-5 w-5 text-slate-600" />
                            <span className="text-sm text-slate-700 capitalize">In Person</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                            <input
                              type="checkbox"
                              name="consultationModes"
                              value="call"
                              checked={doctorSignupData.consultationModes.includes('call')}
                              onChange={handleDoctorSignupChange}
                              className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                            />
                            <IoCallOutline className="h-5 w-5 text-slate-600" />
                            <span className="text-sm text-slate-700 capitalize">Call</span>
                          </label>
                        </div>
                      </section>

                      {/* Languages */}
                      <section>
                        <label htmlFor="languages" className="text-sm font-semibold text-slate-700 mb-2 block">
                          Languages Spoken
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {doctorSignupData.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 rounded-full bg-[#11496c] px-3 py-1 text-xs font-semibold text-white"
                            >
                              {lang}
                              <button
                                type="button"
                                onClick={() => removeLanguage(lang)}
                                className="hover:text-slate-200"
                                aria-label={`Remove ${lang}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoLanguageOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="languages"
                            name="languages"
                            type="text"
                            placeholder="Enter language and press Enter"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleDoctorSignupChange({ target: { name: 'languages', value: e.target.value } })
                                e.target.value = ''
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Education */}
                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Education
                          </label>
                          <button
                            type="button"
                            onClick={addEducationEntry}
                            className="text-xs font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                          >
                            + Add Education
                          </button>
                        </div>
                        <div className="space-y-3">
                          {doctorSignupData.education.map((edu, index) => (
                            <div key={index} className="grid gap-3 sm:gap-4 sm:grid-cols-3 p-3 rounded-xl bg-slate-50">
                              <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                  <IoSchoolOutline className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <input
                                  name={`education.${index}.institution`}
                                  value={edu.institution}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="Institution"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                              </div>
                              <input
                                name={`education.${index}.degree`}
                                value={edu.degree}
                                onChange={handleDoctorSignupChange}
                                placeholder="Degree"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                              <div className="flex gap-2">
                                <input
                                  name={`education.${index}.year`}
                                  type="number"
                                  value={edu.year}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="Year"
                                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                                {doctorSignupData.education.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeEducationEntry(index)}
                                    className="px-3 text-red-500 hover:text-red-700 transition"
                                    aria-label="Remove education entry"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Clinic Details & Terms */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Clinic Details</h3>
                        <p className="text-xs text-slate-500">Tell us about your clinic or practice</p>
                      </div>
                      {/* Clinic Details */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoLocationOutline className="h-5 w-5 text-[#11496c]" />
                          Clinic Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="clinicDetails.name" className="text-sm font-semibold text-slate-700">
                              Clinic Name
                            </label>
                            <input
                              id="clinicDetails.name"
                              name="clinicDetails.name"
                              value={doctorSignupData.clinicDetails.name}
                              onChange={handleDoctorSignupChange}
                              placeholder="ABC Medical Clinic"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <label htmlFor="clinicDetails.address.line1" className="text-sm font-semibold text-slate-700">
                                Address Line 1
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                  <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <input
                                  id="clinicDetails.address.line1"
                                  name="clinicDetails.address.line1"
                                  value={doctorSignupData.clinicDetails.address.line1}
                                  onChange={handleDoctorSignupChange}
                                  placeholder="123 Health Street"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                  style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.line2" className="text-sm font-semibold text-slate-700">
                                Address Line 2 (optional)
                              </label>
                              <input
                                id="clinicDetails.address.line2"
                                name="clinicDetails.address.line2"
                                value={doctorSignupData.clinicDetails.address.line2}
                                onChange={handleDoctorSignupChange}
                                placeholder="Apartment or suite"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.city" className="text-sm font-semibold text-slate-700">
                                City
                              </label>
                              <input
                                id="clinicDetails.address.city"
                                name="clinicDetails.address.city"
                                value={doctorSignupData.clinicDetails.address.city}
                                onChange={handleDoctorSignupChange}
                                placeholder="Mumbai"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.state" className="text-sm font-semibold text-slate-700">
                                State
                              </label>
                              <input
                                id="clinicDetails.address.state"
                                name="clinicDetails.address.state"
                                value={doctorSignupData.clinicDetails.address.state}
                                onChange={handleDoctorSignupChange}
                                placeholder="Maharashtra"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.postalCode" className="text-sm font-semibold text-slate-700">
                                Postal Code
                              </label>
                              <input
                                id="clinicDetails.address.postalCode"
                                name="clinicDetails.address.postalCode"
                                value={doctorSignupData.clinicDetails.address.postalCode}
                                onChange={handleDoctorSignupChange}
                                placeholder="400001"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="clinicDetails.address.country" className="text-sm font-semibold text-slate-700">
                                Country
                              </label>
                              <input
                                id="clinicDetails.address.country"
                                name="clinicDetails.address.country"
                                value={doctorSignupData.clinicDetails.address.country}
                                onChange={handleDoctorSignupChange}
                                placeholder="India"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your professional documents for verification (License, Certificates, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'doctor')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {doctorSignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({doctorSignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {doctorSignupData.documents.map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index, 'doctor')}
                                      className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      <IoCloseOutline className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Terms */}
                      <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={doctorSignupData.termsAccepted}
                          onChange={handleDoctorSignupChange}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                        />
                        <span>
                          I have read and agree to Healiinn's{' '}
                          <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            terms of service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex gap-3">
                      {signupStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                        >
                          Previous
                        </button>
                      )}
                      {signupStep < totalSignupSteps ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          Next
                          <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !doctorSignupData.termsAccepted}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Signup
                              <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
            ) : selectedModule === 'pharmacy' ? (
              <motion.div
                key="signup-pharmacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${signupStep === step
                            ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                            : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={`h-1.5 w-12 sm:w-16 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Information'}
                      {signupStep === 2 && 'Professional Details'}
                      {signupStep === 3 && 'Additional Information'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePharmacySignupSubmit} className="flex flex-col gap-5 sm:gap-6">
                  {/* Step 1: Basic Information */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Basic Information</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="pharmacyName" className="text-sm font-semibold text-slate-700">
                            Pharmacy Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacyName"
                              name="pharmacyName"
                              type="text"
                              value={pharmacySignupData.pharmacyName}
                              onChange={handlePharmacySignupChange}
                              required
                              placeholder="ABC Pharmacy"
                              maxLength={100}
                              minLength={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="ownerName" className="text-sm font-semibold text-slate-700">
                            Owner Name
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="ownerName"
                              name="ownerName"
                              value={pharmacySignupData.ownerName}
                              onChange={handlePharmacySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-email"
                              name="email"
                              type="email"
                              value={pharmacySignupData.email}
                              onChange={handlePharmacySignupChange}
                              autoComplete="email"
                              required
                              placeholder="pharmacy@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-phone" className="text-sm font-semibold text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-phone"
                              name="phone"
                              type="tel"
                              value={pharmacySignupData.phone}
                              onChange={handlePharmacySignupChange}
                              autoComplete="tel"
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                    </motion.div>
                  )}

                  {/* Step 2: Business Details */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Business Details</h3>
                        <p className="text-xs text-slate-500">Help us understand your business better</p>
                      </div>
                      {/* License & GST */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pharmacy-licenseNumber" className="text-sm font-semibold text-slate-700">
                            License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="pharmacy-licenseNumber"
                              name="licenseNumber"
                              type="text"
                              value={pharmacySignupData.licenseNumber}
                              onChange={handlePharmacySignupChange}
                              required
                              placeholder="Enter your pharmacy license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700">
                            GST Number
                          </label>
                          <input
                            id="gstNumber"
                            name="gstNumber"
                            value={pharmacySignupData.gstNumber}
                            onChange={handlePharmacySignupChange}
                            placeholder="GST123456789"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </section>

                      {/* Address */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoLocationOutline className="h-5 w-5 text-[#11496c]" />
                          Address
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="address.line1" className="text-sm font-semibold text-slate-700">
                              Address Line 1
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="address.line1"
                                name="address.line1"
                                value={pharmacySignupData.address.line1}
                                onChange={handlePharmacySignupChange}
                                placeholder="123 Pharmacy Street"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.line2" className="text-sm font-semibold text-slate-700">
                              Address Line 2 (optional)
                            </label>
                            <input
                              id="address.line2"
                              name="address.line2"
                              value={pharmacySignupData.address.line2}
                              onChange={handlePharmacySignupChange}
                              placeholder="Apartment or suite"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.city" className="text-sm font-semibold text-slate-700">
                              City
                            </label>
                            <input
                              id="address.city"
                              name="address.city"
                              value={pharmacySignupData.address.city}
                              onChange={handlePharmacySignupChange}
                              placeholder="Mumbai"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.state" className="text-sm font-semibold text-slate-700">
                              State
                            </label>
                            <input
                              id="address.state"
                              name="address.state"
                              value={pharmacySignupData.address.state}
                              onChange={handlePharmacySignupChange}
                              placeholder="Maharashtra"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.postalCode" className="text-sm font-semibold text-slate-700">
                              Postal Code
                            </label>
                            <input
                              id="address.postalCode"
                              name="address.postalCode"
                              value={pharmacySignupData.address.postalCode}
                              onChange={handlePharmacySignupChange}
                              placeholder="400001"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="address.country" className="text-sm font-semibold text-slate-700">
                              Country
                            </label>
                            <input
                              id="address.country"
                              name="address.country"
                              value={pharmacySignupData.address.country}
                              onChange={handlePharmacySignupChange}
                              placeholder="India"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                      {/* Operating Timings */}
                      <section>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="timings" className="text-sm font-semibold text-slate-700">
                            Operating Timings
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoTimeOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="timings"
                              name="timings"
                              value={pharmacySignupData.timings}
                              onChange={handlePharmacySignupChange}
                              placeholder="9:00 AM - 9:00 PM"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Contact Person & Terms */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Person</h3>
                        <p className="text-xs text-slate-500">Who should we contact for business matters?</p>
                      </div>
                      {/* Contact Person */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoPersonOutline className="h-5 w-5 text-[#11496c]" />
                          Contact Person
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="contactPerson.name" className="text-sm font-semibold text-slate-700">
                              Name
                            </label>
                            <input
                              id="contactPerson.name"
                              name="contactPerson.name"
                              value={pharmacySignupData.contactPerson.name}
                              onChange={handlePharmacySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="contactPerson.phone" className="text-sm font-semibold text-slate-700">
                              Phone
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="contactPerson.phone"
                                name="contactPerson.phone"
                                value={pharmacySignupData.contactPerson.phone}
                                onChange={handlePharmacySignupChange}
                                placeholder="9876543210"
                                maxLength={10}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="contactPerson.email" className="text-sm font-semibold text-slate-700">
                              Email
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="contactPerson.email"
                                name="contactPerson.email"
                                type="email"
                                value={pharmacySignupData.contactPerson.email}
                                onChange={handlePharmacySignupChange}
                                placeholder="contact@example.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your business documents for verification (License, GST Certificate, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'pharmacy')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {pharmacySignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({pharmacySignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {pharmacySignupData.documents.map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index, 'pharmacy')}
                                      className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      <IoCloseOutline className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Terms */}
                      <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={pharmacySignupData.termsAccepted}
                          onChange={handlePharmacySignupChange}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                        />
                        <span>
                          I have read and agree to Healiinn's{' '}
                          <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            terms of service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex gap-3">
                      {signupStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                        >
                          Previous
                        </button>
                      )}
                      {signupStep < totalSignupSteps ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          Next
                          <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !pharmacySignupData.termsAccepted}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Signup
                              <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
            ) : selectedModule === 'laboratory' ? (
              <motion.div
                key="signup-laboratory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${signupStep === step
                            ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                            : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 3 && (
                          <div
                            className={`h-1.5 w-12 sm:w-16 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Information'}
                      {signupStep === 2 && 'Professional Details'}
                      {signupStep === 3 && 'Additional Information'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLaboratorySignupSubmit} className="flex flex-col gap-5 sm:gap-6">
                  {/* Step 1: Basic Information */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Basic Information</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label htmlFor="labName" className="text-sm font-semibold text-slate-700">
                            Laboratory Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="labName"
                              name="labName"
                              type="text"
                              value={laboratorySignupData.labName}
                              onChange={handleLaboratorySignupChange}
                              required
                              placeholder="ABC Diagnostic Laboratory"
                              maxLength={100}
                              minLength={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lab-ownerName" className="text-sm font-semibold text-slate-700">
                            Owner Name
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="lab-ownerName"
                              name="ownerName"
                              value={laboratorySignupData.ownerName}
                              onChange={handleLaboratorySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lab-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="lab-email"
                              name="email"
                              type="email"
                              value={laboratorySignupData.email}
                              onChange={handleLaboratorySignupChange}
                              autoComplete="email"
                              required
                              placeholder="lab@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lab-phone" className="text-sm font-semibold text-slate-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="lab-phone"
                              name="phone"
                              type="tel"
                              value={laboratorySignupData.phone}
                              onChange={handleLaboratorySignupChange}
                              autoComplete="tel"
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                    </motion.div>
                  )}

                  {/* Step 2: Business Details */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Business Details</h3>
                        <p className="text-xs text-slate-500">Help us understand your business better</p>
                      </div>
                      {/* License */}
                      <section>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lab-licenseNumber" className="text-sm font-semibold text-slate-700">
                            License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="lab-licenseNumber"
                              name="licenseNumber"
                              type="text"
                              value={laboratorySignupData.licenseNumber}
                              onChange={handleLaboratorySignupChange}
                              required
                              placeholder="Enter your laboratory license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                      {/* GST Number */}
                      <section>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="gstNumber" className="text-sm font-semibold text-slate-700">
                            GST Number
                          </label>
                          <div className="relative">
                            <input
                              id="gstNumber"
                              name="gstNumber"
                              type="text"
                              value={laboratorySignupData.gstNumber}
                              onChange={handleLaboratorySignupChange}
                              placeholder="Enter GST number"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                      {/* Address */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoLocationOutline className="h-5 w-5 text-[#11496c]" />
                          Address
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="lab-address.line1" className="text-sm font-semibold text-slate-700">
                              Address Line 1
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="lab-address.line1"
                                name="address.line1"
                                value={laboratorySignupData.address.line1}
                                onChange={handleLaboratorySignupChange}
                                placeholder="123 Lab Street"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-address.line2" className="text-sm font-semibold text-slate-700">
                              Address Line 2 (optional)
                            </label>
                            <input
                              id="lab-address.line2"
                              name="address.line2"
                              value={laboratorySignupData.address.line2}
                              onChange={handleLaboratorySignupChange}
                              placeholder="Apartment or suite"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-address.city" className="text-sm font-semibold text-slate-700">
                              City
                            </label>
                            <input
                              id="lab-address.city"
                              name="address.city"
                              value={laboratorySignupData.address.city}
                              onChange={handleLaboratorySignupChange}
                              placeholder="Mumbai"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-address.state" className="text-sm font-semibold text-slate-700">
                              State
                            </label>
                            <input
                              id="lab-address.state"
                              name="address.state"
                              value={laboratorySignupData.address.state}
                              onChange={handleLaboratorySignupChange}
                              placeholder="Maharashtra"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-address.postalCode" className="text-sm font-semibold text-slate-700">
                              Postal Code
                            </label>
                            <input
                              id="lab-address.postalCode"
                              name="address.postalCode"
                              value={laboratorySignupData.address.postalCode}
                              onChange={handleLaboratorySignupChange}
                              placeholder="400001"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-address.country" className="text-sm font-semibold text-slate-700">
                              Country
                            </label>
                            <input
                              id="lab-address.country"
                              name="address.country"
                              value={laboratorySignupData.address.country}
                              onChange={handleLaboratorySignupChange}
                              placeholder="India"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                      </section>

                      {/* Timings & Operating Hours */}
                      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="lab-timings" className="text-sm font-semibold text-slate-700">
                            Operating Timings
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoTimeOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="lab-timings"
                              name="timings"
                              value={laboratorySignupData.timings}
                              onChange={handleLaboratorySignupChange}
                              placeholder="9:00 AM - 9:00 PM"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="operatingHours.opening" className="text-sm font-semibold text-slate-700">
                            Opening Time
                          </label>
                          <input
                            id="operatingHours.opening"
                            name="operatingHours.opening"
                            value={laboratorySignupData.operatingHours.opening}
                            onChange={handleLaboratorySignupChange}
                            placeholder="9:00 AM"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="operatingHours.closing" className="text-sm font-semibold text-slate-700">
                            Closing Time
                          </label>
                          <input
                            id="operatingHours.closing"
                            name="operatingHours.closing"
                            value={laboratorySignupData.operatingHours.closing}
                            onChange={handleLaboratorySignupChange}
                            placeholder="9:00 PM"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Operating Days
                          </label>
                          <div className="grid gap-2 sm:grid-cols-4">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                              <label key={day} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  name="operatingHours.days"
                                  value={day}
                                  checked={laboratorySignupData.operatingHours.days.includes(day)}
                                  onChange={handleLaboratorySignupChange}
                                  className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                                />
                                <span className="text-sm text-slate-700">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Contact Person & Terms */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Person</h3>
                        <p className="text-xs text-slate-500">Who should we contact for business matters?</p>
                      </div>
                      {/* Contact Person */}
                      <section>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <IoPersonOutline className="h-5 w-5 text-[#11496c]" />
                          Contact Person
                        </h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-contactPerson.name" className="text-sm font-semibold text-slate-700">
                              Name
                            </label>
                            <input
                              id="lab-contactPerson.name"
                              name="contactPerson.name"
                              value={laboratorySignupData.contactPerson.name}
                              onChange={handleLaboratorySignupChange}
                              placeholder="John Doe"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                              style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="lab-contactPerson.phone" className="text-sm font-semibold text-slate-700">
                              Phone
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="lab-contactPerson.phone"
                                name="contactPerson.phone"
                                value={laboratorySignupData.contactPerson.phone}
                                onChange={handleLaboratorySignupChange}
                                placeholder="9876543210"
                                maxLength={10}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label htmlFor="lab-contactPerson.email" className="text-sm font-semibold text-slate-700">
                              Email
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                                <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <input
                                id="lab-contactPerson.email"
                                name="contactPerson.email"
                                type="email"
                                value={laboratorySignupData.contactPerson.email}
                                onChange={handleLaboratorySignupChange}
                                placeholder="contact@example.com"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                                style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your business documents for verification (License, GST Certificate, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'laboratory')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {laboratorySignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({laboratorySignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {laboratorySignupData.documents.map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index, 'laboratory')}
                                      className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      <IoCloseOutline className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Terms */}
                      <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={laboratorySignupData.termsAccepted}
                          onChange={handleLaboratorySignupChange}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                        />
                        <span>
                          I have read and agree to Healiinn's{' '}
                          <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            terms of service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex gap-3">
                      {signupStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                        >
                          Previous
                        </button>
                      )}
                      {signupStep < totalSignupSteps ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          Next
                          <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !laboratorySignupData.termsAccepted}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Signup
                              <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
            ) : selectedModule === 'nurse' ? (
              <motion.div
                key="signup-nurse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:gap-6"
              >
                {/* Enhanced Step Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${signupStep === step
                            ? 'bg-[#11496c] text-white scale-110 shadow-md shadow-[#11496c]/30'
                            : signupStep > step
                              ? 'bg-[#11496c] text-white'
                              : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                          {signupStep > step ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        {step < 4 && (
                          <div
                            className={`h-1.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      Step {signupStep} of {totalSignupSteps}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {signupStep === 1 && 'Basic Details'}
                      {signupStep === 2 && 'Address Details'}
                      {signupStep === 3 && 'Professional Details'}
                      {signupStep === 4 && 'Document Uploads'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleNurseSignupSubmit} className="flex flex-col gap-5 sm:gap-6" encType="multipart/form-data">
                  {/* Step 1: Basic Details */}
                  {signupStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">🧑‍⚕️ Basic Details</h3>
                        <p className="text-xs text-slate-500">Let's start with your essential details</p>
                      </div>
                      {/* Basic Information */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-fullName" className="text-sm font-semibold text-slate-700">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoPersonOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-fullName"
                              name="fullName"
                              type="text"
                              value={nurseSignupData.fullName}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Enter your full name"
                              minLength={2}
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-email" className="text-sm font-semibold text-slate-700">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-email"
                              name="email"
                              type="email"
                              value={nurseSignupData.email}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="you@example.com"
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-phone" className="text-sm font-semibold text-slate-700">
                            Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-phone"
                              name="phone"
                              type="tel"
                              value={nurseSignupData.phone}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="9876543210"
                              maxLength={10}
                              inputMode="numeric"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 2: Address Details */}
                  {signupStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">📍 Address Details</h3>
                        <p className="text-xs text-slate-500">Enter your complete address</p>
                      </div>
                      {/* Address */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.line1" className="text-sm font-semibold text-slate-700">
                            Complete Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoLocationOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-address.line1"
                              name="address.line1"
                              type="text"
                              value={nurseSignupData.address.line1}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Street address, building name, etc."
                              maxLength={200}
                              minLength={5}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.city" className="text-sm font-semibold text-slate-700">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.city"
                            name="address.city"
                            type="text"
                            value={nurseSignupData.address.city}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="Mumbai"
                            maxLength={100}
                            minLength={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.state" className="text-sm font-semibold text-slate-700">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.state"
                            name="address.state"
                            type="text"
                            value={nurseSignupData.address.state}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="Maharashtra"
                            maxLength={100}
                            minLength={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-address.postalCode" className="text-sm font-semibold text-slate-700">
                            Pincode <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-address.postalCode"
                            name="address.postalCode"
                            type="text"
                            value={nurseSignupData.address.postalCode}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="400001"
                            maxLength={6}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 3: Professional Details */}
                  {signupStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">🎓 Professional Details</h3>
                        <p className="text-xs text-slate-500">VERY IMPORTANT for admin verification</p>
                      </div>
                      {/* Professional Details */}
                      <section className="grid gap-3 sm:gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-qualification" className="text-sm font-semibold text-slate-700">
                            Qualification <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoSchoolOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-qualification"
                              name="qualification"
                              type="text"
                              value={nurseSignupData.qualification}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="GNM, B.Sc Nursing, ANM, D.Pharm, etc."
                              maxLength={100}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-experienceYears" className="text-sm font-semibold text-slate-700">
                            Experience (in years)
                          </label>
                          <input
                            id="nurse-experienceYears"
                            name="experienceYears"
                            type="number"
                            value={nurseSignupData.experienceYears}
                            onChange={handleNurseSignupChange}
                            min="0"
                            max="50"
                            placeholder="5"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-specialization" className="text-sm font-semibold text-slate-700">
                            Specialization <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoMedicalOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <select
                              id="nurse-specialization"
                              name="specialization"
                              value={nurseSignupData.specialization}
                              onChange={handleNurseSignupChange}
                              required
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 appearance-none"
                            >
                              <option value="Home Care Nurse">Home Care Nurse</option>
                            </select>
                            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 pr-3">
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-fees" className="text-sm font-semibold text-slate-700">
                            Fees (₹)
                          </label>
                          <input
                            id="nurse-fees"
                            name="fees"
                            type="number"
                            min="0"
                            max="999999"
                            step="1"
                            value={nurseSignupData.fees}
                            onChange={handleNurseSignupChange}
                            placeholder="500"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-registrationNumber" className="text-sm font-semibold text-slate-700">
                            Registration Number / License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                              <IoDocumentTextOutline className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <input
                              id="nurse-registrationNumber"
                              name="registrationNumber"
                              type="text"
                              value={nurseSignupData.registrationNumber}
                              onChange={handleNurseSignupChange}
                              required
                              placeholder="Enter your registration/license number"
                              maxLength={50}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="nurse-registrationCouncilName" className="text-sm font-semibold text-slate-700">
                            Registration Council/Board Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="nurse-registrationCouncilName"
                            name="registrationCouncilName"
                            type="text"
                            value={nurseSignupData.registrationCouncilName}
                            onChange={handleNurseSignupChange}
                            required
                            placeholder="e.g., Indian Nursing Council, State Nursing Council"
                            maxLength={100}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          />
                        </div>
                      </section>
                    </motion.div>
                  )}

                  {/* Step 4: Document Uploads & Terms */}
                  {signupStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="mb-6 pb-4 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">📄 Document Uploads</h3>
                        <p className="text-xs text-slate-500">Proof Verification - Upload your certificates</p>
                      </div>
                      {/* Document Uploads */}
                      <section>
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <IoDocumentTextOutline className="h-5 w-5 text-[#11496c]" />
                            Upload Documents (PDF)
                          </h3>
                          <p className="text-xs text-slate-500 mb-3">
                            Upload your professional documents for verification (Nursing Certificate, Registration Certificate, etc.)
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="file"
                              accept=".pdf"
                              multiple
                              onChange={(e) => handleDocumentUpload(e, 'nurse')}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#11496c] file:text-white hover:file:bg-[#0d3a52]"
                            />
                            <p className="text-xs text-slate-500">
                              Accepted format: PDF only. Maximum file size: 5MB per file. Maximum 10 files.
                            </p>
                          </div>
                          {nurseSignupData.documents && nurseSignupData.documents.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-700">
                                Uploaded Documents ({nurseSignupData.documents.length}/10):
                              </p>
                              <div className="space-y-2">
                                {nurseSignupData.documents.map((doc, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <IoDocumentTextOutline className="h-4 w-4 text-[#11496c] flex-shrink-0" />
                                      <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index, 'nurse')}
                                      className="ml-2 text-red-500 hover:text-red-700 transition flex-shrink-0"
                                      aria-label={`Remove ${doc.name}`}
                                    >
                                      <IoCloseOutline className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Terms */}
                      <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={nurseSignupData.termsAccepted}
                          onChange={handleNurseSignupChange}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                        />
                        <span>
                          I have read and agree to Healiinn's{' '}
                          <Link to="/terms" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            terms of service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                            privacy policy
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="flex gap-3">
                      {signupStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePreviousStep}
                          className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2"
                        >
                          Previous
                        </button>
                      )}
                      {signupStep < totalSignupSteps ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          Next
                          <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !nurseSignupData.termsAccepted}
                          className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${signupStep > 1 ? 'flex-1' : 'w-full'
                            }`}
                          style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Signup
                              <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition"
                  >
                    Sign in instead
                  </button>
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/95 backdrop-blur mt-auto">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-4 text-center text-xs text-slate-500">
          <span>Secure access powered by Healiinn</span>
          <span>
            Need help? Contact{' '}
            <Link to="/support" className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition">
              support
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

export default DoctorLogin

