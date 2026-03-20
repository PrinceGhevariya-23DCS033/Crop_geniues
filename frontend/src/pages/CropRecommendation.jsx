import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, Zap, FlaskConical, CloudRain, Thermometer, Droplets, Info, MapPin, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormSelect, SectionHeader } from '@/components/ui/FormComponents'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { soilTypes, seasons } from '@/utils/dummyData'
import { predictCrop } from '@/utils/api'
import { useApp } from '@/context/AppContext'
import { STATE_NAMES, getDistricts } from '@/data/districts'

const CROP_EMOJI = {
  Rice: '🌾', Wheat: '🌾', Maize: '🌽', Chickpea: '🫘', Sugarcane: '🎋',
  Cotton: '☁️', Coffee: '☕', Banana: '🍌', Mango: '🥭', default: '🌱'
}

const InputRange = ({ label, id, value, min, max, unit, icon: Icon, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-1.5 form-label !mb-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-emerald-500" />}
        {label}
      </label>
      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
        {value}{unit}
      </span>
    </div>
    <input
      type="range" id={id} min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
    />
    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
      <span>{min}{unit}</span><span>{max}{unit}</span>
    </div>
  </div>
)

export default function CropRecommendation() {
  const { addToHistory } = useApp()
  const [form, setForm] = useState({
    nitrogen: 60, phosphorus: 40, potassium: 40,
    ph: 6.5,
    state: '', district: '',
    soilType: '', season: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  // Districts for the selected state
  const districts = useMemo(() => getDistricts(form.state), [form.state])

  const validate = () => {
    const e = {}
    if (!form.state)    e.state    = 'Please select a state'
    if (!form.district) e.district = 'Please select a district'
    if (!form.soilType) e.soilType = 'Please select a soil type'
    if (!form.season)   e.season   = 'Please select a season'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return toast.error('Please fill all required fields')
    setLoading(true)
    setResult(null)
    // Build place string recognised by Open-Meteo geocoding
    const place = `${form.district}, ${form.state}, India`
    try {
      const data = await predictCrop({
        place,
        N: form.nitrogen,
        P: form.phosphorus,
        K: form.potassium,
        ph: form.ph,
      })
      const rec = {
        name: data.recommended_crop,
        confidence: Math.round(data.confidence * 100 * 10) / 10,
        season: form.season,
        yield: '—',
        fertilizer: `Based on N:${form.nitrogen}, P:${form.phosphorus}, K:${form.potassium} kg/ha`,
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        location: data.location,
      }
      setResult(rec)
      addToHistory({
        module: 'Crop Recommendation',
        input: `${form.district}, ${form.state} | N:${form.nitrogen}, P:${form.phosphorus}, K:${form.potassium}, pH:${form.ph}`,
        result: rec.name,
        confidence: `${rec.confidence}%`,
      })
      toast.success(`🌱 ${rec.name} recommended with ${rec.confidence}% confidence!`)
    } catch (err) {
      toast.error(err.message || 'Failed to get recommendation')
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      // Reset district when state changes
      if (k === 'state') next.district = ''
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <div className="xl:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-6"
          >
            <SectionHeader
              title="Soil & Climate Parameters"
              subtitle="Fill in your field data for accurate recommendations"
            />
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nutrient sliders */}
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 space-y-4">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Soil Nutrients (kg/ha)
                </p>
                <InputRange label="Nitrogen (N)" id="n" value={form.nitrogen} min={0} max={200} unit=" kg/ha" icon={FlaskConical} onChange={v => set('nitrogen', v)} />
                <InputRange label="Phosphorus (P)" id="p" value={form.phosphorus} min={0} max={150} unit=" kg/ha" icon={FlaskConical} onChange={v => set('phosphorus', v)} />
                <InputRange label="Potassium (K)" id="k" value={form.potassium} min={0} max={200} unit=" kg/ha" icon={FlaskConical} onChange={v => set('potassium', v)} />
              </div>

              {/* Climate — auto-fetched from selected district */}
              <div className="bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-4 border border-sky-100 dark:border-sky-900/30 space-y-4">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location &amp; Soil pH
                </p>

                {/* State dropdown */}
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" /> State *
                  </label>
                  <div className="relative">
                    <select
                      value={form.state}
                      onChange={e => set('state', e.target.value)}
                      className="form-input w-full appearance-none pr-8"
                    >
                      <option value="">Select state / UT</option>
                      {STATE_NAMES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                </div>

                {/* District dropdown */}
                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" /> District *
                  </label>
                  <div className="relative">
                    <select
                      value={form.district}
                      onChange={e => set('district', e.target.value)}
                      disabled={!form.state}
                      className="form-input w-full appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {form.state ? 'Select district' : '— Select a state first —'}
                      </option>
                      {districts.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
                  {form.district && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Weather auto-fetched via Open-Meteo for {form.district}, {form.state}
                    </p>
                  )}
                  {!form.district && (
                    <p className="text-[10px] text-gray-400 mt-1">Temperature, humidity &amp; rainfall are auto-fetched from Open-Meteo</p>
                  )}
                </div>

                <InputRange label="Soil pH" id="ph" value={form.ph} min={0} max={14} unit="" icon={FlaskConical} onChange={v => set('ph', v)} />
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect label="Soil Type *" id="soil" value={form.soilType} onChange={e => set('soilType', e.target.value)} error={errors.soilType}>
                  <option value="">Select soil type</option>
                  {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Season *" id="season" value={form.season} onChange={e => set('season', e.target.value)} error={errors.season}>
                  <option value="">Select season</option>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                  : <><Zap className="w-4 h-4" />Recommend Crop</>}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Result panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tips card */}
          <motion.div 
            initial={{ opacity: 0, y: 6 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.22, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card p-5 border border-emerald-200/40 dark:border-emerald-800/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-display">How to use</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">1.</span>Adjust soil nutrient sliders to match your soil test report</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">2.</span>Select your <strong>State</strong> then your <strong>District</strong> — weather is auto-fetched via Open-Meteo</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">3.</span>Set soil pH and select soil type &amp; season from dropdowns</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">4.</span>Click "Recommend Crop" to get AI prediction</li>
            </ul>
          </motion.div>

          {/* Loading */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card p-6"
              >
                <LoadingSpinner size="md" text="Fetching weather data & running AI model..." />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card p-6 border-2 border-emerald-400/40 dark:border-emerald-600/30 shadow-glow"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-emerald-100/30 dark:border-emerald-900/20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-3xl shadow-lg">
                    {CROP_EMOJI[result.name] ?? CROP_EMOJI.default}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Top Recommendation</p>
                    <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{result.name}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-mono font-bold text-2xl text-emerald-600 dark:text-emerald-400">{result.confidence}%</p>
                    <p className="text-xs text-gray-500">Confidence</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mb-5">
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Location', value: result.location || '—' },
                    { label: 'Suitable Season', value: result.season },
                    { label: 'Temperature', value: result.temperature ? `${result.temperature}°C` : '—' },
                    { label: 'Humidity', value: result.humidity ? `${result.humidity}%` : '—' },
                    { label: 'Rainfall (6mo)', value: result.rainfall ? `${result.rainfall} mm` : '—' },
                    { label: 'Soil pH', value: form.ph },
                  ].map(({ label, value }, i) => (
                    <motion.div 
                      key={label} 
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: 0.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-emerald-50/60 dark:bg-emerald-900/20 rounded-xl p-3"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Fertilizer */}
                <div className="mt-3 bg-soil-100/40 dark:bg-amber-900/20 border border-amber-200/40 dark:border-amber-800/30 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Fertilizer Recommendation</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{result.fertilizer}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  <span className="badge-success">Best fit for your conditions</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.22, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-8 text-center border-dashed border-2 border-emerald-200/40 dark:border-emerald-800/30"
            >
              <div className="text-5xl mb-3">🌱</div>
              <p className="font-display font-semibold text-gray-900 dark:text-white mb-1">Your Results Appear Here</p>
              <p className="text-sm text-gray-500">Fill the form and click Recommend Crop</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
