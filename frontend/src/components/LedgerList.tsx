import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowRight, Tag, Trash2, CalendarDays } from 'lucide-react';
import api from '../lib/api';

export default function LedgerList({ history, onSelect, onRefresh, title }: { history: any[]; onSelect: (entry: any) => void; onRefresh: () => void; title?: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDay, setDeletingDay] = useState<string | null>(null);

  // Group history by normalized date string
  const groupedHistory = useMemo(() => {
    const groups: { [date: string]: { entries: any[], totalEarnings: number, dateObj: Date } } = {};
    
    history.forEach(entry => {
      if (!entry.createdAt) return;
      const d = new Date(entry.createdAt);
      const dateStr = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      if (!groups[dateStr]) {
        groups[dateStr] = { entries: [], totalEarnings: 0, dateObj: d };
      }
      groups[dateStr].entries.push(entry);
      groups[dateStr].totalEarnings += (entry.ledger_entry?.earnings || 0);
    });

    // Sort descending by date
    return Object.entries(groups).sort((a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime());
  }, [history]);

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

  const handleDeleteDay = async (e: React.MouseEvent, dateStr: string, entries: any[]) => {
    e.stopPropagation();
    if (deletingDay === dateStr) {
      try {
        await Promise.all(entries.map(entry => api.delete(`/ledger/${entry.id}`)));
        onRefresh();
      } catch (err) { console.error('Bulk delete failed', err); }
      setDeletingDay(null);
    } else {
      setDeletingDay(dateStr);
      setTimeout(() => setDeletingDay(null), 3000);
    }
  };

  return (
    <div className='w-full max-w-4xl space-y-8'>
      <div className='flex items-center gap-3 mb-2'>
        <History className='text-[#008080]' size={24} />
        <h2 className='text-2xl md:text-3xl font-black text-[#333333] uppercase tracking-tight'>{title || 'Business'} History</h2>
      </div>

      <div className='space-y-8'>
        <AnimatePresence>
          {groupedHistory.map(([dateStr, group], groupIndex) => (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className='space-y-4'
            >
              {/* Daily Header */}
              <div className='flex flex-wrap items-center justify-between gap-4 bg-white/50 border border-slate-200 px-5 py-3 rounded-2xl shadow-sm'>
                <div className='flex items-center gap-3'>
                  <div className='bg-[#008080]/10 p-2 rounded-xl'>
                    <CalendarDays className='text-[#008080]' size={18} />
                  </div>
                  <div>
                    <h3 className='font-black text-[#333333] text-sm md:text-base uppercase tracking-tight'>{dateStr}</h3>
                    <p className='text-xs font-bold text-slate-400'>{group.entries.length} entries</p>
                  </div>
                </div>
                
                <div className='flex items-center gap-4'>
                  <div className='text-right'>
                    <p className='text-[10px] font-black uppercase text-slate-400 tracking-wider'>Daily Total</p>
                    <p className='text-[#008080] font-black text-lg font-mono'>Rs. {group.totalEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  
                  {/* Delete Day Button */}
                  <button
                    onClick={(e) => handleDeleteDay(e, dateStr, group.entries)}
                    className={`p-2 rounded-xl transition-all ${
                      deletingDay === dateStr
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105 px-4 font-bold text-xs'
                        : 'bg-rose-50 text-rose-500 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {deletingDay === dateStr ? 'Confirm?' : <Trash2 size={18} />}
                  </button>
                </div>
              </div>

              {/* Transactions for the day */}
              <div className='grid grid-cols-1 gap-3 md:gap-4 pl-0 md:pl-4'>
                {group.entries.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onSelect(entry)}
                    className='group bg-[#FDF5E6] border border-[#008080]/10 p-4 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-all flex items-center justify-between shadow-md hover:shadow-lg'
                  >
                    <div className='flex items-center gap-3 md:gap-5'>
                      <div className='bg-[#008080]/10 p-3 rounded-xl md:rounded-2xl shrink-0'>
                        <Tag className='text-[#008080]' size={18} />
                      </div>
                      <div className='min-w-0'>
                        <p className='text-[#333333] font-bold text-sm md:text-base'>
                          {entry.ledger_entry?.items_sold?.length || 0} item(s) sold
                        </p>
                        <p className='text-slate-500 text-[10px] md:text-xs mt-0.5 md:mt-1 uppercase tracking-wider truncate'>
                          {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 md:gap-4 shrink-0 px-1'>
                      <p className='text-[#20B2AA] font-mono font-black text-lg md:text-xl'>Rs. {entry.ledger_entry?.earnings || 0}</p>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={(e) => handleDelete(e, entry.id)}
                          className={`p-2 rounded-lg transition-all ${
                            deletingId === entry.id
                              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                              : 'bg-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100'
                          }`}
                          title={deletingId === entry.id ? 'Click again to confirm' : 'Delete single entry'}
                        >
                          <Trash2 size={16} />
                        </button>
                        <ArrowRight size={18} className='text-slate-400 group-hover:text-[#008080] transition-colors hidden sm:block' />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {history.length === 0 && (
           <div className='text-center py-20 bg-[#FDF5E6]/40 rounded-[2.5rem] border border-dashed border-[#008080]/20'>
             <div className='bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100'>
               <CalendarDays className='text-slate-400' size={24} />
             </div>
             <p className='text-slate-500 font-bold'>No entries yet.</p>
             <p className='text-slate-400 text-sm mt-1'>Record your first sale to see your history!</p>
           </div>
        )}
      </div>
    </div>
  );
}

