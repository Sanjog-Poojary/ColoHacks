import React, { useState, useEffect } from 'react';
import { Store, ChevronDown, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function ShopSwitcher({ activeShopId, onSwitch, onAddShop }: { activeShopId: string | null; onSwitch: (id: string) => void; onAddShop: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shops, setShops] = useState<any[]>([]);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops');
      setShops(res.data);
      if (!activeShopId && res.data.length > 0) {
        onSwitch(res.data[0].shop_id);
      }
    } catch (err) { console.error('Shops fetch failed', err); }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const activeShop = shops.find(s => s.shop_id === activeShopId);

  return (
    <div className='relative'>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 border border-white/10 px-5 py-3 rounded-2xl transition-all shadow-xl'
      >
        <div className='bg-blue-500/10 p-2 rounded-xl border border-blue-500/20'>
          <Store size={18} className='text-blue-400' />
        </div>
        <div className='text-left'>
          <p className='text-[10px] text-slate-500 font-bold uppercase tracking-widest'>Current Shop</p>
          <span className='font-black text-sm text-white'>{activeShop ? activeShop.name : 'Select Shop'}</span>
        </div>
        <ChevronDown size={16} className={'text-slate-500 transition-transform ml-2 ' + (isOpen ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className='fixed inset-0 z-[110]' onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.95 }} 
              className='absolute top-full mt-3 right-0 w-64 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-4 z-[120] overflow-hidden backdrop-blur-3xl'
            >
              <div className='space-y-1'>
                {shops.map((shop) => (
                  <button 
                    key={shop.shop_id}
                    onClick={() => { onSwitch(shop.shop_id); setIsOpen(false); }}
                    className={'w-full flex items-center justify-between p-4 rounded-2xl transition-all ' + (activeShopId === shop.shop_id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white')}
                  >
                    <div className='text-left'>
                      <span className='font-bold block'>{shop.name}</span>
                      <span className='text-[10px] opacity-60 uppercase'>{shop.business_type}</span>
                    </div>
                    {activeShopId === shop.shop_id && <Check size={16} />}
                  </button>
                ))}
              </div>
              <div className='mt-3 pt-3 border-t border-white/5'>
                <button 
                  onClick={() => { onAddShop(); setIsOpen(false); }}
                  className='w-full flex items-center gap-3 p-4 rounded-2xl text-blue-400 hover:bg-blue-500/10 transition-all font-bold group'
                >
                  <div className='bg-blue-500/10 p-2 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all'>
                    <Plus size={18} />
                  </div>
                  Add Shop
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
