import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import PatientNavbar from './modules/patient/patient-components/PatientNavbar'
import PatientDashboard from './modules/patient/patient-pages/PatientDashboard'
import PatientPharmacy from './modules/patient/patient-pages/PatientPharmacy'
import PatientDoctors from './modules/patient/patient-pages/PatientDoctors'
import PatientDoctorDetails from './modules/patient/patient-pages/PatientDoctorDetails'
import PatientLaboratory from './modules/patient/patient-pages/PatientLaboratory'
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
import PharmacyPatientStatistics from './modules/pharmacy/pharmacy-pages/PharmacyPatientStatistics'
import PharmacyProfile from './modules/pharmacy/pharmacy-pages/PharmacyProfile'
import PharmacyWallet from './modules/pharmacy/pharmacy-pages/PharmacyWallet'
import PharmacyWalletBalance from './modules/pharmacy/pharmacy-pages/WalletBalance'
import PharmacyWalletEarning from './modules/pharmacy/pharmacy-pages/WalletEarning'
import PharmacyWalletWithdraw from './modules/pharmacy/pharmacy-pages/WalletWithdraw'
import PharmacyWalletTransaction from './modules/pharmacy/pharmacy-pages/WalletTransaction'
import PharmacySupport from './modules/pharmacy/pharmacy-pages/PharmacySupport'
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
import LaboratoryPatientStatistics from './modules/laboratory/laboratory-pages/LaboratoryPatientStatistics'
import LaboratoryPatientDetails from './modules/laboratory/laboratory-pages/LaboratoryPatientDetails'
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
import AdminVerification from './modules/admin/admin-pages/AdminVerification'
import AdminProfile from './modules/admin/admin-pages/AdminProfile'
import AdminWallet from './modules/admin/admin-pages/AdminWallet'
import AdminSupport from './modules/admin/admin-pages/AdminSupport'
import AdminAppointments from './modules/admin/admin-pages/AdminAppointments'
import AdminOrders from './modules/admin/admin-pages/AdminOrders'

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
          <Route path="/dashboard" element={<PatientDashboard />} />
                    <Route path="/pharmacy" element={<PatientPharmacy />} />
                    <Route path="/doctors" element={<PatientDoctors />} />
                    <Route path="/doctors/:id" element={<PatientDoctorDetails />} />
                    <Route path="/laboratory" element={<PatientLaboratory />} />
                    <Route path="/profile" element={<PatientProfile />} />
                    <Route path="/locations" element={<PatientLocations />} />
                    <Route path="/prescriptions" element={<PatientPrescriptions />} />
                    <Route path="/hospitals" element={<PatientHospitals />} />
                    <Route path="/hospitals/:hospitalId/doctors" element={<PatientHospitalDoctors />} />
                    <Route path="/specialties" element={<PatientSpecialties />} />
                    <Route path="/specialties/:specialtyId/doctors" element={<PatientSpecialtyDoctors />} />
                    <Route path="/upcoming-schedules" element={<PatientUpcomingSchedules />} />
                    <Route path="/reports" element={<PatientReports />} />
                    <Route path="/requests" element={<PatientRequests />} />
                    <Route path="/transactions" element={<PatientTransactions />} />
                    <Route path="/appointments" element={<PatientAppointments />} />
          <Route path="/orders" element={<PatientOrders />} />
          <Route path="/support" element={<PatientSupport />} />
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
          <Route path="/dashboard" element={<DoctorDashboard />} />
          <Route path="/wallet" element={<DoctorWallet />} />
          <Route path="/wallet/balance" element={<WalletBalance />} />
          <Route path="/wallet/earning" element={<WalletEarning />} />
          <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
          <Route path="/wallet/transaction" element={<WalletTransaction />} />
          <Route path="/patients" element={<DoctorPatients />} />
          <Route path="/all-patients" element={<DoctorAllPatients />} />
          <Route path="/appointments" element={<DoctorAppointments />} />
          <Route path="/all-consultations" element={<DoctorAllConsultations />} />
          <Route path="/consultations" element={<DoctorConsultations />} />
          <Route path="/profile" element={<DoctorProfile />} />
          <Route path="/support" element={<DoctorSupport />} />
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
                    <Route path="/dashboard" element={<PharmacyDashboard />} />
                    <Route path="/list" element={<PharmacyList />} />
                    <Route path="/orders" element={<PharmacyOrders />} />
                    <Route path="/prescriptions" element={<PharmacyPrescriptions />} />
                    <Route path="/patients" element={<PharmacyPatients />} />
                    <Route path="/patient-statistics" element={<PharmacyPatientStatistics />} />
                    <Route path="/profile" element={<PharmacyProfile />} />
                    <Route path="/wallet" element={<PharmacyWallet />} />
                    <Route path="/wallet/balance" element={<PharmacyWalletBalance />} />
                    <Route path="/wallet/earning" element={<PharmacyWalletEarning />} />
                    <Route path="/wallet/withdraw" element={<PharmacyWalletWithdraw />} />
                    <Route path="/wallet/transaction" element={<PharmacyWalletTransaction />} />
                    <Route path="/support" element={<PharmacySupport />} />
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
                    <Route path="/dashboard" element={<LaboratoryDashboard />} />
                    <Route path="/orders" element={<LaboratoryOrders />} />
                    <Route path="/requests" element={<LaboratoryRequests />} />
                    <Route path="/reports" element={<LaboratoryReports />} />
                    <Route path="/test-reports" element={<LaboratoryTestReports />} />
                    <Route path="/patients" element={<LaboratoryPatients />} />
                    <Route path="/patients/orders" element={<LaboratoryPatientOrders />} />
                    <Route path="/patient-statistics" element={<LaboratoryPatientStatistics />} />
                    <Route path="/patient-details" element={<LaboratoryPatientDetails />} />
                    <Route path="/profile" element={<LaboratoryProfile />} />
                    <Route path="/wallet" element={<LaboratoryWallet />} />
                    <Route path="/wallet/balance" element={<LaboratoryWalletBalance />} />
                    <Route path="/wallet/earning" element={<LaboratoryWalletEarning />} />
                    <Route path="/wallet/withdraw" element={<LaboratoryWalletWithdraw />} />
                    <Route path="/wallet/transaction" element={<LaboratoryWalletTransaction />} />
                    <Route path="/support" element={<LaboratorySupport />} />
                    
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
                <main className="px-4 pb-24 pt-28 sm:px-6 lg:ml-64">
                  <Routes>
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/login" element={<AdminLogin />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/doctors" element={<AdminDoctors />} />
                    <Route path="/pharmacies" element={<AdminPharmacies />} />
                    <Route path="/laboratories" element={<AdminLaboratories />} />
                    <Route path="/wallet" element={<AdminWallet />} />
                    <Route path="/verification" element={<AdminVerification />} />
                    <Route path="/appointments" element={<AdminAppointments />} />
                    <Route path="/orders" element={<AdminOrders />} />
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
