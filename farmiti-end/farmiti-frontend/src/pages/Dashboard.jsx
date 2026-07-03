import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { farmerAPI, marketAPI, weatherAPI, historyAPI, calendarAPI } from '../api/services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  CloudSun, TrendingUp, Sprout, ScanSearch, MessageSquareText, FileText,
  History, ArrowUpRight, Thermometer, Droplets, ArrowUp, ArrowDown,
  CheckCircle2, XCircle, Clock, Plus, MapPin
} from 'lucide-react'
import FarmMap from '../components/FarmMap'

export default function Dashboard() {
  const { farmer } = useAuth()
  const { t } = useLang()
  const [crops, setCrops] = useState([])
  const [prices, setPrices] = useState([])
  const [weather, setWeather] = useState(null)
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : hour < 21 ? t('greeting_evening') : t('greeting_night')

  useEffect(() => {
    Promise.all([
      farmerAPI.getCrops(),
      marketAPI.getPrices(),
      weatherAPI.getCurrent({ 
        lat: farmer?.latitude, 
        lon: farmer?.longitude,
        city: `${farmer?.district || farmer?.state || 'Chennai'},IN` 
      }),
      historyAPI.getSummary(),
      calendarAPI.getEvents(),
      weatherAPI.getAlerts().catch(() => ({ data: { alerts: [] } }))
    ]).then(([c, m, w, s, cal, wa]) => {
      setCrops(c.data.crops?.slice(0, 3) || [])
      setPrices(m.data.prices?.slice(0, 8) || [])
      setWeather(w.data)
      setSummary(s.data)
      setCalendarEvents(cal.data?.events || [])
      // Merge live weather alerts from current endpoint + DB alerts
      const liveAlerts = w.data?.alerts || []
      const dbAlerts = wa.data?.alerts || []
      const allAlerts = [...liveAlerts]
      dbAlerts.forEach(a => {
        if (!allAlerts.find(la => la.title === a.title)) allAlerts.push(a)
      })
      setWeatherAlerts(allAlerts)
    }).catch(console.error).finally(() => setLoading(false))
  }, [farmer])

  const chartData = prices.slice(0, 7).map(p => ({
    name: p.crop_name.split(' ')[0].substring(0, 8),
    price: Number(p.price),
  }))

  const QUICK = [
    { label: t('weather'), path: '/weather', icon: CloudSun, color: '#3B82F6' },
    { label: t('market'), path: '/market-prices', icon: TrendingUp, color: '#E8A020' },
    { label: t('crops'), path: '/crop-recommendation', icon: Sprout, color: '#1A5C38' },
    { label: t('disease'), path: '/disease-detection', icon: ScanSearch, color: '#EF4444' },
  ]

  // Filter Calendar Events
  const d = new Date()
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  
  const sortedEvents = [...calendarEvents].sort((a, b) => new Date(a.start) - new Date(b.start))
  
  const todayEvents = sortedEvents.filter(e => e.start?.startsWith(todayStr))
  const upcomingEvents = sortedEvents.filter(e => e.start && e.start > todayStr && !e.start.startsWith(todayStr)).slice(0, 5)

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] text-gray-900 pb-10 fade-in-up">
      
      {/* ROW 1: Top Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6 mb-6">
        
        {/* COL 1: Overview & Quick Links */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Overview Block: Lightened Emerald-Lime Gradient */}
          <div id="dashboard-welcome" className="bg-[#B5D6B2] rounded-[2.5rem] p-8 shadow-2xl border-none flex flex-col justify-between min-h-[260px] relative overflow-hidden group">
             {/* Dynamic Mesh Decorative Elements */}
             <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-white rounded-full blur-[80px] opacity-40 group-hover:scale-110 transition-transform duration-1000" />
             <div className="absolute bottom-[-20%] left-[-10%] w-[250px] h-[250px] bg-[#4CAF7D] rounded-full blur-[60px] opacity-10" />
             
             <div className="relative z-10 flex justify-between items-start mb-2">
                <div>
                   <h2 className="font-black text-[#0D3320] text-3xl tracking-tighter leading-tight drop-shadow-sm">{greeting}, {farmer?.name?.split(' ')[0] || 'Farmer'}</h2>
                   <p className="text-[#0D3320]/40 font-black uppercase tracking-[0.2em] text-[11px] mt-1">{farmer?.district || farmer?.state || 'India'}</p>
                </div>
                {weather?.description && (
                  <div className="bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl">
                    <CloudSun className="w-8 h-8 text-[#0D3320]" />
                  </div>
                )}
             </div>

             <div className="relative z-10 flex items-baseline gap-2 mb-6 mt-4">
                <span className="text-[5.5rem] font-black tracking-tighter text-[#0D3320] leading-none">{weather?.temp || 32}°</span>
                <span className="text-[#0D3320]/60 font-black text-xl mb-4 capitalize opacity-90">{weather?.description || t('clearSky')}</span>
             </div>

             <div className="relative z-10 flex items-center gap-4">
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[1.5rem] py-4 px-5 border border-white/20 hover:bg-white/60 transition-colors">
                   <p className="text-[10px] uppercase font-black tracking-widest text-[#0D3320]/40 mb-1 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5"/> {t('humidity')}</p>
                   <p className="font-black text-[#0D3320] text-2xl tracking-tighter">{weather?.humidity || 72}%</p>
                </div>
                <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[1.5rem] py-4 px-5 border border-white/20 hover:bg-white/60 transition-colors">
                   <p className="text-[10px] uppercase font-black tracking-widest text-[#0D3320]/40 mb-1 flex items-center gap-1.5"><span>⚗️</span> {t('soilPh')}</p>
                   <p className="font-black text-[#0D3320] text-2xl tracking-tighter">6.5</p>
                </div>
             </div>
          </div>

          {/* Quick Links Horizontal Array */}
          <div className="grid grid-cols-4 gap-3">
             {QUICK.map(({ label, path, icon: Icon, color }, i) => {
                const bgs = ['bg-[#ECFDF5]', 'bg-[#FFFBEB]', 'bg-[#F0FDF4]', 'bg-[#FEF2F2]'];
                const cardBg = bgs[i % bgs.length];
                return (
                  <Link key={`quick-${i}`} id={i === 0 ? 'weather-card' : undefined} to={path} className={`${cardBg} rounded-[2rem] p-5 shadow-sm border border-white/50 flex flex-col items-center gap-3 hover:-translate-y-1 hover:scale-105 transition-all group`}>
                     <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white group-hover:shadow-lg transition-all">
                       <Icon className="w-5 h-5" style={{ color }} />
                     </div>
                     <span className="text-[11px] font-black text-[#0D3320]/60 uppercase tracking-wider">{label}</span>
                  </Link>
                )
             })}
          </div>
        </div>

        {/* COL 2: Activity + Alerts */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Activity Overview */}
          <div id="activity-log" className="bg-white rounded-[2.8rem] p-7 shadow-2xl border border-gray-100 flex flex-col h-[320px] lg:h-auto lg:min-h-[360px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-black text-[#0D3320] text-[18px] tracking-tight">{t('activityOverview')}</h3>
              <Link to="/calendar" className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full hover:bg-emerald-50 transition-colors"><Plus className="w-4 h-4 text-emerald-600"/></Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
               {/* Today Section */}
               <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-600/40 mb-2 sticky top-0 bg-white py-1 z-10">Today</p>
                  {todayEvents.length > 0 ? todayEvents.map((act, i) => (
                    <Link key={i} to="/calendar" className="flex items-center gap-4 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl p-4 transition-all border border-transparent hover:border-emerald-100">
                      <div className="w-1 h-10 rounded-full shrink-0 bg-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0D3320] truncate">{act.title}</p>
                        <p className="text-[10px] text-emerald-600 font-black mt-1 uppercase tracking-widest">{act.start?.split('T')[1]?.substring(0,5) || '00:00'}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-[11px] text-gray-400 font-medium italic pl-1">No activities for today</p>
                  )}
               </div>

               {/* Upcoming Section */}
               <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-600/40 mb-2 sticky top-0 bg-white py-1 z-10">Upcoming</p>
                  {upcomingEvents.length > 0 ? upcomingEvents.map((act, i) => (
                    <Link key={i} to="/calendar" className="flex items-center gap-4 bg-gray-50/50 rounded-2xl p-4 transition-all border border-transparent hover:border-amber-100">
                      <div className="w-1 h-10 rounded-full shrink-0 bg-amber-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-gray-600 truncate">{act.title}</p>
                        <p className="text-[10px] text-amber-600 font-black mt-1 uppercase tracking-widest">{new Date(act.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-[11px] text-gray-400 font-medium italic pl-1">No upcoming activities</p>
                  )}
               </div>
            </div>

            <Link to="/calendar" className="mt-4 flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#0D3320] hover:bg-[#C6FB51] transition-all shrink-0">
               View All Tasks <ArrowUpRight className="w-3.5 h-3.5"/>
            </Link>
          </div>

          {/* Critical Alerts Block */}
          <div className="bg-[#FFF9EA] rounded-[2.5rem] p-7 flex flex-col border border-amber-100 shadow-lg h-[220px]">
             <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-[#92400E] text-[17px] tracking-tight">{t('criticalAlerts')}</h3>
                <Link to="/weather" className="text-[10px] font-black text-[#D97706] uppercase tracking-widest">{t('checkAll')}</Link>
             </div>
             <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a574 transparent' }}>
                {weatherAlerts.length > 0 ? weatherAlerts.map((alert, i) => {
                   const severityColor = alert.severity === 'High' ? 'bg-red-500' : alert.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-400'
                   return (
                     <div key={i} className="flex items-start gap-3 bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm hover:bg-white/80 transition-colors">
                        <div className={`w-1.5 h-8 ${severityColor} rounded-full shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-[#92400E] font-black uppercase tracking-wider">{alert.title || alert.event || 'Weather Alert'}</p>
                          <p className="text-[11px] font-semibold text-gray-600 mt-0.5 line-clamp-2">{alert.description || 'Check local updates'}</p>
                          {alert.area && <p className="text-[9px] text-amber-600/60 font-bold mt-1 uppercase tracking-widest">{alert.area}</p>}
                        </div>
                     </div>
                   )
                }) : (
                   <div className="flex items-center gap-3 bg-white/60 rounded-2xl p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500"/>
                      <span className="text-xs font-bold text-[#065F46] tracking-tight">System All Clear</span>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* COL 3: Top Prices */}
        <div id="dashboard-market" className="lg:col-span-4 bg-[#EAF5F0] rounded-[2.5rem] p-7 shadow-md border border-emerald-100 h-[504px] flex flex-col">
           <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="font-bold text-[#0D3320] text-[18px]">{t('market')}</h3>
              <Link to="/market-prices" className="text-xs font-bold text-[#1A5C38] hover:underline px-3 py-1 bg-white/60 rounded-full">{t('checkAll')}</Link>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-2 pb-2 pr-1 scrollbar-hide">
              {prices.map((p, i) => (
                 <div key={p.id || i} className="flex items-center gap-4 py-2.5 hover:bg-white/40 rounded-[1rem] px-3 transition-colors border-b border-[#D6EBE0] last:border-0">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#EAF5F0]">
                      <TrendingUp className="w-4 h-4 text-[#1A5C38]"/>
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-bold text-[13px] text-[#0D3320] truncate">{p.crop_name}</p>
                       <p className="text-[10px] text-[#4CAF7D] mt-0.5 font-bold uppercase tracking-wide">{t('today')}</p>
                    </div>
                    <div className="text-right">
                       <span className="font-bold text-[14px] text-[#0D3320]">₹{Number(p.price).toLocaleString()}</span>
                       <p className={`flex items-center justify-end gap-0.5 text-[10px] font-bold mt-0.5 ${p.change > 0 ? 'text-[#1A5C38]' : 'text-red-600'}`}>
                         {p.change > 0 ? '+' : '-'}{Math.abs(p.change)}%
                       </p>
                    </div>
                 </div>
              ))}
              {prices.length === 0 && <p className="text-center text-sm text-gray-400 mt-10">{t('loading')}</p>}
           </div>
        </div>
      </div>

      {/* ROW 2: Analytics + Radial Health */}
      <div className="grid lg:grid-cols-12 gap-6 mb-6">
        
        {/* Market Growth Array */}
        <div id="dashboard-analytics" className="lg:col-span-8 bg-white rounded-[2.5rem] p-7 shadow-md border border-gray-100 flex flex-col h-[320px]">
           <div className="flex justify-between items-start mb-6">
             <div>
               <h3 className="font-bold text-[#0D3320] text-lg">{t('growthAnalytics')}</h3>
               <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">{t('atmosphericInsights')}</span>
             </div>
           </div>

           <div className="flex-1 w-full relative -ml-4">
               {loading ? <p className="text-center text-sm text-gray-400 mt-10">{t('loading')}</p> : (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                     <defs>
                       <linearGradient id="greenG" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0}/>
                       </linearGradient>
                       <filter id="shadowG" height="130%">
                         <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#4CAF7D" floodOpacity="0.2"/>
                       </filter>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }} dy={10} minTickGap={10}/>
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }} tickFormatter={v => `₹${v}`} />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#1A5C38', color: 'white', fontSize: '12px', fontWeight: 'bold' }} />
                     <Area type="monotone" dataKey="price" stroke="#4CAF7D" strokeWidth={3} fill="url(#greenG)" filter="url(#shadowG)" dot={{ r: 4, fill: "white", stroke: "#4CAF7D", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                   </AreaChart>
                 </ResponsiveContainer>
               )}
           </div>
        </div>

        {/* Health Radial Gauge */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-7 shadow-md border border-gray-100 flex flex-col h-[320px]">
           <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-[#0D3320] text-lg">{t('farmHealth')}</h3>
               <span className="text-xs font-bold text-gray-500 hover:text-[#1A5C38] cursor-pointer">{t('checkAll')}</span>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center relative mt-2">
              <svg viewBox="0 0 200 120" className="w-full max-w-[220px] overflow-visible">
                 {/* Track */}
                 <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f4f6" strokeWidth="14" strokeLinecap="round" />
                 {/* Fill */}
                 <path d="M 20 100 A 80 80 0 0 1 150 35" fill="none" stroke="#4CAF7D" strokeWidth="14" strokeLinecap="round" />
                 <text x="100" y="85" textAnchor="middle" className="font-bold text-5xl" fill="#111827">92</text>
                 <text x="100" y="105" textAnchor="middle" className="font-semibold text-[11px] tracking-widest uppercase" fill="#6B7280">{t('excellent')}</text>
              </svg>
           </div>
           
           <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#EAF5F0] rounded-[1rem] p-3 text-center transition-colors hover:bg-green-100">
                 <p className="text-[10px] text-[#4CAF7D] font-bold uppercase tracking-wide">{t('crops')}</p>
                 <p className="text-xl font-bold text-[#1A5C38]">{summary.crop_recommendations || 0}</p>
              </div>
              <div className="bg-[#FFF9EA] rounded-[1rem] p-3 text-center transition-colors hover:bg-yellow-100">
                 <p className="text-[10px] text-[#D97706] font-bold uppercase tracking-wide">{t('alerts')}</p>
                 <p className="text-xl font-bold text-[#92400E]">{summary.unread_alerts || 0}</p>
              </div>
           </div>
        </div>
      </div>

      {/* ROW 2.5: Interactive Map & Land Details */}
      {farmer && (
        <div className="grid lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-12">
            <FarmMap 
                latitude={farmer.latitude} 
                longitude={farmer.longitude} 
                soilReport={farmer.soil_report ? (typeof farmer.soil_report === 'string' ? JSON.parse(farmer.soil_report) : farmer.soil_report) : null}
                landSize={farmer.land_size}
                farmerName={farmer.name}
                primaryCrop={farmer.primary_crop}
                pincode={farmer.pincode}
                city={farmer.city}
            />
          </div>
        </div>
      )}



    </div>
  )
}