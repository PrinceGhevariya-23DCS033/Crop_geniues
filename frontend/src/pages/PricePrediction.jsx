import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Zap, IndianRupee, ShoppingCart, Pause, Loader2, AlertCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormSelect, SectionHeader } from '@/components/ui/FormComponents'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { predictPrice, getPriceCrops, getPriceDistricts } from '@/utils/api'
import { useApp } from '@/context/AppContext'

export default function PricePrediction() {
  const { addToHistory } = useApp()
  const [form, setForm] = useState({ crop: '', district: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})
  const [crops, setCrops] = useState([])
  const [districts, setDistricts] = useState([])
  const [loadingLists, setLoadingLists] = useState(true)

  // Fetch available crops & districts on mount
  useEffect(() => {
    async function fetchLists() {
      try {
        const [c, d] = await Promise.all([getPriceCrops(), getPriceDistricts()])
        setCrops(c)
        setDistricts(d)
      } catch (err) {
        console.error('Failed to load crop/district lists:', err)
        toast.error('Could not load crop/district lists')
      } finally {
        setLoadingLists(false)
      }
    }
    fetchLists()
  }, [])

  const validate = () => {
    const e = {}
    if (!form.crop)     e.crop     = 'Select a crop'
    if (!form.district) e.district = 'Select a district'
    setErrors(e); return Object.keys(e).length === 0
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return toast.error('Please fill all required fields')
    setLoading(true); setResult(null)
    try {
      const data = await predictPrice({ commodity: form.crop, district: form.district })
      setResult(data)
      addToHistory({
        module: 'Price Prediction',
        input: `${form.crop}, ${form.district}`,
        result: `₹${Math.round(data.predicted_harvest_price)}/q`,
        confidence: `${data.expected_return_percent > 0 ? '+' : ''}${data.expected_return_percent.toFixed(1)}%`,
      })
      toast.success(`${form.crop} harvest price predicted: ₹${Math.round(data.predicted_harvest_price)}/quintal`)
    } catch (err) {
      toast.error(err.message || 'Price prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const isPositive = result && result.expected_return_percent > 0

  // Determine if the cached price data is stale (different month than requested)
  const priceDataDate = result?.environmental_data?.price_data_date  // e.g. "2026-02"
  const requestedMonth = result?.current_month                       // e.g. "2026-03"
  const isPriceStale = priceDataDate && requestedMonth && priceDataDate !== requestedMonth

  // Format "2026-02" → "Feb 2026"
  const formatMonthLabel = (ym) => {
    if (!ym) return ''
    const [y, m] = ym.split('-')
    return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2 glass-card p-6"
        >
          <SectionHeader title="Market Parameters" subtitle="Select crop and district for harvest price forecast" />
          {loadingLists ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
              <span className="text-sm text-gray-500">Loading crops & districts...</span>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect label="Crop Name *" id="crop" value={form.crop} onChange={e => set('crop', e.target.value)} error={errors.crop}>
              <option value="">Select a crop</option>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
            <FormSelect label="District *" id="dist" value={form.district} onChange={e => set('district', e.target.value)} error={errors.district}>
              <option value="">Select district</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </FormSelect>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">ℹ️ How it works:</span> The model uses current mandi prices, rainfall, NDVI satellite data, and the crop's growth cycle to predict the harvest-window price.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Predicting...</>
                : <><BarChart3 className="w-4 h-4" />Predict Harvest Price</>}
            </button>
          </form>
          )}
        </motion.div>

        {/* Results */}
        <div className="xl:col-span-3 space-y-4">
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.88 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card p-8"
              >
                <LoadingSpinner size="md" text="Fetching market intelligence..." />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="space-y-4"
              >
                {/* Price card */}
                <div className="glass-card p-6 border-2 border-emerald-400/30 dark:border-emerald-600/20 shadow-glow">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                        <IndianRupee className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Predicted Harvest Price</p>
                        <p className="font-mono font-bold text-3xl text-gray-900 dark:text-white tabular-nums">
                          ₹{Math.round(result.predicted_harvest_price).toLocaleString('en-IN')}
                          <span className="text-base text-gray-400 font-normal ml-1">/quintal</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{result.commodity} • {result.district} • {result.harvest_window_start}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Expected Return</p>
                      <p className={`font-mono font-bold text-2xl tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {result.expected_return_percent > 0 ? '+' : ''}{result.expected_return_percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Buy/Sell recommendation */}
                  <div className={`rounded-xl p-4 flex items-center gap-4 mb-5 ${
                    isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPositive ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
                    }`}>
                      {isPositive
                        ? <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        : <TrendingDown className="w-6 h-6 text-amber-600" />}
                    </div>
                    <div>
                      <p className={`font-display font-bold text-xl ${
                        isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {result.expected_return_percent > 10 ? '✓ POSITIVE OUTLOOK' : result.expected_return_percent > 0 ? '⟳ MODERATE OUTLOOK' : '⚠ CAUTION'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {result.expected_return_percent > 10
                          ? 'Strong price increase expected. Consider cultivating this crop.'
                          : result.expected_return_percent > 0
                          ? 'Modest price appreciation expected. Evaluate other factors.'
                          : 'Price may decline. Consider alternative crops.'}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Current Price — with stale data flag */}
                    <div className="bg-emerald-50/60 dark:bg-emerald-900/15 rounded-xl p-3 text-center border border-emerald-100/40 dark:border-emerald-900/20">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Current Price</p>
                      <p className="font-mono font-bold text-sm text-gray-900 dark:text-white tabular-nums">
                        ₹{Math.round(result.current_price).toLocaleString('en-IN')}/q
                      </p>
                      {isPriceStale ? (
                        <div className="mt-1.5 flex items-center justify-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md px-1.5 py-0.5">
                          <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="text-[10px] font-semibold">From {formatMonthLabel(priceDataDate)}</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center justify-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md px-1.5 py-0.5">
                          <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="text-[10px] font-semibold">{formatMonthLabel(priceDataDate || requestedMonth)}</span>
                        </div>
                      )}
                    </div>

                    {[
                      { label: 'Current Month', value: result.current_month },
                      { label: 'Growth Horizon', value: `${result.growth_horizon_months} months` },
                      { label: 'Harvest Window', value: result.harvest_window_start },
                      { label: 'Absolute Change', value: `${result.absolute_change > 0 ? '+' : ''}₹${Math.round(result.absolute_change).toLocaleString('en-IN')}` },
                      { label: 'Model Type', value: result.model_type },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-emerald-50/60 dark:bg-emerald-900/15 rounded-xl p-3 text-center border border-emerald-100/40 dark:border-emerald-900/20">
                        <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
                        <p className="font-mono font-bold text-sm text-gray-900 dark:text-white tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="glass-card p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Note:</span> This prediction is based on historical patterns, current mandi prices, rainfall data, and NDVI satellite vegetation indices. Actual prices may vary due to market dynamics, policy changes, and unforeseen events.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Predicted at: {result.prediction_timestamp}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.22, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-12 text-center border-dashed border-2 border-emerald-200/40 dark:border-emerald-800/30">
              <div className="text-5xl mb-4">💰</div>
              <p className="font-display font-semibold text-gray-900 dark:text-white mb-2">Harvest Price Forecast Appears Here</p>
              <p className="text-sm text-gray-500">Select crop and district to predict harvest-window price</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
