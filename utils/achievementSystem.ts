/**
 * Achievement System for EasyPatagonia
 * Badges are calculated automatically from user activity — no extra DB table needed.
 */

export interface Achievement {
    id: string;
    icon: string;
    name: string;
    description: string;
    color: string;          // Tailwind gradient classes
    earned: boolean;
}

export interface UserStats {
    totalPosts: number;
    photoPosts: number;
    reviewPosts: number;
    alertPosts: number;
    approvedPhotos: number;
    sharedItineraries: number;
    followersCount: number;
}

export const computeAchievements = (stats: UserStats): Achievement[] => {
    return [
        {
            id: 'pioneer',
            icon: '🗺️',
            name: 'Pionero del Mural',
            description: 'Publicaste por primera vez en el Mural Global',
            color: 'from-blue-400 to-blue-600',
            earned: stats.totalPosts >= 1,
        },
        {
            id: 'photographer',
            icon: '📸',
            name: 'Fotógrafo Austral',
            description: '5 o más fotos aprobadas en atractivos',
            color: 'from-purple-400 to-purple-600',
            earned: stats.approvedPhotos >= 5,
        },
        {
            id: 'critic',
            icon: '⭐',
            name: 'Crítico Patagónico',
            description: 'Escribiste 3 o más reseñas de locales',
            color: 'from-amber-400 to-orange-500',
            earned: stats.reviewPosts >= 3,
        },
        {
            id: 'alert',
            icon: '⚡',
            name: 'Alerta Viva',
            description: 'Enviaste 2 o más alertas de ruta',
            color: 'from-red-400 to-red-600',
            earned: stats.alertPosts >= 2,
        },
        {
            id: 'explorer',
            icon: '🏔️',
            name: 'Explorador Verificado',
            description: 'Compartiste un itinerario al Mural Global',
            color: 'from-emerald-400 to-green-600',
            earned: stats.sharedItineraries >= 1,
        },
        {
            id: 'social',
            icon: '💌',
            name: 'Alma Social',
            description: '10 o más personas te siguen',
            color: 'from-pink-400 to-rose-500',
            earned: stats.followersCount >= 10,
        },
        {
            id: 'guide',
            icon: '🧠',
            name: 'Guía Local',
            description: 'Publicaste 10 o más veces en el Mural',
            color: 'from-teal-400 to-cyan-600',
            earned: stats.totalPosts >= 10,
        },
    ];
};

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
