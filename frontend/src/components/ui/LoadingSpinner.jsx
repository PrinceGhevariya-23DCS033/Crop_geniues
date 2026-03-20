import { motion } from 'framer-motion'

export function LoadingSpinner({ size = 'md', text = 'Analyzing...' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-12 h-12', lg: 'w-16 h-16' }
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className={`${sizes[size]} border-2 border-emerald-200/30 border-t-emerald-500 rounded-full`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-1 border-2 border-transparent border-b-emerald-400/60 rounded-full`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
      {text && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-body">{text}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="md" text="Processing your request..." />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-200/60 dark:bg-gray-700/60 shimmer" />
        <div className="w-16 h-6 rounded-lg bg-gray-200/60 dark:bg-gray-700/60" />
      </div>
      <div className="w-24 h-7 rounded-lg bg-gray-200/60 dark:bg-gray-700/60 mb-2 shimmer" />
      <div className="w-32 h-4 rounded bg-gray-200/40 dark:bg-gray-700/40 mb-1" />
      <div className="w-20 h-3 rounded bg-gray-200/30 dark:bg-gray-700/30" />
    </div>
  )
}
