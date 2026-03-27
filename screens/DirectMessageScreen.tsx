import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

interface OtherProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    accent_color: string | null;
}

const DirectMessageScreen: React.FC = () => {
    const { userId: otherUserId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { supabaseUser } = useAppAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
    const [input, setInput] = useState('');
    const [isMutual, setIsMutual] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!supabaseUser || !otherUserId) return;
        checkMutualAndLoad();
    }, [supabaseUser?.id, otherUserId]);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!supabaseUser || !otherUserId) return;

        const channel = supabase.channel(`dm-${[supabaseUser.id, otherUserId].sort().join('-')}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'direct_messages',
                filter: `receiver_id=eq.${supabaseUser.id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabaseUser?.id, otherUserId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkMutualAndLoad = async () => {
        if (!supabaseUser || !otherUserId) return;
        setLoading(true);

        // Verify mutual follow
        const [{ data: iFollow }, { data: theyFollow }] = await Promise.all([
            supabase.from('user_follows').select('follower_id')
                .eq('follower_id', supabaseUser.id).eq('following_id', otherUserId).maybeSingle(),
            supabase.from('user_follows').select('follower_id')
                .eq('follower_id', otherUserId).eq('following_id', supabaseUser.id).maybeSingle(),
        ]);
        const mutual = !!iFollow && !!theyFollow;
        setIsMutual(mutual);

        if (!mutual) { setLoading(false); return; }

        // Load other profile
        const { data: prof } = await supabase.from('profiles').select('id, full_name, avatar_url, accent_color').eq('id', otherUserId).single();
        setOtherProfile(prof);

        // Load messages
        const { data: msgs } = await supabase.from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${supabaseUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${supabaseUser.id})`)
            .order('created_at', { ascending: true });
        setMessages(msgs || []);

        // Mark received messages as read
        await supabase.from('direct_messages')
            .update({ read: true })
            .eq('receiver_id', supabaseUser.id)
            .eq('sender_id', otherUserId);

        setLoading(false);
    };

    const handleSend = async () => {
        if (!input.trim() || !supabaseUser || !otherUserId) return;
        const msg = { sender_id: supabaseUser.id, receiver_id: otherUserId, content: input.trim() };
        setInput('');
        const { data, error } = await supabase.from('direct_messages').insert([msg]).select().single();
        if (!error && data) {
            setMessages(prev => [...prev, data]);
            // Notify the receiver
            await supabase.from('notifications').insert({
                user_id: otherUserId,
                actor_id: supabaseUser.id,
                type: 'message',
                message: 'te envió un mensaje 💬',
            });
        }
    };

    const accentColor = otherProfile?.accent_color || '#FF6B35';

    if (loading) return (
        <div className="flex h-screen items-center justify-center dark:bg-background-dark">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isMutual === false) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 dark:bg-background-dark p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300">lock</span>
            <h2 className="text-xl font-black dark:text-white uppercase italic">Chat bloqueado</h2>
            <p className="text-slate-500 text-sm">Solo puedes chatear con usuarios que se siguen mutuamente.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest">Volver</button>
        </div>
    );

    const timeStr = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-screen dark:bg-background-dark">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-surface-dark border-b border-slate-100 dark:border-white/5 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center dark:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <img
                    src={otherProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: `2px solid ${accentColor}` }}
                    alt="Avatar"
                />
                <div>
                    <p className="font-black dark:text-white leading-none">{otherProfile?.full_name || 'Usuario'}</p>
                    <p className="text-[10px] text-green-500 font-bold">● Conexión mutua</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center pt-12 text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-4xl block mb-2">waving_hand</span>
                        ¡Di hola! Nadie ha enviado nada aún.
                    </div>
                )}
                {messages.map(msg => {
                    const isMine = msg.sender_id === supabaseUser?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isMine ? 'rounded-br-md text-white' : 'rounded-bl-md bg-white dark:bg-surface-dark dark:text-white border border-slate-100 dark:border-white/5'}`}
                                style={isMine ? { backgroundColor: accentColor } : {}}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] mt-1 ${isMine ? 'text-white/60' : 'text-slate-400'}`}>{timeStr(msg.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-white/5 flex gap-3 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-slate-100 dark:bg-background-dark rounded-full px-5 py-3 text-sm font-medium dark:text-white border-none focus:ring-0"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-40 transition-all active:scale-95"
                    style={{ backgroundColor: accentColor }}
                >
                    <span className="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    );
};

export default DirectMessageScreen;
