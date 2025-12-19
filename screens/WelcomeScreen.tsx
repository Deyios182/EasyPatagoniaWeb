import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { useAppAuth } from '../App';

const WelcomeScreen: React.FC = () => {
  const { t } = useAppAuth();

  return (
    <div className="relative flex min-h-screen w-full flex-col mx-auto bg-background-dark overflow-hidden items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[80vh] bg-surface-dark md:rounded-[4rem] overflow-hidden shadow-2xl border border-white/5">
        
        {/* LADO IZQUIERDO: IMAGEN */}
        <div className="relative h-[40vh] md:h-full md:w-1/2 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110" 
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1517748975545-35696f174b0c?auto=format&fit=crop&q=80&w=1200')"}}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/60 via-transparent to-background-dark/20"></div>
          
          <div className="absolute top-8 left-8 md:top-12 md:left-12 z-10">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-primary text-3xl leading-none">landscape</span>
              <span className="text-white text-xl font-black tracking-tighter uppercase leading-none">EasyPatagonia</span>
            </div>
          </div>

          <div className="absolute bottom-12 px-10 text-white z-10 animate-in slide-in-from-bottom duration-1000">
            <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter mb-4 uppercase italic">
              {t('hero_title')}
            </h1>
            <p className="text-secondary/90 text-lg md:text-xl font-medium italic border-l-4 border-primary pl-4 max-w-sm">
              "{t('hero_subtitle')}"
            </p>
          </div>
        </div>

        {/* LADO DERECHO: LOGIN DE CLERK */}
        <div className="flex-1 flex flex-col px-8 py-10 md:p-16 bg-background-dark justify-center items-center text-center md:text-left">
            <div className="space-y-8 animate-in fade-in duration-500 max-w-md w-full">
              <div className="mb-8">
                <h2 className="text-white text-3xl font-bold mb-4 uppercase italic tracking-tight leading-none">{t('welcome')}</h2>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest leading-relaxed">
                  Accede para guardar tus rutas y usar la IA.
                </p>
              </div>

              {/* BOTÓN DE CLERK */}
              <SignInButton mode="modal">
                <button 
                  className="w-full bg-primary text-white font-black py-6 rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em] leading-none group"
                >
                  Iniciar Sesión / Registro
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">login</span>
                </button>
              </SignInButton>

              <div className="pt-6 border-t border-white/10">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                   Al continuar aceptas nuestros términos de servicio.
                 </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
