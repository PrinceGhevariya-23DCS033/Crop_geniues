import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { User, Bell, Globe, Moon, Sun, Shield, LogOut, Save, ChevronRight, Lock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FormInput, FormSelect, SectionHeader } from '@/components/ui/FormComponents'
import clsx from 'clsx'
import { cropsList } from '@/utils/dummyData'
import { STATE_NAMES, getDistricts } from '@/data/districts'

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali']

const SettingRow = ({ icon: Icon, title, subtitle, children }) => (
  <div className="flex items-center justify-between py-4 border-b border-emerald-50/30 dark:border-emerald-900/10 last:border-0 gap-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-body">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
)

const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={clsx(
      'w-12 h-6 rounded-full transition-all duration-300 relative',
      enabled ? 'bg-emerald-500 shadow-glow-sm' : 'bg-gray-300 dark:bg-gray-600'
    )}
  >
    <motion.div
      animate={{ x: enabled ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
    />
  </button>
)

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { user, updateProfile, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    crop: user?.crop || '',
    sowingDate: user?.sowingDate || '',
    state: user?.state || '',
    district: user?.district || '',
  })
  const [notifications, setNotifications] = useState(user?.notifications || { price: true, disease: true, recommendation: false, weather: true })
  const [language, setLanguage] = useState(user?.language || 'English')
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const districts = useMemo(() => getDistricts(profile.state), [profile.state])

  useEffect(() => {
    setProfile(prev => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
      phone: user?.phone || prev.phone,
      location: user?.location || prev.location,
      crop: user?.crop || prev.crop,
      sowingDate: user?.sowingDate || prev.sowingDate,
      state: user?.state || prev.state,
      district: user?.district || prev.district,
    }))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        crop: profile.crop,
        sowingDate: profile.sowingDate,
        state: profile.state,
        district: profile.district,
        language,
        notifications,
      })
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error('Please fill all password fields')
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match')
    }
    setChangingPassword(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast('Logged out!', { icon: '👋' })
    setTimeout(() => navigate('/'), 300)
  }

  const set = (k, v) => setProfile(prev => ({ ...prev, [k]: v }))
  const setProfileField = (k, v) => {
    setProfile(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'state') next.district = ''
      return next
    })
  }
  const setNotif = (k, v) => setNotifications(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-6"
      >
        <SectionHeader title="Profile Settings" subtitle="Update your account information" />
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-emerald-100/30 dark:border-emerald-900/20">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-3xl shadow-lg">
              👨‍🌾
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-emerald-500 transition-colors">
              ✎
            </button>
          </div>
          <div>
            <p className="font-display font-bold text-xl text-gray-900 dark:text-white">{profile.name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className="badge-success mt-1">Premium Member</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="Full Name" id="name" value={profile.name} onChange={e => set('name', e.target.value)} />
          <FormInput label="Email" id="email" type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
          <FormInput label="Phone" id="phone" value={profile.phone} onChange={e => set('phone', e.target.value)} />
          <FormInput label="Location" id="loc" value={profile.location} onChange={e => set('location', e.target.value)} />
        </div>

        <div className="mt-6 pt-5 border-t border-emerald-100/30 dark:border-emerald-900/20 space-y-4">
          <div>
            <p className="font-display font-semibold text-gray-900 dark:text-white mb-1">Farm Profile</p>
            <p className="text-sm text-gray-500">Use these values to prefill yield prediction and field planning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect label="Your Crop" id="profile-crop" value={profile.crop} onChange={e => set('crop', e.target.value)}>
              <option value="">Select a crop</option>
              {cropsList.map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </FormSelect>
            <FormInput label="Date of Sowing" id="sowingDate" type="date" value={profile.sowingDate} onChange={e => set('sowingDate', e.target.value)} />
            <FormSelect label="State" id="profile-state" value={profile.state} onChange={e => setProfileField('state', e.target.value)}>
              <option value="">Select state / UT</option>
              {STATE_NAMES.map(state => <option key={state} value={state}>{state}</option>)}
            </FormSelect>
            <FormSelect label="District" id="profile-district" value={profile.district} onChange={e => set('district', e.target.value)}>
              <option value="">{profile.state ? 'Select district' : 'Select state first'}</option>
              {districts.map(district => <option key={district.name} value={district.name}>{district.name}</option>)}
            </FormSelect>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} 
        className="glass-card p-6"
      >
        <SectionHeader title="Notification Preferences" subtitle="Choose what alerts you receive" />
        <SettingRow icon={Bell} title="Price Alerts" subtitle="Get notified when crop prices change significantly">
          <Toggle enabled={notifications.price} onChange={v => setNotif('price', v)} />
        </SettingRow>
        <SettingRow icon={Bell} title="Disease Alerts" subtitle="Regional disease outbreak warnings">
          <Toggle enabled={notifications.disease} onChange={v => setNotif('disease', v)} />
        </SettingRow>
        <SettingRow icon={Bell} title="Crop Recommendations" subtitle="Seasonal crop advisory notifications">
          <Toggle enabled={notifications.recommendation} onChange={v => setNotif('recommendation', v)} />
        </SettingRow>
        <SettingRow icon={Bell} title="Weather Updates" subtitle="Monsoon and rainfall predictions">
          <Toggle enabled={notifications.weather} onChange={v => setNotif('weather', v)} />
        </SettingRow>
      </motion.div>

      {/* Appearance */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} 
        className="glass-card p-6"
      >
        <SectionHeader title="Appearance & Language" />
        <SettingRow icon={isDark ? Moon : Sun} title="Dark Mode" subtitle={isDark ? 'Currently using dark theme' : 'Currently using light theme'}>
          <Toggle enabled={isDark} onChange={toggleTheme} />
        </SettingRow>
        <SettingRow icon={Globe} title="Language" subtitle="Select your preferred language">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="form-select text-sm w-36 py-2"
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </SettingRow>
      </motion.div>

      {/* Security */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.22, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} 
        className="glass-card p-6"
      >
        <SectionHeader title="Account" />
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sky-50/60 dark:hover:bg-sky-900/20 text-sky-600 dark:text-sky-400 transition-colors group mb-2"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium font-body">Change Password</span>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50/60 dark:hover:bg-red-900/20 text-red-500 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium font-body">Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
        </button>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <FormInput label="Current Password" id="curpwd" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
                <FormInput label="New Password" id="newpwd" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
                <FormInput label="Confirm New Password" id="cfmpwd" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2"
              >
                {changingPassword
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Changing...</>
                  : <><Lock className="w-4 h-4" />Update Password</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
