import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { farmerAPI } from '../api/services'
import { User, Tractor, Droplets, Edit3, Save, Camera, CheckCircle, Plus, Trash2, 
  Shield, FileText, Globe, X, LayoutDashboard, Database, CreditCard, Sprout, Languages, Bell,
  AlertTriangle, LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../components/ConfirmModal'

const STATES = ['Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Odisha', 'Assam']
const LANGS = [{ c: 'en', n: 'English' }, { c: 'hi', n: 'हिन्दी' }, { c: 'ta', n: 'தமிழ்' }, { c: 'te', n: 'తెలుగు' }, { c: 'kn', n: 'ಕನ್ನಡ' }, { c: 'ml', n: 'മലയാളം' }, { c: 'mr', n: 'मराठी' }, { c: 'pa', n: 'ਪੰਜਾਬੀ' }, { c: 'bn', n: 'বাংলা' }, { c: 'gu', n: 'ગુજરાતી' }, { c: 'or', n: 'ଓଡ଼ିଆ' }, { c: 'ur', n: 'اردو' }]

export default function FarmerProfile() {
  const { farmer: authFarmer, updateFarmer, logout } = useAuth()
  const { t, changeLang, allLangs } = useLang()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [crops, setCrops] = useState([])
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showAddCrop, setShowAddCrop] = useState(false)
  const [newCrop, setNewCrop] = useState({ crop_name: '', acres: '', season: 'Kharif (Jun–Oct)', status: 'Growing', planted_at: '', expected_harvest: '' })
  const [confirmConfig, setConfirmConfig] = useState({ open: false, id: null })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const avatarRef = useRef()

  const showMsg = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    Promise.all([farmerAPI.getProfile(), farmerAPI.getCrops()])
      .then(([p, c]) => { 
        setProfile(p.data.farmer)
        setCrops(c.data.crops || []) 
      })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await farmerAPI.updateProfile(profile)
      setProfile(res.data.farmer)
      updateFarmer(res.data.farmer)
      if (profile.language_pref) changeLang(profile.language_pref)
      setEditing(false); showMsg(t('profileUpdated'))
    } catch { showMsg(t('profileFailed')) }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('avatar', file)
    try {
      const res = await farmerAPI.updateAvatar(fd)
      setProfile(p => ({ ...p, avatar_url: res.data.avatar_url }))
      updateFarmer({ avatar_url: res.data.avatar_url })
      showMsg(t('photoUploaded'))
    } catch { showMsg(t('uploadFailed')) }
  }

  const handleAvatarDelete = async () => {
    try {
      await farmerAPI.deleteAvatar()
      setProfile(p => ({ ...p, avatar_url: null }))
      updateFarmer({ avatar_url: null })
      showMsg(t('photoRemoved'))
    } catch { showMsg(t('deleteFailed')) }
  }

  const u = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const avatarSrc = profile?.avatar_url ? (profile.avatar_url.startsWith('/uploads') ? `http://localhost:8000${profile.avatar_url}` : profile.avatar_url) : null

  const MENU_ITEMS = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'farm', label: t('farm'), icon: Tractor },
    { id: 'financial', label: t('financialInfo'), icon: CreditCard },
    { id: 'crops', label: t('myCrops'), icon: Sprout },
    { id: 'language', label: t('languagePreference'), icon: Languages },
    { id: 'account', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ]

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold text-gray-400">{t('loadingProfile')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 shadow-2xl text-white px-6 py-3 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-[280px_1fr] gap-10">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="space-y-2 mt-2">
           {MENU_ITEMS.map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? (item.danger ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-white text-emerald-700 shadow-sm') : item.danger ? 'text-red-300 hover:text-red-500 hover:bg-red-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </button>
           ))}
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[600px]">
           
           {/* Banner/Header */}
           <div className="relative h-[180px] bg-gradient-to-br from-[#E2E8F0] via-[#F8FAFC] to-[#F1F5F9]">
              <img 
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop" 
                className="w-full h-full object-cover mix-blend-overlay opacity-40" 
              />
              <div className="absolute top-6 right-6">
                 <button className="p-3 bg-white/80 backdrop-blur-md rounded-xl hover:bg-white transition-colors shadow-sm">
                    <Camera className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
           </div>

           <div className="px-8 pb-10">
              {/* Profile Header overlap */}
              <div className="flex flex-col sm:flex-row items-end gap-6 -mt-14 mb-8 relative z-10">
                 <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] bg-white p-1.5 shadow-2xl">
                       <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-emerald-700">
                          {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white">{profile?.name?.[0]}</div>}
                       </div>
                    </div>
                    {/* Floating controls */}
                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                       <button onClick={() => avatarRef.current?.click()} className="w-10 h-10 bg-emerald-600 rounded-2xl shadow-lg flex items-center justify-center text-white hover:bg-emerald-700 transition-colors">
                          <Plus className="w-5 h-5" />
                       </button>
                    </div>
                    <input ref={avatarRef} type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
                 </div>

                 <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.name}</h2>
                          <p className="text-[11px] text-gray-400 font-bold mt-1">{t('manageIdentity')}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setEditing(!editing)} className={`h-10 px-5 rounded-xl text-xs font-black transition-all ${editing ? 'bg-gray-100 text-gray-500' : 'bg-white border-2 border-gray-100 text-gray-900 shadow-sm hover:border-emerald-200'}`}>
                             {editing ? t('discard') : t('edit')}
                          </button>
                          <button onClick={handleSave} disabled={saving} className="h-10 px-6 bg-[#1A5C38] text-white rounded-xl text-xs font-black shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                             {saving ? t('loading') : t('save')}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Form Content */}
              <div className="max-w-4xl">
                 
                 {activeTab === 'profile' && (
                    <div className="space-y-8">
                       <section>
                          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 px-1">{t('name')}</label>
                                <input disabled={!editing} value={profile?.name || ''} onChange={e => u('name', e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-gray-800 transition-all outline-none disabled:bg-gray-50/50 disabled:text-gray-400" />
                             </div>
                             <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-2 px-1">{t('phone')}</label>
                                <input disabled={!editing} value={profile?.phone || ''} onChange={e => u('phone', e.target.value)} className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-gray-800 transition-all outline-none disabled:bg-gray-50/50" />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{t('email')}</label>
                                <input disabled={!editing} value={profile?.email || ''} onChange={e => u('email', e.target.value)} placeholder="e.g. farmer@farmiti.com" className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 transition-all outline-none disabled:bg-gray-50/50" />
                             </div>
                          </div>
                       </section>

                       <section className="pt-8 border-t border-gray-100">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">{t('personalRecords')}</h4>
                          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                             <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{t('gender')}</label>
                                <select disabled={!editing} value={profile?.gender || ''} onChange={e => u('gender', e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 outline-none appearance-none disabled:bg-gray-50/50">
                                   <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{t('dob')}</label>
                                <input disabled={!editing} type="date" value={profile?.dob || ''} onChange={e => u('dob', e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 outline-none disabled:bg-gray-50/50" />
                             </div>
                          </div>
                       </section>

                       {/* Photo section */}
                       <section className="pt-8 border-t border-gray-100">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">{t('yourPhoto')}</h4>
                          <div className="flex items-center gap-10">
                             <div className="w-20 h-20 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center">
                                {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-gray-300" />}
                             </div>
                             <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-900">{t('profIdentity')}</span>
                                <p className="text-[11px] text-gray-400 font-medium">{t('profIdentityDesc')}</p>
                             </div>
                             <div className="flex gap-4 ml-auto">
                                <button onClick={handleAvatarDelete} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors">{t('delete')}</button>
                                <button onClick={() => avatarRef.current?.click()} className="text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors">{t('update')}</button>
                             </div>
                          </div>
                       </section>

                       <section className="pt-8 border-t border-gray-100">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8">{t('yourBio')}</h4>
                          <textarea 
                             disabled={!editing} value={profile?.bio || ''} onChange={e => u('bio', e.target.value)}
                             rows={4} className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-6 text-sm font-bold text-gray-800 outline-none resize-none disabled:bg-gray-50/50"
                             placeholder={t('bioPlaceholder')}
                          />
                       </section>
                    </div>
                 )}

                 {activeTab === 'farm' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                       <div className="grid md:grid-cols-2 gap-8">
                          {[
                            { l: t('farmSize'), k: 'land_size' }, 
                            { l: t('state'), k: 'state', sel: STATES }, 
                            { l: t('district'), k: 'district' }, 
                            { l: t('village'), k: 'village' }
                          ].map(({ l, k, sel }) => (
                             <div key={k}>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{l}</label>
                                {sel ? (
                                   <select disabled={!editing} value={profile?.[k] || ''} onChange={e => u(k, e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 outline-none appearance-none">
                                      {sel.map(s => <option key={s}>{s}</option>)}
                                   </select>
                                ) : (
                                   <input disabled={!editing} value={profile?.[k] || ''} onChange={e => u(k, e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 outline-none" />
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {activeTab === 'language' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {allLangs.map(l => (
                            <button key={l.code} onClick={() => {
                              u('language_pref', l.code)
                              changeLang(l.code)
                              farmerAPI.updateProfile({ ...profile, language_pref: l.code })
                                .then(res => updateFarmer(res.data.farmer))
                                .catch(() => {})
                            }}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${profile?.language_pref === l.code ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                              <span className="text-xl">{l.flag}</span>
                              <span className="text-[13px] font-bold text-gray-800">{l.name}</span>
                              {profile?.language_pref === l.code && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">{t('active')}</span>}
                            </button>
                          ))}
                        </div>
                    </div>
                 )}

                 {activeTab === 'financial' && (
                   <div className="space-y-8">
                     <div className="bg-emerald-50 rounded-3xl p-8 flex items-start gap-4">
                        <Shield className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">{t('encryptedInfo')}</p>
                          <p className="text-xs text-emerald-700/60 font-medium mt-1">{t('encryptedInfoDesc')}</p>
                        </div>
                     </div>
                     <div className="grid md:grid-cols-2 gap-8">
                        {[
                          { l: t('aadhaarId'), k: 'aadhaar' }, 
                          { l: t('bankName'), k: 'bank_name' }, 
                          { l: t('accountNo'), k: 'account_no' }, 
                          { l: t('ifsc'), k: 'ifsc' }
                        ].map(({ l, k }) => (
                            <div key={k}>
                               <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{l}</label>
                               <input disabled={!editing} value={profile?.[k] || ''} onChange={e => u(k, e.target.value)} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 outline-none" />
                            </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'crops' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                       <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                          <div>
                             <h4 className="text-lg font-black text-gray-900">{t('myCrops')}</h4>
                             <p className="text-xs text-gray-400 font-bold mt-1">{t('manageCropsDesc') || 'Track your active and past cultivation cycles.'}</p>
                          </div>
                          <button 
                            onClick={() => setShowAddCrop(true)}
                            className="bg-emerald-600 text-white rounded-2xl px-5 py-3 text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                          >
                             <Plus className="w-4 h-4" /> {t('addCrop')}
                          </button>
                       </div>

                       {showAddCrop && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 rounded-[2rem] p-8 border-2 border-dashed border-emerald-200">
                             <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                   <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">{t('cropName')}</label>
                                   <input value={newCrop.crop_name} onChange={e => setNewCrop({...newCrop, crop_name: e.target.value})} className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold shadow-sm" placeholder="e.g. Basmati Rice" />
                                </div>
                                <div>
                                   <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">{t('acres')}</label>
                                   <input type="number" value={newCrop.acres} onChange={e => setNewCrop({...newCrop, acres: e.target.value})} className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold shadow-sm" placeholder="e.g. 5.5" />
                                </div>
                                <div>
                                   <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">{t('season')}</label>
                                   <select value={newCrop.season} onChange={e => setNewCrop({...newCrop, season: e.target.value})} className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold shadow-sm appearance-none">
                                      <option>Kharif (Jun–Oct)</option>
                                      <option>Rabi (Nov–Apr)</option>
                                      <option>Zaid (Mar–Jun)</option>
                                   </select>
                                </div>
                                <div>
                                   <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">{t('status')}</label>
                                   <select value={newCrop.status} onChange={e => setNewCrop({...newCrop, status: e.target.value})} className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold shadow-sm appearance-none">
                                      <option value="Growing">{t('growing')}</option>
                                      <option value="Harvested">{t('harvested')}</option>
                                   </select>
                                </div>
                             </div>
                             <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setShowAddCrop(false)} className="px-6 py-3 text-xs font-black text-gray-400 hover:text-gray-600">{t('cancel')}</button>
                                <button onClick={async () => {
                                   try {
                                      const res = await farmerAPI.addCrop(newCrop)
                                      setCrops([res.data.crop, ...crops])
                                      setShowAddCrop(false)
                                      setNewCrop({ crop_name: '', acres: '', season: 'Kharif (Jun–Oct)', status: 'Growing', planted_at: '', expected_harvest: '' })
                                      showMsg(t('cropAdded'))
                                   } catch { showMsg(t('error')) }
                                }} className="bg-emerald-600 text-white rounded-2xl px-8 py-3 text-xs font-black shadow-lg shadow-emerald-900/20">{t('add')}</button>
                             </div>
                          </motion.div>
                       )}

                       <div className="grid sm:grid-cols-2 gap-4">
                          {crops.length === 0 ? (
                             <div className="col-span-full py-16 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <Sprout className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-sm font-bold text-gray-300">{t('noCropsYet') || 'No crops registered yet. Start by adding your first field.'}</p>
                             </div>
                          ) : crops.map(c => (
                             <div key={c.id} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${c.status === 'Growing' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                   <Sprout className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                   <div className="flex justify-between items-start">
                                      <h5 className="font-black text-gray-900 leading-tight">{c.crop_name}</h5>
                                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${c.status === 'Growing' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                         {c.status}
                                      </span>
                                   </div>
                                   <div className="flex gap-4 mt-2">
                                      <div className="flex items-center gap-1.5 grayscale opacity-50">
                                         <LayoutDashboard className="w-3.5 h-3.5" />
                                         <span className="text-xs font-bold text-gray-900">{c.acres} {t('acres')}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 grayscale opacity-50">
                                         <Database className="w-3.5 h-3.5" />
                                         <span className="text-xs font-bold text-gray-900">{c.season}</span>
                                      </div>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    setConfirmConfig({ open: true, id: c.id })
                                  }}
                                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
                  {activeTab === 'account' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                       <div className="bg-red-50 rounded-3xl p-8 border-2 border-red-100">
                          <div className="flex items-start gap-4 mb-6">
                             <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-red-900 tracking-tight">Delete Account</h4>
                                <p className="text-[13px] text-red-700/70 font-medium mt-1 leading-relaxed">Once you delete your account, there is no going back. This action is permanent and irreversible.</p>
                             </div>
                          </div>

                          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100 space-y-3 mb-6">
                             <h5 className="text-[11px] font-black text-red-800 uppercase tracking-widest">What will be deleted:</h5>
                             <ul className="space-y-2">
                                {[
                                  'Your profile information (name, phone, email, avatar)',
                                  'All farm details and registered crops',
                                  'Calendar events and task reminders',
                                  'Chat history with AI assistant',
                                  'Disease detection history and results',
                                  'Crop recommendation history',
                                  'Government scheme enrollments',
                                  'Weather alerts and notification history',
                                  'All uploaded images and files'
                                ].map((item, i) => (
                                  <li key={i} className="flex items-start gap-2.5">
                                     <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                     <span className="text-[12px] text-red-900/80 font-medium">{item}</span>
                                  </li>
                                ))}
                             </ul>
                          </div>

                          <button 
                            onClick={() => setDeleteModalOpen(true)}
                            className="flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl text-sm font-black hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 hover:shadow-xl hover:shadow-red-900/30"
                          >
                             <Trash2 className="w-5 h-5" />
                             Delete My Account Permanently
                          </button>
                       </div>
                    </div>
                  )}
              </div>
           </div>

        </main>
      </div>
      <ConfirmModal
        isOpen={confirmConfig.open}
        onClose={() => setConfirmConfig({ open: false, id: null })}
        onConfirm={async () => {
          if (!confirmConfig.id) return
          await farmerAPI.deleteCrop(confirmConfig.id).catch(() => {})
          setCrops(crops.filter(x => x.id !== confirmConfig.id))
          showMsg(t('deleted'))
        }}
        title={t('deleteConfirm') || 'Delete this crop?'}
        description="This field record and its data will be permanently removed."
      />

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
         {deleteModalOpen && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText('') }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-[440px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-red-100"
              >
                 <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                       <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-red-900">Are you absolutely sure?</h3>
                       <p className="text-[11px] text-red-600/60 font-bold uppercase tracking-widest mt-0.5">This cannot be undone</p>
                    </div>
                 </div>

                 <div className="p-6 space-y-5">
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                       <p className="text-[13px] text-amber-900 font-semibold leading-relaxed">
                          ⚠️ This will <strong>permanently delete</strong> your Farmiti account and <strong>all associated data</strong> including your crops, calendar events, chat history, disease records, and more. You will <strong>not be able to log in</strong> with these credentials again. To use Farmiti again, you would need to create a brand new account.
                       </p>
                    </div>

                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Type "DELETE" to confirm</label>
                       <input 
                         value={deleteConfirmText}
                         onChange={e => setDeleteConfirmText(e.target.value)}
                         placeholder="DELETE"
                         className="w-full bg-gray-50 border-2 border-gray-200 focus:border-red-400 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 transition-all outline-none"
                         autoFocus
                       />
                    </div>

                    <div className="flex gap-3 pt-2">
                       <button 
                         onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText('') }}
                         className="flex-1 px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         disabled={deleteConfirmText !== 'DELETE' || deleting}
                         onClick={async () => {
                           setDeleting(true)
                           try {
                             await farmerAPI.deleteAccount()
                             // Clear all local storage and redirect to landing
                             localStorage.clear()
                             logout()
                             navigate('/')
                           } catch (err) {
                             showMsg('Failed to delete account. Please try again.')
                             setDeleting(false)
                           }
                         }}
                         className="flex-1 px-5 py-3.5 bg-red-600 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                       >
                         {deleting ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         ) : (
                           <><Trash2 className="w-4 h-4" /> Delete Forever</>
                         )}
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  )
}
