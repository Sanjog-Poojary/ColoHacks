import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, ShoppingBag, Lightbulb } from 'lucide-react';

export default function BusinessInsights({ data }: { data: any }) {
  if (!data) return null;

  // Default values to prevent undefined crashes
  const chartData = data.chart_data || [];
  const insights = data.insights || { bestseller: '-', slow_item: '-', suggestion: 'Loading...' };
  const weeklyTotal = data.weekly_total || 0;

  return (
    <div className='w-full max-w-5xl space-y-10'>
      <div className='flex items-center gap-3 mb-2'>
        <Sparkles className='text-blue-400' />
        <h2 className='text-3xl font-black text-white tracking-tight'>Business Insights</h2>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Chart Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='lg:col-span-2 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl'
        >
          <div className='flex justify-between items-start mb-10'>
            <div>
              <h3 className='text-slate-400 font-bold uppercase tracking-widest text-xs'>Weekly Earnings Trend</h3>
              <p className='text-4xl font-black text-white mt-1'>?{weeklyTotal}</p>
            </div>
            <div className='bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20'>
              <span className='text-emerald-400 text-sm font-bold'>Active Trend</span>
            </div>
          </div>

          {/* Fix: Set fixed height on parent and use minWidth/minHeight to solve Recharts warning */}
          <div className='h-[300px] w-full min-h-[300px]'>
            {chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id='colorEarnings' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3}/>
                      <stop offset='95%' stopColor='#3b82f6' stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey='date' stroke='#475569' fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type='monotone' dataKey='earnings' stroke='#3b82f6' strokeWidth={3} fillOpacity={1} fill='url(#colorEarnings)' />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className='h-full flex flex-col items-center justify-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700'>
                <p className='text-slate-500 font-medium'>No daily data for chart yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insight Cards */}
        <div className='flex flex-col gap-6'>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className='bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl text-white'
          >
            <Lightbulb className='text-blue-100 mb-4' />
            <h4 className='text-blue-100 font-bold text-sm uppercase tracking-wider mb-2'>AI Voice of Wisdom</h4>
            <p className='text-xl font-bold leading-tight'>{insights.suggestion}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className='bg-slate-800/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-xl'
          >
            <ShoppingBag className='text-blue-400 mb-4' />
            <h4 className='text-slate-500 font-bold text-sm uppercase tracking-wider mb-1'>Bestseller</h4>
            <p className='text-2xl font-black text-white'>{insights.bestseller}</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className='bg-slate-800/50 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-xl'
          >
            <TrendingUp className='text-amber-400 mb-4' />
            <h4 className='text-slate-500 font-bold text-sm uppercase tracking-wider mb-1'>Slow Item</h4>
            <p className='text-2xl font-black text-white'>{insights.slow_item}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
