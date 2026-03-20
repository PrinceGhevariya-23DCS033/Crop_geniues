import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Bell, Search, User, ChevronDown, Check, LogOut } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'

const PAGE_TITLES = {
  '/app/dashboard':          { title: 'Dashboard',           sub: 'Welcome back, Farmer' },
  '/app/crop-recommendation':{ title: 'Crop Recommendation', sub: 'AI-powered crop advisory' },
  '/app/yield-prediction':   { title: 'Yield Prediction',    sub: 'Estimate your harvest potential' },
  '/app/leaf-disease':       { title: 'Leaf Disease Detection', sub: 'Diagnose plant health instantly' },
  '/app/price-prediction':   { title: 'Price Prediction',    sub: 'Market intelligence for smart selling' },
  '/app/agri-news':          { title: 'Agriculture News',    sub: 'Live farming, price & policy updates' },
  '/app/weather':            { title: 'Weather Forecast',     sub: '7-day forecast with farming advisories' },
  '/app/history':            { title: 'History',             sub: 'Your prediction records' },
  '/app/settings':           { title: 'Settings',            sub: 'Manage your account & preferences' },
}

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { notifications, markNotificationRead, unreadCount } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const pageInfo = PAGE_TITLES[location.pathname] ?? { title: 'Crop Genius', sub: '' }

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-emerald-900/20 dark:border-emerald-900/30 bg-white/70 dark:bg-dark-800/80 backdrop-blur-xl sticky top-0 z-10">
      {/* Left: Title */}
      <div>
        <h1 className="font-display font-bold text-gray-900 dark:text-white text-lg leading-tight">{pageInfo.title}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-body">{pageInfo.sub}</p>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/50 dark:border-emerald-800/40 rounded-xl px-4 py-2 w-64 transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search crops, diseases..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full font-body"
        />
      </div>

      {/* Right: icons */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/40 dark:border-emerald-800/40 text-gray-600 dark:text-gray-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/40 dark:border-emerald-800/40 text-gray-600 dark:text-gray-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 glass-card dark:bg-dark-700 border border-emerald-200/30 dark:border-emerald-800/40 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-emerald-100/20 dark:border-emerald-900/30">
                  <p className="font-display font-semibold text-sm text-gray-900 dark:text-white">Notifications</p>
                </div>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors border-b border-emerald-100/10 dark:border-emerald-900/20 ${!n.read ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-body">{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      {n.read && <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 ml-auto mt-1" />}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/40 dark:border-emerald-800/40 hover:border-emerald-500/50 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block font-body">{user?.name?.split(' ')[0] || 'Farmer'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-48 glass-card dark:bg-dark-700 border border-emerald-200/30 dark:border-emerald-800/40 shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-emerald-100/20 dark:border-emerald-900/30">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white font-body">{user?.name || 'Farmer'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
                <button onClick={() => { setShowProfile(false); navigate('/app/settings') }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 transition-colors font-body">
                  Profile
                </button>
                <button onClick={() => { setShowProfile(false); navigate('/app/settings') }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 transition-colors font-body">
                  Settings
                </button>
                <button onClick={() => { logout(); navigate('/') }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-colors font-body flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
