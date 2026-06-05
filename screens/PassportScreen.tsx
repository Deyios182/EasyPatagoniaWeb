import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';
import {
  getUserRankFromXP,
  getRankProgress,
  loadRanksFromDB,
  RankInfo,
  DEFAULT_RANKS,
} from '../utils/rankingSystem';
import {
  loadMedalsFromDB,
  buildMedalStatuses,
  MedalWithStatus,
  UserStats,
} from '../utils/medalsSystem';
import BottomNavigationBar from '../components/BottomNavigationBar';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface EasyRoute {
  id: string;
  name: string;
  description: string;
  total_km: number;
  difficulty: string;
  image_url: string;
  xp_reward: number;
  checkpoints: any[];
  medal_slug: string | null;
  is_active: boolean;
}

interface RouteProgress {
  route_id: string;
  checkpoints_completed: string[];
  completed_at: string | null;
}

type PassportTab = 'overview' | 'medals' | 'routes';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  'Fácil': 'bg-green-100 text-green-700',
  'Moderado': 'bg-amber-100 text-amber-700',
  'Difícil': 'bg-orange-100 text-orange-700',
  'Extremo': 'bg-red-100 text-red-700',
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

const PassportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, supabaseUser } = useAppAuth();

  const [activeTab, setActiveTab] = useState<PassportTab>('overview');

  // XP + Ranks
  const [totalXp, setTotalXp] = useState(0);
  const [ranks, setRanks] = useState<RankInfo[]>(DEFAULT_RANKS);
  const [xpHistory, setXpHistory] = useState<any[]>([]);

  // Medals
  const [medals, setMedals] = useState<MedalWithStatus[]>([]);
  const [medalTab, setMedalTab] = useState<'objective' | 'legendary' | 'secret'>('objective');

  // Routes
  const [routes, setRoutes] = useState<EasyRoute[]>([]);
  const [routeProgress, setRouteProgress] = useState<RouteProgress[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<EasyRoute | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseUser) { navigate('/'); return; }
    loadAll();
  }, [supabaseUser?.id]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadXpData(), loadMedalsData(), loadRoutesData()]);
    setLoading(false);
  };

  const loadXpData = async () => {
    if (!supabaseUser) return;

    const [xpResult, historyResult, ranksResult] = await Promise.all([
      supabase.from('user_xp').select('total_xp').eq('user_id', supabaseUser.id).single(),
      supabase.from('xp_transactions').select('amount, reason, notes, created_at')
        .eq('user_id', supabaseUser.id).order('created_at', { ascending: false }).limit(20),
      loadRanksFromDB(),
    ]);

    setTotalXp(xpResult.data?.total_xp || 0);
    setXpHistory(historyResult.data || []);
    setRanks(ranksResult);
  };

  const loadMedalsData = async () => {
    if (!supabaseUser) return;

    const [allMedals, userMedalsRes] = await Promise.all([
      loadMedalsFromDB(),
      supabase.from('user_medals').select('medal_slug, earned_at').eq('user_id', supabaseUser.id),
    ]);

    const stats: UserStats = {
      totalPosts: 0, photoPosts: 0, reviewPosts: 0, alertPosts: 0,
      approvedPhotos: 0, totalXp, followersCount: 0, sharedItineraries: 0,
    };

    const withStatus = buildMedalStatuses(allMedals, userMedalsRes.data || [], stats);
    setMedals(withStatus);
  };

  const loadRoutesData = async () => {
    if (!supabaseUser) return;

    const [routesRes, progressRes] = await Promise.all([
      supabase.from('easy_routes').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('user_route_progress').select('route_id, checkpoints_completed, completed_at')
        .eq('user_id', supabaseUser.id),
    ]);

    setRoutes(routesRes.data || []);
    setRouteProgress((progressRes.data || []) as RouteProgress[]);
  };

  if (!user || !supabaseUser) return null;

  const rankInfo = getUserRankFromXP(totalXp, ranks);
  const rankProgress = getRankProgress(totalXp, ranks);
  const earnedMedals = medals.filter(m => m.earned);
  const completedRoutes = routeProgress.filter(p => p.completed_at).length;

  const getRouteProgress = (routeId: string) => {
    const prog = routeProgress.find(p => p.route_id === routeId);
    return prog?.checkpoints_completed || [];
  };

  const getRoutePercent = (route: EasyRoute) => {
    const total = (route.checkpoints || []).length;
    if (total === 0) return 0;
    const done = getRouteProgress(route.id).length;
    return Math.round((done / total) * 100);
  };

  const isRouteCompleted = (routeId: string) => {
    return !!routeProgress.find(p => p.route_id === routeId && p.completed_at);
  };

  const MEDAL_TYPE_LABELS = { objective: 'Objetivos', legendary: 'Legendarias', secret: 'Secretas' };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-background-dark items-center pb-24">
      <div className="w-full max-w-2xl">

        {/* ── HEADER / PASSPORT COVER ─────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-b-[2.5rem] shadow-2xl"
          style={{ background: `linear-gradient(135deg, #0f0f23 0%, ${rankInfo.hex_color}40 50%, #0f0f23 100%)` }}
        >
          {/* Background texture */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between p-5 pt-12">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
            <div className="text-center">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em]">Easy Patagonia</p>
              <p className="text-[11px] font-black text-white/70 uppercase tracking-widest">Pasaporte del Explorador</p>
            </div>
            <div className="w-10 h-10" />
          </div>

          {/* User info */}
          <div className="relative z-10 px-6 pb-8 flex items-center gap-5">
            <div className="relative">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                className="w-20 h-20 rounded-2xl object-cover shadow-xl"
                style={{ border: `3px solid ${rankInfo.hex_color}` }}
                alt="Avatar"
              />
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-lg"
                style={{ background: rankInfo.hex_color }}
              >
                {rankInfo.emoji}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none truncate">
                {user.name}
              </h1>
              <div
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{ background: `${rankInfo.hex_color}30`, color: rankInfo.hex_color, border: `1px solid ${rankInfo.hex_color}50` }}
              >
                {rankInfo.emoji} {rankInfo.name}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-white/60">
                <span>🏅 {earnedMedals.length} medallas</span>
                <span>🗺️ {completedRoutes} rutas</span>
                <span>⚡ {totalXp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="relative z-10 px-6 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Progreso de rango</span>
              {rankProgress.nextRank ? (
                <span className="text-[9px] font-bold text-white/60">
                  {rankProgress.xpToNext} XP para {rankProgress.nextRank.emoji} {rankProgress.nextRank.name}
                </span>
              ) : (
                <span className="text-[9px] font-black text-amber-400">🦅 RANGO MÁXIMO</span>
              )}
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${rankProgress.progress}%`, background: `linear-gradient(90deg, ${rankInfo.hex_color}, ${rankInfo.hex_color}cc)` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-white/30 font-bold">{rankInfo.min_xp} XP</span>
              {rankProgress.nextRank && (
                <span className="text-[8px] text-white/30 font-bold">{rankProgress.nextRank.min_xp} XP</span>
              )}
            </div>
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white dark:bg-surface-dark rounded-2xl p-1.5 mx-4 mt-4 shadow-sm border border-slate-100 dark:border-white/5">
          {([
            { id: 'overview', icon: 'person', label: 'Resumen' },
            { id: 'medals', icon: 'workspace_premium', label: 'Medallas' },
            { id: 'routes', icon: 'route', label: 'Rutas' },
          ] as { id: PassportTab; icon: string; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
              style={activeTab === tab.id ? { background: rankInfo.hex_color } : {}}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 mt-4 space-y-4">

          {/* ── TAB: OVERVIEW ────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {/* Rank progression chart */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Escala de Rangos</p>
                <div className="space-y-3">
                  {[...ranks].sort((a, b) => a.min_xp - b.min_xp).map((rank, i) => {
                    const isCurrentRank = rank.name === rankInfo.name;
                    const isPassed = totalXp >= rank.min_xp;
                    return (
                      <div key={rank.id || i} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        isCurrentRank ? 'shadow-sm' : ''
                      }`}
                        style={isCurrentRank ? { background: `${rank.hex_color}10`, outline: `2px solid ${rank.hex_color}` } : {}}>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
                          style={{ background: isPassed ? rank.hex_color : '#e2e8f0', opacity: isPassed ? 1 : 0.4 }}
                        >
                          {rank.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-black ${isPassed ? 'dark:text-white' : 'text-slate-400'}`}>
                              {rank.name}
                            </p>
                            {isCurrentRank && (
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                                style={{ background: rank.hex_color }}>
                                Actual
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{rank.benefits}</p>
                        </div>
                        <span className={`text-[10px] font-black ${isPassed ? 'text-amber-500' : 'text-slate-300'} flex-shrink-0`}>
                          {rank.min_xp.toLocaleString()} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* XP History */}
              {xpHistory.length > 0 && (
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Historial de XP</p>
                  <div className="space-y-2">
                    {xpHistory.slice(0, 8).map((tx: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">⚡</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold dark:text-white truncate">
                            {tx.reason === 'post_approved' ? 'Post aprobado' : tx.reason === 'medal_earned' ? 'Medalla desbloqueada' : tx.reason}
                          </p>
                          {tx.notes && <p className="text-[10px] text-slate-400 truncate">{tx.notes}</p>}
                        </div>
                        <span className="text-amber-600 font-black text-sm flex-shrink-0">+{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                  {xpHistory.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">Aún no tienes XP. ¡Publica en el Mural!</p>
                  )}
                </div>
              )}

              {/* No XP yet CTA */}
              {totalXp === 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-6 border border-amber-200 dark:border-amber-700 text-center">
                  <span className="text-4xl">🎒</span>
                  <p className="font-black text-amber-700 dark:text-amber-300 mt-3">¡Tu aventura comienza aquí!</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Publica fotos en el Mural Global para ganar tu primer XP.</p>
                  <button
                    onClick={() => navigate('/community')}
                    className="mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                  >
                    Ir al Mural →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MEDALS ─────────────────────────────────────────── */}
          {activeTab === 'medals' && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {/* Medal type tabs */}
              <div className="flex gap-2">
                {(['objective', 'legendary', 'secret'] as const).map(type => {
                  const typeCount = medals.filter(m => m.medal_type === type && m.earned).length;
                  const total = medals.filter(m => m.medal_type === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setMedalTab(type)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        medalTab === type
                          ? type === 'objective' ? 'bg-blue-500 text-white shadow-lg'
                            : type === 'legendary' ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white dark:bg-surface-dark text-slate-500 border border-slate-100 dark:border-white/5'
                      }`}
                    >
                      {MEDAL_TYPE_LABELS[type]}
                      <span className={`ml-1 ${medalTab === type ? 'text-white/70' : 'text-slate-400'}`}>
                        {typeCount}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Medal grid */}
              <div className="grid grid-cols-2 gap-3">
                {medals.filter(m => m.medal_type === medalTab).map(medal => (
                  <div
                    key={medal.slug}
                    className={`bg-white dark:bg-surface-dark rounded-3xl p-5 border shadow-sm flex flex-col items-center text-center transition-all ${
                      medal.earned
                        ? 'border-slate-100 dark:border-white/5'
                        : 'border-slate-100 dark:border-white/5 opacity-50'
                    }`}
                  >
                    {/* Medal icon with glow */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
                        medal.earned ? 'shadow-lg' : 'bg-slate-100 dark:bg-white/5'
                      }`}
                      style={medal.earned ? {
                        background: medalTab === 'legendary' ? 'linear-gradient(135deg, #F59E0B, #EA580C)'
                          : medalTab === 'secret' ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                          : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        boxShadow: medal.earned ? `0 8px 24px ${
                          medalTab === 'legendary' ? '#F59E0B40'
                          : medalTab === 'secret' ? '#8B5CF640'
                          : '#3B82F640'
                        }` : 'none'
                      } : {}}
                    >
                      {medal.icon}
                    </div>

                    <p className="text-[10px] font-black dark:text-white uppercase tracking-wide leading-tight">
                      {medal.name}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {medal.description}
                    </p>

                    {medal.earned ? (
                      <div className="mt-3 flex items-center gap-1 text-amber-500">
                        <span className="text-[9px] font-black">+{medal.xp_reward} XP</span>
                        <span className="text-[10px]">⚡</span>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                          {medal.trigger_type === 'manual' ? 'Asignada por Admin' : 'Por desbloquear'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {medals.filter(m => m.medal_type === medalTab).length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-4xl">🏅</span>
                  <p className="mt-2 font-bold text-sm">No hay medallas en esta categoría</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ROUTES ─────────────────────────────────────────── */}
          {activeTab === 'routes' && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {selectedRoute ? (
                /* Route Detail View */
                <div>
                  <button
                    onClick={() => setSelectedRoute(null)}
                    className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest mb-4"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Volver a Rutas
                  </button>

                  {selectedRoute.image_url && (
                    <img src={selectedRoute.image_url} alt={selectedRoute.name}
                      className="w-full h-48 object-cover rounded-3xl mb-4" />
                  )}

                  <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-xl font-black dark:text-white uppercase italic tracking-tighter">{selectedRoute.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full ${DIFFICULTY_COLORS[selectedRoute.difficulty] || 'bg-slate-100 text-slate-500'}`}>
                            {selectedRoute.difficulty}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{selectedRoute.total_km} km</span>
                          <span className="text-[10px] text-amber-500 font-bold">⚡ {selectedRoute.xp_reward} XP</span>
                        </div>
                      </div>
                      {isRouteCompleted(selectedRoute.id) && (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-lg">check</span>
                        </div>
                      )}
                    </div>

                    {selectedRoute.description && (
                      <p className="text-sm text-slate-500 leading-relaxed mb-4">{selectedRoute.description}</p>
                    )}

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progreso</span>
                        <span className="text-[9px] font-black text-slate-500">
                          {getRouteProgress(selectedRoute.id).length}/{(selectedRoute.checkpoints || []).length} checkpoints
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                          style={{ width: `${getRoutePercent(selectedRoute)}%` }} />
                      </div>
                    </div>

                    {/* Checkpoints */}
                    {(selectedRoute.checkpoints || []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Checkpoints</p>
                        {selectedRoute.checkpoints.map((cp: any, idx: number) => {
                          const isDone = getRouteProgress(selectedRoute.id).includes(cp.id);
                          return (
                            <div key={cp.id || idx} className={`flex items-center gap-3 p-3 rounded-xl ${isDone ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-background-dark'}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold ${isDone ? 'text-green-700 dark:text-green-300' : 'dark:text-white'}`}>
                                  {cp.name}
                                </p>
                                {cp.description && <p className="text-[9px] text-slate-400 truncate">{cp.description}</p>}
                              </div>
                              {cp.xp_reward > 0 && (
                                <span className={`text-[9px] font-black flex-shrink-0 ${isDone ? 'text-green-600' : 'text-amber-500'}`}>
                                  +{cp.xp_reward} XP
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action */}
                    <button
                      onClick={() => navigate('/community')}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                    >
                      📸 Publicar en el Mural para avanzar
                    </button>
                  </div>
                </div>
              ) : (
                /* Route List */
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-surface-dark rounded-3xl h-28 animate-pulse border border-slate-100 dark:border-white/5" />
                      ))}
                    </div>
                  ) : routes.length === 0 ? (
                    <div className="text-center py-16">
                      <span className="text-5xl">🗺️</span>
                      <p className="mt-3 font-black dark:text-white text-lg">Rutas próximamente</p>
                      <p className="text-sm text-slate-400 mt-1">El equipo de Easy Patagonia está preparando las rutas.</p>
                    </div>
                  ) : (
                    routes.map(route => {
                      const percent = getRoutePercent(route);
                      const completed = isRouteCompleted(route.id);
                      const cpDone = getRouteProgress(route.id).length;
                      const cpTotal = (route.checkpoints || []).length;

                      return (
                        <div
                          key={route.id}
                          onClick={() => setSelectedRoute(route)}
                          className="bg-white dark:bg-surface-dark rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm cursor-pointer hover:shadow-md transition-all"
                        >
                          {route.image_url && (
                            <div className="relative">
                              <img src={route.image_url} alt={route.name} className="w-full h-36 object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              {completed && (
                                <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="material-symbols-outlined text-white text-sm">check</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-black dark:text-white uppercase italic tracking-tight">{route.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[route.difficulty] || 'bg-slate-100 text-slate-500'}`}>
                                    {route.difficulty}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-bold">{route.total_km} km</span>
                                  <span className="text-[9px] font-bold text-amber-500">⚡ {route.xp_reward} XP</span>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-400 flex-shrink-0">chevron_right</span>
                            </div>

                            {/* Progress */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                                  style={{ width: `${percent}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-400 flex-shrink-0">
                                {cpDone}/{cpTotal}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default PassportScreen;
