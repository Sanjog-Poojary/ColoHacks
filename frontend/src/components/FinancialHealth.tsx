import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, ExternalLink, TrendingUp, Shield, ChevronRight, Info, Languages } from 'lucide-react';
import api from '../lib/api';
import HealthExport from './HealthExport';

const CRITERION_INFO: Record<string, { en: string; hi: string }> = {
  "Business history": {
    en: "Records your consistency over time. More days of recording your sales increases your trustworthiness.",
    hi: "Aapke business ki purani baatein. Lagaatar hisaab rakhne se loan milne ke chances badhte hain."
  },
  "Earnings consistency": {
    en: "Measures if you are hitting the PM SVANidhi baseline (₹500/day). Steady income is better than unpredictable spikes.",
    hi: "Roz kamai ki sthirta. PM SVANidhi ke hisaab se rojana ₹500+ kamai hona accha hai."
  },
  "Expense stability": {
    en: "Checks if your business expenses are stable and predictable compared to your daily earnings.",
    hi: "Roz ke kharche ka hisaab. Agar kharche sthir hain toh business ko accha mana jata hai."
  },
  "Business diversification": {
    en: "Selling a wider variety of items protects your business from market changes.",
    hi: "Aapke dukaan mein alag-alag tarah ke saaman ka hona. Zyada variety se jokhim (risk) kam hota hai."
  },
  "Record cleanliness": {
    en: "Measures how accurately your voice logs were converted without unresolved warnings.",
    hi: "Khatabook mein koi pending warning na hona zaroori hai."
  }
};

// --- Score Arc SVG Component ---
function ScoreArc({ score, size = 200, strokeWidth = 14 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';   // green
    if (s >= 65) return '#008080';   // teal
    if (s >= 45) return '#f59e0b';   // amber
    return '#f87171';                // coral/red
  };

  const color = getColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='transform -rotate-90'>
      {/* Background track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill='none' stroke='#00808015'
        strokeWidth={strokeWidth}
      />
      {/* Score arc */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill='none' stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </svg>
  );
}

// --- Mini Score Arc for Home Widget ---
export function MiniScoreArc({ score, size = 40 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 65) return '#008080';
    if (s >= 45) return '#f59e0b';
    return '#f87171';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='transform -rotate-90'>
      <circle cx={size/2} cy={size/2} r={radius} fill='none' stroke='#00808015' strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill='none' stroke={getColor(score)}
        strokeWidth={strokeWidth} strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
      />
    </svg>
  );
}

// --- Criteria Progress Bar ---
function CriterionRow({ criterion }: { criterion: any }) {
  const [showInfo, setShowInfo] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const ratio = criterion.points_earned / criterion.points_max;
  const barColor = ratio >= 0.8 ? 'bg-[#008080]' : ratio >= 0.5 ? 'bg-amber-400' : 'bg-rose-400';
  const infoData = CRITERION_INFO[criterion.name];

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-bold text-[#333333]'>{criterion.name}</span>
          {infoData && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className='text-slate-400 hover:text-[#008080] transition-colors p-1 -m-1'
            >
              <Info size={14} />
            </button>
          )}
        </div>
        <span className='text-xs font-black text-slate-500'>
          {criterion.points_earned} / {criterion.points_max} pts
        </span>
      </div>

      <AnimatePresence>
        {showInfo && infoData && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className='bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-3 overflow-hidden'
          >
             <p className='text-xs text-slate-600 flex-1 leading-relaxed font-medium'>
               {infoData[lang]}
             </p>
             <button
               onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
               className='bg-[#008080]/10 text-[#008080] p-1.5 rounded-lg hover:bg-[#008080]/20 transition-colors shrink-0 flex items-center gap-1 font-bold text-[10px]'
               title='Translate'
             >
               <Languages size={12} />
               {lang === 'en' ? 'A/अ' : 'EN'}
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2'>
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div className='flex items-center justify-between mt-1'>
        <span className='text-[10px] font-bold text-[#008080] uppercase tracking-wider'>
          {criterion.status}
        </span>
        {criterion.gap && (
          <span className='text-[10px] font-medium text-amber-600 italic max-w-[60%] text-right'>
            {criterion.gap}
          </span>
        )}
      </div>
    </div>
  );
}



