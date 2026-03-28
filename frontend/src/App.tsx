import React, { useState } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import LedgerCard from './components/LedgerCard';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Settings, PieChart, FileDown } from 'lucide-react';

function App() {
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('record');

  return (
    <div className='min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden'>
      {/* Background Decor */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]' />
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]' />
      </div>

      <nav className='relative z-10 p-6 flex justify-between items-center max-w-5xl mx-auto'>
        <h1 className='text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter'>VoiceTrace</h1>
        <div className='flex gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-xl'>
          {['record', 'ledger', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ' + (activeTab === tab ? 'bg-blue-500 text-white shadow-lg' : 'hover:bg-slate-700/50 text-slate-400')}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className='relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-16'>
        <AnimatePresence mode='wait'>
          {activeTab === 'record' && (
            <motion.section
              key='record'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='w-full flex flex-col items-center gap-12'
            >
              <VoiceRecorder onResult={(data) => { setResult(data); setActiveTab('ledger'); }} />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl'>
                {[ { icon: LayoutList, title: 'Smart Ledger', desc: 'Auto-extracted from your voice' }, { icon: PieChart, title: 'Weekly Patterns', desc: 'Identify your best selling items' }, { icon: FileDown, title: 'Export PDF', desc: 'Loan-ready income statements' } ].map((f, i) => (
                  <div key={i} className='p-6 rounded-3xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm' >
                    <f.icon className='text-blue-400 mb-4 h-8 w-8' />
                    <h3 className='font-bold text-lg text-white'>{f.title}</h3>
                    <p className='text-slate-400 text-sm mt-2'>{f.desc}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeTab === 'ledger' && result && (
            <motion.section
              key='ledger'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='w-full flex flex-col items-center'
            >
              <LedgerCard data={result} />
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
export default App;