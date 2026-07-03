import React, { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { schemesAPI } from '../api/services'
import { CheckCircle, Clock, ExternalLink, Calendar, Bell, Download, X, FileText, Trash2 } from 'lucide-react'

const CATS = ['All', 'Income Support', 'Insurance', 'Credit', 'Development', 'Marketing', 'Advisory', 'Technology', 'Irrigation', 'Pension', 'Collective', 'Training', 'Horticulture', 'Sustainability', 'Organic']
// Removed STATUS map since we use it only as a search logger now

export default function GovernmentSchemes() {
  const { t } = useLang()
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [toast, setToast] = useState('')
  const [enrollments, setEnrollments] = useState([])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    const [s, e] = await Promise.all([
      schemesAPI.getAll({ category: category === 'All' ? undefined : category }),
      schemesAPI.getEnrollments(),
    ])
    setSchemes(s.data.schemes || [])
    setEnrollments(e.data.enrollments || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [category])

  const handleEnroll = async (id, url) => {
    // Open URL immediately to avoid browser pop-up blockers
    if (url) window.open(url, '_blank')
    
    setEnrolling(true)
    try { 
      await schemesAPI.enroll(id) 
    }
    catch (err) { 
      // If 409 (already enrolled), we just ignore it silenty
      if (err.response?.status !== 409) {
        console.warn('Enrollment log error:', err)
      }
    }
    finally { setEnrolling(false) }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-forest text-white text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />{toast}
          <button onClick={() => setToast('')}><X className="w-4 h-4 text-green-300" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: t('totalSchemes'), v: schemes.length, c: 'border-green-200 bg-green-50' },
          { l: t('expiringSoon'), v: '3', c: 'border-red-200 bg-red-50' }
        ].map(({ l, v, c }) => (
          <div key={l} className={`rounded-2xl border p-4 ${c}`}><p className="text-2xl font-bold font-display text-forest">{v}</p><p className="text-sm text-gray-600 mt-0.5">{l}</p></div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATS.map(c => <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === c ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>{c === 'All' ? t('checkAll') : c}</button>)}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-green-200 border-t-green-700 rounded-full animate-spin" style={{ borderWidth: '3px' }} /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map(scheme => {
            return (
              <div key={scheme.id} onClick={() => setSelected(scheme)} className="card-hover overflow-hidden rounded-3xl">
                <div className="relative h-36">
                  <img src={scheme.img_url || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=70'} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60" />
                  <div className="absolute bottom-2 left-3"><span className="text-[11px] bg-black/40 text-white px-2 py-0.5 rounded-full">{scheme.category}</span></div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-display font-bold text-forest text-base leading-tight">{scheme.name}</h3>
                    <span className="text-sm font-bold text-amber-600 whitespace-nowrap shrink-0">{scheme.amount}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{scheme.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{scheme.deadline}</div>
                    <span className="text-xs font-semibold text-amber-600">{t('viewDetails')} →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative h-48">
              <img src={selected.img_url || ''} className="w-full h-full object-cover rounded-t-2xl" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 to-transparent rounded-t-2xl" />
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60"><X className="w-4 h-4" /></button>
              <div className="absolute bottom-4 left-5"><h3 className="font-display font-bold text-white text-xl">{selected.name}</h3><p className="text-gray-300 text-sm">{selected.full_name}</p></div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ l: t('benefit'), v: selected.amount }, { l: t('category'), v: selected.category }, { l: t('deadline'), v: selected.deadline }].map(({ l, v }) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">{v}</p></div>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
              {selected.benefits && <div className="bg-green-50 rounded-xl p-3 border border-green-100"><p className="text-xs font-semibold text-green-700">{t('benefit')}: <span className="font-normal">{selected.benefits}</span></p></div>}
              <p className="text-xs text-gray-500 italic">{selected.ministry}</p>
              <div>
                <h4 className="font-semibold text-forest text-sm mb-2">{t('requiredDocs')}</h4>
                {(Array.isArray(selected.requirements) ? selected.requirements : JSON.parse(selected.requirements || '[]')).map(r => (
                  <div key={r} className="flex items-center gap-2 mb-1.5"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /><span className="text-sm text-gray-600">{r}</span></div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => handleEnroll(selected.id, selected.website_url)} disabled={enrolling} className="flex-1 btn-primary justify-center py-3">
                  {enrolling ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ExternalLink className="w-4 h-4" />{t('officialWebsite')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