// --- Main Component ---
export default function FinancialHealth({ shopName, shopType, shopCity }: { shopName?: string; shopType?: string; shopCity?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await api.get('/health-score');
        setData(res.data);
      } catch (err) {
        console.error('Health score fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const tierColor = useMemo(() => {
    if (!data) return 'bg-slate-100 text-slate-500';
    if (data.score >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (data.score >= 65) return 'bg-[#008080]/10 text-[#008080] border-[#008080]/20';
    if (data.score >= 45) return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-rose-50 text-rose-500 border-rose-200';
  }, [data]);

  // Loading skeleton
  if (loading) {
    return (
      <div className='w-full max-w-2xl mx-auto space-y-8 animate-pulse py-10'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-48 h-48 rounded-full bg-[#008080]/10' />
          <div className='w-32 h-6 rounded-xl bg-slate-100' />
        </div>
        <div className='h-32 rounded-3xl bg-[#FDF5E6]' />
        <div className='space-y-4'>
          {[1,2,3,4,5].map(i => <div key={i} className='h-16 rounded-2xl bg-slate-50' />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='w-full max-w-2xl mx-auto space-y-8'>
      {/* --- Score Hero --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className='flex flex-col items-center gap-4'
      >
        <div className='flex items-center gap-3 mb-2'>
          <div className='bg-[#008080] p-3 rounded-2xl shadow-lg shadow-[#008080]/20'>
            <HeartPulse className='text-[#FFFFF0]' size={24} />
          </div>
          <h2 className='text-2xl md:text-3xl font-black text-[#333333] uppercase tracking-tight'>Financial Health</h2>
        </div>

        <div className='relative'>
          <ScoreArc score={data.score} size={200} />
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-5xl font-black text-[#333333]'>{data.score}</span>
            <span className='text-sm font-bold text-slate-400 uppercase tracking-wider'>/100</span>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase italic tracking-tight ${tierColor}`}>
          {data.tier}
        </div>

        <p className='text-xs text-slate-400 font-medium'>
          Based on {data.days_recorded} days of data
        </p>
      </motion.div>

      {/* --- Loan Estimate Card --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-[#FDF5E6] border-l-4 border-[#008080] p-6 rounded-2xl shadow-lg'
      >
        {data.score >= 45 && data.loan_estimate ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Shield className='text-[#008080]' size={18} />
              <h3 className='text-sm font-black text-[#333333] uppercase tracking-tight'>Estimated Credit Profile</h3>
            </div>
            <p className='text-3xl font-black text-[#008080]'>
              Up to ₹{data.loan_estimate.toLocaleString('en-IN')}
            </p>
            <p className='text-xs text-slate-500'>Based on 3× your monthly income average</p>
            <div className='flex flex-col sm:flex-row gap-3 pt-2'>
              <a
                href='https://pmsvnidhi.mohua.gov.in'
                target='_blank'
                rel='noopener noreferrer'
                className='text-xs text-[#008080] font-bold underline underline-offset-2 flex items-center gap-1 hover:opacity-70'
              >
                Learn about PM SVANidhi <ExternalLink size={10} />
              </a>
              <HealthExport
                data={data}
                shopName={shopName}
                shopType={shopType}
                shopCity={shopCity}
              />
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-3'>
            <TrendingUp className='text-[#008080] shrink-0' size={20} />
            <p className='text-sm text-slate-600 font-medium'>
              Keep recording to unlock your credit profile estimate.
            </p>
          </div>
        )}
      </motion.div>

      {/* --- Criteria Breakdown --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='bg-white border border-slate-100 p-6 rounded-3xl shadow-lg space-y-6'
      >
        <h3 className='text-sm font-black text-[#333333] uppercase tracking-tight'>What makes up your score</h3>
        <div className='space-y-5'>
          {data.criteria?.map((c: any, i: number) => (
            <CriterionRow key={i} criterion={c} />
          ))}
        </div>
      </motion.div>

      {/* --- What to Improve --- */}
      {data.gaps?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-[#FDF5E6] border border-[#008080]/10 p-6 rounded-3xl shadow-lg space-y-4'
        >
          <h3 className='text-sm font-black text-[#333333] uppercase tracking-tight'>What to improve</h3>
          <ol className='space-y-3'>
            {data.gaps.map((gap: string, i: number) => (
              <li key={i} className='flex items-start gap-3'>
                <div className='bg-[#008080]/10 p-1 rounded-md mt-0.5 shrink-0'>
                  <ChevronRight className='text-[#008080]' size={12} />
                </div>
                <span className='text-sm text-slate-600 font-medium'>{gap}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* --- Disclaimer --- */}
      <p className='text-[11px] text-slate-400 text-center leading-relaxed px-4'>
        {data.disclaimer?.split('pmsvnidhi.mohua.gov.in').map((part: string, i: number) =>
          i === 0 ? (
            <span key={i}>{part}
              <a
                href='https://pmsvnidhi.mohua.gov.in'
                target='_blank'
                rel='noopener noreferrer'
                className='text-[#008080] underline'
              >
                pmsvnidhi.mohua.gov.in
              </a>
            </span>
          ) : <span key={i}>{part}</span>
        )}
      </p>
    </div>
  );
}
