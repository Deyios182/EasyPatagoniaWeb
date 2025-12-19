import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Locality, Attraction, Company } from '../types';

// --- CORRECCIÓN AQUÍ ---
// Como tu archivo está en la carpeta 'screens', usamos './'
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

const MapRecenter = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => { map.invalidateSize(); }, 100);
    }, [map]);
    return null;
};

const LocationMarker = ({ setPos, pos }: { setPos: (lat: number, lng: number) => void, pos: {lat: number, lng: number} | null }) => {
  useMapEvents({
    click(e) { setPos(e.latlng.lat, e.latlng.lng); },
  });
  return pos ? <Marker position={[pos.lat, pos.lng]} /> : null;
};

const EasyAdminFieldScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'localidades' | 'atractivos' | 'empresas'>('empresas');
  
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [editingLocality, setEditingLocality] = useState<Partial<Locality> | null>(null);
  const [editingAttraction, setEditingAttraction] = useState<Partial<Attraction> | null>(null);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);

  const [ownerEmailSearch, setOwnerEmailSearch] = useState('');
  const [ownerSearchResult, setOwnerSearchResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: locs } = await supabase.from('localities').select('*');
    if (locs) setLocalities(locs);
    const { data: attrs } = await supabase.from('attractions').select('*, localities(name)');
    if (attrs) setAttractions(attrs.map(a => ({...a, locality_name: a.localities?.name})));
    const { data: comps } = await supabase.from('companies').select('*, user_profiles(email)');
    if (comps) setCompanies(comps.map(c => ({...c, owner_email: c.user_profiles?.email})));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const processFile = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
    const url = await uploadImage(file, 'logos');
    if (url) setEditingCompany(prev => ({ ...prev, logo_url: url }));
  };

  const openMap = () => {
      const lat = editingCompany?.latitude || -46.6225;
      const lng = editingCompany?.longitude || -72.6744;
      setTempCoords({ lat, lng });
      setShowMapModal(true);
  };

  const confirmLocation = () => {
      if (tempCoords) {
          setEditingCompany(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng }));
      }
      setShowMapModal(false);
  };

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
        longitude: editingCompany.longitude
    };

    if (editingCompany.id) await supabase.from('companies').update(payload).eq('id', editingCompany.id);
    else await supabase.from('companies').insert([payload]);
    
    closeModal();
    fetchData();
  };

  const closeModal = () => {
      setEditingCompany(null); setOwnerSearchResult(null); setOwnerEmailSearch(''); setPreviewImage(null);
  };

  const saveLocality = async () => {}; 
  const saveAttraction = async () => {}; 
  const searchOwner = async () => {
    const { data } = await supabase.from('user_profiles').select('clerk_user_id, email').eq('email', ownerEmailSearch).single();
    if (data) setOwnerSearchResult(data);
    else alert('Usuario no encontrado.');
 };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-body">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-800">Panel de Campo</h1>
            <p className="text-slate-500">Gestión operativa de Aysén.</p>
         </div>
         <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button onClick={() => setActiveTab('localidades')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'localidades' ? 'bg-primary text-white' : 'text-slate-500'}`}>Localidades</button>
            <button onClick={() => setActiveTab('atractivos')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'atractivos' ? 'bg-primary text-white' : 'text-slate-500'}`}>Atractivos</button>
            <button onClick={() => setActiveTab('empresas')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'empresas' ? 'bg-primary text-white' : 'text-slate-500'}`}>Empresas</button>
         </div>
      </div>

      {activeTab === 'empresas' && (
        <div>
           <button onClick={() => setEditingCompany({category: 'Actividad'})} className="mb-4 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">+ Nueva Empresa</button>
           <div className="space-y-3">
              {companies.map(comp => (
                  <div key={comp.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all" onClick={() => { setEditingCompany(comp); setPreviewImage(comp.logo_url || null); }}>
                     <div className="flex items-center gap-4 w-full">
                        <img src={comp.logo_url || 'https://via.placeholder.com/50'} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{comp.name}</h3>
                            <div className="flex gap-2 text-xs">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{comp.category}</span>
                                <span className="text-slate-400">{comp.address || 'Sin dirección'}</span>
                            </div>
                        </div>
                     </div>
                  </div>
              ))}
           </div>

           {editingCompany && (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative my-10">
                   <h3 className="text-2xl font-black text-slate-800 mb-6 border-b pb-4">{editingCompany.id ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre Fantasía</label>
                               <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="Ej: Turismo Aysén" value={editingCompany.name || ''} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoría</label>
                               <select className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 outline-none" value={editingCompany.category || 'Actividad'} onChange={e => setEditingCompany({...editingCompany, category: e.target.value})}>
                                   <option value="Actividad">Actividad / Tour</option>
                                   <option value="Restaurante">Restaurante / Gastronomía</option>
                                   <option value="Hospedaje">Hospedaje / Hotel</option>
                                   <option value="Transporte">Transporte</option>
                               </select>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">WhatsApp</label>
                               <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 outline-none" placeholder="+569..." value={editingCompany.whatsapp || ''} onChange={e => setEditingCompany({...editingCompany, whatsapp: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dirección</label>
                               <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 outline-none" placeholder="Calle Principal 123" value={editingCompany.address || ''} onChange={e => setEditingCompany({...editingCompany, address: e.target.value})} />
                           </div>
                       </div>
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Logo</label>
                               <div className={`relative h-40 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${dragActive ? 'border-primary bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                                   {previewImage ? <img src={previewImage} className="h-full w-full object-contain rounded-xl p-2" /> : <div className="text-center text-slate-400 p-4"><span className="material-symbols-outlined text-3xl block mb-2">cloud_upload</span><p className="text-xs font-bold">Arrastrar o Clic</p></div>}
                                   <input ref={fileInputRef} type="file" className="hidden" onChange={handleChangeFile} accept="image/*" />
                               </div>
                           </div>
                           <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                              <label className="text-xs font-bold text-orange-700 uppercase block mb-1">Dueño (Email)</label>
                              <div className="flex gap-2">
                                 <input type="text" placeholder="usuario@gmail.com" className="flex-1 border border-orange-200 p-2 rounded-lg text-sm text-slate-900" value={ownerEmailSearch} onChange={e => setOwnerEmailSearch(e.target.value)} />
                                 <button onClick={searchOwner} className="bg-orange-600 text-white px-3 rounded-lg font-bold text-xs hover:bg-orange-700">Buscar</button>
                              </div>
                              {ownerSearchResult && <p className="text-xs text-green-600 mt-2 font-bold">✓ Encontrado: {ownerSearchResult.email}</p>}
                           </div>
                       </div>
                   </div>

                   <div className="mt-4">
                       <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descripción</label>
                       <textarea className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 outline-none resize-none" rows={3} value={editingCompany.description || ''} onChange={e => setEditingCompany({...editingCompany, description: e.target.value})} />
                   </div>

                   <div className="mt-6 p-4 border rounded-2xl bg-slate-50 flex items-center justify-between">
                       <div>
                           <label className="text-xs font-bold text-slate-500 uppercase block">Ubicación GPS</label>
                           {editingCompany.latitude ? <p className="text-sm font-bold text-slate-700">{editingCompany.latitude.toFixed(4)}, {editingCompany.longitude?.toFixed(4)}</p> : <p className="text-sm text-red-400 font-bold">No definida</p>}
                       </div>
                       <button onClick={openMap} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors"><span className="material-symbols-outlined text-sm">map</span> Seleccionar en Mapa</button>
                   </div>

                   <div className="flex gap-4 mt-8 pt-4 border-t">
                      <button onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                      <button onClick={saveCompany} className="flex-1 py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/30">{editingCompany.id ? 'Guardar Cambios' : 'Crear Empresa'}</button>
                   </div>
                </div>
             </div>
           )}

           {showMapModal && (
               <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                   <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[80vh]">
                       <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
                           <h3 className="font-bold">Selecciona la ubicación exacta</h3>
                           <button onClick={() => setShowMapModal(false)} className="hover:text-red-400 font-bold">CERRAR</button>
                       </div>
                       <div className="flex-1 relative bg-slate-200 w-full h-full">
                           <MapContainer center={[tempCoords?.lat || -46.6, tempCoords?.lng || -72.6]} zoom={12} style={{ height: '100%', width: '100%' }}>
                               <MapRecenter />
                               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                               <LocationMarker pos={tempCoords} setPos={(lat, lng) => setTempCoords({lat, lng})} />
                           </MapContainer>
                           <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-xs font-bold text-slate-700 pointer-events-none">Haz clic en el mapa para poner el marcador</div>
                       </div>
                       <div className="p-4 bg-white border-t flex justify-end gap-4 shrink-0">
                           <div className="mr-auto text-xs text-slate-500 content-center">{tempCoords && `Seleccionado: ${tempCoords.lat.toFixed(5)}, ${tempCoords.lng.toFixed(5)}`}</div>
                           <button onClick={() => setShowMapModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
                           <button onClick={confirmLocation} className="px-8 py-3 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-primary-dark">Confirmar Ubicación</button>
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
