import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Filter, Search, Trash2, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '@/context/AppContext'
import { SectionHeader } from '@/components/ui/FormComponents'
import { deleteHistoryEntry, clearHistory as apiClearHistory } from '@/utils/api'
import clsx from 'clsx'

const MODULES = ['All', 'Crop Recommendation', 'Yield Prediction', 'Leaf Disease', 'Price Prediction']

const statusStyle = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
}

export default function History() {
  const { history, loadHistory, historyLoading } = useApp()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadHistory()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return history.filter(h => {
      const matchModule = filter === 'All' || h.module === filter
      const matchSearch = !search || h.result?.toLowerCase().includes(search.toLowerCase()) || h.module?.toLowerCase().includes(search.toLowerCase())
      return matchModule && matchSearch
    })
  }, [history, filter, search])

  const downloadCSV = () => {
    const headers = ['ID', 'Module', 'Input', 'Result', 'Confidence', 'Date']
    const rows = filtered.map(h => [h.id, h.module, `"${h.input}"`, h.result, h.confidence, h.date])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'crop-genius-history.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('History downloaded as CSV')
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) return
    try {
      await apiClearHistory()
      await loadHistory()
      toast.success('History cleared')
    } catch (err) {
      toast.error(err.message || 'Failed to clear history')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteHistoryEntry(id)
      await loadHistory()
      toast.success('Entry deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete entry')
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <SectionHeader
          title="Prediction History"
          subtitle={historyLoading ? 'Loading...' : `${filtered.length} records found`}
          action={
            <div className="flex items-center gap-2">
              <button onClick={loadHistory} className="btn-ghost flex items-center gap-1 text-sm py-2 px-3" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
              {history.length > 0 && (
                <button onClick={handleClearAll} className="btn-ghost text-red-500 flex items-center gap-1 text-sm py-2 px-3" title="Clear All">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
              )}
              <button onClick={downloadCSV} className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-dark-700/60 border border-emerald-200/50 dark:border-emerald-800/40 rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search results..."
              className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full font-body"
            />
          </div>

          {/* Module filter chips */}
          <div className="flex flex-wrap gap-2">
            {MODULES.map(m => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  filter === m
                    ? 'bg-emerald-600 text-white shadow-glow-sm'
                    : 'bg-gray-100/80 dark:bg-dark-700/60 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-emerald-100/30 dark:border-emerald-900/20">
          <table className="w-full text-sm font-body">
            <thead className="bg-emerald-50/60 dark:bg-emerald-900/15">
              <tr>
                {['#', 'Module', 'Input', 'Result', 'Confidence', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No records found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-emerald-50/30 dark:border-emerald-900/10 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group"
                  >
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{String(i + 1).padStart(3, '0')}</td>
                    <td className="py-3 px-4">
                      <span className="badge-info text-xs whitespace-nowrap">{row.module}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs max-w-[160px] truncate">{row.input}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{row.result}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                        {row.confidence}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{row.date}</td>
                    <td className="py-3 px-4">
                      <span className={clsx(statusStyle[row.status] ?? statusStyle.success, 'text-xs')}>
                        {row.status === 'success' ? '✓ OK' : row.status === 'warning' ? '⚠ Warn' : '✗ Risk'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right font-body">
            Showing {filtered.length} of {history.length} records
          </p>
        )}
      </div>
    </div>
  )
}
