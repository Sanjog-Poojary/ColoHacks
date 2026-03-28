import { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import LedgerCard from './components/LedgerCard';
import LedgerList from './components/LedgerList';
import BusinessInsights from './components/BusinessInsights';
import FinancialHealth from './components/FinancialHealth';
import { MiniScoreArc } from './components/FinancialHealth';
import OnboardingModal from './components/OnboardingModal';
import ClarificationDialog from './components/ClarificationDialog';
import Login from './components/Login';
import ShopSwitcher from './components/ShopSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutList, Mic2, Sparkles, HeartPulse, LogOut, WifiOff, RefreshCw, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { auth } from './lib/firebaseClient';
import api from './lib/api';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { flushOfflineQueue, getOfflineQueueCount } from './utils/offlineQueue';

// --- Small UI Components (Defined before App to avoid reference errors) ---

function OfflineBanner({ count, onFlush }: { count: number; onFlush: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
      className='bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-4 text-xs font-bold z-[150] sticky top-0'
    >
      <div className='flex items-center gap-2'>
        <WifiOff size={14} />
        <span>You're offline — entries will sync automatically when connected.</span>
        {count > 0 && <span className='bg-white/20 px-2 py-0.5 rounded-full'>{count} recordings waiting</span>}
      </div>
      <div className='flex items-center gap-3'>
        {count > 0 && <button onClick={onFlush} className='hover:underline flex items-center gap-1'><RefreshCw size={12} /> Sync Now</button>}
        <button onClick={() => setDismissed(true)}><X size={14} /></button>
      </div>
    </motion.div>
  );
}

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={'px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold ' + (active ? 'bg-[#008080] text-[#FFFFF0] shadow-lg shadow-[#008080]/20' : 'text-slate-500 hover:text-[#008080]')}
    >
      {icon} {label}
    </button>
  );
}

function MobileNavTab({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#008080]' : 'text-slate-400'}`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#008080]/10' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-40'}`}>
        {label}
      </span>
    </button>
  );
}

