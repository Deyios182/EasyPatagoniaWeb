import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';
import { Company, Service, UserImage } from '../types';
import { uploadImage } from './imageHandler';
import ImageSelectorModal from '../components/ImageSelectorModal';

const BusinessPortalScreen: React.FC = () => {
  const { user } = useAppAuth();

  // Estados de datos
  const [myCompanies, setMyCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editedCompany, setEditedCompany] = useState<Company | null>(null); // Estado local para edición
  const [services, setServices] = useState<Service[]>([]);
  const [userGallery, setUserGallery] = useState<UserImage[]>([]); // Galería personal del usuario

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [isEditingService, setIsEditingService] = useState<Partial<Service> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'servicios' | 'galeria'>('info');
  const [showImageSelector, setShowImageSelector] = useState<'logo' | 'gallery' | 'service' | null>(null);

  // 1. Cargar Empresas del Dueño y Galería Personal
  useEffect(() => {
    if (!user) return;
    fetchMyCompanies();
    loadUserGallery(); // Cargar galería personal al montar
  }, [user]);

  const fetchMyCompanies = async () => {
    try {
      setLoading(true);
      console.log('🔵 [PORTAL] Buscando empresas para owner_id:', user?.uid);

      // Cargar empresas desde la tabla de relación company_owners
      const { data, error } = await supabase
        .from('company_owners')
        .select(`
          company_id,
          companies (*)
        `)
        .eq('owner_id', user?.uid);

      if (error) {
        console.error('❌ [PORTAL] Error:', error);
        throw error;
      }

      // Extraer las empresas del resultado
      const companies = (data?.map(item => item.companies).filter(Boolean) || []) as unknown as Company[];
      console.log('✅ [PORTAL] Empresas encontradas:', companies.length);
      setMyCompanies(companies);

      if (companies.length > 0) {
        handleSelectCompany(companies[0]);
      }
    } catch (err) {
      console.error("Error cargando empresas:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1.5. Cargar Galería Personal del Usuario
  const loadUserGallery = async () => {
    if (!user?.uid) return;
    console.log('🔵 [GALLERY] Cargando galería personal...');

    const { data, error } = await supabase
      .from('user_gallery')
      .select('*')
      .eq('owner_id', user.uid)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('❌ [GALLERY] Error al cargar galería:', error);
    } else {
      console.log('✅ [GALLERY] Imágenes cargadas:', data?.length || 0);
      setUserGallery(data || []);
    }
  };

  // 1.6. Subir imagen a galería personal
  const handleUploadToGallery = async (file: File, type: 'logo' | 'gallery' | 'service'): Promise<string | null> => {
    const folder = type === 'logo' ? 'logos' : type === 'gallery' ? 'galleries' : 'services';
    const url = await uploadImage(file, folder);

    if (url && user?.uid) {
      // Guardar en user_gallery
      const { error } = await supabase
        .from('user_gallery')
        .insert([{
          owner_id: user.uid,
          image_url: url,
          image_type: type,
          name: file.name
        }]);

      if (error) {
        console.error('❌ [GALLERY] Error al guardar en galería:', error);
      } else {
        console.log('✅ [GALLERY] Imagen guardada en galería personal');
        loadUserGallery(); // Recargar galería
      }
    }

    return url;
  };

  // 2. Cargar Servicios de la Empresa Seleccionada
  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setEditedCompany(company); // Inicializar estado de edición
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', company.id);
    setServices(data || []);
  };

  // 3. Guardar cambios de Empresa (solo cuando se presiona el botón)
  const handleSaveCompanyChanges = async () => {
    if (!editedCompany || !selectedCompany) return;

    setSaving(true);
    console.log('💾 [PORTAL] Guardando cambios de empresa...');

    const { error } = await supabase
      .from('companies')
      .update({
        name: editedCompany.name,
        category: editedCompany.category,
        whatsapp: editedCompany.whatsapp,
        address: editedCompany.address,
        description: editedCompany.description,
        opening_time: editedCompany.opening_time || '09:00',
        closing_time: editedCompany.closing_time || '19:00'
      })
      .eq('id', selectedCompany.id);

    if (!error) {
      setSelectedCompany(editedCompany);
      setMyCompanies(prev => prev.map(c => c.id === selectedCompany.id ? editedCompany : c));
      console.log('✅ [PORTAL] Guardado exitosamente');
      alert('✅ Cambios guardados correctamente');
    } else {
      console.error('❌ [PORTAL] Error al guardar:', error);
      alert('Error al guardar: ' + error.message);
    }
    setSaving(false);
  };

  // 4. Lógica de Servicios (Crear/Editar)
  const handleSaveService = async () => {
    if (!selectedCompany || !isEditingService?.name) return;

    const serviceId = isEditingService.id || crypto.randomUUID();

    const payload = {
      id: serviceId,
      company_id: selectedCompany.id,
      name: isEditingService.name,
      price: isEditingService.price || 'Consultar',
      description: isEditingService.description,
      image_url: isEditingService.image_url
    };

    let error;
    if (isEditingService.id) {
      const res = await supabase.from('services').update(payload).eq('id', isEditingService.id).select();
      error = res.error;
      if (res.data) {
        setServices(prev => prev.map(s => s.id === isEditingService.id ? res.data[0] : s));
      }
    } else {
      const res = await supabase.from('services').insert([payload]).select();
      error = res.error;
      if (res.data) {
        setServices(prev => [...prev, res.data[0]]);
      }
    }

    if (!error) {
      setIsEditingService(null);
    } else {
      alert('Error al guardar servicio: ' + error.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Eliminar servicio?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // 5. Subida de imágenes (guarda directamente en BD)
  const handleImageUpload = async (e: any, target: 'logo' | 'service' | 'gallery') => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    // Usar subcarpetas en el bucket uploads
    const folder = target === 'logo' ? 'logos' : target === 'gallery' ? 'galleries' : 'services';
    const url = await uploadImage(file, folder);

    if (url) {
      if (target === 'logo' && selectedCompany) {
        // Guardar logo directamente
        const { error } = await supabase.from('companies').update({ logo_url: url }).eq('id', selectedCompany.id);
        if (!error) {
          setSelectedCompany({ ...selectedCompany, logo_url: url });
          setEditedCompany(prev => prev ? { ...prev, logo_url: url } : null);
        }
      } else if (target === 'gallery' && selectedCompany) {
        // Guardar galería directamente
        const newGallery = [...(selectedCompany.gallery_urls || []), url];
        const { error } = await supabase.from('companies').update({ gallery_urls: newGallery }).eq('id', selectedCompany.id);
        if (!error) {
          setSelectedCompany({ ...selectedCompany, gallery_urls: newGallery });
          setEditedCompany(prev => prev ? { ...prev, gallery_urls: newGallery } : null);
        }
      } else {
        setIsEditingService(prev => ({ ...prev, image_url: url }));
      }
    }
    setUploading(false);
  };

  // 6. Eliminar foto de galería (guarda directamente)
  const handleRemoveGalleryImage = async (index: number) => {
    if (!selectedCompany) return;
    const newGallery = selectedCompany.gallery_urls?.filter((_, i) => i !== index) || [];
    const { error } = await supabase.from('companies').update({ gallery_urls: newGallery }).eq('id', selectedCompany.id);
    if (!error) {
      setSelectedCompany({ ...selectedCompany, gallery_urls: newGallery });
      setEditedCompany(prev => prev ? { ...prev, gallery_urls: newGallery } : null);
    }
  };

  // 7. Manejar selección de imagen desde galería personal
  const handleSelectImageFromGallery = async (imageUrl: string) => {
    if (!selectedCompany || !showImageSelector) return;

    if (showImageSelector === 'logo') {
      const { error } = await supabase.from('companies').update({ logo_url: imageUrl }).eq('id', selectedCompany.id);
      if (!error) {
        setSelectedCompany({ ...selectedCompany, logo_url: imageUrl });
        setEditedCompany(prev => prev ? { ...prev, logo_url: imageUrl } : null);
      }
    } else if (showImageSelector === 'gallery') {
      const newGallery = [...(selectedCompany.gallery_urls || []), imageUrl];
      const { error } = await supabase.from('companies').update({ gallery_urls: newGallery }).eq('id', selectedCompany.id);
      if (!error) {
        setSelectedCompany({ ...selectedCompany, gallery_urls: newGallery });
        setEditedCompany(prev => prev ? { ...prev, gallery_urls: newGallery } : null);
      }
    }
  };

  // 8. Subir nueva imagen desde modal
  const handleUploadNewImage = async (file: File, type: 'logo' | 'gallery' | 'service') => {
    const url = await handleUploadToGallery(file, type);
    if (url && selectedCompany) {
      // Asignar la imagen subida según el tipo
      if (type === 'logo') {
        const { error } = await supabase.from('companies').update({ logo_url: url }).eq('id', selectedCompany.id);
        if (!error) {
          setSelectedCompany({ ...selectedCompany, logo_url: url });
          setEditedCompany(prev => prev ? { ...prev, logo_url: url } : null);
        }
      } else if (type === 'gallery') {
        const newGallery = [...(selectedCompany.gallery_urls || []), url];
        const { error } = await supabase.from('companies').update({ gallery_urls: newGallery }).eq('id', selectedCompany.id);
        if (!error) {
          setSelectedCompany({ ...selectedCompany, gallery_urls: newGallery });
          setEditedCompany(prev => prev ? { ...prev, gallery_urls: newGallery } : null);
        }
      }
      setShowImageSelector(null); // Cerrar modal
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold">Cargando tu negocio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-body">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-primary/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/30 rounded-full blur-[100px]"></div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-blue-400">storefront</span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Portal Empresas</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Mi Negocio</h1>
          <p className="text-slate-400 mt-2">Administra tu presencia en Easy Patagonia.</p>
        </div>
      </div>

      <div className="p-8 md:p-12 pt-0">
        {/* SELECTOR DE EMPRESA */}
        {myCompanies.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {myCompanies.map(comp => (
              <button
                key={comp.id}
                onClick={() => handleSelectCompany(comp)}
                className={`px-6 py-3 rounded-2xl font-bold transition-all border ${selectedCompany?.id === comp.id
                  ? 'bg-gradient-to-r from-primary to-orange-600 text-white border-primary shadow-lg shadow-primary/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/10'
                  }`}
              >
                {comp.name}
              </button>
            ))}
          </div>
        )}

        {myCompanies.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-6 rounded-3xl text-center">
            <span className="material-symbols-outlined text-4xl mb-2">store_mall_directory</span>
            <p className="font-bold">Aún no tienes empresas asignadas.</p>
            <p className="text-sm opacity-80 mt-1">Contacta a un Colaborador para registrar tu negocio.</p>
          </div>
        )}

        {selectedCompany && (
          <>
            {/* TABS */}
            <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 mb-8 w-fit">
              <button onClick={() => setActiveTab('info')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'info' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Información</button>
              <button onClick={() => setActiveTab('servicios')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'servicios' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Servicios ({services.length})</button>
              <button onClick={() => setActiveTab('galeria')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'galeria' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Galería</button>
            </div>

            {/* TAB: INFORMACIÓN */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo y Nombre */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    Identidad
                  </h2>

                  <div className="relative group mb-6 w-32 h-32 mx-auto bg-white/5 rounded-3xl overflow-hidden border-2 border-white/10">
                    <img
                      src={selectedCompany.logo_url || 'https://via.placeholder.com/150'}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setShowImageSelector('logo')}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <span className="material-symbols-outlined text-white mb-1">photo_camera</span>
                      <span className="text-xs font-bold text-white">Cambiar</span>
                    </button>
                  </div>
                  {uploading && <p className="text-center text-xs text-primary mb-2 animate-pulse">Subiendo imagen...</p>}

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Nombre</label>
                      <input
                        type="text"
                        value={editedCompany?.name || ''}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Categoría</label>
                      <select
                        value={editedCompany?.category || 'Actividad'}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, category: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="Actividad" className="bg-slate-900">Actividad / Tour</option>
                        <option value="Restaurante" className="bg-slate-900">Restaurante</option>
                        <option value="Hospedaje" className="bg-slate-900">Hospedaje</option>
                        <option value="Transporte" className="bg-slate-900">Transporte</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">contact_phone</span>
                    Contacto
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">WhatsApp</label>
                      <input
                        type="text"
                        placeholder="+56 9 1234 5678"
                        value={editedCompany?.whatsapp || ''}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, whatsapp: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Dirección</label>
                      <input
                        type="text"
                        placeholder="Calle Principal 123, Puerto Río Tranquilo"
                        value={editedCompany?.address || ''}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, address: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Horarios */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    Horarios
                  </h2>

                  {/* Estado actual */}
                  {(() => {
                    const now = new Date();
                    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const open = editedCompany?.opening_time || '09:00';
                    const close = editedCompany?.closing_time || '19:00';
                    const isCurrentlyOpen = currentTime >= open && currentTime < close;
                    return (
                      <div className={`flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border ${isCurrentlyOpen
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                        }`}>
                        <div className={`w-3 h-3 rounded-full ${isCurrentlyOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-bold ${isCurrentlyOpen ? 'text-green-400' : 'text-red-400'}`}>
                          {isCurrentlyOpen ? 'Actualmente ABIERTO' : 'Actualmente CERRADO'}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">
                          Hora actual: {currentTime}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hora Apertura</label>
                      <input
                        type="time"
                        value={editedCompany?.opening_time || '09:00'}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, opening_time: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Hora Cierre</label>
                      <input
                        type="time"
                        value={editedCompany?.closing_time || '19:00'}
                        onChange={(e) => setEditedCompany(prev => prev ? { ...prev, closing_time: e.target.value } : null)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">info</span>
                    El estado "Abierto/Cerrado" se mostrará automáticamente en el directorio según estos horarios.
                  </p>
                </div>

                {/* Descripción */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span>
                    Descripción
                  </h2>
                  <textarea
                    placeholder="Describe tu negocio, qué ofreces, qué te hace único..."
                    value={editedCompany?.description || ''}
                    onChange={(e) => setEditedCompany(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 resize-none focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500 h-40"
                  />
                </div>

                {/* BOTÓN GUARDAR CAMBIOS */}
                <div className="lg:col-span-3">
                  <button
                    onClick={handleSaveCompanyChanges}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SERVICIOS */}
            {activeTab === 'servicios' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Tus Servicios</h2>
                  <button
                    onClick={() => setIsEditingService({})}
                    className="bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Nuevo Servicio
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map(srv => (
                    <div key={srv.id} className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 hover:border-primary/50 transition-all group">
                      <img
                        src={srv.image_url || 'https://via.placeholder.com/300x200'}
                        className="w-full h-32 rounded-2xl object-cover bg-white/5 mb-4"
                      />
                      <h3 className="font-bold text-white text-lg">{srv.name}</h3>
                      <p className="text-primary font-black">{srv.price}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setIsEditingService(srv)} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteService(srv.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <div className="col-span-full text-center py-16 border-2 border-dashed border-white/10 rounded-3xl">
                      <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">inventory_2</span>
                      <p className="text-slate-500 font-bold">No hay servicios registrados aún.</p>
                      <p className="text-sm text-slate-600 mt-1">Agrega tu primer servicio con el botón de arriba.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: GALERÍA */}
            {activeTab === 'galeria' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Galería de Fotos</h2>
                  <button
                    onClick={() => setShowImageSelector('gallery')}
                    className="bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">add_photo_alternate</span>
                    Agregar Foto
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedCompany.gallery_urls?.map((url, i) => (
                    <div key={i} className="relative group aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                      <img src={url} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveGalleryImage(i)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  {(!selectedCompany.gallery_urls || selectedCompany.gallery_urls.length === 0) && (
                    <div className="col-span-full text-center py-16 border-2 border-dashed border-white/10 rounded-3xl">
                      <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">photo_library</span>
                      <p className="text-slate-500 font-bold">No hay fotos en la galería.</p>
                      <p className="text-sm text-slate-600 mt-1">Agrega fotos para mostrar tu negocio.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL EDICIÓN SERVICIO */}
      {isEditingService && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-white/10">
            <h3 className="text-2xl font-black text-white mb-6">{isEditingService.id ? 'Editar' : 'Nuevo'} Servicio</h3>

            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                {isEditingService.image_url ? (
                  <img src={isEditingService.image_url} className="w-full h-32 object-cover rounded-2xl border border-white/10" />
                ) : (
                  <div className="w-full h-32 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10">
                    <span className="material-symbols-outlined text-3xl">image</span>
                  </div>
                )}
              </div>
              <label className="block w-full text-center">
                <span className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  Subir Imagen
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'service')} />
              </label>

              <input
                placeholder="Nombre del servicio"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                value={isEditingService.name || ''}
                onChange={e => setIsEditingService({ ...isEditingService, name: e.target.value })}
              />
              <input
                placeholder="Precio (ej: CLP 25.000)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                value={isEditingService.price || ''}
                onChange={e => setIsEditingService({ ...isEditingService, price: e.target.value })}
              />
              <textarea
                placeholder="Descripción del servicio..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 resize-none focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500"
                rows={3}
                value={isEditingService.description || ''}
                onChange={e => setIsEditingService({ ...isEditingService, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditingService(null)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">Cancelar</button>
              <button onClick={handleSaveService} className="flex-1 py-3 bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selector de Imágenes */}
      {showImageSelector && (
        <ImageSelectorModal
          userGallery={userGallery}
          onSelect={handleSelectImageFromGallery}
          onUploadNew={handleUploadNewImage}
          onClose={() => setShowImageSelector(null)}
          imageType={showImageSelector}
        />
      )}
    </div>
  );
};

export default BusinessPortalScreen;
