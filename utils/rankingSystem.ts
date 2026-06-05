/**
 * Sistema de Rangos — Easy Patagonia
 * Basado en XP total acumulado (nunca disminuye).
 * Los rangos se cargan dinámicamente desde Supabase (tabla gamification_ranks).
 * Fallback a valores por defecto si no hay conexión.
 */

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface RankInfo {
  id?: string;
  name: string;
  min_xp: number;
  emoji: string;
  color_gradient: string;   // Clases Tailwind: "from-X to-Y"
  hex_color: string;
  benefits?: string;
  sort_order?: number;
}

export interface RankProgress {
  currentRank: RankInfo;
  nextRank: RankInfo | null;
  progress: number;       // 0–100
  xpToNext: number;       // XP restantes para subir de rango
  totalXp: number;
}

// ─── RANGOS POR DEFECTO (Fallback) ────────────────────────────────────────────

export const DEFAULT_RANKS: RankInfo[] = [
  {
    name: 'Turista',
    min_xp: 0,
    emoji: '🎒',
    color_gradient: 'from-slate-400 to-slate-600',
    hex_color: '#64748B',
    benefits: 'Acceso básico a la plataforma',
    sort_order: 1,
  },
  {
    name: 'Explorador Novato',
    min_xp: 200,
    emoji: '🧭',
    color_gradient: 'from-emerald-400 to-teal-600',
    hex_color: '#10B981',
    benefits: 'Acceso a Easy Rutas básicas',
    sort_order: 2,
  },
  {
    name: 'Explorador Avanzado',
    min_xp: 600,
    emoji: '⛺',
    color_gradient: 'from-blue-400 to-indigo-600',
    hex_color: '#3B82F6',
    benefits: 'Descuentos en emprendedores locales + rutas avanzadas',
    sort_order: 3,
  },
  {
    name: 'Explorador Máximo',
    min_xp: 1500,
    emoji: '🏔️',
    color_gradient: 'from-amber-400 to-orange-600',
    hex_color: '#F59E0B',
    benefits: 'Acceso prioritario + reconocimiento comunitario',
    sort_order: 4,
  },
  {
    name: 'Pionero Legendario',
    min_xp: 3000,
    emoji: '🦅',
    color_gradient: 'from-purple-500 to-pink-600',
    hex_color: '#8B5CF6',
    benefits: 'Todos los beneficios + sello legendario + zonas VIP',
    sort_order: 5,
  },
];

// ─── CACHE en memoria ─────────────────────────────────────────────────────────

let _cachedRanks: RankInfo[] | null = null;
let _cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carga rangos desde Supabase con caché en memoria.
 * Fallback automático a DEFAULT_RANKS si falla la consulta.
 */
export async function loadRanksFromDB(): Promise<RankInfo[]> {
  // Usar cache si sigue válido
  if (_cachedRanks && Date.now() < _cacheExpiry) return _cachedRanks;

  try {
    // Import dinámico para evitar dependencias circulares
    const { supabase } = await import('../supabaseClient');
    const { data, error } = await supabase
      .from('gamification_ranks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) throw new Error('No ranks from DB');

    _cachedRanks = data as RankInfo[];
    _cacheExpiry = Date.now() + CACHE_TTL;
    return _cachedRanks;
  } catch {
    // Fallback silencioso
    return DEFAULT_RANKS;
  }
}

/** Invalida el caché (llamar desde el admin después de editar rangos) */
export function invalidateRankCache() {
  _cachedRanks = null;
  _cacheExpiry = 0;
}

// ─── LÓGICA DE RANGO ─────────────────────────────────────────────────────────

/**
 * Calcula el rango de un usuario basado en XP total.
 * @param totalXp - XP total acumulado del usuario
 * @param ranks - Array de rangos (usar DEFAULT_RANKS o el cargado desde DB)
 */
export function getUserRankFromXP(totalXp: number, ranks: RankInfo[] = DEFAULT_RANKS): RankInfo {
  // Ordenar de mayor a menor XP para encontrar el más alto alcanzado
  const sorted = [...ranks].sort((a, b) => b.min_xp - a.min_xp);
  const matched = sorted.find(r => totalXp >= r.min_xp);
  return matched || DEFAULT_RANKS[0];
}

/**
 * Calcula progreso completo hacia el siguiente rango
 */
export function getRankProgress(totalXp: number, ranks: RankInfo[] = DEFAULT_RANKS): RankProgress {
  const sorted = [...ranks].sort((a, b) => a.min_xp - b.min_xp);
  const currentRank = getUserRankFromXP(totalXp, ranks);
  const currentIdx = sorted.findIndex(r => r.name === currentRank.name);
  const nextRank = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  if (!nextRank) {
    return { currentRank, nextRank: null, progress: 100, xpToNext: 0, totalXp };
  }

  const xpInCurrentTier = totalXp - currentRank.min_xp;
  const xpTierSize = nextRank.min_xp - currentRank.min_xp;
  const progress = Math.min(100, Math.floor((xpInCurrentTier / xpTierSize) * 100));
  const xpToNext = Math.max(0, nextRank.min_xp - totalXp);

  return { currentRank, nextRank, progress, xpToNext, totalXp };
}

// ─── LEGACY COMPAT (para ProfileScreen que usaba getUserRank con fotos aprobadas) ──

/**
 * @deprecated Usar getUserRankFromXP() con totalXp en su lugar.
 * Mantener para no romper imports existentes.
 */
export function getUserRank(approvedPhotosCount: number): RankInfo {
  // Mapeo aproximado: 1 foto ≈ 10 XP
  return getUserRankFromXP(approvedPhotosCount * 10);
}
