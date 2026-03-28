import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowRight, Tag, Trash2 } from 'lucide-react';
import api from '../lib/api';

export default function LedgerList({ history, onSelect, onRefresh }: { history: any[]; onSelect: (entry: any) => void; onRefresh: () => void }) {
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
        <History className='text-blue-400' />
        <h2 className='text-2xl font-black text-white'>Recent Activity</h2>
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
              className='group bg-slate-800/30 border border-slate-700/50 p-5 rounded-3xl backdrop-blur-sm cursor-pointer hover:bg-slate-700/40 transition-all flex items-center justify-between shadow-xl'
            >
              <div className='flex items-center gap-5'>
                <div className='bg-blue-500/10 p-4 rounded-2xl'>
                  <Tag className='text-blue-400' />
                </div>
                <div>
                  <p className='text-white font-bold'>
                    {entry.ledger_entry?.items_sold?.length || 0} item(s) sold
                  </p>
                  <p className='text-slate-400 text-xs mt-1 uppercase tracking-wider'>
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <p className='text-emerald-400 font-mono font-black text-xl'>₹{entry.ledger_entry?.earnings || 0}</p>
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className={`p-2.5 rounded-xl transition-all ${
                    deletingId === entry.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                      : 'bg-slate-700/50 text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
                  }`}
                  title={deletingId === entry.id ? 'Click again to confirm' : 'Delete entry'}
                >
                  <Trash2 size={16} />
                </button>
                <ArrowRight className='text-slate-600 group-hover:text-blue-400 transition-colors' />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {history.length === 0 && (
           <div className='text-center py-20 bg-slate-800/20 rounded-[2.5rem] border border-dashed border-slate-700'>
             <p className='text-slate-500 font-medium'>No entries yet. Record your first sale!</p>
           </div>
        )}
      </div>
    </div>
  );
}
