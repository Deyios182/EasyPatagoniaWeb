
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateActivityPreview } from '../geminiService';
import { useAppAuth } from '../App';
import { SavedItinerary, ItineraryDay } from '../types';

const ItineraryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, saveItinerary, t } = useAppAuth();
  const [activityImages, setActivityImages] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  const storedPlan = localStorage.getItem('ep_plan');
  const storedMeta = localStorage.getItem('ep_plan_meta');

  const plan: ItineraryDay[] = storedPlan ? JSON.parse(storedPlan) : [];
  const meta = storedMeta ? JSON.parse(storedMeta) : null;

  useEffect(() => {
    const fetchImages = async () => {
      const newImages: Record<string, string> = {};
      const dayActivities = plan.find(d => d.day === currentDay)?.activities || [];
      for (const act of dayActivities) {
        if (!activityImages[act.title]) {
          const img = await generateActivityPreview(act.title);
          if (img) newImages[act.title] = img;
        }
      }
      setActivityImages(prev => ({ ...prev, ...newImages }));
    };
    if (plan.length > 0) fetchImages();
  }, [currentDay, storedPlan]);

  const findBusinessId = (name?: string) => {
    if (!name) return null;
    return allBusinesses.find(b => b.name.toLowerCase().includes(name.toLowerCase()))?.id;
  };

  const handleSaveToProfile = async () => {
    if (!plan || !meta) return;
    setIsSaving(true);
    const newTrip: SavedItinerary = {
      id: `trip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      days: meta.days,
      budget: meta.budget,
      categories: meta.categories,
      plan: plan
    };

    // Now await the save (which persists to Supabase in App.tsx)
    await saveItinerary(newTrip);

    setIsSaving(false);
    navigate('/profile');
  };

  if (plan.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-background-dark">
        <span className="material-symbols-outlined text-8xl text-primary/20 mb-8">explore_off</span>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">No tienes un itinerario aún</h2>
        <button onClick={() => navigate('/planner')} className="mt-8 bg-primary text-white px-12 py-5 rounded-full font-black uppercase tracking-widest text-xs">Crear mi primera aventura</button>
      </div>
    );
  }

  const activeDayPlan = plan.find(d => d.day === currentDay);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar items-center pb-32">
      <div className="w-full max-w-4xl p-6 md:p-12 space-y-12">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/planner')} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5 hover:bg-primary hover:text-white transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase font-black text-primary tracking-[0.4em] mb-2">Mi Ruta Aysén</p>
            <h1 className="text-3xl font-black dark:text-white leading-none uppercase italic tracking-tighter">Aventura Planificada</h1>
          </div>
          <button className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        {/* Selector de Días */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {plan.map((d) => (
            <button
              key={d.day}
              onClick={() => setCurrentDay(d.day)}
              className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all border ${currentDay === d.day ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-white dark:bg-surface-dark dark:text-slate-400 border-slate-200 dark:border-white/5'}`}
            >
              Día {d.day}
            </button>
          ))}
        </div>

        {/* Itinerario del Día */}
        <div className="space-y-12 relative animate-in fade-in duration-700">
          <div className="absolute left-[27px] top-10 bottom-10 w-[4px] bg-primary/20 rounded-full"></div>

          {activeDayPlan?.activities.map((act, idx) => {
            const bizId = findBusinessId(act.businessName);
            return (
              <div key={idx} className="flex gap-8 relative group">
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center z-10 shadow-xl border-4 border-white dark:border-background-dark ${idx === 0 ? 'bg-primary text-white' : 'bg-white dark:bg-surface-dark dark:text-slate-400'}`}>
                    <span className="text-[10px] font-black leading-none">{act.time.split(' ')[0]}</span>
                    <span className="text-[8px] font-bold opacity-70 mt-0.5">{act.time.split(' ')[1] || 'AM'}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-2xl transition-all group/card">
                    <div className="relative h-64 overflow-hidden">
                      {activityImages[act.title] ? (
                        <img src={activityImages[act.title]} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-[5s]" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-background-dark flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary/20 text-6xl animate-pulse">landscape</span>
                        </div>
                      )}
                      <div className="absolute top-6 right-6 flex gap-2">
                        <span className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-white/20">
                          {act.category || 'Actividad'}
                        </span>
                      </div>
                    </div>

                    <div className="p-10">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black dark:text-white leading-tight flex-1 pr-6 uppercase italic tracking-tighter">{act.title}</h3>
                        {act.businessName && (
                          <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 shrink-0">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Verificado</p>
                            <p className="text-[10px] font-bold dark:text-white mt-1 leading-none truncate max-w-[120px]">{act.businessName}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic border-l-2 border-primary/30 pl-6 mb-8">{act.description}</p>

                      {bizId && (
                        <button
                          onClick={() => navigate(`/details/${bizId}`)}
                          className="w-full py-4 bg-slate-100 dark:bg-background-dark text-slate-500 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all"
                        >
                          Explorar Aliado Local <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Acciones */}
      <div className="fixed bottom-10 left-0 right-0 max-w-4xl mx-auto px-6 z-[120] pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={() => navigate('/planner')}
            className="flex-1 bg-white dark:bg-surface-dark dark:text-white font-black h-20 rounded-full shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-slate-200 dark:border-white/10 uppercase tracking-widest text-[10px]"
          >
            <span className="material-symbols-outlined">restart_alt</span>
            Ajustar
          </button>
          <button
            onClick={handleSaveToProfile}
            disabled={isSaving}
            className={`flex-[2] bg-primary text-white font-black h-20 rounded-full shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-widest text-[10px] ${isSaving ? 'opacity-70 scale-95' : ''}`}
          >
            <span className="material-symbols-outlined text-2xl">{isSaving ? 'sync' : 'bookmark_heart'}</span>
            {isSaving ? 'Guardando...' : t('save_trip')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryScreen;
