import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import PatientNavbar from './modules/patient/patient-components/PatientNavbar'
import PatientDashboard from './modules/patient/patient-pages/PatientDashboard'
import PatientPharmacy from './modules/patient/patient-pages/PatientPharmacy'
import PatientDoctors from './modules/patient/patient-pages/PatientDoctors'
import PatientLaboratory from './modules/patient/patient-pages/PatientLaboratory'
import PatientProfile from './modules/patient/patient-pages/PatientProfile'
import PatientLocations from './modules/patient/patient-pages/PatientLocations'
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
            <Route path="/patient/laboratory" element={<PatientLaboratory />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/locations" element={<PatientLocations />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
