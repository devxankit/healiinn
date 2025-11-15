import DoctorNavbar from '../doctor-components/DoctorNavbar'

const DoctorDashboard = () => {
  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Overview of your practice</p>
          </div>

          {/* Dashboard content will be implemented here */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Metrics cards will go here */}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Upcoming appointments and recent reports will go here */}
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorDashboard

