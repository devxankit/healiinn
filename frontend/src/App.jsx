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
import PatientHospitals from './modules/patient/patient-pages/PatientHospitals'
import PatientHospitalDoctors from './modules/patient/patient-pages/PatientHospitalDoctors'
import PatientSpecialties from './modules/patient/patient-pages/PatientSpecialties'
import PatientSpecialtyDoctors from './modules/patient/patient-pages/PatientSpecialtyDoctors'
import PatientUpcomingSchedules from './modules/patient/patient-pages/PatientUpcomingSchedules'
import PatientLogin from './modules/patient/patient-pages/PatientLogin'

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
            <Route path="/patient/hospitals" element={<PatientHospitals />} />
            <Route path="/patient/hospitals/:hospitalId/doctors" element={<PatientHospitalDoctors />} />
            <Route path="/patient/specialties" element={<PatientSpecialties />} />
            <Route path="/patient/specialties/:specialtyId/doctors" element={<PatientSpecialtyDoctors />} />
            <Route path="/patient/upcoming-schedules" element={<PatientUpcomingSchedules />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
