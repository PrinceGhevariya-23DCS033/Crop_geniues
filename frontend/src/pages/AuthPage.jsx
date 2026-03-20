import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

function InputField({
  icon: Icon,
  id,
  label,
  type = 'text',
  placeholder,
  required = true,
  value,
  error,
  onChange,
  showPassword,
  onTogglePassword,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 font-body">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={id}
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-body bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/50 dark:border-emerald-800/40 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
        />
        {type === 'password' && (
          <button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

export default function AuthPage() {
  const { login, register } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', location: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e = {}
    if (!isLogin && !form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password })
        toast.success('Welcome back! 🌾')
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          location: form.location,
        })
        toast.success('Account created! Welcome to Crop Genius 🌱')
      }
      navigate('/app/dashboard')
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-emerald-200/20 dark:bg-emerald-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-green-200/20 dark:bg-green-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Crop Genius</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-body">AI-Powered Agriculture Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 shadow-xl p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100/80 dark:bg-dark-700/60 rounded-xl p-1 mb-6">
            {['Login', 'Register'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(i === 0); setErrors({}) }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 font-body ${
                  (i === 0 ? isLogin : !isLogin)
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <InputField
                    icon={User}
                    id="name"
                    label="Full Name"
                    placeholder="Enter your name"
                    value={form.name}
                    error={errors.name}
                    onChange={e => set('name', e.target.value)}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(v => !v)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              icon={Mail}
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              error={errors.email}
              onChange={e => set('email', e.target.value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(v => !v)}
            />
            <InputField
              icon={Lock}
              id="password"
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              error={errors.password}
              onChange={e => set('password', e.target.value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(v => !v)}
            />

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="extra-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <InputField
                    icon={Phone}
                    id="phone"
                    label="Phone"
                    placeholder="+91 98765 43210"
                    required={false}
                    value={form.phone}
                    error={errors.phone}
                    onChange={e => set('phone', e.target.value)}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(v => !v)}
                  />
                  <InputField
                    icon={MapPin}
                    id="location"
                    label="Location"
                    placeholder="City, State"
                    required={false}
                    value={form.location}
                    error={errors.location}
                    onChange={e => set('location', e.target.value)}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(v => !v)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-60 flex items-center justify-center gap-2 transition-all duration-200 font-body mt-6"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isLogin ? 'Logging in...' : 'Creating account...'}</>
              ) : (
                <>{isLogin ? 'Login' : 'Create Account'}</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 font-body">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setIsLogin(v => !v); setErrors({}) }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 font-body">
          ISRO Hackathon 2026 · Crop Genius v2.0
        </p>
      </motion.div>
    </div>
  )
}
