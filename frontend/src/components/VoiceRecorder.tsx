import React, { useState } from 'react';
import api from '../lib/api';
import { Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceRecorder({ onResult, onStart }: { onResult: (res: any) => void; onStart: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    onStart();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob);
      try {
        const res = await api.post('/ingest', formData);
        onResult(res.data);
      } catch (err) { console.error('Upload failed', err); }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <div className='flex flex-col items-center gap-12'>
      <div className='relative'>
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
          className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center gap-3 transition-all duration-500 shadow-2xl ${
            isRecording 
              ? 'bg-red-500 shadow-red-500/40 ring-[12px] ring-red-500/10' 
              : 'bg-[#008080] shadow-[#008080]/40 hover:bg-[#006666] ring-[12px] ring-[#008080]/10'
          }`}
        >
          {isRecording ? (
            <>
              <Square className='text-[#FFFFF0] fill-[#FFFFF0]' size={40} />
              <span className='text-[#FFFFF0] text-xs font-black uppercase tracking-widest animate-pulse'>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className='text-[#FFFFF0]' size={48} />
              <span className='text-[#FFFFF0] text-xs font-black uppercase tracking-widest'>Start Recording</span>
            </>
          )}
        </motion.button>
      </div>

      <div className='text-center space-y-3'>
        <h2 className='text-3xl font-black text-[#333333] tracking-tight'>Record Your Sales</h2>
        <p className='text-[#333333]/60 font-medium max-w-sm mx-auto leading-relaxed'>
          Simply speak your sales data (e.g. "Sold 2 chai for 40 rupees") and let AI do the rest.
        </p>
      </div>
    </div>
  );
}
