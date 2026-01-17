
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateItineraryAI } from '../geminiService';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';
import { Category } from '../types';
import BottomNavigationBar from '../components/BottomNavigationBar';

const PlannerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, language, t } = useAppAuth();
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState('1.500.000 CLP');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['Restaurante', 'Hospedaje', 'Actividad']);
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Derive unique localities from business data
  const uniqueLocalities = React.useMemo(() => {
    const locs = new Set(allBusinesses.map(b => b.locality_name).filter(Boolean) as string[]);
    return Array.from(locs).sort();
  }, [allBusinesses]);

  // RESTORE STATE from LocalStorage (Draft)
  useEffect(() => {
    const savedMeta = localStorage.getItem('ep_plan_meta');
    if (savedMeta) {
      try {
        const parsed = JSON.parse(savedMeta);
        if (parsed.days) setDays(parsed.days);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.categories) setSelectedCategories(parsed.categories);
        if (parsed.localities) setSelectedLocalities(parsed.localities);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  // AUTO-SAVE Draft
  useEffect(() => {
    localStorage.setItem('ep_plan_meta', JSON.stringify({ days, budget, categories: selectedCategories, localities: selectedLocalities }));
  }, [days, budget, selectedCategories, selectedLocalities]);

  const categories: { id: Category, icon: string, label: string }[] = [
    { id: 'Hospedaje', icon: 'hotel', label: t('hotel') },
    { id: 'Actividad', icon: 'hiking', label: t('activity') },
    { id: 'Restaurante', icon: 'restaurant', label: t('restaurant') },
    { id: 'Transporte', icon: 'directions_bus', label: t('transport') }
  ];

  const toggleCategory = (cat: Category) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleLocality = (loc: string) => {
    setSelectedLocalities(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) {
      alert(language === 'ES' ? "Selecciona al menos una categoría" : "Select at least one category");
      return;
    }
    setLoading(true);
    const plan = await generateItineraryAI(days, budget, selectedCategories, allBusinesses, selectedLocalities, language);
    if (plan) {
      localStorage.setItem('ep_plan', JSON.stringify(plan));
      localStorage.setItem('ep_plan_meta', JSON.stringify({ days, budget, categories: selectedCategories, localities: selectedLocalities }));
      navigate('/itinerary');
    } else {
      alert(language === 'ES' ? "No se pudo generar el itinerario. Es posible que el servicio de IA esté saturado momentáneamente. Por favor, intenta de nuevo en unos segundos." : "Could not generate itinerary. AI service might be busy. Please try again shortly.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background-dark text-white p-12 text-center">
        <div className="w-32 h-32 relative mb-12">
          <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary animate-pulse">auto_awesome</span>
          </div>
        </div>
        <h2 className="text-4xl font-black mb-6 tracking-tighter uppercase italic">
          {language === 'ES' ? 'DISEÑANDO TU RUTA' : language === 'EN' ? 'DESIGNING YOUR ROUTE' : 'PLANEJANDO SUA ROTA'}
        </h2>
        <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto italic">
          {language === 'ES' ? 'Conectando servicios locales para armar tu itinerario ideal...' : 'Connecting local services to build your ideal itinerary...'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center p-6 md:p-12 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-4xl space-y-12 pb-24">

        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/map')} className="hidden md:flex w-14 h-14 items-center justify-center rounded-2xl bg-white dark:bg-surface-dark dark:text-white shadow-sm border border-slate-200 dark:border-white/5 hover:bg-primary hover:text-white transition-all">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div className="text-center flex-1 md:flex-initial">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Easy Planner</span>
            <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase italic leading-none">{t('itinerary_title')}</h1>
          </div>
          {/* Botón para ver el último plan si existe */}
          {localStorage.getItem('ep_plan') ? (
            <button
              onClick={() => navigate('/itinerary')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all animate-pulse"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Ver Último Plan</span>
            </button>
          ) : (
            <div className="w-14 hidden md:block"></div>
          )}
        </div>

        <div className="bg-white dark:bg-surface-dark p-10 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-white/5 space-y-16">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Duración */}
            <section className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none italic">Duración</h2>
                <span className="text-primary text-5xl font-black leading-none tracking-tighter">{days} <span className="text-sm">días</span></span>
              </div>
              <input
                type="range" min="1" max="10"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-4 bg-slate-100 dark:bg-background-dark rounded-full appearance-none cursor-pointer accent-primary"
              />
            </section>

            {/* Presupuesto */}
            <section className="space-y-4">
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none italic">Monto Estimado</h2>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ej: 500.000 CLP"
                className="w-full bg-slate-100 dark:bg-background-dark border-none rounded-3xl py-6 px-8 text-xl dark:text-white font-black shadow-inner focus:ring-4 focus:ring-primary/20"
              />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2">Define tu presupuesto para recomendaciones</p>
            </section>
          </div>

          {/* Localidades / Destinos */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-1 bg-primary"></div>
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none italic">¿Dónde quieres ir?</h2>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-14">Selecciona tus destinos (o déjalo vacío para ver todo)</p>

            <div className="flex flex-wrap gap-3 pl-0 md:pl-14">
              {uniqueLocalities.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Cargando destinos...</p>
              ) : (
                uniqueLocalities.map(loc => (
                  <button
                    key={loc}
                    onClick={() => toggleLocality(loc)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedLocalities.includes(loc) ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-slate-50 dark:bg-background-dark border-slate-200 dark:border-white/10 text-slate-500'}`}
                  >
                    {loc}
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Categorías */}
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-1 bg-primary"></div>
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none italic">¿Qué incluimos?</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-4 transition-all group ${selectedCategories.includes(cat.id) ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-background-dark border-transparent text-slate-400'}`}
                >
                  <span className="material-symbols-outlined text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleGenerate}
            className="w-full bg-primary text-white font-black h-28 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.3em] text-sm"
          >
            Diseñar mi Aventura Personalizada
            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
          </button>
        </div>

        <p className="text-center text-slate-500 font-medium italic text-lg px-8">
          "Nuestra IA optimiza tu ruta por la Carretera Austral basándose en los tiempos reales y ubicaciones de nuestros aliados certificados."
        </p>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar />
    </div>
  );
};

export default PlannerScreen;
