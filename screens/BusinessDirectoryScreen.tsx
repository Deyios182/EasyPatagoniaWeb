
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Category } from '../types';

const BusinessDirectoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, t } = useAppAuth();
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return allBusinesses.filter(b => {
      const matchesFilter = filter === 'All' || b.categoria === filter;
      const matchesSearch = b.nombre.toLowerCase().includes(query.toLowerCase()) || 
                            b.servicios.some(s => s.nombre.toLowerCase().includes(query.toLowerCase())) ||
                            b.info.descripcion.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allBusinesses, filter, query]);

  return (
    <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <div className="sticky top-0 p-6 md:p-12 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl shadow-xl z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto space-y-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate('/map')} 
                  className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-white/10"
                >
                  <span className="material-symbols-outlined text-3xl">arrow_back</span>
                </button>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black dark:text-white leading-none tracking-tighter uppercase italic">{t('directory_title')}</h1>
                  <p className="text-xs text-primary font-black uppercase tracking-[0.4em] mt-2">{t('discovery_subtitle')}</p>
                </div>
              </div>
              <div className="flex-1 md:max-w-md">
                 <div className="flex items-center gap-4 bg-slate-100 dark:bg-background-dark px-8 py-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner group">
                    <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform">search</span>
                    <input 
                      type="text" 
                      placeholder={t('search_placeholder')} 
                      className="bg-transparent border-none focus:ring-0 text-base dark:text-white w-full placeholder:text-slate-400 font-bold"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           <div className="relative">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
                {['All', 'Restaurante', 'Hospedaje', 'Actividad', 'Transporte'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`whitespace-nowrap px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all border ${filter === cat ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-primary/50'}`}
                  >
                    {cat === 'All' ? t('all') : t(cat.toLowerCase())}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar bg-slate-50 dark:bg-background-dark/30 pb-40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filtered.map((biz, idx) => (
              <div 
                key={biz.id}
                onClick={() => navigate(`/details/${biz.id}`)}
                className="bg-white dark:bg-surface-dark rounded-[4rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer group animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative h-72 overflow-hidden bg-slate-200">
                   <img src={biz.media.fotos_url[0] || biz.media.logo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[8s]" alt={biz.nombre} />
                   <div className="absolute top-8 left-8">
                      <span className="px-6 py-2.5 bg-black/50 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20">
                         {t(biz.categoria.toLowerCase())}
                      </span>
                   </div>
                   <div className="absolute bottom-8 right-8">
                      <div className="bg-white dark:bg-surface-dark px-5 py-2.5 rounded-[1.5rem] flex items-center gap-2 text-primary shadow-2xl border border-white/10">
                        <span className="material-symbols-outlined text-sm">star</span>
                        <span className="text-sm font-black">{biz.rating}</span>
                      </div>
                   </div>
                </div>
                
                <div className="p-10 space-y-8">
                   <div>
                      <h3 className="text-3xl font-black dark:text-white tracking-tighter truncate leading-tight uppercase italic group-hover:text-primary transition-colors">{biz.nombre}</h3>
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
    </div>
  );
};

export default BusinessDirectoryScreen;
