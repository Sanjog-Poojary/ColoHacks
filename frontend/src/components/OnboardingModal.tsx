import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Store, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

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
      const res = await axios.post('http://localhost:8000/api/shops', shopData);
      onComplete(res.data);
    } catch (err) { console.error('Shop creation failed', err); }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-6'>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className='absolute inset-0 bg-slate-950/80 backdrop-blur-xl'
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className='relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden'
          >
            {/* Decorative background circle */}
            <div className='absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl' />
            
            <div className='relative space-y-8'>
              <div className='space-y-2'>
                <h2 className='text-4xl font-black text-white tracking-tight'>Welcome to VyapaarVaani</h2>
                <p className='text-slate-400 font-medium'>Let\'s set up your digital shop profile.</p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-4'>
                  <div className='relative'>
                    <User className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-500' size={20} />
                    <input 
                      required type='text' placeholder='Your Name' 
                      value={name} onChange={(e) => setName(e.target.value)}
                      className='w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none'
                    />
                  </div>
                  <div className='relative'>
                    <MapPin className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-500' size={20} />
                    <input 
                      required type='text' placeholder='City' 
                      value={city} onChange={(e) => setCity(e.target.value)}
                      className='w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none'
                    />
                  </div>
                  <div className='relative'>
                    <Store className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-500' size={20} />
                    <input 
                      required type='text' placeholder='Business Type (e.g. Chai Stall, Fruit Cart)' 
                      value={business} onChange={(e) => setBusiness(e.target.value)}
                      className='w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none'
                    />
                  </div>
                </div>

                <button 
                  type='submit' disabled={isLoading}
                  className='w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50'
                >
                  {isLoading ? <Loader2 className='animate-spin' /> : <><ArrowRight size={20} /> Start Recording Sales</>}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
