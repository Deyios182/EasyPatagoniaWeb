import React, { useState, useEffect } from 'react';
import { Check, X, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

interface PendingPhoto {
    id: string;
    attraction_id: string;
    attraction_name: string;
    locality_name: string | null;
    user_name: string | null;
    user_email: string | null;
    photo_url: string;
    photo_description: string | null;
    created_at: string;
}

const AdminPhotoReviewScreen: React.FC = () => {
    const navigate = useNavigate();
    const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<PendingPhoto | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const fetchPendingPhotos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pending_photo_contributions')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPendingPhotos(data || []);
        } catch (error) {
            console.error('Error fetching pending photos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingPhotos();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('photo-contributions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_photo_contributions',
                },
                () => {
                    fetchPendingPhotos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleApprove = async (photoId: string) => {
        setProcessing(photoId);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.rpc('approve_photo_contribution', {
                contribution_id: photoId,
                admin_user_id: user.id,
            });

            if (error) throw error;

            alert('Foto aprobada exitosamente');
            fetchPendingPhotos();
        } catch (error) {
            console.error('Error approving photo:', error);
            alert('No se pudo aprobar la foto');
        } finally {
            setProcessing(null);
        }
    };

    const handleRejectClick = (photo: PendingPhoto) => {
        setSelectedPhoto(photo);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedPhoto) return;

        setProcessing(selectedPhoto.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.rpc('reject_photo_contribution', {
                contribution_id: selectedPhoto.id,
                admin_user_id: user.id,
                reason: rejectReason.trim() || null,
            });

            if (error) throw error;

            alert('Foto rechazada');
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedPhoto(null);
            fetchPendingPhotos();
        } catch (error) {
            console.error('Error rejecting photo:', error);
            alert('No se pudo rechazar la foto');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Cargando fotos pendientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Revisar Fotos
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Contribuciones de la comunidad
                            </p>
                        </div>
                    </div>
                    <div className="bg-primary text-white px-4 py-2 rounded-xl font-bold">
                        {pendingPhotos.length} pendientes
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {pendingPhotos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <Check size={48} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            ¡Todo al día!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            No hay fotos pendientes de revisión
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingPhotos.map((photo) => {
                            const isProcessing = processing === photo.id;

                            return (
                                <div
                                    key={photo.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 hover:shadow-xl transition-shadow"
                                >
                                    {/* Photo */}
                                    <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                                        <img
                                            src={photo.photo_url}
                                            alt={photo.attraction_name}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => window.open(photo.photo_url, '_blank')}
                                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors backdrop-blur-sm"
                                        >
                                            <Eye size={20} className="text-white" />
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                                {photo.attraction_name}
                                            </h3>
                                            {photo.locality_name && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {photo.locality_name}
                                                </p>
                                            )}
                                        </div>

                                        {photo.photo_description && (
                                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                                                    "{photo.photo_description}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {photo.user_name || 'Usuario Anónimo'}
                                                </p>
                                                {photo.user_email && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {photo.user_email}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {new Date(photo.created_at).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => handleRejectClick(photo)}
                                                disabled={isProcessing}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <X size={18} />
                                                Rechazar
                                            </button>
                                            <button
                                                onClick={() => handleApprove(photo.id)}
                                                disabled={isProcessing}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30"
                                            >
                                                {isProcessing ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check size={18} />
                                                        Aprobar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedPhoto && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                Rechazar Foto
                            </h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            ¿Estás seguro de rechazar la foto de <strong>{selectedPhoto.attraction_name}</strong>?
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                Razón del rechazo (opcional)
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Ej: Foto borrosa, no corresponde al atractivo, etc."
                                className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setSelectedPhoto(null);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={processing === selectedPhoto.id}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing === selectedPhoto.id ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : (
                                    'Confirmar Rechazo'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPhotoReviewScreen;
