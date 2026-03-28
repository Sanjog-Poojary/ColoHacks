import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Store, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function OnboardingModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (profile: any) => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const shopData = { name, city, business_type: business };
    try {
      const res = await api.post('/shops', shopData);
      onComplete(res.data);
    } catch (err) { console.error('Shop creation failed', err); }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-4'>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className='absolute inset-0 bg-[#333333]/40 backdrop-blur-md'
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className='relative w-full max-w-xl bg-[#FFFFF0] rounded-[3rem] shadow-2xl overflow-hidden border border-[#008080]/10'
          >
            {/* Design Element */}
            <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#008080]/20 to-transparent rounded-full -mr-32 -mt-32' />
            
            <div className='p-12 relative z-10'>
              <div className='mb-10 text-center'>
                <div className='w-20 h-20 bg-gradient-to-br from-[#008080] to-[#20B2AA] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#008080]/20'>
                  <Store className='text-[#FFFFF0]' size={36} />
                </div>
                <h2 className='text-3xl font-black text-[#333333] tracking-tight'>Welcome to VyapaarVaani</h2>
                <p className='text-slate-500 mt-2 font-medium'>Let's set up your first shop.</p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-4'>
                  <div className='relative'>
                    <Store className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
                    <input 
                      required type='text' placeholder='Shop Name (e.g. Chai Stall, Jai Hind Store)' 
                      value={name} onChange={(e) => setName(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-[#333333] placeholder:text-slate-400 focus:border-[#008080] focus:bg-white transition-all outline-none'
                    />
                  </div>
                  <div className='relative'>
                    <MapPin className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
                    <input 
                      required type='text' placeholder='City' 
                      value={city} onChange={(e) => setCity(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-[#333333] placeholder:text-slate-400 focus:border-[#008080] focus:bg-white transition-all outline-none'
                    />
                  </div>
                  <div className='relative'>
                    <Store className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
                    <input 
                      required type='text' placeholder='Business Category (e.g. Retail, Food)' 
                      value={business} onChange={(e) => setBusiness(e.target.value)}
                      className='w-full bg-slate-100 border border-slate-200 rounded-2xl py-5 pl-14 pr-6 text-[#333333] placeholder:text-slate-400 focus:border-[#008080] focus:bg-white transition-all outline-none'
                    />
                  </div>
                </div>

                <button 
                  type='submit' 
                  disabled={isLoading}
                  className='w-full bg-[#008080] hover:bg-[#006666] text-[#FFFFF0] font-black py-5 rounded-2xl shadow-xl shadow-[#008080]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 transform active:scale-95'
                >
                  {isLoading ? (
                    <Loader2 className='animate-spin' size={24} />
                  ) : (
                    <>
                      <span>Get Started</span>
                      <ArrowRight size={20} />
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
