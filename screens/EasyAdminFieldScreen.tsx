import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Locality, Attraction, Company } from '../types';
import { uploadImage } from '../utils/imageHandler';

const EasyAdminFieldScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'localidades' | 'atractivos' | 'empresas'>('localidades');
  
  // Datos
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Formularios
  const [editingLocality, setEditingLocality] = useState<Partial<Locality> | null>(null);
  const [editingAttraction, setEditingAttraction] = useState<Partial<Attraction> | null>(null);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  
  // Asignación de dueño
  const [ownerEmailSearch, setOwnerEmailSearch] = useState('');
  const [ownerSearchResult, setOwnerSearchResult] = useState<any>(null);

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: locs } = await supabase.from('localities').select('*');
    if (locs) setLocalities(locs);

    const { data: attrs } = await supabase.from('attractions').select('*, localities(name)');
    if (attrs) setAttractions(attrs.map(a => ({...a, locality_name: a.localities?.name})));

    const { data: comps } = await supabase.from('companies').select('*, user_profiles(email)');
    if (comps) setCompanies(comps.map(c => ({...c, owner_email: c.user_profiles?.email})));
  };

  // --- LOGICA LOCALIDADES ---
  const saveLocality = async () => {
    if (!editingLocality?.name) return;
    const payload = { name: editingLocality.name, image_url: editingLocality.image_url, is_active: true };
    
    if (editingLocality.id) {
        await supabase.from('localities').update(payload).eq('id', editingLocality.id);
    } else {
        await supabase.from('localities').insert([payload]);
    }
    setEditingLocality(null);
    fetchData();
  };

  // --- LOGICA ATRACTIVOS ---
  const saveAttraction = async () => {
    if (!editingAttraction?.name || !editingAttraction.locality_id) return;
    const payload = { 
        name: editingAttraction.name, 
        locality_id: editingAttraction.locality_id, 
        description: editingAttraction.description, 
        image_url: editingAttraction.image_url 
    };

    if (editingAttraction.id) {
        await supabase.from('attractions').update(payload).eq('id', editingAttraction.id);
    } else {
        await supabase.from('attractions').insert([payload]);
    }
    setEditingAttraction(null);
    fetchData();
  };

  // --- LOGICA EMPRESAS ---
  const searchOwner = async () => {
     const { data } = await supabase.from('user_profiles').select('clerk_user_id, email').eq('email', ownerEmailSearch).single();
     if (data) setOwnerSearchResult(data);
     else alert('Usuario no encontrado. Asegúrate de que se haya registrado primero.');
  };

  const saveCompany = async () => {
    if (!editingCompany?.name) return;
    const payload = {
        name: editingCompany.name,
        description: editingCompany.description,
        logo_url: editingCompany.logo_url,
        // Si encontramos un dueño, lo asignamos. Si no, queda null (sin dueño aún)
        owner_id: ownerSearchResult ? ownerSearchResult.clerk_user_id : editingCompany.owner_id
    };

    if (editingCompany.id) {
        await supabase.from('companies').update(payload).eq('id', editingCompany.id);
    } else {
        await supabase.from('companies').insert([payload]);
    }
    setEditingCompany(null);
    setOwnerSearchResult(null);
    setOwnerEmailSearch('');
    fetchData();
  };

  // --- UPLOAD GENÉRICO ---
  const handleUpload = async (e: any, setter: any) => {
     const file = e.target.files[0];
     if (file) {
        const url = await uploadImage(file, 'places');
        if (url) setter((prev: any) => ({ ...prev, image_url: url, logo_url: url }));
     }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
         <div>
            <h1 className="text-3xl font-black text-slate-800">Panel de Campo</h1>
            <p className="text-slate-500">Gestión operativa de Aysén.</p>
         </div>
         <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button onClick={() => setActiveTab('localidades')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'localidades' ? 'bg-primary text-white' : 'text-slate-500'}`}>Localidades</button>
            <button onClick={() => setActiveTab('atractivos')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'atractivos' ? 'bg-primary text-white' : 'text-slate-500'}`}>Atractivos</button>
            <button onClick={() => setActiveTab('empresas')} className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'empresas' ? 'bg-primary text-white' : 'text-slate-500'}`}>Empresas</button>
         </div>
      </div>

      {/* --- TAB LOCALIDADES --- */}
      {activeTab === 'localidades' && (
        <div>
           <button onClick={() => setEditingLocality({})} className="mb-4 bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg">+ Nueva Localidad</button>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {localities.map(loc => (
                  <div key={loc.id} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md" onClick={() => setEditingLocality(loc)}>
                     <img src={loc.image_url || 'https://via.placeholder.com/150'} className="w-full h-32 object-cover rounded-lg mb-3" />
                     <h3 className="font-bold text-lg">{loc.name}</h3>
                  </div>
              ))}
           </div>
           {/* MODAL LOCALIDAD */}
           {editingLocality && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-96">
                   <h3 className="text-xl font-bold mb-4">Localidad</h3>
                   <input type="text" placeholder="Nombre" className="w-full border p-2 rounded mb-2" value={editingLocality.name || ''} onChange={e => setEditingLocality({...editingLocality, name: e.target.value})} />
                   <input type="file" onChange={e => handleUpload(e, setEditingLocality)} className="mb-4 text-xs"/>
                   <div className="flex gap-2">
                      <button onClick={saveLocality} className="flex-1 bg-primary text-white py-2 rounded font-bold">Guardar</button>
                      <button onClick={() => setEditingLocality(null)} className="flex-1 bg-slate-200 py-2 rounded font-bold">Cancelar</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- TAB ATRACTIVOS --- */}
      {activeTab === 'atractivos' && (
        <div>
           <button onClick={() => setEditingAttraction({})} className="mb-4 bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg">+ Nuevo Atractivo</button>
           <div className="space-y-3">
              {attractions.map(att => (
                  <div key={att.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:bg-slate-50" onClick={() => setEditingAttraction(att)}>
                     <img src={att.image_url || 'https://via.placeholder.com/50'} className="w-16 h-16 rounded-lg object-cover" />
                     <div>
                        <h3 className="font-bold">{att.name}</h3>
                        <p className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">{att.locality_name}</p>
                     </div>
                  </div>
              ))}
           </div>
           {/* MODAL ATRACTIVO */}
           {editingAttraction && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-96 max-h-[90vh] overflow-y-auto">
                   <h3 className="text-xl font-bold mb-4">Atractivo Turístico</h3>
                   <select className="w-full border p-2 rounded mb-2" value={editingAttraction.locality_id || ''} onChange={e => setEditingAttraction({...editingAttraction, locality_id: e.target.value})}>
                      <option value="">Selecciona Localidad</option>
                      {localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                   </select>
                   <input type="text" placeholder="Nombre (ej. Capillas de Mármol)" className="w-full border p-2 rounded mb-2" value={editingAttraction.name || ''} onChange={e => setEditingAttraction({...editingAttraction, name: e.target.value})} />
                   <textarea placeholder="Descripción..." className="w-full border p-2 rounded mb-2" rows={3} value={editingAttraction.description || ''} onChange={e => setEditingAttraction({...editingAttraction, description: e.target.value})} />
                   <input type="file" onChange={e => handleUpload(e, setEditingAttraction)} className="mb-4 text-xs"/>
                   <div className="flex gap-2">
                      <button onClick={saveAttraction} className="flex-1 bg-primary text-white py-2 rounded font-bold">Guardar</button>
                      <button onClick={() => setEditingAttraction(null)} className="flex-1 bg-slate-200 py-2 rounded font-bold">Cancelar</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- TAB EMPRESAS --- */}
      {activeTab === 'empresas' && (
        <div>
           <button onClick={() => setEditingCompany({})} className="mb-4 bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg">+ Nueva Empresa</button>
           <div className="space-y-3">
              {companies.map(comp => (
                  <div key={comp.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => setEditingCompany(comp)}>
                     <div className="flex items-center gap-4">
                        <img src={comp.logo_url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full object-cover border" />
                        <div>
                            <h3 className="font-bold">{comp.name}</h3>
                            <p className="text-xs text-slate-400 truncate w-64">{comp.description}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${comp.owner_email ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {comp.owner_email ? comp.owner_email : 'Sin Dueño'}
                        </span>
                     </div>
                  </div>
              ))}
           </div>
           {/* MODAL EMPRESA */}
           {editingCompany && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
                   <h3 className="text-xl font-bold mb-4">Datos Empresa</h3>
                   
                   <input type="text" placeholder="Nombre Fantasía" className="w-full border p-2 rounded mb-2" value={editingCompany.name || ''} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} />
                   <textarea placeholder="Descripción..." className="w-full border p-2 rounded mb-2" rows={2} value={editingCompany.description || ''} onChange={e => setEditingCompany({...editingCompany, description: e.target.value})} />
                   
                   <div className="bg-slate-100 p-4 rounded-xl mb-4">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Asignar Dueño (Email)</label>
                      <div className="flex gap-2">
                         <input type="text" placeholder="ejemplo@gmail.com" className="flex-1 border p-2 rounded" value={ownerEmailSearch} onChange={e => setOwnerEmailSearch(e.target.value)} />
                         <button onClick={searchOwner} className="bg-slate-800 text-white px-3 rounded font-bold text-xs">Buscar</button>
                      </div>
                      {ownerSearchResult && <p className="text-xs text-green-600 mt-1 font-bold">✓ Usuario encontrado: {ownerSearchResult.email}</p>}
                      {editingCompany.owner_id && !ownerSearchResult && <p className="text-xs text-slate-400 mt-1">Dueño actual asignado (ID: ...{editingCompany.owner_id.slice(-4)})</p>}
                   </div>

                   <label className="text-xs font-bold mb-1 block">Logo Empresa</label>
                   <input type="file" onChange={e => handleUpload(e, (cb:any) => {
                       // Adaptador simple porque la funcion handleUpload setea 'image_url' pero la empresa usa 'logo_url'
                       const reader = new FileReader();
                       reader.onload = async () => {
                          const file = e.target.files[0];
                          const url = await uploadImage(file, 'logos');
                          if(url) setEditingCompany(prev => ({...prev, logo_url: url}));
                       };
                       reader.readAsDataURL(e.target.files[0]);
                   })} className="mb-4 text-xs"/>

                   <div className="flex gap-2 mt-4">
                      <button onClick={saveCompany} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Guardar Empresa</button>
                      <button onClick={() => {setEditingCompany(null); setOwnerSearchResult(null);}} className="flex-1 bg-slate-200 py-3 rounded-xl font-bold">Cancelar</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default EasyAdminFieldScreen;
