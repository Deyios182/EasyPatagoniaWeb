import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';

interface Notification {
    id: string;
    type: 'like' | 'message' | 'follow' | 'mention';
    post_id: string | null;
    message: string | null;
    read: boolean;
    created_at: string;
    actor_id: string | null;
    // joined
    actor?: { full_name: string | null; avatar_url: string | null };
}

const typeIcon = (type: string) => {
    switch (type) {
        case 'like': return { icon: 'favorite', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
        case 'message': return { icon: 'chat', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
        case 'follow': return { icon: 'person_add', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' };
        default: return { icon: 'notifications', color: 'text-primary', bg: 'bg-primary/10' };
    }
};

const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'ahora';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
};

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const { supabaseUser } = useAppAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!supabaseUser) return;
        fetchNotifications();

        // Real-time subscription
        const channel = supabase.channel(`notifications-${supabaseUser.id}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'notifications',
                filter: `user_id=eq.${supabaseUser.id}`
            }, payload => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabaseUser?.id]);

    const fetchNotifications = async () => {
        if (!supabaseUser) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (data) {
            setNotifications(data);
            // Fetch actor profiles
            const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))] as string[];
            if (actorIds.length > 0) {
                const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', actorIds);
                const map: Record<string, any> = {};
                (profs || []).forEach(p => { map[p.id] = p; });
                setProfiles(map);
            }
        }
    };

    const markAllRead = async () => {
        if (!supabaseUser) return;
        await supabase.from('notifications').update({ read: true })
            .eq('user_id', supabaseUser.id).eq('read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotifClick = async (notif: Notification) => {
        // Mark read
        await supabase.from('notifications').update({ read: true }).eq('id', notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setOpen(false);

        if (notif.type === 'message' && notif.actor_id) navigate(`/messages/${notif.actor_id}`);
        else if (notif.type === 'follow' && notif.actor_id) navigate(`/users/${notif.actor_id}`);
        else if (notif.post_id) navigate('/community');
    };

    if (!supabaseUser) return null;

    return (
        <div className="relative">
            <button
                onClick={() => { setOpen(v => !v); if (!open && unreadCount > 0) markAllRead(); }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/10 shadow-sm"
            >
                <span className="material-symbols-outlined text-xl dark:text-white">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-surface-dark rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 z-[200] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">Notificaciones</p>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-[9px] font-bold text-primary uppercase tracking-widest">
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-slate-50 dark:divide-white/5">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm">
                                <span className="material-symbols-outlined text-3xl block mb-1">notifications_off</span>
                                Sin notificaciones
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const { icon, color, bg } = typeIcon(notif.type);
                                const actor = notif.actor_id ? profiles[notif.actor_id] : null;
                                return (
                                    <button key={notif.id} onClick={() => handleNotifClick(notif)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left ${!notif.read ? 'bg-primary/5' : ''}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                                            {actor?.avatar_url ? (
                                                <img src={actor.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                            ) : (
                                                <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-snug ${!notif.read ? 'font-bold dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {actor?.full_name && <span className="font-black">{actor.full_name} </span>}
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                                        </div>
                                        {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
