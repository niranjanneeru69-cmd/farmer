import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(() => {
    try { const s = localStorage.getItem('farmiti_farmer'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('farmiti_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me').then(res => {
      setFarmer(res.data.farmer)
      localStorage.setItem('farmiti_farmer', JSON.stringify(res.data.farmer))
    }).catch(() => {
      localStorage.removeItem('farmiti_token')
      localStorage.removeItem('farmiti_farmer')
      setFarmer(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password })
    const { token, farmer: f } = res.data
    localStorage.setItem('farmiti_token', token)
    localStorage.setItem('farmiti_farmer', JSON.stringify(f))
    setFarmer(f)
    return f
  }, [])

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, farmer: f } = res.data
    localStorage.setItem('farmiti_token', token)
    localStorage.setItem('farmiti_farmer', JSON.stringify(f))
    // Clear tour flag so the guide starts for every brand-new account
    localStorage.removeItem('farmiti_tour_done')
    setFarmer(f)
    return f
  }, [])

  const sendOTP = useCallback(async (email) => {
    return await api.post('/auth/send-otp', { email })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('farmiti_token')
    localStorage.removeItem('farmiti_farmer')
    setFarmer(null)
  }, [])

  const updateFarmer = useCallback((data) => {
    setFarmer(prev => {
      const updated = { ...prev, ...data }
      localStorage.setItem('farmiti_farmer', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ farmer, loading, login, register, logout, updateFarmer, sendOTP }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
