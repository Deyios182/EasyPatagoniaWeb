import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Trophy, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getUserRank, getRankProgress } from '../utils/rankingSystem';
import BottomNavigationBar from '../components/BottomNavigationBar';

interface PhotoContribution {
    id: string;
    attraction_id: string;
    photo_url: string;
    photo_description: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string;
    attraction_name?: string;
}

const UserContributionsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [contributions, setContributions] = useState<PhotoContribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchContributions();
    }, []);

    const fetchContributions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            setUserId(user.id);

            // Fetch user's contributions with attraction names
            const { data, error } = await supabase
                .from('user_photo_contributions')
                .select(`
                    *,
                    attractions (
                        name
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to include attraction name
            const transformedData = data?.map(item => ({
                ...item,
                attraction_name: (item as any).attractions?.name || 'Atractivo desconocido'
            })) || [];

            setContributions(transformedData);
        } catch (error) {
            console.error('Error fetching contributions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
    const totalPhotos = contributions.length;
    const approvedPhotos = contributions.filter(c => c.status === 'approved').length;
    const pendingPhotos = contributions.filter(c => c.status === 'pending').length;
    const rejectedPhotos = contributions.filter(c => c.status === 'rejected').length;
    const totalPoints = approvedPhotos * 10;

    const rankInfo = getRankProgress(approvedPhotos);

    if (loading) {
        return (
            <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background-dark dark:to-slate-900 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-surface-dark shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-700 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Mis Contribuciones
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Fotos que has compartido con la comunidad
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Rank Card */}
                <div className={`bg-gradient-to-br ${rankInfo.currentRank.gradient} rounded-3xl p-8 text-white shadow-2xl`}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-5xl">{rankInfo.currentRank.emoji}</span>
                                <div>
                                    <p className="text-sm opacity-90 font-semibold uppercase tracking-wider">Rango Actual</p>
                                    <h2 className="text-3xl font-black">{rankInfo.currentRank.rank}</h2>
                                </div>
                            </div>
                            {rankInfo.nextRank && (
                                <p className="text-sm opacity-80">
                                    {rankInfo.photosToNext} fotos más para {rankInfo.nextRank.emoji} {rankInfo.nextRank.rank}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black mb-1">{approvedPhotos}</div>
                            <p className="text-sm opacity-90 font-semibold">Fotos Aprobadas</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {rankInfo.nextRank && (
                        <div className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${rankInfo.progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Camera className="text-primary" size={24} />
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalPhotos}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">Total Subidas</p>
                    </div>

                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="text-green-500" size={24} />
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{approvedPhotos}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">Aprobadas</p>
                    </div>

                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-amber-500" size={24} />
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{pendingPhotos}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">Pendientes</p>
                    </div>

                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="text-amber-400" size={24} />
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalPoints}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">Puntos</p>
                    </div>
                </div>

                {/* Photos Grid */}
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">
                        Mis Fotos
                    </h3>

                    {contributions.length === 0 ? (
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-12 text-center">
                            <Camera size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Aún no has subido fotos
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Comparte tus mejores capturas de los atractivos turísticos
                            </p>
                            <button
                                onClick={() => navigate('/tourist/map')}
                                className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-wider text-sm transition-all hover:scale-105 shadow-lg shadow-primary/30"
                            >
                                Explorar Mapa
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {contributions.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Photo */}
                                    <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
                                        <img
                                            src={photo.photo_url}
                                            alt={photo.attraction_name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            {photo.status === 'approved' && (
                                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle size={14} />
                                                    Aprobada
                                                </div>
                                            )}
                                            {photo.status === 'pending' && (
                                                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Clock size={14} />
                                                    Pendiente
                                                </div>
                                            )}
                                            {photo.status === 'rejected' && (
                                                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <XCircle size={14} />
                                                    Rechazada
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                                            {photo.attraction_name}
                                        </h4>
                                        {photo.photo_description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {photo.photo_description}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                            {new Date(photo.created_at).toLocaleDateString('es-CL', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>

                                        {/* Points or Rejection Reason */}
                                        {photo.status === 'approved' && (
                                            <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                                                <Trophy size={14} className="text-amber-600 dark:text-amber-400" />
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                    +10 puntos
                                                </span>
                                            </div>
                                        )}
                                        {photo.status === 'rejected' && photo.rejection_reason && (
                                            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-xs">
                                                <span className="font-semibold">Razón: </span>
                                                {photo.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BottomNavigationBar />
        </div>
    );
};

export default UserContributionsScreen;
