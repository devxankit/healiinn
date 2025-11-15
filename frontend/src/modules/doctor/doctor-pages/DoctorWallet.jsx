import DoctorNavbar from '../doctor-components/DoctorNavbar'

const DoctorWallet = () => {
  return (
    <>
      <DoctorNavbar />
      <div className="min-h-screen bg-slate-50 pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your earnings and withdrawals</p>
          </div>

          {/* Wallet content will be implemented here */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Wallet summary cards will go here */}
          </div>

          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            {/* Transactions and withdrawals will go here */}
          </div>
        </div>
      </div>
    </>
  )
}

export default DoctorWallet

