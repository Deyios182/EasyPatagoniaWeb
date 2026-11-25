import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number | undefined, lng: number | undefined) => void;
}

const AYSEN_ZONES = [
  { name: 'Coyhaique', lat: -45.5752, lng: -72.0662, zoom: 12 },
  { name: 'Pto. Aysén', lat: -45.4068, lng: -72.6977, zoom: 12 },
  { name: 'Río Tranquilo', lat: -46.6245, lng: -72.6745, zoom: 12 },
  { name: 'Chile Chico', lat: -46.5376, lng: -71.7294, zoom: 12 },
  { name: 'Cochrane', lat: -47.2539, lng: -72.5732, zoom: 12 },
  { name: 'La Junta', lat: -43.9746, lng: -72.4058, zoom: 12 },
];

const DEFAULT_CENTER: [number, number] = [-45.5752, -72.0662];

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [expanded, setExpanded] = useState(false);

  onChangeRef.current = onChange;

  const createPinIcon = () =>
    L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
          <div style="
            width:28px;height:28px;border-radius:50%;
            background:#ef4444;border:3px solid #ffffff;
            box-shadow:0 4px 12px rgba(0,0,0,0.45);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:14px;font-weight:900;
          ">📍</div>
          <div style="
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:8px solid #ef4444;
            margin-top:-2px;
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  const placeOrMoveMarker = (map: L.Map, lat: number, lng: number) => {
    const roundedLat = Number(lat.toFixed(5));
    const roundedLng = Number(lng.toFixed(5));

    if (markerRef.current) {
      markerRef.current.setLatLng([roundedLat, roundedLng]);
    } else {
      const marker = L.marker([roundedLat, roundedLng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
      });

      markerRef.current = marker;
    }

    onChangeRef.current(roundedLat, roundedLng);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);
    const center: [number, number] = hasCoords ? [latitude!, longitude!] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: hasCoords ? 13 : 8,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    if (hasCoords) {
      const marker = L.marker(center, {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
      });

      markerRef.current = marker;
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeOrMoveMarker(map, e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sincronizar cambios externos (ej. cuando editan el input numérico o limpian)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);
    if (hasCoords) {
      if (markerRef.current) {
        const cur = markerRef.current.getLatLng();
        if (Math.abs(cur.lat - latitude!) > 0.00001 || Math.abs(cur.lng - longitude!) > 0.00001) {
          markerRef.current.setLatLng([latitude!, longitude!]);
          map.panTo([latitude!, longitude!]);
        }
      } else {
        const marker = L.marker([latitude!, longitude!], {
          icon: createPinIcon(),
          draggable: true,
        }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChangeRef.current(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
        });
        markerRef.current = marker;
        map.panTo([latitude!, longitude!]);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [latitude, longitude]);

  // Ajustar tamaño al expandir/contraer
  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [expanded]);

  const jumpToZone = (lat: number, lng: number, zoom: number) => {
    mapRef.current?.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 });
  };

  return (
    <div className="space-y-3">
      {/* Accesos rápidos a zonas */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Ir a:</span>
        {AYSEN_ZONES.map((z) => (
          <button
            key={z.name}
            type="button"
            onClick={() => jumpToZone(z.lat, z.lng, z.zoom)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/40 text-[10px] font-bold text-slate-300 transition-all"
          >
            {z.name}
          </button>
        ))}
      </div>

      {/* Mapa interactivo */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950">
        <div
          ref={containerRef}
          className={`w-full transition-all duration-200 ${expanded ? 'h-96' : 'h-60'}`}
          style={{ zIndex: 1 }}
        />

        {/* Controles flotantes sobre el mapa */}
        <div className="absolute top-2.5 right-2.5 z-[400] flex gap-2">
          {latitude != null && longitude != null && (
            <button
              type="button"
              onClick={() => onChange(undefined, undefined)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-red-500/90 text-slate-200 hover:text-white border border-white/15 text-[10px] font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-1"
              title="Quitar ubicación del mapa"
            >
              <span className="material-symbols-outlined text-xs">close</span>
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/15 text-[10px] font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-1"
            title={expanded ? 'Reducir mapa' : 'Ampliar mapa'}
          >
            <span className="material-symbols-outlined text-xs">
              {expanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
            {expanded ? 'Reducir' : 'Ampliar'}
          </button>
        </div>

        {/* Ayuda inferior */}
        <div className="bg-slate-950/90 border-t border-white/10 px-3 py-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>🖱️ Haz clic en la ruta para marcar el corte (puedes arrastrar el pin)</span>
          {latitude != null && longitude != null ? (
            <span className="font-mono text-teal-400 font-bold">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          ) : (
            <span className="text-slate-500">Sin ubicación</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerMap;
