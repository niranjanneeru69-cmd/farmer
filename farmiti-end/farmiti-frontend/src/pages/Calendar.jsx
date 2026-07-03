import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { calendarAPI } from '../api/services'
import { Plus, X, Calendar as CalIcon, Bell, CheckCircle2, ChevronLeft, ChevronRight, Check, Search, Trash2, Edit2, Clock, MapPin, AlignLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Native Date Utils
const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addMonths = (date, m) => new Date(date.getFullYear(), date.getMonth() + m, 1)
const subMonths = (date, m) => new Date(date.getFullYear(), date.getMonth() - m, 1)
const isSameDay = (d1, d2) => d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
const formatMonthYear = (date) => (date?.toLocaleDateString ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '')
const formatDayNumber = (date) => (date?.getDate ? date.getDate().toString() : '0')

const addAnHour = (timeStr) => {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Categories & Colors ───────────────────────────
const EVENT_CATEGORIES = {
  tasks:         { label: 'Tasks',         bg: '#D9EDC3', border: '#A6C98A', text: '#2E551B' },
  harvesting:    { label: 'Harvesting',    bg: '#C1E1C1', border: '#8FBB8F', text: '#1C4A1C' },
  irrigation:    { label: 'Irrigation',    bg: '#D1E8E2', border: '#97C1B8', text: '#194A3F' },
  pest_control:  { label: 'Pest Control',  bg: '#FADADD', border: '#DDA0A6', text: '#5E272E' },
  fertilization: { label: 'Fertilization', bg: '#FDFD96', border: '#D8D86B', text: '#5C5C0F' },
  maintenance:   { label: 'Maintenance',   bg: '#EADDCE', border: '#C2B09F', text: '#4A3B2B' },
  festivals:     { label: 'Festivals',     bg: '#F4C2C2', border: '#D98A8A', text: '#5E1B1B' }
}

const INDIAN_FESTIVALS = [
  // January
  { title: '🔥 Lohri',             start: '2026-01-13T09:00:00', end: '2026-01-13T12:00:00', type: 'festivals' },
  { title: '☀️ Makar Sankranti', start: '2026-01-14T10:00:00', end: '2026-01-14T12:00:00', type: 'festivals' },
  { title: '🌾 Pongal',            start: '2026-01-14T09:00:00', end: '2026-01-14T12:00:00', type: 'festivals' },
  { title: '🎖️ Subhas Chandra Bose Jayanti', start: '2026-01-23T09:00:00', end: '2026-01-23T10:00:00', type: 'festivals' },
  { title: '🇮🇳 Republic Day',     start: '2026-01-26T09:00:00', end: '2026-01-26T11:00:00', type: 'festivals' },
  
  // February
  { title: '🌼 Basant Panchami',   start: '2026-02-03T09:00:00', end: '2026-02-03T11:00:00', type: 'festivals' },
  { title: '🔱 Maha Shivaratri',   start: '2026-02-15T09:00:00', end: '2026-02-15T12:00:00', type: 'festivals' },
  
  // March
  { title: '🌿 Ugadi / Gudi Padwa',start: '2026-03-19T09:00:00', end: '2026-03-19T11:00:00', type: 'festivals' },
  { title: '🌙 Eid al-Fitr',       start: '2026-03-20T08:00:00', end: '2026-03-20T10:00:00', type: 'festivals' },
  { title: '🎨 Holi',             start: '2026-03-22T10:00:00', end: '2026-03-22T13:00:00', type: 'festivals' },
  { title: '🏹 Ram Navami',        start: '2026-03-26T09:00:00', end: '2026-03-26T11:00:00', type: 'festivals' },
  
  // April
  { title: '🕊️ Mahavir Jayanti',    start: '2026-04-01T09:00:00', end: '2026-04-01T11:00:00', type: 'festivals' },
  { title: '✝️ Good Friday',       start: '2026-04-03T09:00:00', end: '2026-04-03T11:00:00', type: 'festivals' },
  { title: '🌾 Baisakhi',         start: '2026-04-14T10:00:00', end: '2026-04-14T12:00:00', type: 'festivals' },
  { title: '⚖️ Ambedkar Jayanti',  start: '2026-04-14T09:00:00', end: '2026-04-14T10:00:00', type: 'festivals' },
  { title: '🌍 Earth Day',         start: '2026-04-22T09:00:00', end: '2026-04-22T10:00:00', type: 'festivals' },
  
  // May
  { title: '☸️ Buddha Purnima',     start: '2026-05-01T09:00:00', end: '2026-05-01T11:00:00', type: 'festivals' },
  { title: '🕌 Id-e-Milad',        start: '2026-05-26T09:00:00', end: '2026-05-26T11:00:00', type: 'festivals' },
  
  // June
  { title: '🌱 World Environment Day', start: '2026-06-05T09:00:00', end: '2026-06-05T10:00:00', type: 'festivals' },
  
  // August
  { title: '🇮🇳 Independence Day',  start: '2026-08-15T09:00:00', end: '2026-08-15T11:00:00', type: 'festivals' },
  { title: '🌸 Onam',              start: '2026-08-26T09:00:00', end: '2026-08-26T11:00:00', type: 'festivals' },
  { title: '🛡️ Raksha Bandhan',    start: '2026-08-28T09:00:00', end: '2026-08-28T11:00:00', type: 'festivals' },
  
  // September
  { title: '🦚 Janmashtami',       start: '2026-09-04T09:00:00', end: '2026-09-04T12:00:00', type: 'festivals' },
  { title: '🐘 Ganesh Chaturthi',  start: '2026-09-14T10:00:00', end: '2026-09-14T12:00:00', type: 'festivals' },
  
  // October
  { title: '🕊️ Gandhi Jayanti',     start: '2026-10-02T09:00:00', end: '2026-10-02T10:00:00', type: 'festivals' },
  { title: '🕉️ Dussehra',           start: '2026-10-19T10:00:00', end: '2026-10-19T12:00:00', type: 'festivals' },
  
  // November
  { title: '🪔 Diwali',           start: '2026-11-08T18:00:00', end: '2026-11-08T20:00:00', type: 'festivals' },
  { title: 'ੴ Guru Nanak Jayanti',start: '2026-11-24T09:00:00', end: '2026-11-24T12:00:00', type: 'festivals' },
  { title: '📜 Constitution Day',  start: '2026-11-26T09:00:00', end: '2026-11-26T10:00:00', type: 'festivals' },
  
  // December
  { title: '🌍 World Soil Day',    start: '2026-12-05T09:00:00', end: '2026-12-05T10:00:00', type: 'festivals' },
  { title: '🚜 Kisan Diwas',       start: '2026-12-23T09:00:00', end: '2026-12-23T11:00:00', type: 'festivals'},
  { title: '✝️ Christmas',       start: '2026-12-25T09:00:00', end: '2026-12-25T12:00:00', type: 'festivals' }
]

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDate, setActiveDate] = useState(new Date())
  const [fcApi, setFcApi] = useState(null)
  const calendarRef = useRef(null)
  
  // UI State
  const [modalOpen, setModalOpen] = useState(false)
  const [popoverState, setPopoverState] = useState({ open: false, event: null, rect: null })
  const [categoryToggles, setCategoryToggles] = useState(
    Object.keys(EVENT_CATEGORIES).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  )

  // Form State
  const [selectedDateStr, setSelectedDateStr] = useState(null)
  const [editingEventId, setEditingEventId] = useState(null)
  const [formData, setFormData] = useState({
    title: '', start_time: '', end_time: '', description: '', type: 'tasks', reminder_mins: 0
  })

  useEffect(() => { fetchEvents() }, [])

  useEffect(() => {
    if (calendarRef.current && !fcApi) {
      setFcApi(calendarRef.current.getApi())
    }
  }, [calendarRef.current, fcApi])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await calendarAPI.getEvents()
      const dbEvents = (res?.data?.events || []).map(e => ({ ...e, type: e.extendedProps?.type || 'tasks' }))
      
      const generatedFestivals = []
      // Replicate festivals across 15 years (past 5, future 10) dynamically
      for (let y = 2021; y <= 2036; y++) {
         INDIAN_FESTIVALS.forEach(f => {
            generatedFestivals.push({
               title: f.title,
               start: f.start.replace('2026', y.toString()),
               end: f.end.replace('2026', y.toString()),
               type: 'festivals'
            })
         })
      }

      const allEvts = [...generatedFestivals, ...dbEvents].map((e, idx) => {
        const cat = EVENT_CATEGORIES[e.type] || EVENT_CATEGORIES.tasks
        return { 
          ...e,
          id: e.id || `festival-${idx}`,
          backgroundColor: cat.bg, 
          borderColor: cat.border, 
          textColor: cat.text,
          classNames: ['gcal-event'],
          extendedProps: { ...(e.extendedProps || {}), type: e.type }
        }
      })
      setEvents(allEvts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const d = new Date()
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const listEvents = useMemo(() => events.filter(e => e.type !== 'festivals' && e.start).sort((a,b) => new Date(a.start) - new Date(b.start)), [events])
  const todayEvents = listEvents.filter(e => e.start.startsWith(todayStr))
  const upcomingEvents = listEvents.filter(e => e.start > todayStr).slice(0, 5)

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!categoryToggles[e.type]) return false
      return true
    })
  }, [events, categoryToggles])

  const openNew = (dateStr) => {
    setPopoverState({ open: false, event: null, rect: null })
    
    // dateStr might be "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss"
    const [d, t] = dateStr.includes('T') ? dateStr.split('T') : [dateStr, '']
    const startTime = t ? t.substring(0, 5) : ''
    
    setSelectedDateStr(d)
    setEditingEventId(null)
    setFormData({ 
      title: '', 
      start_time: startTime, 
      end_time: addAnHour(startTime), 
      description: '', 
      type: 'tasks', 
      reminder_mins: 10 
    })
    setModalOpen(true)
  }

  const handleEventClick = (arg) => {
    const r = arg.el.getBoundingClientRect()
    setPopoverState({
      open: true,
      event: arg.event,
      rect: { top: r.top, left: r.left, width: r.width, height: r.height }
    })
  }

  const submitEvent = async (e) => {
    e.preventDefault()
    if (!selectedDateStr) return
    const payload = {
      ...formData,
      event_date: selectedDateStr,
      reminder_mins: Number(formData.reminder_mins)
    }
    try {
      if (editingEventId) await calendarAPI.updateEvent(editingEventId, payload)
      else await calendarAPI.addEvent(payload)
      setModalOpen(false)
      fetchEvents()
    } catch (err) { console.error(err) }
  }

  const editFromPopover = () => {
    const e = popoverState.event
    if (!e || typeof e.id === 'string' && e.id.startsWith('festival-')) return
    setSelectedDateStr(e.startStr ? e.startStr.split('T')[0] : null)
    setEditingEventId(e.id)
    setFormData({
      title: e.title || '',
      start_time: e.startStr?.includes('T') ? e.startStr.split('T')[1].substring(0, 5) : '',
      end_time: e.endStr?.includes('T') ? e.endStr.split('T')[1].substring(0, 5) : '',
      description: e.extendedProps?.description || '',
      type: e.extendedProps?.type || 'tasks',
      reminder_mins: e.extendedProps?.reminder_mins || 0
    })
    setPopoverState({ open: false, event: null, rect: null })
    setModalOpen(true)
  }

  const deleteFromPopover = async () => {
    const id = popoverState.event?.id
    if (!id || (typeof id === 'string' && id.startsWith('festival-'))) return
    try {
      await calendarAPI.deleteEvent(id)
      setPopoverState({ open: false, event: null, rect: null })
      fetchEvents()
    } catch (err) { console.error(err) }
  }

  const toggleCategory = (key) => setCategoryToggles(p => ({ ...p, [key]: !p[key] }))

  const changeView = (viewType) => {
    if (fcApi) { fcApi.changeView(viewType); setActiveDate(fcApi.getDate()) }
  }

  // Mini Cal Widget
  const daysInMonth = getDaysInMonth(activeDate)
  const firstDayOfMonth = startOfMonth(activeDate).getDay()
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const minicalCells = Array.from({ length: 42 })

  return (
    <div className="min-h-screen bg-[#F5F6F2] p-4 lg:p-6 font-['Plus_Jakarta_Sans',sans-serif] text-gray-800 overflow-hidden flex flex-col items-center">
      
      {/* Global CSS Overrides for Google Calendar Look */}
      <style>{`
        .fc { --fc-border-color: #E0E2D9; font-family: 'Plus Jakarta Sans', sans-serif; }
        .fc .fc-toolbar { display: none; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #E0E2D9; }
        .fc-day-today { background-color: rgba(66, 133, 244, 0.04) !important; }
        .fc .fc-timegrid-slot-label-cushion { font-size: 11px; color: #70756B; text-transform: uppercase; }
        .fc .fc-timegrid-slot { height: 60px !important; }
        .fc .fc-col-header-cell { padding: 10px 0; border-bottom: 1px solid #E0E2D9 !important; border-top: none !important; }
        .fc-day-number-custom { font-size: 24px; font-weight: 500; color: #1E293B; line-height: 1; }
        .fc-day-text-custom { font-size: 11px; font-weight: 600; color: #70756B; text-transform: uppercase; margin-bottom: 4px; }
        .gcal-event { 
          border-radius: 6px !important; 
          border-left-width: 4px !important; 
          border-top: none !important; border-right: none !important; border-bottom: none !important;
          padding: 4px 6px !important; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important; 
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; 
          cursor: pointer;
        }
        .fc-timegrid-event { transition: z-index 0s, box-shadow 0.2s !important; overflow: hidden !important; }
        .fc-timegrid-event:hover {
          z-index: 50 !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06) !important;
        }
        .fc-daygrid-day-events { max-height: 120px; overflow-y: auto !important; padding-bottom: 5px; }
        .fc-daygrid-day-events::-webkit-scrollbar { width: 3px; }
        .fc-daygrid-day-events::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.15); border-radius: 3px; }
        .gcal-event:hover { filter: brightness(0.95); }
        .fc-event-title-container { font-weight: 600 !important; font-size: 12px !important; }
        .fc-v-event .fc-event-main-frame { flex-direction: column; align-items: flex-start; }
        .today-header-number { background-color: #1A5C38; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
        .today-header-text { color: #1A5C38; }
      `}</style>

      <div className="w-full max-w-[1700px] grid lg:grid-cols-[260px_1fr] gap-6 items-start h-[calc(100vh-80px)]">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="h-full flex flex-col gap-6 overflow-y-auto scrollbar-hide py-2 pb-10">
          
          {/* Create Button */}
          <button onClick={() => openNew(new Date().toISOString().split('T')[0])} 
            className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-[#E0E2D9] px-4 py-3 rounded-full w-max shadow-sm hover:shadow transition-all group">
            <div className="relative w-6 h-6 flex items-center justify-center">
               <svg viewBox="0 0 36 36" className="w-6 h-6"><path fill="#EA4335" d="M16 16v14h4V20z"/><path fill="#34A853" d="M30 16H20l-4 4h14z"/><path fill="#4285F4" d="M20 16V2h-4v14z"/><path fill="#FBBC05" d="M20 16V2h-4v14z"/><path fill="#EA4335" d="M16 16V2h4v14z"/><polygon fill="#4285F4" points="16,16 16,30 20,30 20,16 34,16 34,12 20,12 20,2 16,2 16,12 2,12 2,16 "/></svg>
            </div>
            <span className="font-semibold text-[14px] text-gray-700 tracking-wide pr-2">Create</span>
          </button>

          {/* Mini Calendar Widget */}
          <div className="px-2">
             <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[14px] text-gray-800">{formatMonthYear(activeDate)}</span>
                <div className="flex gap-1">
                   <button onClick={() => { setActiveDate(subMonths(activeDate, 1)); fcApi?.gotoDate(subMonths(activeDate, 1)); }} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
                   <button onClick={() => { setActiveDate(addMonths(activeDate, 1)); fcApi?.gotoDate(addMonths(activeDate, 1)); }} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
                </div>
             </div>
             <div className="grid grid-cols-7 text-[10px] font-semibold text-gray-500 text-center mb-2">
                {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
             </div>
             <div className="grid grid-cols-7 gap-y-1">
                {minicalCells.map((_, i) => {
                  const dayNum = i - paddingDays + 1
                  const isValid = dayNum > 0 && dayNum <= daysInMonth
                  const cellDate = isValid ? new Date(activeDate.getFullYear(), activeDate.getMonth(), dayNum) : null
                  const isToday = cellDate && isSameDay(cellDate, new Date())
                  return (
                    <button key={i} disabled={!isValid} onClick={() => { if (isValid) { fcApi?.gotoDate(cellDate); fcApi?.changeView('timeGridDay'); setActiveDate(cellDate) } }}
                      className={`text-[11px] h-7 w-7 mx-auto flex items-center justify-center rounded-full transition-colors ${!isValid ? 'opacity-0' : isToday ? 'bg-[#1A5C38] text-white font-bold' : 'text-gray-700 hover:bg-gray-200'}`}>
                      {isValid ? dayNum : ''}
                    </button>
                  )
                })}
             </div>
          </div>

          {/* Upcoming Agenda */}
          <div className="px-2 mt-2 space-y-4">
             <div className="space-y-2">
                <h3 className="font-bold text-[12px] text-gray-400 uppercase tracking-wider">Today</h3>
                {todayEvents.length > 0 ? todayEvents.map((act, i) => (
                  <div key={i} onClick={() => { setActiveDate(new Date(act.start)); fcApi?.gotoDate(new Date(act.start)); fcApi?.changeView('timeGridDay'); }} className="flex flex-col gap-0.5 cursor-pointer group hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-[#E0E2D9] shadow-sm hover:shadow">
                     <span className="text-[13px] font-bold text-gray-800 group-hover:text-[#1A5C38] leading-tight transition-colors line-clamp-1">{act.title}</span>
                     <span className="text-[10px] font-semibold text-gray-500">{new Date(act.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' AM','am').replace(' PM','pm')}</span>
                  </div>
                )) : <span className="text-[11px] text-gray-400 italic px-2 block">No tasks today</span>}
             </div>
             <div className="space-y-2">
                <h3 className="font-bold text-[12px] text-gray-400 uppercase tracking-wider">Upcoming</h3>
                {upcomingEvents.length > 0 ? upcomingEvents.map((act, i) => (
                  <div key={i} onClick={() => { setActiveDate(new Date(act.start)); fcApi?.gotoDate(new Date(act.start)); fcApi?.changeView('timeGridDay'); }} className="flex flex-col gap-0.5 cursor-pointer group hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-[#E0E2D9] shadow-sm hover:shadow">
                     <span className="text-[13px] font-bold text-gray-800 group-hover:text-[#1A5C38] leading-tight transition-colors line-clamp-1">{act.title}</span>
                     <span className="text-[10px] font-semibold text-gray-500">{new Date(act.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(act.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' AM','am').replace(' PM','pm')}</span>
                  </div>
                )) : <span className="text-[11px] text-gray-400 italic px-2 block">No upcoming tasks</span>}
             </div>
          </div>

          {/* Categories */}
          <div className="px-2 mt-4 space-y-1">
             <h3 className="font-bold text-[13px] text-gray-800 mb-3 flex items-center justify-between">
                My categories
             </h3>
             {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
                <label key={key} onClick={() => toggleCategory(key)} className="flex items-center gap-3 py-1.5 cursor-pointer group hover:bg-white rounded-lg px-2 transition-colors -mx-2">
                   <div className={`w-4 h-4 rounded-[4px] flex items-center justify-center border transition-all ${categoryToggles[key] ? 'bg-current border-transparent' : 'bg-transparent border-gray-300'}`} style={{ color: categoryToggles[key] ? cat.border : 'inherit' }}>
                      {categoryToggles[key] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                   </div>
                   <span className="text-[13px] font-medium text-gray-700">{cat.label}</span>
                </label>
             ))}
          </div>

        </aside>

        {/* ── MAIN CALENDAR GRID ── */}
        <main className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-[#E0E2D9] overflow-hidden relative">
           
          {/* Header Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E2D9] bg-white z-10 shrink-0">
             <div className="flex items-center gap-5">
                <h2 className="text-[22px] font-normal text-gray-800 min-w-[160px]">
                  {formatMonthYear(activeDate)}
                </h2>
                <div className="flex items-center gap-3">
                   <button onClick={() => { fcApi?.today(); setActiveDate(new Date()); }} className="border border-[#E0E2D9] hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all">Today</button>
                   <div className="flex gap-1">
                      <button onClick={() => { fcApi?.prev(); setActiveDate(fcApi.getDate()); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
                      <button onClick={() => { fcApi?.next(); setActiveDate(fcApi.getDate()); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all text-gray-600"><ChevronRight className="w-5 h-5"/></button>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center border border-[#E0E2D9] rounded-md overflow-hidden">
                {[ {l: 'Month', v: 'dayGridMonth'}, {l: 'Week', v: 'timeGridWeek'}, {l: 'Day', v: 'timeGridDay'} ].map(v => (
                  <button key={v.l} onClick={() => changeView(v.v)}
                    className={`px-4 py-1.5 text-[13px] font-semibold transition-all border-r border-[#E0E2D9] last:border-r-0 ${fcApi?.view.type === v.v ? 'bg-[#EAF5F0] text-[#1A5C38]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {v.l}
                  </button>
                ))}
             </div>
          </div>

          {/* FullCalendar Area */}
          <div className="flex-1 relative overflow-auto p-4 custom-scrollbar bg-white">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              events={filteredEvents}
              height="100%"
              allDaySlot={true}
              allDayText="All Day"
              nowIndicator={true}
              slotDuration="01:00:00"
              slotLabelFormat={{ hour: 'numeric', meridiem: 'short' }} 
              eventMinHeight={25}
              eventOverlap={false}
              dayMaxEvents={false}
              eventDisplay="block"
              dateClick={(arg) => openNew(arg.dateStr)}
              eventClick={handleEventClick}
              dayHeaderContent={(arg) => {
                 const isTdy = isSameDay(arg.date, new Date())
                 return (
                  <div className="flex flex-col items-center gap-1">
                     <span className={`fc-day-text-custom ${isTdy ? 'today-header-text' : ''}`}>{arg.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                     <span className={`fc-day-number-custom ${isTdy ? 'today-header-number' : ''}`}>{formatDayNumber(arg.date)}</span>
                  </div>
                 )
              }}
              eventContent={(arg) => (
                  <div className="flex flex-col h-full items-start w-full relative z-10 px-1.5 py-0.5 overflow-hidden group">
                    <p className="text-[11px] font-bold leading-tight mb-0.5 truncate w-full">{arg.event.title}</p>
                    <div className="flex items-center gap-1 opacity-80 font-semibold text-[9px] mb-0.5 flex-wrap w-full">
                      <span className="truncate">{arg.event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM','am').replace(' PM','pm')}</span>
                    </div>
                    {arg.event.extendedProps?.description && (
                       <p className="text-[10px] opacity-70 leading-tight line-clamp-2 mt-0.5 whitespace-pre-wrap truncate w-full">{arg.event.extendedProps.description}</p>
                    )}
                  </div>
              )}
            />
          </div>
        </main>
      </div>

      {/* ── RICH EVENT POPOVER ── */}
      <AnimatePresence>
         {popoverState.open && popoverState.event && (
            <>
               {/* Invisible overlay to close on click outside */}
               <div className="fixed inset-0 z-[100]" onClick={() => setPopoverState({ open: false, event: null, rect: null })} />
               
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                     position: 'fixed',
                     top: Math.min(popoverState.rect.top, window.innerHeight - 300),
                     left: Math.min(popoverState.rect.left + popoverState.rect.width + 10, window.innerWidth - 320)
                  }}
                  className="z-[110] w-[300px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
               >
                  <div className="flex justify-end gap-1 p-2 bg-gray-50/50">
                     {!(popoverState.event.id && popoverState.event.id.startsWith('festival')) && (
                        <>
                           <button onClick={editFromPopover} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><Edit2 className="w-4 h-4"/></button>
                           <button onClick={deleteFromPopover} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-full text-gray-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </>
                     )}
                     <button onClick={() => setPopoverState({ open: false, event: null, rect: null })} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors ml-2"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="p-5 pt-3 mb-2 flex flex-col gap-4">
                     <div className="flex items-start gap-4">
                        <div className="w-4 h-4 rounded mt-1 shrink-0" style={{ backgroundColor: popoverState.event.backgroundColor, border: `2px solid ${popoverState.event.borderColor}` }} />
                        <div>
                           <h3 className="text-[18px] font-normal text-gray-900 leading-tight mb-1">{popoverState.event.title}</h3>
                           <p className="text-[13px] text-gray-500">
                              {popoverState.event.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} ⋅ {popoverState.event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM','am').replace(' PM','pm')} - {popoverState.event.end ? popoverState.event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM','am').replace(' PM','pm') : ''}
                           </p>
                        </div>
                     </div>
                     
                     {popoverState.event.extendedProps?.description && (
                        <div className="flex items-start gap-4">
                           <AlignLeft className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                           <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{popoverState.event.extendedProps.description}</p>
                        </div>
                     )}

                     {popoverState.event.extendedProps?.reminder_mins > 0 && (
                        <div className="flex items-center gap-4">
                           <Bell className="w-4 h-4 text-gray-400 shrink-0" />
                           <p className="text-[13px] text-gray-700">Reminder: {popoverState.event.extendedProps.reminder_mins >= 60 ? `${popoverState.event.extendedProps.reminder_mins / 60} hour(s)` : `${popoverState.event.extendedProps.reminder_mins} minutes`} before</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      {/* ── EVENT CREATION MODAL ── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-xl overflow-hidden text-gray-800 border border-gray-100">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                   <h2 className="text-lg font-semibold text-gray-800">{editingEventId ? 'Edit Event' : 'Create New Event'}</h2>
                   <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={submitEvent} className="p-6 space-y-5">
                   <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                     autoFocus className="w-full bg-transparent border-b-2 border-gray-200 focus:border-[#1A5C38] px-2 py-2 text-[20px] font-normal outline-none transition-all placeholder-gray-400" placeholder="Add title" />

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Start Time</label>
                         <input type="time" value={formData.start_time} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))} className="w-full bg-gray-50 rounded-lg px-4 py-2.5 text-[14px] font-medium outline-none border border-gray-200 focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">End Time</label>
                         <input type="time" value={formData.end_time} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))} className="w-full bg-gray-50 rounded-lg px-4 py-2.5 text-[14px] font-medium outline-none border border-gray-200 focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]" />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1">Category</label>
                      <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-50 rounded-lg px-4 py-2.5 text-[14px] font-medium outline-none appearance-none cursor-pointer border border-gray-200 focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]">
                         {Object.entries(EVENT_CATEGORIES).filter(([k]) => k !== 'festivals').map(([key, cat]) => (
                            <option key={key} value={key}>{cat.label}</option>
                         ))}
                      </select>
                   </div>
                   
                   <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1.5"><Bell className="w-3 h-3"/> Notification Reminder</label>
                      <select value={formData.reminder_mins} onChange={e => setFormData(p => ({ ...p, reminder_mins: Number(e.target.value) }))} className="w-full bg-gray-50 rounded-lg px-4 py-2.5 text-[14px] font-medium outline-none appearance-none cursor-pointer border border-gray-200 focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]">
                         <option value={0}>No reminder</option>
                         <option value={5}>5 minutes before</option>
                         <option value={10}>10 minutes before</option>
                         <option value={15}>15 minutes before</option>
                         <option value={30}>30 minutes before</option>
                         <option value={60}>1 hour before</option>
                         <option value={1440}>1 day before</option>
                      </select>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-1 flex items-center gap-1.5"><AlignLeft className="w-3 h-3"/> Description</label>
                      <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2}
                        className="w-full bg-gray-50 rounded-lg px-4 py-2.5 text-[14px] font-medium outline-none resize-none border border-gray-200 focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38] whitespace-pre-wrap" placeholder="Add description" />
                   </div>

                   <div className="flex gap-3 pt-3 flex-row-reverse">
                      <button type="submit" className="px-6 py-2.5 bg-[#1A5C38] text-white rounded-lg text-[14px] font-semibold hover:bg-emerald-900 transition-colors shadow-sm">Save</button>
                      <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-[14px] font-semibold transition-colors">Cancel</button>
                   </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}