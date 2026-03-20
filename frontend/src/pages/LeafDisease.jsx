import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, AlertTriangle, CheckCircle, ShieldAlert, Pill, Shield, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SectionHeader } from '@/components/ui/FormComponents'
import { detectDisease } from '@/utils/api'
import { useApp } from '@/context/AppContext'
import clsx from 'clsx'

const SeverityIcon = ({ severity }) => {
  if (severity === 'none') return <CheckCircle className="w-5 h-5 text-emerald-500" />
  if (severity === 'low')  return <Info className="w-5 h-5 text-sky-500" />
  if (severity === 'moderate') return <AlertTriangle className="w-5 h-5 text-amber-500" />
  return <ShieldAlert className="w-5 h-5 text-red-500" />
}

export default function LeafDisease() {
  const { addToHistory } = useApp()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback(accepted => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    toast.success('Image loaded! Click Analyze to detect disease.')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const analyze = async () => {
    if (!file) return toast.error('Please upload a leaf image first')
    setLoading(true); setResult(null)
    try {
      const data = await detectDisease(file)
      setResult(data)
      addToHistory({
        module: 'Leaf Disease', input: `${file.name}`, result: data.name,
        confidence: `${data.confidence}%`, status: data.badge,
      })
      toast.success(`Analysis complete: ${data.name} detected`)
    } catch (err) {
      toast.error(err.message || 'Failed to analyze image. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setFile(null); setPreview(null); setResult(null) }

  const badgeStyle = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    danger:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700',
    info:    'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-700',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Upload + Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2 space-y-4"
        >
          <div className="glass-card p-6">
            <SectionHeader title="Upload Leaf Image" subtitle="Supported: JPG, PNG, WEBP (max 10MB)" />

            {!preview ? (
              <div
                {...getRootProps()}
                className={clsx('upload-zone', isDragActive && 'active')}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                    isDragActive ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-dark-700')}>
                    <Upload className={clsx('w-7 h-7 transition-colors', isDragActive ? 'text-emerald-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                      {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-1">Upload a clear photo of the affected leaf</p>
                  </div>
                  <span className="btn-secondary text-xs px-4 py-2 mt-1">Browse Files</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                  <img src={preview} alt="leaf preview" className="w-full h-56 object-cover" />
                  {loading && (
                    <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="text-center">
                        <div className="w-12 h-12 border-2 border-emerald-200/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-white font-body">Scanning...</p>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg">
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-2 px-1">
                  <p className="text-xs text-gray-500 truncate">{file?.name}</p>
                  <p className="text-xs text-gray-400">{file ? `${(file.size / 1024).toFixed(0)} KB` : ''}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={analyze}
                disabled={!file || loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>
                  : <><Camera className="w-4 h-4" />Detect Disease</>}
              </button>
              {file && (
                <button onClick={reset} className="btn-secondary px-4 py-3">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card p-5">
            <p className="font-display font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" /> Tips for Best Results
            </p>
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              {['Take photo in natural daylight', 'Fill the frame with the leaf', 'Show both sides if possible', 'Use a plain background', 'Focus on symptomatic areas'].map((t, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-500 mt-0.5">✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
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
                <div className="text-center mb-4">
                  <p className="font-display font-semibold text-gray-900 dark:text-white mb-1">AI Vision Model Processing</p>
                  <p className="text-xs text-gray-500">Analyzing leaf patterns, color, texture, and shape...</p>
                </div>
                <LoadingSpinner size="md" text="Running disease detection model..." />
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Loading model', 'Preprocessing image', 'Extracting features', 'Classifying disease'].map((s, i) => (
                    <motion.span key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.5 }}
                      className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40"
                    >
                      {s}...
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 180 }}
                className="space-y-4"
              >
                {/* Main diagnosis */}
                <div className={clsx(
                  'glass-card p-6 border-2',
                  result.badge === 'success' ? 'border-emerald-400/40 shadow-glow'
                    : result.badge === 'warning' ? 'border-amber-400/40'
                    : 'border-red-400/40'
                )}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className={clsx(
                      'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg',
                      result.badge === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40'
                        : result.badge === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
                    )}>
                      <SeverityIcon severity={result.severity} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Diagnosis Result</p>
                          <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{result.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Plant: <span className="font-semibold text-gray-800 dark:text-gray-200">{result.plant || 'Unknown'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-2xl text-emerald-600 dark:text-emerald-400">{result.confidence}%</p>
                          <p className="text-xs text-gray-500">confidence</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', badgeStyle[result.badge])}>
                          <SeverityIcon severity={result.severity} />
                          {result.severity === 'none' ? '✓ Healthy Plant' : `${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Severity`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence}%` }}
                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                        className={clsx('h-full rounded-full', result.badge === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-400' : result.badge === 'warning' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-400')}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{result.description}</p>
                </div>

                {/* Cure + Pesticide */}
                {result.badge !== 'success' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm font-display">Cure Steps</p>
                      </div>
                      <ul className="space-y-2">
                        {result.cure.map((c, i) => (
                          <li key={i} className="flex gap-2 items-start text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-sky-500 font-bold mt-0.5">{i + 1}.</span>{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Pill className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm font-display">Pesticide Recommendation</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{result.pesticide}</p>
                    </div>
                  </div>
                )}

                {/* Prevention */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">Prevention Tips</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.prevention.map((p, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-gray-600 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-2.5">
                        <span className="text-emerald-500">✓</span>{p}
                      </div>
                    ))}
                  </div>
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
              <div className="text-5xl mb-4">🍃</div>
              <p className="font-display font-semibold text-gray-900 dark:text-white mb-2">Disease Analysis Appears Here</p>
              <p className="text-sm text-gray-500">Upload a leaf image and click Detect Disease</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
