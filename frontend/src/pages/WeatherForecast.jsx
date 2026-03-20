import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  MapPin, Search, Wind, Droplets, Thermometer, RefreshCw,
  ChevronDown, Sprout, AlertTriangle, CloudRain, Eye,
  Sunset, Sunrise, Navigation, CloudLightning
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { STATE_NAMES, getDistricts, getDistrictCoords } from '@/data/districts'

// ─── Weather code library ─────────────────────────────────────────────────────
const WX = {
  0:  { label: 'Clear Sky',       emoji: '☀️',  theme: 'sunny'  },
  1:  { label: 'Mostly Clear',    emoji: '🌤️',  theme: 'sunny'  },
  2:  { label: 'Partly Cloudy',   emoji: '⛅',  theme: 'cloudy' },
  3:  { label: 'Overcast',        emoji: '☁️',  theme: 'cloudy' },
  45: { label: 'Foggy',           emoji: '🌫️',  theme: 'fog'   },
  48: { label: 'Icy Fog',         emoji: '🌫️',  theme: 'fog'   },
  51: { label: 'Light Drizzle',   emoji: '🌦️',  theme: 'rain'  },
  53: { label: 'Drizzle',         emoji: '🌦️',  theme: 'rain'  },
  55: { label: 'Heavy Drizzle',   emoji: '🌦️',  theme: 'rain'  },
  61: { label: 'Light Rain',      emoji: '🌧️',  theme: 'rain'  },
  63: { label: 'Moderate Rain',   emoji: '🌧️',  theme: 'rain'  },
  65: { label: 'Heavy Rain',      emoji: '🌧️',  theme: 'storm' },
  80: { label: 'Light Showers',   emoji: '🌦️',  theme: 'rain'  },
  81: { label: 'Showers',         emoji: '🌧️',  theme: 'rain'  },
  82: { label: 'Heavy Showers',   emoji: '⛈️',  theme: 'storm' },
  95: { label: 'Thunderstorm',    emoji: '⛈️',  theme: 'storm' },
  96: { label: 'Thunderstorm',    emoji: '⛈️',  theme: 'storm' },
  99: { label: 'Severe Storm',    emoji: '🌪️',  theme: 'storm' },
}
const getWx = (code) => WX[code] ?? WX[0]

const THEME_BG = {
  sunny:  'from-amber-500 via-orange-400 to-sky-400',
  cloudy: 'from-slate-500 via-sky-500 to-blue-600',
  fog:    'from-gray-500 via-slate-400 to-gray-600',
  rain:   'from-blue-700 via-blue-600 to-indigo-700',
  storm:  'from-slate-800 via-indigo-900 to-slate-900',
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatDay(dateStr, short = false) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return (short ? SHORT_DAYS : DAYS)[d.getDay()]
}

