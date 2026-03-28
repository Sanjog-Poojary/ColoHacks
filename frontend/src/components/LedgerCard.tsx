import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, TrendingUp, AlertTriangle, MessageSquare, IndianRupee, Languages, Trash2, Loader2 } from 'lucide-react';
import ExportButton from './ExportButton';
import api from '../lib/api';

export default function LedgerCard({ data, onDelete }: { data: any; onDelete?: (id: string) => void }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleTranslate = async () => {
    if (translated) { setTranslated(null); return; } // Toggle off
    setIsTranslating(true);
    try {
      const res = await api.post('/translate', { text: data.transcript });
      setTranslated(res.data.translated);
    } catch (e) { console.error('Translation failed', e); }
    setIsTranslating(false);
  };

  const handleDelete = async () => {
    if (!data.id || !onDelete) return;
    try {
      await api.delete(`/ledger/${data.id}`);
      onDelete(data.id);
    } catch (e) { console.error('Delete failed', e); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='w-full max-w-4xl bg-[#FDF5E6] backdrop-blur-2xl border border-[#008080]/10 rounded-[3rem] overflow-hidden shadow-2xl'
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-[#008080]/10 to-[#20B2AA]/10 p-8 border-b border-[#008080]/5 flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <div className='bg-[#008080] p-4 rounded-2xl shadow-lg shadow-[#008080]/20'>
            <TrendingUp className='text-[#FFFFF0]' />
          </div>
          <div>
            <h3 className='text-2xl font-black text-[#333333]'>Daily Ledger</h3>
            <p className='text-slate-500 text-sm'>Extracted Business Data</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <ExportButton data={data} />
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className='flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl text-red-500 font-bold transition-all'
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='bg-red-500/5 border-b border-red-500/10 overflow-hidden'
          >
            <div className='p-6 flex items-center justify-between'>
              <p className='text-red-600 font-bold'>Delete this entry permanently?</p>
              <div className='flex gap-3'>
                <button onClick={() => setShowDeleteConfirm(false)} className='px-5 py-2 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-all'>
                  Cancel
                </button>
                <button onClick={handleDelete} className='px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-500/20'>
                  Yes, Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='p-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Left: Items */}
        <div className='space-y-6'>
          <h4 className='text-[#008080] font-bold uppercase tracking-widest text-xs flex items-center gap-2'>
            <Tag size={14} /> Items Sold
          </h4>
          <div className='space-y-3'>
            {data.ledger_entry.items_sold.map((item: any, i: number) => (
              <div key={i} className='bg-white/40 p-4 rounded-3xl border border-[#008080]/10 flex justify-between items-center group hover:bg-white/60 transition-all'>
                <div>
                  <p className='text-[#333333] font-bold'>{item.name}</p>
                  <p className='text-slate-500 text-xs mt-1'>{item.qty} units @ ₹{item.price}</p>
                </div>
                <p className='text-[#008080] font-mono font-bold text-lg'>₹{item.qty * item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stats & Flags */}
        <div className='space-y-8'>
          <div>
            <h4 className='text-slate-500 font-bold uppercase tracking-widest text-xs mb-4'>Summary</h4>
            <div className='bg-[#008080]/10 border border-[#008080]/20 p-8 rounded-[2.5rem] flex flex-col items-center'>
              <span className='text-[#008080] text-sm font-bold uppercase mb-2 tracking-tighter'>Total Earnings</span>
              <div className='flex items-center gap-1 text-[#008080]'>
                 <IndianRupee size={28} className='font-bold' />
                 <span className='text-5xl font-black font-mono leading-none'>{data.ledger_entry.earnings}</span>
              </div>
            </div>
          </div>

          {data.ledger_entry.flags && data.ledger_entry.flags.length > 0 && (
            <div className='space-y-4'>
              <h4 className='text-[#FF7F50] font-bold uppercase tracking-widest text-xs flex items-center gap-2'>
                <AlertTriangle size={14} /> Review Required
              </h4>
              {data.ledger_entry.flags.map((flag: any, i: number) => (
                <div key={i} className='bg-[#FF7F50]/10 border border-[#FF7F50]/20 p-4 rounded-2xl flex gap-3 items-start'>
                  <AlertTriangle className='text-[#FF7F50] shrink-0' size={18} />
                  <div>
                    <p className='text-[#333333] text-sm font-bold'>{flag.field}</p>
                    <p className='text-slate-600 text-xs text-balance'>{flag.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Section with Translate */}
      <div className='p-8 bg-[#008080]/5 border-t border-[#008080]/10'>
        <div className='flex items-center justify-between mb-4'>
          <h4 className='text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2'>
            <MessageSquare size={14} /> Original Voice Notes
          </h4>
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008080]/10 border border-[#008080]/20 text-[#008080] font-bold text-sm hover:bg-[#008080]/20 transition-all disabled:opacity-50'
          >
            {isTranslating ? (
              <><Loader2 size={14} className='animate-spin' /> Translating...</>
            ) : translated ? (
              <><Languages size={14} /> Show Original</>
            ) : (
              <><Languages size={14} /> Translate to English</>
            )}
          </button>
        </div>

        <AnimatePresence mode='wait'>
          {translated ? (
            <motion.div key='translated' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className='bg-white/60 border border-[#008080]/10 p-5 rounded-2xl mb-3'>
                <p className='text-xs text-[#008080] font-bold uppercase tracking-wider mb-2'>English Translation</p>
                <p className='text-[#333333] text-sm leading-relaxed font-medium'>{translated}</p>
              </div>
              <p className='text-slate-500 italic text-xs leading-relaxed'>Original: "{data.transcript}"</p>
            </motion.div>
          ) : (
            <motion.p key='original' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='text-[#333333]/80 italic text-sm leading-relaxed'>
              "{data.transcript}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
