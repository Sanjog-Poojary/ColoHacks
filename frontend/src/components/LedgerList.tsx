import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowRight, Tag, Trash2, CalendarDays, Coins } from 'lucide-react';
import api from '../lib/api';
import MonthlyExportButton from './MonthlyExportButton';

export default function LedgerList({ history, onSelect, onRefresh, title }: { history: any[]; onSelect: (entry: any) => void; onRefresh: () => void; title?: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDay, setDeletingDay] = useState<string | null>(null);

  // Group history by Month -> Day
  const groupedMonths = useMemo(() => {
    const months: { [monthStr: string]: { 
      days: { [dayStr: string]: { entries: any[], totalEarnings: number, dateObj: Date } },
      totalMonthlyEarnings: number,
      monthDate: Date,
      allEntries: any[]
    } } = {};
    
    history.forEach(entry => {
      if (!entry.createdAt) return;
      const d = new Date(entry.createdAt);
      
      const monthStr = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
      const dayStr = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      if (!months[monthStr]) {
        months[monthStr] = { days: {}, totalMonthlyEarnings: 0, monthDate: d, allEntries: [] };
      }
      
      if (!months[monthStr].days[dayStr]) {
        months[monthStr].days[dayStr] = { entries: [], totalEarnings: 0, dateObj: d };
      }
      
      const earnings = (entry.ledger_entry?.earnings || 0);
      months[monthStr].days[dayStr].entries.push(entry);
      months[monthStr].days[dayStr].totalEarnings += earnings;
      months[monthStr].totalMonthlyEarnings += earnings;
      months[monthStr].allEntries.push(entry);
    });

    // Sort months descending
    return Object.entries(months).sort((a, b) => b[1].monthDate.getTime() - a[1].monthDate.getTime());
  }, [history]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        await api.delete(`/ledger/${id}`);
        onRefresh();
      } catch (err) { console.error('Delete failed', err); }
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
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
    <div className='w-full max-w-4xl space-y-12 pb-20'>
      <div className='flex items-center justify-between gap-3 mb-6'>
        <div className='flex items-center gap-3'>
          <History className='text-[#008080]' size={28} />
          <h2 className='text-3xl md:text-4xl font-black text-[#333333] uppercase italic tracking-tighter self-end'>{title || 'Business'} History</h2>
        </div>
        <div className='hidden sm:flex items-center gap-2 px-4 py-2 bg-[#008080]/10 rounded-2xl border border-[#008080]/20'>
          <Coins size={16} className='text-[#008080]' />
          <span className='text-[10px] font-black uppercase text-[#008080] tracking-widest'>All Records</span>
        </div>
      </div>

      <div className='space-y-16'>
        <AnimatePresence>
          {groupedMonths.map(([monthStr, monthGroup], mIdx) => (
            <motion.section
              key={monthStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mIdx * 0.1 }}
              className='space-y-10'
            >
              {/* MONTH HEADER */}
              <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-[#008080]/10 pb-4 relative'>
                <div className='space-y-1'>
                   <h3 className='text-2xl md:text-3xl font-black text-[#333333] uppercase italic'>{monthStr}</h3>
                   <div className='flex items-center gap-2'>
                     <span className='w-2 h-2 bg-[#008080] rounded-full' />
                     <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
                        {monthGroup.allEntries.length} total entries — Rs. {monthGroup.totalMonthlyEarnings.toLocaleString('en-IN')} earned
                     </p>
                   </div>
                </div>
                
                <MonthlyExportButton 
                  monthName={monthStr} 
                  entries={monthGroup.allEntries} 
                  shopName={title || 'My Business'} 
                />
              </div>

              {/* DAYS IN MONTH */}
              <div className='space-y-8'>
                {Object.entries(monthGroup.days)
                  .sort((a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime())
                  .map(([dateStr, dayGroup], dIdx) => (
                    <div key={dateStr} className='space-y-4'>
                      {/* Daily Header */}
                      <div className='flex items-center justify-between gap-4 bg-white/40 border border-slate-100 px-6 py-4 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-4'>
                          <div className='bg-[#008080]/10 p-3 rounded-2xl'>
                            <CalendarDays className='text-[#008080]' size={20} />
                          </div>
                          <div>
                            <h4 className='font-black text-[#333333] text-sm md:text-lg uppercase tracking-tight'>{dateStr}</h4>
                            <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>{dayGroup.entries.length} recordings</p>
                          </div>
                        </div>
                        
                        <div className='flex items-center gap-6'>
                          <div className='text-right hidden sm:block'>
                            <p className='text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1'>Daily Yield</p>
                            <p className='text-[#008080] font-black text-xl font-mono'>Rs. {dayGroup.totalEarnings.toLocaleString('en-IN')}</p>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteDay(e, dateStr, dayGroup.entries)}
                            className={`p-3 rounded-2xl transition-all ${
                              deletingDay === dateStr
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105 px-6 font-black text-xs uppercase'
                                : 'bg-rose-50 text-rose-500 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            {deletingDay === dateStr ? 'Confirm?' : <Trash2 size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Individual Transactions */}
                      <div className='grid grid-cols-1 gap-3 md:gap-4 pl-0 md:pl-8'>
                        {dayGroup.entries.map((entry, i) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSelect(entry)}
                            className='group bg-white border border-slate-100 p-5 md:p-6 rounded-3xl hover:bg-[#FDF5E6]/50 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-x-2'
                          >
                            <div className='flex items-center gap-4 md:gap-6 min-w-0'>
                              <div className='bg-slate-50 p-4 rounded-2xl group-hover:bg-[#008080]/10 transition-colors'>
                                <Tag className='text-slate-400 group-hover:text-[#008080]' size={20} />
                              </div>
                              <div className='min-w-0'>
                                <p className='text-[#333333] font-black text-base md:text-lg italic uppercase tracking-tighter truncate'>
                                  {entry.ledger_entry?.items_sold?.length > 0 
                                     ? `${entry.ledger_entry.items_sold.length} item(s) recorded`
                                     : entry.ledger_entry?.expenses?.length > 0
                                        ? "Expense Entry"
                                        : "Voice Entry"
                                  }
                                </p>
                                <p className='text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-widest'>
                                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-4 md:gap-6 px-1'>
                              <div className='text-right'>
                                <p className='text-[#20B2AA] font-mono font-black text-xl md:text-2xl'>₹{entry.ledger_entry?.earnings || 0}</p>
                              </div>
                              <div className='flex items-center gap-3'>
                                <button
                                  onClick={(e) => handleDelete(e, entry.id)}
                                  className={`p-2.5 rounded-xl transition-all ${
                                    deletingId === entry.id
                                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-110'
                                      : 'bg-slate-100 text-slate-300 hover:text-red-500 hover:bg-red-500/10 md:opacity-0 md:group-hover:opacity-100'
                                  }`}
                                >
                                  <Trash2 size={18} />
                                </button>
                                <ArrowRight size={20} className='text-slate-200 group-hover:text-[#008080] transition-all hidden sm:block' />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>

        {history.length === 0 && (
           <div className='text-center py-32 bg-[#FDF5E6]/40 rounded-[4rem] border-2 border-dashed border-[#008080]/10 flex flex-col items-center gap-6'>
             <div className='bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-xl border border-slate-100'>
               <CalendarDays className='text-slate-300' size={32} />
             </div>
             <div className='space-y-1'>
               <p className='text-slate-600 font-black text-xl uppercase italic'>Clear Skies</p>
               <p className='text-slate-400 text-sm font-medium'>No entries found. Start recording to build your legacy!</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
