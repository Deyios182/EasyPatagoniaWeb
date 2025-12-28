
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppAuth } from '../App';

// interface IconicPlace removed (using dynamic data)

const DiscoveryScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allBusinesses, allAttractions, allLocalities, t } = useAppAuth();
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [activeLocality, setActiveLocality] = useState<string>('All');

  // Auto-open attraction if passed via navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedAttractionId) {
      const attraction = allAttractions.find(a => a.id === state.selectedAttractionId);
      if (attraction) {
        setSelectedPlace(attraction);
      }
    }
  }, [location.state, allAttractions]);

  // Filter Attractions by Locality
  const displayedPlaces = useMemo(() => {
    if (activeLocality === 'All') return allAttractions;
    return allAttractions.filter(a => a.locality_id === activeLocality);
  }, [allAttractions, activeLocality]);

  const getOperatorsForPlace = (place: any) => {
    const keywords = place.keywords || [place.name];
    if (!keywords || keywords.length === 0) return [];

    return allBusinesses.filter(biz =>
      keywords.some((k: string) =>
        (biz.nombre || '').toLowerCase().includes(k.toLowerCase()) ||
        (biz.info?.descripcion || '').toLowerCase().includes(k.toLowerCase()) ||
        biz.servicios?.some((s: any) => (s.nombre || '').toLowerCase().includes(k.toLowerCase()))
      )
    ).slice(0, 6);
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">

      {selectedPlace && (
        <div className="absolute inset-0 z-[120] bg-background-dark/95 backdrop-blur-xl animate-in slide-in-from-bottom duration-500 overflow-y-auto no-scrollbar">
          <div className="sticky top-8 left-8 z-[130] h-0 overflow-visible pointer-events-none">
            <button
              onClick={() => setSelectedPlace(null)}
              className="bg-black/50 backdrop-blur-md text-white w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 hover:bg-primary transition-all shadow-2xl pointer-events-auto"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          <div className="flex flex-col min-h-screen">
            <div className="w-full h-[50vh] md:h-[70vh] bg-black overflow-hidden relative shrink-0">
              <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                {selectedPlace.gallery_urls?.map((img: string, i: number) => (
                  <div key={i} className="w-full h-full shrink-0 snap-center">
                    <img src={img} className="w-full h-full object-cover" alt={selectedPlace.name} />
                  </div>
                )) || (
                    <img src={selectedPlace.main_image_url} className="w-full h-full object-cover" />
                  )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent pointer-events-none"></div>
            </div>

            <div className="flex-1 p-8 md:p-20 space-y-12 pb-32">
              <div className="space-y-6">
                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight uppercase italic">{selectedPlace.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.keywords?.map((kw: string) => (
                    <span key={kw} className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300 text-lg md:text-2xl leading-relaxed italic border-l-4 border-primary/40 pl-8">
                  {selectedPlace.long_description || selectedPlace.short_description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPlace.tips?.map((tip: string, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                    <p className="text-sm font-bold text-slate-300">{tip}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-8 pt-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-1 bg-primary"></div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">{t('verified_ops')}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getOperatorsForPlace(selectedPlace).map((op: any) => (
                    <div
                      key={op.id}
                      onClick={() => navigate(`/details/${op.id}`)}
                      className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-4 hover:bg-primary/20 cursor-pointer transition-all group"
                    >
                      <img src={op.media.logo_url} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate uppercase">{op.nombre}</p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t(op.categoria.toLowerCase())}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 p-6 md:p-10 flex flex-col gap-6 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl shadow-xl z-50 border-b border-white/10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/map')} className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black dark:text-white uppercase italic">{t('discovery_title')}</h1>
            <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-[0.4em] mt-2">{t('discovery_subtitle')}</p>
          </div>
        </div>

        {/* LOCALITY FILTER */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveLocality('All')}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeLocality === 'All' ? 'bg-primary border-primary text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
          >
            {t('all')}
          </button>
          {allLocalities?.map(loc => (
            <button
              key={loc.id}
              onClick={() => setActiveLocality(loc.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeLocality === loc.id ? 'bg-primary border-primary text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar pb-40 space-y-20 max-w-7xl mx-auto w-full">
        {displayedPlaces?.map((place, idx) => (
          <div key={place.id} className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
            <div
              className="relative h-[400px] md:h-[600px] rounded-[4rem] overflow-hidden shadow-2xl group border border-white/10 bg-slate-200 cursor-pointer mb-10"
              onClick={() => setSelectedPlace(place)}
            >
              <img src={place.main_image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={place.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <h2 className="text-white text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.8]">{place.name}</h2>
                  <p className="text-slate-300 text-sm md:text-xl font-medium max-w-xl">{place.short_description}</p>
                </div>
                <button className="bg-primary text-white font-black px-10 py-5 rounded-full uppercase tracking-widest text-xs shadow-xl">
                  {t('explore_place')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoveryScreen;
