import React, { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import LedgerCard from './components/LedgerCard';
import LedgerList from './components/LedgerList';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { LayoutList, Mic2 } from 'lucide-react';

function App() {
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'record' | 'history'>('record');
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/ledger');
      setHistory(res.data);
    } catch (e) { console.error('History fetch failed', e); }
  };

  useEffect(() => { if (view === 'history') fetchHistory(); }, [view]);

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30'>
      {/* Navbar */}
      <nav className='fixed top-0 w-full z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5'>
        <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20'>
              <Mic2 className='text-white' size={24} />
            </div>
            <span className='text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>VoiceTrace</span>
          </div>
          
          <div className='bg-slate-800/50 p-1 rounded-2xl flex gap-1 border border-white/5'>
            <button 
              onClick={() => setView('record')} 
              className={'px-6 py-2 rounded-xl flex items-center gap-2 transition-all ' + (view === 'record' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white')}
            >
              <Mic2 size={18} /> Record
            </button>
            <button 
              onClick={() => setView('history')} 
              className={'px-6 py-2 rounded-xl flex items-center gap-2 transition-all ' + (view === 'history' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white')}
            >
              <LayoutList size={18} /> history
            </button>
          </div>
        </div>
      </nav>

      <main className='pt-32 pb-20 px-6 flex flex-col items-center gap-12'>
        <AnimatePresence mode='wait'>
          {view === 'record' ? (
            <motion.div 
              key='record-view'
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className='flex flex-col items-center gap-10 w-full'
            >
              <VoiceRecorder 
                onResult={(res) => { setCurrentEntry(res); fetchHistory(); }} 
                onStart={() => { setCurrentEntry(null); setIsLoading(true); }}
              />
              
              {isLoading && !currentEntry && (
                <div className='flex items-center gap-3 bg-blue-500/10 px-6 py-3 rounded-full border border-blue-500/20 animate-pulse'>
                  <div className='w-2 h-2 bg-blue-400 rounded-full' />
                  <span className='text-blue-400 font-bold'>Processing your voice...</span>
                </div>
              )}
              
              {currentEntry && (
                <LedgerCard data={currentEntry} />
              )}
            </motion.div>
          ) : (
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
