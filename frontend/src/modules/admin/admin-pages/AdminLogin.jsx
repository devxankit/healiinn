import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IoEyeOffOutline,
  IoEyeOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'
import healinnLogo from '../../../assets/images/logo.png'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [loginData, setLoginData] = useState({ email: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!loginData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!loginData.password) {
      newErrors.password = 'Password is required'
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Store auth token
      if (loginData.remember) {
        localStorage.setItem('adminAuthToken', 'mock-admin-token')
      } else {
        sessionStorage.setItem('adminAuthToken', 'mock-admin-token')
      }
      
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ submit: 'Invalid credentials. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
          {/* Logo and Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src={healinnLogo}
                alt="Healiinn"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in to access the admin dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IoMailOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300 text-slate-900 focus:border-[#11496c] focus:ring-[#11496c]'
                  }`}
                  placeholder="admin@healiinn.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IoLockClosedOutline className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={loginData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300 text-slate-900 focus:border-[#11496c] focus:ring-[#11496c]'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <IoEyeOffOutline className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <IoEyeOutline className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={loginData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-[#11496c] focus:ring-[#11496c]"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-slate-600">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-[#11496c] hover:text-[#0d3a54] focus:outline-none focus:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#11496c] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d3a54] focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IoArrowForwardOutline className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
            <IoShieldCheckmarkOutline className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <p className="text-xs text-blue-800">
              This is a secure admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminLogin


