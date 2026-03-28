import React, { useState } from 'react';
import { auth } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Globe, Loader2 } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) { alert('Authentication failed: ' + err.message); }
    setLoading(false);
  };

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className='w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-4xl font-black text-white tracking-tighter italic uppercase'>VyapaarVaani</h1>
          <p className='text-slate-400 font-medium'>{isLogin ? 'Sign in to manage your shops' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleAuth} className='space-y-4 font-sans'>
          <div className='relative font-sans'>
            <Mail className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-500' size={18} />
            <input 
              type='email' required placeholder='Email Address' 
              value={email} onChange={(e) => setEmail(e.target.value)}
              className='w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-lg focus:border-blue-500 outline-none transition-all'
            />
          </div>
          <div className='relative font-sans'>
            <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-500' size={18} />
            <input 
              type='password' required placeholder='Password' 
              value={password} onChange={(e) => setPassword(e.target.value)}
              className='w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-lg focus:border-blue-500 outline-none transition-all'
            />
          </div>
          <button 
            type='submit' disabled={loading}
            className='w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-lg shadow-blue-500/20'
          >
            {loading ? <Loader2 className='animate-spin' /> : <><LogIn size={20} /> {isLogin ? 'Sign In' : 'Sign Up'}</>}
          </button>
        </form>

        <div className='relative'><div className='absolute inset-0 flex items-center'><div className='w-full border-t border-white/5'/></div><div className='relative flex justify-center text-xs uppercase'><span className='bg-slate-900 px-4 text-slate-500 font-bold tracking-widest'>Or continue with</span></div></div>

        <button 
          onClick={googleLogin}
          className='w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-3 transition-all'
        >
          <Globe size={20} /> Google Login
        </button>

        <p className='text-center text-slate-500 text-sm font-medium'>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className='text-blue-400 font-bold hover:underline'>{isLogin ? 'Sign Up' : 'Sign In'}</button>
        </p>
      </motion.div>
    </div>
  );
}
