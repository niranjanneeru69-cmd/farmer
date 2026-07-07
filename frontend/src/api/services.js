import api from './client'

export const authAPI = {
  register:  (d)    => api.post('/auth/register', d),
  login:     (d)    => api.post('/auth/login', d),
  me:        ()     => api.get('/auth/me'),
}

export const farmerAPI = {
  getProfile:   ()       => api.get('/farmer/profile'),
  updateProfile:(d)      => api.put('/farmer/profile', d),
  completeTour: ()       => api.put('/farmer/complete-tour'),
  updateAvatar: (form)   => api.put('/farmer/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAvatar: ()       => api.delete('/farmer/avatar'),
  getCrops:     ()       => api.get('/farmer/crops'),
  addCrop:      (d)      => api.post('/farmer/crops', d),
  updateCrop:   (id, d)  => api.put(`/farmer/crops/${id}`, d),
  deleteCrop:   (id)     => api.delete(`/farmer/crops/${id}`),
  deleteAccount:()       => api.delete('/farmer/account'),
}

export const weatherAPI = {
  getCurrent:  (params) => api.get('/weather/current', { params }),
  getAlerts:   ()       => api.get('/weather/alerts'),
  subscribe:   (d)       => api.post('/weather/subscribe', d),
}

export const marketAPI = {
  getPrices:     (params) => api.get('/market/prices', { params }),
  getPriceHistory:(id)    => api.get(`/market/prices/${id}/history`),
  getCategories: ()       => api.get('/market/categories'),
  getTopMovers:  ()       => api.get('/market/top-movers'),
  analyzePrice:  (d)       => api.post('/market/analyze', d),
}

export const cropsAPI = {
  recommend:     (d)   => api.post('/crops/recommend', d),
  getHistory:    ()    => api.get('/crops/history'),
  deleteHistory: (id)  => api.delete(`/crops/history/${id}`),
}

export const diseaseAPI = {
  detect:        (form) => api.post('/disease/detect', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory:    ()     => api.get('/disease/history'),
  getDetection:  (id)   => api.get(`/disease/${id}`),
  updateStatus:  (id,s) => api.put(`/disease/${id}/status`, { status: s }),
  delete:        (id)   => api.delete(`/disease/${id}`),
}

export const schemesAPI = {
  getAll:          (p) => api.get('/schemes', { params: p }),
  getOne:          (id)=> api.get(`/schemes/${id}`),
  enroll:          (id)=> api.post(`/schemes/${id}/enroll`),
  getEnrollments:  ()  => api.get('/schemes/enrollments'),
  deleteEnrollment:(id)=> api.delete(`/schemes/enrollments/${id}`),
}

export const chatAPI = {
  send:         (message, language) => api.post('/chat/message', { message, language }),
  getHistory:   ()                  => api.get('/chat/history'),
  clearHistory: ()                  => api.delete('/chat/history'),
}

export const notificationAPI = {
  getAll:      ()   => api.get('/notifications'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()   => api.put('/notifications/read-all'),
  delete:      (id) => api.delete(`/notifications/${id}`),
  clearAll:    ()   => api.delete('/notifications/clear-all'),
}

export const historyAPI = {
  getAll:    (params) => api.get('/history', { params }),
  getSummary:()       => api.get('/history/summary'),
  deleteItem:(type,id)=> api.delete(`/history/${type}/${id}`),
  clearType: (type)   => api.delete(`/history/clear/${type}`),
  clearAll:  ()       => api.delete('/history/clear-all'),
}

export const calendarAPI = {
  getEvents:   ()       => api.get('/calendar'),
  addEvent:    (data)   => api.post('/calendar', data),
  updateEvent: (id, d)  => api.put(`/calendar/${id}`, d),
  deleteEvent: (id)     => api.delete(`/calendar/${id}`),
}

export const publicAPI = {
  lookupPincode: (pin) => api.get(`/pincode/${pin}`),
}
