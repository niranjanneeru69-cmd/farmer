import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 120000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('farmiti_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('farmiti_token')
    localStorage.removeItem('farmiti_farmer')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api
