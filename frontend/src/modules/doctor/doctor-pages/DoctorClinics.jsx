import DoctorNavbar from '../doctor-components/DoctorNavbar'

const DoctorClinics = () => {
  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Clinics</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your clinic locations and sessions</p>
            </div>
            {/* Add clinic button will go here */}
          </div>

          {/* Clinics content will be implemented here */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            {/* Clinics list will go here */}
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorClinics

