import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Leaf, Sprout, TrendingUp, Microscope, BarChart3,
  ArrowRight, Star, ChevronDown, Github, Linkedin, Mail,
  Sun, Moon, Zap, Shield, Activity, Globe
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

const FEATURES = [
  {
    icon: Sprout, title: 'Crop Recommendation',
    desc: 'AI-powered crop advisory based on soil nutrient levels, climate data, and regional conditions.',
    color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    stats: '94.2% accuracy',
  },
  {
    icon: TrendingUp, title: 'Yield Prediction',
    desc: 'Forecast your harvest potential using machine learning trained on 10 years of agricultural data.',
    color: 'from-green-500 to-teal-600', bg: 'bg-green-50 dark:bg-green-900/20',
    stats: '±0.3 t/ha precision',
  },
  {
    icon: Microscope, title: 'Leaf Disease Detection',
    desc: 'Instant plant health diagnosis from a photo. Get treatment advice in under 5 seconds.',
    color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50 dark:bg-teal-900/20',
    stats: '97.8% detection rate',
  },
  {
    icon: BarChart3, title: 'Price Prediction',
    desc: 'Predict market prices up to 3 months ahead. Make data-driven sell/hold decisions.',
    color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-900/20',
    stats: '85%+ confidence',
  },
]

const STEPS = [
  { num: '01', title: 'Input Your Data', desc: 'Enter soil parameters, location, or upload a leaf photo', icon: Activity },
  { num: '02', title: 'AI Processing', desc: 'Our models analyze 50+ variables in milliseconds', icon: Zap },
  { num: '03', title: 'Get Insights', desc: 'Receive actionable recommendations and predictions', icon: Star },
]

const STATS = [
  { value: '50K+', label: 'Farmers Served' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '12', label: 'States Covered' },
  { value: '4', label: 'AI Modules' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 overflow-x-hidden font-body">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-900/90 backdrop-blur-xl border-b border-emerald-100/50 dark:border-emerald-900/30"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-glow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
              Crop<span className="text-emerald-500">Genius</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'About'].map((link, i) => (
              <motion.a 
                key={link} 
                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                style={{ transition: 'color 200ms ease' }}
              >
                {link}
              </motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.button 
              onClick={toggleTheme} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-emerald-400"
              style={{ transition: 'border-color 200ms ease' }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            <motion.button 
              onClick={() => navigate('/auth')} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="btn-primary text-sm py-2 px-5"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-dots opacity-40 dark:opacity-20" />
        {/* Floating orbs */}
        <div className="absolute top-32 right-20 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-emerald-600/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-green-400/8 dark:bg-green-600/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-700/60 rounded-full px-4 py-2 mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
              AI FOR AGRICULTURE
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.7 }}
              className="font-display font-bold text-5xl md:text-7xl text-gray-900 dark:text-white leading-[1.05] tracking-tight mb-6"
            >
              <span className="block">Crop Genius</span>
              <span className="block bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                AI Smart Farming
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 text-balance"
            >
              Maximize Yield. Detect Diseases. Predict Prices. Grow Smart.
              <br />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Four AI modules. One platform. Zero guesswork.</span>
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <button
                onClick={() => navigate('/auth')}
                className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#features" className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
                Explore Features
                <ChevronDown className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto"
          >
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display font-bold text-3xl text-emerald-600 dark:text-emerald-400">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mock dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative max-w-5xl mx-auto mt-16 px-6"
        >
          <div className="glass-card border border-emerald-200/40 dark:border-emerald-800/40 overflow-hidden shadow-2xl rounded-3xl">
            {/* window chrome */}
            <div className="bg-gray-100/80 dark:bg-dark-700/80 px-4 py-3 flex items-center gap-2 border-b border-gray-200/50 dark:border-gray-700/50">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <div className="ml-3 flex-1 bg-white/50 dark:bg-dark-600/50 rounded-lg px-3 py-1 text-xs text-gray-500 text-center">
                cropgenius.ai/app/dashboard
              </div>
            </div>
            {/* Mock content */}
            <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-white dark:from-dark-800/80 dark:to-dark-900/80">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {['Rice — 94%', '5.4 t/ha', 'Healthy ✓', '₹2,340/q'].map((v, i) => (
                  <div key={i} className="bg-white/70 dark:bg-dark-700/70 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-center">
                    <p className="font-display font-bold text-sm text-emerald-700 dark:text-emerald-400">{v}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{['Crop', 'Yield', 'Disease', 'Price'][i]}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/50 dark:bg-dark-700/50 rounded-xl p-4 border border-emerald-100/40 dark:border-emerald-900/30 h-24 flex items-center justify-center">
                <div className="flex items-end gap-2 h-16">
                  {[40, 55, 45, 70, 60, 80, 75].map((h, i) => (
                    <div key={i} className="w-6 rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-4 top-8 bg-white dark:bg-dark-700 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-3 shadow-lg hidden md:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Sprout className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Rice Recommended</p>
                <p className="text-[10px] text-emerald-500">Confidence: 94.2%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -right-4 bottom-16 bg-white dark:bg-dark-700 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-3 shadow-lg hidden md:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">No Disease Detected</p>
                <p className="text-[10px] text-green-500">Plant is Healthy</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50/80 dark:bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-3">
              Four Powerful Modules
            </motion.span>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white">
              Everything a Smart Farmer Needs
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
              Built with cutting-edge ML models trained on decades of Indian agricultural data.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div 
                  key={i} 
                  variants={fadeUp} 
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-8 group cursor-pointer"
                  style={{ transition: 'box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  onClick={() => navigate('/auth')}
                >
                  <motion.div 
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg`}
                    whileHover={{ scale: 1.1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
                    <Star className="w-3.5 h-3.5" />
                    {f.stats}
                  </span>
                </motion.div>
              )
            })}            
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-3 block">Simple Process</motion.span>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-4xl text-gray-900 dark:text-white">How It Works</motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100%-200px)] h-px bg-gradient-to-r from-transparent via-emerald-300 dark:via-emerald-700 to-transparent hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center relative group"
                  >
                    <div className="relative inline-flex mb-5">
                      <motion.div 
                        className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center"
                        whileHover={{ 
                          borderColor: 'rgb(16, 185, 129)',
                          scale: 1.05,
                          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                        }}
                        style={{ transition: 'border-color 200ms ease' }}
                      >
                        <Icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                      </motion.div>
                      <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold font-mono flex items-center justify-center shadow-lg">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── About / CTA ───────────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-gradient-to-br from-emerald-900 via-green-900 to-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Globe className="w-12 h-12 text-emerald-400 mx-auto mb-5" />
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-5">
              Built for India's Farmers
            </h2>
            <p className="text-emerald-200/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Crop Genius is an AI-powered smart agriculture platform designed for the Indian farming ecosystem.
              Leveraging satellite data, historical crop records, and real-time market intelligence — we help
              farmers make data-driven decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl shadow-glow flex items-center gap-2"
                style={{ transition: 'background-color 200ms ease' }}
              >
                Launch Platform <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-dark-900 border-t border-emerald-900/30 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">Crop<span className="text-emerald-400">Genius</span></span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              © 2026 CropGenius — AI Powered Smart Agriculture Platform. Built for ISRO Hackathon 2026.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Github,   href: 'https://github.com',   label: 'GitHub' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Mail,     href: 'mailto:hello@cropgenius.ai', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <motion.a 
                  key={label} 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="w-9 h-9 rounded-xl bg-dark-700 border border-emerald-900/40 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-600/50"
                  style={{ transition: 'color 200ms ease, border-color 200ms ease' }}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
