import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Sprout, TrendingUp, Microscope,
  BarChart3, History, Settings, ChevronLeft, ChevronRight,
  Leaf, LogOut, Zap, Newspaper, Cloud
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import clsx from 'clsx'

const NAV_ITEMS = [
  { label: 'Dashboard',          path: '/app/dashboard',          icon: LayoutDashboard },
  { label: 'Crop Recommendation',path: '/app/crop-recommendation', icon: Sprout },
  { label: 'Yield Prediction',   path: '/app/yield-prediction',   icon: TrendingUp },
  { label: 'Leaf Disease',       path: '/app/leaf-disease',       icon: Microscope },
  { label: 'Price Prediction',   path: '/app/price-prediction',   icon: BarChart3 },
  { label: 'Agri News',          path: '/app/agri-news',          icon: Newspaper },
  { label: 'Weather',            path: '/app/weather',            icon: Cloud },
  { label: 'History',            path: '/app/history',            icon: History },
  { label: 'Settings',           path: '/app/settings',           icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp()
  const navigate = useNavigate()

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="relative flex-shrink-0 h-screen bg-dark-900 dark:bg-dark-900 border-r border-emerald-900/40 flex flex-col overflow-hidden z-20"
      style={{ background: 'linear-gradient(180deg, #011a0b 0%, #020f07 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-900/30">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <Leaf className="w-5 h-5 text-emerald-400" />
        </div>
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="font-display font-bold text-white text-lg leading-none">Crop</span>
              <span className="font-display font-bold text-emerald-400 text-lg leading-none"> Genius</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-500/70 font-mono tracking-wider">AI PLATFORM</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'sidebar-link group relative',
                  isActive ? 'active' : 'text-emerald-100/70 hover:text-emerald-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute inset-0 rounded-xl bg-emerald-500/15 border border-emerald-500/25"
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <Icon className={clsx('w-5 h-5 flex-shrink-0 z-10 relative transition-colors', isActive ? 'text-emerald-400' : 'text-emerald-600 group-hover:text-emerald-400')} />
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className={clsx('text-sm font-medium z-10 relative whitespace-nowrap', isActive ? 'text-emerald-300' : '')}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div 
                      className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-lg"
                      style={{ transition: 'opacity 200ms ease' }}
                    >
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-emerald-900/30 p-3 space-y-1">
        <button
          onClick={() => navigate('/')}
          className="sidebar-link w-full text-left text-red-400/70 hover:text-red-400 hover:bg-red-900/20"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm font-medium"
              >
                Exit to Home
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="w-full flex items-center justify-center py-2 rounded-xl text-emerald-600 hover:text-emerald-400 hover:bg-emerald-900/20 transition-colors"
        >
          {sidebarOpen
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
          }
        </button>
      </div>
    </motion.aside>
  )
}
