import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowRight, Tag, Trash2 } from 'lucide-react';
import api from '../lib/api';

export default function LedgerList({ history, onSelect, onRefresh, title }: { history: any[]; onSelect: (entry: any) => void; onRefresh: () => void; title?: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Don't trigger onSelect
    if (deletingId === id) {
      // Second click = confirm
      try {
        await api.delete(`/ledger/${id}`);
        onRefresh();
      } catch (err) { console.error('Delete failed', err); }
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000); // Auto-cancel after 3s
    }
  };

  return (
    <div className='w-full max-w-4xl space-y-6'>
      <div className='flex items-center gap-3 mb-4'>
        <History className='text-[#008080]' />
        <h2 className='text-3xl font-black text-[#333333] uppercase tracking-tight'>{title || 'Business'} History</h2>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        <AnimatePresence>
          {history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(entry)}
              className='group bg-[#FDF5E6] border border-[#008080]/10 p-5 rounded-3xl backdrop-blur-sm cursor-pointer hover:bg-white/60 transition-all flex items-center justify-between shadow-xl'
            >
              <div className='flex items-center gap-5'>
                <div className='bg-[#008080]/10 p-4 rounded-2xl'>
                  <Tag className='text-[#008080]' />
                </div>
                <div>
                  <p className='text-[#333333] font-bold'>
                    {entry.ledger_entry?.items_sold?.length || 0} item(s) sold
                  </p>
                  <p className='text-slate-500 text-xs mt-1 uppercase tracking-wider'>
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <p className='text-[#20B2AA] font-mono font-black text-xl'>₹{entry.ledger_entry?.earnings || 0}</p>
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className={`p-2.5 rounded-xl transition-all ${
                    deletingId === entry.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                      : 'bg-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
                  }`}
                  title={deletingId === entry.id ? 'Click again to confirm' : 'Delete entry'}
                >
                  <Trash2 size={16} />
                </button>
                <ArrowRight className='text-slate-400 group-hover:text-[#008080] transition-colors' />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {history.length === 0 && (
           <div className='text-center py-20 bg-[#FDF5E6]/40 rounded-[2.5rem] border border-dashed border-[#008080]/10'>
             <p className='text-slate-500 font-medium'>No entries yet. Record your first sale!</p>
           </div>
        )}
      </div>
    </div>
  );
}
