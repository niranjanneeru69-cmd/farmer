import React, { useState, useEffect, useCallback } from 'react'
import { useLang } from '../context/LanguageContext'
import { marketAPI } from '../api/services'
import { TrendingUp, TrendingDown, Search, RefreshCw, MapPin, ArrowUpRight, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PriceAnalysisSection from '../components/PriceAnalysisSection'

const CATS = ['All', 'Cereals', 'Pulses', 'Vegetables', 'Fruits', 'Cash Crops', 'Oilseeds', 'Spices', 'Flowers']

export default function MarketPrices() {
  const { t, lang } = useLang()
  const [prices, setPrices] = useState([])
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [nearbyPrices, setNearbyPrices] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)

  const fetchPrices = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true)
    try {
      const res = await marketAPI.getPrices({ search: search || undefined, category: category === 'All' ? undefined : category })
      setPrices(res.data.prices || [])
      setLastUpdated(new Date())
      if (!selected && res.data.prices?.length) setSelected(res.data.prices[0])
    } catch (e) { console.error(e) }
    finally { setRefreshing(false); setLoading(false) }
  }, [search, category])

  const fetchNearby = useCallback(async () => {
    setNearbyLoading(true)
    try {
      const res = await marketAPI.getPrices({ nearby: 'true' })
      setNearbyPrices(res.data.prices || [])
    } catch (e) { console.error(e) }
    finally { setNearbyLoading(false) }
  }, [])

  useEffect(() => { fetchPrices() }, [fetchPrices])
  useEffect(() => { fetchNearby() }, [fetchNearby])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const i = setInterval(() => { fetchPrices(true); fetchNearby(); }, 300000)
    return () => clearInterval(i)
  }, [fetchPrices, fetchNearby])

  const fetchHistory = async (id) => {
    try {
      const res = await marketAPI.getPriceHistory(id)
      setHistory(res.data.history || [])
      return res.data.history || []
    } catch { return [] }
  }

  const runAnalysis = async (crop, hist) => {
    setAnalyzing(true)
    try {
      const res = await marketAPI.analyzePrice({
        cropId: crop.id,
        cropName: crop.crop_name,
        currentPrice: crop.price,
        history: hist.slice(-10)
      })
      setAnalysis(res.data.analysis)
    } catch (e) {
      console.error('Analysis failed:', e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSelect = async (p) => {
    setSelected(p)
    setAnalysis(null)
    const hist = await fetchHistory(p.id)
    if (hist.length > 0) runAnalysis(p, hist)
  }

  useEffect(() => {
    if (selected?.id) {
      fetchHistory(selected.id).then(hist => {
        if (hist.length > 0) runAnalysis(selected, hist)
      })
    }
  }, [])

  const histChart = history.map(h => ({ date: new Date(h.recorded_at).toLocaleDateString(lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' }), price: Number(h.price) }))

  return (
    <div className="space-y-5">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: t('marketsTracked'), v: '286+', icon: MapPin, c: 'text-green-600 bg-green-50' },
          { l: t('cropsMonitored'), v: prices.length || '70+', icon: TrendingUp, c: 'text-amber-600 bg-amber-50' },
          { l: t('pricesRising'), v: prices.filter(p => p.change > 0).length, icon: ArrowUpRight, c: 'text-blue-600 bg-blue-50' },
          { l: t('updated'), v: lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Live', icon: RefreshCw, c: 'text-purple-600 bg-purple-50' },
        ].map(({ l, v, icon: I, c }) => (
          <div key={l} className="stat-card">
            <div className={`w-9 h-9 ${c} rounded-xl flex items-center justify-center mb-3`}><I className="w-4 h-4" /></div>
            <p className="font-display text-2xl font-bold text-forest">{v}</p>
            <p className="text-gray-400 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* 2. Nearby Prices Banner */}
      {nearbyPrices.length > 0 && (
        <div className="card-hover p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0D3320] to-[#1A5C38] text-white shadow-xl overflow-hidden relative group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-700" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                     <MapPin className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl tracking-tight uppercase">{t('nearbyMarkets') || 'Prices Near You'}</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-200/60">{t('basedOnYourDistrict') || 'Based on your farm profile'}</p>
                  </div>
               </div>
               <button onClick={fetchNearby} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 active:scale-95">
                 <RefreshCw className={`w-4 h-4 ${nearbyLoading ? 'animate-spin' : ''}`} />
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyPrices.slice(0, 4).map(p => (
                <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group/item" onClick={() => handleSelect(p)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded-md">{p.market}</span>
                    <TrendingUp className="w-3 h-3 text-emerald-300" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{p.crop_name}</h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-xl font-black">₹{p.price}</p>
                    <p className="text-[10px] font-bold text-white/40">MSP: ₹{p.msp}</p>
                  </div>
                  
                  {/* Strategic Advice Badge */}
                  <div className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${p.change > 0 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-300'}`}>
                    <Zap className="w-3 h-3" />
                    {p.change > 0 ? 'Best time to Sell' : 'Suggest: Wait & Watch'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Market Explorer */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1" id="market-search">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchCrop')} className="input pl-10 py-2.5 text-sm" />
            </div>
            <button onClick={() => fetchPrices()} className="btn-ghost border border-gray-200 gap-2" title="Refresh prices">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{t('retry')}</span>
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4">
            {CATS.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === c ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c === 'All' ? t('checkAll') : t(c.toLowerCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-200 border-t-green-700 rounded-full animate-spin" style={{ borderWidth: '3px' }} /></div>
          ) : (
            <div id="market-table" className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pl-2">{t('crops')}</th>
                  <th className="text-center text-xs font-semibold text-gray-500 pb-3">{t('msp') || 'MSP'}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 pb-3">{t('livePrice')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 pb-3">{t('status')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 pb-3 pr-2">{t('market')}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {prices.map(p => (
                    <tr key={p.id} onClick={() => handleSelect(p)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === p.id ? 'bg-green-50' : ''}`}>
                      <td className="py-2.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          <img src={p.img_url || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=80&q=60'} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                          <div><p className="text-sm font-semibold text-gray-800 leading-tight">{p.crop_name}</p><p className="text-xs text-gray-400">{p.category}</p></div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-xs font-bold text-amber-600">₹{p.msp}</td>
                      <td className="py-2.5 text-right"><p className="text-sm font-bold text-gray-800">₹{Number(p.price).toLocaleString()}</p><p className="text-xs text-gray-400">{p.unit}</p></td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${p.change > 0 ? 'text-green-600' : p.change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {p.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(p.change)}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right"><p className="text-xs text-gray-500">{p.market}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="space-y-4">
            <div className="card overflow-hidden rounded-3xl">
              <div className="relative h-36">
                <img src={selected.img_url || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/70" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-display font-bold text-white text-lg">{selected.crop_name}</h3>
                  <p className="text-green-200 text-xs">{selected.category} · {selected.market}</p>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selected.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selected.change > 0 ? '↑' : '↓'} {Math.abs(selected.change)}%
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[{ l: t('today'), v: `₹${Number(selected.price).toLocaleString()}` }, { l: t('previous'), v: `₹${Number(selected.prev_price).toLocaleString()}` }, { l: t('market'), v: selected.market }, { l: t('state'), v: selected.state }].map(({ l, v }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-2.5"><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-bold text-gray-800 truncate">{v}</p></div>
                  ))}
                </div>
              </div>
            </div>

            {histChart.length > 0 && (
              <div id="market-trends" className="card p-5 rounded-2xl">
                <h4 className="font-semibold text-forest text-sm mb-3">{t('trend6m')}</h4>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={histChart} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '11px' }} formatter={v => [`₹${v}`, t('livePrice')]} />
                    <Line type="monotone" dataKey="price" stroke="#15803d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div id="market-insight" className="card p-5 bg-gradient-to-br from-green-50 to-amber-50 border border-green-100 rounded-2xl">
              <p className="text-xs font-semibold text-green-700 mb-1">📊 {t('marketInsight')}</p>
              <p className="text-sm text-gray-700">
                <strong>{selected.crop_name}</strong> {t('livePrice')} {selected.change > 0 ? t('risingStock') : t('decliningStock')}
              </p>
            </div>

            {/* AI Market Analysis Section (Integrated into Sidebar) */}
            <PriceAnalysisSection
              analysis={analysis}
              cropName={selected?.crop_name}
              currentPrice={selected?.price}
              history={history}
              loading={analyzing}
            />
          </div>
        )}
      </div>
    </div>
  )
}
