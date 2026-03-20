import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, RefreshCw, Search, ExternalLink, Clock,
  TrendingUp, Leaf, CloudRain, BookOpen, Landmark, FlaskConical,
  AlertCircle, ChevronRight, Rss, SlidersHorizontal, X
} from 'lucide-react'
import { getAgriNews } from '@/utils/api'

// ─── Category Config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',          label: 'All News',    icon: Newspaper,    color: 'emerald',  bg: 'bg-emerald-500',   text: 'text-emerald-600 dark:text-emerald-400',   ring: 'ring-emerald-500/40',  badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { id: 'agriculture',  label: 'Agriculture', icon: Leaf,         color: 'green',    bg: 'bg-green-500',     text: 'text-green-600 dark:text-green-400',       ring: 'ring-green-500/40',    badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'crops',        label: 'Crops',       icon: Leaf,         color: 'lime',     bg: 'bg-lime-500',      text: 'text-lime-600 dark:text-lime-400',         ring: 'ring-lime-500/40',     badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300' },
  { id: 'price',        label: 'Mandi Price', icon: TrendingUp,   color: 'amber',    bg: 'bg-amber-500',     text: 'text-amber-600 dark:text-amber-400',       ring: 'ring-amber-500/40',    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { id: 'policy',       label: 'Policy',      icon: Landmark,     color: 'violet',   bg: 'bg-violet-500',    text: 'text-violet-600 dark:text-violet-400',     ring: 'ring-violet-500/40',   badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { id: 'soil',         label: 'Soil Health', icon: FlaskConical, color: 'orange',   bg: 'bg-orange-500',    text: 'text-orange-600 dark:text-orange-400',     ring: 'ring-orange-500/40',   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { id: 'weather',      label: 'Weather',     icon: CloudRain,    color: 'sky',      bg: 'bg-sky-500',       text: 'text-sky-600 dark:text-sky-400',           ring: 'ring-sky-500/40',      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
]

const TIME_FILTERS = [
  { id: 'all',   label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCategoryConfig(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
}

function isToday(isoStr) {
  if (!isoStr) return false
  const today = new Date().toISOString().slice(0, 10)
  return isoStr.startsWith(today)
}

function isThisWeek(isoStr) {
  if (!isoStr) return false
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return new Date(isoStr) >= weekAgo
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  try {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-dark-600" />
        <div className="h-4 w-16 rounded bg-gray-100 dark:bg-dark-700" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-dark-600" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-dark-600" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-gray-100 dark:bg-dark-700" />
        <div className="h-3 w-11/12 rounded bg-gray-100 dark:bg-dark-700" />
        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-dark-700" />
      </div>
      <div className="h-3 w-24 rounded bg-gray-100 dark:bg-dark-700" />
    </div>
  )
}

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ article, index }) {
  const cat = getCategoryConfig(article.category)
  const CatIcon = cat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      className="glass-card p-4 flex flex-col gap-3 group hover:border-emerald-400/40 dark:hover:border-emerald-600/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Top row: category badge + time ago */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
          <CatIcon className="w-3 h-3" />
          {cat.label}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-mono shrink-0">
          <Clock className="w-3 h-3" />
          {timeAgo(article.published_iso)}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 font-body leading-relaxed line-clamp-3 flex-1">
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-dark-700/60 mt-auto">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-body truncate max-w-[140px]">
          {article.source}
        </span>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shrink-0"
          onClick={e => e.stopPropagation()}
        >
          Read <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  )
}

// ─── Featured Card (first article) ───────────────────────────────────────────
function FeaturedCard({ article }) {
  const cat = getCategoryConfig(article.category)
  const CatIcon = cat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="col-span-full glass-card p-5 flex flex-col md:flex-row gap-4 group hover:border-emerald-400/40 dark:hover:border-emerald-600/40 transition-all duration-300 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent border border-emerald-200/60 dark:border-emerald-800/30"
    >
      {/* Label */}
      <div className="md:w-2 md:rounded-full shrink-0 h-1 w-16 md:h-auto rounded-full bg-gradient-to-b from-emerald-500 to-green-600" />

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Featured</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
            <CatIcon className="w-3 h-3" />
            {cat.label}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
            {timeAgo(article.published_iso)}
          </span>
        </div>

        <h2 className="font-display font-bold text-gray-900 dark:text-white text-base md:text-lg leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-sm text-gray-500 dark:text-gray-400 font-body leading-relaxed line-clamp-2">
            {article.summary}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">{article.source}</span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(article.published_iso)}</span>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Read Full Story <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgriNews() {
  const [articles, setArticles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTime, setActiveTime]         = useState('all')
  const [search, setSearch]                 = useState('')
  const [showFilters, setShowFilters]       = useState(false)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAgriNews()
      setArticles(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // ─── Filtering logic ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...articles]

    if (activeCategory !== 'all') {
      result = result.filter(a => a.category === activeCategory)
    }

    if (activeTime === 'today') {
      result = result.filter(a => isToday(a.published_iso))
    } else if (activeTime === 'week') {
      result = result.filter(a => isThisWeek(a.published_iso))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q)
      )
    }

    return result
  }, [articles, activeCategory, activeTime, search])

  // Count per category
  const counts = useMemo(() => {
    const c = { all: articles.length }
    CATEGORIES.slice(1).forEach(cat => {
      c[cat.id] = articles.filter(a => a.category === cat.id).length
    })
    return c
  }, [articles])

  const featured = filtered[0]
  const rest = filtered.slice(1)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 bg-gradient-to-r from-emerald-600/10 to-teal-600/5 border border-emerald-200/50 dark:border-emerald-700/30"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-glow-sm shrink-0">
              <Rss className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-900 dark:text-white text-lg leading-tight">
                Agriculture News
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-body mt-0.5">
                Live updates on farming, prices, policy & soil health
                {lastUpdated && (
                  <span className="ml-2 text-emerald-500">
                    · Updated {timeAgo(lastUpdated.toISOString())}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-dark-700/60 px-2.5 py-1 rounded-lg">
                {filtered.length} articles
              </span>
            )}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Search + Filter bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search news, crops, schemes..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700/60 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-body transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Time filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700/60 rounded-xl p-1">
          {TIME_FILTERS.map(tf => (
            <button
              key={tf.id}
              onClick={() => setActiveTime(tf.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                activeTime === tf.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Filter toggle (mobile) */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className="sm:hidden inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700/60 px-3 py-2.5 rounded-xl transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────── */}
      <div className={`overflow-x-auto pb-1 ${showFilters || 'hidden sm:block'}`}>
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const count = counts[cat.id] ?? 0
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? `bg-${cat.color}-500 text-white border-${cat.color}-500 shadow-sm`
                    : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-700/60 hover:border-gray-300 dark:hover:border-dark-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                {count > 0 && (
                  <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Error State ──────────────────────────────────────────────────── */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 text-center space-y-3 border border-red-200 dark:border-red-900/40"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="font-display font-semibold text-gray-900 dark:text-white">Unable to load news</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-body">{error}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Make sure <code className="font-mono text-emerald-600 dark:text-emerald-400">news_api.py</code> is running on port 8000
            </p>
          </div>
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </motion.div>
      )}

      {/* ── Loading Skeletons ────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          {/* Featured skeleton */}
          <div className="glass-card p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-2 rounded-full bg-emerald-200 dark:bg-emerald-900/50" />
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-dark-600" />
                  <div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-dark-600" />
                </div>
                <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dark-600" />
                <div className="h-4 w-full rounded bg-gray-100 dark:bg-dark-700" />
                <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-dark-700" />
              </div>
            </div>
          </div>
          {/* Grid skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── News Content ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-10 text-center space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-display font-semibold text-gray-900 dark:text-white">No articles found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
                {search ? `No results for "${search}"` : 'Try a different category or time filter'}
              </p>
              {(search || activeCategory !== 'all' || activeTime !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all'); setActiveTime('all') }}
                  className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Featured article */}
              {featured && (
                <div className="grid grid-cols-1">
                  <FeaturedCard article={featured} />
                </div>
              )}

              {/* News grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {rest.map((article, idx) => (
                      <NewsCard key={article.link} article={article} index={idx} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Bottom info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-xs text-gray-400 dark:text-gray-600 font-body py-2"
              >
                Showing {filtered.length} articles · Powered by Google News RSS
              </motion.p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
