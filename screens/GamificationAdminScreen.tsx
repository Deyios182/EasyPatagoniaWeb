import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAppAuth } from '../App';
import { useNavigate } from 'react-router-dom';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface GamificationRank {
  id: string;
  name: string;
  min_xp: number;
  emoji: string;
  color_gradient: string;
  hex_color: string;
  benefits: string;
  sort_order: number;
  is_active: boolean;
}

interface GamificationMedal {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  medal_type: 'objective' | 'legendary' | 'secret';
  trigger_type: string;
  trigger_value: any;
  xp_reward: number;
  is_secret: boolean;
  is_active: boolean;
  sort_order: number;
}

interface EasyRoute {
  id: string;
  name: string;
  description: string;
  total_km: number;
  image_url: string;
  difficulty: string;
  medal_slug: string | null;
  xp_reward: number;
  checkpoints: any[];
  sort_order: number;
  is_active: boolean;
}

interface PendingPost {
  id: string;
  user_id: string;
  post_type: string;
  content: string;
  media_urls: string[];
  location_name: string | null;
  created_at: string;
  profile?: { full_name: string; avatar_url: string };
}

interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  notes: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = ['Fácil', 'Moderado', 'Difícil', 'Extremo'];
const MEDAL_TYPES = [
  { value: 'objective', label: 'Objetivo', color: '#3B82F6' },
  { value: 'legendary', label: 'Legendaria', color: '#F59E0B' },
  { value: 'secret', label: 'Secreta', color: '#8B5CF6' },
];
const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual (Admin asigna)' },
  { value: 'post_count', label: 'Conteo de Posts' },
  { value: 'xp_threshold', label: 'Umbral de XP' },
  { value: 'location', label: 'Ubicación GPS' },
];

