import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getHistory as fetchHistory,
  addHistoryEntry,
  getNotifications as fetchNotifications,
  markNotificationRead as apiMarkRead,
  markAllNotificationsRead as apiMarkAllRead,
} from '@/utils/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [history, setHistory] = useState([])
  const [notifications, setNotifications] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch history & notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
      loadNotifications()
    } else {
      setHistory([])
      setNotifications([])
    }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const data = await fetchHistory()
      setHistory(data)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }, [])

  const addToHistory = useCallback(async (entry) => {
    try {
      const saved = await addHistoryEntry(entry)
      setHistory(prev => [saved, ...prev])
      return saved
    } catch (err) {
      // Fallback: add locally if API fails
      const localEntry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'success',
        ...entry,
      }
      setHistory(prev => [localEntry, ...prev])
      console.error('Failed to save history to server:', err)
      return localEntry
    }
  }, [])

  const markNotificationRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await apiMarkRead(id)
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await apiMarkAllRead()
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      history,
      addToHistory,
      loadHistory,
      historyLoading,
      notifications,
      loadNotifications,
      markNotificationRead,
      markAllRead,
      unreadCount,
      sidebarOpen,
      setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
