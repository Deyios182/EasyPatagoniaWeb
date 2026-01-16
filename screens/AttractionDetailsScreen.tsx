import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

const AttractionDetailsScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { allAttractions, allBusinesses, t } = useAppAuth();

    const attraction = allAttractions.find(a => a.id === id);
    const [relatedBusinesses, setRelatedBusinesses] = useState<any[]>([]);

    useEffect(() => {
        if (!attraction) return;

        // Find businesses related to this attraction using keywords
        const keywords = attraction.keywords || [attraction.name];
        if (keywords.length > 0) {
            const related = allBusinesses.filter(biz =>
                keywords.some((k: string) =>
                    (biz.nombre || '').toLowerCase().includes(k.toLowerCase()) ||
                    (biz.info?.descripcion || '').toLowerCase().includes(k.toLowerCase()) ||
                    biz.servicios?.some((s: any) => (s.nombre || '').toLowerCase().includes(k.toLowerCase()))
                )
            ).slice(0, 6);
            setRelatedBusinesses(related);
        }
    }, [attraction, allBusinesses]);

    if (!attraction) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Cargando...</div>;

    return (
        <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">

            {/* HEADER FIXED */}
            <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex items-center justify-between z-[140] pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all pointer-events-auto border border-white/20 shadow-lg group"
                >
                    <span className="material-symbols-outlined text-3xl text-white group-hover:-translate-x-1 transition-transform">arrow_back</span>
                </button>
            </div>

            <div className="flex flex-col min-h-screen overflow-y-auto no-scrollbar">

                {/* HERO IMAGE SECTION (Scrollable) */}
                <div className="w-full h-[55vh] md:h-[75vh] bg-black overflow-hidden relative shrink-0">
                    <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                        {attraction.gallery_urls?.map((img: string, i: number) => (
                            <div key={i} className="w-full h-full shrink-0 snap-center relative">
                                <img src={img} className="w-full h-full object-cover" alt={attraction.name} />
                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
                            </div>
                        )) || (
                                <div className="w-full h-full shrink-0 snap-center relative">
                                    <img src={attraction.main_image_url} className="w-full h-full object-cover" alt={attraction.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
                                </div>
                            )}
                    </div>

                    {/* TITLE OVERLAY */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-20 z-10 pb-20 md:pb-32 bg-gradient-to-t from-white via-white/80 dark:from-background-dark dark:via-background-dark/80 to-transparent">
                        <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {attraction.keywords?.map((kw: string) => (
                                    <span key={kw} className="px-4 py-1.5 bg-primary/20 text-primary-dark dark:text-primary border border-primary/30 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic drop-shadow-xl dark:drop-shadow-2xl">
                                {attraction.name}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* CONTENT BODY */}
                <div className="flex-1 bg-white dark:bg-background-dark -mt-10 relative z-20 rounded-t-[3rem] p-8 md:p-20 space-y-16 pb-40 border-t border-slate-200 dark:border-white/5">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                        {/* Main Description */}
                        <div className="md:col-span-2 space-y-8">
                            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-2xl leading-relaxed font-light border-l-4 border-primary/50 pl-8">
                                {attraction.long_description || attraction.short_description || "Descubre la magia de este lugar increíble en la Patagonia."}
                            </p>

                            {/* Tips Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                {attraction.tips?.map((tip: string, i: number) => (
                                    <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                        <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6">
                                <h3 className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">location_on</span>
                                    Ubicación
                                </h3>

                                {attraction.latitude && attraction.longitude && (
                                    <button
                                        onClick={() => {
                                            const url = `https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}&query_place_id=${encodeURIComponent(attraction.name)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="w-full bg-white dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 font-black py-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-sm border border-slate-200 dark:border-transparent"
                                    >
                                        <span className="material-symbols-outlined">directions</span>
                                        Cómo llegar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* VERIFIED OPERATORS SECTION */}
                    <div className="space-y-8 border-t border-slate-200 dark:border-white/10 pt-16">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-1 bg-primary"></div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('verified_ops')}</h4>
                            <span className="text-slate-500 text-sm font-medium">Experiencias disponibles aquí</span>
                        </div>

                        {relatedBusinesses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {relatedBusinesses.map((op: any) => (
                                    <div
                                        key={op.id}
                                        onClick={() => navigate(`/details/${op.id}`)}
                                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-[2rem] flex items-center gap-4 hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-md cursor-pointer transition-all group pr-6"
                                    >
                                        <img src={op.media?.logo_url || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl object-cover bg-slate-200 dark:bg-white/10" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate uppercase">{op.nombre}</p>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t(op.categoria?.toLowerCase() || 'general')}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 dark:text-white/50 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 text-center">
                                <p className="text-slate-500 text-sm">No hay servicios verificados vinculados directamente a este atractivo por ahora.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AttractionDetailsScreen;
