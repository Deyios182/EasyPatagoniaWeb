import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';
import { Company, Service } from '../types';
import { uploadImage } from '../utils/imageHandler'; // Asegúrate de tener este archivo creado

const BusinessPortalScreen: React.FC = () => {
  const { user } = useAppAuth();
  
  // Estados de datos
  const [myCompanies, setMyCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [isEditingService, setIsEditingService] = useState<Partial<Service> | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. Cargar Empresas del Dueño
  useEffect(() => {
    if (!user) return;
    fetchMyCompanies();
  }, [user]);

  const fetchMyCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user?.uid); // FILTRO CLAVE: Solo mis empresas

      if (error) throw error;
      setMyCompanies(data || []);
      
      // Si tiene una sola empresa, seleccionarla automáticamente
      if (data && data.length > 0) {
        handleSelectCompany(data[0]);
      }
    } catch (err) {
      console.error("Error cargando empresas:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar Servicios de la Empresa Seleccionada
  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', company.id);
    setServices(data || []);
  };

  // 3. Guardar cambios de Empresa (Ej: Logo)
  const handleUpdateCompany = async (field: keyof Company, value: any) => {
    if (!selectedCompany) return;
    
    const { error } = await supabase
      .from('companies')
      .update({ [field]: value })
      .eq('id', selectedCompany.id);

    if (!error) {
      setSelectedCompany({ ...selectedCompany, [field]: value });
      setMyCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, [field]: value } : c));
    }
  };

  // 4. Lógica de Servicios (Crear/Editar)
  const handleSaveService = async () => {
    if (!selectedCompany || !isEditingService?.name) return;

    const payload = {
      company_id: selectedCompany.id,
      name: isEditingService.name,
      price: isEditingService.price || 0,
      description: isEditingService.description,
      image_url: isEditingService.image_url
    };

    let error;
    if (isEditingService.id) {
      // Editar
      const res = await supabase.from('services').update(payload).eq('id', isEditingService.id).select();
      error = res.error;
      if (res.data) {
        setServices(prev => prev.map(s => s.id === isEditingService.id ? res.data[0] : s));
      }
    } else {
      // Crear
      const res = await supabase.from('services').insert([payload]).select();
      error = res.error;
      if (res.data) {
        setServices(prev => [...prev, res.data[0]]);
      }
    }

    if (!error) setIsEditingService(null);
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Eliminar servicio?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // Subida de imágenes genérica
  const handleImageUpload = async (e: any, target: 'company' | 'service') => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    
    const url = await uploadImage(file, target === 'company' ? 'logos' : 'services');
    
    if (url) {
      if (target === 'company') {
        handleUpdateCompany('logo_url', url);
      } else {
        setIsEditingService(prev => ({ ...prev, image_url: url }));
      }
    }
    setUploading(false);
  };

  if (loading) return <div className="p-10 text-center">Cargando tu negocio...</div>;

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-800 mb-2">Portal Empresas</h1>
      <p className="text-slate-500 mb-8">Administra tu presencia en Easy Patagonia.</p>

      {/* SELECTOR DE EMPRESA */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {myCompanies.map(comp => (
          <button
            key={comp.id}
            onClick={() => handleSelectCompany(comp)}
            className={`px-6 py-3 rounded-xl border font-bold transition-all ${
              selectedCompany?.id === comp.id 
                ? 'bg-primary text-white border-primary shadow-lg' 
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {comp.name}
          </button>
        ))}
        {myCompanies.length === 0 && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl">
            Aún no tienes empresas asignadas. Contacta a un Colaborador para registrar tu negocio.
          </div>
        )}
      </div>

      {selectedCompany && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: DATOS EMPRESA */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-xl font-bold mb-4 text-slate-700">Tu Empresa</h2>
            
            <div className="relative group mb-4 w-32 h-32 mx-auto bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-md">
               <img 
                 src={selectedCompany.logo_url || 'https://via.placeholder.com/150'} 
                 alt="Logo" 
                 className="w-full h-full object-cover"
               />
               <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold">
                 CAMBIAR
                 <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'company')} />
               </label>
            </div>
            {uploading && <p className="text-center text-xs text-blue-500 mb-2">Subiendo...</p>}

            <div className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                 <input 
                   type="text" 
                   value={selectedCompany.name} 
                   onChange={(e) => handleUpdateCompany('name', e.target.value)}
                   className="w-full font-bold text-lg border-b border-slate-200 focus:border-primary outline-none py-1 bg-transparent"
                 />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-400 uppercase">Descripción</label>
                 <textarea 
                   value={selectedCompany.description || ''} 
                   onChange={(e) => handleUpdateCompany('description', e.target.value)}
                   className="w-full text-sm border-b border-slate-200 focus:border-primary outline-none py-1 bg-transparent resize-none"
                   rows={3}
                 />
               </div>
            </div>
          </div>

          {/* COLUMNA 2: SERVICIOS */}
          <div className="lg:col-span-2">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-700">Tus Servicios ({services.length})</h2>
               <button 
                 onClick={() => setIsEditingService({})}
                 className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all"
               >
                 + Nuevo Servicio
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {services.map(srv => (
                 <div key={srv.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                    <img 
                      src={srv.image_url || 'https://via.placeholder.com/100'} 
                      className="w-20 h-20 rounded-xl object-cover bg-slate-100" 
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{srv.name}</h3>
                      <p className="text-primary font-black">${srv.price?.toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setIsEditingService(srv)} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full font-bold text-slate-600">Editar</button>
                        <button onClick={() => handleDeleteService(srv.id)} className="text-xs bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full font-bold text-red-500">Borrar</button>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN SERVICIO */}
      {isEditingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditingService.id ? 'Editar' : 'Crear'} Servicio</h3>
              
              <div className="space-y-4">
                 <div className="flex justify-center mb-4">
                    {isEditingService.image_url ? (
                        <img src={isEditingService.image_url} className="w-full h-32 object-cover rounded-xl" />
                    ) : (
                        <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">Sin Imagen</div>
                    )}
                 </div>
                 <input type="file" onChange={(e) => handleImageUpload(e, 'service')} className="text-xs w-full mb-4" />

                 <input 
                   placeholder="Nombre del servicio (ej. Ticket Mármol)" 
                   className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                   value={isEditingService.name || ''}
                   onChange={e => setIsEditingService({...isEditingService, name: e.target.value})}
                 />
                 <input 
                   type="number"
                   placeholder="Precio (CLP)" 
                   className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                   value={isEditingService.price || ''}
                   onChange={e => setIsEditingService({...isEditingService, price: Number(e.target.value)})}
                 />
                 <textarea 
                   placeholder="Descripción breve..." 
                   className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                   rows={3}
                   value={isEditingService.description || ''}
                   onChange={e => setIsEditingService({...isEditingService, description: e.target.value})}
                 />
              </div>

              <div className="flex gap-3 mt-8">
                 <button onClick={() => setIsEditingService(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancelar</button>
                 <button onClick={handleSaveService} className="flex-1 py-3 font-bold bg-primary text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">Guardar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPortalScreen;
