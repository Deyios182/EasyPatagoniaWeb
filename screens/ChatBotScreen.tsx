
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { askPatagoniaAI, textToSpeechPatagonia } from '../geminiService';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';

interface Message {
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  sources?: { uri?: string; title?: string }[];
}

const ChatBotScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useAppAuth();
  const [messages, setMessages] = useState<Message[]>([
    { text: language === 'PT' ? "Olá! Sou seu guia inteligente. Como posso ajudar?" : language === 'EN' ? "Hello! I am your smart guide. How can I help?" : "¡Hola! Soy tu guía inteligente. ¿En qué puedo ayudarte?", sender: 'ai', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Referencias para controlar el audio y evitar superposiciones
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  // Limpiar audio al desmontar el componente
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ya detenido
      }
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const aiResult = await askPatagoniaAI(input, language);
    const aiMsg: Message = {
      text: aiResult.text,
      sender: 'ai',
      timestamp: new Date(),
      sources: aiResult.sources
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);

    // Reproducir automáticamente la respuesta
    handleTTS(aiResult.text);
  };

  const handleTTS = async (text: string) => {
    // Si ya está reproduciendo, el segundo clic detiene el audio (Toggle)
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsPlaying(true); // Bloqueamos clics adicionales inmediatamente

    try {
      const base64Audio = await textToSpeechPatagonia(text);
      if (base64Audio) {
        playPCM(base64Audio);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
    }
  };

  const playPCM = async (base64: string) => {
    // Detener cualquier audio previo antes de iniciar uno nuevo
    stopAudio();
    setIsPlaying(true);

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    source.onended = () => {
      setIsPlaying(false);
      audioSourceRef.current = null;
    };

    audioSourceRef.current = source;
    source.start();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center">
      <div className="w-full max-w-4xl h-full flex flex-col bg-white dark:bg-surface-dark md:border-x border-white/5 shadow-2xl overflow-hidden">

        {/* Header Chat */}
        <div className="p-6 md:p-8 bg-surface-dark flex items-center gap-5 text-white shadow-xl relative z-50">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all no-underline">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">smart_toy</span>
          </div>
          <div className="flex-1">
            <h2 className="font-black text-lg tracking-tight uppercase italic">{t('ai_guide_title')}</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('ai_status')}</span>
            </div>
          </div>
          {isPlaying && (
            <div className="flex gap-1 items-end h-5">
              <div className="w-1.5 bg-primary animate-[bounce_0.5s_infinite_0s] rounded-full"></div>
              <div className="w-1.5 bg-primary animate-[bounce_0.5s_infinite_0.1s] rounded-full"></div>
              <div className="w-1.5 bg-primary animate-[bounce_0.5s_infinite_0.2s] rounded-full"></div>
            </div>
          )}
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50 dark:bg-background-dark/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-6 md:p-8 rounded-[2.5rem] text-sm md:text-base leading-relaxed relative shadow-sm border ${m.sender === 'user' ? 'bg-primary text-white rounded-tr-none border-primary shadow-primary/10' : 'bg-white dark:bg-surface-dark dark:text-white border-slate-200 dark:border-white/5 rounded-tl-none'}`}>
                {m.text}

                {m.sender === 'ai' && (
                  <button
                    onClick={() => handleTTS(m.text)}
                    className={`absolute -right-3 -bottom-3 w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-primary hover:scale-110'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{isPlaying ? 'stop' : 'volume_up'}</span>
                  </button>
                )}

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fuentes:</p>
                    {m.sources.map((source, idx) => (
                      <a key={idx} href={source.uri} target="_blank" className="flex items-center gap-2 text-xs text-primary hover:underline font-bold truncate no-underline">
                        <span className="material-symbols-outlined text-sm leading-none">link</span>
                        {source.title || source.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-surface-dark p-6 rounded-[2rem] rounded-tl-none border border-slate-200 dark:border-white/5 flex gap-2">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 md:p-12 pb-[90px] md:pb-12 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/10">
          <div className="bg-slate-100 dark:bg-background-dark rounded-[2.5rem] p-2 pl-8 flex items-center gap-4 shadow-inner max-w-3xl mx-auto">
            <input
              type="text"
              placeholder={t('chat_placeholder')}
              className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-4 dark:text-white placeholder:text-slate-400 font-bold"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="w-16 h-16 rounded-[2rem] bg-primary text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <span className="material-symbols-outlined text-3xl">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar />
    </div>
  );
};

export default ChatBotScreen;
