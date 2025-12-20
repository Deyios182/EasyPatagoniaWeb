import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Locality, Attraction, Company, Service } from '../types';

// Importación correcta (misma carpeta)
import { uploadImage } from './imageHandler'; 

// --- MAPA ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componentes auxiliares de Mapa
const MapRecenter = () => {
    const map = useMap();
    useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [map]);
    return null;
};
const LocationMarker = ({ setPos, pos }: { setPos: (lat: number, lng: number) => void, pos: {lat: number, lng: number} | null }) => {
  useMapEvents({ click(e) { setPos(e.latlng.lat, e.latlng.lng); }, });
  return pos ? <Marker position={[pos.lat, pos.lng]} /> : null;
};

const EasyAdminFieldScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'localidades' | 'atractivos' | 'empresas'>('empresas');
  
  // DATOS
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // EDICIÓN PRINCIPAL
  const [editingLocality, setEditingLocality] = useState<Partial<Locality> | null>(null);
  const [editingAttraction, setEditingAttraction] = useState<Partial<Attraction> | null>(null);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);

  // SERVICIOS (SUB-MODAL)
  const [showServiceModal, setShowServiceModal] = useState<Company | null>(null);
  const [companyServices, setCompanyServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  
  // UTILIDADES
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);
  const [ownerEmailSearch, setOwnerEmailSearch] = useState('');
  const [ownerSearchResult, setOwnerSearchResult] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: locs } = await supabase.from('localities').select('*').order('name');
    if (locs) setLocalities(locs);

    const { data: attrs } = await supabase.from('attractions').select('*, localities(name)').order('name');
    if (attrs) setAttractions(attrs.map(a => ({...a, locality_name: a.localities?.name})));

    const { data: comps } = await supabase.from('companies').select('*, user_profiles(email)').order('name');
    if (comps) setCompanies(comps.map(c => ({...c, owner_email: c.user_profiles?.email})));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = await uploadImage(file, 'logos');
          if (url) callback(url);
      }
  };

  // --- LOGICA LOCALIDADES ---
  const saveLocality = async () => {
      if (!editingLocality?.name) return;
      const payload = { name: editingLocality.name, image_url: editingLocality.image_url, is_active: true };
      if (editingLocality.id) await supabase.from('localities').update(payload).eq('id', editingLocality.id);
      else await supabase.from('localities').insert([payload]);
      setEditingLocality(null); fetchData();
  };

  // --- LOGICA ATRACTIVOS ---
  const saveAttraction = async () => {
      if (!editingAttraction?.name || !editingAttraction.locality_id) { alert("Nombre y Localidad requeridos"); return; }
      const payload = { 
          name: editingAttraction.name, 
          description: editingAttraction.description, 
          locality_id: editingAttraction.locality_id, 
          image_url: editingAttraction.image_url 
      };
      if (editingAttraction.id) await supabase.from('attractions').update(payload).eq('id', editingAttraction.id);
      else await supabase.from('attractions').insert([payload]);
      setEditingAttraction(null); fetchData();
  };

  // --- LOGICA EMPRESAS ---
  const saveCompany = async () => {
    if (!editingCompany?.name) return;
    const payload = {
        name: editingCompany.name,
        description: editingCompany.description,
        logo_url: editingCompany.logo_url,
        owner_id: ownerSearchResult ? ownerSearchResult.clerk_user_id : editingCompany.owner_id,
        category: editingCompany.category || 'Actividad',
        address: editingCompany.address,
        whatsapp: editingCompany.whatsapp,
        latitude: editingCompany.latitude,
        longitude: editingCompany.longitude,
        gallery_urls: editingCompany.gallery_urls
    };
    if (editingCompany.id) await supabase.from('companies').update(payload).eq('id', editingCompany.id);
    else await supabase.from('companies').insert([payload]);
    setEditingCompany(null); setPreviewImage(null); fetchData();
  };

  // --- LOGICA SERVICIOS ---
  const openServiceManager = async (company: Company) => {
      setShowServiceModal(company);
      const { data } = await supabase.from('services').select('*').eq('company_id', company.id);
      setCompanyServices(data || []);
      setEditingService(null);
  };

  const saveService = async () => {
      if (!editingService?.name || !showServiceModal) return;
      const payload = {
          company_id: showServiceModal.id,
          name: editingService.name,
          price: editingService.price || 'Consultar',
          description: editingService.description,
          image_url: editingService.image_url
      };
      let res;
      if (editingService.id) res = await supabase.from('services').update(payload).eq('id', editingService.id).select();
      else res = await supabase.from('services').insert([payload]).select();
      
      if (res.data) {
          if (editingService.id) setCompanyServices(prev => prev.map(s => s.id === editingService.id ? res.data[0] : s));
          else setCompanyServices(prev => [...prev, res.data[0]]);
          setEditingService(null);
      }
  };

  const deleteService = async (id: string) => {
      if(!confirm("¿Eliminar servicio?")) return;
      await supabase.from('services').delete().eq('id', id);
      setCompanyServices(prev => prev.filter(s => s.id !== id));
  };

  // --- MAPA ---
  const openMap = () => {
      setTempCoords({ lat: editingCompany?.latitude || -46.6225, lng: editingCompany?.longitude || -72.6744 });
      setShowMapModal(true);
  };
  const confirmLocation = () => {
      if (tempCoords) setEditingCompany(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng }));
      setShowMapModal(false);
  };
  const searchOwner = async () => {
    const { data } = await supabase.from('user_profiles').select('clerk_user_id, email').eq('email', ownerEmailSearch).single();
    if (data) setOwnerSearchResult(data); else alert('Usuario no encontrado.');
 };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-body text-slate-900">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
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

      {/* --- LOCALIDADES --- */}
      {activeTab === 'localidades' && (
          <div>
            <button onClick={() => setEditingLocality({})} className="mb-4 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">+ Nueva Localidad</button>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {localities.map(loc => (
                    <div key={loc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md cursor-pointer transition-all" onClick={() => setEditingLocality(loc)}>
                        <img src={loc.image_url || 'https://via.placeholder.com/300x200'} className="w-full h-32 object-cover rounded-lg mb-3 bg-slate-100"/>
                        <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                    </div>
                ))}
            </div>
            {editingLocality && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-black mb-4">Editar Localidad</h3>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 mb-4 font-bold" value={editingLocality.name || ''} onChange={e => setEditingLocality({...editingLocality, name: e.target.value})} />
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Imagen Portada</label>
                        {editingLocality.image_url && <img src={editingLocality.image_url} className="w-full h-32 object-cover rounded-xl mb-2" />}
                        <input type="file" onChange={e => handleFileUpload(e, url => setEditingLocality({...editingLocality, image_url: url}))} className="mb-6 text-sm"/>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingLocality(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancelar</button>
                            <button onClick={saveLocality} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
          </div>
      )}

      {/* --- ATRACTIVOS --- */}
      {activeTab === 'atractivos' && (
          <div>
            <button onClick={() => setEditingAttraction({})} className="mb-4 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg">+ Nuevo Atractivo</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attractions.map(att => (
                    <div key={att.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md cursor-pointer flex gap-4" onClick={() => setEditingAttraction(att)}>
                        <img src={att.image_url || 'https://via.placeholder.com/100'} className="w-24 h-24 object-cover rounded-lg bg-slate-100"/>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{att.name}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{att.locality_name}</span>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{att.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            {editingAttraction && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-black mb-4">Editar Atractivo</h3>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Localidad</label>
                        <select className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 mb-4 font-bold" value={editingAttraction.locality_id || ''} onChange={e => setEditingAttraction({...editingAttraction, locality_id: e.target.value})}>
                            <option value="">Seleccione...</option>
                            {localities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                        <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 mb-4 font-bold" value={editingAttraction.name || ''} onChange={e => setEditingAttraction({...editingAttraction, name: e.target.value})} />
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descripción</label>
                        <textarea className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 mb-4 resize-none" rows={3} value={editingAttraction.description || ''} onChange={e => setEditingAttraction({...editingAttraction, description: e.target.value})} />
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Imagen</label>
                        {editingAttraction.image_url && <img src={editingAttraction.image_url} className="w-full h-32 object-cover rounded-xl mb-2" />}
                        <input type="file" onChange={e => handleFileUpload(e, url => setEditingAttraction({...editingAttraction, image_url: url}))} className="mb-6 text-sm"/>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingAttraction(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancelar</button>
                            <button onClick={saveAttraction} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
          </div>
      )}

      {/* --- EMPRESAS --- */}
      {activeTab === 'empresas' && (
        <div>
           <button onClick={() => setEditingCompany({category: 'Actividad', gallery_urls: []})} className="mb-4 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">+ Nueva Empresa</button>
           <div className="space-y-3">
              {companies.map(comp => (
                  <div key={comp.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center border border-transparent hover:border-slate-200 transition-all">
                     <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => { setEditingCompany(comp); setPreviewImage(comp.logo_url || null); }}>
                        <img src={comp.logo_url || 'https://via.placeholder.com/50'} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{comp.name}</h3>
                            <div className="flex gap-2 text-xs">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{comp.category}</span>
                                <span className="text-slate-400">{comp.address || 'Sin dirección'}</span>
                            </div>
                        </div>
                     </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); openServiceManager(comp); }}
                        className="mt-4 md:mt-0 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-2 shrink-0"
                     >
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        Gestionar Servicios
                     </button>
                  </div>
              ))}
           </div>

           {/* MODAL EMPRESA */}
           {editingCompany && (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative my-10">
                   <h3 className="text-2xl font-black text-slate-800 mb-6 border-b pb-4">{editingCompany.id ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <input type="text" placeholder="Nombre Fantasía" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 font-bold" value={editingCompany.name || ''} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} />
                           <select className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3" value={editingCompany.category || 'Actividad'} onChange={e => setEditingCompany({...editingCompany, category: e.target.value})}>
                               <option value="Actividad">Actividad / Tour</option>
                               <option value="Restaurante">Restaurante</option>
                               <option value="Hospedaje">Hospedaje</option>
                               <option value="Transporte">Transporte</option>
                           </select>
                           <input type="text" placeholder="WhatsApp" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3" value={editingCompany.whatsapp || ''} onChange={e => setEditingCompany({...editingCompany, whatsapp: e.target.value})} />
                           <input type="text" placeholder="Dirección" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3" value={editingCompany.address || ''} onChange={e => setEditingCompany({...editingCompany, address: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Logo</label>
                               <div className="flex items-center gap-4">
                                   <img src={previewImage || editingCompany.logo_url || 'https://via.placeholder.com/100'} className="w-20 h-20 object-contain border rounded-xl" />
                                   <input type="file" onChange={e => handleFileUpload(e, url => { setPreviewImage(url); setEditingCompany({...editingCompany, logo_url: url}); })} className="text-xs" />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Galería</label>
                               <div className="flex gap-2 flex-wrap mb-2">
                                   {editingCompany.gallery_urls?.map((url, i) => (
                                       <div key={i} className="relative group w-12 h-12">
                                            <img src={url} className="w-full h-full object-cover rounded-md border" />
                                            <button onClick={() => setEditingCompany(prev => ({...prev, gallery_urls: prev?.gallery_urls?.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 text-[10px]">✕</button>
                                       </div>
                                   ))}
                               </div>
                               <input type="file" onChange={e => handleFileUpload(e, url => setEditingCompany(prev => ({...prev, gallery_urls: [...(prev?.gallery_urls || []), url]})))} className="text-xs" />
                           </div>
                           <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                              <label className="text-xs font-bold text-orange-700 uppercase block mb-1">Asignar Dueño (Email)</label>
                              <div className="flex gap-2">
                                 <input type="text" className="flex-1 border border-orange-200 p-1.5 rounded-lg text-sm text-slate-900" value={ownerEmailSearch} onChange={e => setOwnerEmailSearch(e.target.value)} />
                                 <button onClick={searchOwner} className="bg-orange-600 text-white px-2 rounded-lg font-bold text-xs">Buscar</button>
                              </div>
                              {ownerSearchResult && <p className="text-[10px] text-green-600 mt-1 font-bold">✓ {ownerSearchResult.email}</p>}
                           </div>
                       </div>
                   </div>
                   <textarea placeholder="Descripción..." className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 resize-none mt-4" rows={2} value={editingCompany.description || ''} onChange={e => setEditingCompany({...editingCompany, description: e.target.value})} />
                   <div className="mt-4 p-4 border rounded-2xl bg-slate-50 flex items-center justify-between">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block">Ubicación</label>
                           {editingCompany.latitude ? <p className="text-sm font-bold text-slate-700">{editingCompany.latitude.toFixed(4)}, {editingCompany.longitude?.toFixed(4)}</p> : <p className="text-sm text-red-400 font-bold">No definida</p>}
                       </div>
                       <button onClick={openMap} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs">Seleccionar Mapa</button>
                   </div>
                   <div className="flex gap-4 mt-6 pt-4 border-t">
                      <button onClick={() => { setEditingCompany(null); setPreviewImage(null); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold">Cancelar</button>
                      <button onClick={saveCompany} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Guardar</button>
                   </div>
                </div>
             </div>
           )}

           {/* MODAL MAPA */}
           {showMapModal && (
               <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                   <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col h-[80vh]">
                       <div className="flex-1 relative bg-slate-200">
                           <MapContainer center={[tempCoords?.lat || -46.6, tempCoords?.lng || -72.6]} zoom={12} style={{ height: '100%', width: '100%' }}>
                               <MapRecenter />
                               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                               <LocationMarker pos={tempCoords} setPos={(lat, lng) => setTempCoords({lat, lng})} />
                           </MapContainer>
                       </div>
                       <div className="p-4 bg-white border-t flex justify-end gap-4">
                           <button onClick={() => setShowMapModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 bg-slate-100">Cancelar</button>
                           <button onClick={confirmLocation} className="px-6 py-2 rounded-xl font-bold bg-primary text-white">Confirmar</button>
                       </div>
                   </div>
               </div>
           )}

           {/* MODAL SERVICIOS */}
           {showServiceModal && (
             <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-3xl w-full max-w-3xl shadow-2xl h-[90vh] flex flex-col">
                   <div className="flex justify-between items-center mb-6 shrink-0">
                       <div>
                           <h3 className="text-xl font-black text-slate-800">Servicios de {showServiceModal.name}</h3>
                           <p className="text-xs text-slate-500">Administra los productos que ofrece esta empresa.</p>
                       </div>
                       <button onClick={() => setShowServiceModal(null)} className="text-slate-400 font-bold hover:text-red-500">CERRAR</button>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                       {companyServices.map(srv => (
                           <div key={srv.id} className="border p-3 rounded-xl flex gap-3 items-center bg-slate-50">
                               <img src={srv.image_url || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-lg object-cover bg-white" />
                               <div className="flex-1">
                                   <h4 className="font-bold text-slate-800">{srv.name}</h4>
                                   <p className="text-xs text-primary font-bold">{srv.price}</p>
                                   <p className="text-[10px] text-slate-500 line-clamp-1">{srv.description}</p>
                               </div>
                               <button onClick={() => setEditingService(srv)} className="bg-blue-100 text-blue-600 p-2 rounded-lg"><span className="material-symbols-outlined text-sm">edit</span></button>
                               <button onClick={() => deleteService(srv.id)} className="bg-red-100 text-red-600 p-2 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                           </div>
                       ))}
                       {companyServices.length === 0 && <p className="text-center text-slate-400 py-10">No hay servicios registrados.</p>}
                   </div>
                   <div className="shrink-0 mt-4 pt-4 border-t bg-slate-50 p-4 rounded-xl">
                       <h4 className="font-bold text-sm text-slate-700 mb-3">{editingService?.id ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                           <input type="text" placeholder="Nombre (ej. Tour Mármol)" className="bg-white border p-2 rounded-lg text-sm text-slate-900 font-bold" value={editingService?.name || ''} onChange={e => setEditingService(prev => ({...prev, name: e.target.value}))} />
                           <input type="text" placeholder="Precio (ej. CLP 20.000)" className="bg-white border p-2 rounded-lg text-sm text-slate-900 font-bold" value={editingService?.price || ''} onChange={e => setEditingService(prev => ({...prev, price: e.target.value}))} />
                       </div>
                       <textarea placeholder="Descripción..." className="w-full bg-white border p-2 rounded-lg text-sm mb-3 resize-none text-slate-900" rows={2} value={editingService?.description || ''} onChange={e => setEditingService(prev => ({...prev, description: e.target.value}))}></textarea>
                       <div className="flex items-center gap-3">
                           <input type="file" className="text-xs flex-1" onChange={e => handleFileUpload(e, url => setEditingService(prev => ({...prev, image_url: url})))} />
                           {editingService?.id && <button onClick={() => setEditingService(null)} className="bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600">Cancelar</button>}
                           <button onClick={saveService} className="bg-green-600 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-md">{editingService?.id ? 'Actualizar' : 'Agregar'}</button>
                       </div>
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
