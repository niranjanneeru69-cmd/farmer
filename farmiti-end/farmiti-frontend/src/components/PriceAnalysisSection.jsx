import React from 'react';
import { TrendingUp, TrendingDown, Target, Brain, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceAnalysisSection({ analysis, cropName, currentPrice, history, loading }) {
   if (loading) {
      return (
         <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Kisan AI is analyzing trends...</p>
         </div>
      );
   }

   if (!analysis) return null;

   const sentimentColor = analysis.sentiment === 'Bullish' ? 'text-emerald-600 bg-emerald-50' :
      analysis.sentiment === 'Bearish' ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50';

   const actionColor = analysis.action.includes('Sell') ? 'bg-emerald-600 shadow-emerald-100' :
      analysis.action.includes('Wait') ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100';

   // Combine history and forecast for the chart
   const lastDate = history.length ? new Date(history[history.length - 1].recorded_at) : new Date();
   const chartData = [
      ...history.slice(-7).map(h => ({ date: new Date(h.recorded_at).toLocaleDateString(), price: Number(h.price), type: 'history' })),
      ...analysis.forecast.map((p, i) => {
         const d = new Date(lastDate);
         d.setDate(d.getDate() + i + 1);
         return { date: d.toLocaleDateString(), price: p, type: 'forecast' };
      })
   ];

   return (
      <div className="animate-fade-in space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
         {/* 1. AI Strategy Header (Now Stacked) */}
         <div className="bg-gradient-to-br from-[#0D3320] to-[#1A5C38] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                     <Brain className="w-3 h-3 text-emerald-300" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Kisan Strategist</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300">
                     <ShieldCheck className="w-3 h-3" />
                     <span className="text-[9px] font-bold">{analysis.confidence}% Confidence</span>
                  </div>
               </div>

               <div>
                  <p className="text-[9px] text-emerald-200/60 font-black uppercase tracking-widest mb-1">Recommended Action</p>
                  <h3 className="text-xl font-black uppercase tracking-tight">{analysis.action}</h3>
               </div>

               <div className={`p-4 rounded-2xl flex items-center justify-between transition-all ${sentimentColor}`}>
                  <div className="flex items-center gap-2">
                     {analysis.sentiment === 'Bullish' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                     <span className="text-xs font-black uppercase tracking-wider">{analysis.sentiment} Trend</span>
                  </div>
                  <Zap className="w-3.5 h-3.5 opacity-50" />
               </div>
            </div>
         </div>

         {/* 2. Price Projection (Chart Section) */}
         <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100">
            <div className="mb-4">
               <h4 className="font-black text-[#0D3320] text-sm uppercase tracking-tight">Price Projection</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">7-Day Forecast Analysis</p>
            </div>

            <div className="h-[180px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis dataKey="date" hide />
                     <YAxis
                        domain={['auto', 'auto']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }}
                        tickFormatter={v => `₹${v}`}
                     />
                     <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '8px' }}
                        labelStyle={{ fontWeight: 900, marginBottom: '2px', fontSize: '9px', color: '#9ca3af' }}
                     />
                     <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#fff' }}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* 3. Strategic Insight Sidebar */}
         <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100">
            <h4 className="font-black text-[#0D3320] uppercase tracking-tight text-[11px] mb-3 flex items-center gap-2">
               <Target className="w-3.5 h-3.5 text-emerald-600" />
               Market Logic
            </h4>
            <p className="text-emerald-900/80 text-[11px] font-medium leading-relaxed italic mb-4">
               "{analysis.logic}"
            </p>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Target Price</span>
               <span className="text-xs font-black text-emerald-700">₹{Math.max(...analysis.forecast)}</span>
            </div>
         </div>
      </div>
   );
}
