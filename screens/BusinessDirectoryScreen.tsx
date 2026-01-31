
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Category } from '../types';
import { supabase } from '../supabaseClient';
import BottomNavigationBar from '../components/BottomNavigationBar';

const BusinessDirectoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, t } = useAppAuth();
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [localityFilter, setLocalityFilter] = useState<string>('all'); // Filtro por localidad
  const [localities, setLocalities] = useState<any[]>([]); // Lista de localidades
  const [isScrolled, setIsScrolled] = useState(false);

  // Cargar localidades al montar
  useEffect(() => {
    const loadLocalities = async () => {
      const { data } = await supabase.from('localities').select('*').order('name');
      setLocalities(data || []);
    };
    loadLocalities();
  }, []);

  const filtered = useMemo(() => {
    console.log('🔍 [FILTER] localityFilter:', localityFilter, 'filter:', filter);

    const result = allBusinesses.filter(b => {
      let matchesFilter = false;
      if (filter === 'All') {
        matchesFilter = true;
      } else if (filter === 'Actividad') {
        matchesFilter = ['Actividad', 'Tour Operador', 'Agencia', 'Tour', 'Excursión'].some(c => b.categoria.includes(c));
      } else if (filter === 'Hospedaje') {
        matchesFilter = ['Hospedaje', 'Hotel', 'Cabaña', 'Hostal', 'Lodge', 'Camping', 'Alojamiento'].some(c => b.categoria.includes(c));
      } else if (filter === 'Restaurante') {
        matchesFilter = ['Restaurante', 'Cafetería', 'Bar', 'Gastronomía', 'Comida'].some(c => b.categoria.includes(c));
      } else if (filter === 'Transporte') {
        matchesFilter = ['Transporte', 'Transfer', 'Taxi'].some(c => b.categoria.includes(c));
      } else if (filter === 'Mercado') {
        matchesFilter = ['Mercado', 'Artesanía', 'Comercio', 'Tienda'].some(c => b.categoria.includes(c));
      } else {
        matchesFilter = b.categoria === filter;
      }

      // Filtro por localidad
      const matchesLocality = localityFilter === 'all' || b.locality_id === localityFilter;

      console.log(`  ${b.nombre}: locality_id=${b.locality_id} matchesLocality=${matchesLocality}`);

      return matchesFilter && matchesLocality;
    });

    console.log('✅ [FILTER] Resultado:', result.length, 'empresas');
    return result;
  }, [allBusinesses, filter, localityFilter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 50);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <div className="sticky top-0 p-4 md:p-10 flex flex-col gap-4 md:gap-6 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl shadow-xl z-50 border-b border-white/10 transition-all duration-300">

        {!isScrolled && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/map')}
                className="hidden md:flex w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 items-center justify-center hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-white/10 shrink-0"
              >
                <span className="material-symbols-outlined text-3xl">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl md:text-5xl font-black dark:text-white leading-none tracking-tighter uppercase italic">{t('directory_title')}</h1>
                <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-[0.4em] mt-2">EASY COLABORADORES</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full md:w-auto md:min-w-[300px]">
          <div className="flex items-center gap-4 bg-slate-100 dark:bg-background-dark px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
            <span className="material-symbols-outlined text-primary text-2xl">place</span>
            <select
              value={localityFilter}
              onChange={e => setLocalityFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-black dark:text-white w-full cursor-pointer uppercase tracking-widest"
            >
              <option value="all" className="bg-slate-800">Todas las localidades</option>
              {localities.map(loc => (
                <option key={loc.id} value={loc.id} className="bg-slate-800">{loc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
          {['All', 'Restaurante', 'Hospedaje', 'Actividad', 'Transporte', 'Mercado'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === cat ? 'bg-primary border-primary text-white scale-105 shadow-lg' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              {cat === 'All' ? t('all') : t(cat.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar bg-slate-50 dark:bg-background-dark/30 pb-24 md:pb-40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filtered.map((biz, idx) => (
              <div
                key={biz.id}
                onClick={() => navigate(`/details/${biz.id}`)}
                className="bg-white dark:bg-surface-dark rounded-[4rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer group animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-72 overflow-hidden bg-white flex items-center justify-center p-8 border-b border-slate-100">
                  {/* LOGO GIGANTE COMO PROTAGONISTA */}
                  <img
                    src={biz.media.logo_url}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xl"
                    alt={biz.nombre}
                  />

                  <div className="absolute top-6 left-6">
                    <span className="px-5 py-2 bg-slate-900/10 dark:bg-black/50 backdrop-blur-md text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20">
                      {t(biz.categoria.toLowerCase())}
                    </span>
                  </div>
                  <div className="absolute bottom-6 right-6">
                    <div className="bg-white dark:bg-surface-dark px-4 py-2 rounded-full flex items-center gap-1.5 text-primary shadow-lg border border-slate-100 dark:border-white/10">
                      <span className="material-symbols-outlined text-sm">star</span>
                      <span className="text-xs font-black">{biz.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="p-10 space-y-8">
                  <div>
                    <h3 className="text-2xl font-black dark:text-white tracking-tighter leading-tight uppercase italic group-hover:text-primary transition-colors">{biz.nombre}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-4 leading-relaxed">{biz.info.descripcion}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${biz.isOpen ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'}`}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{biz.isOpen ? t('business_status_open') : t('business_status_closed')}</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                      <span className="material-symbols-outlined text-2xl">chevron_right</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavigationBar />
    </div >
  );
};

export default BusinessDirectoryScreen;
