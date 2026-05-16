import { useState, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import {
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoLockClosedOutline,
  IoColorPaletteOutline,
  IoLanguageOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline,
  IoCashOutline,
} from 'react-icons/io5'
import { getAdminSettings, updateAdminSettings } from '../admin-services/adminService'

const AdminSettings = () => {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    autoVerifyDoctors: false,
    autoVerifyPharmacies: false,
    autoVerifyLaboratories: false,
    requireTwoFactor: false,
    maintenanceMode: false,
    rewardsSettings: {
      referralBonus: 200,
      loginBonus: 200,
    }
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await getAdminSettings()
        if (response.success && response.data) {
          setSettings(prev => ({
            ...prev,
            ...response.data,
            rewardsSettings: response.data.rewardsSettings || prev.rewardsSettings
          }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleRewardsChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      rewardsSettings: {
        ...prev.rewardsSettings,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await updateAdminSettings(settings)
      if (response.success) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error(response.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Saving failed:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#11496c] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-3 pb-20 pt-20 lg:pt-24">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your admin panel settings</p>
      </header>

      {/* Notification Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <IoNotificationsOutline className="h-6 w-6 text-[#11496c]" />
          <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-600">Receive notifications via email</p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">SMS Notifications</p>
              <p className="text-xs text-slate-600">Receive notifications via SMS</p>
            </div>
            <button
              onClick={() => handleToggle('smsNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smsNotifications ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Push Notifications</p>
              <p className="text-xs text-slate-600">Receive push notifications</p>
            </div>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushNotifications ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Verification Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <IoShieldCheckmarkOutline className="h-6 w-6 text-[#11496c]" />
          <h2 className="text-lg font-semibold text-slate-900">Verification Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Auto-Verify Doctors</p>
              <p className="text-xs text-slate-600">Automatically verify new doctor registrations</p>
            </div>
            <button
              onClick={() => handleToggle('autoVerifyDoctors')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoVerifyDoctors ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoVerifyDoctors ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Auto-Verify Pharmacies</p>
              <p className="text-xs text-slate-600">Automatically verify new pharmacy registrations</p>
            </div>
            <button
              onClick={() => handleToggle('autoVerifyPharmacies')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoVerifyPharmacies ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoVerifyPharmacies ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Auto-Verify Laboratories</p>
              <p className="text-xs text-slate-600">Automatically verify new laboratory registrations</p>
            </div>
            <button
              onClick={() => handleToggle('autoVerifyLaboratories')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoVerifyLaboratories ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoVerifyLaboratories ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <IoLockClosedOutline className="h-6 w-6 text-[#11496c]" />
          <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
              <p className="text-xs text-slate-600">Require 2FA for admin login</p>
            </div>
            <button
              onClick={() => handleToggle('requireTwoFactor')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.requireTwoFactor ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.requireTwoFactor ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Rewards Program Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <IoCashOutline className="h-6 w-6 text-[#11496c]" />
          <h2 className="text-lg font-semibold text-slate-900">Rewards Program</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Referral Bonus (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.rewardsSettings?.referralBonus || ''}
                onChange={(e) => handleRewardsChange('referralBonus', Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[#11496c]"
              />
              <p className="text-xs text-slate-500 mt-1">Credited to the referrer when the invited user registers & logs in.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">First Login Bonus (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.rewardsSettings?.loginBonus || ''}
                onChange={(e) => handleRewardsChange('loginBonus', Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#11496c] focus:outline-none focus:ring-1 focus:ring-[#11496c]"
              />
              <p className="text-xs text-slate-500 mt-1">Credited to the new user upon their first successful login.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <IoDocumentTextOutline className="h-6 w-6 text-[#11496c]" />
          <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
              <p className="text-xs text-slate-600">Put the system in maintenance mode</p>
            </div>
            <button
              onClick={() => handleToggle('maintenanceMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-[#11496c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[#11496c] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0d3a54] focus:outline-none focus:ring-2 focus:ring-[#11496c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <IoCheckmarkCircleOutline className="h-5 w-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </section>
  )
}

export default AdminSettings


