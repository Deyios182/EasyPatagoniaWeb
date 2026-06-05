/**
 * Sistema de Medallas Australes — Easy Patagonia
 * Las medallas se cargan desde Supabase (tabla gamification_medals).
 * Incluye lógica de verificación automática de triggers por tipo.
 */

import { supabase } from '../supabaseClient';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface Medal {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  medal_type: 'objective' | 'legendary' | 'secret';
  trigger_type: 'post_count' | 'xp_threshold' | 'manual' | 'location';
  trigger_value: any; // {"count": 5} | {"xp": 1000} | {"lat": -46.6, "lng": -72.7, "radius_m": 500}
  xp_reward: number;
  is_secret: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface UserMedal {
  medal_slug: string;
  earned_at: string;
}

export interface MedalWithStatus extends Medal {
  earned: boolean;
  earned_at?: string;
}

export interface UserStats {
  totalPosts: number;
  photoPosts: number;
  reviewPosts: number;
  alertPosts: number;
  approvedPhotos: number;
  totalXp: number;
  followersCount: number;
  sharedItineraries: number;
}

// ─── CACHE ────────────────────────────────────────────────────────────────────

let _cachedMedals: Medal[] | null = null;
let _medalCacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function loadMedalsFromDB(): Promise<Medal[]> {
  if (_cachedMedals && Date.now() < _medalCacheExpiry) return _cachedMedals;

  try {
    const { data, error } = await supabase
      .from('gamification_medals')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) throw new Error('No medals from DB');

    _cachedMedals = data as Medal[];
    _medalCacheExpiry = Date.now() + CACHE_TTL;
    return _cachedMedals;
  } catch {
    return FALLBACK_MEDALS;
  }
}

export function invalidateMedalCache() {
  _cachedMedals = null;
  _medalCacheExpiry = 0;
}

// ─── VERIFICACIÓN DE TRIGGERS ─────────────────────────────────────────────────

/**
 * Evalúa si un usuario cumple el trigger automático de una medalla.
 * Solo aplica para trigger_type !== 'manual'.
 */
export function checkMedalTrigger(medal: Medal, stats: UserStats): boolean {
  if (!medal.trigger_value) return false;

  switch (medal.trigger_type) {
    case 'post_count': {
      const { type, count } = medal.trigger_value;
      if (type === 'photo') return stats.photoPosts >= count;
      if (type === 'review') return stats.reviewPosts >= count;
      if (type === 'alert') return stats.alertPosts >= count;
      if (type === 'any') return stats.totalPosts >= count;
      return false;
    }
    case 'xp_threshold': {
      return stats.totalXp >= medal.trigger_value.xp;
    }
    case 'location': {
      // La ubicación se verifica en tiempo real en el cliente — no aquí
      return false;
    }
    case 'manual':
    default:
      return false;
  }
}

/**
 * Combina las medallas del sistema con las medallas ganadas por el usuario.
 * Las medallas secretas sin ganar muestran datos enmascarados.
 */
export function buildMedalStatuses(
  allMedals: Medal[],
  userMedals: UserMedal[],
  stats: UserStats
): MedalWithStatus[] {
  const earnedSlugs = new Set(userMedals.map(m => m.medal_slug));

  return allMedals.map(medal => {
    const isEarned = earnedSlugs.has(medal.slug);
    const userMedal = userMedals.find(m => m.medal_slug === medal.slug);

    // Ocultar datos de medallas secretas no ganadas
    const displayMedal: Medal = isEarned || !medal.is_secret
      ? medal
      : {
          ...medal,
          name: '???',
          description: 'Sigue explorando la Patagonia para descubrir esta medalla...',
          icon: '🔒',
        };

    return {
      ...displayMedal,
      earned: isEarned,
      earned_at: userMedal?.earned_at,
    };
  });
}

/**
 * Verifica automáticamente qué medallas de tipo 'post_count' o 'xp_threshold'
 * debería tener el usuario y las otorga si no las tiene aún.
 */
export async function autoCheckAndGrantMedals(userId: string, stats: UserStats): Promise<string[]> {
  try {
    const allMedals = await loadMedalsFromDB();
    const { data: existingMedals } = await supabase
      .from('user_medals')
      .select('medal_slug')
      .eq('user_id', userId);

    const earned = new Set((existingMedals || []).map((m: any) => m.medal_slug));
    const newlyGranted: string[] = [];

    for (const medal of allMedals) {
      if (medal.trigger_type === 'manual' || medal.trigger_type === 'location') continue;
      if (earned.has(medal.slug)) continue;

      if (checkMedalTrigger(medal, stats)) {
        // Otorgar medalla
        const { error } = await supabase.from('user_medals').insert({
          user_id: userId,
          medal_slug: medal.slug,
        });

        if (!error) {
          newlyGranted.push(medal.slug);

          // Otorgar XP de recompensa si tiene
          if (medal.xp_reward > 0) {
            await supabase.rpc('grant_xp_to_user', {
              p_user_id: userId,
              p_amount: medal.xp_reward,
              p_reason: 'medal_earned',
              p_notes: `Medalla desbloqueada: ${medal.name}`,
            });
          }
        }
      }
    }

    return newlyGranted;
  } catch {
    return [];
  }
}

