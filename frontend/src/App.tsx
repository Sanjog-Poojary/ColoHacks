import { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import LedgerCard from './components/LedgerCard';
import LedgerList from './components/LedgerList';
import BusinessInsights from './components/BusinessInsights';
import OnboardingModal from './components/OnboardingModal';
import Login from './components/Login';
import ShopSwitcher from './components/ShopSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Mic2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { auth } from './lib/firebaseClient';
import api from './lib/api';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeShopId, setActiveShopId] = useState<string | null>(localStorage.getItem('activeShopId'));
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [view, setView] = useState<'record' | 'history' | 'insights'>('record');
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);


  const fetchData = async () => {
    if (!user || !activeShopId) return;
    try {
      if (view === 'history') {
        const res = await api.get(`/ledger?shop_id=${activeShopId}`);
        setHistory(res.data);
      }
      if (view === 'insights') {
        const res = await api.get(`/insights?shop_id=${activeShopId}`);
        setInsightsData(res.data);
      }
    } catch (e) {
      console.error('Fetch failed', e);
    }
  };

  useEffect(() => {
    if (activeShopId) {
      localStorage.setItem('activeShopId', activeShopId);
      fetchData();
    }
  }, [view, activeShopId]);

  if (authLoading) return <div className='min-h-screen bg-slate-950 flex items-center justify-center'><span className='text-blue-500 animate-pulse font-black text-2xl uppercase italic'>VyapaarVaani...</span></div>;
  if (!user) return <Login />;

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30'>
      <OnboardingModal isOpen={showOnboarding} onComplete={(p) => { 
        setActiveShopId(p.shop_id);
        setShowOnboarding(false);
        fetchData();
      }} />
      
      {/* Navbar */}
      <nav className='fixed top-0 w-full z-[100] bg-slate-900/50 backdrop-blur-xl border-b border-white/5'>
        <div className='max-w-7xl mx-auto px-6 h-28 flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20'>
                <Mic2 className='text-white' size={28} />
              </div>
              <div>
                <span className='text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 italic uppercase'>VyapaarVaani</span>
                <p className='text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1'>{user.email}</p>
              </div>
            </div>
            
            <div className='h-10 w-px bg-white/10 mx-2' />

            <ShopSwitcher 
              activeShopId={activeShopId} 
              onSwitch={setActiveShopId} 
              onAddShop={() => setShowOnboarding(true)} 
            />
          </div>
          
          <div className='flex items-center gap-6'>
            <div className='bg-slate-800/50 p-1.5 rounded-3xl flex gap-1 border border-white/10 shadow-xl'>
              <NavTab active={view === 'record'} onClick={() => setView('record')} icon={<Mic2 size={18} />} label='Record' />
              <NavTab active={view === 'history'} onClick={() => setView('history')} icon={<LayoutList size={18} />} label='History' />
              <NavTab active={view === 'insights'} onClick={() => setView('insights')} icon={<Sparkles size={18} />} label='Insights' />
            </div>

            <button 
              onClick={() => auth.signOut()}
              className='p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg'
              title='Logout'
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className='pt-48 pb-20 px-6 flex flex-col items-center gap-12'>
        {!activeShopId ? (
          <div className='flex flex-col items-center gap-6 py-20 text-center'>
            <div className='bg-blue-500/10 p-8 rounded-[3rem] border border-blue-500/20 shadow-2xl'>
              <Store className='text-blue-400 w-16 h-16' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-3xl font-black text-white'>No Shop Selected</h2>
              <p className='text-slate-400'>Create your first shop to start managing your business.</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(true)}
              className='bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-5 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all transform active:scale-95'
            >
              Create My First Shop
            </button>
          </div>
        ) : (
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
        )}
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

const Store = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
);

export default App;
