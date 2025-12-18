
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

interface IconicPlace {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  gallery: string[];
  keywords: string[];
  tips: string[];
}

const DiscoveryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, language, t } = useAppAuth();
  const [selectedPlace, setSelectedPlace] = useState<IconicPlace | null>(null);

  const ICONIC_PLACES_DATA: Record<string, IconicPlace[]> = {
    ES: [
      {
        id: 'marmol',
        title: 'Capillas de Mármol',
        description: 'Santuario de la naturaleza en el corazón del Lago General Carrera.',
        longDescription: 'Estas formaciones minerales de carbonato de calcio han sido erosionadas durante miles de años por el oleaje del Lago General Carrera. Las aguas turquesas del lago reflejan sus tonalidades en las paredes de mármol.',
        image: 'https://images.unsplash.com/photo-1517748975545-35696f174b0c?auto=format&fit=crop&q=80&w=1200',
        gallery: [
          'https://images.unsplash.com/photo-1517748975545-35696f174b0c',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5'
        ],
        keywords: ['Mármol', 'Navegación', 'Catedral'],
        tips: ['Llevar ropa impermeable', 'La mejor luz es por la mañana', 'Salidas desde Puerto Tranquilo']
      },
      {
        id: 'exploradores',
        title: 'Glaciar Exploradores',
        description: 'Un gigante de hielo milenario descendiendo de Campos de Hielo Norte.',
        longDescription: 'Ubicado a 52 km de Puerto Río Tranquilo, ofrece la oportunidad única de caminar sobre hielo milenario con guías expertos.',
        image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&q=80&w=1200',
        gallery: ['https://images.unsplash.com/photo-1473116763249-2faaef81ccda'],
        keywords: ['Exploradores', 'Glaciar', 'Hielo'],
        tips: ['Se requiere buen estado físico', 'Incluye crampones', 'Duración: 6-8 horas']
      },
      {
        id: 'cerro-castillo',
        title: 'Cerro Castillo',
        description: 'La corona de piedra de la Carretera Austral.',
        longDescription: 'Uno de los trekkings más hermosos de Chile. Su cumbre de agujas de basalto y su laguna color turquesa a los pies lo convierten en un imperdible para amantes de la montaña.',
        image: 'https://images.unsplash.com/photo-1511497584788-8767fe7800b1?auto=format&fit=crop&q=80&w=1200',
        gallery: ['https://images.unsplash.com/photo-1511497584788-8767fe7800b1'],
        keywords: ['Trekking', 'Montaña', 'Castillo'],
        tips: ['Ruta exigente (full day)', 'Verificar clima antes de subir', 'Salida desde Villa Cerro Castillo']
      },
      {
        id: 'rio-baker',
        title: 'Río Baker',
        description: 'El río más caudaloso de Chile y sus aguas turquesas.',
        longDescription: 'Famoso por su color turquesa intenso y su gran caudal. Es el paraíso de la pesca con mosca y el rafting, atravesando valles profundos de la Patagonia.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200',
        gallery: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
        keywords: ['Río', 'Baker', 'Rafting'],
        tips: ['Visitar la Confluencia con el Río Nef', 'Puerto Bertrand es la capital del Baker', 'Ideal para kayak y pesca']
      },
      {
        id: 'puyuhuapi',
        title: 'Termas de Puyuhuapi',
        description: 'Relajación absoluta donde el bosque se une con el mar.',
        longDescription: 'Ubicadas en el Fiordo Puyuhuapi, estas termas ofrecen una mezcla única de aguas minerales y clima oceánico, rodeadas de la exuberante Selva Valdiviana.',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200',
        gallery: ['https://images.unsplash.com/photo-1540541338287-41700207dee6'],
        keywords: ['Termas', 'Relax', 'Selva'],
        tips: ['Se llega por lancha desde la carretera', 'Ideal para descansar tras varios días de viaje', 'Cerca del Ventisquero Queulat']
      }
    ]
  };

  const iconicPlaces = useMemo(() => ICONIC_PLACES_DATA[language] || ICONIC_PLACES_DATA['ES'], [language]);

  const getOperatorsForPlace = (place: IconicPlace) => {
    return allBusinesses.filter(biz => 
      biz.nombre.toLowerCase().includes(place.keywords[0].toLowerCase()) ||
      biz.info.descripcion.toLowerCase().includes(place.keywords[0].toLowerCase()) ||
      biz.servicios.some(s => s.nombre.toLowerCase().includes(place.keywords[0].toLowerCase()))
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
                {selectedPlace.gallery.map((img, i) => (
                  <div key={i} className="w-full h-full shrink-0 snap-center">
                    <img src={img} className="w-full h-full object-cover" alt={selectedPlace.title} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent pointer-events-none"></div>
            </div>

            <div className="flex-1 p-8 md:p-20 space-y-12 pb-32">
              <div className="space-y-6">
                <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight uppercase italic">{selectedPlace.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.keywords.map(kw => (
                    <span key={kw} className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                 <p className="text-slate-300 text-lg md:text-2xl leading-relaxed italic border-l-4 border-primary/40 pl-8">
                    {selectedPlace.longDescription}
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPlace.tips.map((tip, i) => (
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
                    {getOperatorsForPlace(selectedPlace).map(op => (
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

      <div className="sticky top-0 p-6 md:p-10 flex items-center justify-between bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl shadow-xl z-50 border-b border-white/10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/map')} className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-black dark:text-white uppercase italic">{t('discovery_title')}</h1>
            <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-[0.4em] mt-2">{t('discovery_subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar pb-40 space-y-20 max-w-7xl mx-auto w-full">
        {iconicPlaces.map((place, idx) => (
          <div key={place.id} className="animate-in slide-in-from-bottom duration-700" style={{animationDelay: `${idx * 150}ms`}}>
            <div 
              className="relative h-[400px] md:h-[600px] rounded-[4rem] overflow-hidden shadow-2xl group border border-white/10 bg-slate-200 cursor-pointer mb-10"
              onClick={() => setSelectedPlace(place)}
            >
              <img src={place.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[10s]" alt={place.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                 <div className="space-y-4">
                    <h2 className="text-white text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.8]">{place.title}</h2>
                    <p className="text-slate-300 text-sm md:text-xl font-medium max-w-xl">{place.description}</p>
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
