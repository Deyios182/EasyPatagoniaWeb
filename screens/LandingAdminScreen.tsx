import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { uploadImage } from './imageHandler'; // Asegúrate de tener esta ruta correcta

const LandingAdminScreen: React.FC = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase.from('landing_content').select('*').order('key');
    if (data) setContent(data);
    setLoading(false);
  };

  const handleUpdate = async (key: string, field: string, value: string) => {
    // Actualización optimista en UI
    setContent(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
    
    // Actualización en BD
    await supabase.from('landing_content').update({ [field]: value }).eq('key', key);
  };

  const handleImageUpload = async (e: any, key: string) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadImage(file, 'landing'); // Asegúrate de crear el bucket 'landing' en Supabase
    if (url) {
      handleUpdate(key, 'image_url', url);
    }
  };

  if (loading) return <div className="p-10">Cargando...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-body">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Editor de Landing Page</h1>
      <p className="text-slate-500 mb-8">Personaliza la portada de Easy Patagonia.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {content.map((item) => (
          <div key={item.key} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-black uppercase text-primary">{item.key}</h2>
               <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {item.key}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Título</label>
                <input 
                  type="text" 
                  value={item.title || ''}
                  onChange={(e) => handleUpdate(item.key, 'title', e.target.value)}
                  className="w-full font-bold text-lg border-b border-slate-200 focus:border-primary outline-none py-1"
                />
              </div>

              {item.subtitle !== null && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Subtítulo</label>
                  <input 
                    type="text" 
                    value={item.subtitle || ''}
                    onChange={(e) => handleUpdate(item.key, 'subtitle', e.target.value)}
                    className="w-full text-sm border-b border-slate-200 focus:border-primary outline-none py-1"
                  />
                </div>
              )}

              {item.body !== null && (
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Texto / Cuerpo</label>
                    <textarea 
                      value={item.body || ''}
                      onChange={(e) => handleUpdate(item.key, 'body', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary outline-none"
                      rows={3}
                    />
                 </div>
              )}

              {item.image_url !== null && (
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Imagen de Fondo</label>
                   <div className="relative h-40 rounded-xl overflow-hidden group border border-slate-200">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-xs hover:scale-105 transition-transform">
                            Cambiar Imagen
                            <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, item.key)} />
                         </label>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingAdminScreen;
