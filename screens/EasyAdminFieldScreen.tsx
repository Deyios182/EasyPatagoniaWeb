import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Locality, Attraction, Company, Service, Category } from '../types'; // Importamos Category
import { uploadImage } from './imageHandler';

// --- MAPA ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENTES UI ---

const ImageUploader = ({ label, currentImage, onUpload, isSmall = false }: { label: string, currentImage?: string | null, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, isSmall?: boolean }) => {
    return (
        <div className="w-full">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">{label}</label>
            <div className="flex gap-4 items-start">
                {currentImage && (
                    <div className={`relative shrink-0 border border-white/10 rounded-xl overflow-hidden bg-white/5 ${isSmall ? 'w-16 h-16' : 'w-24 h-24'}`}>
                        <img src={currentImage} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                )}
                <label className="cursor-pointer flex-1 border-2 border-dashed border-white/20 hover:border-primary hover:bg-primary/10 transition-all rounded-xl h-full min-h-[60px] flex flex-col items-center justify-center text-slate-500 p-2 group">
                    <span className="material-symbols-outlined group-hover:text-primary mb-1">cloud_upload</span>
                    <span className="text-[10px] font-bold group-hover:text-primary text-center leading-tight">Click para subir foto</span>
                    <input type="file" className="hidden" onChange={onUpload} accept="image/*" />
                </label>
            </div>
        </div>
    );
};

// Mapa
const MapRecenter = () => {
    const map = useMap();
    useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 200); }, [map]);
    return null;
};
const LocationMarker = ({ setPos, pos }: { setPos: (lat: number, lng: number) => void, pos: { lat: number, lng: number } | null }) => {
    useMapEvents({ click(e) { setPos(e.latlng.lat, e.latlng.lng); }, });
    return pos ? <Marker position={[pos.lat, pos.lng]} /> : null;
};

const EasyAdminFieldScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'localidades' | 'atractivos' | 'empresas'>('empresas');

    // DATOS
    const [localities, setLocalities] = useState<Locality[]>([]);
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    // EDICIÓN
    const [editingLocality, setEditingLocality] = useState<Partial<Locality> | null>(null);
    const [editingAttraction, setEditingAttraction] = useState<Partial<Attraction> | null>(null);
    const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);

    // SERVICIOS
    const [showServiceModal, setShowServiceModal] = useState<Company | null>(null);
    const [companyServices, setCompanyServices] = useState<Service[]>([]);
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

    // UTILIDADES
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempCoords, setTempCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [mapTarget, setMapTarget] = useState<'locality' | 'attraction' | 'company' | null>(null); // New state to know what we are editing
    const [ownerEmailSearch, setOwnerEmailSearch] = useState('');
    const [ownerSearchResult, setOwnerSearchResult] = useState<any>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        // 1. Cargar Localidades
        const { data: locs } = await supabase.from('localities').select('*').order('name');
        if (locs) setLocalities(locs);

        // 2. Cargar Atractivos (Tabla directa)
        const { data: attrs } = await supabase.from('attractions').select('*').order('name');
        if (attrs) {
            // Mapeamos para inyectar el nombre de la localidad (ya que types.ts no lo tiene, lo manejamos localmente o extendemos el tipo)
            // @ts-ignore
            const mappedAttrs = attrs.map(a => ({
                ...a,
                locality_name: locs?.find(l => l.id === a.locality_id)?.name || 'Sin Localidad'
            }));
            setAttractions(mappedAttrs);
        }

        // 3. Cargar Empresas
        const { data: comps } = await supabase.from('companies').select('*').order('name');
        if (comps) {
            setCompanies(comps.map(c => ({ ...c, owner_email: '' })));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await uploadImage(file, 'uploads');
            if (url) callback(url);
        }
    };

    // --- LOCALIDADES ---
    const saveLocality = async () => {
        if (!editingLocality?.name) return;

        // Generar UUID para nueva localidad
        const localityId = editingLocality.id || crypto.randomUUID();

        const payload = {
            id: localityId,
            name: editingLocality.name,
            image_url: editingLocality.image_url,
            is_active: true,
            latitude: editingLocality.latitude || null,
            longitude: editingLocality.longitude || null
        };

        console.log('💾 [LOCALITY] ID de localidad:', localityId);
        console.log('💾 [LOCALITY] Guardando localidad...', payload);
        console.log('💾 [LOCALITY] URL de imagen:', editingLocality.image_url);

        let result;
        if (editingLocality.id) {
            console.log('💾 [LOCALITY] Ejecutando UPDATE para ID:', editingLocality.id);
            result = await supabase.from('localities').update(payload).eq('id', editingLocality.id).select();
        } else {
            console.log('💾 [LOCALITY] Ejecutando INSERT (nueva localidad)');
            result = await supabase.from('localities').insert([payload]).select();
        }

        console.log('💾 [LOCALITY] Resultado completo:', result);

        if (result.error) {
            console.error('❌ [LOCALITY] Error al guardar:', result.error);
            alert(`Error al guardar localidad: ${result.error.message}`);
        } else if (result.data && result.data.length === 0) {
            console.warn('⚠️ [LOCALITY] UPDATE no afectó ninguna fila. Posible problema de RLS o ID inválido.');
            alert('⚠️ No se pudo actualizar. Verifica permisos de base de datos (RLS).');
        } else {
            console.log('✅ [LOCALITY] Guardado exitosamente:', result.data);
        }

        setEditingLocality(null);
        fetchData();
    };

    // --- ATRACTIVOS ---
    const saveAttraction = async () => {
        if (!editingAttraction?.name || !editingAttraction.locality_id) { alert("Nombre y Localidad requeridos"); return; }

        // Generar UUID para nuevo atractivo
        const attractionId = editingAttraction.id || crypto.randomUUID();

        const payload = {
            id: attractionId,
            name: editingAttraction.name,
            short_description: editingAttraction.short_description,
            locality_id: editingAttraction.locality_id,
            main_image_url: editingAttraction.main_image_url,
            latitude: editingAttraction.latitude || null,
            longitude: editingAttraction.longitude || null
        };

        console.log('💾 [ATTRACTION] ID de atractivo:', attractionId);
        console.log('💾 [ATTRACTION] Guardando atractivo...', payload);
        console.log('💾 [ATTRACTION] URL de imagen:', editingAttraction.main_image_url);

        let result;
        if (editingAttraction.id) {
            result = await supabase.from('attractions').update(payload).eq('id', editingAttraction.id).select();
        } else {
            result = await supabase.from('attractions').insert([payload]).select();
        }

        console.log('💾 [ATTRACTION] Resultado:', result);

        if (result.error) {
            console.error('❌ [ATTRACTION] Error al guardar:', result.error);
            alert(`Error al guardar atractivo: ${result.error.message}`);
        } else {
            console.log('✅ [ATTRACTION] Guardado exitosamente:', result.data);
        }

        setEditingAttraction(null);
        fetchData();
    };

    // --- EMPRESAS ---
    // Reemplaza tu función saveCompany por esta:

    const saveCompany = async () => {
        if (!editingCompany?.name) {
            alert("El nombre es obligatorio");
            return;
        }

        // Lógica de Dueño: Priorizamos la búsqueda manual de email, 
        // luego el dueño que ya tenía, y si no null.
        const finalOwnerId = ownerSearchResult
            ? ownerSearchResult.clerk_user_id
            : (editingCompany.owner_id && editingCompany.owner_id !== "" ? editingCompany.owner_id : null);

        const payload = {
            name: editingCompany.name,
            description: editingCompany.description || null,
            logo_url: editingCompany.logo_url || null,
            category: (editingCompany.category || 'Actividad') as Category,
            address: editingCompany.address || null,
            whatsapp: editingCompany.whatsapp || null,
            latitude: editingCompany.latitude || 0,
            longitude: editingCompany.longitude || 0,
            gallery_urls: editingCompany.gallery_urls || [],
            // Convertimos "" en null para evitar error 400 en base de datos
            locality_id: editingCompany.locality_id && editingCompany.locality_id !== ""
                ? editingCompany.locality_id
                : null,
            owner_id: finalOwnerId
        };

        console.log("Intentando guardar Dueño ID:", finalOwnerId);

        try {
            let result;
            if (editingCompany.id) {
                result = await supabase
                    .from('companies')
                    .update(payload)
                    .eq('id', editingCompany.id)
                    .select();
            } else {
                result = await supabase
                    .from('companies')
                    .insert([payload])
                    .select();
            }

            if (result.error) {
                console.error("Error de Supabase:", result.error);
                alert(`Error al guardar: ${result.error.message}`);
            } else {
                alert("✅ Empresa y Dueño guardados exitosamente.");
                console.log("Empresa actualizada:", result.data);
                setEditingCompany(null);
                setOwnerSearchResult(null);
                setOwnerEmailSearch('');
                fetchData();
            }
        } catch (err) {
            console.error("Error inesperado:", err);
            alert("Ocurrió un error crítico al intentar guardar.");
        }
    };

    // --- SERVICIOS ---
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
            image_url: editingService.image_url,
            attraction_id: editingService.attraction_id
        };

        console.log('💾 [SERVICE] ID del servicio:', editingService.id);
        console.log('💾 [SERVICE] Guardando servicio...', payload);
        console.log('💾 [SERVICE] URL de imagen:', editingService.image_url);

        let res;
        if (editingService.id) {
            console.log('💾 [SERVICE] Ejecutando UPDATE para ID:', editingService.id);
            res = await supabase.from('services').update(payload).eq('id', editingService.id).select();
        } else {
            console.log('💾 [SERVICE] Ejecutando INSERT (nuevo servicio)');
            res = await supabase.from('services').insert([payload]).select();
        }

        console.log('💾 [SERVICE] Resultado:', res);

        if (res.error) {
            console.error('❌ [SERVICE] Error al guardar:', res.error);
            alert(`Error al guardar servicio: ${res.error.message}`);
        } else if (res.data && res.data.length === 0) {
            console.warn('⚠️ [SERVICE] UPDATE no afectó ninguna fila. Posible problema de RLS.');
            alert('⚠️ No se pudo actualizar el servicio. Verifica permisos de base de datos.');
        } else if (res.data) {
            console.log('✅ [SERVICE] Guardado exitosamente:', res.data);
            if (editingService.id) setCompanyServices(prev => prev.map(s => s.id === editingService.id ? res.data[0] : s));
            else setCompanyServices(prev => [...prev, res.data[0]]);
            setEditingService(null);
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm("¿Eliminar servicio?")) return;
        await supabase.from('services').delete().eq('id', id);
        setCompanyServices(prev => prev.filter(s => s.id !== id));
    };

    // --- MAPA ---
    // Universal openMap
    const openMap = (target: 'locality' | 'attraction' | 'company') => {
        setMapTarget(target);
        if (target === 'locality' && editingLocality) {
            setTempCoords({ lat: editingLocality.latitude || -46.6225, lng: editingLocality.longitude || -72.6744 });
        } else if (target === 'attraction' && editingAttraction) {
            setTempCoords({ lat: editingAttraction.latitude || -46.6225, lng: editingAttraction.longitude || -72.6744 });
        } else if (target === 'company' && editingCompany) {
            setTempCoords({ lat: editingCompany.latitude || -46.6225, lng: editingCompany.longitude || -72.6744 });
        }
        setShowMapModal(true);
    };

    const confirmLocation = () => {
        if (!tempCoords) return;

        if (mapTarget === 'locality') {
            setEditingLocality(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng }));
        } else if (mapTarget === 'attraction') {
            setEditingAttraction(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng }));
        } else if (mapTarget === 'company') {
            setEditingCompany(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng }));
        }
        setShowMapModal(false);
        setMapTarget(null);
    };
    const searchOwner = async () => {
        // 2024-12-28: MIGRATED TO search in 'profiles' table directly
        console.log('🔍 [OWNER] Buscando usuario por email:', ownerEmailSearch);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .eq('email', ownerEmailSearch)
            .single();

        if (profileError || !profileData) {
            console.error('❌ [OWNER] Usuario no encontrado:', profileError);
            alert('Usuario no encontrado. Asegúrate de que el usuario haya iniciado sesión al menos una vez.');
            return;
        }

        console.log('✅ [OWNER] Usuario encontrado:', profileData);

        // Éxito: Guardamos ID del profile (que es el mismo ID de auth.users)
        setOwnerSearchResult({
            clerk_user_id: profileData.id, // Este ID se usará como owner_id en companies
            email: profileData.email,
            name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
        });
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-body text-white">

            {/* HEADER */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-primary/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/30 rounded-full blur-[100px]"></div>

                <div className="relative z-10 p-8 md:p-12 pb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-400">terrain</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Operaciones</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Panel de Campo</h1>
                            <p className="text-slate-400">Gestión operativa de Aysén.</p>
                        </div>
                        <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10">
                            <button onClick={() => setActiveTab('localidades')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'localidades' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Localidades</button>
                            <button onClick={() => setActiveTab('atractivos')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'atractivos' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Atractivos</button>
                            <button onClick={() => setActiveTab('empresas')} className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'empresas' ? 'bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Empresas</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 md:p-12 pt-0">

                {/* --- LOCALIDADES --- */}
                {activeTab === 'localidades' && (
                    <div>
                        <button onClick={() => setEditingLocality({})} className="mb-6 bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined">add</span>
                            Nueva Localidad
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {localities.map(loc => (
                                <div key={loc.id} className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 hover:border-primary/50 cursor-pointer transition-all hover:shadow-xl group" onClick={() => setEditingLocality(loc)}>
                                    <img src={loc.image_url || 'https://via.placeholder.com/300x200'} className="w-full h-36 object-cover rounded-2xl mb-4 bg-white/5 group-hover:scale-[1.02] transition-transform" />
                                    <h3 className="font-bold text-lg text-white">{loc.name}</h3>
                                </div>
                            ))}
                        </div>
                        {editingLocality && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
                                <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-white/10">
                                    <h3 className="text-xl font-black mb-6 text-white">{editingLocality.id ? 'Editar Localidad' : 'Nueva Localidad'}</h3>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Nombre</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 mb-4 font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none placeholder:text-slate-500" value={editingLocality.name || ''} onChange={e => setEditingLocality({ ...editingLocality, name: e.target.value })} />

                                    <ImageUploader label="Imagen de Portada" currentImage={editingLocality.image_url} onUpload={(e) => handleFileUpload(e, url => setEditingLocality({ ...editingLocality, image_url: url }))} />

                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ubicación GPS</label>
                                        {editingLocality.latitude ? <p className="text-sm font-bold text-emerald-400 mb-2">{editingLocality.latitude.toFixed(4)}, {editingLocality.longitude?.toFixed(4)}</p> : <p className="text-sm text-red-400 font-bold mb-2">No definida</p>}
                                        <button onClick={() => openMap('locality')} className="w-full bg-white/5 text-white border border-white/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 hover:border-primary/50 transition-all">
                                            <span className="material-symbols-outlined">location_on</span>
                                            {editingLocality.latitude ? 'Ubicación Ajustada' : 'Seleccionar en Mapa'}
                                        </button>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => setEditingLocality(null)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">Cancelar</button>
                                        <button onClick={saveLocality} className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30">Guardar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- ATRACTIVOS --- */}
                {activeTab === 'atractivos' && (
                    <div>
                        <button onClick={() => setEditingAttraction({})} className="mb-6 bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined">add</span>
                            Nuevo Atractivo
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {attractions.map(att => (
                                <div key={att.id} className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 hover:border-primary/50 cursor-pointer flex gap-4 transition-all group" onClick={() => setEditingAttraction(att)}>
                                    <img src={att.main_image_url || 'https://via.placeholder.com/100'} className="w-24 h-24 object-cover rounded-2xl bg-white/5 group-hover:scale-[1.02] transition-transform" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-white leading-tight mb-2">{att.name}</h3>
                                        {/* @ts-ignore */}
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg font-bold border border-primary/30">{att.locality_name}</span>
                                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{att.short_description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {editingAttraction && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
                                <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-white/10">
                                    <h3 className="text-xl font-black mb-6 text-white">{editingAttraction.id ? 'Editar Atractivo' : 'Nuevo Atractivo'}</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Localidad</label>
                                            <select className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary outline-none" value={editingAttraction.locality_id || ''} onChange={e => setEditingAttraction({ ...editingAttraction, locality_id: e.target.value })}>
                                                <option value="" className="bg-slate-900">Seleccione...</option>
                                                {localities.map(l => <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Nombre</label>
                                            <input type="text" className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary outline-none" value={editingAttraction.name || ''} onChange={e => setEditingAttraction({ ...editingAttraction, name: e.target.value })} />
                                        </div>
                                    </div>

                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Descripción Corta</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 mb-4 resize-none focus:ring-2 focus:ring-primary outline-none" rows={3} value={editingAttraction.short_description || ''} onChange={e => setEditingAttraction({ ...editingAttraction, short_description: e.target.value })} />

                                    <ImageUploader label="Foto del Atractivo" currentImage={editingAttraction.main_image_url} onUpload={(e) => handleFileUpload(e, url => setEditingAttraction({ ...editingAttraction, main_image_url: url }))} />

                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Ubicación GPS</label>
                                        {editingAttraction.latitude ? <p className="text-sm font-bold text-emerald-400 mb-2">{editingAttraction.latitude.toFixed(4)}, {editingAttraction.longitude?.toFixed(4)}</p> : <p className="text-sm text-red-400 font-bold mb-2">No definida</p>}
                                        <button onClick={() => openMap('attraction')} className="w-full bg-white/5 text-white border border-white/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 hover:border-primary/50 transition-all">
                                            <span className="material-symbols-outlined">location_on</span>
                                            {editingAttraction.latitude ? 'Ubicación Ajustada' : 'Seleccionar en Mapa'}
                                        </button>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => setEditingAttraction(null)} className="flex-1 bg-white/5 text-slate-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">Cancelar</button>
                                        <button onClick={saveAttraction} className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30">Guardar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- EMPRESAS --- */}
                {activeTab === 'empresas' && (
                    <div>
                        <button onClick={() => setEditingCompany({ category: 'Actividad' as Category, gallery_urls: [] })} className="mb-6 bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined">add</span>
                            Nueva Empresa
                        </button>
                        <div className="space-y-4">
                            {companies.map(comp => (
                                <div key={comp.id} className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center hover:border-primary/50 transition-all group">
                                    <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => { setEditingCompany(comp); }}>
                                        <img src={comp.logo_url || 'https://via.placeholder.com/50'} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 group-hover:scale-105 transition-transform" />
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{comp.name}</h3>
                                            <div className="flex gap-2 text-xs mt-1">
                                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-lg font-bold border border-primary/30">{comp.category}</span>
                                                <span className="text-slate-400">{localities.find(l => l.id === comp.locality_id)?.name || 'Sin Localidad'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openServiceManager(comp); }}
                                        className="mt-4 md:mt-0 bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 flex items-center gap-2 shrink-0 border border-white/10 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                                        Gestionar Servicios
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* MODAL EMPRESA */}
                        {editingCompany && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
                                <div className="bg-slate-900/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative my-10 animate-in zoom-in-95 border border-white/10">
                                    <h3 className="text-2xl font-black text-white mb-6 border-b border-white/10 pb-4">{editingCompany.id ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <input type="text" placeholder="Nombre Fantasía" className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 font-bold focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" value={editingCompany.name || ''} onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })} />
                                            <select
                                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none"
                                                value={editingCompany.category || 'Actividad'}
                                                onChange={e => setEditingCompany({ ...editingCompany, category: e.target.value as Category })}
                                            >
                                                <option value="Actividad" className="bg-slate-900">Actividad / Tour</option>
                                                <option value="Restaurante" className="bg-slate-900">Restaurante</option>
                                                <option value="Hospedaje" className="bg-slate-900">Hospedaje</option>
                                                <option value="Transporte" className="bg-slate-900">Transporte</option>
                                            </select>

                                            {/* SELECTOR DE LOCALIDAD PARA LA EMPRESA */}
                                            <div className="bg-primary/10 p-3 rounded-xl border border-primary/30">
                                                <label className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">Localidad Base (Importante)</label>
                                                <select className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 font-bold focus:ring-2 focus:ring-primary outline-none" value={editingCompany.locality_id || ''} onChange={e => setEditingCompany({ ...editingCompany, locality_id: e.target.value })}>
                                                    <option value="" className="bg-slate-900">-- Seleccionar Localidad --</option>
                                                    {localities.map(l => <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>)}
                                                </select>
                                            </div>

                                            <input type="text" placeholder="WhatsApp" className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" value={editingCompany.whatsapp || ''} onChange={e => setEditingCompany({ ...editingCompany, whatsapp: e.target.value })} />
                                            <input type="text" placeholder="Dirección" className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" value={editingCompany.address || ''} onChange={e => setEditingCompany({ ...editingCompany, address: e.target.value })} />
                                        </div>
                                        <div className="space-y-6">
                                            <ImageUploader label="Logo Empresa" isSmall currentImage={editingCompany.logo_url} onUpload={(e) => handleFileUpload(e, url => setEditingCompany({ ...editingCompany, logo_url: url }))} />

                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Galería</label>
                                                <div className="grid grid-cols-4 gap-2 mb-2">
                                                    {editingCompany.gallery_urls?.map((url, i) => (
                                                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                            <button onClick={() => setEditingCompany(prev => ({ ...prev, gallery_urls: prev?.gallery_urls?.filter((_, idx) => idx !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-lg">
                                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary hover:text-primary text-slate-500 transition-colors aspect-square">
                                                        <span className="material-symbols-outlined">add_photo_alternate</span>
                                                        <input type="file" className="hidden" onChange={e => handleFileUpload(e, url => setEditingCompany(prev => ({ ...prev, gallery_urls: [...(prev?.gallery_urls || []), url] })))} />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/30">
                                                <label className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-2">Asignar Dueño (Email)</label>
                                                <div className="flex gap-2">
                                                    <input type="text" className="flex-1 bg-white/5 border border-white/10 p-2 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-orange-400" value={ownerEmailSearch} onChange={e => setOwnerEmailSearch(e.target.value)} />
                                                    <button onClick={searchOwner} className="bg-orange-500 text-white px-3 rounded-lg font-bold text-xs hover:bg-orange-600 transition-colors">Buscar</button>
                                                </div>
                                                {ownerSearchResult && <p className="text-[10px] text-emerald-400 mt-1 font-bold">✓ {ownerSearchResult.email}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <textarea placeholder="Descripción..." className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 resize-none mt-4 focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" rows={2} value={editingCompany.description || ''} onChange={e => setEditingCompany({ ...editingCompany, description: e.target.value })} />
                                    <div className="mt-4 p-4 border border-white/10 rounded-2xl bg-white/5 flex items-center justify-between">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ubicación GPS</label>
                                            {editingCompany.latitude ? <p className="text-sm font-bold text-emerald-400">{editingCompany.latitude.toFixed(4)}, {editingCompany.longitude?.toFixed(4)}</p> : <p className="text-sm text-red-400 font-bold">No definida</p>}
                                        </div>
                                        <button onClick={() => openMap('company')} className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/20 border border-white/10 transition-all"><span className="material-symbols-outlined text-sm">map</span> Seleccionar Mapa</button>
                                    </div>
                                    <div className="flex gap-4 mt-8 pt-4 border-t border-white/10">
                                        <button onClick={() => setEditingCompany(null)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-bold hover:bg-white/10 border border-white/10 transition-colors">Cancelar</button>
                                        <button onClick={saveCompany} className="flex-1 py-3 bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-primary/30">Guardar Empresa</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODAL SERVICIOS */}
                        {showServiceModal && (
                            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-xl">
                                <div className="bg-slate-900/95 backdrop-blur-2xl p-6 rounded-3xl w-full max-w-3xl shadow-2xl h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 border border-white/10">
                                    <div className="flex justify-between items-center mb-6 shrink-0 border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-xl font-black text-white">Servicios de {showServiceModal.name}</h3>
                                            <p className="text-xs text-slate-400">Administra los productos que ofrece esta empresa.</p>
                                        </div>
                                        <button onClick={() => setShowServiceModal(null)} className="text-slate-400 font-bold hover:text-red-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:border-red-400/50 transition-colors">CERRAR</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                        {companyServices.map(srv => (
                                            <div key={srv.id} className="border border-white/10 p-4 rounded-2xl flex gap-4 items-center bg-white/5 hover:bg-white/10 transition-colors">
                                                <img src={srv.image_url || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-xl object-cover bg-white/5 border border-white/10" />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white">{srv.name}</h4>
                                                    <p className="text-xs text-primary font-bold">{srv.price}</p>
                                                    <p className="text-[10px] text-slate-400 line-clamp-1">{srv.description}</p>
                                                    {srv.attraction_id && attractions.find(a => a.id === srv.attraction_id) && (
                                                        <span className="inline-flex items-center gap-1 mt-1 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-500/30">
                                                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                            {attractions.find(a => a.id === srv.attraction_id)?.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={() => setEditingService(srv)} className="bg-primary/20 text-primary p-2 rounded-xl hover:bg-primary/30 border border-primary/30 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                                <button onClick={() => deleteService(srv.id)} className="bg-red-500/20 text-red-400 p-2 rounded-xl hover:bg-red-500/30 border border-red-500/30 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                                            </div>
                                        ))}
                                        {companyServices.length === 0 && <p className="text-center text-slate-500 py-10 border-2 border-dashed border-white/10 rounded-2xl">No hay servicios registrados aún.</p>}
                                    </div>
                                    <div className="shrink-0 mt-4 pt-4 border-t border-white/10 bg-white/5 p-4 rounded-2xl">
                                        <h4 className="font-bold text-sm text-white mb-3">{editingService?.id ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</h4>

                                        {/* FILTRO INTELIGENTE DE ATRACTIVOS */}
                                        <div className="mb-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">¿Este servicio visita un Atractivo?</label>
                                            {showServiceModal.locality_id ? (
                                                <select
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-sm font-bold text-white focus:ring-2 focus:ring-primary outline-none"
                                                    value={editingService?.attraction_id || ''}
                                                    onChange={e => setEditingService(prev => ({ ...prev, attraction_id: e.target.value }))}
                                                >
                                                    <option value="" className="bg-slate-900">No, es un servicio general</option>
                                                    {attractions
                                                        .filter(a => a.locality_id === showServiceModal.locality_id)
                                                        .map(att => (
                                                            <option key={att.id} value={att.id} className="bg-slate-900">📍 {att.name}</option>
                                                        ))}
                                                </select>
                                            ) : (
                                                <div className="text-xs text-red-400 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                                                    ⚠️ Primero debes asignar una Localidad a esta Empresa para ver sus atractivos cercanos.
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <input type="text" placeholder="Nombre (ej. Tour Mármol)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm text-white font-bold focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" value={editingService?.name || ''} onChange={e => setEditingService(prev => ({ ...prev, name: e.target.value }))} />
                                            <input type="text" placeholder="Precio (ej. CLP 20.000)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm text-white font-bold focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" value={editingService?.price || ''} onChange={e => setEditingService(prev => ({ ...prev, price: e.target.value }))} />
                                        </div>
                                        <textarea placeholder="Descripción..." className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm mb-3 resize-none text-white focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-500" rows={2} value={editingService?.description || ''} onChange={e => setEditingService(prev => ({ ...prev, description: e.target.value }))}></textarea>

                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <ImageUploader label="Foto Servicio" isSmall currentImage={editingService?.image_url} onUpload={(e) => handleFileUpload(e, url => setEditingService(prev => ({ ...prev, image_url: url })))} />
                                            </div>
                                            <div className="flex gap-2 pb-1">
                                                {editingService?.id && <button onClick={() => setEditingService(null)} className="bg-white/5 px-4 py-3 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/10 transition-colors">Cancelar</button>}
                                                <button onClick={saveService} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">{editingService?.id ? 'Actualizar' : 'Agregar'}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* MODAL MAPA (RESTORED) */}
                {showMapModal && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-xl">
                        <div className="bg-slate-900/95 backdrop-blur-2xl w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col h-[80vh] border border-white/10 shadow-2xl">
                            <div className="p-4 border-b border-white/10">
                                <h3 className="text-lg font-black text-white">Seleccionar Ubicación</h3>
                                <p className="text-xs text-slate-400">Haz clic en el mapa para marcar la ubicación exacta.</p>
                            </div>
                            <div className="flex-1 relative bg-slate-800">
                                {/* @ts-ignore */}
                                <MapContainer center={[tempCoords?.lat || -46.6, tempCoords?.lng || -72.6]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <MapRecenter />
                                    {/* @ts-ignore */}
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                                    <LocationMarker pos={tempCoords} setPos={(lat, lng) => setTempCoords({ lat, lng })} />
                                </MapContainer>
                            </div>
                            <div className="p-4 bg-slate-900/90 border-t border-white/10 flex justify-between items-center gap-4">
                                {tempCoords && (
                                    <p className="text-xs text-emerald-400 font-bold">
                                        📍 {tempCoords.lat.toFixed(6)}, {tempCoords.lng.toFixed(6)}
                                    </p>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button onClick={() => setShowMapModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors border border-white/10">Cancelar</button>
                                    <button onClick={confirmLocation} className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/30">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EasyAdminFieldScreen;
