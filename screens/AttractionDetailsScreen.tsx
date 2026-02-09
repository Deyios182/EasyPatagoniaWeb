import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';
import PhotoUploadModal from '../components/PhotoUploadModal';
import { supabase } from '../supabaseClient';
import { getUserRank } from '../utils/rankingSystem';
import SEO from '../components/SEO';

const AttractionDetailsScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { allAttractions, allBusinesses, t } = useAppAuth();

    const attraction = allAttractions.find(a => a.id === id);
    const [relatedBusinesses, setRelatedBusinesses] = useState<any[]>([]);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [photoAuthors, setPhotoAuthors] = useState<Record<string, { name: string; rank: any }>>({});

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

        // Fetch photo authors and their ranks
        const fetchPhotoAuthors = async () => {


            console.log('📸 Fetching authors for attraction:', attraction.id);

            const { data: contributions, error } = await supabase
                .from('user_photo_contributions')
                .select('photo_url, user_id, user_name, user_email')
                .eq('attraction_id', attraction.id)
                .eq('status', 'approved');

            console.log('📸 Contributions found:', contributions);
            console.log('📸 Error:', error);

            if (contributions) {
                const authorsData: Record<string, { name: string; rank: any }> = {};

                for (const contrib of contributions) {
                    if (!contrib.photo_url) continue;

                    console.log('📸 Processing contribution:', contrib);

                    // Get user's approved photos count for rank
                    const { data: userPhotos } = await supabase
                        .from('user_photo_contributions')
                        .select('id')
                        .eq('user_id', contrib.user_id)
                        .eq('status', 'approved');

                    const approvedCount = userPhotos?.length || 1;
                    const rankInfo = getUserRank(approvedCount);

                    // Use user_name from contribution record
                    const userName = contrib.user_name || contrib.user_email?.split('@')[0] || 'Viajero Anónimo';

                    console.log(`📸 Author: ${userName}, Rank: ${rankInfo.rank}, Count: ${approvedCount}`);

                    authorsData[contrib.photo_url] = {
                        name: userName,
                        rank: rankInfo
                    };
                }

                console.log('📸 Final authors data:', authorsData);
                setPhotoAuthors(authorsData);
            }
        };

        fetchPhotoAuthors();
    }, [attraction, allBusinesses]);

    if (!attraction) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Cargando...</div>;

    return (
        <>
            <SEO
                title={attraction.name}
                description={attraction.short_description || `Conoce ${attraction.name}, uno de los atractivos turísticos imperdibles de Aysén, Patagonia Chilena.`}
                image={attraction.main_image_url}
                keywords={attraction.keywords || ['atractivo turístico', 'aysén', 'patagonia', 'chile']}
                type="article"
            />
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
                        {!attraction.main_image_url && !attraction.gallery_urls?.length ? (
                            /* Photo Placeholder - when no images */
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative z-20">
                                <div className="text-center max-w-xl mx-auto p-8 animate-in fade-in duration-700">
                                    <div className="mb-6 animate-pulse">
                                        <svg className="w-24 h-24 mx-auto text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 uppercase tracking-tight">
                                        ¡Este lugar necesita tu foto!
                                    </h2>
                                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-3">
                                        Ayuda a otros turistas compartiendo tu mejor captura de
                                    </p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white mb-8">
                                        {attraction.name}
                                    </p>
                                    <button
                                        onClick={() => setUploadModalOpen(true)}
                                        className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-wider text-sm transition-all hover:scale-105 shadow-lg shadow-primary/30 group"
                                    >
                                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Subir Foto
                                    </button>
                                    <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-semibold">Tu foto aparecerá aquí</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <span className="text-xl">🏆</span>
                                            <span className="font-semibold">+10 puntos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                                {attraction.gallery_urls?.map((img: string, i: number) => {
                                    const author = photoAuthors[img];
                                    return (
                                        <div key={i} className="w-full h-full shrink-0 snap-center relative">
                                            <img src={img} className="w-full h-full object-cover" alt={attraction.name} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>

                                            {/* Author Attribution */}
                                            {author && (
                                                <div className="absolute bottom-8 right-8 z-20">
                                                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 shadow-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Foto por</p>
                                                                <p className="text-white font-black text-sm">{author.name}</p>
                                                            </div>
                                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${author.rank.gradient}`}>
                                                                <span className="text-sm">{author.rank.emoji}</span>
                                                                <span className="text-white font-black text-[10px] uppercase">{author.rank.rank}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) || (() => {
                                    // Fallback to main_image_url
                                    const mainAuthor = photoAuthors[attraction.main_image_url!];
                                    return (
                                        <div className="w-full h-full shrink-0 snap-center relative">
                                            <img src={attraction.main_image_url} className="w-full h-full object-cover" alt={attraction.name} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>

                                            {/* Author Attribution for main image */}
                                            {mainAuthor && (
                                                <div className="absolute bottom-8 right-8 z-20">
                                                    <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 shadow-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Foto por</p>
                                                                <p className="text-white font-black text-sm">{mainAuthor.name}</p>
                                                            </div>
                                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${mainAuthor.rank.gradient}`}>
                                                                <span className="text-sm">{mainAuthor.rank.emoji}</span>
                                                                <span className="text-white font-black text-[10px] uppercase">{mainAuthor.rank.rank}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

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
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => navigate('/map', { state: { selectedAttractionId: attraction.id } })}
                                                className="w-full bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 font-black py-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-sm border border-slate-200 dark:border-transparent"
                                            >
                                                <span className="material-symbols-outlined">map</span>
                                                Ver en Mapa
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const url = `https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}&query_place_id=${encodeURIComponent(attraction.name)}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="w-full bg-primary text-white hover:bg-primary/90 font-black py-4 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-primary/30"
                                            >
                                                <span className="material-symbols-outlined">directions</span>
                                                Cómo llegar
                                            </button>
                                        </div>
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

                {/* Bottom Navigation Bar */}
                <BottomNavigationBar />

                {/* Photo Upload Modal */}
                {attraction && (
                    <PhotoUploadModal
                        isOpen={uploadModalOpen}
                        attractionId={attraction.id}
                        attractionName={attraction.name}
                        onClose={() => setUploadModalOpen(false)}
                        onSuccess={() => {
                            // Optionally reload the attraction data
                            window.location.reload();
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default AttractionDetailsScreen;
