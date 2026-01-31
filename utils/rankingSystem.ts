// Sistema de Rangos de Usuario
// Basado en cantidad de fotos aprobadas

export type UserRank = 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'Diamante';

export interface RankInfo {
    rank: UserRank;
    minPhotos: number;
    maxPhotos: number | null;
    color: string;
    gradient: string;
    icon: string;
    emoji: string;
}

export const RANKS: Record<UserRank, RankInfo> = {
    'Bronce': {
        rank: 'Bronce',
        minPhotos: 1,
        maxPhotos: 5,
        color: '#CD7F32',
        gradient: 'from-amber-700 to-amber-900',
        icon: '🥉',
        emoji: '🥉'
    },
    'Plata': {
        rank: 'Plata',
        minPhotos: 6,
        maxPhotos: 15,
        color: '#C0C0C0',
        gradient: 'from-slate-300 to-slate-500',
        icon: '🥈',
        emoji: '🥈'
    },
    'Oro': {
        rank: 'Oro',
        minPhotos: 16,
        maxPhotos: 30,
        color: '#FFD700',
        gradient: 'from-yellow-400 to-yellow-600',
        icon: '🥇',
        emoji: '🥇'
    },
    'Platino': {
        rank: 'Platino',
        minPhotos: 31,
        maxPhotos: 50,
        color: '#E5E4E2',
        gradient: 'from-cyan-300 to-cyan-600',
        icon: '💎',
        emoji: '💎'
    },
    'Diamante': {
        rank: 'Diamante',
        minPhotos: 51,
        maxPhotos: null,
        color: '#B9F2FF',
        gradient: 'from-blue-400 to-purple-600',
        icon: '💠',
        emoji: '💠'
    }
};

/**
 * Calcula el rango de un usuario basado en fotos aprobadas
 */
export function getUserRank(approvedPhotosCount: number): RankInfo {
    if (approvedPhotosCount >= 51) return RANKS['Diamante'];
    if (approvedPhotosCount >= 31) return RANKS['Platino'];
    if (approvedPhotosCount >= 16) return RANKS['Oro'];
    if (approvedPhotosCount >= 6) return RANKS['Plata'];
    if (approvedPhotosCount >= 1) return RANKS['Bronce'];

    // Por defecto, Bronce para usuarios sin fotos aprobadas aún
    return {
        rank: 'Bronce',
        minPhotos: 0,
        maxPhotos: 0,
        color: '#94A3B8',
        gradient: 'from-slate-400 to-slate-600',
        icon: '📸',
        emoji: '📸'
    };
}

/**
 * Obtiene el progreso hacia el siguiente rango
 */
export function getRankProgress(approvedPhotosCount: number): {
    currentRank: RankInfo;
    nextRank: RankInfo | null;
    progress: number;
    photosToNext: number;
} {
    const currentRank = getUserRank(approvedPhotosCount);

    // Encontrar el siguiente rango
    const rankOrder: UserRank[] = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];
    const currentIndex = rankOrder.indexOf(currentRank.rank);
    const nextRank = currentIndex < rankOrder.length - 1 ? RANKS[rankOrder[currentIndex + 1]] : null;

    if (!nextRank) {
        return {
            currentRank,
            nextRank: null,
            progress: 100,
            photosToNext: 0
        };
    }

    const photosInCurrentRank = approvedPhotosCount - currentRank.minPhotos;
    const photosNeededForNextRank = nextRank.minPhotos - currentRank.minPhotos;
    const progress = Math.min(100, (photosInCurrentRank / photosNeededForNextRank) * 100);
    const photosToNext = nextRank.minPhotos - approvedPhotosCount;

    return {
        currentRank,
        nextRank,
        progress,
        photosToNext: Math.max(0, photosToNext)
    };
}
