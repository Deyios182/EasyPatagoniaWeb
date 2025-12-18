
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { useAppAuth } from '../App';
import { Category, Business, MapTheme } from '../types';

const MAP_TILES: Record<MapTheme, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

const TouristMapScreen: React.FC = () => {
  const navigate = useNavigate();
  const { allBusinesses, t, mapTheme } = useAppAuth();
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [zoom, setZoom] = useState(14);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showRouteAssistant, setShowRouteAssistant] = useState(false);

  const localTransfers = useMemo(() => 
    allBusinesses.filter(b => b.categoria === 'Transporte' || b.servicios.some(s => s.nombre.toLowerCase().includes('traslado') || s.nombre.toLowerCase().includes('aeropuerto'))),
    [allBusinesses]
  );

  useEffect(() => {
    if (allBusinesses.length > 0 && !selectedBusiness) {
      setSelectedBusiness(allBusinesses[0]);
    }
  }, [allBusinesses]);

  const zoomLevelPriority = useMemo(() => {
    if (zoom < 13.0) return 0;
    if (zoom < 15.0) return 1;
    if (zoom < 16.5) return 2;
    return 3;
  }, [zoom]);

  const filtered = useMemo(() => {
    return allBusinesses.filter(b => {
      if (!b.isOpen) return false;
      const matchesFilter = activeFilter === 'All' || b.categoria === activeFilter;
      const matchesPriority = b.priority <= zoomLevelPriority;
      const matchesSearch = serviceSearch === '' || 
        b.servicios.some(s => s.nombre.toLowerCase().includes(serviceSearch.toLowerCase())) ||
        b.nombre.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchesFilter && matchesPriority && matchesSearch;
    });
  }, [allBusinesses, activeFilter, zoomLevelPriority, serviceSearch]);

  // Init Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initialPos: L.LatLngExpression = [-46.6225, -72.6745];
    // Se deshabilita attributionControl para quitar el enlace a Leaflet
    const map = L.map(containerRef.current, { 
      zoomControl: false, 
      attributionControl: false, 
      center: initialPos, 
      zoom: 14 
    });
    mapRef.current = map;
    map.on('zoomend', () => setZoom(map.getZoom()));
    
    tileLayerRef.current = L.tileLayer(MAP_TILES[mapTheme], { 
      maxZoom: 20 
    }).addTo(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update Theme
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(MAP_TILES[mapTheme], { 
        maxZoom: 20 
      }).addTo(mapRef.current);
    }
  }, [mapTheme]);

  useEffect(() => {
    if (!mapRef.current) return;
    Object.keys(markersRef.current).forEach(id => {
      if (!filtered.find(b => b.id === id)) { markersRef.current[id].remove(); delete markersRef.current[id]; }
    });
    filtered.forEach(b => {
      const isActive = selectedBusiness?.id === b.id;
      const color = b.categoria === 'Restaurante' ? '#dd6e42' : b.categoria === 'Hospedaje' ? '#3498db' : b.categoria === 'Transporte' ? '#4f6d7a' : '#2ecc71';
      const iconMap: Record<string, string> = { 'Restaurante': 'restaurant', 'Hospedaje': 'hotel', 'Transporte': 'directions_bus', 'Actividad': 'hiking', 'Natural': 'landscape' };
      const customIcon = L.divIcon({
        className: `custom-marker ${isActive ? 'active' : ''}`,
        html: `<div style="background-color: ${color}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white;">
                 <span class="marker-icon text-[14px] leading-none">${iconMap[b.categoria] || 'location_on'}</span>
               </div>`,
        iconSize: isActive ? [42, 42] : [32, 32],
        iconAnchor: isActive ? [21, 21] : [16, 16]
      });
      if (markersRef.current[b.id]) {
        markersRef.current[b.id].setIcon(customIcon);
        if (isActive) markersRef.current[b.id].setZIndexOffset(1000);
      } else {
        const marker = L.marker([b.gps.lat, b.gps.lng], { icon: customIcon }).addTo(mapRef.current!).on('click', () => setSelectedBusiness(b));
        markersRef.current[b.id] = marker;
      }
    });
  }, [filtered, selectedBusiness]);

  const googleMapsUrl = selectedBusiness 
    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedBusiness.gps.lat},${selectedBusiness.gps.lng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=Puerto+Rio+Tranquilo`;

  return (
    <div className="relative h-screen w-full bg-background-dark overflow-hidden flex flex-col">
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full"></div>

      {showRouteAssistant && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom duration-500 my-auto">
            <div className="p-8 md:p-12 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic leading-tight">Guía de Aysén</h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">{t('how_to_get')}</p>
                </div>
                <button onClick={() => setShowRouteAssistant(false)} className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-primary/5 border-2 border-primary/20 p-8 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center text-primary">
                    <span className="material-symbols-outlined text-5xl leading-none">navigation</span>
                    <span className="bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg leading-none">LIVE</span>
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase italic dark:text-white leading-tight">Ir a {selectedBusiness?.nombre || 'Destino'}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest leading-none">Ubicación Actual</p>
                  </div>
                  <a 
                    href={googleMapsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-primary text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] shadow-xl hover:scale-[1.02] transition-all no-underline leading-none"
                  >
                    Abrir Navegación <span className="material-symbols-outlined leading-none">directions</span>
                  </a>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="material-symbols-outlined text-5xl leading-none">flight</span>
                    <span className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">VUELOS</span>
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase italic dark:text-white leading-tight">Vuelos a Balmaceda</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest leading-none">Acceso Regional</p>
                  </div>
                  <a 
                    href="https://www.google.com/travel/flights?q=vuelos+a+BBA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-background-dark font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] shadow-xl hover:scale-[1.02] transition-all no-underline leading-none"
                  >
                    Ver Vuelos <span className="material-symbols-outlined leading-none">open_in_new</span>
                  </a>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-1 bg-primary"></div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Empresas de Traslado Local</h3>
                  </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth">
                  {localTransfers.map(op => (
                    <div 
                      key={op.id}
                      onClick={() => navigate(`/details/${op.id}`)}
                      className="w-80 shrink-0 bg-slate-100 dark:bg-background-dark p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 hover:border-primary transition-all cursor-pointer group shadow-sm flex flex-col h-auto"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <img src={op.media.logo_url} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-white" />
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-black dark:text-white uppercase italic leading-tight mb-1">{op.nombre}</p>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Verificado</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 flex-1">
                        {op.info.descripcion}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-sm leading-none">star</span>
                            <span className="text-sm font-black dark:text-white leading-none">{op.rating}</span>
                         </div>
                         <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 leading-none">
                           Reservar <span className="material-symbols-outlined text-sm leading-none">forum</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-[100] p-6 md:p-8 flex flex-col md:flex-row gap-4 pointer-events-none">
        <div className="w-full md:max-w-md pointer-events-auto">
          <div className="bg-surface-dark/90 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-5 flex items-center gap-4 shadow-2xl group focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-primary group-focus-within:scale-110 transition-transform leading-none">search</span>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 w-full text-base font-bold py-1 leading-none" 
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 scroll-smooth">
          {['All', 'Restaurante', 'Hospedaje', 'Actividad', 'Transporte'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveFilter(cat as any)}
              className={`whitespace-nowrap px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border leading-none ${activeFilter === cat ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-surface-dark/80 text-slate-400 border-white/5 backdrop-blur-md'}`}
            >
              {cat === 'All' ? t('all') : cat === 'Restaurante' ? t('restaurant') : cat === 'Hospedaje' ? t('hotel') : cat === 'Actividad' ? t('activity') : t('transport')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto relative z-[100] p-6 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pointer-events-none">
        {selectedBusiness && (
          <div 
            className="w-full md:max-w-md bg-surface-dark/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-6 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-500 pointer-events-auto cursor-pointer group" 
            onClick={() => navigate(`/details/${selectedBusiness.id}`)}
          >
            <div className="w-24 h-24 rounded-[2rem] overflow-hidden shrink-0 border border-white/5 relative">
              <img src={selectedBusiness.media.fotos_url[0] || selectedBusiness.media.logo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Selected" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-2 leading-none">{selectedBusiness.categoria}</p>
              <h3 className="text-white font-black text-2xl truncate leading-none tracking-tighter uppercase italic">{selectedBusiness.nombre}</h3>
              <div className="flex items-center gap-2 text-primary text-xs font-black mt-3 leading-none">
                <span className="material-symbols-outlined text-sm leading-none">star</span>
                {selectedBusiness.rating} 
                <span className="text-slate-500 font-bold ml-1 uppercase tracking-widest text-[9px] font-bold leading-none">({selectedBusiness.reviewCount})</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
              <span className="material-symbols-outlined text-2xl leading-none">arrow_forward</span>
            </div>
          </div>
        )}

        <div className="md:w-80 pointer-events-auto">
          <button 
            onClick={() => setShowRouteAssistant(true)}
            className="w-full bg-primary text-white font-black h-20 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-[0.15em] text-xs shadow-primary/30 border-4 border-white/10 px-6 py-4 leading-tight text-center"
          >
            <span className="material-symbols-outlined text-3xl leading-none">directions_car</span>
            {t('how_to_get')}
          </button>
        </div>
      </div>

      <div className="md:hidden bg-surface-dark/95 backdrop-blur-2xl border-t border-white/5 p-6 pb-10 flex justify-around items-center z-[110]">
        <Link to="/map" className="flex flex-col items-center gap-2 text-primary no-underline">
          <span className="material-symbols-outlined font-variation-settings-fill text-3xl leading-none">map</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">{t('map')}</span>
        </Link>
        <Link to="/directory" className="flex flex-col items-center gap-2 text-slate-500 no-underline">
          <span className="material-symbols-outlined text-3xl leading-none">list_alt</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">{t('list')}</span>
        </Link>
        <Link to="/discover" className="flex flex-col items-center gap-2 text-slate-500 no-underline">
          <span className="material-symbols-outlined text-3xl leading-none">explore</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">{t('discover')}</span>
        </Link>
        <Link to="/planner" className="flex flex-col items-center gap-2 text-slate-500 no-underline">
          <span className="material-symbols-outlined text-3xl leading-none">auto_awesome</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">{t('ai')}</span>
        </Link>
      </div>
    </div>
  );
};

export default TouristMapScreen;
