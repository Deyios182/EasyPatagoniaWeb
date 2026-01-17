import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';

const HighlightsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { allAttractions, allLocalities } = useAppAuth();
    const [selectedLocality, setSelectedLocality] = useState<string>('all');

    // Filter only imperdibles
    const highlights = useMemo(() => {
        let filtered = allAttractions;

        if (selectedLocality !== 'all') {
            filtered = filtered.filter(a => a.locality_id === selectedLocality);
        }

        return filtered;
    }, [allAttractions, selectedLocality]);

    const openInGoogleMaps = (lat?: number, lng?: number, name?: string) => {
        if (!lat || !lng) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name || '')}`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden transition-colors duration-300">
            {/* Cabecera Fija Estandarizada */}
            <div className="sticky top-0 p-6 md:p-10 flex flex-col gap-6 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl shadow-xl z-50 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/map')}
                            className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-white/10 shrink-0 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-3xl">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter uppercase italic">Imperdibles</h1>
                            <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-[0.4em] mt-2">Lugares Destacados</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto md:min-w-[300px]">
                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-background-dark px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                            <span className="material-symbols-outlined text-primary text-2xl">place</span>
                            <select
                                value={selectedLocality}
                                onChange={e => setSelectedLocality(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-black text-slate-800 dark:text-white w-full cursor-pointer uppercase tracking-widest"
                            >
                                <option value="all" className="bg-white dark:bg-slate-800">Todas las localidades</option>
                                {allLocalities.filter(l => l.is_active).map(loc => (
                                    <option key={loc.id} value={loc.id} className="bg-white dark:bg-slate-800">{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar bg-slate-50 dark:bg-background-dark/30 pb-40">
                <div className="max-w-7xl mx-auto">
                    {highlights.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {highlights.map(place => (
                                <div
                                    key={place.id}
                                    className="group relative bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom"
                                >
                                    {/* Imagen */}
                                    <div className="relative h-72 overflow-hidden">
                                        <img
                                            src={place.main_image_url || 'https://via.placeholder.com/400'}
                                            alt={place.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                                        {/* Google Maps Button */}
                                        {place.latitude && place.longitude && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/map', { state: { selectedAttractionId: place.id } });
                                                }}
                                                className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-primary hover:border-white transition-all z-20 shadow-lg"
                                                title="Ver en Mapa"
                                            >
                                                <span className="material-symbols-outlined text-2xl">map</span>
                                            </button>
                                        )}

                                        <div className="absolute bottom-0 left-0 p-8 w-full">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="bg-primary/90 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                                                    {allLocalities.find(l => l.id === place.locality_id)?.name || 'Patagonia'}
                                                </span>
                                            </div>
                                            <h3 className="text-3xl font-black text-white uppercase italic leading-none drop-shadow-lg">{place.name}</h3>
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-8 space-y-6">
                                        <div className="flex gap-2 flex-wrap">
                                            {place.keywords?.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tag}</span>
                                            ))}
                                        </div>

                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">
                                            {place.short_description || place.description}
                                        </p>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => navigate(`/attraction/${place.id}`)}
                                                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-background-dark font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-lg"
                                            >
                                                Detalles
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-slate-400">landscape</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic mb-2">Sin Destinos</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No hay atractivos en esta localidad.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <BottomNavigationBar />
        </div>
    );
};

export default HighlightsScreen;
