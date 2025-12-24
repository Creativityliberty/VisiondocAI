
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const VoiceAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.close();
      } catch (e) {
        console.debug("Session already closed or error closing", e);
      }
      sessionRef.current = null;
    }
    setIsActive(false);
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => sourcesRef.current.delete(source);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch (e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Voice Assistant Error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are the VisionDoc AI Voice Agent. Help developers analyze UI screenshots and structure code protocols.',
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to initiate voice protocol', err);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-black text-white p-6 rounded-[35px] shadow-2xl mb-4 flex items-center gap-5 border border-white/10"
          >
            <div className="flex gap-1.5 items-center">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [10, 32, 10] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                  className="w-1 bg-[#E6644C] rounded-full"
                />
              ))}
            </div>
            <div className="pr-4 border-r border-white/10 mr-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E6644C]">Vision Voice</p>
              <p className="text-sm font-bold">Protocol Active</p>
            </div>
            <button 
              onClick={stopSession}
              className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
            >
              <PhoneOff size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button 
        onClick={isActive ? stopSession : startSession}
        variant={isActive ? 'secondary' : 'primary'}
        className="w-16 h-16 !p-0 rounded-full shadow-2xl group"
      >
        {isActive ? <MicOff size={24} /> : <Mic size={24} className="group-hover:scale-110 transition-transform" />}
      </Button>
    </div>
  );
};
