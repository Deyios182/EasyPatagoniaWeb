
import React, { useState } from 'react';
import { useAppAuth } from '../App';
import { Role } from '../types';

const WelcomeScreen: React.FC = () => {
  const { login, t } = useAppAuth();
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('Turista');

  const handleAccess = (role: Role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    login({ 
      name, 
      rol: selectedRole, 
      email: `${name.toLowerCase().replace(/\s/g, '')}@patagonia.cl` 
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col mx-auto bg-background-dark overflow-hidden items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col md:flex-row h-full md:h-[80vh] bg-surface-dark md:rounded-[4rem] overflow-hidden shadow-2xl border border-white/5">
        
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

        <div className="flex-1 flex flex-col px-8 py-10 md:p-16 bg-background-dark justify-center">
          {!showForm ? (
            <div className="space-y-6 animate-in fade-in duration-500 max-w-md mx-auto w-full text-center md:text-left">
              <div className="mb-8">
                <h2 className="text-white text-2xl font-bold mb-2 uppercase italic tracking-tight leading-none">{t('welcome')}</h2>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest leading-relaxed">Selecciona tu perfil para comenzar.</p>
              </div>

              <button 
                onClick={() => handleAccess('Turista')}
                className="w-full bg-primary text-white font-black py-6 rounded-3xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-widest leading-none"
              >
                {t('start_btn')}
                <span className="material-symbols-outlined leading-none">explore</span>
              </button>

              <div className="relative flex items-center py-6">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] leading-none">Acceso Aliados</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAccess('DueñoEmpresa')}
                  className="bg-surface-dark text-white border border-white/5 font-bold py-6 rounded-[2rem] transition-all hover:bg-white/5 flex flex-col items-center gap-2 active:scale-95 shadow-lg"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl leading-none">storefront</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none">Dueño</span>
                </button>
                <button 
                  onClick={() => handleAccess('SuperAdmin')}
                  className="bg-surface-dark text-white border border-white/5 font-bold py-6 rounded-[2rem] transition-all hover:bg-white/5 flex flex-col items-center gap-2 active:scale-95 shadow-lg"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl leading-none">admin_panel_settings</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none">Admin</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-md mx-auto w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 leading-none">¿Cómo te llamas?</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre aquí..."
                  className="w-full bg-surface-dark border-none rounded-3xl py-6 px-8 text-white text-xl placeholder:text-slate-600 focus:ring-4 focus:ring-primary/20 transition-all shadow-inner font-bold"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-white/5 text-slate-400 font-bold py-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] leading-none"
                >
                  Volver
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-[2] bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] leading-none"
                >
                  Confirmar <span className="material-symbols-outlined leading-none">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
