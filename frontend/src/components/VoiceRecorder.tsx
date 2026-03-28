import React, { useState, useRef } from 'react';
import api from '../lib/api';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceRecorder({ onResult, onStart }: { onResult: (data: any) => void; onStart?: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob);
      setLoading(true);
      try {
        const { data } = await api.post('/ingest', formData);
        onResult(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    mediaRecorder.start();
    setIsRecording(true);
    onStart?.();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className='flex flex-col items-center gap-6'>
      <div className='relative'>
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className='absolute -inset-4 bg-blue-400 rounded-full blur-xl'
            />
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={'relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ' + (isRecording ? 'bg-red-500 shadow-red-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200')}
        >
          {loading ? (
            <Loader2 className='animate-spin text-white w-10 h-10' />
          ) : isRecording ? (
            <Square className='text-white w-10 h-10' />
          ) : (
            <Mic className='text-white w-10 h-10' />
          )}
        </motion.button>
      </div>
      <div className='text-center'>
        <motion.p
          animate={isRecording ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className='text-slate-600 font-medium tracking-wide'
        >
          {isRecording ? 'Listening to your narration...' : loading ? 'Analyzing your day...' : 'Tap top-tier recording to start'}
        </motion.p>
        {isRecording && <div className='mt-2 flex gap-1 justify-center'><div className='w-1 h-4 bg-red-400 animate-pulse'/><div className='w-1 h-6 bg-red-400 animate-pulse delay-75'/><div className='w-1 h-4 bg-red-400 animate-pulse delay-150'/></div>}
      </div>
    </div>
  );
}
