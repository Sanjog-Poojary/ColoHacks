import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Zap, Sparkles, Tag, 
  ArrowUp, ArrowDown, Minus, Clock,
  Package, CheckCircle2, MoreHorizontal, ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';

export default function BusinessInsights({ data, title }: { data: any; title?: string }) {
  // 1. Loading State (Skeleton)
  if (!data || data.loading) {
    return (
      <div className='w-full max-w-6xl space-y-10 animate-pulse'>
        <div className='flex justify-between items-center bg-[#FDF5E6]/50 p-6 rounded-3xl h-24' />
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 bg-[#FDF5E6]/50 rounded-[3rem] h-[400px]' />
          <div className='bg-[#008080]/20 rounded-[3rem] h-[400px]' />
        </div>
      </div>
    );
  }

  // 2. Insufficient Data Logic
  if (data.status === 'insufficient_data') {
    const days = data.days_recorded || 0;
    const progress = Math.min((days / 4) * 100, 100);
    return (
      <div className='w-full max-w-2xl mx-auto py-20 text-center space-y-8'>
        <div className='w-24 h-24 bg-[#008080]/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-[#008080]/30'>
          <Clock className='text-[#008080]' size={40} />
        </div>
        <div className='space-y-4'>
          <h2 className='text-3xl font-black text-[#333333] uppercase italic'>Feeding the AI...</h2>
          <p className='text-slate-500 font-medium px-4'>
            Record at least 4 days of sales to unlock professional business insights.
          </p>
        </div>
        <div className='px-10'>
          <div className='h-4 w-full bg-[#008080]/10 rounded-full overflow-hidden'>
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} 
              className='h-full bg-gradient-to-r from-[#008080] to-[#20B2AA]' 
            />
          </div>
          <p className='text-[10px] text-[#008080] font-black uppercase mt-3 tracking-widest'>
            {days} of 4 days recorded
          </p>
        </div>
      </div>
    );
  }

  // 3. Prepare Chart Data (Actual + Predictions)
  const chartData = useMemo(() => {
    if (!data.revenue_trend) return [];
    const hist = data.revenue_trend.historical || [];
    const forecast = data.revenue_trend.forecast || [];
    
    // Format historical data
    const formattedHist = hist.map((h: any) => ({
      ...h,
      dateLabel: new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      isForecast: false
    }));
    
    // Format forecast data
    const formattedForecast = forecast.map((f: any) => ({
      dateLabel: new Date(f.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      earnings: null, // Don't draw line for actual in forecast zone
      predicted_earnings: f.predicted_earnings,
      rolling_avg: null,
      isForecast: true
    }));
    
    return [...formattedHist, ...formattedForecast];
  }, [data]);

  const trend = data.trend_direction || 'stable';
  const computedTime = data.computed_at ? new Date(data.computed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className='w-full max-w-6xl space-y-6 md:space-y-10'>
      {/* Header with Trend Badge */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-3 md:gap-4'>
          <div className='bg-[#008080] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-[#008080]/20'>
            <BarChart3 className='text-[#FFFFF0]' size={24} />
          </div>
          <div>
            <h2 className='text-2xl md:text-3xl font-black text-[#333333] uppercase tracking-tight leading-none'>{title || 'Business'} Insights</h2>
            <div className='flex items-center gap-2 mt-1.5'>
               <p className='text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider'>Powered by Local AI Analytics</p>
               {computedTime && (
                 <span className='text-[10px] text-slate-400 font-medium italic border-l border-slate-200 pl-2'>Last updated {computedTime}</span>
               )}
            </div>
          </div>
        </div>
        
        <div className='flex flex-wrap gap-2 md:gap-3'>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[10px] uppercase italic tracking-tighter shadow-sm ${
            trend === 'growing' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            trend === 'declining' ? 'bg-rose-50 text-rose-600 border-rose-200' :
            'bg-[#FDF5E6] text-[#008080] border-[#008080]/10'
          }`}>
            {trend === 'growing' ? <ArrowUp size={12} /> : trend === 'declining' ? <ArrowDown size={12} /> : <Minus size={12} />}
            <span>{trend}</span>
          </div>

          {data.confidence_score && (
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 font-black text-[10px] uppercase italic tracking-tighter shadow-sm'>
              <ShieldCheck size={12} />
              <span>{data.confidence_score}% Confidence</span>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'>
        {/* Main Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className='lg:col-span-2 bg-[#FDF5E6] border border-[#008080]/10 p-5 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl relative overflow-hidden'
        >
          <div className='flex items-center justify-between mb-8 relative z-10'>
            <div className='space-y-1'>
               <h3 className='text-lg md:text-xl font-bold text-[#333333]'>Revenue Performance</h3>
               <p className='text-xs text-slate-500'>7-day history vs next 7 days forecast</p>
            </div>
            <div className='flex gap-4'>
              <div className='flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase'>
                <div className='w-2 h-2 bg-[#008080] rounded-full' /> Actual
              </div>
              <div className='flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase italic'>
                <div className='w-2 h-2 bg-emerald-300 rounded-full' /> Forecast
              </div>
            </div>
          </div>
          
          <div className='h-[300px] md:h-[350px] w-full relative z-10'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#00808010' vertical={false} />
                <XAxis 
                  dataKey='dateLabel' stroke='#94a3b8' fontSize={9} 
                  tickLine={false} axisLine={false} interval={1} 
                />
                <YAxis 
                  stroke='#94a3b8' fontSize={9} tickLine={false} 
                  axisLine={false} tickFormatter={(v) => `₹${v}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FDF5E6', borderRadius: '16px', border: '1px solid #00808020', boxShadow: '0 10px 15px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '8px', textTransform: 'uppercase', color: '#333' }}
                />
                
                {/* Visual zone for forecast */}
                <ReferenceArea 
                  x1={chartData.find((d:any) => d.isForecast)?.dateLabel} 
                  x2={chartData[chartData.length - 1]?.dateLabel} 
                  fill='#F59E0B' fillOpacity={0.05} 
                />

                <Line 
                  type='monotone' dataKey='earnings' stroke='#008080' 
                  strokeWidth={4} dot={{ r: 4, fill: '#008080' }} activeDot={{ r: 6 }} 
                  animationDuration={1500}
                />
                <Line 
                  type='monotone' dataKey='rolling_avg' stroke='#008080' 
                  strokeWidth={2} strokeDasharray='5 5' opacity={0.4} dot={false} 
                />
                <Line 
                  type='monotone' dataKey='predicted_earnings' stroke='#F59E0B' 
                  strokeWidth={3} strokeDasharray='3 3' dot={{ r: 3, fill: '#F59E0B' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Selling Ranked List */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className='bg-[#FDF5E6] border border-[#008080]/10 p-5 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl'
        >
          <div className='flex items-center gap-3 mb-6'>
            <div className='bg-[#008080]/10 p-2 rounded-xl'>
              <Tag className='text-[#008080]' size={18} />
            </div>
            <h3 className='text-lg font-bold text-[#333333]'>Top Product Picks</h3>
          </div>
          
          <div className='space-y-4'>
            {data.top_items?.length > 0 ? data.top_items.map((item: any, idx: number) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-white border-[#008080]/20 shadow-md' : 'bg-white/40 border-slate-100'}`}>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-[#008080] text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-bold text-[#333333] truncate italic uppercase tracking-tighter text-sm'>{item.name}</p>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-[#008080]/10 text-[#008080]' : 'bg-slate-100 text-slate-500'}`}>
                        {item.days_sold} days
                      </span>
                      {item.total_revenue > 0 && <span className='text-[10px] font-bold text-slate-400 italic'>₹{item.total_revenue} earned</span>}
                    </div>
                  </div>
                </div>
                {idx === 0 && <Sparkles className='text-amber-500 flex-shrink-0' size={16} />}
              </div>
            )) : <p className='text-slate-400 italic text-sm py-10 text-center uppercase font-bold tracking-widest'>No data yet</p>}
          </div>
        </motion.div>
      </div>

      {/* Stock Suggestions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8'>
        {/* Inventory Strategy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className='bg-[#008080] p-6 md:p-10 rounded-3xl md:rounded-[3rem] text-[#FFFFF0] shadow-2xl relative overflow-hidden'
        >
          <div className='absolute top-0 right-0 p-8 opacity-10'>
            <Package size={120} />
          </div>
          <div className='space-y-6 relative z-10'>
            <div className='flex items-center justify-between'>
               <h3 className='text-2xl font-black italic uppercase tracking-tighter'>Prepare for Tomorrow</h3>
               <div className='bg-[#FFFFF0]/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'>Stock Plan</div>
            </div>
            
            <div className='space-y-4'>
              {data.stock_suggestions?.length > 0 ? data.stock_suggestions.map((s: any, idx: number) => (
                <div key={idx} className='bg-[#FFFFF0]/10 p-4 rounded-2xl flex items-center justify-between gap-4 border border-[#FFFFF0]/10'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                       <p className='font-bold text-lg leading-none uppercase italic'>{s.item}</p>
                       {s.has_buffer && (
                         <span className='bg-amber-400 text-amber-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1'>
                           <ArrowUp size={8} /> Stocking Up
                         </span>
                       )}
                    </div>
                    <p className='text-[#FFFFF0]/60 text-[10px] font-medium mt-1 uppercase tracking-tight'>{s.reason}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-3xl font-black leading-none'>{s.suggested_qty}</p>
                    <p className='text-[8px] font-black uppercase tracking-tighter opacity-70'>units</p>
                  </div>
                </div>
              )) : (
                <div className='bg-[#FFFFF0]/10 p-8 rounded-2xl text-center border border-dashed border-[#FFFFF0]/20'>
                  <p className='opacity-60 italic text-sm'>Add more data to see inventory strategy.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Strategic Moves (Placeholder for next feature) */}
        <div className='grid grid-cols-2 gap-4 md:gap-6'>
           <SmallInsightCard 
             title='Daily Avg' 
             value={`₹${Math.round(data.revenue_trend?.historical?.[data.revenue_trend.historical.length - 1]?.rolling_avg || 0)}`} 
             icon={<TrendingUp className='text-[#008080]' size={18} />} 
           />
           <SmallInsightCard 
             title='Best Day' 
             value={data.revenue_trend?.historical?.reduce((max: any, p: any) => p.earnings > max ? p.earnings : max, 0) || 0}
             icon={<Zap className='text-amber-500' size={18} />} 
             prefix='₹'
           />
           <SmallInsightCard 
             title='Status' 
             value='Operational' 
             icon={<CheckCircle2 className='text-emerald-500' size={18} />} 
           />
           <SmallInsightCard 
             title='Analytics' 
             value='Local ML' 
             icon={<MoreHorizontal className='text-slate-400' size={18} />} 
           />
        </div>
      </div>
    </div>
  );
}

function SmallInsightCard({ title, value, icon, prefix }: { title: string; value: any; icon: React.ReactNode; prefix?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className='bg-[#FDF5E6] border border-[#008080]/10 p-5 rounded-3xl flex flex-col justify-between shadow-lg'
    >
      <div className='bg-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center'>
        {icon}
      </div>
      <div className='mt-6 min-w-0'>
        <p className='text-slate-500 text-[10px] font-bold uppercase tracking-widest'>{title}</p>
        <p className='text-[#333333] font-black text-xl line-clamp-1 truncate'>
          {prefix}{value}
        </p>
      </div>
    </motion.div>
  );
}
