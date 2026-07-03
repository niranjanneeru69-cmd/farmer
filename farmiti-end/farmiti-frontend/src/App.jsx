import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ToastContainer from './components/ToastContainer'
import TourGuide from './components/TourGuide'

import Landing           from './pages/Landing'
import Login             from './pages/Login'
import Signup            from './pages/Signup'
import DashboardLayout   from './components/DashboardLayout'
import Dashboard         from './pages/Dashboard'
import Weather           from './pages/Weather'
import MarketPrices      from './pages/MarketPrices'
import CropRecommendation from './pages/CropRecommendation'
import DiseaseDetection  from './pages/DiseaseDetection'
import AIChat            from './pages/AIChat'
import GovernmentSchemes from './pages/GovernmentSchemes'
import History           from './pages/History'
import FarmerProfile     from './pages/FarmerProfile'
import Community         from './pages/Community'
import Calendar          from './pages/Calendar'


function PrivateRoute({ children }) {
  const { farmer, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-forest flex items-center justify-center" style={{ background: '#0D3320' }}>
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-green-300 text-sm font-body">Loading Farmiti...</p>
      </div>
    </div>
  )
  if (!farmer) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ToastContainer />
        <TourGuide />
        <Routes>
          <Route path="/"        element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="/dashboard"           element={<Dashboard />} />
            <Route path="/weather"             element={<Weather />} />
            <Route path="/market-prices"       element={<MarketPrices />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/disease-detection"   element={<DiseaseDetection />} />
            <Route path="/ai-chat"             element={<AIChat />} />
            <Route path="/schemes"             element={<GovernmentSchemes />} />
            <Route path="/history"             element={<History />} />
            <Route path="/profile"             element={<FarmerProfile />} />
            <Route path="/community"           element={<Community />} />
            <Route path="/calendar"            element={<Calendar />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
