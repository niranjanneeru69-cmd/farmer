import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import Logo from '../components/Logo'
import { publicAPI } from '../api/services'

const STATES = ['Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand']
const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Tomato', 'Onion', 'Potato', 'Groundnut', 'Turmeric', 'Chilli', 'Banana', 'Mango', 'Jowar', 'Bajra', 'Tur Dal', 'Soybean', 'Mustard', 'Other']

export default function Signup() {
  const [step, setStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', password: '', email: '', otp: '', pincode: '', state: '', district: '', city: '', village: '', land_size: '', soil_type: 'Clay Loam', water_source: 'Canal', primary_crop: 'Rice', language_pref: 'en' })
  const { register, sendOTP } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const [offices, setOffices] = useState([])

  const handlePincodeChange = async (pincode) => {
    u('pincode', pincode)
    setPinError('')
    setOffices([])
    if (pincode.length === 6) {
      setPinLoading(true)
      try {
        const res = await publicAPI.lookupPincode(pincode)
        const data = res.data

        if (data.success) {
          setForm(p => ({
            ...p,
            state:    data.state    || p.state,
            district: data.district || p.district,
            city:     data.city     || p.city,
            village:  data.village  || p.village || '',
          }))
          if (data.all_offices) setOffices(data.all_offices)
        } else {
          setPinError('Location not found. Please fill manually.')
        }
      } catch (err) {
        console.error('Pincode lookup error:', err)
        setPinError('Could not detect location. Please fill manually.')
      }
      setPinLoading(false)
    } else {
      setPinError('')
    }
  }

  const handleOfficeSelect = (officeName) => {
    const po = offices.find(o => o.name === officeName)
    if (po) {
      setForm(p => ({
        ...p,
        village: po.name,
        city: po.block || po.division || po.name || p.city,
        district: po.district || p.district
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (step === 1) {
      if (!form.email) {
        setError('Email is required for verification')
        return
      }
      setError(''); setLoading(true)
      try {
        await sendOTP(form.email)
        setStep(2)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to send OTP. Please check your email.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (step === 2) {
      if (form.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP')
        return
      }
      setStep(3)
      return
    }

    setError(''); setLoading(true)
    try { 
      await register(form)
      navigate('/dashboard') 
    }
    catch (err) { 
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
      // If OTP error, go back to OTP step
      if (err.response?.data?.error?.toLowerCase().includes('otp')) setStep(2)
    }
    finally { setLoading(false) }
  }

  const lbl = (text) => (
    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{text}</label>
  )

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Left */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1400&q=90" className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg,rgba(7,30,18,0.97) 0%,rgba(13,51,32,0.85) 50%,rgba(26,92,56,0.5) 100%)' }} />
        {/* Organic shape overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-20" style={{ background: 'linear-gradient(to right, rgba(245, 247, 242, 0), #F5F7F2)' }} />
    <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Link to="/">
            <Logo dark={true} className="scale-110 origin-left mb-6" />
          </Link>
          <div>
            <h2 className="font-display font-bold text-white mb-6 leading-tight" style={{ fontSize: '2.8rem' }}>
              {t('joinFarmers')}
            </h2>
            <div className="space-y-4">
              {[t('feature_weather'), t('feature_market'), t('feature_ai'), t('feature_disease')].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1A5C38' }}>
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm" style={{ color: '#A8D5B8' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[{ v: '2.4M+', l: t('farmers') || 'Farmers' }, { v: '70+', l: t('crops_monitored') || 'Crops' }, { v: '12', l: t('language') || 'Languages' }].map(s => (
              <div key={s.l}>
                <p className="font-display font-bold text-2xl" style={{ color: '#E8A020' }}>{s.v}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6BBF8E' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: '#F5F7F2' }}>
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden block mb-10">
            <Logo dark={false} />
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s < step ? 'text-white' : s === step ? 'text-white ring-4 ring-opacity-30' : 'bg-gray-100 text-gray-400'
                  }`} style={s <= step ? { background: s < step ? '#4CAF7D' : '#1A5C38', ringColor: '#C8E6D4' } : {}}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className="h-1 w-10 rounded-full transition-all" style={{ background: s < step ? '#4CAF7D' : '#E8EDE4' }} />}
              </React.Fragment>
            ))}
            <span className="text-xs text-gray-400 ml-1">{t('step')} {step} {t('of')} 3</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display font-bold text-[#0D3320] mb-1" style={{ fontSize: '2.1rem' }}>
              {step === 1 ? t('registerTitle') : step === 2 ? 'Verify Email' : t('farm') + ' ' + t('details') || 'Farm Details'}
            </h1>
            <p className="text-sm text-gray-500">
              {step === 1 ? t('registerSubtitle') : step === 2 ? `We sent a code to ${form.email}` : t('manageIdentity')}
            </p>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 mb-5 text-sm flex items-start gap-2" style={{ background: '#FFF1F1', border: '1px solid #FCA5A5', color: '#DC2626' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>{lbl(t('name'))}<input value={form.name} onChange={e => u('name', e.target.value)} placeholder={t('name')} className="input" required /></div>
                <div>{lbl(t('phone'))}<input type="tel" value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="+91 00000 00000" className="input" required /></div>
                <div>{lbl(t('email'))}<input type="email" value={form.email} onChange={e => u('email', e.target.value)} placeholder="name@example.com" className="input" required /></div>
                <div>
                  {lbl(t('password'))}
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => u('password', e.target.value)} placeholder="Min 6 characters" className="input pr-11" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: form.password.length >= i * 4 ? '#4CAF7D' : '#E8EDE4' }} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {lbl(t('languagePreference'))}
                  <select value={form.language_pref} onChange={e => u('language_pref', e.target.value)} className="select">
                    {[{ c: 'en', n: 'English' }, { c: 'hi', n: 'हिन्दी' }, { c: 'ta', n: 'தமிழ்' }, { c: 'te', n: 'తెలుగు' }, { c: 'kn', n: 'ಕನ್ನಡ' }, { c: 'ml', n: 'മലയാളം' }, { c: 'mr', n: 'मराठी' }, { c: 'pa', n: 'ਪੰਜਾਬੀ' }, { c: 'bn', n: 'বাংলা' }, { c: 'gu', n: 'ગુજરાતી' }, { c: 'or', n: 'ଓଡ଼ିଆ' }, { c: 'ur', n: 'اردو' }].map(l => <option key={l.c} value={l.c}>{l.n}</option>)}
                  </select>
                </div>
              </>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">Enter the 6-digit code sent to your email address to continue.</p>
                <div className="flex justify-between gap-2">
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={form.otp} 
                    onChange={e => u('otp', e.target.value.replace(/\D/g, ''))} 
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl border-2 border-[#C8E6D4] focus:border-[#1A5C38] outline-none transition-all"
                    placeholder="000000"
                    required
                  />
                </div>
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => sendOTP(form.email)}
                    className="text-sm font-bold text-[#1A5C38] hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl('Pincode')}
                    <div className="relative">
                      <input 
                        type="text" 
                        maxLength={6} 
                        value={form.pincode} 
                        onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))} 
                        placeholder="600001" 
                        className="input pr-10" 
                        required 
                      />
                      {pinLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {pinError && <p className="text-[10px] text-amber-600 font-medium mt-1">{pinError}</p>}
                    {form.pincode.length === 6 && !pinLoading && !pinError && form.state && (
                      <p className="text-[10px] text-green-600 font-medium mt-1">✓ Location detected</p>
                    )}
                  </div>
                  <div>
                    {lbl('City / Block')}
                    <input 
                      value={form.city} 
                      onChange={e => u('city', e.target.value)} 
                      placeholder="City" 
                      className="input" 
                      required 
                    />
                  </div>
                </div>

                {offices.length > 1 && (
                  <div>
                    {lbl('Select Precise Village / Area')}
                    <select 
                      className="select bg-blue-50 border-blue-200"
                      onChange={(e) => handleOfficeSelect(e.target.value)}
                      value={form.village}
                    >
                      <option value="">-- Select Specific Location --</option>
                      {[...new Set(offices.map(o => o.name))].map(name => (
                        <option key={name} value={name}>{name} ({offices.find(o => o.name === name).block || 'Area'})</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-blue-600 mt-1 italic">Multiple locations found for this PIN. Please select yours.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {lbl(t('district'))}
                    <input 
                      value={form.district} 
                      onChange={e => u('district', e.target.value)}
                      placeholder={pinLoading ? 'Detecting...' : 'Enter district'} 
                      className={`input ${form.district && !pinError ? 'bg-green-50 border-green-200' : ''}`}
                      required
                    />
                  </div>
                  <div>
                    {lbl(t('state'))}
                    {form.state && !pinError ? (
                      <input 
                        value={form.state} 
                        onChange={e => u('state', e.target.value)}
                        className="input bg-green-50 border-green-200" 
                        required
                      />
                    ) : (
                      <select value={form.state} onChange={e => u('state', e.target.value)} className="select" required>
                        <option value="">{pinLoading ? 'Detecting...' : 'Select State'}</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>{lbl(t('farmSize'))}<input type="number" value={form.land_size} onChange={e => u('land_size', e.target.value)} placeholder="Acres" className="input" /></div>
                  <div>{lbl(t('primaryCrop'))}<select value={form.primary_crop} onChange={e => u('primary_crop', e.target.value)} className="select">{CROPS.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
                <div>{lbl(t('soilType'))}<select value={form.soil_type} onChange={e => u('soil_type', e.target.value)} className="select">{['Clay Loam', 'Sandy Loam', 'Clay', 'Loam', 'Black Cotton', 'Sandy', 'Silt Loam'].map(s => <option key={s}>{s}</option>)}</select></div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded accent-green-600" />
                  <span className="text-xs text-gray-600">{t('terms')}</span>
                </label>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#1A5C38,#0D3320)' }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{step === 3 ? t('register') : t('continue')} <ArrowRight className="w-4 h-4" /></>}
            </button>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors text-center py-1">
                {t('backToStep').replace('{step}', step - 1)}
              </button>
            )}
          </form>

          <div className="mt-7 p-4 rounded-2xl text-center" style={{ background: '#EDFAF3', border: '1px solid #C8E6D4' }}>
            <p className="text-sm text-gray-600">
              {t('alreadyAccount')}{' '}
              <Link to="/login" className="font-bold hover:underline" style={{ color: '#1A5C38' }}>{t('login')} →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}