const Store = ({ size = 20, className }: any) => (
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

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeShopId, setActiveShopId] = useState<string | null>(localStorage.getItem('activeShopId'));
  const [activeShopName, setActiveShopName] = useState<string>('');
  const [activeShopType, setActiveShopType] = useState<string>('');
  const [currentEntry, setCurrentEntry] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [view, setView] = useState<'record' | 'history' | 'insights' | 'health'>('record');
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [pendingClarification, setPendingClarification] = useState<any>(null);
  const isOnline = useOnlineStatus();
  const [offlineSyncing, setOfflineSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get('/shops');
        setShops(res.data);
      } catch (err) { console.error('Failed to fetch shops', err); }
    };
    if (user) fetchShops();
  }, [user, showOnboarding]);

  useEffect(() => {
    if (isOnline) {
      const count = getOfflineQueueCount();
      if (count > 0) {
        handleFlush();
      }
    }
  }, [isOnline]);

  const handleFlush = async () => {
    setOfflineSyncing(true);
    const success = await flushOfflineQueue((msg) => setSyncMessage(msg));
    setOfflineSyncing(false);
    setSyncMessage(null);
    if (success) {
      fetchData();
      // Using a custom toast/notification would be better, but for now:
      console.log('Offline entries synced successfully');
    }
  };

  const fetchData = async () => {
    if (!user || !activeShopId) return;
    setInsightsData(null); // Clear stale data to show loading state
    try {
      // Always fetch history 
      const histRes = await api.get(`/ledger`, {
        headers: { 'X-Shop-Id': activeShopId }
      });
      setHistory(histRes.data);

      if (view === 'insights') {
        const insRes = await api.get(`/insights`, {
          headers: { 'X-Shop-Id': activeShopId }
        });
        setInsightsData(insRes.data);
      }
    } catch (e) {
      console.error('Fetch failed', e);
    }
  };

  // Lazy-load health score for home widget (non-blocking)
  useEffect(() => {
    if (user && activeShopId && !healthData && !healthLoading) {
      setHealthLoading(true);
      api.get('/health-score').then(res => {
        setHealthData(res.data);
      }).catch(() => {}).finally(() => setHealthLoading(false));
    }
  }, [user, activeShopId]);

  // Scan for pending flags on startup or history update
  useEffect(() => {
    if (history.length > 0 && !pendingClarification) {
      const flagged = history.find(entry => entry.ledger_entry.flags && entry.ledger_entry.flags.length > 0);
      if (flagged) {
        setPendingClarification(flagged);
      }
    }
  }, [history]);

  useEffect(() => {
    if (activeShopId) {
      localStorage.setItem('activeShopId', activeShopId);
      fetchData();
    } else {
      localStorage.removeItem('activeShopId');
      setActiveShopName('');
      setActiveShopType('');
      setHistory([]);
      setInsightsData(null);
    }
  }, [view, activeShopId]);

  if (authLoading) return <div className='min-h-screen bg-[#FFFFF0] flex items-center justify-center'><span className='text-[#008080] animate-pulse font-black text-2xl uppercase italic'>VyapaarVaani...</span></div>;
  if (!user) return <Login />;

  return (
    <div className='min-h-screen bg-[#FFFFF0] text-[#333333] font-sans selection:bg-[#008080]/20'>
      <OnboardingModal 
        isOpen={showOnboarding} 
        initialData={editingShop}
        hasExistingShops={shops.length > 0}
        onClose={() => { setShowOnboarding(false); setEditingShop(null); }}
        onComplete={(p) => { 
          setActiveShopId(p.shop_id);
          setShowOnboarding(false);
          setEditingShop(null);
          fetchData();
        }} 
      />

      {!isOnline && <OfflineBanner count={getOfflineQueueCount()} onFlush={handleFlush} />}
      
      {offlineSyncing && (
        <div className='fixed top-4 right-4 z-[200] bg-[#008080] text-[#FFFFF0] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce'>
          <RefreshCw size={18} className='animate-spin text-[#FFFFF0]' />
          <span className='font-bold text-sm'>{syncMessage || 'Syncing...'}</span>
        </div>
      )}

      <AnimatePresence>
        {pendingClarification && (
          <ClarificationDialog 
            entry={pendingClarification} 
            onClose={(updatedEntry) => {
              if (updatedEntry) {
                // Update history locally
                setHistory(prev => prev.map(e => 
                  e.id === pendingClarification.id 
                    ? { ...e, ledger_entry: updatedEntry } 
                    : e
                ));
              }
              setPendingClarification(null);
            }} 
          />
        )}
      </AnimatePresence>
      
      {/* Navbar - Top */}
      <nav className='fixed top-0 w-full z-[100] bg-[#FFFFF0]/80 backdrop-blur-xl border-b border-[#008080]/10'>
        <div className='max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-28 flex items-center justify-between'>
          <div className='flex items-center gap-3 md:gap-6'>
            <div className='flex items-center gap-3 md:gap-4'>
              <div className='w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-[#008080] to-[#20B2AA] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-[#008080]/20'>
                <Mic2 className='text-[#FFFFF0]' size={24} />
              </div>
              <div className='hidden sm:block text-left'>
                <span className='text-xl md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#008080] to-[#006666] italic uppercase leading-none'>
                  VyapaarVaani
                </span>
                <p className='text-[8px] md:text-[10px] text-[#008080] font-bold uppercase tracking-widest mt-0.5 md:mt-1'>
                  {activeShopName || user.email}
                </p>
              </div>
            </div>
            
            <div className='hidden md:block h-10 w-px bg-[#008080]/10 mx-2' />

            <div className='scale-90 md:scale-100 origin-left'>
              <ShopSwitcher 
                activeShopId={activeShopId} 
                onSwitch={setActiveShopId} 
                onAddShop={() => { setEditingShop(null); setShowOnboarding(true); }} 
                onEditShop={(shop) => { setEditingShop(shop); setShowOnboarding(true); }}
                onShopChange={(name, type) => {
                  setActiveShopName(name);
                  setActiveShopType(type);
                }}
              />
            </div>
          </div>
          
          <div className='flex items-center gap-2 md:gap-6'>
            {/* Nav Tabs for Desktop */}
            <div className='hidden md:flex bg-[#FDF5E6] p-1.5 rounded-3xl gap-1 border border-[#008080]/10 shadow-sm'>
              <NavTab active={view === 'record'} onClick={() => setView('record')} icon={<Mic2 size={18} />} label='Record' />
              <NavTab active={view === 'history'} onClick={() => setView('history')} icon={<LayoutList size={18} />} label='History' />
              <NavTab active={view === 'insights'} onClick={() => setView('insights')} icon={<Sparkles size={18} />} label='Insights' />
              <NavTab active={view === 'health'} onClick={() => setView('health')} icon={<HeartPulse size={18} />} label='Health' />
            </div>

            <button 
              onClick={() => auth.signOut()}
              className='p-2.5 md:p-3 bg-red-400/10 text-red-500 rounded-xl md:rounded-2xl border border-red-400/20 hover:bg-red-500 hover:text-[#FFFFF0] transition-all'
              title='Logout'
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#FFFFF0]/90 backdrop-blur-2xl border-t border-[#008080]/10 pb-safe-area'>
        <div className='flex items-center justify-around h-20 px-4'>
          <MobileNavTab active={view === 'history'} onClick={() => setView('history')} icon={<LayoutList size={20} />} label='History' />
          
          <div className='relative -top-6'>
            <button 
              onClick={() => setView('record')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                view === 'record' 
                  ? 'bg-[#008080] text-[#FFFFF0] shadow-[#008080]/40 scale-110 active:scale-100' 
                  : 'bg-[#FDF5E6] text-[#008080] border border-[#008080]/20'
              }`}
            >
              <Mic2 size={28} />
            </button>
          </div>

          <MobileNavTab active={view === 'insights'} onClick={() => setView('insights')} icon={<Sparkles size={20} />} label='Insights' />
          <MobileNavTab active={view === 'health'} onClick={() => setView('health')} icon={<HeartPulse size={20} />} label='Health' />
        </div>
      </nav>

      <main className='pt-28 md:pt-48 pb-32 md:pb-20 px-4 md:px-6 flex flex-col items-center gap-8 md:gap-12'>
        {!activeShopId ? (
          <div className='flex flex-col items-center gap-6 py-20 text-center'>
            <div className='bg-[#008080]/10 p-8 rounded-[3rem] border border-[#008080]/20 shadow-2xl'>
              <Store className='text-[#008080] w-16 h-16' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-3xl font-black text-[#333333]'>No Shop Selected</h2>
              <p className='text-slate-500'>Create or select a shop to start managing your business.</p>
            </div>
            <button 
              onClick={() => setShowOnboarding(true)}
              className='bg-[#008080] hover:bg-[#006666] text-[#FFFFF0] font-black px-10 py-5 rounded-2xl shadow-xl shadow-[#008080]/20 transition-all transform active:scale-95'
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
                {/* Health Widget */}
                {healthData && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className='w-full max-w-md bg-white border border-slate-100 px-5 py-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 cursor-pointer hover:shadow-xl transition-shadow'
                    onClick={() => setView('health')}
                  >
                    <div>
                      <p className='text-[9px] text-slate-400 font-black uppercase tracking-widest'>Financial Health</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-2xl font-black text-[#333333]'>{healthData.score}</span>
                        <span className='text-xs font-bold text-slate-400'>/100</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          healthData.score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          healthData.score >= 65 ? 'bg-[#008080]/10 text-[#008080] border-[#008080]/20' :
                          healthData.score >= 45 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-rose-50 text-rose-500 border-rose-200'
                        }`}>{healthData.tier}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <MiniScoreArc score={healthData.score} />
                      <span className='text-[10px] text-[#008080] font-bold'>View details →</span>
                    </div>
                  </motion.div>
                )}
                {healthLoading && !healthData && (
                  <div className='w-full max-w-md h-16 bg-slate-50 rounded-2xl animate-pulse' />
                )}

                <VoiceRecorder 
                  activeShopId={activeShopId}
                  onResult={(res) => { 
                    if (!res) {
                      setIsLoading(false);
                      return;
                    }
                    if (res.offline) {
                      setIsLoading(false);
                      return;
                    }
                    setCurrentEntry(res);
                    setHealthData(null); // bust widget cache on new entry
                    fetchData(); 
                  }} 
                  onStart={() => { setCurrentEntry(null); setIsLoading(true); }}
                />
                
                {isLoading && !currentEntry && (
                  <div className='flex items-center gap-3 bg-[#008080]/10 px-6 py-3 rounded-full border border-[#008080]/20 animate-pulse'>
                    <div className='w-2 h-2 bg-[#008080] rounded-full' />
                    <span className='text-[#008080] font-bold'>Processing voice...</span>
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
                  title={activeShopType}
                  onSelect={(entry) => {
                    setCurrentEntry(entry);
                    setView('record');
                  }} 
                  onRefresh={fetchData}
                />
              </motion.div>
            ) : view === 'insights' ? (
              <motion.div 
                key='insights-view'
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className='w-full flex justify-center'
              >
                <BusinessInsights data={insightsData} title={activeShopType} />
              </motion.div>
            ) : (
              <motion.div 
                key='health-view'
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className='w-full flex justify-center'
              >
                <FinancialHealth shopName={activeShopName} shopType={activeShopType} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default App;
