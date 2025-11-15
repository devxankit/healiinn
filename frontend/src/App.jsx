import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import DoctorDashboard from './modules/doctor/doctor-pages/DoctorDashboard'
import DoctorProfile from './modules/doctor/doctor-pages/DoctorProfile'
import DoctorAppointments from './modules/doctor/doctor-pages/DoctorAppointments'
import DoctorConsultations from './modules/doctor/doctor-pages/DoctorConsultations'
import DoctorWallet from './modules/doctor/doctor-pages/DoctorWallet'
import DoctorClinics from './modules/doctor/doctor-pages/DoctorClinics'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <PatientNavbar />

        <main className="px-4 pb-24 pt-20 sm:px-6">
          <Routes>
            <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/pharmacy" element={<PatientPharmacy />} />
            <Route path="/patient/doctors" element={<PatientDoctors />} />
            <Route path="/patient/doctors/:id" element={<PatientDoctorDetails />} />
            <Route path="/patient/laboratory" element={<PatientLaboratory />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/locations" element={<PatientLocations />} />
            <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/patient/reports" element={<PatientReports />} />
            <Route path="/patient/requests" element={<PatientRequests />} />
            <Route path="/patient/hospitals" element={<PatientHospitals />} />
            <Route path="/patient/hospitals/:hospitalId/doctors" element={<PatientHospitalDoctors />} />
            <Route path="/patient/specialties" element={<PatientSpecialties />} />
            <Route path="/patient/specialties/:specialtyId/doctors" element={<PatientSpecialtyDoctors />} />
            <Route path="/patient/upcoming-schedules" element={<PatientUpcomingSchedules />} />
            <Route path="/patient/transactions" element={<PatientTransactions />} />
            <Route path="/patient/appointments" element={<PatientAppointments />} />
            <Route path="/patient/orders" element={<PatientOrders />} />
          </Routes>
        </main>
        <Routes>
          {/* Patient Routes */}
          <Route
            path="/patient/*"
            element={
              <>
                <PatientNavbar />
                <main className="px-4 pb-24 pt-20 sm:px-6">
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
                  </Routes>
                </main>
              </>
            }
          />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/consultations" element={<DoctorConsultations />} />
          <Route path="/doctor/wallet" element={<DoctorWallet />} />
          <Route path="/doctor/clinics" element={<DoctorClinics />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