// ─── FALLBACK (si DB no disponible) ───────────────────────────────────────────

export const FALLBACK_MEDALS: Medal[] = [
  {
    id: 'fallback-1', slug: 'primer_destello', name: 'Primer Destello',
    description: 'Publicaste tu primera foto en el Mural', icon: '📸',
    medal_type: 'objective', trigger_type: 'post_count',
    trigger_value: { type: 'photo', count: 1 },
    xp_reward: 50, is_secret: false, is_active: true, sort_order: 1,
  },
  {
    id: 'fallback-2', slug: 'explorador_mural', name: 'Explorador del Mural',
    description: '5 publicaciones aprobadas en el Mural Global', icon: '🗺️',
    medal_type: 'objective', trigger_type: 'post_count',
    trigger_value: { type: 'any', count: 5 },
    xp_reward: 100, is_secret: false, is_active: true, sort_order: 2,
  },
  {
    id: 'fallback-3', slug: 'voz_comunidad', name: 'Voz de la Comunidad',
    description: '3 reseñas de negocios locales', icon: '🌟',
    medal_type: 'objective', trigger_type: 'post_count',
    trigger_value: { type: 'review', count: 3 },
    xp_reward: 80, is_secret: false, is_active: true, sort_order: 3,
  },
  {
    id: 'fallback-4', slug: 'guardian_rutas', name: 'Guardián de Rutas',
    description: '2 alertas de ruta enviadas a la comunidad', icon: '⚡',
    medal_type: 'objective', trigger_type: 'post_count',
    trigger_value: { type: 'alert', count: 2 },
    xp_reward: 60, is_secret: false, is_active: true, sort_order: 4,
  },
  {
    id: 'fallback-5', slug: 'nomada_austral', name: 'Nómada Austral',
    description: 'Completaste tu primera Easy Ruta', icon: '🏕️',
    medal_type: 'objective', trigger_type: 'manual',
    trigger_value: null,
    xp_reward: 150, is_secret: false, is_active: true, sort_order: 5,
  },
  {
    id: 'fallback-6', slug: 'aliado_local', name: 'Aliado Local',
    description: 'Foto con 3 emprendedores locales de Patagonia', icon: '🤝',
    medal_type: 'legendary', trigger_type: 'manual',
    trigger_value: null,
    xp_reward: 300, is_secret: false, is_active: true, sort_order: 10,
  },
  {
    id: 'fallback-7', slug: 'leyenda_aysen', name: 'Leyenda de Aysén',
    description: 'Alcanzaste 3,000 XP — Pionero Legendario', icon: '🏆',
    medal_type: 'legendary', trigger_type: 'xp_threshold',
    trigger_value: { xp: 3000 },
    xp_reward: 500, is_secret: false, is_active: true, sort_order: 12,
  },
  {
    id: 'fallback-8', slug: 'corazon_lago_carrera', name: '???',
    description: 'Sigue explorando la Patagonia para descubrir esta medalla...',
    icon: '🔒',
    medal_type: 'secret', trigger_type: 'location',
    trigger_value: { lat: -46.55, lng: -72.35, radius_m: 1000 },
    xp_reward: 1000, is_secret: true, is_active: true, sort_order: 20,
  },
];

// ─── LEGACY COMPAT (para ProfileScreen que usaba achievementSystem) ───────────

/** @deprecated Usar buildMedalStatuses() en su lugar */
export const computeAchievements = (stats: UserStats) => {
  return FALLBACK_MEDALS
    .filter(m => !m.is_secret)
    .map(m => ({
      id: m.slug,
      icon: m.icon,
      name: m.name,
      description: m.description,
      color: m.medal_type === 'legendary' ? 'from-amber-400 to-orange-500' : 'from-blue-400 to-blue-600',
      earned: checkMedalTrigger(m, stats),
    }));
};

// Re-exportar constantes de achievementSystem para compatibilidad
export const ACCENT_COLORS = [
  { label: 'Patagonia', value: '#FF6B35' },
  { label: 'Glaciar', value: '#0EA5E9' },
  { label: 'Bosque', value: '#22C55E' },
  { label: 'Volcán', value: '#EF4444' },
  { label: 'Noche Austral', value: '#8B5CF6' },
  { label: 'Arena Pura', value: '#F59E0B' },
];

export const BANNER_GRADIENTS = [
  { label: 'Patagonia', value: 'from-orange-500 via-amber-400 to-yellow-400' },
  { label: 'Glaciar', value: 'from-sky-600 via-blue-500 to-cyan-400' },
  { label: 'Bosque Valdiviano', value: 'from-green-700 via-emerald-500 to-teal-400' },
  { label: 'Noche Austral', value: 'from-indigo-900 via-purple-800 to-slate-900' },
  { label: 'Volcán', value: 'from-red-700 via-orange-500 to-amber-400' },
  { label: 'Aurora', value: 'from-violet-600 via-pink-500 to-orange-400' },
];
