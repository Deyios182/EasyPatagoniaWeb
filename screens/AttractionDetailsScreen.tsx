import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Activity, MapPin, ArrowLeft, Star, Camera } from 'lucide-react';

const AttractionDetailsScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { allAttractions, allBusinesses, companyServices } = useAppAuth();

    const attraction = allAttractions.find(a => a.id === id);
    const [relatedServices, setRelatedServices] = useState<any[]>([]);

    useEffect(() => {
        if (!attraction) return;
        // Find services that visit this attraction
        // Assuming companyServices has attraction_id or description mentions it
        // Or we might need to fetch this better. For now, filter by matching attraction_id if available or name match.
        // Actually, in Admin setup, we added attraction_id to services.
        const relevant = companyServices.filter(s => s.attraction_id === attraction.id);
        setRelatedServices(relevant);
    }, [attraction, companyServices]);

    if (!attraction) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header Image */}
            <div className="relative h-[40vh] md:h-[50vh]">
                <img src={attraction.main_image_url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/30 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Botón Cómo llegar */}
                {attraction.latitude && attraction.longitude && (
                    <button
                        onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}&query_place_id=${encodeURIComponent(attraction.name)}`;
                            window.open(url, '_blank');
                        }}
                        className="absolute top-6 right-6 bg-primary hover:bg-primary/90 backdrop-blur-md px-6 py-3 rounded-full text-white font-black text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                    >
                        <span className="material-symbols-outlined">directions</span>
                        Cómo llegar
                    </button>
                )}

                <div className="absolute bottom-6 left-6 right-6">
                    <span className="bg-orange-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full mb-3 inline-block tracking-widest">
                        Atractivo Turístico
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2">
                        {attraction.name}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                        <MapPin size={16} className="text-orange-500" />
                        {/* Find Locality Name if possible, or just coordinates */}
                        Lat: {attraction.latitude?.toFixed(4)}, Lng: {attraction.longitude?.toFixed(4)}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10 -mt-10 relative z-10">
                {/* Description Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl mb-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                        <Camera className="text-orange-500" />
                        Sobre este lugar
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                        {attraction.description || "Un lugar increíble para descubrir en la Patagonia."}
                    </p>
                </div>

                {/* Related Tours */}
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                        <Activity className="text-blue-500" />
                        Tours & Experiencias Aquí
                    </h2>

                    {relatedServices.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {relatedServices.map(srv => {
                                const company = allBusinesses.find(b => b.id === srv.company_id);
                                return (
                                    <div key={srv.id} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-white/5 flex gap-4 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => navigate(`/details/${company?.id}`)}>
                                        <img src={srv.image_url || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-2xl object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{srv.name}</h4>
                                            <p className="text-xs text-primary font-black mb-2">{srv.price}</p>

                                            {company && (
                                                <div className="flex items-center gap-2 mt-auto bg-slate-100 dark:bg-white/10 p-2 rounded-xl w-fit">
                                                    <img src={company.media.logo_url} className="w-5 h-5 rounded-full" />
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate max-w-[120px]">
                                                        {company.nombre}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl text-center border-2 border-dashed border-blue-200 dark:border-blue-700">
                            <p className="text-blue-600 dark:text-blue-300 font-bold mb-2">No hay tours registrados específicamente para esto aún.</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Contacta a las agencias locales para preguntar por disponibilidad.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttractionDetailsScreen;
