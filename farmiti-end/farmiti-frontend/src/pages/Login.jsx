import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { Eye, EyeOff, Phone, Lock, ArrowRight, Check } from 'lucide-react'
import Logo from '../components/Logo'

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { 
      await login(form.phone, form.password); 
      // Clear TourGuide seen flags on fresh login so new users experience guides fully
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tg_seen_')) localStorage.removeItem(key)
      })
      navigate('/dashboard') 
    }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Please check your credentials.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=90" className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg, rgba(7,30,18,0.97) 0%, rgba(13,51,32,0.85) 45%, rgba(26,92,56,0.5) 100%)' }} />

        {/* Organic shape overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-20" style={{ background: 'linear-gradient(to right, rgba(245, 247, 242, 0), #F5F7F2)' }} />

        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Link to="/">
            <Logo dark={true} className="scale-110 origin-left mb-6" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6" style={{ background: 'rgba(107,191,142,0.15)', border: '1px solid rgba(107,191,142,0.2)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6BBF8E' }} />
              <span className="text-sm font-medium" style={{ color: '#A8D5B8' }}>{t('aiAssistant')}</span>
            </div>
            <h2 className="font-display font-bold text-white mb-5 leading-tight" style={{ fontSize: '2.8rem' }}>
              {t('loginTitle').split(' ').join('\n')}
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-sm" style={{ color: '#8FCFAb' }}>
              {t('loginSubtitle')}
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[{ v: '2.4M+', l: t('farmers') || 'Farmers' }, { v: '70+', l: t('crops_monitored') || 'Crops' }, { v: '15', l: t('schemes') }].map(s => (
                <div key={s.l}>
                  <p className="font-display font-bold text-2xl" style={{ color: '#E8A020' }}>{s.v}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6BBF8E' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[t('getStarted'), t('feature_ai'), t('language')].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#1A5C38' }}>
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm" style={{ color: '#A8D5B8' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: '#F5F7F2' }}>
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden block mb-10">
            <Logo dark={false} />
          </Link>

          <div className="mb-8">
            <h1 className="font-display font-bold text-[#0D3320] mb-2" style={{ fontSize: '2.2rem' }}>{t('login')}</h1>
            <p className="text-gray-500 text-sm">{t('loginSubtitle')}</p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 mb-6 text-sm flex items-start gap-2" style={{ background: '#FFF1F1', border: '1px solid #FCA5A5', color: '#DC2626' }}>
              <span className="text-base">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{t('phone')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 00000 00000" className="input pl-11" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t('password')} className="input pl-11 pr-11" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#1A5C38,#0D3320)' }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{t('login')} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-2xl text-center" style={{ background: '#EDFAF3', border: '1px solid #C8E6D4' }}>
            <p className="text-sm text-gray-600">
              {t('noAccount')}{' '}
              <Link to="/signup" className="font-bold hover:underline" style={{ color: '#1A5C38' }}>{t('register')} →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}