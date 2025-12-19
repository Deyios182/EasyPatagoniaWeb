import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Role, MapTheme, Currency, SavedItinerary } from '../types';
import { useAppAuth } from '../App';

interface ProfileScreenProps { role: Role; }

type Language = 'ES' | 'EN' | 'PT';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ role }) => {
  const navigate = useNavigate();
  const { logout, user, language, setLanguage, mapTheme, setMapTheme, currency, setCurrency, deleteItinerary, t } = useAppAuth();
  
  const [tempLanguage, setTempLanguage] = useState<Language>(language);
  const [tempMapTheme, setTempMapTheme] = useState<MapTheme>(mapTheme);
  const [tempCurrency, setTempCurrency] = useState<Currency>(currency);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'trips'>('settings');

  const handleApplyChanges = () => {
    setLanguage(tempLanguage);
    setMapTheme(tempMapTheme);
    setCurrency(tempCurrency);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleOpenTrip = (trip: SavedItinerary) => {
    localStorage.setItem('ep_plan', JSON.stringify(trip.plan));
    localStorage.setItem('ep_plan_meta', JSON.stringify({ 
      days: trip.days, 
      budget: trip.budget, 
      categories: trip.categories 
    }));
    navigate('/itinerary');
  };

  if (!user) return null;

  const languages = [
    { code: 'ES', label: 'Español', flag: '🇪🇸' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'PT', label: 'Português', flag: '🇧🇷' }
  ];

  const mapThemes = [
    { code: 'dark', label: 'Patagonia Dark', icon: 'dark_mode' },
    { code: 'light', label: 'Aysén Light', icon: 'light_mode' },
    { code: 'satellite', label: 'Satélite Pro', icon: 'satellite_alt' }
  ];

  const currencies = [
    { code: 'CLP', label: 'Pesos Chilenos', symbol: '$' },
    { code: 'USD', label: 'US Dollars', symbol: 'US$' },
    { code: 'EUR', label: 'Euro', symbol: '€' }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar items-center p-6 md:p-12">
      <div className="w-full max-w-6xl space-y-12 pb-32 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
               <span className="material-symbols-outlined text-4xl">person</span>
             </div>
             <div>
               <h1 className="text-4xl font-black dark:text-white tracking-tighter uppercase italic leading-none">{t('my_account')}</h1>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{user.email}</p>
             </div>
          </div>
          <button onClick={() => navigate('/map')} className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark dark:text-white shadow-sm border border-slate-200 dark:border-white/5 hover:bg-primary hover:text-white transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-4 p-2 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/5 max-w-lg mx-auto md:mx-0">
           <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-xl' : 'text-slate-400 hover:text-primary'}`}
           >
             <span className="material-symbols-outlined text-xl">settings</span>
             {t('settings')}
           </button>
           <button 
            onClick={() => setActiveTab('trips')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'trips' ? 'bg-primary text-white shadow-xl' : 'text-slate-400 hover:text-primary'}`}
           >
             <span className="material-symbols-outlined text-xl">map</span>
             {t('my_trips')}
             <span className="bg-white/20 text-white w-6 h-6 rounded-full flex items-center justify-center text-[8px]">{user.savedItineraries?.length || 0}</span>
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* PERFIL IZQUIERDO */}
          <div className="lg:col-span-1 space-y-8 sticky top-0">
            <div className="bg-white dark:bg-surface-dark p-10 rounded-[4.5rem] shadow-xl border border-slate-100 dark:border-white/5 text-center flex flex-col items-center">
              <div className="relative mb-10 group">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all"></div>
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                  className="w-48 h-48 md:w-56 md:h-56 rounded-full border-8 border-white dark:border-background-dark shadow-2xl object-cover relative z-10"
                />
              </div>
              <h2 className="text-4xl font-black dark:text-white tracking-tighter mb-2 uppercase italic leading-none">{user.name}</h2>
              <div className="inline-flex items-center justify-center gap-3 px-8 py-3 bg-slate-100 dark:bg-background-dark rounded-full border border-slate-200 dark:border-white/5 mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{role}</span>
              </div>
            </div>

            {/* --- ZONA DE ADMINISTRACIÓN (AGREGADA) --- */}
            {(role === 'SuperAdmin' || role === 'DueñoEmpresa') && (
              <div className="space-y-3">
                 <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Zona de Gestión</h3>
                 
                 {role === 'SuperAdmin' && (
                   <button 
                     onClick={() => navigate('/admin')}
                     className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2.5rem] shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                   >
                     <span className="material-symbols-outlined">admin_panel_settings</span>
                     Panel Super Admin
                   </button>
                 )}

                 <button 
                   onClick={() => navigate('/portal')}
                   className="w-full py-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-black text-xs uppercase tracking-[0.2em] rounded-[2.5rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                 >
                   <span className="material-symbols-outlined text-orange-500">storefront</span>
                   Portal Empresa
                 </button>
              </div>
            )}

            <button 
              onClick={() => { logout(); navigate('/'); }} 
              className="w-full py-8 text-red-500 font-black text-xs uppercase tracking-[0.3em] border-2 border-red-500/20 rounded-[2.5rem] hover:bg-red-500/5 transition-all shadow-sm flex items-center justify-center gap-4"
            >
              <span className="material-symbols-outlined">logout</span>
              {t('logout')}
            </button>
          </div>

          {/* CONTENIDO DERECHA */}
          <div className="lg:col-span-2">
            
            {activeTab === 'settings' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right duration-500">
                <section className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-12 shadow-xl border border-slate-100 dark:border-white/5 space-y-16">
                  
                  {/* IDIOMA */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">translate</span>
                      </div>
                      <div>
                        <p className="text-xl font-black dark:text-white uppercase italic tracking-tighter leading-none">{t('language')}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Personaliza tu experiencia</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setTempLanguage(lang.code as Language)}
                          className={`flex flex-col items-center justify-center py-8 rounded-[2rem] border-4 transition-all ${tempLanguage === lang.code ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-background-dark border-transparent text-slate-400'}`}
                        >
                          <span className="text-3xl mb-2">{lang.flag}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ESTILO DEL MAPA */}
                  <div className="space-y-8 pt-12 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">map</span>
                      </div>
                      <div>
                        <p className="text-xl font-black dark:text-white uppercase italic tracking-tighter leading-none">{t('map_style')}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Visualización cartográfica</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {mapThemes.map(theme => (
                        <button
                          key={theme.code}
                          onClick={() => setTempMapTheme(theme.code as MapTheme)}
                          className={`flex flex-col items-center justify-center py-8 rounded-[2rem] border-4 transition-all ${tempMapTheme === theme.code ? 'bg-accent border-accent text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-background-dark border-transparent text-slate-400'}`}
                        >
                          <span className="material-symbols-outlined text-4xl mb-2">{theme.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DIVISA */}
                  <div className="space-y-8 pt-12 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-green-500/10 text-green-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">payments</span>
                      </div>
                      <div>
                        <p className="text-xl font-black dark:text-white uppercase italic tracking-tighter leading-none">{t('currency_label')}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Precios en tiempo real</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {currencies.map(curr => (
                        <button
                          key={curr.code}
                          onClick={() => setTempCurrency(curr.code as Currency)}
                          className={`flex flex-col items-center justify-center py-8 rounded-[2rem] border-4 transition-all ${tempCurrency === curr.code ? 'bg-green-500 border-green-500 text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-background-dark border-transparent text-slate-400'}`}
                        >
                          <span className="text-3xl font-black mb-2">{curr.symbol}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{curr.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BOTON APLICAR */}
                  <div className="pt-12">
                      <button 
                       onClick={handleApplyChanges}
                       className={`w-full py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-5 transition-all shadow-2xl active:scale-95 ${showSuccess ? 'bg-green-500 text-white' : 'bg-primary text-white hover:brightness-110'}`}
                      >
                        <span className="material-symbols-outlined text-3xl">{showSuccess ? 'done_all' : 'save'}</span>
                        {showSuccess ? 'CAMBIOS APLICADOS' : t('apply_changes')}
                      </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                {(!user.savedItineraries || user.savedItineraries.length === 0) ? (
                  <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-24 text-center border border-slate-100 dark:border-white/5 shadow-xl flex flex-col items-center">
                    <span className="material-symbols-outlined text-8xl text-primary/10 mb-8">explore_off</span>
                    <h3 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter">{t('no_trips')}</h3>
                    <button onClick={() => navigate('/planner')} className="mt-10 bg-primary text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-[10px]">{t('start_btn')}</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {user.savedItineraries.map((trip) => (
                      <div 
                        key={trip.id}
                        className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row items-center gap-8"
                      >
                        <div className="w-full md:w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                           <span className="material-symbols-outlined text-5xl">landscape</span>
                           <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                        </div>
                        
                        <div className="flex-1 space-y-2 text-center md:text-left">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Viaje de {trip.days} días</p>
                          <h4 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter leading-tight">Ruta del {new Date(trip.createdAt).toLocaleDateString()}</h4>
                          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                            {trip.categories.map(cat => (
                              <span key={cat} className="text-[8px] font-black text-slate-500 bg-slate-100 dark:bg-background-dark px-3 py-1 rounded-full uppercase border border-slate-200 dark:border-white/5">{t(cat.toLowerCase())}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => handleOpenTrip(trip)}
                            className="flex-1 md:w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-all"
                          >
                            <span className="material-symbols-outlined">explore</span>
                          </button>
                          <button 
                            onClick={() => deleteItinerary(trip.id)}
                            className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
