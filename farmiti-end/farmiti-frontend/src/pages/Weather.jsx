import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { weatherAPI } from '../api/services'
import { CloudSun, Cloud, Wind, Droplets, Eye, Gauge, MoreHorizontal, RefreshCw, AlertTriangle, Bell, CheckCircle, MapPin, Clock, Battery, BatteryCharging, ChevronDown, Trash2, X } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ALERT_BG = { danger: 'bg-red-50 border-red-200', warning: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200' }
const SEV_STYLE = { High: 'bg-red-50 border-red-300 text-red-700', Medium: 'bg-amber-50 border-amber-300 text-amber-700', Low: 'bg-blue-50 border-blue-300 text-blue-700' }

const SliderRow = ({ label, valueStr, percent, showControls }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between items-center mb-3">
      <span className="text-gray-700 font-medium text-[15px] tracking-tight">{label}</span>
      <div className="flex items-center gap-2 text-gray-500">
         {showControls && (
           <>
             <button className="w-7 h-7 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50"><RefreshCw className="w-3 h-3"/></button>
             <button className="w-7 h-7 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50"><MoreHorizontal className="w-4 h-4"/></button>
           </>
         )}
         <span className="w-14 text-right font-semibold text-gray-900 tracking-tight text-sm">{valueStr}</span>
      </div>
    </div>
    <div className="w-full relative h-2.5">
       {/* Filled bar */}
       <div className="absolute top-0 h-1.5 rounded-l-full bg-gradient-to-r from-[#EAF5F0] to-[#4CAF7D]" style={{ width: `${percent}%`, zIndex: 10 }}>
          <div className="absolute right-0 -top-1 w-1 h-3.5 bg-[#1A5C38] rounded-full shadow-sm"/>
       </div>
       {/* Track background faint ticks */}
       <div className="absolute top-3 w-full flex justify-between px-0.5">
         {Array.from({length: 60}).map((_, i) => <div key={i} className={`w-0.5 h-1.5 rounded-full ${i % 5 === 0 ? 'bg-gray-300' : 'bg-gray-200'}`}/>)}
       </div>
    </div>
  </div>
)

export default function Weather() {
  const { farmer } = useAuth()
  const { t } = useLang()
  const { addToast } = useToast()
  const [weather, setWeather] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletedIds, setDeletedIds] = useState(new Set())

  const fetchWeather = () => {
    Promise.all([
      weatherAPI.getCurrent({ city: `${farmer?.district || farmer?.state || 'Chennai'},IN` }),
      weatherAPI.getAlerts(),
    ]).then(([w, a]) => {
      setWeather(w?.data || null)
      setSubscribed(w?.data?.weather_sms || false)
      const allAlerts = [...(w?.data?.alerts || []), ...(a?.data?.alerts || [])]
      setAlerts(allAlerts.slice(0, 5))
    }).catch(err => {
      console.error('Weather fetch error:', err)
      setWeather(null)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchWeather(); const i = setInterval(fetchWeather, 600000); return () => clearInterval(i) }, [farmer])

  if (loading) return <div className="flex flex-col items-center justify-center h-[60vh]"><div className="w-12 h-12 border-4 border-[#C8E6D4] border-t-[#4CAF7D] rounded-full animate-spin mb-4" /><p className="text-gray-500 font-medium tracking-tight">{t('loading')}</p></div>

  // Generate visualizer bars natively
  const VIZ_BARS = [20,35,25,45,30,60,40,75,50,90,65,50,100,60,85,45,70,30,55,20,40,25]

  return (
    // Unique Font Applied Explicitly to this Component via Inline Style for complete isolation requested
    <div className="space-y-4 max-w-5xl mx-auto pb-10 pt-2 px-2" style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }}>
      
      {/* Header Info */}
      <div className="flex items-center justify-between px-2 mb-4">
         <div>
           <h1 className="font-semibold text-2xl text-gray-900 tracking-tight">{t('weatherHub')}</h1>
           <p className="text-gray-500 text-sm font-medium flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5"/> {weather?.location || `${farmer?.district || 'Your City'}, India`}</p>
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Metric Cards */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Humidity Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E8EDE4] flex flex-col justify-between min-h-[135px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-700 font-bold text-sm tracking-tight">{t('humidity')} (24h)</span>
              <button className="w-7 h-7 rounded-full border border-[#E8EDE4] flex items-center justify-center text-gray-400 hover:bg-gray-50"><MoreHorizontal className="w-4 h-4"/></button>
            </div>
            <div className="w-9 h-9 bg-[#EAF5F0] rounded-full flex items-center justify-center text-[#1A5C38] mb-2">
               <Droplets className="w-4 h-4" strokeWidth={2.5}/>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-4xl font-bold text-[#0D3320] tracking-tight leading-none">{weather?.humidity || 72}</span>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('relHumidity')}</span>
            </div>
          </div>

          {/* Wind Card */}
          <div className="bg-[#1A5C38] rounded-3xl p-5 shadow-sm border border-[#0D3320] flex flex-col justify-between min-h-[135px]">
             <div className="flex justify-between items-start mb-3">
              <span className="text-emerald-100 font-bold text-sm tracking-tight">{t('windSpeed')}</span>
              <button className="w-7 h-7 rounded-full border border-emerald-700/50 flex items-center justify-center text-emerald-200 hover:bg-white/10"><MoreHorizontal className="w-4 h-4"/></button>
            </div>
            <div className="w-9 h-9 bg-[#4CAF7D] rounded-full flex items-center justify-center text-white mb-2 shadow-inner">
               <Wind className="w-4 h-4" strokeWidth={2.5}/>
            </div>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className="text-4xl font-bold text-white tracking-tight leading-none">{weather?.wind_speed || 12}</span>
              <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider">km/h</span>
            </div>
          </div>

          {/* Visibility Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E8EDE4] flex flex-col justify-between min-h-[135px]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-700 font-bold text-sm tracking-tight">{t('visibility')}</span>
              <button className="w-7 h-7 rounded-full border border-[#E8EDE4] flex items-center justify-center text-gray-400 hover:bg-gray-50"><MoreHorizontal className="w-4 h-4"/></button>
            </div>
            <div className="w-9 h-9 bg-[#EDFAF3] rounded-full flex items-center justify-center text-[#1A5C38] mb-2">
               <Eye className="w-4 h-4" strokeWidth={2.5}/>
            </div>
            <div className="flex flex-col mt-auto gap-0.5">
              <span className="text-3xl font-bold text-[#0D3320] tracking-tight leading-none">{weather?.visibility > 5 ? t('excellent') : t('poor')}</span>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{weather?.visibility || 8} {t('kmRange')}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sliders, Vis, Charts */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Top Sliders Block */}
          <div id="weather-metrics" className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-[#E8EDE4]">
             <SliderRow label={t('temp')} valueStr={`${weather?.temp || 33}°C`} percent={minMaxClamp(weather?.temp, 10, 50)} showControls={true} />
             <SliderRow label={t('pressure')} valueStr={`${weather?.pressure || 1013} hPa`} percent={minMaxClamp(weather?.pressure, 980, 1030)} />
             <SliderRow label={t('clouds')} valueStr={`${weather?.clouds || 45}%`} percent={weather?.clouds || 45} />
          </div>

          {/* Vibrant Green Audio Visualizer Block */}
          <div className="rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden h-[200px]" style={{ background: 'linear-gradient(135deg, #4CAF7D 0%, #1A5C38 100%)' }}>
             <div className="flex justify-between items-start mb-4 w-full relative z-10 text-white">
               <span className="font-bold text-lg tracking-tight">{t('precipRange')}</span>
               <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"><RefreshCw className="w-3.5 h-3.5 text-emerald-100"/></button>
                 <button className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"><MoreHorizontal className="w-4 h-4 text-emerald-100"/></button>
               </div>
             </div>

             <div className="relative z-10 w-full flex items-center justify-between text-emerald-100">
                <div className="flex flex-col justify-between h-24 font-bold">
                   <span className="text-[14px]">15 <span className="text-[10px] uppercase font-medium">mm/h</span></span>
                   <span className="text-[14px]">0</span>
                </div>

                <div className="flex-1 flex items-end justify-center gap-1 md:gap-1.5 h-24 px-3">
                  {VIZ_BARS.map((h, i) => {
                     const isDark = i % 3 === 0;
                     const isWhite = i % 3 === 1;
                     return (
                       <div key={i} className="flex flex-col items-center w-full max-w-[4px]">
                          {isDark && <div className="w-full bg-[#0D3320] rounded-full mb-0.5" style={{ height: `${h * 0.25}px`, opacity: 0.8 }}/>}
                          <div className={`w-full rounded-full ${isWhite ? 'bg-white shadow-sm' : isDark ? 'bg-emerald-200' : 'bg-[#4CAF7D]'}`} style={{ height: `${h * 0.65}px` }} />
                          {!isDark && !isWhite && <div className="w-full bg-[#0D3320] rounded-full mt-0.5" style={{ height: `${h * 0.3}px`, opacity: 0.6 }}/>}
                       </div>
                     )
                  })}
                </div>

                <div className="flex flex-col justify-between h-24 font-bold text-right">
                   <span className="text-[14px]">450 <span className="text-[10px] uppercase font-medium">{t('kw')}</span></span>
                   <span className="text-[14px]">0</span>
                </div>
             </div>
             <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150 -translate-y-1/2 opacity-30 z-0"></div>
          </div>

          {/* Bottom Chart */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-[#E8EDE4] flex flex-col h-[240px]">
             <div className="flex justify-between items-start mb-4">
               <span className="text-[#0D3320] font-bold text-lg tracking-tight">{t('todayTrend')}</span>
               <div className="flex gap-2 text-gray-500">
                 <button className="w-7 h-7 rounded-full border border-[#E8EDE4] flex items-center justify-center hover:bg-gray-50"><RefreshCw className="w-3.5 h-3.5"/></button>
                 <button className="w-7 h-7 rounded-full border border-[#E8EDE4] flex items-center justify-center hover:bg-gray-50"><MoreHorizontal className="w-4 h-4"/></button>
               </div>
             </div>

             <div className="flex-1 w-full flex items-center justify-center relative -ml-4">
               {!weather?.hourly ? (
                 <p className="text-xs text-gray-400">{t('loadingData')}</p>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weather.hourly} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF7D" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4CAF7D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDE4" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E8EDE4', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                    <Area type="natural" dataKey="temp" stroke="#4CAF7D" fill="url(#curveGrad)" strokeWidth={3} dot={false} />
                  </AreaChart>
                 </ResponsiveContainer>
               )}
             </div>
          </div>

        </div>
      </div>

      {/* Alerts & Notifications Block */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-[#E8EDE4] mt-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-[#E8EDE4] pb-4">
          <div className="flex justify-between items-start w-full md:w-auto">
            <div>
              <h3 className="font-bold text-[#0D3320] text-lg tracking-tight">{t('criticalAlerts')}</h3>
              <p className="text-gray-500 text-xs mt-1 font-medium">{t('stayInformed')}</p>
            </div>
            {(alerts || []).filter(a => a && !deletedIds.has(a.id)).length > 0 && (
              <button 
                onClick={() => setDeletedIds(new Set([...deletedIds, ...(alerts || []).map(a => a?.id).filter(Boolean)]))}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3"/> {t('clearAll') || 'Clear All'}
              </button>
            )}
          </div>
          
          {/* Emergency SMS Toggle */}
          <label 
            id="weather-sms-toggle" 
            className="flex items-center justify-between gap-4 cursor-pointer mt-4 md:mt-0 px-5 py-4 rounded-[2rem] bg-[#F5F7F2] border border-[#1A5C38]/10 hover:bg-[#EAF5F0] transition-all hover:shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${subscribed ? 'bg-[#E8A020] text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Bell className={`w-5 h-5 ${subscribed ? 'animate-tada' : ''}`}/> 
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#0D3320] leading-tight">
                  {t('subscribeAlerts') || 'SMS Weather Alerts'}
                </span>
                <span className="text-[11px] font-medium text-gray-500">
                  {subscribed ? 'Notifications active' : 'Click to enable live alerts'}
                </span>
              </div>
            </div>

            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={subscribed} 
                onChange={(e) => {
                  const val = e.target.checked
                  setSubscribed(val)
                  weatherAPI.subscribe({ enabled: val })
                    .then(() => {
                      addToast({
                        title: val ? (t('subscribed') || 'Subscribed') : (t('alerts') || 'Alerts Updated'),
                        message: val ? (t('rainNext') || 'You will receive weather alerts via SMS.') : 'Emergency SMS alerts have been turned off.',
                        type: val ? 'success' : 'info',
                        isLive: val
                      })
                    })
                    .catch(err => {
                      setSubscribed(!val)
                      addToast({ title: t('error') || 'Error', message: 'Failed to update alert preference.', type: 'error' })
                      console.error('SMS Subscribe error:', err)
                    })
                }}
              />
              <div className="w-12 h-6.5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#1A5C38]"></div>
            </div>
          </label>
        </div>

        {(alerts || []).filter(a => a && !deletedIds.has(a.id)).length > 0 ? (
          <div id="weather-forecast" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(alerts || []).filter(a => a && !deletedIds.has(a.id)).map((a, i) => (
              <div key={a.id || i} className={`p-4 rounded-2xl border ${ALERT_BG[a.type] || 'bg-gray-50 border-gray-100'} relative group`}>
                  <button 
                    onClick={() => setDeletedIds(new Set([...deletedIds, a.id]))}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 text-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-2 mb-2 pr-6">
                    <AlertTriangle className={`w-4 h-4 ${a.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
                    <h4 className="font-semibold text-sm text-gray-900 tracking-tight">{a.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{a.description}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block ${SEV_STYLE[a.severity] || 'bg-gray-100 border-gray-200 text-gray-600'}`}>{a.severity} Priority</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            {t('noAlerts')}
          </div>
        )}
      </div>


    </div>
  )
}

// Utility to calculate percentage for sliders based on anticipated min/max ranges
function minMaxClamp(val, min, max) {
  if (!val) return 0;
  const p = ((val - min) / (max - min)) * 100;
  return Math.min(Math.max(p, 0), 100);
}
