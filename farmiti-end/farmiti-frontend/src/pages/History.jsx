import React, { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { historyAPI } from '../api/services'
import { Sprout, ScanSearch, FileText, CloudSun, Clock, ChevronRight, Filter, Trash2, RefreshCcw, AlertTriangle, CheckCircle, Target, ShieldCheck, Zap } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

const TYPE_CFG = {
  crop_recommendation: { label: 'Crop Recommendation', icon: Sprout, color: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500' },
  disease_detection: { label: 'Disease Detection', icon: ScanSearch, color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  scheme_enrollment: { label: 'Scheme Search', icon: FileText, color: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500' },
  weather_alert: { label: 'Weather Alert', icon: CloudSun, color: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
}

const FILTERS = ['All', 'Crop Recommendations', 'Disease Detections', 'Scheme Searches', 'Weather Alerts']
const TYPE_MAP = { 'All': undefined, 'Crop Recommendations': 'crops', 'Disease Detections': 'disease', 'Scheme Searches': 'schemes', 'Weather Alerts': 'weather' }

export default function History() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [deleting, setDeleting] = useState(null)
  
  const [confirmConfig, setConfirmConfig] = useState({ open: false, title: '', desc: '', onConfirm: () => {} })

  const fetchHistory = async () => {
    setLoading(true)
    const type = TYPE_MAP[filter]
    const [h, s] = await Promise.all([
      historyAPI.getAll(type ? { type } : {}),
      historyAPI.getSummary(),
    ])
    setItems(h.data.history || [])
    setSummary(s.data)
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [filter])

  const handleDelete = async (type, id) => {
    setDeleting(id)
    try { await historyAPI.deleteItem(type, id); setItems(prev => prev.filter(i => !(i.id === id && i.type === type))) }
    catch {}
    finally { setDeleting(null) }
  }

  const handleClearType = async (type) => {
    setConfirmConfig({
      open: true,
      title: t('confirmClearFilter') || 'Clear this list?',
      desc: 'This will remove all items from this category.',
      onConfirm: async () => {
        await historyAPI.clearType(type).catch(() => {})
        fetchHistory()
      }
    })
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: t('cropRecs'), v: summary.crop_recommendations || 0, I: Sprout, c: 'bg-green-50 text-green-600' },
          { l: t('detections'), v: summary.disease_detections || 0, I: ScanSearch, c: 'bg-red-50 text-red-600' },
          { l: t('schemeSearches') || 'Searches', v: summary.scheme_enrollment || 0, I: FileText, c: 'bg-blue-50 text-blue-600' },
          { l: t('unreadAlerts'), v: summary.unread_alerts || 0, I: CloudSun, c: 'bg-amber-50 text-amber-600' }
        ].map(({ l, v, I, c }) => (
          <div key={l} className="stat-card">
            <div className={`w-9 h-9 ${c} rounded-xl flex items-center justify-center mb-3`}><I className="w-4 h-4" /></div>
            <p className="font-display text-3xl font-bold text-forest">{v}</p>
            <p className="text-gray-400 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-500"><Filter className="w-4 h-4" /><span className="text-sm font-medium">{t('status')}:</span></div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f, idx) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}>
              {idx === 0 ? t('checkAll') : t(TYPE_MAP[f])}
            </button>
          ))}
        </div>
        <button onClick={fetchHistory} className="ml-auto p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"><RefreshCcw className="w-4 h-4" /></button>
        
        <div className="flex gap-2">
          {filter !== 'All' && TYPE_MAP[filter] && (
            <button onClick={() => handleClearType(TYPE_MAP[filter])} className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> {t('clearFilter').replace('{filter}', t(TYPE_MAP[filter]))}
            </button>
          )}
          <button 
            onClick={() => {
              setConfirmConfig({
                open: true,
                title: t('clearWholeHistory') || 'Clear everything?',
                desc: 'All your history records will be permanently removed.',
                onConfirm: async () => {
                  await historyAPI.clearAll()
                  fetchHistory()
                }
              })
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 transition-all active:scale-95"
          >
            {t('clearAll')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-green-200 border-t-green-700 rounded-full animate-spin" style={{ borderWidth: '3px' }} /></div>
      ) : items.length === 0 ? (
        <div className="card p-6 rounded-3xl">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-gray-800 text-xl mb-2">{t('noHistory')}</h3>
          <p className="text-gray-500 text-sm">{t('noHistory')}</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 rounded-3xl">
          {items.map((item, i) => {
            const cfg = TYPE_CFG[item.type] || TYPE_CFG.weather_alert
            const Icon = cfg.icon
            const isOpen = expanded === i
            const typeKey = item.type === 'crop_recommendation' ? 'crops' : item.type === 'disease_detection' ? 'disease' : item.type === 'scheme_enrollment' ? 'schemes' : 'weather'
            return (
              <div key={`${item.type}-${item.id}-${i}`} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <button className="flex-1 text-left flex items-center gap-4" onClick={() => setExpanded(isOpen ? null : i)}>
                    <div className={`w-10 h-10 ${cfg.color} rounded-xl flex items-center justify-center shrink-0 border`}><Icon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>{t(typeKey)}</span>
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.type === 'crop_recommendation' ? `${t(item.soil_type) || item.soil_type || '?'} · ${t(item.season) || item.season || '?'}` :
                            item.type === 'disease_detection' ? `${item.disease_name} in ${item.crop_name}` :
                              item.type === 'scheme_enrollment' ? (item.scheme_name || t('schemes')) : (item.title || t('alerts'))}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmConfig({
                        open: true,
                        title: t('deleteConfirm') || 'Delete this record?',
                        desc: 'This specific entry will be removed from your history.',
                        onConfirm: () => handleDelete(typeKey, item.id)
                      })
                    }} 
                    disabled={deleting === item.id} 
                    className="p-2 text-gray-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg group" 
                    title={t('delete')}
                  >
                    {deleting === item.id ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pl-14 animate-fade-in space-y-6 pb-4">
                    {item.type === 'crop_recommendation' && item.recommendations && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { l: t('soilType'), v: t(item.soil_type) || item.soil_type }, 
                            { l: t('ph'), v: item.ph }, 
                            { l: t('season'), v: t(item.season) || item.season }, 
                            { l: t('rainfall'), v: item.rainfall ? `${item.rainfall}mm` : '—' }, 
                            { l: t('area'), v: item.area ? `${item.area} acres` : '—' }, 
                            { l: t('irrigation'), v: t(item.irrigation) || item.irrigation }
                          ].map(({ l, v }) => (
                            <div key={l} className="bg-gray-50 border border-gray-100 rounded-2xl p-3"><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{l}</p><p className="text-sm font-semibold text-gray-800">{v || '—'}</p></div>
                          ))}
                        </div>
                        
                        <div className="space-y-4">
                           <h4 className="text-xs font-black uppercase tracking-tight text-forest flex items-center gap-2">
                             <Sprout className="w-4 h-4" /> {t('detailedRecommendations') || 'Detailed Recommendations'}
                           </h4>
                           {(() => {
                             try {
                               const recs = typeof item.recommendations === 'string' ? JSON.parse(item.recommendations) : item.recommendations;
                               return recs.map((rec, ri) => (
                                 <div key={ri} className="bg-white border border-green-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                   <div className="flex items-center justify-between mb-3">
                                     <div className="flex items-center gap-3">
                                       <span className="w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center text-xs font-black italic">#{rec.rank || ri + 1}</span>
                                       <h5 className="font-bold text-forest text-lg">{rec.name}</h5>
                                     </div>
                                     <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">{rec.score}% Match</span>
                                   </div>
                                   
                                   <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-3">
                                        <div>
                                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{t('whyRecommended') || 'Why Recommended'}</p>
                                          <ul className="space-y-1">
                                            {(rec.reasons || []).map((r, ii) => (
                                              <li key={ii} className="text-xs text-gray-600 flex items-start gap-1.5"><div className="w-1 h-1 bg-green-400 rounded-full mt-1.5 shrink-0" /> {r}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{t('fertilizerSchedule') || 'Fertilizer Schedule'}</p>
                                          <p className="text-xs text-gray-700 leading-relaxed font-medium">{rec.fertilizer_schedule}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                          <p className="text-[10px] font-black uppercase text-amber-600 mb-1">💡 {t('expertTip') || 'Expert Tip'}</p>
                                          <p className="text-xs text-amber-800 leading-relaxed">{rec.tips}</p>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('bestVariety') || 'Best Variety'}</span>
                                           <span className="text-xs font-bold text-gray-800">{rec.best_variety}</span>
                                        </div>
                                      </div>
                                   </div>
                                 </div>
                               ))
                             } catch { return null }
                           })()}
                        </div>
                      </div>
                    )}

                    {item.type === 'disease_detection' && (
                      <div className="space-y-6">
                        <div className="bg-white border border-red-100 rounded-[2rem] overflow-hidden shadow-sm">
                           <div className="flex flex-col md:flex-row items-stretch">
                             {item.image_url && <img src={`http://localhost:8000${item.image_url}`} className="md:w-48 object-cover border-r border-red-50" alt="" />}
                             <div className="p-5 flex-1 space-y-3">
                               <div className="flex items-center justify-between">
                                 <div>
                                   <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">{t('identifiedDisease') || 'Identified Disease'}</h4>
                                   <h3 className="text-xl font-black text-gray-800">{item.disease_name}</h3>
                                 </div>
                                 <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${item.severity === 'High' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : item.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                   {item.severity} Risk
                                 </span>
                               </div>
                               
                               <div className="flex items-center gap-4 py-2 border-y border-gray-50">
                                 <div><p className="text-[10px] text-gray-400 uppercase font-black">{t('crop') || 'Crop'}</p><p className="text-sm font-bold text-gray-700">{item.crop_name}</p></div>
                                 <div><p className="text-[10px] text-gray-400 uppercase font-black">{t('confidence') || 'Confidence'}</p><p className="text-sm font-bold text-gray-700">{item.confidence}%</p></div>
                                 <div><p className="text-[10px] text-gray-400 uppercase font-black">{t('status') || 'Status'}</p><p className="text-sm font-bold text-emerald-600">{item.treatment_status}</p></div>
                               </div>
                             </div>
                           </div>
                        </div>

                        {(() => {
                           try {
                             const det = typeof item.analysis_result === 'string' ? JSON.parse(item.analysis_result) : item.analysis_result;
                             if (!det) return null;
                             return (
                               <div className="grid md:grid-cols-2 gap-5">
                                 <div className="space-y-5">
                                   <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                                     <h5 className="text-[10px] font-black uppercase text-forest mb-3 flex items-center gap-2"><ScanSearch className="w-3.5 h-3.5" /> {t('symptoms') || 'Symptoms'}</h5>
                                     <ul className="space-y-2">
                                       {(det.symptoms || []).map((s, si) => <li key={si} className="text-xs text-gray-600 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-red-300 mt-0.5 shrink-0" /> {s}</li>)}
                                     </ul>
                                   </div>
                                   <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
                                     <h5 className="text-[10px] font-black uppercase text-emerald-700 mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> {t('organicAlternatives') || 'Organic Alternatives'}</h5>
                                     <div className="flex flex-wrap gap-2">
                                       {(det.organic_alternatives || []).map((o, oi) => <span key={oi} className="px-3 py-1 bg-white border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">{o}</span>)}
                                     </div>
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-5">
                                   <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                                      <h5 className="text-[10px] font-black uppercase text-red-600 mb-3 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> {t('recommendedPesticides') || 'Recommended Treatment'}</h5>
                                      <div className="space-y-3">
                                        {(det.pesticides || []).map((p, pi) => (
                                          <div key={pi} className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                              <p className="text-xs font-black text-gray-800">{p.name}</p>
                                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gray-200 text-gray-500 rounded">{p.type}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">{t('dose') || 'Dosage'}: {p.dose} · {p.frequency}</p>
                                          </div>
                                        ))}
                                      </div>
                                   </div>
                                   <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
                                      <h5 className="text-[10px] font-black uppercase text-blue-700 mb-2 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> {t('recoveryTime') || 'Recovery Estimate'}</h5>
                                      <p className="text-xs text-blue-900/70 font-semibold italic">{det.recovery_days ? `${det.recovery_days} days to full recovery` : 'Monitor daily for changes.'}</p>
                                   </div>
                                 </div>
                               </div>
                             )
                           } catch { return null }
                        })()}
                      </div>
                    )}

                    {item.type === 'scheme_enrollment' && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-[2rem] border border-blue-100 shadow-sm">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><FileText className="w-6 h-6 text-blue-500" /></div>
                        <div>
                          <p className="text-sm font-black text-gray-800">{item.scheme_name}</p>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{item.scheme_category} · <span className="text-blue-600">{item.amount}</span></p>
                          <span className="text-[10px] font-black uppercase px-3 py-1 bg-blue-100 text-blue-700 rounded-full mt-2 inline-block border border-blue-200">{t('searchedForScheme') || 'Searched for Scheme'}</span>
                        </div>
                      </div>
                    )}
                    
                    {item.type === 'weather_alert' && (
                      <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden">
                        <CloudSun className="absolute right-4 top-4 w-12 h-12 text-amber-200 opacity-50" />
                        <h4 className="text-sm font-black text-amber-800 mb-2 pr-10">{item.title}</h4>
                        <div className="flex items-center gap-4">
                          {item.area && <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-200 text-amber-700 rounded-lg">{t('area')}: {item.area}</span>}
                          <span className="text-[10px] text-amber-600/70 font-bold italic">{t('cautionAdvised') || 'Action may be required soon.'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <ConfirmModal 
        isOpen={confirmConfig.open}
        onClose={() => setConfirmConfig(p => ({ ...p, open: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.desc}
      />
    </div>
  )
}
