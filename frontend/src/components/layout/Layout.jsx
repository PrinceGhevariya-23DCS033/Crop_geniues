import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-dark-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        {/* Page area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-emerald-50/20 to-gray-50 dark:from-dark-900 dark:via-dark-800/50 dark:to-dark-900 bg-grid">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
