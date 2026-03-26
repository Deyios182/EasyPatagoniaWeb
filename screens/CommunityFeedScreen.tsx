import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';

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
    // Joined relations (optional)
    auth_users?: { raw_user_meta_data: { full_name?: string, avatar_url?: string } };
    attractions?: { name: string };
    companies?: { name: string };
    user_has_liked?: boolean; // Appended by our logic
}

// Custom helper para no depender de librerías externas
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

const CommunityFeedScreen: React.FC = () => {
    const navigate = useNavigate();
    const { user, supabaseUser } = useAppAuth();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state for creating a new post
    const [isCreatingText, setIsCreatingText] = useState(false);
    const [newPostType, setNewPostType] = useState<'review' | 'alert' | 'story'>('story');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostLocation, setNewPostLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    attractions(name),
                    companies(name)
                `)
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(50);

            if (postsError) throw postsError;

            // Optional: Fetch user details for each post since auth.users isn't easily joinable without a public profile table.
            // Since we use raw Supabase users, we will map them if we have profiles.
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');

            // Find which posts the CURRENT user has liked
            let userLikes: Set<string> = new Set();
            if (supabaseUser) {
                const { data: likesData } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', supabaseUser.id);
                if (likesData) {
                    userLikes = new Set(likesData.map(l => l.post_id));
                }
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

    const handleToggleLike = async (postId: string, currentlyLiked: boolean) => {
        if (!supabaseUser) {
            alert("Debes iniciar sesión para dar like.");
            return;
        }

        // Optimistic UI update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    user_has_liked: !currentlyLiked,
                    likes_count: p.likes_count + (currentlyLiked ? -1 : 1)
                };
            }
            return p;
        }));

        const { data, error } = await supabase.rpc('toggle_community_like', { p_post_id: postId });
        if (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            fetchPosts();
        }
    };

    const handleSubmitPost = async () => {
        if (!newPostContent.trim()) return;
        if (!supabaseUser) {
            alert("Debes iniciar sesión para publicar.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('community_posts').insert([{
                user_id: supabaseUser.id,
                post_type: newPostType,
                content: newPostContent,
                location_name: newPostLocation || null,
                status: 'approved' // Automatically approve text-based alerts/stories for now
            }]);

            if (error) throw error;
            
            // Clean up and refresh
            setNewPostContent('');
            setNewPostLocation('');
            setIsCreatingText(false);
            fetchPosts();
        } catch (error) {
            console.error("Error creating post:", error);
            alert("No se pudo crear la publicación");
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark items-center">
            <div className="w-full max-w-2xl h-full flex flex-col bg-slate-50 dark:bg-surface-dark pb-[70px] shadow-2xl overflow-y-auto no-scrollbar relative">

                {/* Header */}
                <div className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-6 px-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">Mural Global</h1>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">En vivo • Comunidad Aysén</p>
                    </div>
                    <button onClick={() => navigate('/map')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center dark:text-white text-slate-600">
                        <span className="material-symbols-outlined">map</span>
                    </button>
                </div>

                {/* Create Post Area */}
                <div className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-white/5 p-4">
                    {!isCreatingText ? (
                        <div className="flex gap-3">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser?.id || 'guest'}`}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full bg-slate-100"
                            />
                            <button
                                onClick={() => setIsCreatingText(true)}
                                className="flex-1 bg-slate-100 dark:bg-background-dark rounded-full px-4 text-left text-sm text-slate-500 font-bold"
                            >
                                ¿Qué está pasando en la Patagonia?
                            </button>
                            <button
                                onClick={() => {/* TODO: Opción para subir foto (redireccionar a un flujo de cámara o selección de foto glogal) */}}
                                className="w-10 h-10 bg-slate-100 dark:bg-background-dark rounded-full flex items-center justify-center text-primary"
                                title="Subir Foto"
                            >
                                <span className="material-symbols-outlined">image</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex gap-2">
                                {(['story', 'alert', 'review'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setNewPostType(type)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${newPostType === type ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-background-dark text-slate-500'}`}
                                    >
                                        {getPostIcon(type)}
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="📍 Ubicación (Ej: Cerca de Coyhaique)"
                                value={newPostLocation}
                                onChange={e => setNewPostLocation(e.target.value)}
                                className="w-full text-sm font-bold bg-slate-50 dark:bg-background-dark/30 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-0"
                            />
                            <textarea
                                placeholder={newPostType === 'alert' ? "Describe la alerta de ruta..." : "Cuenta tu experiencia..."}
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                rows={3}
                                className="w-full text-sm font-medium bg-slate-100 dark:bg-background-dark border-none rounded-xl p-4 dark:text-white focus:ring-2 focus:ring-primary/20 resize-none"
                            ></textarea>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setIsCreatingText(false); setNewPostContent(''); setNewPostLocation(''); }}
                                    className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitPost}
                                    disabled={!newPostContent.trim() || isSubmitting}
                                    className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Publicando...' : 'Publicar'}
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
                            <div key={post.id} className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                                {/* Post Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={post.auth_users?.raw_user_meta_data?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                                            className="w-10 h-10 rounded-full bg-slate-100"
                                            alt="Avatar"
                                        />
                                        <div>
                                            <p className="text-sm font-black dark:text-white leading-none">
                                                {post.auth_users?.raw_user_meta_data?.full_name || 'Explorador'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1">
                                                {timeAgo(post.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-background-dark w-10 h-10 rounded-full flex items-center justify-center">
                                        {getPostIcon(post.post_type)}
                                    </div>
                                </div>

                                {/* Location Badge (If has one) */}
                                {(post.location_name || post.attractions || post.companies) && (
                                    <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg mb-3">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {post.attractions?.name || post.companies?.name || post.location_name}
                                        </span>
                                    </div>
                                )}

                                {/* Content */}
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    {post.content}
                                </p>

                                {/* Media */}
                                {post.media_urls && post.media_urls.length > 0 && (
                                    <div className="mb-4 rounded-xl overflow-hidden bg-slate-100 dark:bg-background-dark">
                                        <img src={post.media_urls[0]} alt="Post media" className="w-full max-h-96 object-cover" />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <button
                                        onClick={() => handleToggleLike(post.id, !!post.user_has_liked)}
                                        className="flex items-center gap-2 group"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${post.user_has_liked ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-background-dark text-slate-400 group-hover:bg-slate-100'}`}>
                                            <span className="material-symbols-outlined text-lg" style={post.user_has_liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                                favorite
                                            </span>
                                        </div>
                                        <span className={`text-sm font-black ${post.user_has_liked ? 'text-red-500' : 'text-slate-500'}`}>
                                            {post.likes_count}
                                        </span>
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
