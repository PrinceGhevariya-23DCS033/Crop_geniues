import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import CropRecommendation from '@/pages/CropRecommendation'
import YieldPrediction from '@/pages/YieldPrediction'
import LeafDisease from '@/pages/LeafDisease'
import PricePrediction from '@/pages/PricePrediction'
import History from '@/pages/History'
import Settings from '@/pages/Settings'
import AgriNews from '@/pages/AgriNews'
import WeatherForecast from '@/pages/WeatherForecast'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                style: { background: '#064e3b', color: '#d1fae5', border: '1px solid #10b981' },
                iconTheme: { primary: '#10b981', secondary: '#064e3b' },
              },
              error: {
                style: { background: '#450a0a', color: '#fecaca', border: '1px solid #ef4444' },
              },
              loading: {
                style: { background: '#1e3a2e', color: '#d1fae5', border: '1px solid #10b981' },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="crop-recommendation" element={<CropRecommendation />} />
              <Route path="yield-prediction" element={<YieldPrediction />} />
              <Route path="leaf-disease" element={<LeafDisease />} />
              <Route path="price-prediction" element={<PricePrediction />} />
              <Route path="history" element={<History />} />
              <Route path="agri-news" element={<AgriNews />} />
              <Route path="weather" element={<WeatherForecast />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  </ThemeProvider>
  )
}
