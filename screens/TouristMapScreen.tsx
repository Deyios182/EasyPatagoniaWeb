import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { useAppAuth } from '../App';
import { Category, Business, MapTheme } from '../types';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { AttractionMarker, GasStationMarker, CampingMarker, MarketMarker } from '../components/MapMarkers';

const MAP_TILES: Record<MapTheme, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

const TouristMapScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { allBusinesses, t, mapTheme, setMapTheme, user, allLocalities, allAttractions } = useAppAuth();

  // USE STATE FOR MAP INSTANCE TO HANDLE STRICT MODE CORRECTLY
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});

  const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All');
  const [attractionFilter, setAttractionFilter] = useState<'all' | 'attractions' | 'gas_stations' | 'campings'>('all');
  const [serviceSearch, setServiceSearch] = useState('');
  const [zoom, setZoom] = useState(14);
  const [isSatellite, setIsSatellite] = useState(false); // Local state for satellite view
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<any | null>(null); // New state for Attraction
  const [showRouteAssistant, setShowRouteAssistant] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle incoming navigation state (e.g. from Highlights or Details)
  useEffect(() => {
    if (location.state?.selectedAttractionId) {
      const attr = allAttractions.find(a => a.id === location.state.selectedAttractionId);
      if (attr) {
        setSelectedAttraction(attr);
        setSelectedBusiness(null);
      }
    }
  }, [location.state, allAttractions]);

  const localTransfers = useMemo(() =>
    allBusinesses.filter(b => b.categoria === 'Transporte' || b.servicios?.some(s => (s.nombre || '').toLowerCase().includes('traslado') || (s.nombre || '').toLowerCase().includes('aeropuerto'))),
    [allBusinesses]
  );

  const zoomLevelPriority = useMemo(() => {
    if (zoom < 13.0) return 0;
    if (zoom < 15.0) return 1;
    if (zoom < 16.5) return 2;
    return 3;
  }, [zoom]);

  const filtered = useMemo(() => {
    return allBusinesses.filter(b => {
      // Robust checks
      if (!b.gps) return false;
      if (b.isOpen === false) return false;

      let matchesFilter = false;
      if (activeFilter === 'All') {
        matchesFilter = true;
      } else if (activeFilter === 'Actividad') {
        matchesFilter = ['Actividad', 'Tour Operador', 'Agencia', 'Tour', 'Excursión'].some(c => b.categoria.includes(c));
      } else if (activeFilter === 'Hospedaje') {
        matchesFilter = ['Hospedaje', 'Hotel', 'Cabaña', 'Hostal', 'Lodge', 'Camping', 'Alojamiento'].some(c => b.categoria.includes(c));
      } else if (activeFilter === 'Restaurante') {
        matchesFilter = ['Restaurante', 'Cafetería', 'Bar', 'Gastronomía', 'Comida'].some(c => b.categoria.includes(c));
      } else if (activeFilter === 'Transporte') {
        matchesFilter = ['Transporte', 'Transfer', 'Taxi'].some(c => b.categoria.includes(c));
      } else if (activeFilter === 'Mercado') {
        matchesFilter = ['Mercado', 'Artesanía', 'Comercio', 'Tienda'].some(c => b.categoria.includes(c));
      } else {
        matchesFilter = b.categoria === activeFilter;
      }

      const matchesPriority = true; // FORCE SHOW ALL

      const matchesSearch = serviceSearch === '' ||
        b.servicios?.some(s => (s.nombre || '').toLowerCase().includes(serviceSearch.toLowerCase())) ||
        (b.nombre || '').toLowerCase().includes(serviceSearch.toLowerCase());

      return matchesFilter && matchesPriority && matchesSearch;
    });
  }, [allBusinesses, activeFilter, zoomLevelPriority, serviceSearch]);

  // Init Map
  useEffect(() => {
    if (!containerRef.current || mapInstance) return;
    const initialPos: L.LatLngExpression = [-46.6225, -72.6745]; // Tranquilo

    // Force valid theme
    const currentTheme = mapTheme || 'light';
    const validTheme = (currentTheme === 'satellite' ? 'light' : currentTheme);
    const tileUrl = isSatellite ? MAP_TILES['satellite'] : (MAP_TILES[validTheme] || MAP_TILES['light']);

    console.log('🗺️ [MAP] Initializing map with theme:', validTheme, 'URL:', tileUrl);

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: initialPos,
      zoom: 14,
      bounceAtZoomLimits: false
    });

    map.on('zoomend', () => setZoom(map.getZoom()));

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 20,
      maxNativeZoom: isSatellite ? 17 : 19,
      attribution: '© OpenStreetMap contributors & CartoDB',
      subdomains: 'abcd', // IMPORTANT for CartoCDN
      updateWhenIdle: false,
      keepBuffer: 10,
      updateWhenZooming: true,
      updateInterval: 100,
      className: 'map-tiles',
      bounds: [[-49.3, -76.0], [-43.5, -71.0]]
    }).addTo(map);

    tileLayerRef.current.on('tileerror', (error) => {
      console.error('❌ [MAP] Tile load error. Check network or URL.', error);
    });

    // Fix gray area by invalidating size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    setMapInstance(map);

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, []);

  // Update Theme
  useEffect(() => {
    if (mapInstance && tileLayerRef.current) {
      mapInstance.removeLayer(tileLayerRef.current);

      const currentTheme = mapTheme || 'light';
      const validTheme = (currentTheme === 'satellite' ? 'light' : currentTheme);
      const tileUrl = isSatellite ? MAP_TILES['satellite'] : (MAP_TILES[validTheme] || MAP_TILES['light']);

      console.log('🗺️ [MAP] Updating tiles to:', tileUrl);

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 20,
        maxNativeZoom: isSatellite ? 17 : 19,
        attribution: '© OpenStreetMap contributors & CartoDB',
        subdomains: 'abcd',
        updateWhenIdle: false,
        keepBuffer: 10,
        updateWhenZooming: true,
        updateInterval: 100,
        className: 'map-tiles',
        bounds: [[-49.3, -76.0], [-43.5, -71.0]]
      }).addTo(mapInstance);

      tileLayerRef.current.on('tileerror', (error) => {
        console.error('❌ [MAP] Tile load error:', error);
      });
    }

  }, [mapTheme, mapInstance, isSatellite]);

  // Update Markers (Localities + Attractions + Businesses)
  useEffect(() => {
    if (!mapInstance) return;
    // const { allLocalities, allAttractions } = useAppAuth(); // REMOVED INVALID HOOK CALL

    // --- 1. Prepare Data ---
    // Businesses (ONLY at Zoom >= 13)
    const SHOW_BUSINESS_ZOOM_THRESHOLD = 13;
    const businessMarkers = (zoom >= SHOW_BUSINESS_ZOOM_THRESHOLD)
      ? filtered.filter(b => b.gps).map(b => {
        // Check if it's a market/artesanía to treat it as attraction-style marker
        const isMarket = ['Mercado', 'Artesanía', 'Comercio'].some(c => b.categoria.includes(c));

        return {
          id: b.id,
          lat: b.gps!.lat,
          lng: b.gps!.lng,
          title: b.nombre,
          type: isMarket ? 'market' : 'business',
          color: b.categoria === 'Transporte' ? '#4f6d7a' :
            ['Restaurante', 'Cafetería'].some(c => b.categoria.includes(c)) ? '#dd6e42' :
              ['Hospedaje', 'Hotel', 'Cabaña'].some(c => b.categoria.includes(c)) ? '#3498db' :
                isMarket ? '#2196F3' : '#2ecc71',
          icon: b.media.logo_url,
          data: b
        };
      })
      : [];

    // Localities (Visible only at LOW zoom, hide when businesses appear)
    const localityMarkers = (zoom < SHOW_BUSINESS_ZOOM_THRESHOLD)
      ? allLocalities.filter(l => l.latitude && l.longitude).map(l => ({
        id: l.id,
        lat: l.latitude!,
        lng: l.longitude!,
        title: l.name,
        type: 'locality',
        color: '#dd6e42', // Orange (EasyPatagonia)
        icon: l.image_url,
        data: l
      }))
      : [];

    // Attractions (Always visible, filtered by category)
    const attractionMarkers = allAttractions
      .filter(a => a.latitude && a.longitude)
      .filter(a => {
        if (attractionFilter === 'all') return true;
        if (attractionFilter === 'attractions') return !a.category || a.category === 'attraction';
        if (attractionFilter === 'gas_stations') return a.category === 'gas_station';
        if (attractionFilter === 'campings') return a.category === 'camping';
        return true;
      })
      .map(a => {
        // Determine color based on category
        let color = '#FF6B35'; // Default orange for attractions
        if (a.category === 'gas_station') color = '#DC2626'; // Red for gas stations
        if (a.category === 'camping') color = '#16A34A'; // Green for campings

        return {
          id: a.id,
          lat: a.latitude!,
          lng: a.longitude!,
          title: a.name,
          type: 'attraction',
          category: a.category || 'attraction',
          color: color,
          icon: a.main_image_url,
          data: a
        };
      });


    // Combine markers: Businesses first (bottom layer), then attractions, then localities (top layer)
    const allMarkers = [...businessMarkers, ...attractionMarkers, ...localityMarkers];

    // --- 2. Cleanup ---
    Object.keys(markersRef.current).forEach(id => {
      if (!allMarkers.find(m => m.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // --- 3. Render ---
    allMarkers.forEach(item => {
      const isActive = selectedBusiness?.id === item.id || selectedAttraction?.id === item.id;

      // Custom Icon Logic - LOCALIDADES tienen diseño especial de LABEL
      let customIcon;

      if (item.type === 'locality') {
        // LOCALIDADES: Mostrar como LABEL compacto
        customIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
              transform: translateX(-50%);
            ">
              <div style="
                background: linear-gradient(135deg, #dd6e42, #ff8c61);
                color: white;
                font-size: 10px;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 12px;
                white-space: nowrap;
                box-shadow: 0 2px 10px rgba(221, 110, 66, 0.4);
                border: 1px solid rgba(255,255,255,0.2);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                ${item.title}
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid #dd6e42;
              "></div>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 30]
        });
      } else if (item.type === 'attraction') {
        // ATTRACTIONS: Use custom SVG markers based on category
        const MarkerComponent =
          (item as any).category === 'gas_station' ? GasStationMarker :
            (item as any).category === 'camping' ? CampingMarker :
              AttractionMarker;

        const markerSvg = ReactDOMServer.renderToString(<MarkerComponent />);

        customIcon = L.divIcon({
          className: '',
          html: markerSvg,
          iconSize: [26, 34],
          iconAnchor: [13, 34],
          popupAnchor: [0, -34]
        });
      } else if (item.type === 'market') {
        // MARKETS: Use custom SVG marker (same as attractions)
        const markerSvg = ReactDOMServer.renderToString(<MarketMarker />);

        customIcon = L.divIcon({
          className: '',
          html: markerSvg,
          iconSize: [26, 34],
          iconAnchor: [13, 34],
          popupAnchor: [0, -34]
        });
      } else {
        // NEGOCIOS: Mantienen el diseño circular
        let innerHtml = '';
        const categoryIcon =
          ['Restaurante', 'Cafetería'].some(c => (item.data as any).categoria.includes(c)) ? 'restaurant' :
            ['Hospedaje', 'Hotel'].some(c => (item.data as any).categoria.includes(c)) ? 'hotel' :
              ['Transporte'].some(c => (item.data as any).categoria.includes(c)) ? 'directions_bus' :
                'location_on';

        innerHtml = `<img src="${item.icon}" style="width: 100%; height: 100%; object-fit: cover; background-color: white;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background-color: ${item.color}; border-radius: 50%;"><span class="material-symbols-outlined" style="color: white; font-size: 20px;">${categoryIcon}</span></div>`;

        customIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              position: relative;
              width: ${isActive ? '56px' : '40px'}; 
              height: ${isActive ? '56px' : '40px'}; 
              border-radius: 50%; 
              border: ${isActive ? '3px' : '2px'} solid white; 
              background-color: ${item.color}; 
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0,0,0,0.5);
              transition: all 0.3s ease;
              z-index: ${isActive ? 1000 : 1};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${innerHtml}
            </div>
          `,
          iconSize: isActive ? [56, 56] : [40, 40],
          iconAnchor: isActive ? [28, 28] : [20, 20]
        });
      }

      if (markersRef.current[item.id]) {
        const m = markersRef.current[item.id];
        if (m instanceof L.Marker) {
          m.setIcon(customIcon);
          m.setZIndexOffset(isActive ? 1000 : 0);
        }
      } else {
        const marker = L.marker([item.lat, item.lng], { icon: customIcon })
          .addTo(mapInstance)
          .on('click', () => {
            // If Business, Select it
            if (item.type === 'business') {
              setSelectedBusiness(item.data as Business);
              setSelectedAttraction(null);
            } else if (item.type === 'attraction') {
              setSelectedAttraction(item.data);
              setSelectedBusiness(null);
            }
          });
        markersRef.current[item.id] = marker;
      }
    });

  }, [filtered, selectedBusiness?.id, selectedAttraction?.id, mapInstance, allLocalities, allAttractions]);

  // Separate Effect for Camera Movement (FlyTo) to avoid snapping on ogni trigger de marcadores
  useEffect(() => {
    if (!mapInstance) return;

    if (selectedBusiness && selectedBusiness.gps) {
      mapInstance.flyTo([selectedBusiness.gps.lat, selectedBusiness.gps.lng], 16, { animate: true, duration: 1.5 });
    } else if (selectedAttraction && selectedAttraction.latitude && selectedAttraction.longitude) {
      mapInstance.flyTo([selectedAttraction.latitude, selectedAttraction.longitude], 15, { animate: true, duration: 1.5 });
    }
  }, [selectedBusiness?.id, selectedAttraction?.id, mapInstance]);

  // Close selection when clicking on Map Background
  useEffect(() => {
    if (!mapInstance) return;

    const onMapClick = (e: any) => {
      // Leaflet click events on the map itself (not on markers)
      // Usually markers prevent propagation, so a direct click on map means background.
      setSelectedBusiness(null);
      setSelectedAttraction(null);
    };

    mapInstance.on('click', onMapClick);
    return () => mapInstance.off('click', onMapClick);
  }, [mapInstance]);

  const handleLocalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    if (!locId) return;
    const loc = allLocalities.find(l => l.id === locId);
    if (loc && loc.latitude && loc.longitude && mapInstance) {
      mapInstance.flyTo([loc.latitude, loc.longitude], 14, { animate: true, duration: 1.5 });
    }
  };

  const googleMapsUrl = selectedBusiness
    ? `http://googleusercontent.com/maps.google.com/maps?daddr=${selectedBusiness.gps?.lat},${selectedBusiness.gps?.lng}`
    : selectedAttraction
      ? `http://googleusercontent.com/maps.google.com/maps?daddr=${selectedAttraction.latitude},${selectedAttraction.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=Puerto+Rio+Tranquilo`;

  return (
    <div className="relative h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden flex flex-col transition-colors duration-300">
      <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full"></div>

      {showRouteAssistant && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-xl flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom duration-500 my-auto">
            <div className="p-6 md:p-12 space-y-8 md:space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-tight">Guía de Aysén</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{t('how_to_get')}</p>
                </div>
                <button onClick={() => setShowRouteAssistant(false)} className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-primary/5 border-2 border-primary/20 p-6 md:p-8 rounded-[2rem] space-y-4">
                  <div className="flex justify-between items-center text-primary">
                    <span className="material-symbols-outlined text-4xl md:text-5xl leading-none">navigation</span>
                    <span className="bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg leading-none">LIVE</span>
                  </div>
                  <div>
                    <h3 className="font-black text-xl md:text-2xl uppercase italic text-slate-800 dark:text-white leading-tight">Ir a {selectedBusiness?.nombre || selectedAttraction?.name || 'Destino'}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest leading-none">Ubicación Actual</p>
                  </div>
                  <a
                    href={selectedBusiness?.gps ? `https://www.google.com/maps/dir/?api=1&destination=${selectedBusiness.gps.lat},${selectedBusiness.gps.lng}` : selectedAttraction?.latitude ? `https://www.google.com/maps/dir/?api=1&destination=${selectedAttraction.latitude},${selectedAttraction.longitude}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] shadow-xl transition-all no-underline leading-none ${(!selectedBusiness && !selectedAttraction) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    Navegar <span className="material-symbols-outlined leading-none text-base">directions</span>
                  </a>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-[2rem] space-y-4">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl md:text-5xl leading-none">flight</span>
                    <span className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">VUELOS</span>
                  </div>
                  <div>
                    <h3 className="font-black text-xl md:text-2xl uppercase italic text-slate-800 dark:text-white leading-tight">Vuelos a Balmaceda</h3>
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest leading-none">Acceso Regional</p>
                  </div>
                  <a href="https://www.google.com/travel/flights?q=Vuelos+a+Balmaceda" target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 dark:bg-white text-white dark:text-background-dark font-black py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] shadow-xl transition-all no-underline leading-none">
                    Ver Vuelos <span className="material-symbols-outlined leading-none text-base">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* LOCAL TRANSFERS SECTION */}
              {localTransfers.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-green-500 text-3xl">airport_shuttle</span>
                    <div>
                      <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white leading-none">Traslados & Tours</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Servicios Locales Disponibles</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localTransfers.map(tr => (
                      <div
                        key={tr.id}
                        onClick={() => { setSelectedBusiness(tr); setShowRouteAssistant(false); }}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-lg transition-all group"
                      >
                        <img src={tr.media.logo_url} className="w-14 h-14 rounded-xl object-cover bg-white shadow-sm" alt={tr.nombre} />
                        <div>
                          <h4 className="font-black text-slate-800 dark:text-white leading-tight group-hover:text-primary transition-colors">{tr.nombre}</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 line-clamp-1">{tr.info.descripcion}</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-primary">chevron_right</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR (Búsqueda + Filtros + PERFIL MÓVIL) */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-2 md:p-8 flex flex-col md:flex-row gap-2 md:gap-4 pointer-events-none">

        {/* Contenedor Superior: Buscador + Botón Perfil */}
        <div className="w-full md:max-w-md pointer-events-auto flex gap-3">
          <div className="flex-1 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl px-4 py-3 md:px-8 md:py-5 flex items-center gap-3 shadow-2xl group focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-primary leading-none text-xl md:text-2xl">location_on</span>
            <select
              onChange={handleLocalityChange}
              className="bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white w-full text-sm md:text-base font-bold py-1 leading-none cursor-pointer appearance-none uppercase tracking-wider"
              defaultValue=""
            >
              <option value="" disabled>📍 Descubre la Patagonia</option>
              {allLocalities.map(loc => (
                <option key={loc.id} value={loc.id} className="text-slate-800">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* BOTÓN PERFIL MÓVIL (Solo visible en MÓVIL) */}
          <Link to={user ? "/profile" : "/auth/login"} className={`md:hidden w-12 h-12 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all overflow-hidden relative shrink-0 ${user ? 'bg-white/90 dark:bg-surface-dark/90' : 'bg-primary text-white'}`}>
            {user ? (
              <>
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt="Perfil"
                  className="w-full h-full object-cover backdrop-blur-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) (target.nextElementSibling as HTMLElement).style.display = 'block';
                  }}
                />
                <span className="material-symbols-outlined text-slate-700 dark:text-white absolute inset-0 m-auto flex items-center justify-center pointer-events-none" style={{ display: user.avatar ? 'none' : 'flex' }}>person</span>
              </>
            ) : (
              <span className="material-symbols-outlined text-2xl">login</span>
            )}
          </Link>
        </div>




        {/* Toggle Satelital - Moved lower to avoid overlap */}
        <div className="absolute top-32 left-4 md:left-8 z-[90] pointer-events-auto">
          <button
            onClick={() => setIsSatellite(!isSatellite)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all border border-slate-200 dark:border-white/10 ${isSatellite ? 'bg-primary text-white' : 'bg-white/90 dark:bg-surface-dark/90 text-slate-600 dark:text-gray-200'} active:scale-95`}
            title={isSatellite ? "Ver Mapa" : "Ver Satélite"}
          >
            <span className="material-symbols-outlined text-2xl">{isSatellite ? 'map' : 'satellite_alt'}</span>
          </button>
        </div>

        {/* Filtros de Negocios */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 scroll-smooth mask-linear-fade">
          {['All', 'Restaurante', 'Hospedaje', 'Actividad', 'Transporte', 'Mercado'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat as any)}
              className={`whitespace-nowrap px-4 py-2 md:px-8 md:py-4 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border leading-none shadow-sm ${activeFilter === cat ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-white/90 dark:bg-surface-dark/90 text-slate-500 dark:text-slate-400 border-white/50 dark:border-white/5 backdrop-blur-md'}`}
            >
              {cat === 'All' ? t('all') : cat === 'Restaurante' ? t('restaurant') : cat === 'Hospedaje' ? t('hotel') : cat === 'Actividad' ? t('activity') : cat === 'Transporte' ? t('transport') : 'Mercado'}
            </button>
          ))}
        </div>

        {/* Filtros de Atractivos */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2 scroll-smooth mask-linear-fade">
          {[
            { key: 'all', label: 'Todos', icon: '🗺️' },
            { key: 'attractions', label: 'Atractivos', icon: '🏔️' },
            { key: 'gas_stations', label: 'Bencineras', icon: '⛽' },
            { key: 'campings', label: 'Campings', icon: '🏕️' }
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setAttractionFilter(cat.key as any)}
              className={`whitespace-nowrap px-4 py-2 md:px-8 md:py-4 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border leading-none shadow-sm ${attractionFilter === cat.key
                ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-105'
                : 'bg-white/90 dark:bg-surface-dark/90 text-slate-500 dark:text-slate-400 border-white/50 dark:border-white/5 backdrop-blur-md'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA INFERIOR: TARJETA + BOTÓN DE ACCIÓN */}
      <div className="mt-auto relative z-[100] p-4 md:p-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 pointer-events-none mb-[70px] md:mb-0">

        {/* TARJETA DE NEGOCIO */}
        {selectedBusiness && (
          <div
            className="w-full md:max-w-md bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 shadow-2xl flex items-center gap-4 md:gap-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto cursor-pointer group"
            onClick={() => navigate(`/details/${selectedBusiness.id}`)}
          >
            <div
              className="md:hidden absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg z-20 cursor-pointer hover:bg-primary transition-colors"
              onClick={(e) => { e.stopPropagation(); setSelectedBusiness(null); }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </div>

            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] overflow-hidden shrink-0 border border-slate-100 dark:border-white/5 relative bg-slate-200">
              <img src={selectedBusiness.media.fotos_url[0] || selectedBusiness.media.logo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Selected" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] md:text-[9px] text-primary font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 leading-none">{selectedBusiness.categoria}</p>
              <h3 className="text-slate-800 dark:text-white font-black text-lg md:text-2xl truncate leading-none tracking-tighter uppercase italic">{selectedBusiness.nombre}</h3>
              <div className="flex items-center gap-2 text-primary text-[10px] md:text-xs font-black mt-2 md:mt-3 leading-none">
                <span className="material-symbols-outlined text-xs md:text-sm leading-none">star</span>
                {selectedBusiness.rating}
                <span className="text-slate-400 font-bold ml-1 uppercase tracking-widest text-[8px] md:text-[9px] leading-none">({selectedBusiness.reviewCount})</span>
              </div>
            </div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-md">
              <span className="material-symbols-outlined text-lg md:text-2xl leading-none">arrow_forward</span>
            </div>
          </div>
        )}

        {/* TARJETA DE ATRACTIVO (Nuevo) */}
        {selectedAttraction && (
          <div
            className="w-full md:max-w-md bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 shadow-2xl flex items-center gap-4 md:gap-6 animate-in slide-in-from-bottom duration-300 pointer-events-auto cursor-pointer group"
            onClick={() => navigate(`/attraction/${selectedAttraction.id}`)}
          >
            <div
              className="md:hidden absolute -top-3 -right-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg z-20 cursor-pointer hover:bg-primary transition-colors"
              onClick={(e) => { e.stopPropagation(); setSelectedAttraction(null); }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </div>

            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] overflow-hidden shrink-0 border border-slate-100 dark:border-white/5 relative bg-slate-200">
              <img src={selectedAttraction.main_image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Selected" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] md:text-[9px] text-orange-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 leading-none">Atractivo Turístico</p>
              <h3 className="text-slate-800 dark:text-white font-black text-lg md:text-2xl truncate leading-none tracking-tighter uppercase italic">{selectedAttraction.name}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs font-bold mt-2 md:mt-3 leading-none">
                <span className="material-symbols-outlined text-xs md:text-sm leading-none">location_on</span>
                Ver Tours Disponibles
              </div>
            </div>
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-orange-100 dark:bg-white/5 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-md">
              <span className="material-symbols-outlined text-lg md:text-2xl leading-none">explore</span>
            </div>
          </div>
        )}

        {/* BOTÓN CÓMO LLEGAR (Se muestra siempre ahora, o condicional si se prefiere) */}
        {((selectedBusiness || selectedAttraction) || !isMobile) && (
          <div className="w-full md:w-80 pointer-events-auto animate-in fade-in duration-300">
            <button
              onClick={() => setShowRouteAssistant(true)}
              className="w-full bg-primary text-white font-black h-14 md:h-20 rounded-2xl md:rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-all uppercase tracking-[0.15em] text-[10px] md:text-xs shadow-primary/30 border-2 md:border-4 border-white/20 dark:border-white/10 px-4 py-2 leading-tight text-center"
            >
              <span className="material-symbols-outlined text-2xl md:text-3xl leading-none">directions_car</span>
              {t('how_to_get')}
            </button>
          </div>
        )}
      </div>

      {/* MENÚ MÓVIL */}
      <BottomNavigationBar />
    </div >
  );
};

export default TouristMapScreen;
