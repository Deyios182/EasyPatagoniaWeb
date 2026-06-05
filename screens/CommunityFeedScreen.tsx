import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';
import NotificationBell from '../components/NotificationBell';

interface CommunityPost {
    id: string;
    user_id: string;
    post_type: 'photo' | 'review' | 'alert' | 'story';
    content: string;
    media_urls: string[];
    location_name: string | null;
    attraction_id: string | null;
    business_id: string | null;
    locality_id: string | null;
    likes_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    link_url?: string | null;
    // Joined relations
    auth_users?: { raw_user_meta_data: { full_name?: string, avatar_url?: string } };
    attractions?: { name: string };
    companies?: { name: string };
    user_has_liked?: boolean;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days} d`;
    return new Date(dateStr).toLocaleDateString();
};

/** Detect video platform and extract embed ID */
const parseVideoUrl = (url: string): { platform: 'youtube' | 'tiktok' | 'instagram' | null, id: string | null, original: string } => {
    if (!url) return { platform: null, id: null, original: url };

    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch) return { platform: 'youtube', id: ytMatch[1], original: url };

    // TikTok
    const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (ttMatch) return { platform: 'tiktok', id: ttMatch[1], original: url };

    // Instagram Reels
    const igMatch = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
    if (igMatch) return { platform: 'instagram', id: igMatch[1], original: url };

    return { platform: null, id: null, original: url };
};

const getPlatformIcon = (platform: string | null) => {
    if (platform === 'youtube') return '▶️';
    if (platform === 'tiktok') return '🎵';
    if (platform === 'instagram') return '📸';
    return '🔗';
};

const getPlatformLabel = (platform: string | null) => {
    if (platform === 'youtube') return 'YouTube';
    if (platform === 'tiktok') return 'TikTok';
    if (platform === 'instagram') return 'Instagram';
    return 'Ver enlace';
};

/** Inline video card: embeds YouTube, shows TikTok/Reels "play on social + preview" */
const VideoCard: React.FC<{ url: string }> = ({ url }) => {
    const [expanded, setExpanded] = useState(false);
    const { platform, id, original } = parseVideoUrl(url);

    if (platform === 'youtube' && id) {
        return (
            <div className="mb-4 rounded-2xl overflow-hidden bg-black aspect-video relative">
                {expanded ? (
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button onClick={() => setExpanded(true)} className="relative w-full h-full group">
                        <img
                            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                            alt="YouTube thumbnail"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <span className="text-white text-2xl ml-1">▶</span>
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full">YouTube</div>
                    </button>
                )}
            </div>
        );
    }

    // TikTok – embed inline via official TikTok embed player
    if (platform === 'tiktok' && id) {
        return (
            <div className="mb-4 rounded-2xl overflow-hidden bg-black relative" style={{ paddingBottom: '177.78%' }}>
                {expanded ? (
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.tiktok.com/embed/v2/${id}`}
                        allowFullScreen
                        allow="autoplay"
                        scrolling="no"
                        sandbox="allow-popups allow-same-origin allow-scripts allow-top-navigation"
                    />
                ) : (
                    <button onClick={() => setExpanded(true)}
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black group">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform mb-3">
                            <span className="text-2xl">🎵</span>
                        </div>
                        <p className="text-white font-black text-sm">TikTok</p>
                        <p className="text-slate-400 text-xs mt-1">Toca para reproducir</p>
                    </button>
                )}
            </div>
        );
    }

    // Instagram – redirect card (no embeddable API without token)
    return (
        <a
            href={original}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-4 bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 text-white rounded-2xl px-5 py-4 shadow-lg hover:brightness-110 transition-all group"
        >
            <span className="text-3xl">📸</span>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{getPlatformLabel(platform)}</p>
                <p className="text-sm font-bold truncate">{original}</p>
            </div>
            <span className="material-symbols-outlined text-white/70 group-hover:text-white">open_in_new</span>
        </a>
    );
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────

const resetForm = {
    content: '',
    location: '',
    attractionId: '',
    businessId: '',
    rating: 5 as number,
    image: null as string | null,
    linkUrl: '',
    type: 'story' as 'review' | 'alert' | 'story' | 'photo',
};

const CommunityFeedScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, supabaseUser, allBusinesses } = useAppAuth();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [attractions, setAttractions] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Create form
    const [isCreatingText, setIsCreatingText] = useState(false);
    const [formType, setFormType] = useState(resetForm.type);
    const [formContent, setFormContent] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formAttractionId, setFormAttractionId] = useState('');
    const [formBusinessId, setFormBusinessId] = useState('');
    const [formRating, setFormRating] = useState(5);
    const [formImage, setFormImage] = useState<string | null>(null);
    const [formLinkUrl, setFormLinkUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postSubmittedPending, setPostSubmittedPending] = useState(false);  // Banner ⋄ pendiente

    // Edit state
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
        fetchAttractions();
    }, []);

    const fetchAttractions = async () => {
        const { data } = await supabase.from('attractions').select('id, name').order('name');
        if (data) setAttractions(data);
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select(`*, attractions(name), companies(name)`)
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(50);

            if (postsError) throw postsError;

            const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');

            let userLikes: Set<string> = new Set();
            if (supabaseUser) {
                const { data: likesData } = await supabase
                    .from('post_likes').select('post_id').eq('user_id', supabaseUser.id);
                if (likesData) userLikes = new Set(likesData.map(l => l.post_id));
            }

            const mappedPosts = (postsData || []).map(post => {
                const prof = profiles?.find(p => p.id === post.user_id);
                return {
                    ...post,
                    auth_users: {
                        raw_user_meta_data: {
                            full_name: prof?.full_name || 'Turista Patagónico',
                            avatar_url: prof?.avatar_url
                        }
                    },
                    user_has_liked: userLikes.has(post.id)
                };
            });

            setPosts(mappedPosts as CommunityPost[]);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setFormType('story'); setFormContent(''); setFormLocation('');
        setFormAttractionId(''); setFormBusinessId(''); setFormRating(5);
        setFormImage(null); setFormLinkUrl(''); setIsCreatingText(false);
        setEditingPostId(null);
    };

    const handleToggleLike = async (postId: string, currentlyLiked: boolean) => {
        if (!supabaseUser) { alert('Debes iniciar sesión para dar like.'); return; }
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, user_has_liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) } : p));
        const { error } = await supabase.rpc('toggle_community_like', { p_post_id: postId });
        if (error) { fetchPosts(); return; }

        // Insert notification when liking (not when unliking)
        if (!currentlyLiked) {
            const post = posts.find(p => p.id === postId);
            if (post && post.user_id !== supabaseUser.id) {
                await supabase.from('notifications').insert({
                    user_id: post.user_id,
                    actor_id: supabaseUser.id,
                    type: 'like',
                    post_id: postId,
                    message: 'le dio ❤️ a tu publicación',
                });
            }
        }
    };

    const handleSubmitPost = async () => {
        if (!formContent.trim() || !supabaseUser) return;
        setIsSubmitting(true);
        try {
            const payload: Record<string, any> = {
                user_id: supabaseUser.id,
                post_type: formType,
                content: formContent,
                location_name: formLocation || null,
                attraction_id: formAttractionId || null,
                business_id: formType === 'review' ? (formBusinessId || null) : null,
                rating: formType === 'review' ? formRating : null,
                media_urls: formImage ? [formImage] : [],
                link_url: formLinkUrl.trim() || null,
                // ⋄ Los nuevos posts van a 'pending' para moderación y asignación de XP
                status: editingPostId ? undefined : 'pending',
            };

            if (editingPostId) {
                const { error } = await supabase.from('community_posts')
                    .update({ content: formContent, location_name: payload.location_name, link_url: payload.link_url })
                    .eq('id', editingPostId)
                    .eq('user_id', supabaseUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('community_posts').insert([payload]);
                if (error) throw error;
                // Mostrar banner de confirmación pendiente
                setPostSubmittedPending(true);
                setTimeout(() => setPostSubmittedPending(false), 6000);
            }

            clearForm();
            fetchPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('No se pudo guardar la publicación');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPost = (post: CommunityPost) => {
        setEditingPostId(post.id);
        setFormType(post.post_type as any);
        setFormContent(post.content);
        setFormLocation(post.location_name || '');
        setFormLinkUrl((post as any).link_url || '');
        setMenuOpenPostId(null);
        setIsCreatingText(true);
    };

    const handleDeletePost = async (postId: string) => {
        if (!supabaseUser) return;
        if (!window.confirm('¿Eliminar esta publicación?')) return;
        setMenuOpenPostId(null);
        const { error } = await supabase.from('community_posts')
            .delete().eq('id', postId).eq('user_id', supabaseUser.id);
        if (!error) setPosts(prev => prev.filter(p => p.id !== postId));
        else alert('No se pudo eliminar. Verifica que sea tu publicación.');
    };

    const getPostIcon = (type: string) => {
        switch (type) {
            case 'photo': return <span className="material-symbols-outlined text-purple-500">photo_camera</span>;
            case 'review': return <span className="material-symbols-outlined text-amber-500">star</span>;
            case 'alert': return <span className="material-symbols-outlined text-red-500">warning</span>;
            default: return <span className="material-symbols-outlined text-blue-500">menu_book</span>;
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center" onClick={() => setMenuOpenPostId(null)}>
            <div className="w-full max-w-2xl h-full flex flex-col bg-slate-50 dark:bg-surface-dark pb-[70px] shadow-2xl overflow-y-auto no-scrollbar relative">

                {/* Header */}
                <div className="bg-white/90 dark:bg-surface-dark/90 py-4 px-6 sticky top-0 z-40 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic leading-none">Mural Global</h1>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">En vivo • Comunidad Aysén</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Friends button */}
                            <button
                                onClick={() => navigate('/friends')}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/10 shadow-sm"
                                title="Amigos"
                            >
                                <span className="material-symbols-outlined text-xl dark:text-white">group</span>
                            </button>
                            <NotificationBell />
                        </div>
                    </div>
                </div>

                {/* Banner: Post pendiente enviado */}
                {postSubmittedPending && (
                  <div className="mx-4 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <p className="font-black text-amber-700 dark:text-amber-300 text-sm">¡Publicación enviada!</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Tu post está pendiente de revisión. El admin asignará tu XP al aprobarlo.
                      </p>
                    </div>
                    <button onClick={() => setPostSubmittedPending(false)} className="ml-auto text-amber-400">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                )}

                {/* Create / Edit Post Area */}
                <div className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-white/5 p-4">
                    {!isCreatingText ? (
                        <div className="flex gap-3">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser?.id || 'guest'}`}
                                alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100"
                            />
                            <button
                                onClick={() => setIsCreatingText(true)}
                                className="flex-1 bg-slate-100 dark:bg-background-dark rounded-full px-4 text-left text-sm text-slate-500 font-bold"
                            >
                                ¿Qué está pasando en la Patagonia?
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            {editingPostId && (
                                <div className="text-[10px] font-black text-primary uppercase tracking-widest">✏️ Editando publicación</div>
                            )}

                            {/* Type selector (only for new posts) */}
                            {!editingPostId && (
                                <div className="flex gap-2">
                                    {(['story', 'alert', 'review', 'photo'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormType(type)}
                                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all ${formType === type ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-background-dark text-slate-500'}`}
                                        >
                                            {getPostIcon(type)}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Photo upload */}
                            {formType === 'photo' && !editingPostId && (
                                <div className="space-y-3 animate-in fade-in">
                                    <select
                                        value={formAttractionId}
                                        onChange={e => setFormAttractionId(e.target.value)}
                                        className="w-full text-sm font-bold bg-slate-50 dark:bg-background-dark/30 border-none rounded-xl px-4 py-3 dark:text-white"
                                    >
                                        <option value="">📍 Atractivo Turístico (Opcional)</option>
                                        {attractions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden relative">
                                        {formImage ? (
                                            <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                                                <p className="text-sm text-slate-500 font-semibold">Sube una imagen</p>
                                                <p className="text-xs text-slate-400">PNG o JPG (Max 2MB)</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (re) => setFormImage(re.target?.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </label>
                                </div>
                            )}

                            {/* Business rating */}
                            {formType === 'review' && !editingPostId && (
                                <div className="space-y-3 animate-in fade-in">
                                    <select
                                        value={formBusinessId}
                                        onChange={e => setFormBusinessId(e.target.value)}
                                        className="w-full text-sm font-bold bg-slate-50 dark:bg-background-dark/30 border-none rounded-xl px-4 py-3 dark:text-white"
                                    >
                                        <option value="">Seleccionar Empresa / Local *</option>
                                        {allBusinesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setFormRating(star)}
                                                className={`text-3xl transition-all ${star <= formRating ? 'text-amber-400 scale-110' : 'text-slate-200 dark:text-slate-700'}`}>
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <input
                                type="text"
                                placeholder="📍 Ubicación o Título"
                                value={formLocation}
                                onChange={e => setFormLocation(e.target.value)}
                                className="w-full text-sm font-bold bg-slate-50 dark:bg-background-dark/30 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-0"
                            />

                            {/* Content */}
                            <textarea
                                placeholder={formType === 'alert' ? 'Describe la alerta de ruta...' : formType === 'photo' ? 'Añade una descripción...' : 'Cuenta tu experiencia...'}
                                value={formContent}
                                onChange={e => setFormContent(e.target.value)}
                                rows={3}
                                className="w-full text-sm font-medium bg-slate-100 dark:bg-background-dark border-none rounded-xl p-4 dark:text-white focus:ring-2 focus:ring-primary/20 resize-none"
                            />

                            {/* Video / Link URL */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">link</span>
                                <input
                                    type="url"
                                    placeholder="🎬 Enlace de YouTube, TikTok, Reels u otro URL..."
                                    value={formLinkUrl}
                                    onChange={e => setFormLinkUrl(e.target.value)}
                                    className="w-full text-sm font-bold bg-slate-50 dark:bg-background-dark/30 border-none rounded-xl pl-10 pr-4 py-3 dark:text-white focus:ring-0"
                                />
                            </div>
                            {/* Preview of parsed video link */}
                            {formLinkUrl.trim() && (() => {
                                const { platform } = parseVideoUrl(formLinkUrl.trim());
                                return (
                                    <p className="text-[10px] font-bold text-primary px-2 -mt-2">
                                        {getPlatformIcon(platform)} Detectado: {getPlatformLabel(platform)} — se mostrará en el Mural
                                    </p>
                                );
                            })()}

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button onClick={clearForm} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitPost}
                                    disabled={!formContent.trim() || isSubmitting || (formType === 'photo' && !formImage && !editingPostId) || (formType === 'review' && !formBusinessId && !editingPostId)}
                                    className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Guardando...' : editingPostId ? 'Guardar cambios' : 'Publicar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Feed */}
                <div className="flex-1 p-4 space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center p-12 space-y-4">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">diversity_3</span>
                            <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Mural Vacío</h3>
                            <p className="text-sm text-slate-500">Sé el primero en compartir algo con la comunidad.</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm" onClick={e => e.stopPropagation()}>

                                {/* Post Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={post.auth_users?.raw_user_meta_data?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                                            className="w-10 h-10 rounded-full bg-slate-100" alt="Avatar"
                                        />
                                        <div>
                                            <button
                                                onClick={() => navigate(`/users/${post.user_id}`)}
                                                className="text-sm font-black dark:text-white leading-none hover:text-primary transition-colors text-left"
                                            >
                                                {post.auth_users?.raw_user_meta_data?.full_name || 'Explorador'}
                                            </button>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1">{timeAgo(post.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-50 dark:bg-background-dark w-10 h-10 rounded-full flex items-center justify-center">
                                            {getPostIcon(post.post_type)}
                                        </div>
                                        {/* 3-dot menu — only for own posts */}
                                        {supabaseUser && post.user_id === supabaseUser.id && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id); }}
                                                    className="w-10 h-10 rounded-full bg-slate-50 dark:bg-background-dark text-slate-400 hover:bg-slate-100 flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                                </button>
                                                {menuOpenPostId === post.id && (
                                                    <div className="absolute right-0 top-12 z-50 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden w-40 animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            onClick={() => handleEditPost(post)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                                                        >
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Location Badge */}
                                {(post.location_name || post.attractions || post.companies) && (
                                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg mb-3">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {post.attractions?.name || post.companies?.name || post.location_name}
                                        </span>
                                    </div>
                                )}

                                {/* Rating Stars */}
                                {post.post_type === 'review' && (post as any).rating && (
                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text-lg ${star <= (post as any).rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</span>
                                        ))}
                                    </div>
                                )}

                                {/* Content */}
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">{post.content}</p>

                                {/* Image */}
                                {post.media_urls && post.media_urls.length > 0 && (
                                    <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-background-dark">
                                        <img src={post.media_urls[0]} alt="Post media" className="w-full max-h-96 object-cover" />
                                    </div>
                                )}

                                {/* Video / Link embed */}
                                {(post as any).link_url && (
                                    <VideoCard url={(post as any).link_url} />
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <button onClick={() => handleToggleLike(post.id, !!post.user_has_liked)} className="flex items-center gap-2 group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${post.user_has_liked ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-background-dark text-slate-400 group-hover:bg-slate-100'}`}>
                                            <span className="material-symbols-outlined text-lg" style={post.user_has_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                                        </div>
                                        <span className={`text-sm font-black ${post.user_has_liked ? 'text-red-500' : 'text-slate-500'}`}>{post.likes_count}</span>
                                    </button>

                                    <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-background-dark text-slate-400 hover:bg-slate-100 flex items-center justify-center ml-auto">
                                        <span className="material-symbols-outlined text-lg">share</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BottomNavigationBar />
        </div>
    );
};

export default CommunityFeedScreen;
