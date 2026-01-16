import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface LandingContent {
  id: string;
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
}

interface LandingSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
}

interface ThemePreset {
  name: string;
  colors: {
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    color_background: string;
  };
}

const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Default (Patagonia)',
    colors: {
      color_primary: '#dd6e42',
      color_secondary: '#4f6d7a',
      color_accent: '#e8dab2',
      color_background: '#eaeaea'
    }
  },
  {
    name: '🎄 Navidad',
    colors: {
      color_primary: '#c41e3a',
      color_secondary: '#165b33',
      color_accent: '#ffd700',
      color_background: '#f5f5f5'
    }
  },
  {
    name: '🎃 Halloween',
    colors: {
      color_primary: '#ff6600',
      color_secondary: '#1a1a1a',
      color_accent: '#9b59b6',
      color_background: '#2c2c2c'
    }
  },
  {
    name: '🐰 Pascua',
    colors: {
      color_primary: '#ff69b4',
      color_secondary: '#87ceeb',
      color_accent: '#ffeb3b',
      color_background: '#fff8dc'
    }
  },
  {
    name: '🌊 Verano',
    colors: {
      color_primary: '#00bcd4',
      color_secondary: '#ff9800',
      color_accent: '#ffeb3b',
      color_background: '#e0f7fa'
    }
  }
];

const LandingAdminScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'carousel' | 'theme' | 'contact' | 'navigation'>('content');
  const [content, setContent] = useState<LandingContent[]>([]);
  const [settings, setSettings] = useState<LandingSetting[]>([]);
  const [carousel, setCarousel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('');
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log('🔍 [LANDING ADMIN] Fetching data... (v1.1 - Supabase Storage)');

    const [contentRes, settingsRes, carouselRes] = await Promise.all([
      supabase.from('landing_content').select('*').order('key'),
      supabase.from('landing_settings').select('*'),
      supabase.from('landing_carousel').select('*').order('order_position')
    ]);

    console.log('📦 [LANDING ADMIN] Content response:', contentRes);
    console.log('⚙️ [LANDING ADMIN] Settings response:', settingsRes);
    console.log('🎠 [LANDING ADMIN] Carousel response:', carouselRes);

    if (contentRes.error) {
      console.error('❌ [LANDING ADMIN] Content error:', contentRes.error);
    }
    if (settingsRes.error) {
      console.error('❌ [LANDING ADMIN] Settings error:', settingsRes.error);
    }

    if (contentRes.data) {
      console.log('✅ [LANDING ADMIN] Setting content:', contentRes.data.length, 'items');
      console.log('📋 [LANDING ADMIN] Sample item:', contentRes.data[0]);
      setContent(contentRes.data);
    } else {
      console.warn('⚠️ [LANDING ADMIN] No content data received');
    }

    if (settingsRes.data) {
      console.log('✅ [LANDING ADMIN] Setting settings:', settingsRes.data.length, 'items');
      setSettings(settingsRes.data);
    } else {
      console.warn('⚠️ [LANDING ADMIN] No settings data received');
    }
    if (carouselRes.data) {
      console.log('✅ [LANDING ADMIN] Setting carousel:', carouselRes.data.length, 'items');
      setCarousel(carouselRes.data);
    } else {
      console.warn('⚠️ [LANDING ADMIN] No carousel data received');
    }

    setLoading(false);
  };

  const updateContent = async (key: string, field: string, value: string) => {
    setContent(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
    await supabase.from('landing_content').update({ [field]: value }).eq('key', key);
    showSaveIndicator();
  };

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));

    await supabase
      .from('landing_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    showSaveIndicator();
  };

  const showSaveIndicator = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

  const applyThemePreset = async (preset: ThemePreset) => {
    for (const [key, value] of Object.entries(preset.colors)) {
      await updateSetting(key, value);
    }
    showSaveIndicator();
  };

  const saveCurrentTheme = async () => {
    if (!customThemeName.trim()) {
      alert('Por favor ingresa un nombre para el tema');
      return;
    }

    const currentTheme = {
      name: customThemeName,
      colors: {
        color_primary: getSetting('color_primary') || '#dd6e42',
        color_secondary: getSetting('color_secondary') || '#4f6d7a',
        color_accent: getSetting('color_accent') || '#e8dab2',
        color_background: getSetting('color_background') || '#eaeaea'
      }
    };

    // Save to localStorage for now (could be saved to DB later)
    const savedThemes = JSON.parse(localStorage.getItem('custom_themes') || '[]');
    savedThemes.push(currentTheme);
    localStorage.setItem('custom_themes', JSON.stringify(savedThemes));

    setShowSaveThemeModal(false);
    setCustomThemeName('');
    alert(`Tema "${customThemeName}" guardado exitosamente!`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string, isContent: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `landing/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError);
        alert(`Error al subir imagen: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
      const url = data.publicUrl;

      if (isContent) {
        updateContent(key, 'image_url', url);
      } else {
        updateSetting(key, url);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'No se pudo subir la imagen'}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-background-dark"><div className="text-lg font-bold text-white">Cargando...</div></div>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-body">
      {/* Header */}
      <div className="relative overflow-hidden sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-primary/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/30 rounded-full blur-[100px]"></div>

        <div className="relative z-10 backdrop-blur-xl bg-background-dark/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-400">web</span>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">CMS</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Editor Landing Page</h1>
                <p className="text-sm text-slate-400">Los cambios se guardan automáticamente</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="px-5 py-3 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary/50 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 group"
                >
                  <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform duration-500">refresh</span>
                  Actualizar
                </button>
                {saving && (
                  <div className="bg-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200 border border-emerald-500/30">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Guardado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-background-dark/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'content', label: 'Contenido', icon: 'article' },
              { id: 'theme', label: 'Tema', icon: 'palette' },
              { id: 'contact', label: 'Contacto', icon: 'contact_mail' },
              { id: 'navigation', label: 'Navegación', icon: 'menu' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-white'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-white mt-4">Cargando...</p>
              </div>
            )}

            {!loading && content.length === 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
                <h3 className="text-xl font-black text-white mb-2">No hay contenido cargado</h3>
                <p className="text-slate-400">Ejecuta el script SQL populate-landing-data.sql en Supabase</p>
              </div>
            )}

            {!loading && content.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {content
                  .sort((a, b) => {
                    // Orden deseado
                    const order = ['hero', 'vision', 'mission', 'pillar_1', 'pillar_2', 'pillar_3', 'contact_section'];
                    return order.indexOf(a.key) - order.indexOf(b.key);
                  })
                  .map((item, index) => (
                    <div key={item.key || index} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white uppercase">{item.key?.replace(/_/g, ' ') || 'Sin Key'}</h3>
                        <span className="text-xs bg-white/10 text-slate-400 px-2 py-1 rounded-lg font-mono">{item.key}</span>
                      </div>

                      <div className="space-y-4">
                        {/* TITULO */}
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Título</label>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => updateContent(item.key, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Título..."
                          />
                        </div>

                        {/* SUBTITULO */}
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Subtítulo/Slogan</label>
                          <input
                            type="text"
                            value={item.subtitle || ''}
                            onChange={(e) => updateContent(item.key, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Subtítulo..."
                          />
                        </div>

                        {/* BODY */}
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descripción</label>
                          <textarea
                            value={item.body || ''}
                            onChange={(e) => updateContent(item.key, 'body', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                            placeholder="Descripción..."
                          />
                        </div>


                        {/* IMAGEN O CARRUSEL */}
                        {item.key === 'hero' ? (
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Imágenes del Carrusel (Máx 3)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[1, 2, 3].map((position) => {
                                const carouselItem = carousel.find(c => c.order_position === position);
                                return (
                                  <div key={position} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-slate-700 text-xs bg-slate-200 px-2 py-1 rounded">Imagen {position}</span>
                                      {carouselItem && <span className="text-[10px] text-green-600 font-bold">ACTIVA</span>}
                                    </div>

                                    {carouselItem ? (
                                      <div className="space-y-2">
                                        <div className="h-24 rounded-lg overflow-hidden relative group">
                                          <img src={carouselItem.image_url} className="w-full h-full object-cover" alt={`Slide ${position}`} />
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                            <label className="cursor-pointer bg-white text-slate-900 p-1.5 rounded-full hover:bg-slate-100" title="Cambiar">
                                              <span className="material-symbols-outlined text-sm">edit</span>
                                              <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `carousel/${Date.now()}.${fileExt}`;
                                                    const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);
                                                    if (uploadError) throw uploadError;
                                                    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
                                                    await supabase.from('landing_carousel').upsert({ order_position: position, image_url: data.publicUrl, alt_text: `Patagonia Imagen ${position}`, is_active: true }, { onConflict: 'order_position' });
                                                    fetchData();
                                                  } catch (error: any) { alert(`Error: ${error.message}`); }
                                                }}
                                              />
                                            </label>
                                            <button
                                              onClick={async () => {
                                                await supabase.from('landing_carousel').delete().eq('order_position', position);
                                                fetchData();
                                              }}
                                              className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                              title="Eliminar"
                                            >
                                              <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className="cursor-pointer h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-blue-50 transition-all flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400">add</span>
                                        <span className="text-[10px] text-slate-500 font-bold mt-1">Subir</span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const fileExt = file.name.split('.').pop();
                                              const fileName = `carousel/${Date.now()}.${fileExt}`;
                                              const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);
                                              if (uploadError) throw uploadError;
                                              const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
                                              await supabase.from('landing_carousel').upsert({ order_position: position, image_url: data.publicUrl, alt_text: `Patagonia Imagen ${position}`, is_active: true }, { onConflict: 'order_position' });
                                              fetchData();
                                            } catch (error: any) { alert(`Error: ${error.message}`); }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : item.image_url && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Imagen</label>
                            <div className="relative h-40 rounded-xl overflow-hidden group border-2 border-dashed border-slate-300">
                              <img src={item.image_url} className="w-full h-full object-cover" alt={item.key} />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm">
                                  Cambiar
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, item.key)} />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* CAROUSEL TAB */}
        {activeTab === 'carousel' && (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-blue-400 font-black text-xl mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Carrusel Hero - 3 Imágenes
              </h3>
              <p className="text-slate-300 text-sm">
                Sube hasta 3 imágenes para el carrusel principal. Las imágenes se mostrarán en rotación automática.
              </p>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-white mt-4">Cargando carrusel...</p>
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((position) => {
                  const carouselItem = carousel.find(c => c.order_position === position);
                  return (
                    <div key={position} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Imagen {position}</h3>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg font-mono">Posición {position}</span>
                      </div>

                      {carouselItem?.image_url ? (
                        <div className="relative h-48 rounded-xl overflow-hidden group border-2 border-white/10">
                          <img src={carouselItem.image_url} className="w-full h-full object-cover" alt={`Carrusel ${position}`} />
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                            <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                              Cambiar Imagen
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  try {
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `carousel/${Date.now()}.${fileExt}`;

                                    const { error: uploadError } = await supabase.storage
                                      .from('uploads')
                                      .upload(fileName, file);

                                    if (uploadError) throw uploadError;

                                    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);

                                    await supabase.from('landing_carousel').upsert({
                                      order_position: position,
                                      image_url: data.publicUrl,
                                      alt_text: `Patagonia Imagen ${position}`,
                                      is_active: true
                                    }, { onConflict: 'order_position' });

                                    fetchData();
                                  } catch (error: any) {
                                    console.error('Error:', error);
                                    alert(`Error al subir imagen: ${error.message}`);
                                  }
                                }}
                              />
                            </label>
                            <button
                              onClick={async () => {
                                await supabase.from('landing_carousel').delete().eq('order_position', position);
                                fetchData();
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer h-48 rounded-xl overflow-hidden border-2 border-dashed border-white/20 hover:border-primary transition-colors flex flex-col items-center justify-center bg-white/5">
                          <span className="material-symbols-outlined text-white/40 text-6xl mb-3">add_photo_alternate</span>
                          <span className="text-white/60 font-bold text-sm">Subir Imagen {position}</span>
                          <span className="text-white/40 text-xs mt-1">Click para seleccionar</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `carousel/${Date.now()}.${fileExt}`;

                                const { error: uploadError } = await supabase.storage
                                  .from('uploads')
                                  .upload(fileName, file);

                                if (uploadError) throw uploadError;

                                const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);

                                await supabase.from('landing_carousel').upsert({
                                  order_position: position,
                                  image_url: data.publicUrl,
                                  alt_text: `Patagonia Imagen ${position}`,
                                  is_active: true
                                }, { onConflict: 'order_position' });

                                fetchData();
                              } catch (error: any) {
                                console.error('Error:', error);
                                alert(`Error al subir imagen: ${error.message}`);
                              }
                            }}
                          />
                        </label>
                      )}

                      {carouselItem && (
                        <div className="mt-4">
                          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Texto Alternativo</label>
                          <input
                            type="text"
                            value={carouselItem.alt_text || ''}
                            onChange={async (e) => {
                              await supabase.from('landing_carousel')
                                .update({ alt_text: e.target.value })
                                .eq('order_position', position);
                              fetchData();
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg text-sm outline-none"
                            placeholder="Descripción de la imagen..."
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* THEME TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* Theme Presets */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Temas Preestablecidos</h3>
                  <p className="text-sm text-slate-500 mt-1">Aplica un tema con un solo click</p>
                </div>
                <button
                  onClick={() => setShowSaveThemeModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Guardar Tema Actual
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {THEME_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyThemePreset(preset)}
                    className="group relative bg-slate-50 border-2 border-slate-200 rounded-xl p-4 hover:border-primary hover:shadow-lg transition-all"
                  >
                    <div className="text-center mb-3">
                      <p className="font-black text-sm text-slate-800 group-hover:text-primary transition-colors">{preset.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.values(preset.colors).map((color, i) => (
                        <div
                          key={i}
                          className="h-8 rounded-md border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Customization */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6">Personalizar Colores</h3>
              <div className="space-y-6">
                {[
                  { key: 'color_primary', label: 'Color Primario', default: '#dd6e42' },
                  { key: 'color_secondary', label: 'Color Secundario', default: '#4f6d7a' },
                  { key: 'color_accent', label: 'Color de Acento', default: '#e8dab2' },
                  { key: 'color_background', label: 'Color de Fondo', default: '#eaeaea' }
                ].map(color => (
                  <div key={color.key} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-slate-700 block mb-2">{color.label}</label>
                      <input
                        type="text"
                        value={getSetting(color.key) || color.default}
                        onChange={(e) => updateSetting(color.key, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                        placeholder={color.default}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <label className="text-xs font-bold text-slate-500">Preview</label>
                      <input
                        type="color"
                        value={getSetting(color.key) || color.default}
                        onChange={(e) => updateSetting(color.key, e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-6">Información de Contacto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Teléfono WhatsApp</label>
                    <input
                      type="text"
                      value={getSetting('contact_whatsapp') || '56956425005'}
                      onChange={(e) => updateSetting('contact_whatsapp', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="56956425005"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Email</label>
                    <input
                      type="email"
                      value={getSetting('contact_email') || 'infoeasypatagonia@gmail.com'}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="info@easypatagonia.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Dirección</label>
                    <input
                      type="text"
                      value={getSetting('contact_address') || ''}
                      onChange={(e) => updateSetting('contact_address', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Puerto Río Tranquilo, Aysén"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-xl font-black text-slate-800 mb-6">Redes Sociales</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Instagram</label>
                    <input
                      type="text"
                      value={getSetting('social_instagram') || ''}
                      onChange={(e) => updateSetting('social_instagram', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="https://instagram.com/easypatagonia"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Facebook</label>
                    <input
                      type="text"
                      value={getSetting('social_facebook') || ''}
                      onChange={(e) => updateSetting('social_facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="https://facebook.com/easypatagonia"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION TAB */}
        {activeTab === 'navigation' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6">Logo y Navegación</h3>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Logo</label>
                  <div className="relative h-32 rounded-xl overflow-hidden group border-2 border-dashed border-slate-300 hover:border-primary transition-colors bg-slate-50">
                    {getSetting('logo_url') ? (
                      <>
                        <img src={getSetting('logo_url')} className="h-full object-contain mx-auto" alt="Logo" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm">
                            Cambiar Logo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url', false)} />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                        <span className="text-sm font-bold">Subir Logo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url', false)} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Nombre del Sitio</label>
                  <input
                    type="text"
                    value={getSetting('site_name') || 'Easy Patagonia'}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Tagline</label>
                  <input
                    type="text"
                    value={getSetting('site_tagline') || 'Austral Experience'}
                    onChange={(e) => updateSetting('site_tagline', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Theme Modal */}
      {showSaveThemeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-4">Guardar Tema Actual</h3>
            <p className="text-slate-600 mb-6">Dale un nombre a este tema para poder aplicarlo más tarde</p>

            <input
              type="text"
              value={customThemeName}
              onChange={(e) => setCustomThemeName(e.target.value)}
              placeholder="Ej: Mi Tema Personalizado"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg mb-6 focus:border-primary outline-none"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveThemeModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCurrentTheme}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:scale-105 transition-transform"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingAdminScreen;

