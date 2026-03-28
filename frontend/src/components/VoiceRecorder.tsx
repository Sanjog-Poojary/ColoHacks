import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Mic, Square, Timer, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { queueAudioOffline } from '../utils/offlineQueue';

export default function VoiceRecorder({ onResult, onStart, activeShopId }: { onResult: (res: any) => void; onStart: () => void; activeShopId: string | null }) {
  const isOnline = useOnlineStatus();
  const [isRecording, setIsRecording] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (offlineSaved) {
      const timer = setTimeout(() => setOfflineSaved(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineSaved]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    setTimeLeft(180);
    onStart();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        if (!isOnline && activeShopId) {
          await queueAudioOffline(blob, activeShopId);
          setOfflineSaved(true);
          onResult({ offline: true }); // Signal that it was saved offline
          return;
        }

        const formData = new FormData();
        formData.append('file', blob);
        try {
          const res = await api.post('/ingest', formData);
          onResult(res.data);
        } catch (err: any) { 
          console.error('Upload failed', err);
          setError(err.response?.data?.detail || 'Failed to process audio. Please try again.');
          onResult(null); // Signal failure to parent
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied', err);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder?.stop();
    if (mediaRecorder?.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft <= 30;

  return (
    <div className='flex flex-col items-center gap-12'>
      <div className='relative flex flex-col items-center'>
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='absolute -top-16 left-0 right-0 flex justify-center z-50'
            >
              <div className='bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap'>
                <Square className='text-red-500 fill-red-500' size={14} />
                <span className='text-red-600 font-bold text-xs uppercase tracking-tight'>{error}</span>
              </div>
            </motion.div>
          )}

          {offlineSaved && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='absolute -top-16 left-0 right-0 flex justify-center z-50'
            >
              <div className='bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap'>
                <CloudOff className='text-amber-500' size={14} />
                <span className='text-amber-600 font-bold text-xs uppercase tracking-tight'>Saved Offline — Will Sync Later</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                className='absolute inset-0 bg-[#008080]/30 rounded-full blur-2xl'
              />
              <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                className='absolute inset-0 bg-[#20B2AA]/20 rounded-full blur-xl'
              />
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isOnline && !activeShopId}
          className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-500 shadow-2xl ${
            isRecording 
              ? 'bg-red-500 shadow-red-500/40 ring-[12px] ring-red-500/10' 
              : 'bg-[#008080] shadow-[#008080]/40 hover:bg-[#006666] ring-[12px] ring-[#008080]/10'
          } ${!isOnline && !activeShopId ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <>
              <Square className='text-[#FFFFF0] fill-[#FFFFF0]' size={40} />
              <div className={`mt-2 flex items-center gap-1 font-black text-lg ${isLowTime ? 'text-white animate-pulse' : 'text-[#FFFFF0]/90'}`}>
                <Timer size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </>
          ) : (
            <>
              <Mic className='text-[#FFFFF0]' size={48} />
              <span className='text-[#FFFFF0] text-xs font-black uppercase tracking-widest'>
                {isOnline ? 'Start Recording' : 'Record Offline'}
              </span>
            </>
          )}
        </motion.button>
      </div>

      <div className='text-center space-y-3'>
        <h2 className='text-3xl font-black text-[#333333] tracking-tight'>
          {offlineSaved ? 'Entry Queued!' : 'Record Your Sales'}
        </h2>
        <p className='text-[#333333]/60 font-medium max-w-sm mx-auto leading-relaxed'>
          {offlineSaved 
            ? 'Your recording is saved locally. It will be processed and added to your ledger as soon as you are back online.'
            : isOnline 
              ? 'Simply speak your sales data. Max recording length: 3 minutes.' 
              : 'You are offline. Recordings will be saved and synced automatically when you reconnect.'}
        </p>
      </div>
    </div>
  );
}
