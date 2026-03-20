import clsx from 'clsx'

export function FormInput({ label, id, error, className, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input id={id} className={clsx('form-input', error && 'border-red-400 focus:ring-red-400')} {...props} />
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  )
}

export function FormSelect({ label, id, error, children, className, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <div className="relative">
        <select id={id} className={clsx('form-select pr-8', error && 'border-red-400')} {...props}>
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-body">{error}</p>}
    </div>
  )
}

export function FormRange({ label, id, value, min = 0, max = 100, unit = '', className, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="form-label !mb-0">{label}</label>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{value}{unit}</span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
        {...props}
      />
      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="section-title !mb-0">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-body">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function ResultBadge({ status }) {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
    info:    'badge-info',
    none:    'badge-success',
  }
  const labels = {
    success: '✓ Healthy', warning: '⚠ Moderate Risk', danger: '✗ High Risk', info: 'ℹ Info', none: '✓ Healthy'
  }
  return <span className={variants[status] ?? variants.info}>{labels[status] ?? status}</span>
}
