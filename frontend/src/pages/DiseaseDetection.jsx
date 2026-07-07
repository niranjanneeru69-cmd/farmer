import React, { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { diseaseAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { Upload, ScanSearch, CheckCircle, AlertTriangle, FlaskConical, Leaf, X, Camera, ChevronRight, Clock, Info, Trash2, ShoppingBag, MapPin } from 'lucide-react'

export default function DiseaseDetection() {
  const { t } = useLang()
  const { farmer } = useAuth()
  const [dragOver, setDragOver] = useState(false)
  const [imgPreview, setImgPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [cropName, setCropName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const fileRef = useRef()

  useEffect(() => { diseaseAPI.getHistory().then(r => setHistory(r.data.detections || [])).catch(() => {}) }, [])

  const handleFile = (f) => {
    if (!f?.type.startsWith('image/')) return
    setFile(f); setImgPreview(URL.createObjectURL(f)); setResult(null); setError('')
  }

  const handleDetect = async () => {
    if (!file) return
    setAnalyzing(true); setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      if (cropName) fd.append('crop_name', cropName)
      const res = await diseaseAPI.detect(fd)
      if (!res.data.is_crop_image) {
        setError(res.data.message || t('notCropImage'))
        setAnalyzing(false); return
      }
      setResult(res.data)
      diseaseAPI.getHistory().then(r => setHistory(r.data.detections || [])).catch(() => {})
    } catch (e) { setError(e.response?.data?.error || 'Detection failed. Please try again.') }
    finally { setAnalyzing(false) }
  }

  const handleDelete = async (id) => {
    try { await diseaseAPI.delete(id); setHistory(h => h.filter(d => d.id !== id)) } catch {}
  }

  const handleFindShops = () => {
    const query = encodeURIComponent(`pesticide and fertilizer shops near ${farmer?.pincode || farmer?.district || 'me'}`)
    window.open(`https://www.google.com/maps/search/${query}`, '_blank')
  }

  const reset = () => { setFile(null); setImgPreview(null); setResult(null); setError('') }
  const SEV = { High: 'text-red-600 bg-red-50 border-red-200', Moderate: 'text-amber-600 bg-amber-50 border-amber-200', Low: 'text-green-600 bg-green-50 border-green-200' }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {!imgPreview ? (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              id="disease-upload"
              className={`card p-10 flex flex-col items-center gap-4 cursor-pointer border-2 border-dashed transition-all min-h-72 ${dragOver ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}`}>
              <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center"><Upload className="w-10 h-10 text-green-400" /></div>
              <div className="text-center">
                <h3 className="font-display font-bold text-forest text-xl mb-1">{t('uploadPhoto')}</h3>
                <p className="text-gray-500 text-sm max-w-xs">{t('tour_disease_upload_desc')}</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-primary py-2.5 px-5 text-sm"><Camera className="w-4 h-4" />{t('takePhoto')}</button>
                <button className="btn-outline py-2.5 px-5 text-sm"><Upload className="w-4 h-4" />{t('browse')}</button>
              </div>
              <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 10MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="relative">
                <img src={imgPreview} className="w-full h-64 object-cover" alt="" />
                {!analyzing && !result && <button onClick={reset} className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"><X className="w-4 h-4" /></button>}
                {analyzing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white font-semibold">{t('analyzing')}...</p>
                    <p className="text-green-200 text-sm">{t('checkingDiseasePatterns')}</p>
                  </div>
                )}
                {result && <div className="absolute top-3 left-3"><span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-full"><CheckCircle className="w-3 h-3" />{t('analysisComplete')}</span></div>}
              </div>
              {!result && !analyzing && (
                <div className="p-4 flex items-center gap-3">
                  <input value={cropName} onChange={e => setCropName(e.target.value)} placeholder={t('cropName')} className="input flex-1 text-sm" />
                  <button onClick={handleDetect} className="btn-primary whitespace-nowrap"><ScanSearch className="w-4 h-4" />{t('analyzeDisease')}</button>
                </div>
              )}
              {error && (
                <div className="m-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">{t('notCropImageTitle')}</p>
                    <p className="text-sm text-amber-700 mt-0.5">{error}</p>
                    <button onClick={reset} className="text-xs text-amber-600 font-semibold hover:underline mt-2 block">{t('tryAnother')} →</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!result && !error && (
            <div className="card p-5 rounded-2xl">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-green-500" />{t('diagnosisTips')}</p>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {[t('tip1'), t('tip2'), t('tip3'), t('tip4')].map(tx => tx && <p key={tx} className="text-sm text-gray-600">{tx}</p>)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5 rounded-2xl">
            <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center mb-3"><ScanSearch className="w-5 h-5 text-white" /></div>
            <h4 className="font-semibold text-forest mb-1">{t('diseaseDetected')}</h4>
            <p className="text-sm text-gray-600 mb-3">{t('aiLabInPocketDesc')}</p>
            <div className="flex flex-wrap gap-1.5">{['Rice', 'Wheat', 'Tomato', 'Cotton', 'Maize', 'Onion', 'Potato', 'Groundnut'].map(c => <span key={c} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-medium">{c}</span>)}</div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-forest mb-3">{t('tour_disease_history_title')}</h3>
            {history.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">{t('noHistory')}</p> : (
              <div id="disease-history" className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {history.map(d => (
                  <div key={d.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.severity === 'High' ? 'bg-red-100' : d.severity === 'Moderate' ? 'bg-amber-100' : 'bg-green-100'}`}>
                      <ScanSearch className={`w-4 h-4 ${d.severity === 'High' ? 'text-red-600' : d.severity === 'Moderate' ? 'text-amber-600' : 'text-green-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{d.disease_name}</p>
                      <p className="text-[11px] text-gray-500">{d.crop_name} · {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className={`card p-6 border-2 ${SEV[result.severity]?.split(' ').slice(1).join(' ') || 'border-gray-200'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${result.severity === 'High' ? 'bg-red-500' : result.severity === 'Moderate' ? 'bg-amber-500' : 'bg-green-500'}`}><AlertTriangle className="w-6 h-6 text-white" /></div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div><h3 className="font-display font-bold text-2xl text-gray-900">{result.disease_name}</h3><p className="text-gray-500 text-sm mt-0.5">{result.scientific_name} · {t('crops')}: <strong>{result.crop_name}</strong></p></div>
                  <div className="text-right"><p className="text-3xl font-bold font-display text-green-700">{result.confidence}%</p><p className="text-xs text-gray-500">{t('confidence')}</p></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{result.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${SEV[result.severity] || ''}`}>{result.severity} {t('status')}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{t('recoveryDays')}: ~{result.recovery_days} days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="card p-5">
                <h4 className="font-display font-bold text-forest mb-3">Symptoms</h4>
                <div className="space-y-2 mb-4">{(result.symptoms || []).map(s => <div key={s} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{s}</span></div>)}</div>
                <h4 className="font-display font-bold text-forest mb-3">{t('precautions')}</h4>
                <div className="space-y-1.5">{(result.precautions || []).map(p => <div key={p} className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{p}</span></div>)}</div>
              </div>
              <div className="card p-5">
                <h4 className="font-display font-bold text-forest mb-3">🔧 {t('cureSteps')}</h4>
                <div className="space-y-3">{(result.cure_steps || []).map(step => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{step.step}</div>
                    <div><p className="text-sm font-semibold text-gray-800">{step.action}</p><p className="text-xs text-gray-500 mt-0.5">{step.detail}</p></div>
                  </div>
                ))}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-5">
                <h4 className="font-display font-bold text-forest mb-3 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-red-500" />{t('pesticides')}</h4>
                <div className="space-y-3">{(result.pesticides || []).map(p => (
                  <div key={p.name} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5"><p className="text-sm font-bold text-gray-800">{p.name}</p><span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{p.type}</span></div>
                    <p className="text-xs text-gray-600">Dose: <strong>{p.dose}</strong></p>
                    <p className="text-xs text-gray-600">Apply: {p.frequency}</p>
                    {p.cost && <p className="text-xs text-gray-500 mt-0.5">Cost: {p.cost}</p>}
                  </div>
                ))}</div>
              </div>
              <div className="card p-5 bg-green-50 border border-green-100">
                <h4 className="font-display font-bold text-green-800 mb-3 flex items-center gap-2"><Leaf className="w-4 h-4 text-green-600" />🌿 {t('organicAlternatives')}</h4>
                {(result.organic_alternatives || []).map(o => <div key={o} className="flex items-center gap-2 mb-1.5"><span className="w-2 h-2 bg-green-500 rounded-full shrink-0" /><span className="text-sm text-green-800">{o}</span></div>)}
              </div>
              <div className="card p-4"><p className="text-sm font-semibold text-gray-700 mb-1">Root Cause</p><p className="text-sm text-gray-600">{result.cause}</p></div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={reset} className="btn-outline"><ScanSearch className="w-4 h-4" />{t('retry')}</button>
            <button onClick={handleFindShops} className="btn-gold flex-1 sm:flex-initial">
              <ShoppingBag className="w-4 h-4" />
              <span>Find Pesticides Nearby {farmer?.pincode && <span className="opacity-70 text-[10px]">({farmer.pincode})</span>}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
