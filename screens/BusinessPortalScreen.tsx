
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Business, Service, Category } from '../types';

const BusinessPortalScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, allBusinesses, updateBusiness } = useAppAuth();
  
  const myBusiness = allBusinesses.find(b => b.contacto.email === user?.email);
  
  const [isEditing, setIsEditing] = useState(!myBusiness);
  const [formData, setFormData] = useState<Partial<Business>>(myBusiness || {
    id: `biz-${Date.now()}`,
    nombre: '',
    categoria: 'Restaurante',
    priority: 2,
    gps: { lat: -46.6225, lng: -72.6745 },
    contacto: { whatsapp: '', email: user?.email || '', web: '' },
    info: { descripcion: '', horario: '09:00 - 18:00', direccion: '' },
    media: { logo_url: 'https://i.imgur.com/gGo8HiH.png', fotos_url: [] },
    servicios: [],
    rating: 5.0,
    reviewCount: 0,
    isOpen: true,
    offlineReady: true
  });

  const handleSave = () => {
    if (!formData.nombre) return alert("El nombre es obligatorio");
    updateBusiness(formData as Business);
    setIsEditing(false);
  };

  const addService = () => {
    const newService: Service = {
      id: `s-${Date.now()}`,
      nombre: '',
      precio: '',
      descripcion: '',
      foto_url: 'https://images.unsplash.com/photo-1519781615555-d4e5f419c968'
    };
    setFormData(prev => ({
      ...prev,
      servicios: [...(prev.servicios || []), newService]
    }));
  };

  const removeService = (sid: string) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios?.filter(s => s.id !== sid)
    }));
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-y-auto items-center p-6 md:p-12">
      <div className="w-full max-w-6xl space-y-12 pb-32">
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                 <span className="material-symbols-outlined text-3xl">dashboard</span>
              </div>
              <div>
                <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase">Gestión de Negocio</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Portal de Autogestión Regional</p>
              </div>
           </div>
           <button onClick={() => navigate('/profile')} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-white/5">
              <span className="material-symbols-outlined text-2xl">close</span>
           </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
            
            {/* Lado Info General */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-white dark:bg-surface-dark p-8 rounded-[3rem] shadow-sm space-y-8 border border-slate-200 dark:border-white/5">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] px-2">Perfil de Empresa</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Comercial</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-5 px-6 text-base dark:text-white font-bold"
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoría</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-5 px-6 text-base dark:text-white"
                      value={formData.categoria}
                      onChange={e => setFormData({...formData, categoria: e.target.value as Category})}
                    >
                      <option value="Restaurante">Restaurante</option>
                      <option value="Hospedaje">Hospedaje</option>
                      <option value="Actividad">Actividad</option>
                      <option value="Transporte">Transporte</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descripción del Negocio</label>
                    <textarea 
                      className="w-full bg-slate-50 dark:bg-background-dark border-none rounded-2xl py-5 px-6 text-base dark:text-white h-40 no-scrollbar"
                      value={formData.info?.descripcion}
                      onChange={e => setFormData({...formData, info: {...formData.info!, descripcion: e.target.value}})}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Lado Catálogo de Servicios */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-surface-dark p-8 md:p-12 rounded-[3.5rem] shadow-sm space-y-10 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em]">Catálogo de Servicios Digital</h3>
                  <button onClick={addService} className="bg-primary/10 text-primary flex items-center gap-2 font-black px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Servicio
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.servicios?.map((s, idx) => (
                    <div key={s.id} className="p-6 bg-slate-50 dark:bg-background-dark rounded-[2.5rem] space-y-6 relative border border-slate-100 dark:border-white/5 group">
                      <button onClick={() => removeService(s.id)} className="absolute top-6 right-6 text-red-400 hover:text-red-500 transition-colors bg-white dark:bg-surface-dark w-10 h-10 rounded-xl shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined">delete_sweep</span>
                      </button>
                      
                      <div className="space-y-4">
                        <input 
                          placeholder="Nombre del servicio"
                          className="w-full bg-white dark:bg-surface-dark border-none rounded-2xl px-5 py-4 text-base dark:text-white font-black"
                          value={s.nombre}
                          onChange={e => {
                            const newS = [...formData.servicios!];
                            newS[idx].nombre = e.target.value;
                            setFormData({...formData, servicios: newS});
                          }}
                        />
                        <input 
                          placeholder="Precio (Ej: CLP 25.000)"
                          className="w-full bg-white dark:bg-surface-dark border-none rounded-2xl px-5 py-4 text-base text-primary font-black"
                          value={s.precio}
                          onChange={e => {
                            const newS = [...formData.servicios!];
                            newS[idx].precio = e.target.value;
                            setFormData({...formData, servicios: newS});
                          }}
                        />
                        <textarea 
                          placeholder="Describe brevemente lo que incluye..."
                          className="w-full bg-white dark:bg-surface-dark border-none rounded-2xl px-5 py-4 text-sm dark:text-white h-24 no-scrollbar"
                          value={s.descripcion}
                          onChange={e => {
                            const newS = [...formData.servicios!];
                            newS[idx].descripcion = e.target.value;
                            setFormData({...formData, servicios: newS});
                          }}
                        />
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto del Servicio (URL)</label>
                          <input 
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-white dark:bg-surface-dark border-none rounded-2xl px-5 py-3 text-[10px] dark:text-slate-400 font-mono"
                            value={s.foto_url}
                            onChange={e => {
                              const newS = [...formData.servicios!];
                              newS[idx].foto_url = e.target.value;
                              setFormData({...formData, servicios: newS});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            {/* Botón Guardar Flotante */}
            <div className="fixed bottom-12 left-0 right-0 z-50 flex justify-center p-6">
              <button 
                onClick={handleSave}
                className="w-full max-w-lg bg-primary text-white font-black h-20 rounded-full shadow-2xl transition-all hover:scale-[1.05] active:scale-95 uppercase tracking-[0.3em] text-sm"
              >
                Sincronizar con EasyPatagonia
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-surface-dark p-10 md:p-16 rounded-[4rem] shadow-xl space-y-10 border border-slate-200 dark:border-white/5 max-w-4xl mx-auto text-center">
              <div className="flex flex-col items-center gap-6">
                 <img src={myBusiness!.media.logo_url} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-2xl" />
                 <div>
                    <h2 className="text-4xl font-black dark:text-white leading-tight tracking-tighter">{myBusiness!.nombre}</h2>
                    <p className="text-sm font-black text-primary uppercase tracking-[0.3em] mt-2">{myBusiness!.categoria}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-background-dark rounded-3xl border border-slate-100 dark:border-white/5">
                  <div className="text-left">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Estado Operativo</p>
                     <p className={`text-lg font-black ${myBusiness!.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                        {myBusiness!.isOpen ? 'ABIERTO' : 'CERRADO'}
                     </p>
                  </div>
                  <button 
                    onClick={() => updateBusiness({...myBusiness!, isOpen: !myBusiness!.isOpen})}
                    className={`w-16 h-10 rounded-full relative transition-all ${myBusiness!.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all shadow-md ${myBusiness!.isOpen ? 'right-1.5' : 'left-1.5'}`}></div>
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-3 bg-white dark:bg-surface-dark text-slate-500 font-black py-6 rounded-3xl border-2 border-slate-100 dark:border-white/5 hover:bg-slate-50 transition-all"
                >
                  <span className="material-symbols-outlined">edit</span>
                  EDITAR PERFIL
                </button>
              </div>
            </div>

            <div className="space-y-8 max-w-5xl mx-auto">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-4">Servicios Publicados ({myBusiness!.servicios.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBusiness!.servicios.map(s => (
                  <div key={s.id} className="bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] flex flex-col items-center text-center gap-4 border border-slate-200 dark:border-white/5 shadow-sm">
                    <img src={s.foto_url} className="w-full h-40 rounded-3xl object-cover shadow-md mb-2" />
                    <div>
                      <p className="text-lg font-black dark:text-white leading-tight">{s.nombre}</p>
                      <p className="text-sm text-primary font-black mt-1 uppercase tracking-widest">{s.precio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPortalScreen;
