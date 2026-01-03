import React, { useState } from 'react';
import { UserImage } from '../types';
import { uploadImage } from '../screens/imageHandler';

interface ImageSelectorModalProps {
    userGallery: UserImage[];
    onSelect: (imageUrl: string) => void;
    onUploadNew: (file: File, type: 'logo' | 'gallery' | 'service') => Promise<void>;
    onClose: () => void;
    imageType: 'logo' | 'gallery' | 'service';
}

const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
    userGallery,
    onSelect,
    onUploadNew,
    onClose,
    imageType
}) => {
    const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
    const [uploading, setUploading] = useState(false);

    // Filtrar imágenes por tipo (opcional, o mostrar todas)
    const filteredGallery = userGallery.filter(img => img.image_type === imageType);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        await onUploadNew(file, imageType);
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 animate-in zoom-in-95">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            Seleccionar Imagen
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Elige de tu galería o sube una nueva</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 p-1.5 mx-6 mt-6 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'gallery'
                                ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm mr-2">photo_library</span>
                        Mi Galería ({filteredGallery.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'upload'
                                ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm mr-2">upload</span>
                        Subir Nueva
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {activeTab === 'gallery' && (
                        <div>
                            {filteredGallery.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">photo_library</span>
                                    <p className="text-slate-400 font-bold">No tienes imágenes de este tipo aún</p>
                                    <p className="text-sm text-slate-500 mt-2">Sube tu primera imagen en la pestaña "Subir Nueva"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredGallery.map((img) => (
                                        <div
                                            key={img.id}
                                            onClick={() => {
                                                onSelect(img.image_url);
                                                onClose();
                                            }}
                                            className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer group hover:border-primary transition-all hover:scale-105"
                                        >
                                            <img
                                                src={img.image_url}
                                                alt={img.name || 'Imagen'}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-3xl">check_circle</span>
                                            </div>
                                            {img.name && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                                                    <p className="text-xs text-white truncate">{img.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-full max-w-md">
                                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-3xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-primary transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="material-symbols-outlined text-6xl text-primary mb-4 group-hover:scale-110 transition-transform">
                                            {uploading ? 'hourglass_empty' : 'cloud_upload'}
                                        </span>
                                        {uploading ? (
                                            <p className="text-primary font-bold animate-pulse">Subiendo imagen...</p>
                                        ) : (
                                            <>
                                                <p className="mb-2 text-sm text-white font-bold">
                                                    <span className="text-primary">Haz clic para subir</span> o arrastra aquí
                                                </p>
                                                <p className="text-xs text-slate-400">PNG, JPG, WEBP o GIF (MAX. 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageSelectorModal;
