import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoCallOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoCalendarClearOutline,
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
  const [mode, setMode] = useState('login')
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: true })
  const [signupData, setSignupData] = useState(initialSignupState)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLogin = mode === 'login'

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setIsSubmitting(false)
    setShowLoginPassword(false)
    setShowSignupPassword(false)
    setShowSignupConfirm(false)
  }

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
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

  const handleLoginSubmit = (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
    }, 1200)
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
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-[rgba(17,73,108,0.05)] via-white to-[rgba(17,73,108,0.05)]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-6 top-10 h-40 w-40 rounded-full bg-[rgba(17,73,108,0.15)] blur-2xl" />
        <div className="absolute right-6 bottom-14 h-48 w-48 rounded-full bg-[rgba(17,73,108,0.15)] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border bg-white shadow-2xl" style={{ borderColor: 'rgba(17, 73, 108, 0.2)', boxShadow: '0 25px 50px -12px rgba(17, 73, 108, 0.15)' }}>
          <div className="absolute -left-16 bottom-0 h-28 w-28 rounded-full bg-[rgba(17,73,108,0.35)] blur-3xl" />
          <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[rgba(17,73,108,0.35)] blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {isLogin ? 'Sign in to your care account' : 'Create your Healiinn patient profile'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isLogin
                    ? 'Access appointments, prescriptions, and personalized guidance.'
                    : 'Tell us a bit about yourself so we can personalize your care experience.'}
                </p>
              </div>

              <div className="mx-auto flex items-center gap-3 rounded-full bg-[rgba(17,73,108,0.05)] px-2 py-2 text-xs font-semibold uppercase tracking-[0.3em] sm:mx-0" style={{ color: '#11496c' }}>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`rounded-full px-3 py-1 transition ${
                    isLogin ? 'text-white shadow-sm' : 'hover:bg-[rgba(17,73,108,0.35)]'
                  }`}
                  style={isLogin ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : { color: '#11496c' }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={`rounded-full px-3 py-1 transition ${
                    !isLogin ? 'text-white shadow-sm' : 'hover:bg-[rgba(17,73,108,0.35)]'
                  }`}
                  style={!isLogin ? { backgroundColor: '#11496c', boxShadow: '0 1px 2px 0 rgba(17, 73, 108, 0.2)' } : { color: '#11496c' }}
                >
                  Signup
                </button>
              </div>
            </div>

            {isLogin ? (
              <form className="flex flex-col gap-6" onSubmit={handleLoginSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoMailOutline className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-base text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#11496c] transition hover:text-[#0d3a52]"
                    >
                      {showLoginPassword ? (
                        <>
                          <IoEyeOffOutline className="h-4 w-4" aria-hidden="true" />
                          Hide
                        </>
                      ) : (
                        <>
                          <IoEyeOutline className="h-4 w-4" aria-hidden="true" />
                          Show
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#11496c]">
                      <IoLockClosedOutline className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-base text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
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
                  <Link to="/patient/forgot-password" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign In
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  New to Healiinn?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52]"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={handleSignupSubmit}>
                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                      First Name
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-email" className="text-sm font-semibold text-slate-700">
                      Email Address
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Phone Number
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
                        placeholder="+91 98765 43210"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-password" className="text-sm font-semibold text-slate-700">
                      Password
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      Confirm Password
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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

                <section className="grid gap-4 sm:grid-cols-2">
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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

                <section className="grid gap-4 sm:grid-cols-2">
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                    />
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                        placeholder="+91 98765 43100"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:outline-none focus:ring-2"
                    />
                  </div>
                </section>

                <label className="flex items-start gap-3 rounded-2xl bg-[rgba(17,73,108,0.05)]/70 px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={signupData.termsAccepted}
                    onChange={handleSignupChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl text-base font-semibold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    'Submitting application...'
                  ) : (
                    <>
                      Complete Signup
                      <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#11496c] hover:text-[#0d3a52]"
                  >
                    Sign in instead
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        <footer className="mt-8 space-y-4 text-center text-xs text-slate-500">
          <span>Secure patient access powered by Healiinn</span>
          <span>
            Need help? Contact your{' '}
            <Link to="/patient/support" className="font-semibold text-[#11496c] hover:text-[#0d3a52]">
              care coordinator
            </Link>
          </span>
        </footer>
      </div>
    </div>
  )
}

export default PatientLogin

