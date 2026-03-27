import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import BottomNavigationBar from '../components/BottomNavigationBar';

interface Friend {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    accent_color: string | null;
    bio: string | null;
    origin_country: string | null;
    // computed
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'ahora';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
};

const FriendsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { supabaseUser } = useAppAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (supabaseUser) fetchFriends();
    }, [supabaseUser?.id]);

    const fetchFriends = async () => {
        if (!supabaseUser) return;
        setLoading(true);

        // Get people I follow
        const { data: iFollow } = await supabase.from('user_follows')
            .select('following_id').eq('follower_id', supabaseUser.id);
        const iFollowIds = (iFollow || []).map(r => r.following_id);

        // Get people who follow me
        const { data: theyFollow } = await supabase.from('user_follows')
            .select('follower_id').eq('following_id', supabaseUser.id);
        const theyFollowIds = (theyFollow || []).map(r => r.follower_id);

        // Mutual = intersection
        const mutualIds = iFollowIds.filter(id => theyFollowIds.includes(id));

        if (mutualIds.length === 0) { setFriends([]); setLoading(false); return; }

        // Fetch profiles of mutual followers
        const { data: profiles } = await supabase.from('profiles')
            .select('id, full_name, avatar_url, accent_color, bio, origin_country')
            .in('id', mutualIds);

        // For each friend, get last DM and unread count
        const friendsWithMessages = await Promise.all((profiles || []).map(async (prof) => {
            const { data: lastMsg } = await supabase.from('direct_messages')
                .select('content, created_at')
                .or(`and(sender_id.eq.${supabaseUser.id},receiver_id.eq.${prof.id}),and(sender_id.eq.${prof.id},receiver_id.eq.${supabaseUser.id})`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const { count: unread } = await supabase.from('direct_messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', supabaseUser.id)
                .eq('sender_id', prof.id)
                .eq('read', false);

            return {
                ...prof,
                lastMessage: lastMsg?.content || null,
                lastMessageTime: lastMsg?.created_at || null,
                unreadCount: unread || 0,
            };
        }));

        // Sort by last message recency
        friendsWithMessages.sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        setFriends(friendsWithMessages);
        setLoading(false);
    };

    const filtered = friends.filter(f =>
        !search || (f.full_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalUnread = friends.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

    return (
        <div className="flex flex-col min-h-screen dark:bg-background-dark pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-white/5 px-6 py-5 sticky top-0 z-40">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full dark:text-white flex items-center justify-center">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter leading-none">Amigos</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Seguimiento mutuo</p>
                    </div>
                    {totalUnread > 0 && (
                        <span className="ml-auto w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                            {totalUnread}
                        </span>
                    )}
                </div>
                {/* Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar amigos..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-background-dark rounded-2xl text-sm dark:text-white border-none focus:ring-0 font-medium"
                    />
                </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 space-y-3">
                        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 block">group</span>
                        <h3 className="text-lg font-black dark:text-white uppercase italic">
                            {search ? 'Sin resultados' : 'Sin amigos aún'}
                        </h3>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto">
                            {search ? 'Intenta con otro nombre.' : 'Sigue a alguien desde el Mural y si ellos te siguen de vuelta, aparecerán aquí.'}
                        </p>
                        {!search && (
                            <button onClick={() => navigate('/community')} className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest">
                                Ir al Mural
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(friend => {
                        const accent = friend.accent_color || '#FF6B35';
                        return (
                            <button
                                key={friend.id}
                                onClick={() => navigate(`/messages/${friend.id}`)}
                                className="w-full flex items-center gap-4 bg-white dark:bg-surface-dark rounded-3xl px-5 py-4 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all text-left"
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <img
                                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                                        className="w-14 h-14 rounded-full object-cover"
                                        style={{ border: `3px solid ${accent}` }}
                                        alt="Avatar"
                                    />
                                    {(friend.unreadCount || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                            {friend.unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-black dark:text-white leading-none truncate">
                                        {friend.full_name || 'Viajero'}
                                    </p>
                                    {friend.origin_country && (
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{friend.origin_country}</p>
                                    )}
                                    {friend.lastMessage ? (
                                        <p className={`text-xs mt-1 truncate ${(friend.unreadCount || 0) > 0 ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                                            {friend.lastMessage}
                                        </p>
                                    ) : friend.bio ? (
                                        <p className="text-xs text-slate-400 mt-1 truncate">{friend.bio}</p>
                                    ) : null}
                                </div>

                                {/* Right side */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {friend.lastMessageTime && (
                                        <p className="text-[10px] text-slate-400">{timeAgo(friend.lastMessageTime)}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/users/${friend.id}`); }}
                                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                                        </button>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                                            <span className="material-symbols-outlined text-sm" style={{ color: accent }}>chat</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <BottomNavigationBar />
        </div>
    );
};

export default FriendsScreen;
