import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { notificationAPI } from '../api/services'
import { Search, Bell, Settings, LogOut, Check, Globe, ChevronDown, MessageSquareText, ScanSearch, FileText, History, Users, Calendar as CalendarIcon, Trash2, CheckCircle, HelpCircle, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import Logo from './Logo'

export default function TopBar() {
  const { farmer, logout } = useAuth()
  const { t, lang, changeLang, allLangs } = useLang()
  const navigate = useNavigate()
  
  const { addToast } = useToast()
  
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const notifRef = useRef()
  const profileRef = useRef()
  const moreRef = useRef()

  const formatNotifTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.max(0, now - d)
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    let rel = ''
    if (diff < 60000) rel = 'Just now'
    else if (diff < 3600000) rel = `${Math.floor(diff / 60000)}m ago`
    else if (diff < 86400000) rel = `${Math.floor(diff / 3600000)}h ago`
    else rel = d.toLocaleDateString([], { month: 'short', day: 'numeric' })

    return `${rel} · ${timeStr}`
  }

  const fetchNotifs = (silent = false) => {
    notificationAPI.getAll().then(r => { 
      const newNotifs = r.data.notifications || []
      const newUnread = r.data.unread_count || 0
      
      // If there's a new notification ID we haven't seen, show toast
      if (!silent && newNotifs.length > 0) {
        const latest = newNotifs[0]
        const lastSeen = localStorage.getItem('last_notif_id')
        if (latest.id.toString() !== lastSeen) {
          addToast({
            type: latest.type === 'calendar' ? 'calendar' : 'info',
            title: latest.title,
            message: latest.message,
            link: latest.link
          })
          localStorage.setItem('last_notif_id', latest.id.toString())
        }
      }
      
      setNotifs(newNotifs); 
      setUnread(newUnread) 
    }).catch(() => {})
  }

  useEffect(() => { 
    fetchNotifs(true); 
    const i = setInterval(() => fetchNotifs(false), 20000); 
    return () => clearInterval(i) 
  }, []) 

  // Inside divide-y map:
  // <span className="text-[10px] text-gray-400 mt-1 font-medium">{formatNotifTime(n.created_at)}</span>

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      const lower = searchVal.toLowerCase()
      if (lower.includes('weather')) navigate('/weather')
      else if (lower.includes('market') || lower.includes('price')) navigate('/market-prices')
      else if (lower.includes('crop') || lower.includes('recommend')) navigate('/crop-recommendation')
      else if (lower.includes('disease') || lower.includes('detect')) navigate('/disease-detection')
      else if (lower.includes('chat') || lower.includes('ai')) navigate('/ai-chat')
      else if (lower.includes('scheme') || lower.includes('gov')) navigate('/schemes')
      else if (lower.includes('history')) navigate('/history')
      setSearchVal('')
    }
  }

  const avatarSrc = farmer?.avatar_url
    ? (farmer.avatar_url.startsWith('/uploads') ? `http://localhost:8000${farmer.avatar_url}` : farmer.avatar_url)
    : null

  const LINKS = [
    { label: t('dashboard') || 'Dashboard', path: '/dashboard' },
    { label: t('weather') || 'Weather', path: '/weather' },
    { label: t('market') || 'Market Prices', path: '/market-prices' },
    { label: t('crops') || 'Crop Rec', path: '/crop-recommendation' },
  ]
  const MORE = [
    { label: t('disease') || 'Disease Detection', path: '/disease-detection', icon: ScanSearch },
    { label: t('aiChat') || 'AI Assistant', path: '/ai-chat', icon: MessageSquareText },
    { label: t('schemes') || 'Gov Schemes', path: '/schemes', icon: FileText },
    { label: t('calendar') || 'Calendar', path: '/calendar', icon: CalendarIcon },
    { label: t('history') || 'Farm History', path: '/history', icon: History },
    { label: t('community') || 'Community', path: '/community', icon: Users },
  ]

  return (
    <header className="px-6 md:px-10 h-[90px] flex items-center justify-between gap-6 relative z-30 font-['Inter',sans-serif]">
      
      {/* Left: Logo & Links */}
      <div className="flex items-center gap-10">
         <div className="flex items-center drop-shadow-sm brightness-110">
           {/* Ensuring visibility of Logo text with explicit styling or dark=false if required. For Farmiti, dark=true usually means white text. 
               The user asked for light green text visibility. So if dark=true equals white, we will wrap and force green fill/color if possible, 
               or just use dark=false which uses default text colors which we can override. */}
           <div className="text-[#1A5C38] [&>*]:text-[#1A5C38] [&_path]:fill-[#4CAF7D]">
             <Logo dark={false} className="scale-95 origin-left" />
           </div>
         </div>
         
         <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium">
           {LINKS.map(l => (
             <NavLink 
               key={l.path} 
               to={l.path}
               className={({ isActive }) => `transition-colors relative ${isActive ? 'text-[#1A5C38] font-bold' : 'text-gray-500 hover:text-[#1A5C38]'}`}
             >
               {l.label}
             </NavLink>
           ))}
           <div className="relative" ref={moreRef}>
             <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-1 text-gray-500 hover:text-[#1A5C38] transition-colors relative">
                {t('more')} <ChevronDown className="w-4 h-4"/>
             </button>
             {showMore && (
                <div className="absolute top-10 flex flex-col w-52 bg-white rounded-2xl shadow-xl overflow-hidden z-50 py-2 border border-gray-100">
                  {MORE.map(m => (
                    <NavLink key={m.path} to={m.path} onClick={() => setShowMore(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-[14px] ${isActive ? 'text-[#1A5C38] font-semibold bg-green-50/50' : 'text-gray-700'}`}>
                      <m.icon className="w-4 h-4 text-emerald-500"/> {m.label}
                    </NavLink>
                  ))}
                </div>
             )}
           </div>
         </nav>
      </div>

      {/* Right: Search + Tools */}
      <div className="flex items-center gap-4">
        
        {/* Guide / Tour Launcher */}
        <button 
          id="tour-guide-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-50 transition-colors text-[#1A5C38] group relative"
          title={t('startTour')}
        >
          <HelpCircle className="w-[20px] h-[20px]" strokeWidth={2.5}/>
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{t('platformGuide')}</span>
        </button>

        {/* Search Bar */}
        <div id="topbar-search" className="hidden md:flex items-center gap-2 rounded-full px-4 py-2.5 w-[240px] bg-[#EAF5F0] border border-transparent focus-within:border-green-200 transition-all text-sm shadow-inner group">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent text-gray-800 outline-none placeholder-gray-500 font-medium w-full"
          />
          <Search className="w-4 h-4 text-[#88b14a] group-focus-within:text-[#4caf7d] shrink-0 transition-colors" />
        </div>

        {/* Notifs Dropdown */}
        <div className="relative" ref={notifRef} id="topbar-notifs">
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-50 transition-colors text-gray-700">
            <Bell className="w-[18px] h-[18px]" strokeWidth={2.5}/>
            {unread > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl overflow-hidden z-50 border border-gray-100 flex flex-col max-h-[480px]">
              <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <span className="font-bold text-gray-900 tracking-tight">{t('notifications')}</span>
                {notifs.length > 0 && (
                  <button 
                    onClick={() => notificationAPI.clearAll().then(() => fetchNotifs(true))}
                    className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3"/> {t('clearAll')}
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1">
                {notifs.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-200"/>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{t('noNewAlerts')}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t('caughtUp')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                    {notifs.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 hover:bg-green-50/50 transition-all cursor-pointer group relative ${!n.is_read ? 'bg-green-50/30' : ''}`}
                      >
                         {!n.is_read && <div className="absolute left-2 top-6 w-1.5 h-1.5 bg-[#4CAF7D] rounded-full" />}
                         <div 
                           className="flex flex-col gap-0.5"
                           onClick={async () => {
                             setShowNotifs(false)
                             if (n.link) navigate(n.link)
                             await notificationAPI.markRead(n.id).catch(() => {})
                             await notificationAPI.delete(n.id).catch(() => {})
                             fetchNotifs(true)
                           }}
                         >
                            <h5 className="text-[13px] font-bold text-gray-900 leading-snug pr-6 group-hover:text-emerald-700 transition-colors">{n.title}</h5>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed pr-6">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-1 font-medium">{formatNotifTime(n.created_at)}</span>
                         </div>

                         {/* Individual Delete Button */}
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             notificationAPI.delete(n.id).then(() => fetchNotifs(true))
                           }}
                           className="absolute right-3 top-4 p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                           title={t('deleteNotif')}
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {unread > 0 && (
                <button 
                  onClick={() => notificationAPI.markAllRead().then(() => fetchNotifs(true))}
                  className="p-3 text-center text-xs font-bold text-[#1A5C38] bg-gray-50 hover:bg-green-50 transition-colors border-t border-gray-100"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-green-300 transition-all ml-1 shadow-sm">
            {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-[#1A5C38] text-white flex items-center justify-center font-bold text-sm">F</div>}
          </button>
          
          {showProfile && (
            <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl overflow-hidden z-50 py-2 border border-gray-100">
              <button onClick={() => { navigate('/profile'); setShowProfile(false) }} className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-green-50 text-gray-700 flex items-center justify-between">{t('myProfile')}</button>
              <button onClick={() => { logout(); navigate('/') }} className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-red-50 text-red-500 flex items-center justify-between mt-2 border-t border-gray-50 pt-3">{t('logout')} <LogOut className="w-4 h-4"/></button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}