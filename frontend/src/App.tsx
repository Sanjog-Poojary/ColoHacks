import React, { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import LedgerCard from './components/LedgerCard';
import LedgerList from './components/LedgerList';
import BusinessInsights from './components/BusinessInsights';
import OnboardingModal from './components/OnboardingModal';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { LayoutList, Mic2, Sparkles, User, MapPin } from 'lucide-react';

function App() {
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState<'record' | 'history' | 'insights'>('record');
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchData = async () => {
    try {
      if (view === 'history') {
        const res = await axios.get('http://localhost:8000/api/ledger');
        setHistory(res.data);
      }
      if (view === 'insights') {
        const res = await axios.get('http://localhost:8000/api/insights');
        setInsightsData(res.data);
      }
    } catch (e) { console.error('Fetch failed', e); }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/profile');
      if (res.data) setProfile(res.data);
      else setShowOnboarding(true);
    } catch (e) { setShowOnboarding(true); }
  };

  useEffect(() => { fetchProfile(); fetchData(); }, [view]);

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30'>
      <OnboardingModal isOpen={showOnboarding} onComplete={(p) => { setProfile(p); setShowOnboarding(false); }} />
      
      {/* Navbar */}
      <nav className='fixed top-0 w-full z-[100] bg-slate-900/50 backdrop-blur-xl border-b border-white/5'>
        <div className='max-w-7xl mx-auto px-6 h-28 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20'>
              <Mic2 className='text-white' size={28} />
            </div>
            <div>
              <span className='text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>VyapaarVaani</span>
              {profile && (
                <div className='flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1'>
                  <span className='flex items-center gap-1'><User size={10}/> {profile.name}</span>
                  <span className='flex items-center gap-1'><MapPin size={10}/> {profile.city}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className='bg-slate-800/50 p-1.5 rounded-3xl flex gap-1 border border-white/10'>
            <NavTab active={view === 'record'} onClick={() => setView('record')} icon={<Mic2 size={18} />} label='Record' />
            <NavTab active={view === 'history'} onClick={() => setView('history')} icon={<LayoutList size={18} />} label='History' />
            <NavTab active={view === 'insights'} onClick={() => setView('insights')} icon={<Sparkles size={18} />} label='Insights' />
          </div>
        </div>
      </nav>

      <main className='pt-48 pb-20 px-6 flex flex-col items-center gap-12'>
        <AnimatePresence mode='wait'>
          {view === 'record' ? (
            <motion.div 
              key='record-view'
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className='flex flex-col items-center gap-10 w-full'
            >
              <VoiceRecorder 
                onResult={(res) => { setCurrentEntry(res); fetchData(); }} 
                onStart={() => { setCurrentEntry(null); setIsLoading(true); }}
              />
              
              {isLoading && !currentEntry && (
                <div className='flex items-center gap-3 bg-blue-500/10 px-6 py-3 rounded-full border border-blue-500/20 animate-pulse'>
                  <div className='w-2 h-2 bg-blue-400 rounded-full' />
                  <span className='text-blue-400 font-bold'>Processing voice...</span>
                </div>
              )}
              
              {currentEntry && (
                <LedgerCard data={currentEntry} onDelete={() => { setCurrentEntry(null); fetchData(); }} />
              )}
            </motion.div>
          ) : view === 'history' ? (
            <motion.div 
              key='history-view'
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className='w-full max-w-4xl'
            >
              <LedgerList 
                history={history} 
                onSelect={(entry) => {
                  setCurrentEntry(entry);
                  setView('record');
                }} 
                onRefresh={fetchData}
              />
            </motion.div>
          ) : (
            <motion.div 
              key='insights-view'
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className='w-full flex justify-center'
            >
              <BusinessInsights data={insightsData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={'px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold ' + (active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white')}
    >
      {icon} {label}
    </button>
  );
}

export default App;