function formatHour(isoStr) {
  const d = new Date(isoStr)
  const h = d.getHours()
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

// ─── Geocoding + Weather fetchers (direct Open-Meteo, no key needed) ──────────
async function geocode(placeName) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeName)}&count=1&format=json`
  )
  const d = await res.json()
  if (!d.results?.length) throw new Error('Location not found')
  const r = d.results[0]
  return { lat: r.latitude, lon: r.longitude, name: r.name, admin: r.admin1 ?? '' }
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
      'weathercode', 'windspeed_10m_max', 'precipitation_probability_max'
    ].join(','),
    hourly: [
      'temperature_2m', 'precipitation', 'relativehumidity_2m',
      'weathercode', 'windspeed_10m'
    ].join(','),
    current_weather: 'true',
    timezone: 'auto',
    forecast_days: 7,
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  return res.json()
}

// ─── Farming advisory generator ───────────────────────────────────────────────
function buildAdvisory(wx, daily) {
  const advice = []
  const rain3d = daily.precipitation_sum?.slice(0, 3).reduce((a, v) => a + (v || 0), 0) ?? 0
  const maxTemp = daily.temperature_2m_max?.[0] ?? 30
  const minTemp = daily.temperature_2m_min?.[0] ?? 20
  const pp = daily.precipitation_probability_max?.[0] ?? 0
  const theme = getWx(wx?.weathercode ?? 0).theme

  if (theme === 'storm') {
    advice.push({ icon: '⚠️', color: 'red',    title: 'Storm Alert',        body: 'Secure all farm equipment. Avoid field work. Tie up young plants and check drainage.' })
    advice.push({ icon: '💧', color: 'red',    title: 'Flood Risk',         body: 'Heavy rain expected. Ensure drainage channels are clear to prevent waterlogging.' })
  } else if (theme === 'rain') {
    advice.push({ icon: '🌧️', color: 'blue',   title: 'Rain — Skip Irrigation', body: 'Natural rainfall will cover water needs today. Turn off irrigation systems.' })
    advice.push({ icon: '🚫', color: 'orange', title: 'Delay Pesticides',   body: 'Avoid spraying pesticides or fertilizers. Rain will wash them off before absorption.' })
  } else if (rain3d > 20) {
    advice.push({ icon: '💧', color: 'blue',   title: 'Rain in 3 Days',     body: 'Rain forecast coming — reduce irrigation over the next 2 days to avoid overwatering.' })
  } else if (theme === 'sunny' && maxTemp > 35) {
    advice.push({ icon: '🌡️', color: 'orange', title: 'Heat Stress Risk',   body: 'Very high temperatures. Consider mulching and extra irrigation in morning/evening hours.' })
    advice.push({ icon: '☀️', color: 'yellow', title: 'Good Drying Day',    body: 'Ideal conditions for drying harvested produce, grains, and hay.' })
  } else if (theme === 'sunny') {
    advice.push({ icon: '✅', color: 'green',  title: 'Good Field Day',     body: 'Excellent conditions for ploughing, sowing, transplanting, and harvesting operations.' })
    advice.push({ icon: '🌿', color: 'green',  title: 'Pesticide Window',   body: 'Clear sky — ideal time for pesticide and foliar fertilizer applications.' })
  } else if (theme === 'fog') {
    advice.push({ icon: '👁️', color: 'gray',   title: 'Low Visibility',     body: 'Foggy morning expected. Delay tractor/vehicle movement until fog clears by mid-morning.' })
    advice.push({ icon: '🍄', color: 'orange', title: 'Fungal Risk',        body: 'High moisture in fog promotes fungal diseases. Monitor crops and apply fungicide if needed.' })
  } else {
    advice.push({ icon: '✅', color: 'green',  title: 'Good Field Day',     body: 'Suitable conditions for most farming activities. Plan irrigation and scouting today.' })
  }

  if (minTemp < 10) {
    advice.push({ icon: '🥶', color: 'blue',   title: 'Cold Night Warning', body: 'Temperatures dropping below 10°C tonight. Protect sensitive seedlings with covers or mulch.' })
  }
  if (pp >= 70) {
    advice.push({ icon: '🌂', color: 'teal',   title: 'High Rain Probability', body: `${pp}% chance of rain today. Hold off on harvesting and keep cut crops sheltered.` })
  }

  return advice
}

// ─── Color badge for advisory ─────────────────────────────────────────────────
const ADV_COLORS = {
  red:    'bg-red-500/15 border-red-400/30 text-red-200',
  orange: 'bg-orange-500/15 border-orange-400/30 text-orange-200',
  yellow: 'bg-yellow-500/15 border-yellow-400/30 text-yellow-200',
  blue:   'bg-blue-500/15 border-blue-400/30 text-blue-200',
  teal:   'bg-teal-500/15 border-teal-400/30 text-teal-200',
  green:  'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
  gray:   'bg-gray-500/15 border-gray-400/30 text-gray-200',
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a1628]/90 border border-sky-500/30 rounded-xl p-3 shadow-2xl text-xs font-body backdrop-blur-xl">
      <p className="text-sky-300 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-bold">{p.value}{unit ?? ''}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Animated background particles ───────────────────────────────────────────
function SkyParticles({ theme }) {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 6, dur: 4 + Math.random() * 5,
    size: 4 + Math.random() * 8,
  })), [])

  if (theme === 'sunny') return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.slice(0, 8).map(p => (
        <motion.div key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{ left: `${p.x}%`, width: p.size, height: p.size }}
          animate={{ y: ['-5%', '-20%'], opacity: [0, 0.6, 0] }}
          transition={{ repeat: Infinity, duration: p.dur, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )

  if (theme === 'rain' || theme === 'storm') return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div key={p.id}
          className="absolute w-px bg-blue-200/40 rounded-full"
          style={{ left: `${p.x}%`, height: 12 + p.size }}
          animate={{ y: ['-5%', '110%'], opacity: [0, 0.8, 0] }}
          transition={{ repeat: Infinity, duration: p.dur * 0.5, delay: p.delay * 0.4, ease: 'linear' }}
        />
      ))}
    </div>
  )

  return null
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WeatherForecast() {
  const { user } = useAuth()
  const hourlyRef = useRef(null)

  // Location state (state + district pickers)
  const [selState, setSelState]     = useState('')
  const [selDistrict, setSelDistrict] = useState('')
  const [searchText, setSearchText] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef(null)

  // Weather data state
  const [geo, setGeo]               = useState(null)   // { lat, lon, name, admin }
  const [weather, setWeather]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const districts = useMemo(() => getDistricts(selState), [selState])

  // ── Close picker on outside click ──
  useEffect(() => {
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Auto-load from user profile on mount ──
  useEffect(() => {
    const loc = user?.location?.trim()
    if (loc) {
      setSearchText(loc)
      loadWeather(loc)
    }
  }, [user?.location])

  const loadWeather = useCallback(async (placeName) => {
    if (!placeName?.trim()) return
    setLoading(true)
    setError('')
    try {
      const g = await geocode(placeName.trim())
      const w = await fetchForecast(g.lat, g.lon)
      setGeo(g)
      setWeather(w)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message === 'Location not found'
        ? `"${placeName}" not found. Try a nearby city name.`
        : 'Could not fetch weather. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLocationSubmit = () => {
    if (selState && selDistrict) {
      const place = selDistrict
      setSearchText(`${selDistrict}, ${selState}`)
      setShowPicker(false)
      loadWeather(place)
    } else if (searchText.trim()) {
      setShowPicker(false)
      loadWeather(searchText.trim())
    }
  }

  // ── Derive useful slices of data ──
  const current = weather?.current_weather
  const daily   = weather?.daily ?? {}
  const hourly  = weather?.hourly ?? {}

  const today = useMemo(() => {
    if (!daily.time?.length) return null
    return {
      max: Math.round(daily.temperature_2m_max?.[0] ?? 0),
      min: Math.round(daily.temperature_2m_min?.[0] ?? 0),
      rain: (daily.precipitation_sum?.[0] ?? 0).toFixed(1),
      windMax: Math.round(daily.windspeed_10m_max?.[0] ?? 0),
      pp: daily.precipitation_probability_max?.[0] ?? 0,
      code: daily.weathercode?.[0] ?? 0,
    }
  }, [daily])

  // Get current hour's humidity from hourly data
  const nowHumidity = useMemo(() => {
    if (!hourly.time?.length) return '--'
    const nowHour = new Date().toISOString().slice(0, 13)
    const idx = hourly.time.findIndex(t => t.startsWith(nowHour))
    return idx >= 0 ? Math.round(hourly.relativehumidity_2m?.[idx] ?? 0) : '--'
  }, [hourly])

  // Build 24h hourly chart data (next 24 data points from current hour)
  const hourlyChartData = useMemo(() => {
    if (!hourly.time?.length) return []
    const nowHour = new Date().toISOString().slice(0, 13)
    const startIdx = Math.max(0, hourly.time.findIndex(t => t.startsWith(nowHour)))
    return hourly.time.slice(startIdx, startIdx + 24).map((t, i) => ({
      time: formatHour(t),
      temp: Math.round(hourly.temperature_2m?.[startIdx + i] ?? 0),
      rain: +(hourly.precipitation?.[startIdx + i] ?? 0).toFixed(2),
    }))
  }, [hourly])

  // Build 7-day daily chart data
  const dailyChartData = useMemo(() => {
    if (!daily.time?.length) return []
    return daily.time.map((t, i) => ({
      day: formatDay(t, true),
      max: Math.round(daily.temperature_2m_max?.[i] ?? 0),
      min: Math.round(daily.temperature_2m_min?.[i] ?? 0),
      rain: +(daily.precipitation_sum?.[i] ?? 0).toFixed(1),
    }))
  }, [daily])

  const wxNow     = getWx(today?.code ?? 0)
  const skyTheme  = wxNow.theme
  const skyBg     = THEME_BG[skyTheme] ?? THEME_BG.sunny
  const advisory  = useMemo(() => weather ? buildAdvisory(current, daily) : [], [weather, current, daily])

  // ── Scroll hourly strip ──
  const scrollHourly = (dir) => {
    if (hourlyRef.current) hourlyRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">

      {/* ── Location Search Bar ── */}
      <div ref={pickerRef} className="relative">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-3 flex items-center gap-3"
        >
          <div className="flex-1 flex items-center gap-2 bg-gray-100/60 dark:bg-dark-700/50 border border-emerald-200/40 dark:border-emerald-800/30 rounded-xl px-4 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLocationSubmit()}
              onFocus={() => setShowPicker(true)}
              placeholder="Search city / district (e.g. Surat, Pune, Nashik…)"
              className="bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none flex-1 font-body"
            />
          </div>

          {/* State + District quick picker toggle */}
          <button
            onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
            Browse Districts
          </button>

          <button
            onClick={handleLocationSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-glow-sm"
          >
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Search className="w-4 h-4" />
            }
            {loading ? 'Loading…' : 'Search'}
          </button>
        </motion.div>

        {/* State → District cascade picker dropdown */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-2 z-50 glass-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-2xl"
            >
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">State / UT</label>
                <select
                  value={selState}
                  onChange={e => { setSelState(e.target.value); setSelDistrict('') }}
                  className="w-full text-sm bg-gray-100/60 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-emerald-500 font-body"
                >
                  <option value="">-- Select State --</option>
                  {STATE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">District</label>
                <select
                  value={selDistrict}
                  onChange={e => setSelDistrict(e.target.value)}
                  disabled={!selState}
                  className="w-full text-sm bg-gray-100/60 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-emerald-500 disabled:opacity-40 font-body"
                >
                  <option value="">-- Select District --</option>
                  {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={handleLocationSubmit}
                  disabled={!selDistrict || loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold disabled:opacity-40 hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  Get Forecast
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Error state ── */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-4 flex items-center gap-3 border border-red-400/30 bg-red-500/10">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !weather && (
        <div className="space-y-4 animate-pulse">
          <div className="h-64 rounded-3xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-400/20" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-200/20 dark:bg-dark-700/40" />)}
          </div>
        </div>
      )}

      {/* ── Weather content ── */}
      {weather && today && (
        <AnimatePresence mode="wait">
          <motion.div key={geo?.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* ── Hero Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${skyBg} shadow-2xl`}
            >
              <SkyParticles theme={skyTheme} />

              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '150px' }}
              />

              <div className="relative z-10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">

                  {/* Left: Main temp + condition */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="w-4 h-4 text-white/80" />
                      <span className="text-white/90 text-sm font-semibold tracking-wide">
                        {geo?.name}{geo?.admin ? `, ${geo.admin}` : ''}
                      </span>
                    </div>

                    <div className="flex items-end gap-4">
                      <motion.span
                        key={current?.temperature}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-display text-8xl sm:text-9xl font-black text-white leading-none drop-shadow-xl"
                      >
                        {Math.round(current?.temperature ?? 0)}°
                      </motion.span>
                      <div className="pb-4">
                        <div className="text-6xl mb-1">{wxNow.emoji}</div>
                        <p className="text-white/90 font-semibold text-base">{wxNow.label}</p>
                        <p className="text-white/60 text-xs mt-0.5">
                          {today.max}° / {today.min}°  •  Feels like {Math.round((current?.temperature ?? 0) - 2)}°
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Key stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:min-w-48">
                    {[
                      { icon: Droplets,    label: 'Humidity',     val: `${nowHumidity}%` },
                      { icon: Wind,        label: 'Wind Speed',   val: `${Math.round(current?.windspeed ?? 0)} km/h` },
                      { icon: CloudRain,   label: 'Rain Today',   val: `${today.rain} mm` },
                      { icon: Thermometer, label: 'Max / Min',    val: `${today.max}° / ${today.min}°` },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-2xl px-3 py-2.5 border border-white/10">
                        <Icon className="w-4 h-4 text-white/70 flex-shrink-0" />
                        <div>
                          <p className="text-white/50 text-[10px] uppercase tracking-widest font-mono">{label}</p>
                          <p className="text-white font-bold text-sm">{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rain probability banner */}
                {today.pp > 30 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="mt-4 flex items-center gap-2 bg-black/25 border border-blue-300/20 rounded-2xl px-4 py-2.5 text-sm text-white/90 backdrop-blur-sm">
                    <CloudRain className="w-4 h-4 text-blue-300" />
                    <span><strong>{today.pp}% chance of rain</strong> today — {today.rain} mm expected</span>
                  </motion.div>
                )}

                {/* Last updated */}
                {lastUpdated && (
                  <p className="mt-3 text-white/40 text-xs flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    Updated at {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    <button onClick={() => loadWeather(geo?.name)} className="underline hover:text-white/70 ml-1">Refresh</button>
                  </p>
                )}
              </div>
            </motion.div>

            {/* ── Hourly Strip ── */}
            <div>
              <h3 className="font-display font-bold text-gray-800 dark:text-white text-base mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 inline-block" />
                Next 24 Hours
              </h3>
              <div className="relative">
                <div
                  ref={hourlyRef}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {hourlyChartData.map((h, i) => {
                    const isNow = i === 0
                    return (
                      <motion.div
                        key={h.time}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`flex-shrink-0 snap-start flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 border transition-all min-w-[72px]
                          ${isNow
                            ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-400/40 shadow-glow-sm'
                            : 'glass-card border-transparent hover:border-emerald-500/20'
                          }`}
                      >
                        <span className={`text-xs font-mono font-semibold ${isNow ? 'text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {isNow ? 'Now' : h.time}
                        </span>
                        <span className="text-2xl">
                          {getWx(hourly.weathercode?.[hourlyChartData.indexOf(h)] ?? 0).emoji}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">{h.temp}°</span>
                        {h.rain > 0 && (
                          <span className="text-[10px] text-blue-400 font-semibold">{h.rain}mm</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── 7-Day Forecast ── */}
            <div>
              <h3 className="font-display font-bold text-gray-800 dark:text-white text-base mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-500 to-blue-500 inline-block" />
                7-Day Forecast
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                {daily.time?.map((t, i) => {
                  const wx = getWx(daily.weathercode?.[i] ?? 0)
                  const dmax = Math.round(daily.temperature_2m_max?.[i] ?? 0)
                  const dmin = Math.round(daily.temperature_2m_min?.[i] ?? 0)
                  const dRain = (daily.precipitation_sum?.[i] ?? 0).toFixed(1)
                  const pp = daily.precipitation_probability_max?.[i] ?? 0
                  const isToday = i === 0
                  return (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.05 }}
                      className={`glass-card p-3.5 flex flex-col items-center gap-2 text-center rounded-2xl border transition-all hover:scale-[1.03] hover:shadow-xl
                        ${isToday ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-transparent'}`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatDay(t, true)}
                      </span>
                      <span className="text-3xl">{wx.emoji}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{wx.label}</span>

                      {/* Temp bar */}
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-blue-400">{dmin}°</span>
                          <span className="text-orange-400">{dmax}°</span>
                        </div>
                        <div className="h-1.5 bg-gray-200/40 dark:bg-dark-600/60 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400" style={{ width: `${Math.min(100, ((dmax - 10) / 30) * 100)}%` }} />
                        </div>
                      </div>

                      {pp > 10 && (
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5 font-semibold">
                          <Droplets className="w-2.5 h-2.5" />{pp}%  {dRain}mm
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {/* Temperature Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-5"
              >
                <h4 className="font-display font-bold text-gray-800 dark:text-white text-sm mb-1">24h Temperature</h4>
                <p className="text-xs text-gray-400 mb-4">Hourly °C forecast</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={hourlyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} unit="°" />
                    <Tooltip content={<ChartTip unit="°C" />} />
                    <Area type="monotone" dataKey="temp" name="Temp" stroke="#f97316" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Precipitation Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-card p-5"
              >
                <h4 className="font-display font-bold text-gray-800 dark:text-white text-sm mb-1">7-Day Precipitation</h4>
                <p className="text-xs text-gray-400 mb-4">Daily rainfall in mm</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} unit="mm" />
                    <Tooltip content={<ChartTip unit="mm" />} />
                    <Bar dataKey="rain" name="Rain" fill="url(#rainGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* ── Farming Advisory ── */}
            {advisory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-5 bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-700/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-glow-sm">
                    <Sprout className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900 dark:text-white text-sm">Farming Weather Advisory</h4>
                    <p className="text-xs text-gray-400">AI-generated guidance based on today's forecast</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {advisory.map((adv, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                      className={`rounded-2xl p-3.5 border ${ADV_COLORS[adv.color]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{adv.icon}</span>
                        <div>
                          <p className="font-semibold text-sm mb-0.5">{adv.title}</p>
                          <p className="text-xs opacity-80 leading-relaxed">{adv.body}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Empty state ── */}
      {!loading && !weather && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center text-center"
        >
          <div className="text-7xl mb-4 animate-bounce">🌤️</div>
          <h3 className="font-display font-bold text-gray-800 dark:text-white text-xl mb-2">Live Weather Forecast</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
            Enter your city or district above to get a 7-day forecast with farming advisories.
          </p>
        </motion.div>
      )}
    </div>
  )
}
