import React from 'react';
import { motion } from 'framer-motion';
import { Tag, TrendingUp, AlertTriangle, MessageSquare, IndianRupee } from 'lucide-react';
import ExportButton from './ExportButton';

export default function LedgerCard({ data }: { data: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='w-full max-w-4xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl'
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 border-b border-white/5 flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <div className='bg-blue-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20'>
            <TrendingUp className='text-white' />
          </div>
          <div>
            <h3 className='text-2xl font-black text-white'>Daily Ledger</h3>
            <p className='text-slate-400 text-sm'>Extracted Business Data</p>
          </div>
        </div>
        <ExportButton data={data} />
      </div>

      <div className='p-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Left: Items */}
        <div className='space-y-6'>
          <h4 className='text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2'>
            <Tag size={14} /> Items Sold
          </h4>
          <div className='space-y-3'>
            {data.ledger_entry.items_sold.map((item: any, i: number) => (
              <div key={i} className='bg-white/5 p-4 rounded-3xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all'>
                <div>
                  <p className='text-white font-bold'>{item.name}</p>
                  <p className='text-slate-400 text-xs mt-1'>{item.qty} units @ ?{item.price}</p>
                </div>
                <p className='text-white font-mono font-bold text-lg'>?{item.qty * item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stats & Flags */}
        <div className='space-y-8'>
          <div>
            <h4 className='text-slate-500 font-bold uppercase tracking-widest text-xs mb-4'>Summary</h4>
            <div className='bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] flex flex-col items-center'>
              <span className='text-emerald-400 text-sm font-bold uppercase mb-2 tracking-tighter'>Total Earnings</span>
              <div className='flex items-center gap-1 text-emerald-400'>
                 <IndianRupee size={28} className='font-bold' />
                 <span className='text-5xl font-black font-mono leading-none'>{data.ledger_entry.earnings}</span>
              </div>
            </div>
          </div>

          {data.ledger_entry.flags.length > 0 && (
            <div className='space-y-4'>
              <h4 className='text-amber-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2'>
                <AlertTriangle size={14} /> Review Required
              </h4>
              {data.ledger_entry.flags.map((flag: any, i: number) => (
                <div key={i} className='bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start'>
                  <AlertTriangle className='text-amber-500 shrink-0' size={18} />
                  <div>
                    <p className='text-amber-200 text-sm font-bold'>{flag.field}</p>
                    <p className='text-amber-200/60 text-xs'>{flag.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Section */}
      <div className='p-8 bg-black/20 border-t border-white/5'>
        <h4 className='text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2'>
          <MessageSquare size={14} /> Original Voice Notes
        </h4>
        <p className='text-slate-300 italic text-sm leading-relaxed'>\{data.transcript}\</p>
      </div>
    </motion.div>
  );
}
