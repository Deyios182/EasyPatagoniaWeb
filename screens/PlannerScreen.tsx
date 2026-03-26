
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
    { id: 'Restaurante', icon: 'restaurant', label: t('restaurant') },
    { id: 'Transporte', icon: 'directions_bus', label: t('transport') },
    { id: 'Mercado', icon: 'storefront', label: 'Mercado' }
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
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center p-4 md:p-12 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-4xl space-y-12 pb-24">

        {/* Header Chat Unificado (Igual a Chatbot) */}
        <div className="p-6 md:p-8 bg-surface-dark mx-[-16px] md:mx-[-48px] mt-[-16px] md:mt-[-48px] mb-8 flex flex-col text-white shadow-xl relative z-50">
          <div className="flex items-center gap-5 mb-6">
            <button onClick={() => navigate('/map')} className="hidden md:flex w-12 h-12 items-center justify-center rounded-2xl hover:bg-white/10 transition-all no-underline">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </div>
            <div className="flex-1">
              <h2 className="font-black text-lg tracking-tight uppercase italic flex items-center flex-wrap">
                Patagon<span className="text-primary text-[10px] font-bold ml-2 not-italic bg-primary/20 px-2 py-1 rounded-full uppercase tracking-widest">IA</span>
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Taller de Rutas</span>
              </div>
            </div>
            {/* Botón para ver el último plan si existe */}
            {localStorage.getItem('ep_plan') && (
              <button
                onClick={() => navigate('/itinerary')}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl bg-primary/20 text-white hover:bg-primary transition-all animate-pulse border border-primary/30 shadow-lg"
              >
                <span className="material-symbols-outlined text-sm md:text-lg">visibility</span>
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Ver Último Plan</span>
              </button>
            )}
          </div>

          {/* TABS */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl max-w-2xl mx-auto w-full">
             <button onClick={() => navigate('/chat')} className="flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-lg">chat</span> Asistente
             </button>
             <button className="flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-primary text-white shadow-lg flex items-center justify-center gap-2">
               <span className="material-symbols-outlined text-lg">auto_awesome</span> Armar Itinerario
             </button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-100 dark:border-white/5 space-y-12 md:space-y-16">

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
