import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { supabase } from '../supabaseClient';
import { MapPin, Compass, Navigation, Award, CheckCircle2, ChevronRight, Lock, Map, RefreshCw, AlertCircle, Info } from 'lucide-react';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { Route3DViewer } from '../components/Route3DViewer';
import L from 'leaflet';
import { Box, Sparkles } from 'lucide-react';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface EasyRoute {
  id: string;
  name: string;
  description: string;
  total_km: number;
  difficulty: string;
  image_url: string;
  xp_reward: number;
  checkpoints: Checkpoint[];
  medal_slug: string | null;
  is_active: boolean;
}

interface Checkpoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  image_url?: string;
  xp_reward: number;
}

interface RouteProgress {
  route_id: string;
  checkpoints_completed: string[];
  completed_at: string | null;
}

interface MedalInfo {
  slug: string;
  name: string;
  icon: string;
}

// Helper to calculate distance between two coordinates in meters (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

const DIFFICULTY_BADGES: Record<string, string> = {
  'Fácil': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Moderado': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Difícil': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Extremo': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const EasyRoutesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, supabaseUser } = useAppAuth();

  const [routes, setRoutes] = useState<EasyRoute[]>([]);
  const [progressList, setProgressList] = useState<RouteProgress[]>([]);
  const [medals, setMedals] = useState<MedalInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<EasyRoute | null>(null);
  const [loading, setLoading] = useState(true);

  // Check-in state
  const [checkingIn, setCheckingIn] = useState<string | null>(null); // checkpoint id
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [farModal, setFarModal] = useState<{
    checkpoint: Checkpoint;
    userLat: number;
    userLng: number;
    distanceKm: number;
    route: EasyRoute;
  } | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<{
    title: string;
    xp: number;
    medal?: MedalInfo | null;
  } | null>(null);

  // 2D vs 3D route viewer toggle
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [mapLayerType, setMapLayerType] = useState<'dark' | 'satellite'>('satellite');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const routeMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!selectedRoute || viewMode !== '2d') {
      if (routeMapRef.current) {
        routeMapRef.current.remove();
        routeMapRef.current = null;
      }
      return;
    }

    let mapInstance: L.Map | null = null;
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      mapInstance = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [-46.6225, -72.6745],
        zoom: 12
      });

      const tileUrl = mapLayerType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© Esri'
      }).addTo(mapInstance);

      routeMapRef.current = mapInstance;

      const checkpoints = selectedRoute.checkpoints || [];
      if (checkpoints.length > 0) {
        const bounds = L.latLngBounds([]);
        const latlngs = checkpoints.map((cp) => {
          const pt = L.latLng(cp.lat, cp.lng);
          bounds.extend(pt);
          return pt;
        });

        const getDiffColor = (difficulty: string) => {
          const diff = (difficulty || '').toLowerCase();
          if (diff.includes('fácil') || diff.includes('facil') || diff.includes('easy')) return '#10B981';
          if (diff.includes('moderado') || diff.includes('moderate') || diff.includes('medio')) return '#3B82F6';
          if (diff.includes('difícil') || diff.includes('dificil') || diff.includes('hard')) return '#F59E0B';
          if (diff.includes('extremo') || diff.includes('extreme')) return '#EF4444';
          return '#3b82f6';
        };
        const color = getDiffColor(selectedRoute.difficulty);

        L.polyline(latlngs, {
          color: color,
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(mapInstance);

        checkpoints.forEach((cp, idx) => {
          const progress = getProgress(selectedRoute.id);
          const completed = progress.checkpoints_completed.includes(cp.id);
          const markerIcon = L.divIcon({
            className: '',
            html: `
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background-color: ${completed ? '#10B981' : color};
                color: white;
                font-size: 11px;
                font-weight: 900;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              ">
                ${completed ? '✓' : idx + 1}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker([cp.lat, cp.lng], { icon: markerIcon })
            .addTo(mapInstance!)
            .bindPopup(`
              <div style="color: #1e293b; font-family: system-ui; padding: 2px; min-width: 140px;">
                <h4 style="margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase;">${cp.name}</h4>
                <p style="margin: 4px 0 0; font-size: 9px; color: #64748b; line-height: 1.2;">${cp.description || ''}</p>
                <div style="margin-top: 4px; font-size: 9px; font-weight: 700; color: #10B981;">🏆 +${cp.xp_reward} XP</div>
              </div>
            `);
        });

        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstance) {
        mapInstance.remove();
        routeMapRef.current = null;
      }
    };
  }, [selectedRoute, viewMode, mapLayerType]);

  useEffect(() => {
    if (!supabaseUser) {
      navigate('/auth/login');
      return;
    }
    loadData();
  }, [supabaseUser?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch routes, user route progress, and medals
      const [routesRes, progressRes, medalsRes] = await Promise.all([
        supabase.from('easy_routes').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('user_route_progress').select('*').eq('user_id', supabaseUser?.id),
        supabase.from('gamification_medals').select('slug, name, icon').eq('is_active', true),
      ]);

      if (routesRes.error) throw routesRes.error;

      setRoutes(routesRes.data || []);
      setProgressList(progressRes.data || []);
      setMedals(medalsRes.data || []);
    } catch (err) {
      console.error('Error loading routes data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [autoTrackingEnabled, setAutoTrackingEnabled] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  // Automatic GPS Geofencing Check-in
  useEffect(() => {
    if (!selectedRoute || !supabaseUser || !autoTrackingEnabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('La geolocalización no está soportada en este dispositivo.');
      return;
    }

    const checkAutomaticProximity = async (userLat: number, userLng: number) => {
      const progress = getProgress(selectedRoute.id);
      const pendingCheckpoints = (selectedRoute.checkpoints || []).filter(
        cp => !progress.checkpoints_completed.includes(cp.id)
      );

      for (const cp of pendingCheckpoints) {
        const distance = calculateDistance(userLat, userLng, cp.lat, cp.lng);
        // Automatic checkin when user passes within 1.0 km radius (1000m)
        if (distance <= 1000 && checkingIn !== cp.id) {
          console.log(`📍 [AUTO-CHECKIN] Auto-completado en: ${cp.name} (Distancia: ${Math.round(distance)}m)`);
          await executeCheckin(selectedRoute, cp);
          break;
        }
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGpsError(null);
        checkAutomaticProximity(latitude, longitude);
      },
      (err) => {
        console.warn('GPS Watcher warning:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [selectedRoute, progressList, autoTrackingEnabled, supabaseUser?.id, checkingIn]);

  const getProgress = (routeId: string): RouteProgress => {
    return progressList.find(p => p.route_id === routeId) || {
      route_id: routeId,
      checkpoints_completed: [],
      completed_at: null,
    };
  };

  const getPercent = (route: EasyRoute) => {
    const total = (route.checkpoints || []).length;
    if (total === 0) return 0;
    const progress = getProgress(route.id);
    return Math.round((progress.checkpoints_completed.length / total) * 100);
  };

  const handleCheckpointCheckin = async (route: EasyRoute, checkpoint: Checkpoint) => {
    const progress = getProgress(route.id);
    if (progress.checkpoints_completed.includes(checkpoint.id)) return;

    setCheckingIn(checkpoint.id);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('La geolocalización no está soportada por tu navegador.');
      setCheckingIn(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(latitude, longitude, checkpoint.lat, checkpoint.lng);
        const maxRadius = 1000; // 1 km radius to complete

        if (distance <= maxRadius) {
          // Success! Complete check-in
          await executeCheckin(route, checkpoint);
        } else {
          // User is too far
          setFarModal({
            checkpoint,
            userLat: latitude,
            userLng: longitude,
            distanceKm: parseFloat((distance / 1000).toFixed(2)),
            route,
          });
          setCheckingIn(null);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsError('No se pudo obtener tu ubicación. Verifica los permisos de GPS.');
        setCheckingIn(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const executeCheckin = async (route: EasyRoute, checkpoint: Checkpoint, forceSimulate: boolean = false) => {
    if (!supabaseUser) return;
    try {
      setCheckingIn(checkpoint.id);
      const progress = getProgress(route.id);
      const updatedCheckpoints = [...progress.checkpoints_completed, checkpoint.id];
      const isRouteCompletedNow = updatedCheckpoints.length === (route.checkpoints || []).length;
      const completedAt = isRouteCompletedNow ? new Date().toISOString() : null;

      // 1. Update user route progress table
      const { error: progressError } = await supabase.from('user_route_progress').upsert({
        user_id: supabaseUser.id,
        route_id: route.id,
        checkpoints_completed: updatedCheckpoints,
        completed_at: completedAt,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id,route_id' });

      if (progressError) throw progressError;

      // 2. Grant checkpoint XP reward
      const reasonCheckpoint = `checkin_${route.id}_${checkpoint.id}`;
      const notesCheckpoint = `Check-in en checkpoint: ${checkpoint.name} (${route.name})`;
      
      const { error: xpError } = await supabase.rpc('grant_xp_to_user', {
        p_user_id: supabaseUser.id,
        p_amount: checkpoint.xp_reward,
        p_reason: 'route_checkpoint',
        p_notes: notesCheckpoint,
      });

      if (xpError) throw xpError;

      let awardedMedal: MedalInfo | null = null;

      // 3. Grant Route completion XP and medal if completed
      if (isRouteCompletedNow) {
        const notesRoute = `Completó la ruta: ${route.name}`;
        await supabase.rpc('grant_xp_to_user', {
          p_user_id: supabaseUser.id,
          p_amount: route.xp_reward,
          p_reason: 'route_completed',
          p_notes: notesRoute,
        });

        // Award medal if slug is assigned
        if (route.medal_slug) {
          const { data: alreadyHasMedal } = await supabase
            .from('user_medals')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .eq('medal_slug', route.medal_slug)
            .maybeSingle();

          if (!alreadyHasMedal) {
            await supabase.from('user_medals').insert({
              user_id: supabaseUser.id,
              medal_slug: route.medal_slug,
              awarded_by: supabaseUser.id,
            });
            awardedMedal = medals.find(m => m.slug === route.medal_slug) || null;
          }
        }
      }

      // Success visual feedback
      setSuccessAnimation({
        title: isRouteCompletedNow ? `¡Ruta completada: ${route.name}! 🎉` : `¡Check-in en ${checkpoint.name}!`,
        xp: checkpoint.xp_reward + (isRouteCompletedNow ? route.xp_reward : 0),
        medal: awardedMedal,
      });

      // Reload local data
      await loadData();
      if (selectedRoute && selectedRoute.id === route.id) {
        const updatedRoute = routes.find(r => r.id === route.id);
        if (updatedRoute) {
          setSelectedRoute({
            ...updatedRoute,
            checkpoints: route.checkpoints,
          });
        }
      }
    } catch (err) {
      console.error('Error executing checkin:', err);
    } finally {
      setCheckingIn(null);
      setFarModal(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-900 text-white items-center pb-24">
      <div className="w-full max-w-2xl px-4 pt-12">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">Easy Patagonia</p>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Easy Rutas
            </h1>
          </div>
          <button 
            onClick={() => loadData()} 
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* ── SUCCESS ANIMATION TOAST / MODAL ──────────────────────────────── */}
        {successAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 p-8 rounded-[2rem] max-w-md w-full text-center shadow-2xl flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
                <Award className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{successAnimation.title}</h2>
              <p className="text-sm text-slate-400 mb-6">Has demostrado tu espíritu de explorador austral.</p>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl py-3 px-6 mb-6 inline-flex items-center gap-2 text-amber-400">
                <span className="font-black text-xl">+{successAnimation.xp} XP</span>
                <span className="text-xs font-bold uppercase tracking-wider">Obtenidos</span>
              </div>

              {successAnimation.medal && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-6 w-full flex items-center gap-4 text-left">
                  <span className="text-4xl">{successAnimation.medal.icon}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">¡Nueva medalla ganada!</p>
                    <p className="font-bold text-white text-base leading-tight">{successAnimation.medal.name}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSuccessAnimation(null)}
                className="w-full py-4 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* ── FAR AWAY / GPS SIMULATOR MODAL ───────────────────────────────── */}
        {farModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertCircle className="w-8 h-8 flex-shrink-0" />
                <h3 className="font-black text-lg uppercase italic tracking-tighter">Estás demasiado lejos</h3>
              </div>
              
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Tu ubicación GPS actual está a <strong className="text-white">{farModal.distanceKm} km</strong> del checkpoint <strong className="text-white">{farModal.checkpoint.name}</strong>.
              </p>
              
              <div className="bg-slate-950 p-4 rounded-2xl mb-6 text-xs border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordenadas del Checkpoint:</span>
                  <span className="font-mono text-slate-300">{farModal.checkpoint.lat}, {farModal.checkpoint.lng}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tu ubicación:</span>
                  <span className="font-mono text-slate-300">{farModal.userLat.toFixed(4)}, {farModal.userLng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Radio de Check-in:</span>
                  <span className="text-slate-300">1.0 km</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => executeCheckin(farModal.route, farModal.checkpoint, true)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  🚀 Simular Check-in (Pruebas)
                </button>
                <button
                  onClick={() => setFarModal(null)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING STATE ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 h-32 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : selectedRoute ? (
          /* ── DETAIL VIEW ────────────────────────────────────────────────── */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedRoute(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
              >
                <Navigation className="w-4 h-4 rotate-270" /> Volver a las Rutas
              </button>

              {/* View Switcher: 2D vs 3D Relieve */}
              <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-white/10 shadow-lg">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    viewMode === '3d'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Relieve 3D</span>
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    viewMode === '2d'
                      ? 'bg-white/15 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Mapa 2D</span>
                </button>
              </div>
            </div>

            {/* ROUTE VIEWER: 3D or 2D */}
            {viewMode === '3d' ? (
              <div className="mb-6">
                <Route3DViewer
                  checkpoints={selectedRoute.checkpoints || []}
                  routeName={selectedRoute.name}
                  difficulty={selectedRoute.difficulty}
                  onSelectCheckpoint={(cp) => {
                    console.log('Selected 3D checkpoint:', cp);
                  }}
                />
              </div>
            ) : (
              <div 
                ref={mapContainerRef} 
                style={{ height: '320px' }} 
                className="relative w-full rounded-[2.5rem] overflow-hidden mb-6 border border-white/10 shadow-2xl z-10"
              >
                {/* 2D Layer toggle (Satélite vs Oscuro) */}
                <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapLayerType('satellite');
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      mapLayerType === 'satellite' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Satélite
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapLayerType('dark');
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                      mapLayerType === 'dark' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Oscuro
                  </button>
                </div>

                {getProgress(selectedRoute.id).completed_at && (
                  <div className="absolute top-4 right-4 bg-emerald-500/95 text-white px-4 py-2 rounded-full flex items-center gap-1.5 shadow-lg border border-emerald-400/20 z-[1000]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Completada</span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${DIFFICULTY_BADGES[selectedRoute.difficulty] || 'bg-slate-500/10 text-slate-500'}`}>
                    {selectedRoute.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{selectedRoute.total_km} km totales</span>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    ⚡ +{selectedRoute.xp_reward} XP Final
                  </span>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedRoute.name}</h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{selectedRoute.description}</p>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('tracked_route_id', selectedRoute.id);
                  navigate('/map');
                }}
                className="w-full py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-primary/90 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary/20"
              >
                <MapPin className="w-4 h-4" /> Trazar misión en el Mapa Principal
              </button>

              {/* Progress bar */}
              <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso de la Ruta</span>
                  <span className="text-[10px] font-black text-emerald-400">
                    {getProgress(selectedRoute.id).checkpoints_completed.length} de {(selectedRoute.checkpoints || []).length} completados
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                    style={{ width: `${getPercent(selectedRoute)}%` }} 
                  />
                </div>
              </div>

              {/* Checkpoints list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Puntos de Control (Check-ins)</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Auto Check-in GPS Activo</span>
                  </div>
                </div>
                
                {(selectedRoute.checkpoints || []).map((cp, idx) => {
                  const isCompleted = getProgress(selectedRoute.id).checkpoints_completed.includes(cp.id);
                  const isChecking = checkingIn === cp.id;

                  return (
                    <div 
                      key={cp.id || idx} 
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-sm ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                            {cp.name}
                          </p>
                          <span className={`text-[10px] font-black ${isCompleted ? 'text-emerald-400/70' : 'text-amber-500'}`}>
                            +{cp.xp_reward} XP
                          </span>
                        </div>
                        {cp.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cp.description}</p>}
                        
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {cp.lat}, {cp.lng}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {isCompleted ? (
                          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completado
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            Auto-detección
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error GPS Info */}
              {gpsError && (
                <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <p>{gpsError}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── ROUTE LIST VIEW ────────────────────────────────────────────── */
          <div className="space-y-4 animate-in fade-in duration-300">
            {routes.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center">
                <Compass className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Aún no hay rutas creadas</h3>
                <p className="text-sm text-slate-400 mt-2">Próximamente se añadirán rutas oficiales de Patagonia en esta sección.</p>
              </div>
            ) : (
              routes.map(route => {
                const percent = getPercent(route);
                const progress = getProgress(route.id);
                const isCompleted = !!progress.completed_at;

                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className="group bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 cursor-pointer shadow-xl"
                  >
                    {route.image_url && (
                      <div className="relative h-44 w-full overflow-hidden">
                        <img 
                          src={route.image_url} 
                          alt={route.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                        
                        {isCompleted && (
                          <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${DIFFICULTY_BADGES[route.difficulty] || 'bg-slate-500/10 text-slate-500'}`}>
                              {route.difficulty}
                            </span>
                            <span className="text-[10px] text-slate-400">{route.total_km} km</span>
                          </div>
                          <h3 className="text-xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">
                            {route.name}
                          </h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {route.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          <span>Progreso</span>
                          <span className="text-slate-400">
                            {progress.checkpoints_completed.length} / {(route.checkpoints || []).length} Checkpoints
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
      <BottomNavigationBar />
    </div>
  );
};

export default EasyRoutesScreen;
