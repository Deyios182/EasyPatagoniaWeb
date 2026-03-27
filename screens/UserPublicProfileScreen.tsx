import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import { computeAchievements, UserStats } from '../utils/achievementSystem';
import BottomNavigationBar from '../components/BottomNavigationBar';

interface PublicProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    origin_country: string | null;
    travel_quote: string | null;
    accent_color: string | null;
    profile_banner_url: string | null;
}

const UserPublicProfileScreen: React.FC = () => {
    const { id: targetUserId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { supabaseUser } = useAppAuth();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isMutual, setIsMutual] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postCount, setPostCount] = useState(0);
    const [achievements, setAchievements] = useState<ReturnType<typeof computeAchievements>>([]);
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        if (targetUserId) {
            fetchProfileData();
        }
    }, [targetUserId, supabaseUser?.id]);

    const fetchProfileData = async () => {
        if (!targetUserId) return;
        setLoading(true);
        try {
            // Profile
            const { data: profileData } = await supabase
                .from('profiles').select('*').eq('id', targetUserId).single();
            setProfile(profileData);

            // Followers & following counts
            const [{ count: followers }, { count: following }] = await Promise.all([
                supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
                supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
            ]);
            setFollowersCount(followers || 0);
            setFollowingCount(following || 0);

            // Am I following?
            if (supabaseUser) {
                const { data: followRow } = await supabase.from('user_follows')
                    .select('follower_id').eq('follower_id', supabaseUser.id).eq('following_id', targetUserId).maybeSingle();
                setIsFollowing(!!followRow);

                // Is it mutual? (they follow me)
                const { data: mutualRow } = await supabase.from('user_follows')
                    .select('follower_id').eq('follower_id', targetUserId).eq('following_id', supabaseUser.id).maybeSingle();
                setIsMutual(!!followRow && !!mutualRow);
            }

            // Post stats
            const { data: posts } = await supabase.from('community_posts')
                .select('post_type').eq('user_id', targetUserId).eq('status', 'approved');
            const postData = posts || [];
            setPostCount(postData.length);

            // Recent posts (last 4)
            const { data: recent } = await supabase.from('community_posts')
                .select('id, content, post_type, media_urls, created_at')
                .eq('user_id', targetUserId).eq('status', 'approved')
                .order('created_at', { ascending: false }).limit(4);
            setRecentPosts(recent || []);

            // Achievements
            const stats: UserStats = {
                totalPosts: postData.length,
                photoPosts: postData.filter((p: any) => p.post_type === 'photo').length,
                reviewPosts: postData.filter((p: any) => p.post_type === 'review').length,
                alertPosts: postData.filter((p: any) => p.post_type === 'alert').length,
                approvedPhotos: postData.filter((p: any) => p.post_type === 'photo').length,
                sharedItineraries: postData.filter((p: any) => p.post_type === 'story' && p.content?.includes('hoja de ruta')).length,
                followersCount: followers || 0,
            };
            setAchievements(computeAchievements(stats));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!supabaseUser || !targetUserId) return;
        setToggling(true);
        if (isFollowing) {
            await supabase.from('user_follows').delete()
                .eq('follower_id', supabaseUser.id).eq('following_id', targetUserId);
            setIsFollowing(false);
            setIsMutual(false);
            setFollowersCount(c => c - 1);
        } else {
            await supabase.from('user_follows').insert({ follower_id: supabaseUser.id, following_id: targetUserId });
            setIsFollowing(true);
            setFollowersCount(c => c + 1);
            // Re-check mutual
            const { data } = await supabase.from('user_follows')
                .select('follower_id').eq('follower_id', targetUserId).eq('following_id', supabaseUser.id).maybeSingle();
            setIsMutual(!!data);
        }
        setToggling(false);
    };

    const accentColor = profile?.accent_color || '#FF6B35';
    const earnedBadges = achievements.filter(a => a.earned);

    if (loading) return (
        <div className="flex h-screen items-center justify-center dark:bg-background-dark">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!profile) return (
        <div className="flex h-screen items-center justify-center dark:bg-background-dark">
            <p className="text-slate-500">Usuario no encontrado</p>
        </div>
    );

    const isOwnProfile = supabaseUser?.id === targetUserId;

    return (
        <div className="min-h-screen dark:bg-background-dark pb-24">

            {/* Banner */}
            <div className="relative h-48 w-full overflow-hidden">
                {profile.profile_banner_url ? (
                    <img src={profile.profile_banner_url} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                    <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor}33)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            </div>

            {/* Avatar + Info */}
            <div className="px-6 -mt-16 relative z-10">
                <div className="flex items-end justify-between mb-6">
                    <div className="relative">
                        <img
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                            className="w-24 h-24 rounded-full object-cover shadow-xl"
                            style={{ border: `4px solid ${accentColor}` }}
                            alt="Avatar"
                        />
                    </div>
                    {!isOwnProfile && supabaseUser && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleToggleFollow}
                                disabled={toggling}
                                className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg ${isFollowing ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white' : 'bg-primary text-white'}`}
                                style={!isFollowing ? { backgroundColor: accentColor } : {}}
                            >
                                {toggling ? '...' : isFollowing ? 'Siguiendo ✓' : 'Seguir'}
                            </button>
                            {isMutual && (
                                <button
                                    onClick={() => navigate(`/messages/${targetUserId}`)}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-lg flex items-center justify-center text-primary border border-slate-200 dark:border-white/10"
                                >
                                    <span className="material-symbols-outlined text-lg">chat</span>
                                </button>
                            )}
                        </div>
                    )}
                    {isOwnProfile && (
                        <button onClick={() => navigate('/profile')} className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white">
                            Editar perfil
                        </button>
                    )}
                </div>

                {/* Name, origin, quote */}
                <h1 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter leading-none">
                    {profile.full_name || 'Viajero Patagónico'}
                </h1>
                {profile.origin_country && (
                    <p className="text-sm text-slate-500 font-bold mt-1">{profile.origin_country}</p>
                )}
                {profile.bio && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed max-w-md">{profile.bio}</p>
                )}
                {profile.travel_quote && (
                    <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-2 border-l-2 pl-3" style={{ borderColor: accentColor }}>
                        "{profile.travel_quote}"
                    </p>
                )}

                {/* Stats row */}
                <div className="flex gap-6 mt-6 py-5 border-t border-b border-slate-100 dark:border-white/5">
                    {[
                        { label: 'Posts', val: postCount },
                        { label: 'Seguidores', val: followersCount },
                        { label: 'Siguiendo', val: followingCount },
                    ].map(s => (
                        <div key={s.label} className="text-center flex-1">
                            <p className="text-2xl font-black dark:text-white">{s.val}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Badges */}
                {earnedBadges.length > 0 && (
                    <div className="mt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Logros</p>
                        <div className="flex flex-wrap gap-2">
                            {earnedBadges.map(b => (
                                <div key={b.id} title={b.description}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${b.color} shadow-md`}>
                                    <span className="text-lg">{b.icon}</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-wide">{b.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent posts grid */}
                {recentPosts.length > 0 && (
                    <div className="mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Publicaciones recientes</p>
                        <div className="grid grid-cols-2 gap-3">
                            {recentPosts.map(post => (
                                <div key={post.id} className="bg-white dark:bg-surface-dark rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-sm">
                                    {post.media_urls?.[0] ? (
                                        <img src={post.media_urls[0]} className="w-full h-24 object-cover rounded-xl mb-2" alt="Post" />
                                    ) : null}
                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{post.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <BottomNavigationBar />
        </div>
    );
};

export default UserPublicProfileScreen;
