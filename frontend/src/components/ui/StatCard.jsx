import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend, trendUp }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', ring: 'bg-emerald-500' },
    green:   { bg: 'bg-green-500/10 dark:bg-green-500/15',   icon: 'text-green-600 dark:text-green-400',   border: 'border-green-500/20',   ring: 'bg-green-500' },
    teal:    { bg: 'bg-teal-500/10 dark:bg-teal-500/15',     icon: 'text-teal-600 dark:text-teal-400',     border: 'border-teal-500/20',    ring: 'bg-teal-500' },
    sky:     { bg: 'bg-sky-500/10 dark:bg-sky-500/15',       icon: 'text-sky-600 dark:text-sky-400',       border: 'border-sky-500/20',     ring: 'bg-sky-500' },
    amber:   { bg: 'bg-amber-500/10 dark:bg-amber-500/15',   icon: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20',   ring: 'bg-amber-500' },
    red:     { bg: 'bg-red-500/10 dark:bg-red-500/15',       icon: 'text-red-600 dark:text-red-400',       border: 'border-red-500/20',     ring: 'bg-red-500' },
  }
  const c = colorMap[color] ?? colorMap.emerald

  return (
    <div className={clsx('stat-card glass-card group', c.border)}>
      <div className="flex items-start justify-between mb-4">
        <motion.div 
          className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}
          whileHover={{ scale: 1.1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        >
          {Icon && <Icon className={clsx('w-5 h-5', c.icon)} />}
        </motion.div>
        {trend && (
          <span className={clsx(
            'text-xs font-semibold px-2 py-1 rounded-lg font-mono',
            trendUp
              ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : 'bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-none mb-1">
        {value}
      </p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5 font-body">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 font-body">{subtitle}</p>}
    </div>
  )
}
