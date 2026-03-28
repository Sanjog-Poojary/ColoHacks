import { useState, useEffect } from 'react';
import { Store, ChevronDown, Trash2, Building2, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

interface ShopSwitcherProps {
  activeShopId: string | null;
  onSwitch: (id: string | null) => void;
  onAddShop: () => void;
  onShopChange?: (name: string, businessType: string) => void;
}

export default function ShopSwitcher({ activeShopId, onSwitch, onAddShop, onShopChange }: ShopSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = await api.get('/shops');
        setShops(res.data);
      } catch (err) { console.error('Failed to fetch shops', err); }
      setLoading(false);
    };
    fetchShops();
  }, []);

  const activeShop = shops.find(s => s.shop_id === activeShopId);

  useEffect(() => {
    if (activeShop && onShopChange) {
      onShopChange(activeShop.name, activeShop.business_type);
    }
  }, [activeShop, onShopChange]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this shop? All its records will be lost.')) {
      try {
        await api.delete(`/shops/${id}`);
        setShops(shops.filter(s => s.shop_id !== id));
        if (activeShopId === id) onSwitch('');
      } catch (err) { console.error('Delete failed', err); }
    }
  };

  return (
    <div className='relative'>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-3 px-5 py-3.5 bg-[#FDF5E6] hover:bg-white text-[#008080] border border-[#008080]/10 rounded-2xl transition-all shadow-sm'
      >
        <Store size={20} />
        <div className='text-left'>
          <p className='text-[10px] text-slate-500 font-bold uppercase tracking-widest'>Active Business</p>
          <span className='font-black text-sm text-[#333333] uppercase'>{activeShop ? activeShop.business_type : 'Select Shop'}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-300 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className='fixed inset-0 z-[100]' onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className='absolute left-0 mt-3 w-72 bg-[#FFFFF0] border border-[#008080]/10 rounded-[2rem] shadow-2xl overflow-hidden z-[110]'
            >
              <div className='p-3 space-y-1'>
                {shops.map((shop) => (
                  <button
                    key={shop.shop_id}
                    onClick={() => { onSwitch(shop.shop_id); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      activeShopId === shop.shop_id 
                        ? 'bg-[#008080] text-[#FFFFF0] shadow-lg shadow-[#008080]/20' 
                        : 'text-[#333333] hover:bg-[#008080]/10'
                    }`}
                  >
                    <div className='flex items-center gap-3 text-left'>
                      <Building2 size={18} className={activeShopId === shop.shop_id ? 'text-[#FFFFF0]' : 'text-[#008080]'} />
                      <div>
                        <p className='font-black text-xs uppercase tracking-tight'>{shop.business_type}</p>
                        <p className={`text-[10px] font-medium ${activeShopId === shop.shop_id ? 'text-[#FFFFF0]/70' : 'text-slate-500'}`}>{shop.name}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {activeShopId === shop.shop_id && <div className='w-2 h-2 bg-[#FFFFF0] rounded-full animate-pulse' />}
                      <button 
                        onClick={(e) => handleDelete(e, shop.shop_id)}
                        className={`p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all ${activeShopId === shop.shop_id ? 'text-white/40' : 'text-[#999999]'}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => { onAddShop(); setIsOpen(false); }}
                  className='w-full flex items-center gap-3 p-4 text-[#008080] hover:bg-[#008080]/5 rounded-2xl transition-all border border-dashed border-[#008080]/20 mt-2 font-bold text-sm'
                >
                  <PlusCircle size={18} />
                  <span>Add New Shop</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
