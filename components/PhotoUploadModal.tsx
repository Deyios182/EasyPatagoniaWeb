import React, { useState } from 'react';
import { Camera, X, Upload, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhotoUploadModalProps {
    isOpen: boolean;
    attractionId: string;
    attractionName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
    isOpen,
    attractionId,
    attractionName,
    onClose,
    onSuccess,
}) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen debe ser menor a 5MB');
            return;
        }

        setError(null);
        setSelectedImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!selectedImage) return;

        setUploading(true);
        setError(null);

        try {
            // 1. Upload image to Supabase Storage
            const fileExt = selectedImage.name.split('.').pop();
            const fileName = `${attractionId}-${Date.now()}.${fileExt}`;
            const filePath = `contributions/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('attraction-photos')
                .upload(filePath, selectedImage, {
                    contentType: selectedImage.type,
                    cacheControl: '3600',
                });

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attraction-photos')
                .getPublicUrl(filePath);

            // 3. Get current user info (if authenticated)
            const { data: { user } } = await supabase.auth.getUser();

            // 4. Insert contribution record
            const { error: dbError } = await supabase
                .from('user_photo_contributions')
                .insert({
                    attraction_id: attractionId,
                    user_id: user?.id || null,
                    user_name: user?.user_metadata?.name || null,
                    user_email: user?.email || null,
                    photo_url: publicUrl,
                    photo_description: description.trim() || null,
                    status: 'pending',
                });

            if (dbError) throw dbError;

            // Success!
            setUploaded(true);

            setTimeout(() => {
                handleClose();
                if (onSuccess) onSuccess();
            }, 2500);

        } catch (err: any) {
            console.error('Error uploading photo:', err);
            setError(err.message || 'No pudimos subir tu foto. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedImage(null);
        setPreview(null);
        setDescription('');
        setUploaded(false);
        setUploading(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {uploaded ? '¡Gracias por contribuir!' : 'Subir Foto'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {uploaded ? (
                        /* Success View */
                        <div className="text-center py-12 space-y-6 animate-in slide-in-from-bottom duration-500">
                            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-in zoom-in duration-700">
                                <Check size={48} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Tu foto ha sido enviada
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    La revisaremos pronto y te notificaremos cuando esté aprobada
                                </p>
                            </div>
                            <div className="inline-flex items-center gap-3 bg-amber-100 dark:bg-amber-900/30 px-6 py-3 rounded-full">
                                <span className="text-2xl">🏆</span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">+10 puntos</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Attraction Name */}
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Foto para: <span className="font-bold text-slate-900 dark:text-white">{attractionName}</span>
                            </p>

                            {/* Image Selection */}
                            {!preview ? (
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                        <Upload size={48} className="mx-auto text-primary mb-4 group-hover:scale-110 transition-transform" />
                                        <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                            Selecciona una foto
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Arrastra y suelta o haz click para seleccionar
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            Máximo 5MB - JPG, PNG, WEBP
                                        </p>
                                    </div>
                                </label>
                            ) : (
                                <>
                                    {/* Image Preview */}
                                    <div className="space-y-3">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="w-full aspect-video object-cover rounded-2xl"
                                        />
                                        <button
                                            onClick={() => {
                                                setSelectedImage(null);
                                                setPreview(null);
                                            }}
                                            className="text-sm text-primary hover:text-primary/80 font-semibold"
                                        >
                                            Cambiar Foto
                                        </button>
                                    </div>

                                    {/* Description Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-900 dark:text-white">
                                            Descripción (opcional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={200}
                                            placeholder="Cuéntanos sobre esta foto..."
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-white/20 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                            rows={3}
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                            {description.length}/200
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl uppercase tracking-wider text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-primary/30"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={20} />
                                                Subir Foto
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoUploadModal;
