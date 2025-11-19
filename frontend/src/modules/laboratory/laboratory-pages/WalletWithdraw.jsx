import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IoArrowBackOutline,
  IoCashOutline,
  IoAddOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoPhonePortraitOutline,
} from 'react-icons/io5'

// Mock data
const mockWithdrawData = {
  availableBalance: 24500.50,
  totalWithdrawals: 212919.50,
  thisMonthWithdrawals: 10000.00,
  withdrawalHistory: [
    {
      id: 'wd-1',
      amount: 10000.00,
      description: 'Withdrawal to Bank Account',
      date: '2025-01-14T14:20:00',
      status: 'completed',
      paymentMethod: 'Bank Account',
      accountNumber: '**** **** **** 1234',
    },
    {
      id: 'wd-2',
      amount: 6000.00,
      description: 'Withdrawal to Bank Account',
      date: '2025-01-10T10:00:00',
      status: 'completed',
      paymentMethod: 'Bank Account',
      accountNumber: '**** **** **** 1234',
    },
    {
      id: 'wd-3',
      amount: 4000.00,
      description: 'Withdrawal to Bank Account',
      date: '2025-01-05T09:30:00',
      status: 'completed',
      paymentMethod: 'Bank Account',
      accountNumber: '**** **** **** 1234',
    },
    {
      id: 'wd-4',
      amount: 8000.00,
      description: 'Withdrawal to Bank Account',
      date: '2025-01-02T15:45:00',
      status: 'pending',
      paymentMethod: 'Bank Account',
      accountNumber: '**** **** **** 1234',
    },
    {
      id: 'wd-5',
      amount: 5000.00,
      description: 'Withdrawal to UPI',
      date: '2025-01-01T12:00:00',
      status: 'approved',
      paymentMethod: 'UPI',
      upiId: 'laboratory@paytm',
    },
  ],
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const WalletWithdraw = () => {
  const navigate = useNavigate()
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Payment method details
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  })
  const [upiId, setUpiId] = useState('')
  const [walletNumber, setWalletNumber] = useState('')

  const validatePaymentMethod = () => {
    if (selectedPaymentMethod === 'bank') {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
        alert('Please fill all bank account details')
        return false
      }
    } else if (selectedPaymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID')
        return false
      }
    } else if (selectedPaymentMethod === 'wallet') {
      if (!walletNumber || walletNumber.length < 10) {
        alert('Please enter a valid wallet number')
        return false
      }
    }
    return true
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount > mockWithdrawData.availableBalance) {
      alert('Insufficient balance')
      return
    }

    if (!validatePaymentMethod()) {
      return
    }

    setIsProcessing(true)
    
    // Prepare payout method data
    let payoutMethodData = {}
    if (selectedPaymentMethod === 'bank') {
      payoutMethodData = {
        type: 'bank',
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        accountHolderName: bankDetails.accountHolderName,
      }
    } else if (selectedPaymentMethod === 'upi') {
      payoutMethodData = {
        type: 'upi',
        upiId: upiId,
      }
    } else if (selectedPaymentMethod === 'wallet') {
      payoutMethodData = {
        type: 'wallet',
        walletNumber: walletNumber,
      }
    }

    // Simulate API call to create withdrawal request
    // In real app: await api.post('/laboratory/wallet/withdraw', { amount, payoutMethod: payoutMethodData })
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setIsProcessing(false)
    setShowWithdrawModal(false)
    setWithdrawAmount('')
    setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '' })
    setUpiId('')
    setWalletNumber('')
    alert(`Withdrawal request of ${formatCurrency(amount)} submitted successfully! Admin will review your request.`)
  }

  return (
    <section className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/laboratory/wallet')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          <IoArrowBackOutline className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Withdraw</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your withdrawals</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={mockWithdrawData.availableBalance <= 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-400/40 transition-all hover:bg-amber-600 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IoAddOutline className="h-5 w-5" />
          <span className="hidden sm:inline">Withdraw</span>
        </button>
      </div>

      {/* Main Withdrawal Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-100/60 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 p-6 text-white shadow-xl shadow-amber-500/30">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90">Total Withdrawals</p>
              <p className="mt-2 text-4xl font-bold">{formatCurrency(mockWithdrawData.totalWithdrawals)}</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <IoCashOutline className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100/60 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/70 p-5 shadow-sm shadow-blue-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Available Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockWithdrawData.availableBalance)}</p>
          <p className="mt-1 text-xs text-slate-500">Ready to withdraw</p>
        </div>

        <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/70 p-5 shadow-sm shadow-emerald-100/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">This Month</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(mockWithdrawData.thisMonthWithdrawals)}</p>
          <p className="mt-1 text-xs text-slate-500">Withdrawn this month</p>
        </div>
      </div>

      {/* Withdrawal History */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Withdrawal History</h2>
        <div className="space-y-3">
          {mockWithdrawData.withdrawalHistory.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <IoCashOutline className="mx-auto h-16 w-16 text-slate-300" />
              <p className="mt-4 text-base font-semibold text-slate-600">No withdrawals found</p>
              <p className="mt-1 text-sm text-slate-500">Your withdrawal history will appear here</p>
            </div>
          ) : (
            mockWithdrawData.withdrawalHistory.map((withdrawal) => (
              <article
                key={withdrawal.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <IoCashOutline className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {withdrawal.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {withdrawal.paymentMethod === 'Bank Account' && withdrawal.accountNumber && (
                            <span className="flex items-center gap-1">
                              <IoCardOutline className="h-3.5 w-3.5" />
                              {withdrawal.accountNumber}
                            </span>
                          )}
                          {withdrawal.paymentMethod === 'UPI' && withdrawal.upiId && (
                            <span className="flex items-center gap-1">
                              <IoPhonePortraitOutline className="h-3.5 w-3.5" />
                              {withdrawal.upiId}
                            </span>
                          )}
                          {withdrawal.paymentMethod === 'Wallet' && withdrawal.walletNumber && (
                            <span className="flex items-center gap-1">
                              <IoWalletOutline className="h-3.5 w-3.5" />
                              {withdrawal.walletNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="h-3.5 w-3.5" />
                            {formatDateTime(withdrawal.date)}
                          </span>
                        </div>
                        {withdrawal.status === 'pending' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <IoTimeOutline className="h-3.5 w-3.5" />
                            Pending Review
                          </div>
                        )}
                        {withdrawal.status === 'approved' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Approved
                          </div>
                        )}
                        {withdrawal.status === 'rejected' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
                            <IoCloseOutline className="h-3.5 w-3.5" />
                            Rejected
                          </div>
                        )}
                        {(withdrawal.status === 'completed' || withdrawal.status === 'paid') && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                            Paid
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <p className="text-lg font-bold text-amber-600">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 px-0 sm:px-4 py-0 sm:py-6 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowWithdrawModal(false)
            }
          }}
        >
          <div className="relative w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Withdraw Money</h2>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 active:scale-95"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Available Balance */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-medium text-slate-600">Available Balance</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                  {formatCurrency(mockWithdrawData.availableBalance)}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-900">Withdraw Amount</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-semibold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={mockWithdrawData.availableBalance}
                    step="1"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-10 text-base sm:text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                {withdrawAmount && parseFloat(withdrawAmount) > mockWithdrawData.availableBalance && (
                  <p className="mt-1.5 sm:mt-2 text-xs text-red-600">Amount exceeds available balance</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-slate-900">Payment Method</label>
                <div className="space-y-2">
                  {/* Bank Account Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('bank')}
                    className={`w-full flex items-center gap-2 sm:gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all active:scale-[0.98] ${
                      selectedPaymentMethod === 'bank'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                      <IoCardOutline className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">Bank Account</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">Transfer to bank account</p>
                    </div>
                    {selectedPaymentMethod === 'bank' && (
                      <IoCheckmarkCircleOutline className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-amber-600" />
                    )}
                  </button>

                  {/* UPI Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`w-full flex items-center gap-2 sm:gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all active:scale-[0.98] ${
                      selectedPaymentMethod === 'upi'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                      <IoPhonePortraitOutline className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">UPI</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">Pay via UPI ID</p>
                    </div>
                    {selectedPaymentMethod === 'upi' && (
                      <IoCheckmarkCircleOutline className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-amber-600" />
                    )}
                  </button>

                  {/* Wallet Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('wallet')}
                    className={`w-full flex items-center gap-2 sm:gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all active:scale-[0.98] ${
                      selectedPaymentMethod === 'wallet'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                      <IoWalletOutline className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">Wallet</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">Transfer to wallet</p>
                    </div>
                    {selectedPaymentMethod === 'wallet' && (
                      <IoCheckmarkCircleOutline className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-amber-600" />
                    )}
                  </button>
                </div>

                {/* Payment Method Details Input */}
                {selectedPaymentMethod === 'bank' && (
                  <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold text-slate-700">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                        placeholder="Enter account holder name"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold text-slate-700">Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold text-slate-700">IFSC Code</label>
                      <input
                        type="text"
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="Enter IFSC code"
                        maxLength={11}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'upi' && (
                  <div className="mt-3 sm:mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold text-slate-700">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="mt-1.5 text-[10px] sm:text-xs text-slate-500">Enter your UPI ID (e.g., yourname@paytm)</p>
                  </div>
                )}

                {selectedPaymentMethod === 'wallet' && (
                  <div className="mt-3 sm:mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold text-slate-700">Wallet Number</label>
                    <input
                      type="text"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter wallet number"
                      maxLength={10}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="mt-1.5 text-[10px] sm:text-xs text-slate-500">Enter your 10-digit wallet number</p>
                  </div>
                )}
              </div>

              {/* Info Message */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-medium text-blue-900 leading-relaxed">
                  <span className="font-semibold">Note:</span> Your withdrawal request will be sent to admin for review. You will receive a notification once the status is updated.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={
                  isProcessing ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > mockWithdrawData.availableBalance
                }
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm shadow-amber-400/40 transition hover:bg-amber-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">Processing</span>
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Confirm Withdrawal</span>
                    <span className="sm:hidden">Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default WalletWithdraw

