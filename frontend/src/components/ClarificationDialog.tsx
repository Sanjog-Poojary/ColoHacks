import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Hash, IndianRupee, MessageSquareQuote } from 'lucide-react';
import api from '../lib/api';

interface ClarificationProps {
  entry: any;
  onClose: (updatedEntry?: any) => void;
}

export default function ClarificationDialog({ entry, onClose }: ClarificationProps) {
  const [editedEntry, setEditedEntry] = useState(JSON.parse(JSON.stringify(entry.ledger_entry)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editedEntry.items_sold];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total earnings
    const totalItems = newItems.reduce((acc: number, it: any) => acc + (Number(it.qty) * Number(it.price)), 0);
    const totalExpenses = (editedEntry.expenses || []).reduce((acc: number, ex: any) => acc + Number(ex.amount), 0);
    
    setEditedEntry({ 
      ...editedEntry, 
      items_sold: newItems,
      earnings: totalItems - totalExpenses 
    });
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked for entry:', entry.id);
    setIsSubmitting(true);
    try {
      console.log('Sending PATCH to /ledger/' + entry.id, editedEntry);
      const res = await api.patch(`/ledger/${entry.id}`, { ledger_entry: editedEntry });
      console.log('PATCH success:', res.data);
      // Clear flags locally so the badge disappears in History
      const finalizedEntry = { ...editedEntry, flags: [] };
      onClose(finalizedEntry);
    } catch (err: any) {
      console.error('Clarification failed:', err.response?.data || err.message);
      alert('Failed to save corrections. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6'>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className='absolute inset-0 bg-[#333333]/60 backdrop-blur-md'
        onClick={() => onClose()}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className='relative w-full max-w-2xl bg-[#FFFFF0] rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#008080]/20 flex flex-col max-h-[90vh]'
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-[#008080] to-[#20B2AA] p-6 md:p-8 text-[#FFFFF0]'>
          <div className='flex items-center gap-4 mb-2'>
            <div className='bg-[#FFFFF0]/20 p-3 rounded-2xl'>
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className='text-2xl font-black uppercase tracking-tight italic'>Action Required</h2>
              <p className='text-[#FFFFF0]/80 text-xs font-bold uppercase tracking-widest'>Clarify Ambiguous Data</p>
            </div>
          </div>
        </div>

        <div className='p-6 md:p-8 overflow-y-auto space-y-8 scrollbar-hide'>
          {/* Transcript Note */}
          <div className='bg-[#008080]/5 border border-[#008080]/10 p-5 rounded-3xl relative'>
            <MessageSquareQuote className='absolute -top-3 -left-3 text-[#008080] bg-[#FFFFF0] rounded-full' size={24} />
            <p className='text-[#333333] italic text-sm md:text-base leading-relaxed'>
              "{entry.transcript}"
            </p>
            <div className='mt-4 flex items-center gap-2'>
              <Info size={14} className='text-[#008080]' />
              <p className='text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-tighter'>Review the flags below and correct the values</p>
            </div>
          </div>

          {/* Flags List as contextual warnings */}
          {entry.ledger_entry.flags && entry.ledger_entry.flags.length > 0 && (
            <div className='space-y-3'>
              {entry.ledger_entry.flags.map((flag: any, i: number) => (
                <div key={i} className='flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl'>
                  <AlertCircle className='text-red-500 shrink-0' size={18} />
                  <p className='text-red-700 text-xs md:text-sm font-medium'>
                    <span className='font-black uppercase mr-2'>{flag.field}:</span> {flag.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Editiable Items */}
          <div className='space-y-6'>
            <h3 className='text-[#008080] font-black uppercase text-sm tracking-widest flex items-center gap-2'>
              <CheckCircle2 size={16} /> Edit Data
            </h3>

            <div className='space-y-4'>
              {editedEntry.items_sold.map((item: any, idx: number) => {
                const isFlagged = entry.ledger_entry.flags?.some((f: any) => 
                  f.field.toLowerCase().includes(item.name.toLowerCase()) || 
                  f.field.toLowerCase().includes('item')
                );

                return (
                  <div key={idx} className={`p-5 rounded-3xl border transition-all ${isFlagged ? 'bg-white border-[#008080] shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                    <div className='flex items-center justify-between mb-4'>
                      <span className='text-xs font-black uppercase text-slate-400'>Item #{idx + 1}</span>
                      {isFlagged && <span className='bg-[#008080] text-[#FFFFF0] text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter'>Needs Check</span>}
                    </div>
                    
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='col-span-2 relative'>
                        <input 
                          type='text' value={item.name} 
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className='w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:border-[#008080] outline-none transition-all'
                          placeholder='Item Name'
                        />
                      </div>
                      <div className='relative'>
                        <Hash className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={14} />
                        <input 
                          type='number' value={item.qty} 
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          className='w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-mono font-bold focus:border-[#008080] outline-none transition-all'
                          placeholder='Qty'
                        />
                      </div>
                      <div className='relative'>
                        <IndianRupee className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={14} />
                        <input 
                          type='number' value={item.price} 
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          className='w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-mono font-bold focus:border-[#008080] outline-none transition-all'
                          placeholder='Price'
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4'>
          <div className='text-left'>
            <p className='text-slate-500 text-[10px] font-black uppercase tracking-widest'>Corrected Total</p>
            <p className='text-3xl font-black text-[#008080] font-mono leading-none mt-1'>₹{editedEntry.earnings}</p>
          </div>
          <div className='flex gap-3'>
            <button 
              onClick={() => onClose()}
              className='px-6 py-4 rounded-2xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-all text-sm'
            >
              Skip
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='px-8 py-4 rounded-2xl bg-[#008080] text-[#FFFFF0] font-black shadow-xl shadow-[#008080]/20 hover:bg-[#006666] transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50'
            >
              {isSubmitting ? 'Saving...' : 'Confirm Ledger'}
              {!isSubmitting && <CheckCircle2 size={18} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
