import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import {
  LayoutDashboard, CloudSun, TrendingUp, Sprout, UserCircle,
  MessageSquareText, ScanSearch, FileText, Users, LogOut,
  ChevronLeft, ChevronRight, History
} from 'lucide-react'
import Logo from './Logo'

export default function Sidebar({ open, setOpen }) {
  const { farmer, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const NAV = [
    { label: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('weather'), path: '/weather', icon: CloudSun },
    { label: t('market'), path: '/market-prices', icon: TrendingUp },
    { label: t('crops'), path: '/crop-recommendation', icon: Sprout },
    { label: t('disease'), path: '/disease-detection', icon: ScanSearch },
    { label: t('aiChat'), path: '/ai-chat', icon: MessageSquareText },
    { label: t('schemes'), path: '/schemes', icon: FileText },
    { label: t('history'), path: '/history', icon: History },
    { label: t('community'), path: '/community', icon: Users },
    { label: t('profile'), path: '/profile', icon: UserCircle },
  ]

  const avatarSrc = farmer?.avatar_url
    ? (farmer.avatar_url.startsWith('/uploads') ? `http://localhost:8000${farmer.avatar_url}` : farmer.avatar_url)
    : null

  return (
    <aside
      className={`relative flex flex-col transition-all duration-300 shrink-0 overflow-hidden ${open ? 'w-[230px]' : 'w-[70px]'}`}
      style={{
        background: 'linear-gradient(180deg, #071e12 0%, #0D3320 50%, #0f3d27 100%)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.30)'
      }}
    >
      <div className="absolute top-0 right-0 w-52 h-52 rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4CAF7D 0%, transparent 70%)', transform: 'translate(35%,-35%)' }} />

      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full flex items-center justify-center z-20 shadow-lg transition-all hover:scale-110"
        style={{ background: '#E8A020' }}
      >
        {open ? <ChevronLeft className="w-3.5 h-3.5 text-white" /> : <ChevronRight className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className={`flex items-center gap-3 border-b border-white/8 min-h-[68px] ${open ? 'px-5' : 'px-0 justify-center'}`}>
        {open ? (
          <Logo dark={true} className="scale-90" />
        ) : (
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0">
            <div className="relative w-6 h-6 flex flex-wrap gap-0.5 justify-center items-center">
              <div className="w-[10px] h-[10px] bg-[#FACC15] rounded-tl-full rounded-br-full" />
              <div className="w-[10px] h-[10px] bg-[#FACC15] rounded-tr-full rounded-bl-full" />
              <div className="w-[10px] h-[10px] bg-[#FACC15] rounded-tr-full rounded-bl-full" />
              <div className="w-[10px] h-[10px] bg-[#FACC15] rounded-tl-full rounded-br-full" />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
        {open && (
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(107,191,142,0.5)' }}>
            Navigation
          </p>
        )}
        {NAV.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl transition-all duration-200 group relative ${open ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'} ${isActive ? 'text-white' : 'text-green-300/60 hover:text-white hover:bg-white/8'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(76,175,125,0.22) 0%, rgba(26,92,56,0.35) 100%)',
              borderLeft: open ? '3px solid #6BBF8E' : 'none',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[#6BBF8E]' : ''}`} />
                {open && <span className="text-[13px] font-medium truncate">{label}</span>}
                {!open && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/8">
        {open ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/8 cursor-pointer transition-all group" onClick={() => navigate('/profile')}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-9 h-9 rounded-2xl object-cover shrink-0" style={{ outline: '2px solid rgba(232,160,32,0.5)' }} />
            ) : (
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#2E7D52,#1A5C38)' }}>
                <span className="text-white text-sm font-bold">{farmer?.name?.[0]?.toUpperCase() || 'F'}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{farmer?.name || 'Farmer'}</p>
              <p className="text-[11px] truncate" style={{ color: '#6BBF8E' }}>{farmer?.district || farmer?.state || 'India'}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); logout(); navigate('/') }} className="text-green-400/50 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-9 h-9 rounded-2xl object-cover cursor-pointer" style={{ outline: '2px solid rgba(232,160,32,0.5)' }} onClick={() => navigate('/profile')} />
            ) : (
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer" style={{ background: 'linear-gradient(135deg,#2E7D52,#1A5C38)' }} onClick={() => navigate('/profile')}>
                <span className="text-white text-sm font-bold">{farmer?.name?.[0]?.toUpperCase() || 'F'}</span>
              </div>
            )}
            <button onClick={() => { logout(); navigate('/') }} className="text-green-400/50 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}