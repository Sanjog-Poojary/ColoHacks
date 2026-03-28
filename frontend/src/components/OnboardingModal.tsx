import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Store, ArrowRight, Loader2, Save } from 'lucide-react';
import api from '../lib/api';

export default function OnboardingModal({ isOpen, onComplete, initialData, hasExistingShops, onClose }: { 
  isOpen: boolean; 
  onComplete: (profile: any) => void;
  initialData?: any;
  hasExistingShops?: boolean;
  onClose?: () => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCity(initialData.city || '');
      setBusiness(initialData.business_type || '');
    } else {
      setName('');
      setCity('');
      setBusiness('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const shopData = { name, city, business_type: business };
    try {
      if (initialData?.shop_id) {
        // --- EDIT MODE ---
        const res = await api.patch(`/shops/${initialData.shop_id}`, shopData);
        onComplete(res.data);
      } else {
        // --- CREATE MODE ---
        const res = await api.post('/shops', shopData);
        onComplete(res.data);
      }
    } catch (err) { 
      console.error('Shop action failed', err); 
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-4'>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className='absolute inset-0 bg-[#333333]/40 backdrop-blur-md'
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='relative w-full max-w-xl bg-[#FFFFF0] rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-[#008080]/10'
          >
            {/* Design Element */}
            <div className='absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#008080]/20 to-transparent rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32' />
            
            <div className='p-6 md:p-12 relative z-10'>
              <div className='mb-8 md:mb-10 text-center'>
                <div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#008080] to-[#20B2AA] rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-[#008080]/20'>
                  <Store className='text-[#FFFFF0]' size={32} />
                </div>
                <h2 className='text-2xl md:text-3xl font-black text-[#333333] tracking-tight leading-none'>
                  {initialData ? 'Update Business Info' : (hasExistingShops ? 'Expand Your Business' : 'Welcome to VyapaarVaani')}
                </h2>
                <p className='text-slate-600 mt-2 font-bold text-sm md:text-base'>
                  {initialData ? 'Correct your shop details below.' : (hasExistingShops ? 'Add a new location or store.' : "Let's set up your first shop.")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4 md:space-y-6'>
                <div className='space-y-3 md:space-y-4'>
                  <div className='relative'>
                    <Store className='absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-500' size={18} />
                    <input 
                      required type='text' placeholder='Shop Name (e.g. Chai Stall)' 
                      value={name} onChange={(e) => setName(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-xl md:rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-6 text-[#333333] placeholder:text-slate-500 font-bold focus:border-[#008080] focus:bg-white transition-all outline-none text-sm md:text-base'
                    />
                  </div>
                  <div className='relative'>
                    <MapPin className='absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-500' size={18} />
                    <input 
                      required type='text' placeholder='City' 
                      value={city} onChange={(e) => setCity(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-xl md:rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-6 text-[#333333] placeholder:text-slate-500 font-bold focus:border-[#008080] focus:bg-white transition-all outline-none text-sm md:text-base'
                    />
                  </div>
                  <div className='relative'>
                    <Store className='absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-500' size={18} />
                    <input 
                      required type='text' placeholder='Business Category (e.g. Retail)' 
                      value={business} onChange={(e) => setBusiness(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-xl md:rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-6 text-[#333333] placeholder:text-slate-500 font-bold focus:border-[#008080] focus:bg-white transition-all outline-none text-sm md:text-base'
                    />
                  </div>
                </div>

                <button 
                  type='submit' 
                  disabled={isLoading}
                  className='w-full bg-[#008080] hover:bg-[#006666] text-[#FFFFF0] font-black py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl shadow-[#008080]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 transform active:scale-95'
                >
                  {isLoading ? (
                    <Loader2 className='animate-spin' size={20} />
                  ) : (
                    <>
                      <span>{initialData ? 'Save Changes' : 'Get Started'}</span>
                      {initialData ? <Save size={20} /> : <ArrowRight size={20} />}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
