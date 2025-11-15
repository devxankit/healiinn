import DoctorNavbar from '../doctor-components/DoctorNavbar'

const DoctorProfile = () => {
  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your profile information</p>
          </div>

          {/* Profile form will be implemented here */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            {/* Profile fields will go here */}
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorProfile

