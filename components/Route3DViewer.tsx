import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Play, Pause, RotateCcw, Mountain, Layers, Eye, Compass, Navigation, Crosshair } from 'lucide-react';

interface Checkpoint3D {
  id: string;
  name: string;
  lat: number;
  lng: number;
  xp_reward?: number;
  description?: string;
}

interface Route3DViewerProps {
  checkpoints: Checkpoint3D[];
  routeName: string;
  difficulty?: string;
  onSelectCheckpoint?: (cp: Checkpoint3D) => void;
}

export const Route3DViewer: React.FC<Route3DViewerProps> = ({
  checkpoints,
  routeName,
  difficulty = 'moderado',
  onSelectCheckpoint
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const flyoverIntervalRef = useRef<any>(null);

  // States
  const [cameraMode, setCameraMode] = useState<'drone' | 'explorer'>('drone');
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [flyProgress, setFlyProgress] = useState<number>(0);
  const [currentCheckpointName, setCurrentCheckpointName] = useState<string>('');
  const [terrain3DActive, setTerrain3DActive] = useState<boolean>(true);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'topo'>('satellite');
  const [userCoord, setUserCoord] = useState<{ lat: number; lng: number } | null>(null);

  const getDifficultyHex = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('fácil') || d.includes('facil') || d.includes('easy')) return '#10B981';
    if (d.includes('moderado') || d.includes('medio')) return '#3B82F6';
    if (d.includes('difícil') || d.includes('dificil')) return '#F59E0B';
    return '#EF4444';
  };

  // Interpolate along checkpoints line
  const getInterpolatedPoint = (t: number): { lng: number; lat: number; bearing: number; nextCp: Checkpoint3D } => {
    if (checkpoints.length === 1) {
      return { lng: checkpoints[0].lng, lat: checkpoints[0].lat, bearing: 0, nextCp: checkpoints[0] };
    }
    const totalSegments = checkpoints.length - 1;
    const scaled = t * totalSegments;
    const index = Math.min(Math.floor(scaled), totalSegments - 1);
    const segT = scaled - index;

    const p1 = checkpoints[index];
    const p2 = checkpoints[index + 1];

    const lng = p1.lng + (p2.lng - p1.lng) * segT;
    const lat = p1.lat + (p2.lat - p1.lat) * segT;

    // Bearing direction
    const y = Math.sin((p2.lng - p1.lng) * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180);
    const x = Math.cos(p1.lat * Math.PI / 180) * Math.sin(p2.lat * Math.PI / 180) -
              Math.sin(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.cos((p2.lng - p1.lng) * Math.PI / 180);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    return { lng, lat, bearing, nextCp: p2 };
  };

  useEffect(() => {
    if (!mapContainer.current || !checkpoints || checkpoints.length === 0) return;

    // Center on checkpoints
    const lngs = checkpoints.map(c => c.lng);
    const lats = checkpoints.map(c => c.lat);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Esri World Imagery',
          maxzoom: 19
        },
        'topo-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: 'OpenStreetMap',
          maxzoom: 19
        },
        'terrain-dem': {
          type: 'raster-dem',
          tiles: [
            'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
          ],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15
        },
        'hillshade-dem': {
          type: 'raster-dem',
          tiles: [
            'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
          ],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#020617'
          }
        },
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-tiles',
          layout: {
            visibility: basemapStyle === 'satellite' ? 'visible' : 'none'
          }
        },
        {
          id: 'topo-layer',
          type: 'raster',
          source: 'topo-tiles',
          layout: {
            visibility: basemapStyle === 'topo' ? 'visible' : 'none'
          }
        },
        // Dramatic Hillshade on real mountain terrain
        {
          id: 'hillshade-relief',
          type: 'hillshade',
          source: 'hillshade-dem',
          layout: {
            visibility: terrain3DActive ? 'visible' : 'none'
          },
          paint: {
            'hillshade-shadow-color': '#020617',
            'hillshade-highlight-color': '#ffffff',
            'hillshade-accent-color': '#38bdf8',
            'hillshade-exaggeration': 0.85
          }
        }
      ],
      terrain: {
        source: 'terrain-dem',
        exaggeration: 3.5 // Pronounced elevation for dramatic Patagonian Andes
      },
      sky: {
        'sky-color': '#0f172a',
        'horizon-color': '#38bdf8',
        'fog-color': '#1e293b',
        'sky-horizon-blend': 0.6
      }
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [centerLng, centerLat],
      zoom: 12.8,
      pitch: cameraMode === 'explorer' ? 78 : 68,
      bearing: -45, // Aimed towards the Patagonian Andean mountain range
      maxPitch: 85
    });

    mapRef.current = map;

    map.on('error', (e) => {
      console.warn('MapLibre notice:', e.error?.message || e);
    });

    const resizeTimer = setTimeout(() => {
      if (map) map.resize();
    }, 200);

    map.on('load', () => {
      map.resize();

      // Ensure terrain is active
      if (!map.getTerrain()) {
        map.setTerrain({
          source: 'terrain-dem',
          exaggeration: 3.5
        });
      }

      // Add navigation control with pitch / tilt indicator
      map.addControl(new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true
      }), 'top-right');

      // Add Terrain 3D toggle control native to MapLibre
      map.addControl(new maplibregl.TerrainControl({
        source: 'terrain-dem',
        exaggeration: 3.5
      }), 'top-right');

      // Fit bounds if checkpoints exist
      if (checkpoints.length > 1 && cameraMode === 'drone') {
        const bounds = new maplibregl.LngLatBounds();
        checkpoints.forEach(cp => bounds.extend([cp.lng, cp.lat]));
        map.fitBounds(bounds, {
          padding: 70,
          pitch: 68,
          bearing: -25,
          maxZoom: 14.5,
          duration: 1200
        });
      }

      // Add Route GeoJSON Line
      const routeCoordinates = checkpoints.map(c => [c.lng, c.lat]);
      const diffColor = getDifficultyHex(difficulty);

      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      // Glowing Neon Route Casing
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': diffColor,
          'line-width': 12,
          'line-opacity': 0.45,
          'line-blur': 4
        }
      });

      // Crisp Trail
      map.addLayer({
        id: 'route-trail',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 4
        }
      });

      // 3D Beacons / Pokéstop-like Checkpoint Markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      checkpoints.forEach((cp, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === checkpoints.length - 1;
        const badgeColor = isFirst ? '#10B981' : isLast ? '#F59E0B' : diffColor;

        const el = document.createElement('div');
        el.className = 'group cursor-pointer flex flex-col items-center select-none';
        el.innerHTML = `
          <!-- Pokemon GO Style Vertical Energy Pillar Beam -->
          <div style="
            width: 3px;
            height: 55px;
            background: linear-gradient(to top, ${badgeColor}, transparent);
            box-shadow: 0 0 12px ${badgeColor};
            border-radius: 9999px;
            margin-bottom: -4px;
            animation: pulse 2s infinite ease-in-out;
          "></div>
          
          <!-- Floating Emblem -->
          <div style="
            background: linear-gradient(135deg, ${badgeColor}, #020617);
            border: 2px solid #ffffff;
            box-shadow: 0 0 20px ${badgeColor}cc, 0 6px 12px rgba(0,0,0,0.6);
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 900;
            font-size: 13px;
            transform-origin: center;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          " class="hover:scale-125">
            ${idx + 1}
          </div>

          <!-- Label -->
          <div style="
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(8px);
            padding: 3px 10px;
            border-radius: 9999px;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            margin-top: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          ">
            ${cp.name}
          </div>
        `;

        el.addEventListener('click', () => {
          map.flyTo({
            center: [cp.lng, cp.lat],
            zoom: 16,
            pitch: 75,
            bearing: map.getBearing() + 45,
            duration: 1500
          });
          if (onSelectCheckpoint) onSelectCheckpoint(cp);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cp.lng, cp.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    // Real-time user position watch (for Pokémon GO mode)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoord({ lat: latitude, lng: longitude });

        // Add Pokemon GO style explorer avatar
        if (mapRef.current) {
          const avatarEl = document.createElement('div');
          avatarEl.className = 'flex items-center justify-center';
          avatarEl.innerHTML = `
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(14, 165, 233, 0.25);
              border: 2px solid #38bdf8;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
              position: absolute;
            "></div>
            <div style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: linear-gradient(135deg, #38bdf8, #0284c7);
              border: 3px solid #ffffff;
              box-shadow: 0 0 16px #38bdf8;
              z-index: 10;
            "></div>
          `;
          userMarkerRef.current = new maplibregl.Marker({ element: avatarEl })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }
      });
    }

    return () => {
      clearTimeout(resizeTimer);
      if (flyoverIntervalRef.current) clearInterval(flyoverIntervalRef.current);
      markersRef.current.forEach(m => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [checkpoints, difficulty, basemapStyle, terrain3DActive]);

  // Continuous Cinematic Drone Flyover following the whole route smoothly
  const toggleFlyover = () => {
    const map = mapRef.current;
    if (!map || checkpoints.length < 2) return;

    if (isFlying) {
      setIsFlying(false);
      if (flyoverIntervalRef.current) {
        clearInterval(flyoverIntervalRef.current);
        flyoverIntervalRef.current = null;
      }
      return;
    }

    setIsFlying(true);
    let progress = 0;

    flyoverIntervalRef.current = setInterval(() => {
      progress += 0.003;
      if (progress > 1) progress = 0; // loop
      setFlyProgress(progress);

      const { lng, lat, bearing, nextCp } = getInterpolatedPoint(progress);
      setCurrentCheckpointName(nextCp.name);

      map.easeTo({
        center: [lng, lat],
        zoom: 14.8,
        pitch: 74, // Cinematic low-altitude drone angle
        bearing: bearing,
        duration: 180
      });
    }, 120);
  };

  // Switch to Pokémon GO 3rd-Person Explorer View on Phone
  const activateExplorerView = () => {
    const map = mapRef.current;
    if (!map) return;

    if (isFlying) {
      setIsFlying(false);
      if (flyoverIntervalRef.current) clearInterval(flyoverIntervalRef.current);
    }

    setCameraMode('explorer');

    // Focus on user or starting checkpoint with ultra-low pitch
    const targetLng = userCoord?.lng || checkpoints[0].lng;
    const targetLat = userCoord?.lat || checkpoints[0].lat;

    map.flyTo({
      center: [targetLng, targetLat],
      zoom: 16.5,
      pitch: 80, // Pokémon GO 3rd person angle
      bearing: 0,
      duration: 1800
    });
  };

  const activateDroneView = () => {
    const map = mapRef.current;
    if (!map) return;

    setCameraMode('drone');
    const bounds = new maplibregl.LngLatBounds();
    checkpoints.forEach(cp => bounds.extend([cp.lng, cp.lat]));
    map.fitBounds(bounds, {
      padding: 70,
      pitch: 68,
      bearing: -25,
      maxZoom: 14.5,
      duration: 1500
    });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map || checkpoints.length === 0) return;
    setIsFlying(false);
    if (flyoverIntervalRef.current) clearInterval(flyoverIntervalRef.current);

    const bounds = new maplibregl.LngLatBounds();
    checkpoints.forEach(cp => bounds.extend([cp.lng, cp.lat]));
    map.fitBounds(bounds, {
      padding: 70,
      pitch: cameraMode === 'explorer' ? 78 : 68,
      bearing: -25,
      maxZoom: 14.5,
      duration: 1500
    });
  };

  return (
    <div className="relative w-full h-[400px] rounded-[2.5rem] overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] bg-slate-950 select-none">
      {/* MapLibre WebGL Canvas Container */}
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }} 
      />

      {/* Top Left Navigation Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-xl">
          <Mountain className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px]">
            {cameraMode === 'explorer' ? 'Modo Explorador (Tercera Persona)' : 'Relieve Patagónico 3D'}
          </span>
        </div>

        {/* Live Drone Flyover telemetry */}
        {isFlying && (
          <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30 text-[10px] font-black text-amber-400 shadow-xl animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>DRON EN VUELO: {Math.round(flyProgress * 100)}% • Rumbo a {currentCheckpointName || 'Checkpoint'}</span>
          </div>
        )}
      </div>

      {/* Top Right Map Controls & Mode Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
        <button
          onClick={() => cameraMode === 'drone' ? activateExplorerView() : activateDroneView()}
          title="Alternar vista Dron / Explorador estilo Pokémon GO"
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
            cameraMode === 'explorer'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'bg-white/10 text-slate-300 hover:text-white'
          }`}
        >
          {cameraMode === 'explorer' ? (
            <>
              <Crosshair className="w-3.5 h-3.5 text-emerald-300" />
              <span>Vista Explorador</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 text-cyan-300" />
              <span>Vista Dron</span>
            </>
          )}
        </button>

        <button
          onClick={() => setBasemapStyle(s => s === 'satellite' ? 'topo' : 'satellite')}
          title="Alternar capa satélite / topográfica"
          className={`p-1.5 rounded-xl text-xs font-black transition-all ${
            basemapStyle === 'satellite' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFlyover}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all active:scale-95 ${
              isFlying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
            }`}
          >
            {isFlying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar Sobrevuelo</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Sobrevolar Toda la Ruta</span>
              </>
            )}
          </button>

          <button
            onClick={resetView}
            title="Restablecer cámara"
            className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/15 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-[10px] text-slate-300 shadow-xl pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Arrastra 2 dedos para inclinar montañas</span>
        </div>
      </div>
    </div>
  );
};