const timeAgo = (dateStr: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Date(dateStr).toLocaleDateString();
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

const RankBadgePreview: React.FC<{ rank: Partial<GamificationRank> }> = ({ rank }) => (
  <div
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-black shadow-lg"
    style={{
      background: `linear-gradient(135deg, ${rank.hex_color || '#64748B'}, ${rank.hex_color || '#64748B'}99)`
    }}
  >
    <span>{rank.emoji || '🎒'}</span>
    <span className="uppercase tracking-widest text-[10px]">{rank.name || 'Rango'}</span>
    <span className="text-white/70 text-[9px]">{rank.min_xp || 0} XP</span>
  </div>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

type Tab = 'posts' | 'ranks' | 'medals' | 'routes' | 'history';

const GamificationAdminScreen: React.FC = () => {
  const { user } = useAppAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Data States ──
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [ranks, setRanks] = useState<GamificationRank[]>([]);
  const [medals, setMedals] = useState<GamificationMedal[]>([]);
  const [routes, setRoutes] = useState<EasyRoute[]>([]);
  const [xpHistory, setXpHistory] = useState<XpTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);

  // ── Form States ──
  const [editingRank, setEditingRank] = useState<Partial<GamificationRank> | null>(null);
  const [editingMedal, setEditingMedal] = useState<Partial<GamificationMedal> | null>(null);
  const [editingRoute, setEditingRoute] = useState<Partial<EasyRoute> | null>(null);
  const [postXpValues, setPostXpValues] = useState<Record<string, number>>({});

  // XP manual grant
  const [manualXpUser, setManualXpUser] = useState('');
  const [manualXpAmount, setManualXpAmount] = useState(50);
  const [manualXpReason, setManualXpReason] = useState('');

  useEffect(() => {
    if (user?.rol !== 'SuperAdmin') { navigate('/'); return; }
    fetchAll();
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchPendingPosts(), fetchRanks(), fetchMedals(), fetchRoutes(), fetchXpHistory(), fetchUsers()]);
    setLoading(false);
  };

  const fetchPendingPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('id, user_id, post_type, content, media_urls, location_name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!data) return;
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
    const mapped = data.map(p => ({
      ...p,
      profile: profiles?.find(pr => pr.id === p.user_id)
    }));
    setPendingPosts(mapped as PendingPost[]);
    // Initialize XP values
    const vals: Record<string, number> = {};
    data.forEach(p => { vals[p.id] = 50; });
    setPostXpValues(prev => ({ ...vals, ...prev }));
  };

  const fetchRanks = async () => {
    const { data } = await supabase.from('gamification_ranks').select('*').order('sort_order');
    if (data) setRanks(data);
  };

  const fetchMedals = async () => {
    const { data } = await supabase.from('gamification_medals').select('*').order('sort_order');
    if (data) setMedals(data);
  };

  const fetchRoutes = async () => {
    const { data } = await supabase.from('easy_routes').select('*').order('sort_order');
    if (data) setRoutes(data);
  };

  const fetchXpHistory = async () => {
    const { data } = await supabase
      .from('xp_transactions')
      .select('id, user_id, amount, reason, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data) return;
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url');
    const mapped = data.map(t => ({
      ...t,
      profile: profiles?.find(p => p.id === t.user_id)
    }));
    setXpHistory(mapped as XpTransaction[]);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name');
    if (data) setAllUsers(data);
  };

  // ─── POST ACTIONS ─────────────────────────────────────────────────────────

  const handleApprovePost = async (post: PendingPost) => {
    const xp = postXpValues[post.id] || 50;
    try {
      // 1. Approve post
      await supabase.from('community_posts').update({ status: 'approved' }).eq('id', post.id);
      // 2. Grant XP via function
      await supabase.rpc('grant_xp_to_user', {
        p_user_id: post.user_id,
        p_amount: xp,
        p_reason: 'post_approved',
        p_post_id: post.id,
        p_notes: `Post de tipo: ${post.post_type}`
      });
      setPendingPosts(prev => prev.filter(p => p.id !== post.id));
      showSuccess(`✅ Post aprobado · +${xp} XP otorgados`);
    } catch (e) {
      alert('Error al aprobar post');
    }
  };

  const handleRejectPost = async (postId: string) => {
    if (!window.confirm('¿Rechazar esta publicación?')) return;
    await supabase.from('community_posts').update({ status: 'rejected' }).eq('id', postId);
    setPendingPosts(prev => prev.filter(p => p.id !== postId));
    showSuccess('🚫 Post rechazado');
  };

  // ─── RANK CRUD ────────────────────────────────────────────────────────────

  const handleSaveRank = async () => {
    if (!editingRank) return;
    if (editingRank.id) {
      await supabase.from('gamification_ranks').update(editingRank).eq('id', editingRank.id);
    } else {
      await supabase.from('gamification_ranks').insert([{ ...editingRank, sort_order: ranks.length + 1 }]);
    }
    fetchRanks();
    setEditingRank(null);
    showSuccess('✅ Rango guardado');
  };

  const handleDeleteRank = async (id: string) => {
    if (!window.confirm('¿Eliminar este rango?')) return;
    await supabase.from('gamification_ranks').delete().eq('id', id);
    fetchRanks();
    showSuccess('🗑️ Rango eliminado');
  };

  // ─── MEDAL CRUD ───────────────────────────────────────────────────────────

  const handleSaveMedal = async () => {
    if (!editingMedal || !editingMedal.slug || !editingMedal.name) {
      alert('Nombre y slug son requeridos');
      return;
    }
    const payload = { ...editingMedal };
    if (editingMedal.id) {
      await supabase.from('gamification_medals').update(payload).eq('id', editingMedal.id);
    } else {
      await supabase.from('gamification_medals').insert([{ ...payload, sort_order: medals.length + 1 }]);
    }
    fetchMedals();
    setEditingMedal(null);
    showSuccess('✅ Medalla guardada');
  };

  const handleDeleteMedal = async (id: string) => {
    if (!window.confirm('¿Eliminar esta medalla?')) return;
    await supabase.from('gamification_medals').delete().eq('id', id);
    fetchMedals();
    showSuccess('🗑️ Medalla eliminada');
  };

  // ─── ROUTE CRUD ───────────────────────────────────────────────────────────

  const handleSaveRoute = async () => {
    if (!editingRoute || !editingRoute.name) {
      alert('Nombre es requerido');
      return;
    }
    const payload = { ...editingRoute };
    if (editingRoute.id) {
      await supabase.from('easy_routes').update(payload).eq('id', editingRoute.id);
    } else {
      await supabase.from('easy_routes').insert([{ ...payload, sort_order: routes.length + 1, checkpoints: payload.checkpoints || [] }]);
    }
    fetchRoutes();
    setEditingRoute(null);
    showSuccess('✅ Ruta guardada');
  };

  const handleDeleteRoute = async (id: string) => {
    if (!window.confirm('¿Eliminar esta ruta?')) return;
    await supabase.from('easy_routes').delete().eq('id', id);
    fetchRoutes();
    showSuccess('🗑️ Ruta eliminada');
  };

  // Add/remove checkpoints from route editor
  const addCheckpoint = () => {
    if (!editingRoute) return;
    const newCp = { id: `cp_${Date.now()}`, name: '', lat: '', lng: '', description: '', xp_reward: 20 };
    setEditingRoute(prev => ({ ...prev!, checkpoints: [...(prev!.checkpoints || []), newCp] }));
  };
  const updateCheckpoint = (idx: number, key: string, val: any) => {
    setEditingRoute(prev => {
      const cps = [...(prev!.checkpoints || [])];
      cps[idx] = { ...cps[idx], [key]: val };
      return { ...prev!, checkpoints: cps };
    });
  };
  const removeCheckpoint = (idx: number) => {
    setEditingRoute(prev => ({
      ...prev!,
      checkpoints: (prev!.checkpoints || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  // ─── MANUAL XP ────────────────────────────────────────────────────────────

  const handleGrantManualXp = async () => {
    if (!manualXpUser || !manualXpAmount || !manualXpReason) {
      alert('Completa todos los campos');
      return;
    }
    await supabase.rpc('grant_xp_to_user', {
      p_user_id: manualXpUser,
      p_amount: manualXpAmount,
      p_reason: 'manual',
      p_notes: manualXpReason
    });
    setManualXpUser('');
    setManualXpAmount(50);
    setManualXpReason('');
    fetchXpHistory();
    showSuccess(`✅ +${manualXpAmount} XP otorgados manualmente`);
  };

  if (user?.rol !== 'SuperAdmin') return null;

  const TABS: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'posts', icon: 'pending', label: 'Posts', count: pendingPosts.length },
    { id: 'ranks', icon: 'military_tech', label: 'Rangos' },
    { id: 'medals', icon: 'workspace_premium', label: 'Medallas' },
    { id: 'routes', icon: 'route', label: 'Rutas' },
    { id: 'history', icon: 'history', label: 'XP' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">🎮 Panel de Gamificación</h1>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Administrar XP · Rangos · Medallas · Rutas</p>
            </div>
          </div>
          {successMsg && (
            <div className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in">
              {successMsg}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white dark:bg-surface-dark rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 1: POSTS PENDIENTES                                      */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">
                Posts Pendientes de Revisión
              </h2>
              <span className="text-xs font-bold text-slate-500">{pendingPosts.length} publicaciones esperando</span>
            </div>

            {pendingPosts.length === 0 ? (
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-16 text-center border border-slate-100 dark:border-white/5 shadow-sm">
                <span className="text-6xl">✅</span>
                <p className="text-slate-500 font-bold mt-4">¡Todo al día! No hay posts pendientes.</p>
              </div>
            ) : (
              pendingPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="flex gap-4">
                    {/* Avatar + Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
                          className="w-10 h-10 rounded-full bg-slate-100"
                          alt="Avatar"
                        />
                        <div>
                          <p className="font-black text-sm dark:text-white">{post.profile?.full_name || 'Usuario'}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{timeAgo(post.created_at)} · {post.post_type.toUpperCase()}</p>
                        </div>
                      </div>

                      {post.location_name && (
                        <div className="flex items-center gap-1 text-primary text-[10px] font-black uppercase mb-2">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {post.location_name}
                        </div>
                      )}

                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{post.content}</p>

                      {/* Image */}
                      {post.media_urls?.length > 0 && (
                        <img
                          src={post.media_urls[0]}
                          alt="Media"
                          className="mt-3 w-full max-h-48 object-cover rounded-2xl"
                        />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                    {/* XP Input */}
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2">
                      <span className="text-amber-600 font-black text-lg">⚡</span>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={postXpValues[post.id] ?? 50}
                        onChange={e => setPostXpValues(prev => ({ ...prev, [post.id]: parseInt(e.target.value) || 0 }))}
                        className="w-20 bg-transparent text-amber-700 dark:text-amber-300 font-black text-lg border-none focus:ring-0 p-0"
                      />
                      <span className="text-amber-600 text-[10px] font-black uppercase">XP</span>
                    </div>

                    <button
                      onClick={() => handleApprovePost(post)}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Aprobar + Dar XP
                    </button>

                    <button
                      onClick={() => handleRejectPost(post.id)}
                      className="py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 2: RANGOS                                                */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'ranks' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Sistema de Rangos</h2>
              <button
                onClick={() => setEditingRank({ name: '', min_xp: 0, emoji: '🎒', color_gradient: 'from-slate-400 to-slate-600', hex_color: '#64748B', benefits: '', is_active: true })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nuevo Rango
              </button>
            </div>

            {/* Rank List */}
            <div className="space-y-3">
              {ranks.map((rank, idx) => (
                <div key={rank.id} className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                  <div className="text-3xl w-12 text-center">{rank.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-black dark:text-white uppercase italic">{rank.name}</p>
                      <RankBadgePreview rank={rank} />
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${rank.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                        {rank.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold">Desde {rank.min_xp} XP · {rank.benefits || 'Sin beneficios definidos'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingRank({ ...rank })}
                      className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRank(rank.id)}
                      className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rank Edit Form */}
            {editingRank && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingRank(null)}>
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter mb-5">
                    {editingRank.id ? 'Editar Rango' : 'Nuevo Rango'}
                  </h3>

                  {/* Preview */}
                  <div className="flex justify-center mb-5">
                    <RankBadgePreview rank={editingRank} />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emoji</label>
                        <input
                          value={editingRank.emoji || ''}
                          onChange={e => setEditingRank(p => ({ ...p!, emoji: e.target.value }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-2xl border-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Hex</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={editingRank.hex_color || '#64748B'}
                            onChange={e => setEditingRank(p => ({ ...p!, hex_color: e.target.value }))}
                            className="w-12 h-12 rounded-xl border-none cursor-pointer"
                          />
                          <input
                            value={editingRank.hex_color || ''}
                            onChange={e => setEditingRank(p => ({ ...p!, hex_color: e.target.value }))}
                            className="flex-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Rango</label>
                      <input
                        value={editingRank.name || ''}
                        onChange={e => setEditingRank(p => ({ ...p!, name: e.target.value }))}
                        placeholder="Ej: Explorador Novato"
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Mínimo para Alcanzar</label>
                      <input
                        type="number"
                        min="0"
                        value={editingRank.min_xp ?? 0}
                        onChange={e => setEditingRank(p => ({ ...p!, min_xp: parseInt(e.target.value) || 0 }))}
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficios</label>
                      <textarea
                        value={editingRank.benefits || ''}
                        onChange={e => setEditingRank(p => ({ ...p!, benefits: e.target.value }))}
                        placeholder="Describe los beneficios de este rango..."
                        rows={2}
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-purple-500/20 dark:text-white resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        className={`w-12 h-6 rounded-full transition-all ${editingRank.is_active ? 'bg-green-500' : 'bg-slate-300'} relative`}
                        onClick={() => setEditingRank(p => ({ ...p!, is_active: !p!.is_active }))}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editingRank.is_active ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-bold dark:text-white">Rango Activo</span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingRank(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 dark:border-white/10">
                      Cancelar
                    </button>
                    <button onClick={handleSaveRank} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase shadow-lg">
                      Guardar Rango
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 3: MEDALLAS                                              */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'medals' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Medallas Australes</h2>
              <button
                onClick={() => setEditingMedal({ name: '', slug: '', description: '', icon: '🏅', medal_type: 'objective', trigger_type: 'manual', xp_reward: 50, is_secret: false, is_active: true })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-xs uppercase shadow-lg"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nueva Medalla
              </button>
            </div>

            {['objective', 'legendary', 'secret'].map(type => {
              const typeMedals = medals.filter(m => m.medal_type === type);
              const typeInfo = MEDAL_TYPES.find(t => t.value === type)!;
              return (
                <div key={type}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: typeInfo.color }}>
                    {typeInfo.label} ({typeMedals.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {typeMedals.map(medal => (
                      <div key={medal.id} className="bg-white dark:bg-surface-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-3">
                        <div className="text-3xl w-12 text-center">{medal.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-sm dark:text-white">{medal.name}</p>
                            {medal.is_secret && <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">SECRETA</span>}
                            {!medal.is_active && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">INACTIVA</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{medal.description}</p>
                          <p className="text-[10px] font-bold text-amber-600 mt-1">⚡ +{medal.xp_reward} XP · {medal.trigger_type}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => setEditingMedal({ ...medal })} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-primary hover:text-white flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteMedal(medal.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {typeMedals.length === 0 && (
                      <p className="col-span-2 text-center text-sm text-slate-400 py-4">No hay medallas de tipo {typeInfo.label}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Medal Edit Form */}
            {editingMedal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingMedal(null)}>
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-md shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter mb-5">
                    {editingMedal.id ? 'Editar Medalla' : 'Nueva Medalla Austral'}
                  </h3>

                  <div className="text-center text-5xl mb-4">{editingMedal.icon || '🏅'}</div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Icono (emoji)</label>
                        <input
                          value={editingMedal.icon || ''}
                          onChange={e => setEditingMedal(p => ({ ...p!, icon: e.target.value }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-2xl border-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Recompensa</label>
                        <input
                          type="number"
                          min="0"
                          value={editingMedal.xp_reward ?? 50}
                          onChange={e => setEditingMedal(p => ({ ...p!, xp_reward: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                      <input
                        value={editingMedal.name || ''}
                        onChange={e => setEditingMedal(p => ({ ...p!, name: e.target.value }))}
                        placeholder="Ej: Navegante Austral"
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug (identificador único)</label>
                      <input
                        value={editingMedal.slug || ''}
                        onChange={e => setEditingMedal(p => ({ ...p!, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        placeholder="navegante_austral"
                        disabled={!!editingMedal.id}
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-mono border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                      <textarea
                        value={editingMedal.description || ''}
                        onChange={e => setEditingMedal(p => ({ ...p!, description: e.target.value }))}
                        rows={2}
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                        <select
                          value={editingMedal.medal_type || 'objective'}
                          onChange={e => setEditingMedal(p => ({ ...p!, medal_type: e.target.value as any }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                        >
                          {MEDAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger</label>
                        <select
                          value={editingMedal.trigger_type || 'manual'}
                          onChange={e => setEditingMedal(p => ({ ...p!, trigger_type: e.target.value }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                        >
                          {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {editingMedal.trigger_type !== 'manual' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Trigger (JSON)</label>
                        <textarea
                          value={typeof editingMedal.trigger_value === 'object' ? JSON.stringify(editingMedal.trigger_value, null, 2) : (editingMedal.trigger_value || '')}
                          onChange={e => {
                            try { setEditingMedal(p => ({ ...p!, trigger_value: JSON.parse(e.target.value) })); }
                            catch { setEditingMedal(p => ({ ...p!, trigger_value: e.target.value })); }
                          }}
                          rows={3}
                          placeholder={'{"count": 5}'}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-xs font-mono border-none focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={`w-10 h-5 rounded-full transition-all relative ${editingMedal.is_secret ? 'bg-purple-500' : 'bg-slate-300'}`}
                          onClick={() => setEditingMedal(p => ({ ...p!, is_secret: !p!.is_secret }))}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editingMedal.is_secret ? 'left-5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-xs font-bold dark:text-white">Medalla Secreta</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={`w-10 h-5 rounded-full transition-all relative ${editingMedal.is_active !== false ? 'bg-green-500' : 'bg-slate-300'}`}
                          onClick={() => setEditingMedal(p => ({ ...p!, is_active: !p!.is_active }))}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${editingMedal.is_active !== false ? 'left-5' : 'left-0.5'}`} />
                        </div>
                        <span className="text-xs font-bold dark:text-white">Activa</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingMedal(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 dark:border-white/10">
                      Cancelar
                    </button>
                    <button onClick={handleSaveMedal} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm uppercase shadow-lg">
                      Guardar Medalla
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 4: RUTAS                                                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'routes' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Easy Rutas</h2>
              <button
                onClick={() => setEditingRoute({ name: '', description: '', total_km: 0, difficulty: 'Moderado', xp_reward: 100, checkpoints: [], is_active: true })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nueva Ruta
              </button>
            </div>

            <div className="space-y-3">
              {routes.map(route => (
                <div key={route.id} className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="flex items-start gap-4">
                    {route.image_url && (
                      <img src={route.image_url} className="w-20 h-16 object-cover rounded-xl shrink-0" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black dark:text-white uppercase italic">{route.name}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${route.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                          {route.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{route.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
                        <span>📍 {route.total_km || '?'} km</span>
                        <span>⚡ {route.xp_reward} XP</span>
                        <span>🗺️ {(route.checkpoints || []).length} checkpoints</span>
                        <span className="text-orange-500">{route.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingRoute({ ...route, checkpoints: route.checkpoints || [] })} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-primary hover:text-white flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => handleDeleteRoute(route.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {routes.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-5xl">route</span>
                  <p className="font-bold mt-2">No hay rutas configuradas</p>
                </div>
              )}
            </div>

            {/* Route Edit Form */}
            {editingRoute && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setEditingRoute(null)}>
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-black dark:text-white uppercase italic tracking-tighter mb-5">
                    {editingRoute.id ? 'Editar Ruta' : 'Nueva Easy Ruta'}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Ruta</label>
                        <input
                          value={editingRoute.name || ''}
                          onChange={e => setEditingRoute(p => ({ ...p!, name: e.target.value }))}
                          placeholder="Ej: Ruta de los Glaciares"
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Km Totales</label>
                        <input type="number" value={editingRoute.total_km || ''} onChange={e => setEditingRoute(p => ({ ...p!, total_km: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dificultad</label>
                        <select value={editingRoute.difficulty || 'Moderado'} onChange={e => setEditingRoute(p => ({ ...p!, difficulty: e.target.value }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 dark:text-white">
                          {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Recompensa</label>
                        <input type="number" value={editingRoute.xp_reward || 100} onChange={e => setEditingRoute(p => ({ ...p!, xp_reward: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medalla al completar</label>
                        <select value={editingRoute.medal_slug || ''} onChange={e => setEditingRoute(p => ({ ...p!, medal_slug: e.target.value || null }))}
                          className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 dark:text-white">
                          <option value="">Sin medalla</option>
                          {medals.map(m => <option key={m.slug} value={m.slug}>{m.icon} {m.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                      <textarea value={editingRoute.description || ''} onChange={e => setEditingRoute(p => ({ ...p!, description: e.target.value }))} rows={2}
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-green-500/20 dark:text-white resize-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL Imagen de portada</label>
                      <input value={editingRoute.image_url || ''} onChange={e => setEditingRoute(p => ({ ...p!, image_url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full mt-1 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm font-mono border-none focus:ring-2 focus:ring-green-500/20 dark:text-white" />
                    </div>

                    {/* Checkpoints */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checkpoints de la Ruta</label>
                        <button onClick={addCheckpoint} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase hover:bg-green-200 transition-all">
                          <span className="material-symbols-outlined text-sm">add_location</span>
                          Agregar Punto
                        </button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {(editingRoute.checkpoints || []).map((cp: any, idx: number) => (
                          <div key={cp.id || idx} className="bg-slate-50 dark:bg-background-dark rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase">Checkpoint {idx + 1}</p>
                              <button onClick={() => removeCheckpoint(idx)} className="text-red-400 hover:text-red-600">
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            </div>
                            <input value={cp.name || ''} onChange={e => updateCheckpoint(idx, 'name', e.target.value)}
                              placeholder="Nombre del punto" className="w-full bg-white dark:bg-surface-dark rounded-lg p-2 text-sm font-bold border-none dark:text-white" />
                            <div className="grid grid-cols-3 gap-2">
                              <input value={cp.lat || ''} onChange={e => updateCheckpoint(idx, 'lat', e.target.value)}
                                placeholder="Lat" className="bg-white dark:bg-surface-dark rounded-lg p-2 text-xs font-mono border-none dark:text-white" />
                              <input value={cp.lng || ''} onChange={e => updateCheckpoint(idx, 'lng', e.target.value)}
                                placeholder="Lng" className="bg-white dark:bg-surface-dark rounded-lg p-2 text-xs font-mono border-none dark:text-white" />
                              <input type="number" value={cp.xp_reward || 20} onChange={e => updateCheckpoint(idx, 'xp_reward', parseInt(e.target.value) || 0)}
                                placeholder="XP" className="bg-white dark:bg-surface-dark rounded-lg p-2 text-xs font-bold border-none dark:text-white" />
                            </div>
                            <input value={cp.description || ''} onChange={e => updateCheckpoint(idx, 'description', e.target.value)}
                              placeholder="Descripción del punto..." className="w-full bg-white dark:bg-surface-dark rounded-lg p-2 text-xs border-none dark:text-white" />
                          </div>
                        ))}
                        {(editingRoute.checkpoints || []).length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-4">Agrega los checkpoints de la ruta</p>
                        )}
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-12 h-6 rounded-full transition-all relative ${editingRoute.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                        onClick={() => setEditingRoute(p => ({ ...p!, is_active: !p!.is_active }))}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editingRoute.is_active ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-bold dark:text-white">Ruta Activa</span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingRoute(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 border border-slate-200 dark:border-white/10">
                      Cancelar
                    </button>
                    <button onClick={handleSaveRoute} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm uppercase shadow-lg">
                      Guardar Ruta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 5: HISTORIAL XP                                          */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black dark:text-white uppercase italic tracking-tighter">Historial de XP</h2>

            {/* Manual XP Grant */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-5 border border-amber-200 dark:border-amber-700">
              <p className="text-sm font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-4">⚡ Otorgar XP Manualmente</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={manualXpUser} onChange={e => setManualXpUser(e.target.value)}
                  className="bg-white dark:bg-surface-dark rounded-xl p-3 text-sm font-bold border border-amber-200 dark:border-amber-700 dark:text-white">
                  <option value="">Seleccionar usuario...</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                <input type="number" min="1" value={manualXpAmount} onChange={e => setManualXpAmount(parseInt(e.target.value) || 0)}
                  placeholder="XP a otorgar"
                  className="bg-white dark:bg-surface-dark rounded-xl p-3 text-sm font-bold border border-amber-200 dark:border-amber-700 dark:text-white" />
                <input value={manualXpReason} onChange={e => setManualXpReason(e.target.value)}
                  placeholder="Motivo..."
                  className="bg-white dark:bg-surface-dark rounded-xl p-3 text-sm border border-amber-200 dark:border-amber-700 dark:text-white" />
              </div>
              <button onClick={handleGrantManualXp}
                className="mt-3 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                ⚡ Otorgar XP
              </button>
            </div>

            {/* XP Transaction List */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      {['Usuario', 'XP', 'Motivo', 'Fecha'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {xpHistory.map(tx => (
                      <tr key={tx.id} className="border-t border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={tx.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tx.user_id}`}
                              className="w-7 h-7 rounded-full"
                              alt=""
                            />
                            <span className="font-bold dark:text-white">{tx.profile?.full_name || 'Usuario'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-amber-600 font-black">+{tx.amount} XP</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{tx.reason}{tx.notes ? ` · ${tx.notes}` : ''}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{timeAgo(tx.created_at)}</td>
                      </tr>
                    ))}
                    {xpHistory.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-400">No hay transacciones de XP aún</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GamificationAdminScreen;
