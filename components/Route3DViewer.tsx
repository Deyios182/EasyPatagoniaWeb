import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Play, Pause, RotateCcw, Mountain, Layers, ZoomIn, ZoomOut } from 'lucide-react';

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
  const animationFrameRef = useRef<number | null>(null);

  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [terrain3DActive, setTerrain3DActive] = useState<boolean>(true);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'topo'>('satellite');

  const getDifficultyHex = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d.includes('fácil') || d.includes('facil') || d.includes('easy')) return '#10B981';
    if (d.includes('moderado') || d.includes('medio')) return '#3B82F6';
    if (d.includes('difícil') || d.includes('dificil')) return '#F59E0B';
    return '#EF4444';
  };

  useEffect(() => {
    if (!mapContainer.current || !checkpoints || checkpoints.length === 0) return;

    // Center on points
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
            'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
          ],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 15
        }
      },
      layers: [
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
        // Dramatic Patagonian sky atmosphere fog
        {
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-color': '#0f172a',
            'sky-horizon-blend': 0.5,
            'horizon-color': '#1e293b',
            'horizon-fog-blend': 0.8,
            'fog-color': '#0f172a',
            'fog-ground-blend': 0.4
          }
        }
      ],
      terrain: terrain3DActive
        ? {
            source: 'terrain-dem',
            exaggeration: 1.8 // Exaggeration factor makes Patagonian mountains and fjords pop in true 3D
          }
        : undefined
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 62, // 3D Camera Tilt
      bearing: -20,
      maxPitch: 85
    });

    mapRef.current = map;

    map.on('load', () => {
      // 1. Fit to checkpoints bounds nicely
      if (checkpoints.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        checkpoints.forEach(cp => bounds.extend([cp.lng, cp.lat]));
        map.fitBounds(bounds, {
          padding: 60,
          pitch: 62,
          bearing: -25,
          maxZoom: 15,
          duration: 1200
        });
      }

      // 2. Add Route GeoJSON Line
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

      // Neon Glow background casing
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
          'line-width': 10,
          'line-opacity': 0.35,
          'line-blur': 4
        }
      });

      // Main High-visibility trail line
      map.addLayer({
        id: 'route-trail',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': diffColor,
          'line-width': 4.5,
          'line-dasharray': [1.5, 1.5]
        }
      });

      // 3. Add Custom 3D Checkpoint Markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      checkpoints.forEach((cp, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === checkpoints.length - 1;
        const badgeColor = isFirst ? '#10B981' : isLast ? '#F59E0B' : diffColor;

        const el = document.createElement('div');
        el.className = 'group cursor-pointer flex flex-col items-center';
        el.innerHTML = `
          <div style="
            background: linear-gradient(135deg, ${badgeColor}, #0f172a);
            border: 2px solid #ffffff;
            box-shadow: 0 0 16px ${badgeColor}88, 0 4px 10px rgba(0,0,0,0.5);
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 900;
            font-size: 13px;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          " class="hover:scale-125">
            ${idx + 1}
          </div>
          <div style="
            background: rgba(15, 23, 42, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            padding: 2px 8px;
            border-radius: 9999px;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            margin-top: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          ">
            ${cp.name}
          </div>
        `;

        el.addEventListener('click', () => {
          map.flyTo({
            center: [cp.lng, cp.lat],
            zoom: 15.5,
            pitch: 70,
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

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [checkpoints, difficulty, basemapStyle, terrain3DActive]);

  // Smooth Cinematic Flyover Mode
  const startFlyover = () => {
    const map = mapRef.current;
    if (!map || checkpoints.length < 2) return;

    if (isFlying) {
      setIsFlying(false);
      map.stop();
      return;
    }

    setIsFlying(true);
    let targetIndex = 0;

    const flyToNext = () => {
      if (targetIndex >= checkpoints.length) {
        targetIndex = 0; // Loop or finish
      }

      const cp = checkpoints[targetIndex];
      const nextCp = checkpoints[(targetIndex + 1) % checkpoints.length];

      // Calculate bearing angle to next checkpoint
      const y = Math.sin((nextCp.lng - cp.lng) * Math.PI / 180) * Math.cos(nextCp.lat * Math.PI / 180);
      const x = Math.cos(cp.lat * Math.PI / 180) * Math.sin(nextCp.lat * Math.PI / 180) -
                Math.sin(cp.lat * Math.PI / 180) * Math.cos(nextCp.lat * Math.PI / 180) * Math.cos((nextCp.lng - cp.lng) * Math.PI / 180);
      const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

      map.flyTo({
        center: [cp.lng, cp.lat],
        zoom: 14.8,
        pitch: 72,
        bearing: bearing,
        speed: 0.4,
        curve: 1.4,
        essential: true
      });

      targetIndex++;
    };

    flyToNext();
    map.on('moveend', () => {
      if (mapRef.current && isFlying) {
        setTimeout(flyToNext, 1200);
      }
    });
  };

  const resetView = () => {
    const map = mapRef.current;
    if (!map || checkpoints.length === 0) return;
    setIsFlying(false);
    map.stop();

    const bounds = new maplibregl.LngLatBounds();
    checkpoints.forEach(cp => bounds.extend([cp.lng, cp.lat]));
    map.fitBounds(bounds, {
      padding: 60,
      pitch: 62,
      bearing: -20,
      duration: 1500
    });
  };

  const toggleTerrain = () => {
    setTerrain3DActive(prev => !prev);
  };

  return (
    <div className="relative w-full h-[380px] rounded-[2.5rem] overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] bg-slate-950 select-none">
      {/* MapLibre 3D WebGL Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Left Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-xl">
        <Mountain className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="tracking-wider uppercase text-[10px]">Relieve Satelital 3D Real (DEM)</span>
      </div>

      {/* Top Right Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-white/15 shadow-xl">
        <button
          onClick={() => setBasemapStyle(s => s === 'satellite' ? 'topo' : 'satellite')}
          title="Cambiar capa satélite / calles"
          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
            basemapStyle === 'satellite' ? 'bg-primary text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{basemapStyle === 'satellite' ? 'Satélite Real' : 'Topográfico'}</span>
        </button>

        <button
          onClick={toggleTerrain}
          title="Alternar elevación 3D de montañas"
          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
            terrain3DActive ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>3D DEM</span>
        </button>
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={startFlyover}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-all active:scale-95 ${
              isFlying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
            }`}
          >
            {isFlying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Detener Vuelo</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Sobrevolar Ruta 3D</span>
              </>
            )}
          </button>

          <button
            onClick={resetView}
            title="Restablecer vista aérea"
            className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/15 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-[10px] text-slate-300 shadow-xl pointer-events-auto">
          <span>Click derecho / 2 dedos para inclinar 3D</span>
        </div>
      </div>
    </div>
  );
};
