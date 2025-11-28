import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { getAuthToken } from './utils/apiClient'
import PatientNavbar from './modules/patient/patient-components/PatientNavbar'
import PatientDashboard from './modules/patient/patient-pages/PatientDashboard'
import PatientDoctors from './modules/patient/patient-pages/PatientDoctors'
import PatientDoctorDetails from './modules/patient/patient-pages/PatientDoctorDetails'
import PatientProfile from './modules/patient/patient-pages/PatientProfile'
import PatientLocations from './modules/patient/patient-pages/PatientLocations'
import PatientPrescriptions from './modules/patient/patient-pages/PatientPrescriptions'
import PatientReports from './modules/patient/patient-pages/PatientReports'
import PatientRequests from './modules/patient/patient-pages/PatientRequests'
import PatientHospitals from './modules/patient/patient-pages/PatientHospitals'
import PatientHospitalDoctors from './modules/patient/patient-pages/PatientHospitalDoctors'
import PatientSpecialties from './modules/patient/patient-pages/PatientSpecialties'
import PatientSpecialtyDoctors from './modules/patient/patient-pages/PatientSpecialtyDoctors'
import PatientUpcomingSchedules from './modules/patient/patient-pages/PatientUpcomingSchedules'
import PatientLogin from './modules/patient/patient-pages/PatientLogin'
import PatientTransactions from './modules/patient/patient-pages/PatientTransactions'
import PatientAppointments from './modules/patient/patient-pages/PatientAppointments'
import PatientOrders from './modules/patient/patient-pages/PatientOrders'
import PatientSupport from './modules/patient/patient-pages/PatientSupport'
import PatientHistory from './modules/patient/patient-pages/PatientHistory'
import DoctorNavbar from './modules/doctor/doctor-components/DoctorNavbar'
import DoctorLogin from './modules/doctor/doctor-pages/DoctorLogin'
import DoctorDashboard from './modules/doctor/doctor-pages/DoctorDashboard'
import DoctorProfile from './modules/doctor/doctor-pages/DoctorProfile'
import DoctorWallet from './modules/doctor/doctor-pages/DoctorWallet'
import WalletBalance from './modules/doctor/doctor-pages/WalletBalance'
import WalletEarning from './modules/doctor/doctor-pages/WalletEarning'
import WalletWithdraw from './modules/doctor/doctor-pages/WalletWithdraw'
import WalletTransaction from './modules/doctor/doctor-pages/WalletTransaction'
import DoctorConsultations from './modules/doctor/doctor-pages/DoctorConsultations'
import DoctorPatients from './modules/doctor/doctor-pages/DoctorPatients'
import DoctorAllPatients from './modules/doctor/doctor-pages/DoctorAllPatients'
import DoctorAppointments from './modules/doctor/doctor-pages/DoctorAppointments'
import DoctorAllConsultations from './modules/doctor/doctor-pages/DoctorAllConsultations'
import DoctorSupport from './modules/doctor/doctor-pages/DoctorSupport'
import PharmacyNavbar from './modules/pharmacy/pharmacy-components/PharmacyNavbar'
import { PharmacySidebarProvider } from './modules/pharmacy/pharmacy-components/PharmacySidebarContext'
import PharmacyDashboard from './modules/pharmacy/pharmacy-pages/PharmacyDashboard'
import PharmacyList from './modules/pharmacy/pharmacy-pages/PharmacyList'
import PharmacyOrders from './modules/pharmacy/pharmacy-pages/PharmacyOrders'
import PharmacyPrescriptions from './modules/pharmacy/pharmacy-pages/PharmacyPrescriptions'
import PharmacyPatients from './modules/pharmacy/pharmacy-pages/PharmacyPatients'
import PharmacyMedicines from './modules/pharmacy/pharmacy-pages/PharmacyMedicines'
import PharmacyPatientStatistics from './modules/pharmacy/pharmacy-pages/PharmacyPatientStatistics'
import PharmacyProfile from './modules/pharmacy/pharmacy-pages/PharmacyProfile'
import PharmacyWallet from './modules/pharmacy/pharmacy-pages/PharmacyWallet'
import PharmacyWalletBalance from './modules/pharmacy/pharmacy-pages/WalletBalance'
import PharmacyWalletEarning from './modules/pharmacy/pharmacy-pages/WalletEarning'
import PharmacyWalletWithdraw from './modules/pharmacy/pharmacy-pages/WalletWithdraw'
import PharmacyWalletTransaction from './modules/pharmacy/pharmacy-pages/WalletTransaction'
import PharmacySupport from './modules/pharmacy/pharmacy-pages/PharmacySupport'
import PharmacyRequestOrders from './modules/pharmacy/pharmacy-pages/PharmacyRequestOrders'
import LaboratoryNavbar from './modules/laboratory/laboratory-components/LaboratoryNavbar'
import LaboratoryDashboard from './modules/laboratory/laboratory-pages/LaboratoryDashboard'
import LaboratoryOrders from './modules/laboratory/laboratory-pages/LaboratoryOrders'
import LaboratoryPatients from './modules/laboratory/laboratory-pages/LaboratoryPatients'
import LaboratoryPatientOrders from './modules/laboratory/laboratory-pages/LaboratoryPatientOrders'
import LaboratoryProfile from './modules/laboratory/laboratory-pages/LaboratoryProfile'
import LaboratoryWallet from './modules/laboratory/laboratory-pages/LaboratoryWallet'
import LaboratoryRequests from './modules/laboratory/laboratory-pages/LaboratoryRequests'
import LaboratoryReports from './modules/laboratory/laboratory-pages/LaboratoryReports'
import LaboratoryTestReports from './modules/laboratory/laboratory-pages/LaboratoryTestReports'
import LaboratoryAddReport from './modules/laboratory/laboratory-pages/LaboratoryAddReport'
import LaboratoryPatientStatistics from './modules/laboratory/laboratory-pages/LaboratoryPatientStatistics'
import LaboratoryPatientDetails from './modules/laboratory/laboratory-pages/LaboratoryPatientDetails'
import LaboratoryRequestOrders from './modules/laboratory/laboratory-pages/LaboratoryRequestOrders'
import LaboratoryAvailableTests from './modules/laboratory/laboratory-pages/LaboratoryAvailableTests'
import LaboratoryAddTest from './modules/laboratory/laboratory-pages/LaboratoryAddTest'
import LaboratoryWalletBalance from './modules/laboratory/laboratory-pages/WalletBalance'
import LaboratoryWalletEarning from './modules/laboratory/laboratory-pages/WalletEarning'
import LaboratoryWalletWithdraw from './modules/laboratory/laboratory-pages/WalletWithdraw'
import LaboratoryWalletTransaction from './modules/laboratory/laboratory-pages/WalletTransaction'
import LaboratorySupport from './modules/laboratory/laboratory-pages/LaboratorySupport'
import AdminNavbar from './modules/admin/admin-components/AdminNavbar'
import AdminLogin from './modules/admin/admin-pages/AdminLogin'
import AdminDashboard from './modules/admin/admin-pages/AdminDashboard'
import AdminUsers from './modules/admin/admin-pages/AdminUsers'
import AdminDoctors from './modules/admin/admin-pages/AdminDoctors'
import AdminPharmacies from './modules/admin/admin-pages/AdminPharmacies'
import AdminLaboratories from './modules/admin/admin-pages/AdminLaboratories'
import AdminPharmacyMedicines from './modules/admin/admin-pages/AdminPharmacyMedicines'
import AdminInventory from './modules/admin/admin-pages/AdminInventory'
import AdminVerification from './modules/admin/admin-pages/AdminVerification'
import AdminProfile from './modules/admin/admin-pages/AdminProfile'
import AdminWallet from './modules/admin/admin-pages/AdminWallet'
import AdminRevenue from './modules/admin/admin-pages/AdminRevenue'
import AdminSupport from './modules/admin/admin-pages/AdminSupport'
import AdminAppointments from './modules/admin/admin-pages/AdminAppointments'
import AdminOrders from './modules/admin/admin-pages/AdminOrders'
import AdminRequests from './modules/admin/admin-pages/AdminRequests'
import ProtectedRoute from './components/ProtectedRoute'

function PatientRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/patient/login'
  
  return (
    <>
      {!isLoginPage && <PatientNavbar />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6'}>
        <Routes>
          <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/login" element={<PatientLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute module="patient"><PatientDashboard /></ProtectedRoute>} />
                    <Route path="/doctors" element={<ProtectedRoute module="patient"><PatientDoctors /></ProtectedRoute>} />
                    <Route path="/doctors/:id" element={<ProtectedRoute module="patient"><PatientDoctorDetails /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute module="patient"><PatientProfile /></ProtectedRoute>} />
                    <Route path="/locations" element={<ProtectedRoute module="patient"><PatientLocations /></ProtectedRoute>} />
                    <Route path="/prescriptions" element={<ProtectedRoute module="patient"><PatientPrescriptions /></ProtectedRoute>} />
                    <Route path="/hospitals" element={<ProtectedRoute module="patient"><PatientHospitals /></ProtectedRoute>} />
                    <Route path="/hospitals/:hospitalId/doctors" element={<ProtectedRoute module="patient"><PatientHospitalDoctors /></ProtectedRoute>} />
                    <Route path="/specialties" element={<ProtectedRoute module="patient"><PatientSpecialties /></ProtectedRoute>} />
                    <Route path="/specialties/:specialtyId/doctors" element={<ProtectedRoute module="patient"><PatientSpecialtyDoctors /></ProtectedRoute>} />
                    <Route path="/upcoming-schedules" element={<ProtectedRoute module="patient"><PatientUpcomingSchedules /></ProtectedRoute>} />
                    <Route path="/reports" element={<Navigate to="/patient/prescriptions?tab=lab-reports" replace />} />
                    <Route path="/requests" element={<ProtectedRoute module="patient"><PatientRequests /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute module="patient"><PatientTransactions /></ProtectedRoute>} />
                    <Route path="/appointments" element={<ProtectedRoute module="patient"><PatientAppointments /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute module="patient"><PatientOrders /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute module="patient"><PatientHistory /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute module="patient"><PatientSupport /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}

function AdminRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/admin/login'
  // Check token synchronously - but don't show navbar until verified
  const token = getAuthToken('admin')
  const isAuthenticated = !!token && !isLoginPage
  
  // If not on login page and no token, redirect to login immediately
  if (!isLoginPage && !token) {
    return <Navigate to="/admin/login" replace />
  }
  
  return (
    <>
      {isAuthenticated && <AdminNavbar />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-28 sm:px-6 lg:ml-64 transition-all duration-300'}>
        <Routes>
          {/* Public route - Login page */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Protected routes - All require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute module="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute module="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/doctors" element={<ProtectedRoute module="admin"><AdminDoctors /></ProtectedRoute>} />
          <Route path="/pharmacies" element={<ProtectedRoute module="admin"><AdminPharmacies /></ProtectedRoute>} />
          <Route path="/pharmacy-medicines" element={<ProtectedRoute module="admin"><AdminPharmacyMedicines /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute module="admin"><AdminInventory /></ProtectedRoute>} />
          <Route path="/laboratories" element={<ProtectedRoute module="admin"><AdminLaboratories /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute module="admin"><AdminWallet /></ProtectedRoute>} />
          <Route path="/verification" element={<ProtectedRoute module="admin"><AdminVerification /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute module="admin"><AdminAppointments /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute module="admin"><AdminOrders /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute module="admin"><AdminRequests /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute module="admin"><AdminProfile /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute module="admin"><AdminSupport /></ProtectedRoute>} />
          
          {/* Root and catch-all - redirect based on authentication */}
          <Route path="/" element={
            token ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />
          } />
          <Route path="*" element={
            token ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/admin/login" replace />
          } />
        </Routes>
      </main>
    </>
  )
}

function DoctorRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/doctor/login'
  
  return (
    <>
      {!isLoginPage && <DoctorNavbar />}
      <main className={isLoginPage ? '' : 'px-4 pb-24 pt-20 sm:px-6'}>
        <Routes>
          <Route path="/" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="/login" element={<DoctorLogin />} />
          <Route path="/dashboard" element={<ProtectedRoute module="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute module="doctor"><DoctorWallet /></ProtectedRoute>} />
          <Route path="/wallet/balance" element={<ProtectedRoute module="doctor"><WalletBalance /></ProtectedRoute>} />
          <Route path="/wallet/earning" element={<ProtectedRoute module="doctor"><WalletEarning /></ProtectedRoute>} />
          <Route path="/wallet/withdraw" element={<ProtectedRoute module="doctor"><WalletWithdraw /></ProtectedRoute>} />
          <Route path="/wallet/transaction" element={<ProtectedRoute module="doctor"><WalletTransaction /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute module="doctor"><DoctorPatients /></ProtectedRoute>} />
          <Route path="/all-patients" element={<ProtectedRoute module="doctor"><DoctorAllPatients /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute module="doctor"><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/all-consultations" element={<ProtectedRoute module="doctor"><DoctorAllConsultations /></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute module="doctor"><DoctorConsultations /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute module="doctor"><DoctorProfile /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute module="doctor"><DoctorSupport /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          {/* Patient Routes */}
          <Route path="/patient/*" element={<PatientRoutes />} />

          {/* Doctor Routes */}
          <Route path="/doctor/*" element={<DoctorRoutes />} />

          {/* Pharmacy Routes */}
          <Route
            path="/pharmacy/*"
            element={
              <PharmacySidebarProvider>
                <PharmacyNavbar />
                <main className="px-4 pb-24 pt-20 sm:px-6">
                  <Routes>
                    <Route path="/" element={<Navigate to="/pharmacy/dashboard" replace />} />
                    <Route path="/login" element={<DoctorLogin />} />
                    <Route path="/dashboard" element={<ProtectedRoute module="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
                    <Route path="/list" element={<ProtectedRoute module="pharmacy"><PharmacyList /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute module="pharmacy"><PharmacyOrders /></ProtectedRoute>} />
                    <Route path="/request-orders" element={<ProtectedRoute module="pharmacy"><PharmacyRequestOrders /></ProtectedRoute>} />
                    <Route path="/prescriptions" element={<ProtectedRoute module="pharmacy"><PharmacyPrescriptions /></ProtectedRoute>} />
                    <Route path="/medicines" element={<ProtectedRoute module="pharmacy"><PharmacyMedicines /></ProtectedRoute>} />
                    <Route path="/patients" element={<ProtectedRoute module="pharmacy"><PharmacyPatients /></ProtectedRoute>} />
                    <Route path="/patient-statistics" element={<ProtectedRoute module="pharmacy"><PharmacyPatientStatistics /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute module="pharmacy"><PharmacyProfile /></ProtectedRoute>} />
                    <Route path="/wallet" element={<ProtectedRoute module="pharmacy"><PharmacyWallet /></ProtectedRoute>} />
                    <Route path="/wallet/balance" element={<ProtectedRoute module="pharmacy"><PharmacyWalletBalance /></ProtectedRoute>} />
                    <Route path="/wallet/earning" element={<ProtectedRoute module="pharmacy"><PharmacyWalletEarning /></ProtectedRoute>} />
                    <Route path="/wallet/withdraw" element={<ProtectedRoute module="pharmacy"><PharmacyWalletWithdraw /></ProtectedRoute>} />
                    <Route path="/wallet/transaction" element={<ProtectedRoute module="pharmacy"><PharmacyWalletTransaction /></ProtectedRoute>} />
                    <Route path="/support" element={<ProtectedRoute module="pharmacy"><PharmacySupport /></ProtectedRoute>} />
                  </Routes>
                </main>
              </PharmacySidebarProvider>
            }
          />

          {/* Laboratory Routes */}
          <Route
            path="/laboratory/*"
            element={
              <>
                <LaboratoryNavbar />
                <main className="px-4 pb-24 pt-20 sm:px-6">
                  <Routes>
                    <Route path="/" element={<Navigate to="/laboratory/dashboard" replace />} />
                    <Route path="/login" element={<DoctorLogin />} />
                    <Route path="/dashboard" element={<ProtectedRoute module="laboratory"><LaboratoryDashboard /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute module="laboratory"><LaboratoryOrders /></ProtectedRoute>} />
                    <Route path="/requests" element={<ProtectedRoute module="laboratory"><LaboratoryRequests /></ProtectedRoute>} />
                    <Route path="/request-orders" element={<ProtectedRoute module="laboratory"><LaboratoryRequestOrders /></ProtectedRoute>} />
                    <Route path="/available-tests" element={<ProtectedRoute module="laboratory"><LaboratoryAvailableTests /></ProtectedRoute>} />
                    <Route path="/available-tests/add" element={<ProtectedRoute module="laboratory"><LaboratoryAddTest /></ProtectedRoute>} />
                    <Route path="/available-tests/edit/:testId" element={<ProtectedRoute module="laboratory"><LaboratoryAddTest /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute module="laboratory"><LaboratoryReports /></ProtectedRoute>} />
                    <Route path="/test-reports" element={<ProtectedRoute module="laboratory"><LaboratoryTestReports /></ProtectedRoute>} />
                    <Route path="/test-reports/add/:orderId" element={<ProtectedRoute module="laboratory"><LaboratoryAddReport /></ProtectedRoute>} />
                    <Route path="/patients" element={<ProtectedRoute module="laboratory"><LaboratoryPatients /></ProtectedRoute>} />
                    <Route path="/patients/orders" element={<ProtectedRoute module="laboratory"><LaboratoryPatientOrders /></ProtectedRoute>} />
                    <Route path="/patient-statistics" element={<ProtectedRoute module="laboratory"><LaboratoryPatientStatistics /></ProtectedRoute>} />
                    <Route path="/patient-details" element={<ProtectedRoute module="laboratory"><LaboratoryPatientDetails /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute module="laboratory"><LaboratoryProfile /></ProtectedRoute>} />
                    <Route path="/wallet" element={<ProtectedRoute module="laboratory"><LaboratoryWallet /></ProtectedRoute>} />
                    <Route path="/wallet/balance" element={<ProtectedRoute module="laboratory"><LaboratoryWalletBalance /></ProtectedRoute>} />
                    <Route path="/wallet/earning" element={<ProtectedRoute module="laboratory"><LaboratoryWalletEarning /></ProtectedRoute>} />
                    <Route path="/wallet/withdraw" element={<ProtectedRoute module="laboratory"><LaboratoryWalletWithdraw /></ProtectedRoute>} />
                    <Route path="/wallet/transaction" element={<ProtectedRoute module="laboratory"><LaboratoryWalletTransaction /></ProtectedRoute>} />
                    <Route path="/support" element={<ProtectedRoute module="laboratory"><LaboratorySupport /></ProtectedRoute>} />
                    
                  </Routes>
                </main>
              </>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <>
                <AdminNavbar />
                <main className="px-4 pb-24 pt-28 sm:px-6 lg:ml-64 transition-all duration-300">
                  <Routes>
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/login" element={<AdminLogin />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/doctors" element={<AdminDoctors />} />
                    <Route path="/pharmacies" element={<AdminPharmacies />} />
                    <Route path="/pharmacy-medicines" element={<AdminPharmacyMedicines />} />
                    <Route path="/inventory" element={<AdminInventory />} />
                    <Route path="/laboratories" element={<AdminLaboratories />} />
                    <Route path="/wallet" element={<AdminWallet />} />
                    <Route path="/revenue" element={<AdminRevenue />} />
                    <Route path="/verification" element={<AdminVerification />} />
                    <Route path="/appointments" element={<AdminAppointments />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="/request" element={<AdminRequests />} />
                    <Route path="/profile" element={<AdminProfile />} />
                    <Route path="/support" element={<AdminSupport />} />
                  </Routes>
                </main>
              </>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
