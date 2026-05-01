import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Zap, Lightbulb, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FormInput, FormSelect, SectionHeader } from '@/components/ui/FormComponents'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cropsList, irrigationTypes } from '@/utils/dummyData'
import { predictYield } from '@/utils/api'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { STATE_NAMES, getDistricts } from '@/data/districts'

export default function YieldPrediction() {
  const { user } = useAuth()
  const { addToHistory } = useApp()
  const [form, setForm] = useState({
    crop: '',
    area: '', soilQuality: 7, rainfall: '', temperature: '',
    fertilizer: '', irrigationType: '', state: '', district: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  const districts = useMemo(() => getDistricts(form.state), [form.state])

  useEffect(() => {
    const preferredCrop = user?.crop?.trim() || localStorage.getItem('recentYieldCrop') || ''
    if (preferredCrop) setForm(prev => ({ ...prev, crop: preferredCrop }))
  }, [user?.crop])

  const validate = () => {
    const e = {}
    if (!form.crop) e.crop = 'Select a crop'
    if (!form.area) e.area = 'Area is required'
    if (!form.state) e.state = 'State is required'
    if (!form.district) e.district = 'District is required'
    if (!form.irrigationType) e.irrigationType = 'Select irrigation type'
    if ((form.rainfall && !form.temperature) || (!form.rainfall && form.temperature)) {
      e.rainfall = 'Provide both rainfall and temperature for manual weather override'
      e.temperature = 'Provide both rainfall and temperature for manual weather override'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const setField = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'state') next.district = ''
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return toast.error('Please fill all required fields')
    setLoading(true); setResult(null)
    try {
      const data = await predictYield({
        crop: form.crop,
        area: Number(form.area),
        soilQuality: Number(form.soilQuality),
        rainfall: form.rainfall ? Number(form.rainfall) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        fertilizer: form.fertilizer ? Number(form.fertilizer) : 0,
        irrigationType: form.irrigationType,
        state: form.state,
        district: form.district,
      })

      const mapped = {
        yield: Number(data.predicted_yield).toFixed(2),
        confidence: Number(data.confidence).toFixed(1),
        tips: data.tips || [],
        chartData: data.chart_data || [],
      }

      setResult(mapped)
      localStorage.setItem('recentYieldCrop', form.crop)

      addToHistory({
        module: 'Yield Prediction',
        input: `${form.crop}, ${form.area} ha, ${form.irrigationType}, ${form.district}, ${form.state}`,
        result: `${mapped.yield} t/ha`,
        confidence: `${mapped.confidence}%`,
      })
      toast.success(`Predicted yield: ${mapped.yield} t/ha`)
    } catch (err) {
      toast.error(err.message || 'Yield prediction failed')
    } finally {
      setLoading(false)
    }
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
          <SectionHeader title="Field Parameters" subtitle="Enter your field data" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect label="Crop *" id="crop" value={form.crop}
              onChange={e => set('crop', e.target.value)} error={errors.crop}
            >
              <option value="">Select a crop</option>
              {cropsList.map(crop => <option key={crop} value={crop}>{crop}</option>)}
            </FormSelect>
            <FormInput label="Area (hectares) *" id="area" type="number" placeholder="e.g. 5.5"
              value={form.area} onChange={e => set('area', e.target.value)} error={errors.area}
            />
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="form-label !mb-0">Soil Quality Index</label>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{form.soilQuality}/10</span>
              </div>
              <input type="range" min={1} max={10} value={form.soilQuality}
                onChange={e => set('soilQuality', Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Rainfall (mm) - Optional" id="rainfall" type="number" placeholder="Auto from Open-Meteo"
                value={form.rainfall} onChange={e => set('rainfall', e.target.value)} error={errors.rainfall}
              />
              <FormInput label="Temperature (°C) - Optional" id="temp" type="number" placeholder="Auto from Open-Meteo"
                value={form.temperature} onChange={e => set('temperature', e.target.value)} error={errors.temperature}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="State *" id="state" value={form.state}
                onChange={e => setField('state', e.target.value)} error={errors.state}
              >
                <option value="">Select state / UT</option>
                {STATE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
              <FormSelect label="District *" id="district" value={form.district}
                onChange={e => set('district', e.target.value)} error={errors.district}
              >
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </FormSelect>
            </div>
            <FormInput label="Fertilizer Usage (kg/ha)" id="fert" type="number" placeholder="e.g. 120"
              value={form.fertilizer} onChange={e => set('fertilizer', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Crop, state, and district are used as model inputs. Leave rainfall and temperature empty to auto-fetch weather from Open-Meteo for selected district/state.
            </p>
            <FormSelect label="Irrigation Type *" id="irr" value={form.irrigationType}
              onChange={e => set('irrigationType', e.target.value)} error={errors.irrigationType}>
              <option value="">Select irrigation type</option>
              {irrigationTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </FormSelect>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Computing...</>
                : <><TrendingUp className="w-4 h-4" />Predict Yield</>}
            </button>
          </form>
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
                <LoadingSpinner size="md" text="Running yield prediction model..." />
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
                {/* Main result */}
                <div className="glass-card p-6 border-2 border-emerald-400/30 dark:border-emerald-600/20 shadow-glow">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Predicted Yield</p>
                        <p className="font-display font-bold text-3xl text-emerald-600 dark:text-emerald-400">
                          {result.yield} <span className="text-lg text-gray-500">t/ha</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">{result.confidence}%</p>
                      <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="badge-success">
                        <Target className="w-3 h-3" />
                        {parseFloat(result.yield) >= 4 ? 'Above Average' : 'Average'}
                      </span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold uppercase tracking-wide">Weekly Growth Forecast</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={result.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gEst" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gOpt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontFamily: 'Outfit' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="estimated" stroke="#10b981" strokeWidth={2} fill="url(#gEst)" name="Estimated" />
                        <Area type="monotone" dataKey="optimal"   stroke="#6ee7b7" strokeWidth={2} fill="url(#gOpt)" name="Optimal" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tips */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-display font-semibold text-gray-900 dark:text-white">Yield Improvement Tips</p>
                  </div>
                  <ul className="space-y-2.5">
                    {result.tips.map((tip, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-3 items-start"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{tip}</p>
                      </motion.li>
                    ))}
                  </ul>
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
              <div className="text-5xl mb-4">📊</div>
              <p className="font-display font-semibold text-gray-900 dark:text-white mb-2">Yield Forecast Appears Here</p>
              <p className="text-sm text-gray-500">Fill the form and click Predict Yield to see your forecast</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
