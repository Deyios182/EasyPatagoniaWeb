import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Role, MapTheme, Currency, SavedItinerary } from '../types';
import { useAppAuth } from '../App';
import { getUserRankFromXP, getRankProgress, loadRanksFromDB, RankInfo } from '../utils/rankingSystem';
import { loadMedalsFromDB, buildMedalStatuses, MedalWithStatus, UserStats, ACCENT_COLORS, BANNER_GRADIENTS, autoCheckAndGrantMedals } from '../utils/medalsSystem';
import { supabase } from '../supabaseClient';
import BottomNavigationBar from '../components/BottomNavigationBar';

interface ProfileScreenProps { role: Role; }
type Language = 'ES' | 'EN' | 'PT';
type Tab = 'profile' | 'trips' | 'contributions' | 'settings';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ role }) => {
  const navigate = useNavigate();
  const { logout, user, language, setLanguage, mapTheme, setMapTheme, currency, setCurrency, deleteItinerary, t, supabaseUser } = useAppAuth();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile data editable
  const [bio, setBio] = useState('');
  const [travelQuote, setTravelQuote] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [accentColor, setAccentColor] = useState('#FF6B35');
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS[0].value);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Social stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [muralPosts, setMuralPosts] = useState<any[]>([]);

  // XP + Rangos + Medallas
  const [totalXp, setTotalXp] = useState(0);
  const [ranks, setRanks] = useState<RankInfo[]>([]);
  const [medals, setMedals] = useState<MedalWithStatus[]>([]);
  const [newMedalUnlocked, setNewMedalUnlocked] = useState<MedalWithStatus | null>(null);

  // Contributions
  const [contributionsCount, setContributionsCount] = useState({ total: 0, approved: 0, pending: 0 });

  // Settings
  const [tempLanguage, setTempLanguage] = useState<Language>(language);
  const [tempMapTheme, setTempMapTheme] = useState<MapTheme>(mapTheme);
  const [tempCurrency, setTempCurrency] = useState<Currency>(currency);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (supabaseUser) {
      loadProfileData();
      fetchContributions();
      loadXpAndRanks();
    }
  }, [supabaseUser?.id]);

  // ── Cargar XP + Rangos + Medallas ──────────────────────────────────────────
  const loadXpAndRanks = async () => {
    if (!supabaseUser) return;

    // XP total del usuario
    const { data: xpData } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', supabaseUser.id)
      .single();

    const xp = xpData?.total_xp || 0;
    setTotalXp(xp);

    // Rangos dinámicos
    const loadedRanks = await loadRanksFromDB();
    setRanks(loadedRanks);

    // Medallas: todas las del sistema + las del usuario
    const allMedals = await loadMedalsFromDB();
    const { data: userMedalsData } = await supabase
      .from('user_medals')
      .select('medal_slug, earned_at')
      .eq('user_id', supabaseUser.id);

    // Construir stats para verificar triggers automáticos
    const stats: UserStats = {
      totalPosts: postCount,
      photoPosts: muralPosts.filter((p: any) => p.post_type === 'photo').length,
      reviewPosts: muralPosts.filter((p: any) => p.post_type === 'review').length,
      alertPosts: muralPosts.filter((p: any) => p.post_type === 'alert').length,
      approvedPhotos: muralPosts.filter((p: any) => p.post_type === 'photo').length,
      totalXp: xp,
      followersCount,
      sharedItineraries: 0,
    };

    // Verificar y otorgar medallas automáticas
    const newlyGranted = await autoCheckAndGrantMedals(supabaseUser.id, stats);

    // Recargar medallas del usuario si se otorgaron nuevas
    let finalUserMedals = userMedalsData || [];
    if (newlyGranted.length > 0) {
      const { data: refreshed } = await supabase
        .from('user_medals')
        .select('medal_slug, earned_at')
        .eq('user_id', supabaseUser.id);
      finalUserMedals = refreshed || [];

      // Mostrar notificación de primera medalla nueva
      const firstNew = allMedals.find(m => m.slug === newlyGranted[0]);
      if (firstNew) setNewMedalUnlocked({ ...firstNew, earned: true });
    }

    const withStatus = buildMedalStatuses(allMedals, finalUserMedals, stats);
    setMedals(withStatus);
  };

  const loadProfileData = async () => {
    if (!supabaseUser) return;

    const { data: profileData } = await supabase
      .from('profiles').select('bio, travel_quote, origin_country, accent_color').eq('id', supabaseUser.id).single();

    if (profileData) {
      setBio(profileData.bio || '');
      setTravelQuote(profileData.travel_quote || '');
      setOriginCountry(profileData.origin_country || '');
      setAccentColor(profileData.accent_color || '#FF6B35');
    }

    // Social counts
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', supabaseUser.id),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', supabaseUser.id),
    ]);
    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);

    // Posts (aprobados)
    const { data: posts } = await supabase.from('community_posts')
      .select('id, content, post_type, media_urls, created_at')
      .eq('user_id', supabaseUser.id).eq('status', 'approved')
      .order('created_at', { ascending: false }).limit(6);

    const allPosts = posts || [];
    setPostCount(allPosts.length);
    setMuralPosts(allPosts);
  };

  const fetchContributions = async () => {
    if (!supabaseUser) return;
    const { data } = await supabase.from('user_photo_contributions').select('status').eq('user_id', supabaseUser.id);
    if (data) {
      setContributionsCount({
        total: data.length,
        approved: data.filter((c: any) => c.status === 'approved').length,
        pending: data.filter((c: any) => c.status === 'pending').length,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!supabaseUser) return;
    setSavingProfile(true);
    await supabase.from('profiles').update({
      bio: bio || null,
      travel_quote: travelQuote || null,
      origin_country: originCountry || null,
      accent_color: accentColor,
    }).eq('id', supabaseUser.id);
    setSavingProfile(false);
    setIsEditing(false);
  };

  const handleApplySettings = () => {
    setLanguage(tempLanguage);
    setMapTheme(tempMapTheme);
    setCurrency(tempCurrency);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleOpenTrip = (trip: SavedItinerary) => {
    localStorage.setItem('ep_plan', JSON.stringify(trip.plan));
    localStorage.setItem('ep_plan_meta', JSON.stringify({ days: trip.days, budget: trip.budget, categories: trip.categories }));
    navigate('/itinerary');
  };

  if (!user) return null;

  const rankInfo = getUserRankFromXP(totalXp, ranks.length > 0 ? ranks : undefined);
  const rankProgress = getRankProgress(totalXp, ranks.length > 0 ? ranks : undefined);
  const earnedMedals = medals.filter(m => m.earned);
  const MEDAL_TYPE_LABELS: Record<string, string> = { objective: 'Objetivos', legendary: 'Legendarias', secret: 'Secretas' };

  const TABS: { id: Tab, icon: string, label: string }[] = [
    { id: 'profile', icon: 'person', label: 'Perfil' },
    { id: 'trips', icon: 'map', label: t('my_trips') },
    { id: 'contributions', icon: 'photo_camera', label: 'Fotos' },
    { id: 'settings', icon: 'settings', label: t('settings') },
  ];

  const languages = [
    { code: 'ES', label: 'Español', flag: '🇪🇸' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
    { code: 'PT', label: 'Português', flag: '🇧🇷' },
  ];
  const mapThemes = [
    { code: 'dark', label: 'Patagonia Dark', icon: 'dark_mode' },
    { code: 'light', label: 'Aysén Light', icon: 'light_mode' },
  ];
  const currencies = [
    { code: 'CLP', label: 'Pesos Chilenos', symbol: '$' },
    { code: 'USD', label: 'US Dollars', symbol: 'US$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-background-dark items-center pb-24">
      <div className="w-full max-w-2xl">

        {/* ── TOAST: Medalla Desbloqueada ── */}
        {newMedalUnlocked && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm cursor-pointer"
            onClick={() => setNewMedalUnlocked(null)}
          >
            <span className="text-3xl">{newMedalUnlocked.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">🏅 ¡Medalla Desbloqueada!</p>
              <p className="font-black text-base">{newMedalUnlocked.name}</p>
              <p className="text-[11px] text-white/80">+{newMedalUnlocked.xp_reward} XP ganados</p>
            </div>
            <button className="ml-auto text-white/60 hover:text-white">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}


        <div className="relative">
          {/* Banner */}
          <div className={`h-40 w-full bg-gradient-to-r ${bannerGradient}`} />
          {/* Close button */}
          <button onClick={() => navigate('/map')} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Avatar */}
          <div className="px-6 -mt-12 flex items-end justify-between relative z-10">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              className="w-24 h-24 rounded-full object-cover shadow-2xl"
              style={{ border: `4px solid ${accentColor}` }}
              alt="Avatar"
            />
            {/* Rank badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg mb-2 text-white`}
              style={{ background: `linear-gradient(135deg, ${rankInfo.hex_color}, ${rankInfo.hex_color}99)` }}
            >
              <span className="text-xl">{rankInfo.emoji}</span>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{rankInfo.name}</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="px-6 mt-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-black text-lg">⚡</span>
              <span className="text-2xl font-black dark:text-white">{totalXp.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">XP Total</span>
            </div>
            {rankProgress.nextRank && (
              <span className="text-[10px] font-bold text-slate-400">
                {rankProgress.xpToNext} XP para {rankProgress.nextRank.emoji} {rankProgress.nextRank.name}
              </span>
            )}
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${rankProgress.progress}%`, backgroundColor: rankInfo.hex_color }}
            />
          </div>
        </div>

        {/* NAME + INFO */}
        <div className="px-6 mt-4">
          <h1 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter leading-none">{user.name}</h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{user.email}</p>
          {originCountry && <p className="text-sm text-slate-500 mt-1">{originCountry}</p>}
          {bio && !isEditing && <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed">{bio}</p>}
          {travelQuote && !isEditing && (
            <p className="text-xs italic text-slate-400 mt-2 border-l-2 pl-3" style={{ borderColor: accentColor }}>"{travelQuote}"</p>
          )}

          {/* Social stats */}
          <div className="flex gap-6 mt-5 py-4 border-t border-b border-slate-100 dark:border-white/5">
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
        </div>

        {/* TABS */}
        <div className="flex gap-1 p-2 mx-6 mt-6 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white shadow-lg' : 'text-slate-400'}`}
              style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}>
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="px-6 mt-6 space-y-6">

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Edit toggle */}
              <div className="flex justify-end">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-full text-xs font-black dark:text-white shadow-sm">
                    <span className="material-symbols-outlined text-base">edit</span> Editar perfil
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 dark:border-white/10">Cancelar</button>
                    <button onClick={handleSaveProfile} disabled={savingProfile}
                      className="px-5 py-2.5 rounded-full text-xs font-black text-white shadow-lg disabled:opacity-50"
                      style={{ backgroundColor: accentColor }}>
                      {savingProfile ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                /* Edit form */
                <div className="space-y-4 bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobre mí (Bio)</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                      placeholder="Cuéntale a la comunidad quién eres..."
                      className="w-full mt-2 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm dark:text-white resize-none border-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frase de viajero</label>
                    <input value={travelQuote} onChange={e => setTravelQuote(e.target.value)}
                      placeholder="Tu frase inspiradora..."
                      className="w-full mt-2 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm dark:text-white border-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">País de origen</label>
                    <input value={originCountry} onChange={e => setOriginCountry(e.target.value)}
                      placeholder="Ej: 🇨🇱 Chile · 🇦🇷 Argentina"
                      className="w-full mt-2 bg-slate-50 dark:bg-background-dark rounded-xl p-3 text-sm dark:text-white border-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  {/* Accent color picker */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color de perfil</label>
                    <div className="flex gap-3 mt-3">
                      {ACCENT_COLORS.map(c => (
                        <button key={c.value} onClick={() => setAccentColor(c.value)}
                          title={c.label}
                          className={`w-9 h-9 rounded-full shadow-md transition-transform ${accentColor === c.value ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c.value }} />
                      ))}
                    </div>
                  </div>

                  {/* Banner gradient picker */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner del perfil</label>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {BANNER_GRADIENTS.map(g => (
                        <button key={g.value} onClick={() => setBannerGradient(g.value)}
                          className={`h-14 rounded-xl bg-gradient-to-r ${g.value} transition-all ${bannerGradient === g.value ? 'ring-2 ring-offset-2 ring-primary scale-105' : 'hover:scale-102 opacity-80'}`}
                        >
                          <span className="text-[9px] text-white/90 font-black drop-shadow">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Badges & recent posts */
                <>
                  {/* Achievements / Medallas */}
                  {medals.length > 0 && (
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🏅 Medallas Australes</p>
                        <span className="text-[10px] font-black text-slate-400">{earnedMedals.length}/{medals.filter(m => !m.is_secret || m.earned).length}</span>
                      </div>

                      {/* Tabs por tipo */}
                      {(['objective', 'legendary', 'secret'] as const).map(type => {
                        const typeMedals = medals.filter(m => m.medal_type === type);
                        if (typeMedals.length === 0) return null;
                        return (
                          <div key={type} className="mb-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{MEDAL_TYPE_LABELS[type]}</p>
                            <div className="flex flex-wrap gap-2">
                              {typeMedals.map(medal => (
                                <div
                                  key={medal.slug}
                                  title={medal.description}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                                    medal.earned
                                      ? type === 'legendary' ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-md'
                                        : type === 'secret' ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-md'
                                        : 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-md'
                                      : 'bg-slate-100 dark:bg-background-dark opacity-40'
                                  }`}
                                >
                                  <span className="text-lg">{medal.icon}</span>
                                  <span className={`text-[9px] font-black uppercase tracking-wide ${medal.earned ? 'text-white' : 'text-slate-400'}`}>
                                    {medal.name}
                                  </span>
                                  {medal.earned && (
                                    <span className="text-[8px] text-white/70 font-bold">+{medal.xp_reward}XP</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {earnedMedals.length === 0 && (
                        <p className="text-xs text-slate-400 text-center mt-2">¡Explora y participa para ganar medallas!</p>
                      )}
                    </div>
                  )}

                  {/* Recent mural posts */}
                  {muralPosts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mis últimas publicaciones</p>
                      <div className="grid grid-cols-2 gap-3">
                        {muralPosts.map(post => (
                          <div key={post.id} className="bg-white dark:bg-surface-dark rounded-2xl p-3 border border-slate-100 dark:border-white/5 shadow-sm">
                            {post.media_urls?.[0] && <img src={post.media_urls[0]} className="w-full h-20 object-cover rounded-xl mb-2" alt="" />}
                            <p className="text-[10px] font-black uppercase tracking-widest"
                              style={{ color: post.post_type === 'alert' ? '#EF4444' : post.post_type === 'review' ? '#F59E0B' : accentColor }}>
                              {post.post_type}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Admin zone */}
              {(role === 'SuperAdmin' || role === 'DueñoEmpresa') && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Zona de Gestión</p>
                  {role === 'SuperAdmin' && (
                    <button onClick={() => navigate('/admin')}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-lg">
                      <span className="material-symbols-outlined">admin_panel_settings</span> Panel Super Admin
                    </button>
                  )}
                  <button onClick={() => navigate('/portal')}
                    className="w-full py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-orange-500">storefront</span> Portal Empresa
                  </button>
                </div>
              )}

              {/* Logout */}
              <button onClick={async () => { await logout(); window.location.href = '/#/'; window.location.reload(); }}
                className="w-full py-5 text-red-500 font-black text-xs uppercase tracking-widest border-2 border-red-500/20 rounded-2xl hover:bg-red-500/5 transition-all flex items-center justify-center gap-4">
                <span className="material-symbols-outlined">logout</span> {t('logout')}
              </button>
            </div>
          )}

          {/* ── TRIPS TAB ── */}
          {activeTab === 'trips' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {(!user.savedItineraries || user.savedItineraries.length === 0) ? (
                <div className="bg-white dark:bg-surface-dark rounded-3xl p-16 text-center border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">explore_off</span>
                  <h3 className="text-xl font-black dark:text-white uppercase italic tracking-tighter">{t('no_trips')}</h3>
                  <button onClick={() => navigate('/planner')} className="mt-6 px-8 py-4 rounded-full font-black text-xs text-white uppercase tracking-widest shadow-lg" style={{ backgroundColor: accentColor }}>
                    {t('start_btn')}
                  </button>
                </div>
              ) : (
                user.savedItineraries.map(trip => (
                  <div key={trip.id} className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                      <span className="material-symbols-outlined text-2xl">landscape</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Viaje de {trip.days} días</p>
                      <p className="text-sm font-black dark:text-white uppercase italic truncate">Ruta del {new Date(trip.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenTrip(trip)} className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                        <span className="material-symbols-outlined text-base">explore</span>
                      </button>
                      <button onClick={() => deleteItinerary(trip.id)} className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-100 dark:border-red-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CONTRIBUTIONS TAB ── */}
          {activeTab === 'contributions' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', val: contributionsCount.total, color: accentColor },
                  { label: 'Aprobadas', val: contributionsCount.approved, color: '#22C55E' },
                  { label: 'Puntos', val: contributionsCount.approved * 10, color: '#F59E0B' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-surface-dark rounded-2xl p-5 text-center border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-3xl font-black" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/profile/contributions')}
                className="w-full py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"
                style={{ backgroundColor: accentColor }}>
                <span className="material-symbols-outlined">photo_library</span> Ver todas mis fotos
              </button>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">

                {/* Language */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                      <span className="material-symbols-outlined">translate</span>
                    </div>
                    <p className="font-black dark:text-white uppercase italic tracking-tighter">{t('language')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {languages.map(lang => (
                      <button key={lang.code} onClick={() => setTempLanguage(lang.code as Language)}
                        className={`flex flex-col items-center py-5 rounded-2xl border-2 transition-all ${tempLanguage === lang.code ? 'text-white border-transparent shadow-lg scale-105' : 'border-transparent bg-slate-50 dark:bg-background-dark text-slate-400'}`}
                        style={tempLanguage === lang.code ? { backgroundColor: accentColor } : {}}>
                        <span className="text-2xl mb-1">{lang.flag}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map theme */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">map</span>
                    </div>
                    <p className="font-black dark:text-white uppercase italic tracking-tighter">{t('map_style')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {mapThemes.map(theme => (
                      <button key={theme.code} onClick={() => setTempMapTheme(theme.code as MapTheme)}
                        className={`flex flex-col items-center py-5 rounded-2xl border-2 transition-all ${tempMapTheme === theme.code ? 'text-white border-transparent shadow-lg' : 'border-transparent bg-slate-50 dark:bg-background-dark text-slate-400'}`}
                        style={tempMapTheme === theme.code ? { backgroundColor: accentColor } : {}}>
                        <span className="material-symbols-outlined text-3xl mb-1">{theme.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="font-black dark:text-white uppercase italic tracking-tighter">{t('currency_label')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {currencies.map(curr => (
                      <button key={curr.code} onClick={() => setTempCurrency(curr.code as Currency)}
                        className={`flex flex-col items-center py-5 rounded-2xl border-2 transition-all ${tempCurrency === curr.code ? 'text-white border-transparent shadow-lg scale-105' : 'border-transparent bg-slate-50 dark:bg-background-dark text-slate-400'}`}
                        style={tempCurrency === curr.code ? { backgroundColor: accentColor } : {}}>
                        <span className="text-2xl font-black mb-1">{curr.symbol}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{curr.code}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleApplySettings}
                  className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${showSuccess ? 'bg-green-500 text-white' : 'text-white'}`}
                  style={!showSuccess ? { backgroundColor: accentColor } : {}}>
                  <span className="material-symbols-outlined">{showSuccess ? 'done_all' : 'save'}</span>
                  {showSuccess ? 'CAMBIOS APLICADOS' : t('apply_changes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default ProfileScreen;
