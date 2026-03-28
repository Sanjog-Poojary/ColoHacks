import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Zap, Sparkles, Tag, 
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export default function BusinessInsights({ data, title }: { data: any; title?: string }) {
  if (!data) {
    return (
      <div className='w-full max-w-6xl h-96 flex flex-col items-center justify-center bg-[#FDF5E6] rounded-3xl md:rounded-[3rem] border border-dashed border-[#008080]/20'>
        <div className='w-12 h-12 border-4 border-[#008080]/30 border-t-[#008080] rounded-full animate-spin mb-4' />
        <p className='text-[#008080] font-bold'>Loading insights...</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!data.daily_data) return [];
    return Object.entries(data.daily_data).map(([date, earnings]) => ({
      name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      value: earnings
    })).reverse();
  }, [data.daily_data]);

  return (
    <div className='w-full max-w-6xl space-y-6 md:space-y-10'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-3 md:gap-4'>
          <div className='bg-[#008080] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-[#008080]/20'>
            <BarChart3 className='text-[#FFFFF0]' size={24} />
          </div>
          <div>
            <h2 className='text-2xl md:text-3xl font-black text-[#333333] uppercase tracking-tight leading-none'>{title || 'Business'} Analytics</h2>
            <p className='text-xs md:text-sm text-slate-500 font-medium mt-1'>AI-powered insights for your shop</p>
          </div>
        </div>
        <div className='self-start flex items-center gap-2 bg-[#FDF5E6] px-3 py-1.5 rounded-xl border border-[#008080]/10 shadow-sm'>
          <TrendingUp className='text-[#008080]' size={16} />
          <span className='font-bold text-[#008080] text-xs uppercase italic tracking-tighter'>Growing</span>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8'>
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className='lg:col-span-2 bg-[#FDF5E6] border border-[#008080]/10 p-5 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl'
        >
          <div className='flex items-center justify-between mb-6 md:mb-8'>
            <h3 className='text-lg md:text-xl font-bold text-[#333333]'>Revenue Trends</h3>
            <div className='flex gap-2'>
              <div className='flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500'>
                <div className='w-2 h-2 md:w-3 md:h-3 bg-[#008080] rounded-full' /> Revenue
              </div>
            </div>
          </div>
          <div className='h-[250px] md:h-[300px] w-full'>
            {chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id='colorRev' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#008080' stopOpacity={0.2}/>
                      <stop offset='95%' stopColor='#008080' stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#00808010' vertical={false} />
                  <XAxis dataKey='name' stroke='#94a3b8' fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke='#94a3b8' fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FDF5E6', borderRadius: '16px', border: '1px solid #00808010', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#008080', fontWeight: 'bold' }}
                  />
                  <Area type='monotone' dataKey='value' stroke='#008080' strokeWidth={4} fillOpacity={1} fill='url(#colorRev)' />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex flex-col items-center justify-center bg-[#FDF5E6] rounded-2xl md:rounded-3xl border border-dashed border-[#008080]/20'>
                <p className='text-slate-500 font-medium text-sm'>No daily data chart yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insight Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className='bg-[#008080] p-6 md:p-8 rounded-3xl md:rounded-[3rem] text-[#FFFFF0] relative overflow-hidden shadow-2xl shadow-[#008080]/30 min-h-[300px]'
        >
          <div className='absolute top-0 right-0 p-6 md:p-8 opacity-20'>
            <Sparkles size={80} />
          </div>
          <div className='relative z-10 space-y-4 md:space-y-6'>
            <div className='bg-[#FFFFF0]/20 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center'>
              <Zap className='text-[#FFFFF0]' size={24} />
            </div>
            <h3 className='text-xl md:text-2xl font-black italic uppercase italic leading-none'>AI Strategy</h3>
            <p className='text-[#FFFFF0]/80 leading-relaxed font-medium text-base md:text-lg'>
              {data.summary || "Start recording sales to get AI insights."}
            </p>
            <div className='pt-2'>
              <button className='w-full bg-[#FFFFF0] text-[#008080] font-black py-3 md:py-4 rounded-xl md:rounded-2xl shadow-xl hover:bg-[#FDF5E6] transition-all transform active:scale-95'>
                Analyze Strategy
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pb-4 md:pb-0'>
        <StatCard title='Top Selling' value={data.top_item || 'N/A'} icon={<Tag className='text-[#008080]' />} />
        <StatCard title='Daily Avg' value={`₹${data.avg_daily || 0}`} icon={<TrendingUp className='text-[#008080]' />} />
        <StatCard title='Inventory' value='Normal' icon={<AlertTriangle className='text-[#FF7F50]' />} />
        <StatCard title='Customer Mood' value='Positive' icon={<Sparkles className='text-[#008080]' />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className='bg-[#FDF5E6] border border-[#008080]/10 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex items-center gap-3 md:gap-4 shadow-lg'
    >
      <div className='bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm flex-shrink-0'>
        {icon}
      </div>
      <div className='min-w-0'>
        <p className='text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest'>{title}</p>
        <p className='text-[#333333] font-black text-lg md:text-xl line-clamp-1'>{formattedValue}</p>
      </div>
    </motion.div>
  );
}
