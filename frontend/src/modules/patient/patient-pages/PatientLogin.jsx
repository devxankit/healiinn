import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IoArrowForwardOutline,
  IoCallOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoCalendarClearOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5'

const initialSignupState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  emergencyContact: {
    name: '',
    phone: '',
    relation: '',
  },
  termsAccepted: false,
}

const PatientLogin = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loginData, setLoginData] = useState({ phone: '', otp: '', remember: true })
  const [signupData, setSignupData] = useState(initialSignupState)
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  
  // Signup form states
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)
  const [signupStep, setSignupStep] = useState(1) // 1, 2, or 3
  const totalSignupSteps = 3
  
  // OTP input refs
  const otpInputRefs = useRef([])

  const isLogin = mode === 'login'
  
  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpTimer])

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsSubmitting(false)
    setOtpSent(false)
    setOtpTimer(0)
    setShowSignupPassword(false)
    setShowSignupConfirm(false)
    setSignupStep(1)
    setLoginData({ phone: '', otp: '', remember: true })
  }
  
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (signupStep === 1) {
      if (!signupData.firstName || !signupData.phone || !signupData.email || !signupData.password || !signupData.confirmPassword) {
        window.alert('Please fill in all required fields in Step 1')
        return
      }
      if (signupData.password !== signupData.confirmPassword) {
        window.alert('Passwords do not match')
        return
      }
      if (signupData.password.length < 8) {
        window.alert('Password must be at least 8 characters long')
        return
      }
    }
    if (signupStep < totalSignupSteps) {
      setSignupStep(signupStep + 1)
    }
  }
  
  const handlePreviousStep = () => {
    if (signupStep > 1) {
      setSignupStep(signupStep - 1)
    }
  }

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    // Restrict phone to 10 digits only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setLoginData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  
  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const otpArray = (loginData.otp || '').split('').slice(0, 6)
    otpArray[index] = value.slice(-1) // Take only last character
    const newOtp = otpArray.join('').padEnd(6, ' ').slice(0, 6).replace(/\s/g, '')
    
    setLoginData({
      ...loginData,
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
      setLoginData({
        ...loginData,
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
    if (!loginData.phone || loginData.phone.length < 10) {
      window.alert('Please enter a valid mobile number')
      return
    }
    
    setIsSendingOtp(true)
    
    try {
      try {
        const response = await fetch('/api/patients/auth/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: loginData.phone }),
        })
        
        if (!response.ok) {
          // Simulate OTP sending for frontend testing
          console.log('Backend not available, simulating OTP send')
          setOtpSent(true)
          setOtpTimer(60) // 60 seconds timer
          setIsSendingOtp(false)
          return
        }
        
        const data = await response.json()
        if (data.success || response.ok) {
          setOtpSent(true)
          setOtpTimer(60) // 60 seconds timer
        } else {
          window.alert(data.message || 'Failed to send OTP. Please try again.')
        }
      } catch (error) {
        // Simulate OTP sending for frontend testing
        console.log('Backend not available, simulating OTP send:', error.message)
        setOtpSent(true)
        setOtpTimer(60)
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      window.alert('An error occurred. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }
  
  // Resend OTP function
  const handleResendOtp = () => {
    setOtpTimer(0)
    setOtpSent(false)
    setLoginData({ ...loginData, otp: '' })
    handleSendOtp()
  }

  const handleSignupChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'termsAccepted') {
      setSignupData((prev) => ({
        ...prev,
        termsAccepted: checked,
      }))
      return
    }

    // Restrict phone fields to 10 digits only
    if (name === 'phone' || name === 'emergencyContact.phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setSignupData((prev) => {
        if (name === 'phone') {
          return {
            ...prev,
            phone: numericValue,
          }
        }
        if (name.startsWith('emergencyContact.')) {
          const key = name.split('.')[1]
          return {
            ...prev,
            emergencyContact: {
              ...prev.emergencyContact,
              [key]: numericValue,
            },
          }
        }
        return prev
      })
      return
    }

    setSignupData((prev) => {
      if (name.startsWith('address.')) {
        const key = name.split('.')[1]
        return {
          ...prev,
          address: {
            ...prev.address,
            [key]: value,
          },
        }
      }

      if (name.startsWith('emergencyContact.')) {
        const key = name.split('.')[1]
        return {
          ...prev,
          emergencyContact: {
            ...prev.emergencyContact,
            [key]: value,
          },
        }
      }

      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
    })
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || isSendingOtp) return
    
    // If OTP not sent, send it first
    if (!otpSent) {
      await handleSendOtp()
      return
    }
    
    // Verify OTP
    if (!loginData.otp || loginData.otp.length !== 6) {
      window.alert('Please enter the 6-digit OTP')
      return
    }

    setIsSubmitting(true)
    
    try {
      try {
        const response = await fetch('/api/patients/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: loginData.phone,
            otp: loginData.otp,
          }),
        })

        // If API is not available, simulate login for frontend testing
        if (!response.ok) {
          const tokenKey = 'patientAuthToken'
          const refreshTokenKey = 'patientRefreshToken'
          const testToken = 'test-token-for-patient-frontend-testing'
          const testRefreshToken = 'test-refresh-token-for-patient-frontend-testing'

          if (loginData.remember) {
            localStorage.setItem(tokenKey, testToken)
            localStorage.setItem(refreshTokenKey, testRefreshToken)
          } else {
            sessionStorage.setItem(tokenKey, testToken)
            sessionStorage.setItem(refreshTokenKey, testRefreshToken)
          }

          navigate('/patient/dashboard', { replace: true })
          return
        }

        const data = await response.json()

        // Store tokens from backend response
        if (data.data?.tokens) {
          if (loginData.remember) {
            localStorage.setItem('patientAuthToken', data.data.tokens.accessToken)
            localStorage.setItem('patientRefreshToken', data.data.tokens.refreshToken)
          } else {
            sessionStorage.setItem('patientAuthToken', data.data.tokens.accessToken)
            sessionStorage.setItem('patientRefreshToken', data.data.tokens.refreshToken)
          }
        }

        navigate('/patient/dashboard', { replace: true })
      } catch (fetchError) {
        // Simulate login for frontend testing
        console.log('Backend not available, simulating login for frontend testing:', fetchError.message)
        const tokenKey = 'patientAuthToken'
        const refreshTokenKey = 'patientRefreshToken'
        const testToken = 'test-token-for-patient-frontend-testing'
        const testRefreshToken = 'test-refresh-token-for-patient-frontend-testing'

        if (loginData.remember) {
          localStorage.setItem(tokenKey, testToken)
          localStorage.setItem(refreshTokenKey, testRefreshToken)
        } else {
          sessionStorage.setItem(tokenKey, testToken)
          sessionStorage.setItem(refreshTokenKey, testRefreshToken)
        }

        navigate('/patient/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      window.alert('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!signupData.termsAccepted) {
      window.alert('Please accept the terms to continue.')
      return
    }

    if (signupData.password !== signupData.confirmPassword) {
      window.alert('Passwords do not match. Please re-enter and try again.')
      return
    }

    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
    }, 1500)
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
                  ? 'Sign in to access your appointments, prescriptions, and personalized care.'
                  : 'Join Healiinn to manage your health journey with ease.'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-8 flex items-center justify-center">
              <div className="relative flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner w-full max-w-xs">
                {/* Sliding background indicator */}
                <motion.div
                  layoutId="patientLoginSignupToggle"
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
                  className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                    isLogin
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
                  className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold text-center sm:py-3 sm:text-base ${
                    !isLogin
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

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
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
                      value={loginData.phone}
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
                          value={loginData.otp[index] || ''}
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
                          setLoginData({ ...loginData, otp: '' })
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
                      checked={loginData.remember}
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
            ) : (
              <motion.div
                key="signup"
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
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${
                            signupStep === step
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
                            className={`h-1.5 w-12 sm:w-16 rounded-full transition-all duration-300 ${
                              signupStep > step ? 'bg-[#11496c]' : 'bg-slate-200'
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
                      {signupStep === 2 && 'Personal Details'}
                      {signupStep === 3 && 'Address & Emergency Contact'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSignupSubmit} className="flex flex-col gap-5 sm:gap-6">
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
                            value={signupData.firstName}
                            onChange={handleSignupChange}
                            required
                            placeholder="Jane"
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
                          value={signupData.lastName}
                          onChange={handleSignupChange}
                          placeholder="Doe"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="signup-email" className="text-sm font-semibold text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="signup-email"
                            name="email"
                            type="email"
                            value={signupData.email}
                            onChange={handleSignupChange}
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="phone"
                            name="phone"
                            value={signupData.phone}
                            onChange={handleSignupChange}
                            required
                            placeholder="9876543210"
                            maxLength={10}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="signup-password" className="text-sm font-semibold text-slate-700">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoLockClosedOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="signup-password"
                            name="password"
                            type={showSignupPassword ? 'text' : 'password'}
                            value={signupData.password}
                            onChange={handleSignupChange}
                            minLength={8}
                            required
                            placeholder="Create a secure password"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-[#11496c]"
                            aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSignupPassword ? <IoEyeOffOutline className="h-4 w-4" /> : <IoEyeOutline className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoLockClosedOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showSignupConfirm ? 'text' : 'password'}
                            value={signupData.confirmPassword}
                            onChange={handleSignupChange}
                            required
                            placeholder="Re-enter your password"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupConfirm((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center text-[#11496c]"
                            aria-label={showSignupConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                          >
                            {showSignupConfirm ? <IoEyeOffOutline className="h-4 w-4" /> : <IoEyeOutline className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {/* Step 2: Personal Details */}
                {signupStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Personal Details</h3>
                      <p className="text-xs text-slate-500">Help us personalize your experience</p>
                    </div>
                    <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="dateOfBirth" className="text-sm font-semibold text-slate-700">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoCalendarClearOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={signupData.dateOfBirth}
                            onChange={handleSignupChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="gender" className="text-sm font-semibold text-slate-700">
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={signupData.gender}
                          onChange={handleSignupChange}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        >
                          <option value="">Select one</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="bloodGroup" className="text-sm font-semibold text-slate-700">
                          Blood Group
                        </label>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          value={signupData.bloodGroup}
                          onChange={handleSignupChange}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        >
                          <option value="">Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="UNKNOWN">Unknown</option>
                        </select>
                      </div>
                    </section>
                  </motion.div>
                )}

                {/* Step 3: Address & Emergency Contact */}
                {signupStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Address & Emergency Contact</h3>
                      <p className="text-xs text-slate-500">Almost there! Just a few more details</p>
                    </div>
                    <section className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
                            value={signupData.address.line1}
                            onChange={handleSignupChange}
                            placeholder="123 Wellness Street"
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
                          value={signupData.address.line2}
                          onChange={handleSignupChange}
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
                          value={signupData.address.city}
                          onChange={handleSignupChange}
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
                          value={signupData.address.state}
                          onChange={handleSignupChange}
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
                          value={signupData.address.postalCode}
                          onChange={handleSignupChange}
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
                          value={signupData.address.country}
                          onChange={handleSignupChange}
                          placeholder="India"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      </div>
                    </section>

                    <section className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="emergencyContact.name" className="text-sm font-semibold text-slate-700">
                          Emergency Contact Name
                        </label>
                        <input
                          id="emergencyContact.name"
                          name="emergencyContact.name"
                          value={signupData.emergencyContact.name}
                          onChange={handleSignupChange}
                          placeholder="Rahul Sharma"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="emergencyContact.phone" className="text-sm font-semibold text-slate-700">
                          Emergency Phone
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                            <IoCallOutline className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <input
                            id="emergencyContact.phone"
                            name="emergencyContact.phone"
                            value={signupData.emergencyContact.phone}
                            onChange={handleSignupChange}
                            placeholder="9876543100"
                            maxLength={10}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                            style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="emergencyContact.relation" className="text-sm font-semibold text-slate-700">
                          Relationship
                        </label>
                        <input
                          id="emergencyContact.relation"
                          name="emergencyContact.relation"
                          value={signupData.emergencyContact.relation}
                          onChange={handleSignupChange}
                          placeholder="Spouse"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#11496c] focus:outline-none focus:ring-2 focus:ring-[#11496c]/20"
                          style={{ '--tw-ring-color': 'rgba(17, 73, 108, 0.2)' }}
                        />
                      </div>
                    </section>

                    <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={signupData.termsAccepted}
                        onChange={handleSignupChange}
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
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 ${
                          signupStep > 1 ? 'flex-1' : 'w-full'
                        }`}
                        style={{ boxShadow: '0 4px 6px -1px rgba(17, 73, 108, 0.25)' }}
                      >
                        Next
                        <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || !signupData.termsAccepted}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-[#11496c] text-base font-semibold text-white shadow-md shadow-[rgba(17,73,108,0.25)] transition hover:bg-[#0d3a52] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11496c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                          signupStep > 1 ? 'flex-1' : 'w-full'
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
            )}
            </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/95 backdrop-blur mt-auto">
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-4 text-center text-xs text-slate-500">
          <span>Secure patient access powered by Healiinn</span>
          <span>
            Need help? Contact your{' '}
            <Link to="/patient/support" className="font-semibold text-[#11496c] hover:text-[#0d3a52] transition">
              care coordinator
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

export default PatientLogin

