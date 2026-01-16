import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

const HighlightsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { allAttractions, allLocalities } = useAppAuth();
    const [selectedLocality, setSelectedLocality] = useState<string>('all');

    // Filter only imperdibles (you can add a field "is_highlight" to attractions table later)
    // For now, we'll show all attractions since there's no "imperdible" flag yet
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
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-body overflow-y-auto">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[150px]"></div>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">grade</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Lugares Destacados</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                            Imperdibles
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                            Los lugares más icónicos y recomendados de la Patagonia Aysenina
                        </p>
                    </div>

                    {/* Locality Filters */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        <button
                            onClick={() => setSelectedLocality('all')}
                            className={`whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === 'all'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                                }`}
                        >
                            Todos
                        </button>
                        {allLocalities.filter(l => l.is_active).map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => setSelectedLocality(loc.id)}
                                className={`whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === loc.id
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                                    }`}
                            >
                                {loc.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid de Imperdibles */}
            <div className="p-8 md:p-12">
                {highlights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {highlights.map(place => (
                            <div
                                key={place.id}
                                className="group relative bg-white dark:bg-surface-dark rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-white/5"
                            >
                                {/* Imagen */}
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={place.main_image_url || 'https://via.placeholder.com/400'}
                                        alt={place.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                                    {/* Google Maps Button */}
                                    {place.latitude && place.longitude && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/map', { state: { selectedAttractionId: place.id } });
                                            }}
                                            className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-md p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                                            title="Ver en Mapa Interactivo"
                                        >
                                            <span className="material-symbols-outlined text-primary text-xl">map</span>
                                        </button>
                                    )}

                                    {/* Badge Imperdible */}
                                    <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                                        <span className="material-symbols-outlined text-white text-sm">grade</span>
                                        <span className="text-white text-xs font-black uppercase tracking-wider">Imperdible</span>
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">
                                        {place.name}
                                    </h3>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                                        {place.short_description || place.long_description || 'Descubre este increíble lugar de la Patagonia.'}
                                    </p>

                                    {/* Tags */}
                                    {place.keywords && place.keywords.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {place.keywords.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[9px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full uppercase font-black"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Botones */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/attraction/${place.id}`)}
                                            className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                                        >
                                            Ver Detalles
                                        </button>
                                        {place.latitude && place.longitude && (
                                            <button
                                                onClick={() => openInGoogleMaps(place.latitude, place.longitude, place.name)}
                                                className="bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">directions</span>
                                                Cómo llegar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-8xl mb-4">explore_off</span>
                        <h3 className="text-2xl font-black text-slate-400 dark:text-slate-600 mb-2">
                            No hay imperdibles en esta localidad
                        </h3>
                        <p className="text-slate-500 dark:text-slate-500">
                            Pronto agregaremos más lugares destacados.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HighlightsScreen;
