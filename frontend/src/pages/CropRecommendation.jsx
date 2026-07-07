import React, { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { cropsAPI } from '../api/services'
import { Sprout, Info, CheckCircle } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const SOILS=['Clay Loam','Sandy Loam','Clay','Loam','Black Cotton','Sandy','Silt Loam']
const SEASONS=['Kharif (Jun–Oct)','Rabi (Oct–Feb)','Summer (Feb–Jun)']
const IRRIGATION=['Canal','Borewell','Canal + Borewell','Rain-fed','Drip','Tank','River']
const IMG_FALLBACK='https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'

export default function CropRecommendation() {
  const { t } = useLang()
  const [form,setForm]=useState({soil_type:'Clay Loam',area:'',rainfall:'',ph:'6.5',season:'Kharif (Jun–Oct)',irrigation:'Canal'})
  const [results,setResults]=useState(null)
  const [selected,setSelected]=useState(0)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [aiPowered,setAiPowered]=useState(true)
  const u=(k,v)=>setForm(p=>({...p,[k]:v}))

  const handleSubmit=async(e)=>{
    e.preventDefault();setError('');setLoading(true)
    try {
      const res=await cropsAPI.recommend(form)
      setResults(res.data.recommendations)
      setAiPowered(res.data.ai_powered !== false)
      setSelected(0)
    } catch(err){
      const errMsg = err.response?.data?.error || err.message
      const isQuotaError = errMsg?.includes('quota') || errMsg?.includes('429')
      const isOverloadError = errMsg?.includes('503') || errMsg?.includes('overload')
      if (isQuotaError) {
        setError(t('quotaError'))
      } else if (isOverloadError) {
        setError(t('overloadError'))
      } else {
        setError(errMsg || t('error'))
      }
      setAiPowered(false)
    } finally{setLoading(false)}
  }

  const radarData=results?.[selected]?[
    {subject: t('soil'), value:results[selected].score||80},
    {subject: t('climate'), value:Math.min(100,(results[selected].score||80)+5)},
    {subject: t('market'), value:results[selected].market_demand==='High'?90:results[selected].market_demand==='Medium'?70:50},
    {subject: t('water'), value:results[selected].water==='Low'?95:results[selected].water==='Medium'?75:55},
    {subject: t('profit'), value:Math.min(100,Math.round((results[selected].profit_per_acre||30000)/700))},
    {subject: t('effort'), value:72},
  ]:[]

  return(
    <div className="space-y-5 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><Sprout className="w-5 h-5"/></div>
          <div>
            <h3 className="font-display font-bold text-forest text-lg">{t('recommendCrops')}</h3>
            <p className="text-gray-400 text-xs">{t('poweredByGemini')}</p>
          </div>
        </div>
        {!aiPowered && (
          <div className="mb-4 rounded-3xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('aiFallback')}
          </div>
        )}
        {error&&<div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <form id="crops-form" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('soilType')}</label><select value={form.soil_type} onChange={e=>u('soil_type',e.target.value)} className="select">{SOILS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('farmSize')}</label><input type="number" value={form.area} onChange={e=>u('area',e.target.value)} placeholder="e.g. 5" className="input"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('rainfall')}</label><input type="number" value={form.rainfall} onChange={e=>u('rainfall',e.target.value)} placeholder="e.g. 800" className="input"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('soilPh')}</label><input type="number" step="0.1" min="4" max="9" value={form.ph} onChange={e=>u('ph',e.target.value)} placeholder="e.g. 6.5" className="input"/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('season')}</label><select value={form.season} onChange={e=>u('season',e.target.value)} className="select">{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t('waterSource')}</label><select value={form.irrigation} onChange={e=>u('irrigation',e.target.value)} className="select">{IRRIGATION.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <button id="crops-btn" type="submit" disabled={loading} className="btn-primary">
            {loading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>{t('analyzing')}</>:<><Sprout className="w-4 h-4"/>{t('getAIRecommendations')}</>}
          </button>
        </form>
      </div>

      {results&&results.length>0&&(
        <div id="crops-results" className="grid lg:grid-cols-3 gap-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('recommendations')}</p>
            {results.map((crop,i)=>(
              <button key={i} onClick={()=>setSelected(i)} className={`w-full text-left card p-4 transition-all hover:-translate-y-0.5 ${selected===i?'border-green-500 shadow-md ring-2 ring-green-200':''}`}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={crop.img_url||crop.img||IMG_FALLBACK} className="w-12 h-12 rounded-xl object-cover" alt={crop.name} onError={e=>{e.target.src=IMG_FALLBACK}}/>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold">#{crop.rank||i+1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{crop.name}</p>
                    <p className="text-xs text-gray-500 truncate">{crop.season}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-green text-[11px]">{t('matchPercentage').replace('{score}', crop.score)}</span>
                      <span className="text-xs font-semibold text-amber-600">₹{(crop.profit_per_acre||0).toLocaleString()}/acre</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {results[selected]&&(
              <>
                <div className="card overflow-hidden">
                  <div className="relative h-44">
                    <img src={results[selected].img_url||results[selected].img||IMG_FALLBACK} className="w-full h-full object-cover" alt={results[selected].name} onError={e=>{e.target.src=IMG_FALLBACK}}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-forest/80"/>
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                      <div><h3 className="font-display text-2xl font-bold text-white">{results[selected].name}</h3><p className="text-green-200 text-sm">{results[selected].season}</p></div>
                      <div className="text-right"><p className="text-amber-400 text-3xl font-bold font-display">{results[selected].score}%</p><p className="text-white/70 text-xs">{t('matchScore')}</p></div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[{l:t('waterNeed'),v:results[selected].water},{l:t('duration'),v:results[selected].duration},{l:t('profit'),v:`₹${(results[selected].profit_per_acre||0).toLocaleString()}`}].map(({l,v})=>(
                        <div key={l} className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-semibold text-gray-800 mt-0.5">{v||'—'}</p></div>
                      ))}
                    </div>
                    {results[selected].reasons?.length>0&&(
                      <div className="mb-4"><p className="text-sm font-semibold text-gray-700 mb-2">{t('whyThisCrop')}</p>
                        {results[selected].reasons.map((r,i)=>(<div key={i} className="flex items-center gap-2 mb-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0"/><span className="text-sm text-gray-600">{r}</span></div>))}
                      </div>
                    )}
                    {results[selected].best_variety&&<div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100"><p className="text-xs font-semibold text-blue-700">{t('bestVariety')}: <span className="font-bold">{results[selected].best_variety}</span></p></div>}
                    {results[selected].tips&&<div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-2"><Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"/><div><p className="text-xs font-semibold text-amber-700 mb-0.5">{t('expertTip')}</p><p className="text-sm text-amber-800">{results[selected].tips}</p></div></div>}
                    {results[selected].fertilizer_schedule&&<div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100"><p className="text-xs font-semibold text-green-700">{t('fertilizerSchedule')}: <span className="font-normal text-green-800">{results[selected].fertilizer_schedule}</span></p></div>}
                  </div>
                </div>
                {radarData.length>0&&(
                  <div id="crops-radar" className="card p-5"><h4 className="font-semibold text-forest mb-3">{t('suitabilityRadar')}</h4>
                    <ResponsiveContainer width="100%" height={200}><RadarChart data={radarData}><PolarGrid stroke="#e5e7eb"/><PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:'#6b7280'}}/><Radar dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.2} strokeWidth={2}/></RadarChart></ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
