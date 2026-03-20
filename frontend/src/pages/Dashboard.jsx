import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Sprout, TrendingUp, Microscope, BarChart3,
  ArrowRight, Calendar, MapPin, Activity, Cloud, Wind, Droplets
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { SectionHeader } from '@/components/ui/FormComponents'
import { dashboardStats, yieldTrendData, priceTrendData, cropDistributionData } from '@/utils/dummyData'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'

// ─── Minimal Open-Meteo helpers for Dashboard widget ────────────────────────
const WX_EMOJI = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',53:'🌦️',61:'🌧️',63:'🌧️',65:'🌧️',80:'🌦️',81:'🌧️',95:'⛈️' }
const getWxEmoji = (c) => WX_EMOJI[c] ?? '🌡️'
const WX_LABEL  = { 0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',53:'Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',80:'Showers',81:'Showers',95:'Thunderstorm' }
const getWxLabel = (c) => WX_LABEL[c] ?? 'Fair'

async function geocodeCity(name) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`)
  const d = await r.json()
  if (!d.results?.length) throw new Error('not found')
  return { lat: d.results[0].latitude, lon: d.results[0].longitude }
}

async function fetchCurrentWeather(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto&forecast_days=1`
  )
  return r.json()
}

const MODULES = [
  { title: 'Crop Recommendation', path: '/app/crop-recommendation', icon: Sprout,     color: 'from-emerald-500 to-green-600',  desc: 'Get AI crop suggestions' },
  { title: 'Yield Prediction',    path: '/app/yield-prediction',    icon: TrendingUp,  color: 'from-green-500 to-teal-600',    desc: 'Estimate harvest yield' },
  { title: 'Leaf Disease',        path: '/app/leaf-disease',        icon: Microscope,  color: 'from-teal-500 to-cyan-600',     desc: 'Detect plant diseases' },
  { title: 'Price Prediction',    path: '/app/price-prediction',    icon: BarChart3,   color: 'from-sky-500 to-blue-600',      desc: 'Forecast market prices' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-700 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 shadow-xl text-xs font-body">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 capitalize">{p.name}:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { history } = useApp()
  const { user } = useAuth()

  const [wxData, setWxData] = useState(null)
  const [wxLoading, setWxLoading] = useState(false)

  const loadDashboardWeather = useCallback(async (loc) => {
    if (!loc?.trim()) return
    setWxLoading(true)
    try {
      const place = loc.includes(',') ? loc.split(',')[0].trim() : loc.trim()
      const { lat, lon } = await geocodeCity(place)
      const d = await fetchCurrentWeather(lat, lon)
      setWxData({
        temp: Math.round(d.current_weather?.temperature ?? 0),
        code: d.daily?.weathercode?.[0] ?? 0,
        max:  Math.round(d.daily?.temperature_2m_max?.[0] ?? 0),
        min:  Math.round(d.daily?.temperature_2m_min?.[0] ?? 0),
        wind: Math.round(d.current_weather?.windspeed ?? 0),
      })
    } catch {}
    setWxLoading(false)
  }, [])

  useEffect(() => {
    if (user?.location) loadDashboardWeather(user.location)
  }, [user?.location])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-5 bg-gradient-to-r from-emerald-600/10 to-green-600/5 border border-emerald-200/50 dark:border-emerald-700/30"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-glow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 dark:text-white text-lg">{greeting()}, {user?.name?.split(' ')[0] || 'Farmer'} 👋</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" /> {user?.location || 'India'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="badge-success">Kharif Season</span>
            {/* Live weather mini-widget */}
            {wxLoading && (
              <div className="animate-pulse h-8 w-36 rounded-xl bg-sky-500/20 border border-sky-400/20" />
            )}
            {wxData && !wxLoading && (
              <button
                onClick={() => navigate('/app/weather')}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/25 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 transition-all font-semibold group"
                title="View full forecast"
              >
                <span className="text-base">{getWxEmoji(wxData.code)}</span>
                <span className="font-bold text-sm text-gray-800 dark:text-white">{wxData.temp}°C</span>
                <span className="text-gray-500 dark:text-gray-400">{getWxLabel(wxData.code)}</span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-orange-500">{wxData.max}°</span>
                <span className="text-blue-400">{wxData.min}°</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {!wxData && !wxLoading && (
              <span className="badge-info">Normal Monsoon Expected</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div 
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {dashboardStats.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.22, 
              delay: i * 0.05,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Yield Trend */}
        <div className="xl:col-span-2 chart-container">
          <SectionHeader title="Yield Trends" subtitle="Monthly yield comparison (t/ha)" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={yieldTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gRice"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gWheat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMaize" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontFamily: 'Outfit' }} />
              <Area type="monotone" dataKey="rice"  stroke="#10b981" strokeWidth={2} fill="url(#gRice)"  name="Rice" />
              <Area type="monotone" dataKey="wheat" stroke="#34d399" strokeWidth={2} fill="url(#gWheat)" name="Wheat" />
              <Area type="monotone" dataKey="maize" stroke="#6ee7b7" strokeWidth={2} fill="url(#gMaize)" name="Maize" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Crop distribution */}
        <div className="chart-container">
          <SectionHeader title="Crop Distribution" subtitle="By area coverage" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={cropDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {cropDistributionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ borderRadius: '12px', fontSize: '12px', fontFamily: 'Outfit' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontFamily: 'Outfit' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Price Trends */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="chart-container"
      >
        <SectionHeader title="Price Trends" subtitle="Market price per quintal (₹)" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priceTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Outfit' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontFamily: 'Outfit' }} />
            <Bar dataKey="rice"   fill="#10b981" radius={[4, 4, 0, 0]} name="Rice" />
            <Bar dataKey="wheat"  fill="#34d399" radius={[4, 4, 0, 0]} name="Wheat" />
            <Bar dataKey="tomato" fill="#6ee7b7" radius={[4, 4, 0, 0]} name="Tomato" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Module quick access */}
      <div>
        <SectionHeader title="Quick Access" subtitle="Jump to any module" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.22,
                  delay: 0.4 + i * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  y: -4,
                  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(mod.path)}
                className="glass-card p-5 text-left group"
              >
                <motion.div 
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3 shadow-md`}
                  whileHover={{ 
                    scale: 1.1,
                    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <p className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-1">{mod.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{mod.desc}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Open <ArrowRight className="w-3 h-3" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Recent history */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-6"
      >
        <SectionHeader title="Recent Predictions" subtitle="Your last 5 AI queries"
          action={
            <button onClick={() => navigate('/app/history')} className="btn-ghost text-xs flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-emerald-100/30 dark:border-emerald-900/20">
                {['Module', 'Input', 'Result', 'Confidence', 'Date'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map((row, i) => (
                <motion.tr 
                  key={row.id} 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.22,
                    delay: 0.6 + i * 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="border-b border-emerald-50/30 dark:border-emerald-900/10 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
                  style={{ transition: 'background-color 200ms ease' }}
                >
                  <td className="py-3 px-3">
                    <span className="badge-info text-xs">{row.module}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-400 text-xs max-w-[140px] truncate">{row.input}</td>
                  <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{row.result}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">{row.confidence}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{row.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
