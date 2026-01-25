"use client";
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Importación de pantallas
import WelcomeScreen from './screens/WelcomeScreen';
import LandingPage from './screens/LandingPage';
import SplashScreen from './screens/SplashScreen';
import TouristMapScreen from './screens/TouristMapScreen';
import BusinessDetailsScreen from './screens/BusinessDetailsScreen';
import PlannerScreen from './screens/PlannerScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatBotScreen from './screens/ChatBotScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import HighlightsScreen from './screens/HighlightsScreen';
import BusinessPortalScreen from './screens/BusinessPortalScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import EasyAdminFieldScreen from './screens/EasyAdminFieldScreen';
import BusinessDirectoryScreen from './screens/BusinessDirectoryScreen';
import UserAdminScreen from './screens/UserAdminScreen';
import LandingAdminScreen from './screens/LandingAdminScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AttractionDetailsScreen from './screens/AttractionDetailsScreen';
import AuthCallbackScreen from './screens/AuthCallbackScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider as SupabaseAuthProvider, useAuth } from './contexts/AuthContext';
import { Role, User, Business, MapTheme, Currency, SavedItinerary, Attraction, Locality } from './types';
// import { getLocalizedBusinesses } from './constants'; // Deleted


// --- CONFIGURACIÓN DE IDIOMAS (Sin cambios) ---
type Language = 'ES' | 'EN' | 'PT';
// ... (Mantenemos el objeto translations igual para no alargar el código, asumo que ya lo tienes) ...
const translations: Record<Language, Record<string, string>> = {
  ES: { welcome: "Bienvenido", map: "Mapa", list: "Colaboradores", discover: "Imperdibles", ai: "EasyAI", profile: "Perfil", how_to_get: "Cómo llegar / Traslado Local", search_placeholder: "¿Qué buscas hoy en Aysén?...", all: "Todos", restaurant: "Restaurante", hotel: "Hospedaje", activity: "Actividad", transport: "Transporte", natural: "Natural", my_account: "Mi Cuenta", settings: "Configuración", language: "Idioma", map_style: "Estilo del Mapa", currency_label: "Divisa", apply_changes: "Aplicar y Guardar", logout: "Cerrar Sesión", hero_title: "Aysén te espera.", hero_subtitle: "Tú disfruta, nosotros resolvemos.", start_btn: "Comenzar Exploración", chat_placeholder: "Pregunta sobre rutas, precios...", directory_title: "DIRECTORIO", ai_guide_title: "Guía Inteligente", ai_status: "Sincronizado", itinerary_title: "PLANIFICADOR AI", back: "Volver", verified_ops: "Operadores Verificados", view_profile: "Ver Perfil", explore_place: "Explorar Lugar", discovery_title: "DESCUBRE AYSÉN", discovery_subtitle: "Guía de Imperdibles", business_status_open: "Abierto", business_status_closed: "Cerrado", business_description_label: "Descripción del local", business_offer: "Nuestra Oferta", contact_direct: "Mensaje Directo al Local", consult_service: "Consultar Servicio", schedule_label: "Horarios", location_label: "Ubicación", save_trip: "Guardar en Perfil", my_trips: "Mis Viajes", no_trips: "Aún no tienes rutas guardadas", nav_functions: "Funciones", nav_destinations: "Destinos", nav_vision: "Visión", nav_contact: "Contacto", nav_faq: "FAQ", enter_app: "Ingresar", go_to_map: "Ir al Mapa" },
  EN: { welcome: "Welcome", map: "Map", list: "Partners", discover: "Explore", ai: "EasyAI", profile: "Profile", how_to_get: "How to get / Local Transfers", search_placeholder: "Search for services...", all: "All", restaurant: "Restaurant", hotel: "Hotel", activity: "Activity", transport: "Transport", natural: "Natural", my_account: "My Account", settings: "Settings", language: "Language", map_style: "Map Style", currency_label: "Currency", apply_changes: "Apply and Save", logout: "Log Out", hero_title: "Aysén awaits.", hero_subtitle: "You enjoy, we solve.", start_btn: "Start Exploration", chat_placeholder: "Ask about routes, prices...", directory_title: "DIRECTORY", ai_guide_title: "Smart Guide", ai_status: "Synced", itinerary_title: "AI PLANNER", back: "Back", verified_ops: "Verified Operators", view_profile: "View Profile", explore_place: "Explore Place", discovery_title: "DISCOVER AYSÉN", discovery_subtitle: "Unmissable Guide", business_status_open: "Open", business_status_closed: "Closed", business_description_label: "Business description", business_offer: "Our Services", contact_direct: "Direct Message to Shop", consult_service: "Enquire Now", schedule_label: "Schedule", location_label: "Location", save_trip: "Save to Profile", my_trips: "My Trips", no_trips: "No saved trips yet", nav_functions: "Features", nav_destinations: "Destinations", nav_vision: "Vision", nav_contact: "Contact", nav_faq: "FAQ", enter_app: "Enter", go_to_map: "Go to Map" },
  PT: { welcome: "Bem-vindo", map: "Mapa", list: "Parceiros", discover: "Descobrir", ai: "EasyAI", profile: "Perfil", how_to_get: "Como chegar / Traslado", search_placeholder: "O que você procura?...", all: "Todos", restaurant: "Restaurante", hotel: "Hospedagem", activity: "Atividade", transport: "Transporte", natural: "Natural", my_account: "Minha Conta", settings: "Configuração", language: "Idioma", map_style: "Estilo do Mapa", currency_label: "Moeda", apply_changes: "Aplicar e Salvar", logout: "Sair", hero_title: "Aysén te espera.", hero_subtitle: "Você aproveita, nós resolvemos.", start_btn: "Iniciar Exploração", chat_placeholder: "Pergunte sobre rotas, precios...", directory_title: "DIRETÓRIO", ai_guide_title: "Guia Inteligente", ai_status: "Sincronizado", itinerary_title: "PLANEJADOR AI", back: "Voltar", verified_ops: "Operadores Verificados", view_profile: "Ver Perfil", explore_place: "Explorar Lugar", discovery_title: "DESCUBRA AYSÉN", discovery_subtitle: "Guia Imperdível", business_status_open: "Aberto", business_status_closed: "Fechado", business_description_label: "Descrição do local", business_offer: "Nossa Oferta", contact_direct: "Mensagem Direta ao Local", consult_service: "Consultar Servício", schedule_label: "Horário", location_label: "Localização", save_trip: "Salvar no Perfil", my_trips: "Minhas Viagens", no_trips: "Nenhuma viagem salva ainda", nav_functions: "Funcionalidades", nav_destinations: "Destinos", nav_vision: "Visão", nav_contact: "Contato", nav_faq: "FAQ", enter_app: "Entrar", go_to_map: "Ir para o Mapa" }
};

// --- CONTEXTO DE AUTENTICACIÓN ---
interface AuthContextType {
  user: User | null;
  supabaseUser: any | null; // NEW: Raw Supabase user for auth checks
  isAuthenticating: boolean; // NEW: True during auth sync
  loading: boolean; // NEW: Expose loading state
  login: (userData: Partial<User>) => void;
  logout: () => void;
  allBusinesses: Business[];
  updateBusiness: (biz: Business) => void;
  usersRegistry: User[];
  registerUser: (user: User) => void;
  // New Global Data
  allAttractions: Attraction[];
  allLocalities: Locality[];
  companyServices: any[]; // Add companyServices to interface

  language: Language;
  setLanguage: (l: Language) => void;
  mapTheme: MapTheme;
  setMapTheme: (t: MapTheme) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  saveItinerary: (itinerary: SavedItinerary) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  t: (key: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AppAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: supabaseUser, profile, loading } = useAuth();
  const isLoaded = !loading;

  const [appUser, setAppUser] = useState<User | null>(null);
  const currentUserIdRef = React.useRef<string | null>(null); // Track current user without re-renders

  // CONFIGURACIÓN PERSISTENTE
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('ep_language') as Language) || 'ES');
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => (localStorage.getItem('ep_map_theme') as MapTheme) || 'light');
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('ep_currency') as Currency) || 'CLP');

  // const [allBusinesses, setAllBusinesses] = useState<Business[]>(() => getLocalizedBusinesses(language)); // OLD
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [allAttractions, setAllAttractions] = useState<Attraction[]>([]);
  const [allLocalities, setAllLocalities] = useState<Locality[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]); // New state for all services
  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);

  // FETCH BUSINESSES FROM SUPABASE
  useEffect(() => {
    const fetchBusinesses = async () => {
      // 1. Fetch Localities for mapping (avoiding JOIN issues)
      const { data: locs } = await supabase.from('localities').select('id, name');
      const locMap = new Map(locs?.map(l => [l.id, l.name]));

      // 2. Query Companies with Services
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
                id, name, description, logo_url, category, address, whatsapp, 
                latitude, longitude, gallery_urls, locality_id, owner_id, is_active, created_at,
                services (*)
            `)
        .eq('is_active', true);

      if (error) {
        console.error("Error loading businesses:", error);
        return;
      }

      // Map to Business Type
      if (companies) {
        console.log('📊 [APP] Raw companies data sample:', companies.slice(0, 2).map(c => ({
          name: c.name,
          locality_id: c.locality_id,
          locality_name_mapped: locMap.get(c.locality_id),
          gallery_urls: c.gallery_urls,
          logo_url: c.logo_url
        })));
        const mapped: Business[] = companies.map(c => ({
          id: c.id,
          name: c.name,
          nombre: c.name, // Legacy
          locality_id: c.locality_id, // Necesario para filtro de localidad
          locality_name: locMap.get(c.locality_id), // Nombre para UI (Mapeado manualmente)
          categoria: c.category,
          description: c.description,

          // Location & Contact
          // Location & Contact
          gps: (function () {
            const parse = (val: any) => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
              return 0;
            };
            const lat = parse(c.latitude);
            const lng = parse(c.longitude);
            return (lat && lng) ? { lat, lng } : undefined;
          })(),
          lat: (function () {
            const parse = (val: any) => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
              return 0;
            };
            return parse(c.latitude);
          })(),
          lng: (function () {
            const parse = (val: any) => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
              return 0;
            };
            return parse(c.longitude);
          })(),

          // Contact
          contacto: { whatsapp: c.whatsapp, email: "", web: "" },

          // UI Info
          info: {
            descripcion: c.description,
            direccion: c.address,
            horario: "09:00 - 19:00" // Default for now
          },

          // Media
          media: {
            logo_url: c.logo_url || "https://placehold.co/100",
            fotos_url: c.gallery_urls || ["https://placehold.co/600x400"]
          },
          // Important for Map
          priority: 0,
          isOpen: c.is_active,
          is_active: c.is_active, // Fix lint error

          // Services
          services: c.services?.map((s: any) => ({
            id: s.id,
            nombre: s.name,
            precio: s.price,
            descripcion: s.description,
            foto_url: s.image_url || c.gallery_urls?.[0] || "https://placehold.co/400"
          })) || [],

          // Legacy alias ('servicios') to prevent crash in TouristMapScreen
          servicios: c.services?.map((s: any) => ({
            id: s.id,
            nombre: s.name,
            precio: s.price,
            descripcion: s.description,
            foto_url: s.image_url || c.gallery_urls?.[0] || "https://placehold.co/400"
          })) || [],

          // Ratings & Metadata
          rating: 5.0, // Default until reviews implemented
          reviewCount: 0
        }));
        setAllBusinesses(mapped);

        // FLATTEN SERVICES FOR GLOBAL ACCESS
        const services = mapped.flatMap(b => b.services || []);
        setAllServices(services);

      }
    };

    fetchBusinesses();

    // FETCH LOCATIONS & ATTRACTIONS
    const fetchDiscoveryData = async () => {
      // Localities
      const { data: locs } = await supabase.from('localities').select('*').eq('is_active', true);
      if (locs) setAllLocalities(locs);

      // Attractions
      const { data: attrs } = await supabase.from('attractions').select('*').eq('is_active', true);
      if (attrs) setAllAttractions(attrs);
    };

    fetchDiscoveryData();

  }, []); // Run once on mount

  // EFECTO PARA MODO CLARO/OSCURO
  useEffect(() => {
    const root = window.document.documentElement;
    if (mapTheme === 'light') root.classList.remove('dark');
    else root.classList.add('dark');

    localStorage.setItem('ep_language', language);
    localStorage.setItem('ep_map_theme', mapTheme);
    localStorage.setItem('ep_currency', currency);
  }, [language, mapTheme, currency]);

  // OPTIMIZED: User sync with lazy itinerary loading
  useEffect(() => {
    const syncUserRole = async () => {
      // Case 1: User is logged in with profile
      if (isLoaded && supabaseUser && profile) {
        const userId = supabaseUser.id;

        // Skip sync if we already have this user loaded
        if (currentUserIdRef.current === userId) {
          return;
        }

        // Mapear roles de Supabase a roles de la app
        let assignedRole: Role = 'Turista';
        if (profile.roles && profile.roles.length > 0) {
          const primaryRole = profile.roles[0];
          if (primaryRole === 'super_admin') assignedRole = 'SuperAdmin';
          else if (primaryRole === 'admin') assignedRole = 'SuperAdmin';
          else if (primaryRole === 'business_owner') assignedRole = 'DueñoEmpresa';
          else if (primaryRole === 'collaborator') assignedRole = 'EasyColaborador';
          else assignedRole = 'Turista';
        }

        const newUser: User = {
          uid: userId,
          name: profile.full_name || profile.first_name || 'Viajero',
          email: profile.email || '',
          rol: assignedRole,
          avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          savedItineraries: [] // Lazy load when needed
        };

        // Update ref BEFORE state to prevent race conditions
        currentUserIdRef.current = userId;
        setAppUser(newUser);

        // LAZY LOAD: Fetch itineraries in background (non-blocking)
        supabase
          .from('saved_itineraries')
          .select('*')
          .eq('user_id', userId)
          .then(({ data: savedTrips, error: tripsError }) => {
            if (savedTrips && !tripsError) {
              const mapped: SavedItinerary[] = savedTrips.map(t => ({
                id: t.id,
                createdAt: t.created_at || new Date().toISOString(),
                days: t.days,
                budget: t.budget,
                categories: t.categories,
                plan: t.plan || t.items
              }));
              setAppUser(prev => prev ? { ...prev, savedItineraries: mapped } : null);
            }
          });

        // Case 2: Auth is loaded but no user (logged out)
      } else if (isLoaded && !supabaseUser) {
        if (currentUserIdRef.current) {
          currentUserIdRef.current = null;
          setAppUser(null);
        }
      }
    };

    syncUserRole();
  }, [isLoaded, supabaseUser, profile]);

  // REMOVED: getLocalizedBusinesses no longer exists. 
  // TODO: Refetch or filter existing businesses when language changes if strictly needed.
  // For now, names come from DB directly.
  /*
  useEffect(() => {
    setAllBusinesses(getLocalizedBusinesses(language));
  }, [language]);
  */

  const t = (key: string) => translations[language][key] || key;

  const registerUser = (newUser: User) => { setUsersRegistry(prev => [...prev, newUser]); };

  const updateBusiness = (updatedBiz: Business) => {
    setAllBusinesses(prev => {
      const newList = prev.map(b => b.id === updatedBiz.id ? updatedBiz : b);
      if (!prev.find(b => b.id === updatedBiz.id)) newList.push(updatedBiz);
      return newList;
    });
  };

  const logout = async () => {
    // 1. Clear app state FIRST for instant UI update
    currentUserIdRef.current = null;
    setAppUser(null);

    // 2. Clear ONLY auth-related session storage (NOT splash screen flag)
    // Keep ep_splash_seen so splash doesn't show again

    // 3. Sign out from Supabase (async, but UI already updated)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }

    // 4. Clear Supabase auth data from localStorage (optimized)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  };

  const saveItinerary = async (itinerary: SavedItinerary) => {
    if (!appUser) return;

    // Optimistic Update
    setAppUser(prev => prev ? ({ ...prev, savedItineraries: [...(prev.savedItineraries || []), itinerary] }) : null);

    // Persist to Supabase
    // We expect a table 'saved_itineraries' with columns matching our data or a JSONB column.
    // For safety, we'll try to insert flattened data.
    const { error } = await supabase.from('saved_itineraries').insert([{
      id: itinerary.id,
      user_id: appUser.uid,
      created_at: itinerary.createdAt,
      days: itinerary.days,
      budget: itinerary.budget,
      categories: itinerary.categories,
      plan: itinerary.plan
    }]);

    if (error) {
      console.error('Error saving itinerary to Supabase:', error);
      // Optionally rollback state or show notification
    }
  };

  const deleteItinerary = async (id: string) => {
    if (!appUser) return;
    setAppUser(prev => prev ? ({ ...prev, savedItineraries: (prev.savedItineraries || []).filter(i => i.id !== id) }) : null);

    await supabase.from('saved_itineraries').delete().eq('id', id);
  };

  return (
    <AuthContext.Provider value={{
      user: appUser,
      supabaseUser: supabaseUser, // NEW: Expose raw Supabase user for auth checks
      isAuthenticating: loading, // True if authentication is in progress
      loading: loading, // EXPOSE LOADING
      login: () => { }, logout,
      allBusinesses, updateBusiness, usersRegistry, registerUser,
      allAttractions,
      allLocalities,
      companyServices: allServices,
      language, setLanguage, mapTheme, setMapTheme, currency, setCurrency,
      saveItinerary, deleteItinerary, t
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAppAuth must be used within AuthProvider");
  return context;
};

// --- SIDEBAR (ACTUALIZADO) ---
interface SidebarProps { isCollapsed: boolean; toggle: () => void; }

const NavigationSidebar: React.FC<SidebarProps> = ({ isCollapsed, toggle }) => {
  const location = useLocation();
  const { user, supabaseUser, t } = useAppAuth();
  const { profile, loading: profileLoading } = useAuth(); // Get Supabase profile as fallback

  // if (!user && !supabaseUser) return null; // ALLOW GUEST ACCESS

  // Get Google OAuth metadata as fallback (available immediately after login)
  const googleMeta = supabaseUser?.user_metadata;
  const googleName = googleMeta?.full_name || googleMeta?.name;
  const googleAvatar = googleMeta?.avatar_url || googleMeta?.picture;

  // Create display data - prefer appUser, then DB profile, then Google metadata
  const displayName = user?.name || profile?.full_name || googleName || 'Cargando...';
  const displayAvatar = user?.avatar || profile?.avatar_url || googleAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser?.id || 'user'}`;
  const displayRole = user?.rol || (profile?.roles?.includes('super_admin') ? 'SuperAdmin' : 'Cargando...');

  const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} title={isCollapsed ? label : ''} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive ? 'bg-primary text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 no-underline'} ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
        {!isCollapsed && (<span className="font-bold text-sm uppercase tracking-widest leading-none animate-in fade-in duration-300">{label}</span>)}
      </Link>
    );
  };

  return (
    <div className={`hidden md:flex flex-col h-screen bg-[#c0d6df] dark:bg-surface-dark border-r border-slate-300 dark:border-white/5 p-4 shrink-0 z-[100] overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
      <div className="flex items-center justify-center mb-8 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={toggle} title={isCollapsed ? "Expandir menú" : "Ocultar menú"}>
        <img src="/logo_easy.png" alt="Easy Patagonia" className={`object-contain drop-shadow-md transition-all duration-300 ${isCollapsed ? 'h-10 w-10' : 'h-20 w-auto hover:scale-105'}`} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
        {!isCollapsed && <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest px-6 mb-2 leading-none animate-in fade-in">Navegación</p>}
        <NavItem to="/map" icon="map" label={t('map')} />

        <NavItem to="/highlights" icon="grade" label="Imperdibles" />
        <NavItem to="/directory" icon="list_alt" label={t('list')} />
        <div className="my-4 border-t border-slate-300 dark:border-white/5"></div>
        {!isCollapsed && <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest px-6 mb-2 leading-none animate-in fade-in">Inteligencia</p>}
        <NavItem to="/planner" icon="auto_awesome" label={t('ai')} />
        <NavItem to="/chat" icon="smart_toy" label={t('ai_guide_title')} />

        {/* SECCIÓN MI EMPRESA - Solo para DueñoEmpresa y SuperAdmin */}
        {(displayRole === 'DueñoEmpresa' || displayRole === 'SuperAdmin') && (
          <>
            <div className="my-4 border-t border-slate-300 dark:border-white/5"></div>
            {!isCollapsed && <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest px-6 mb-2 leading-none animate-in fade-in">Mi Negocio</p>}
            <NavItem to="/portal" icon="storefront" label="Mi Empresa" />
          </>
        )}
      </div>
      <div className="mt-auto pt-6 border-t border-slate-300 dark:border-white/5 shrink-0">
        {user || supabaseUser ? (
          <Link to="/profile" className={`group flex items-center gap-4 p-3 rounded-3xl transition-all no-underline ${location.pathname === '/profile' ? 'bg-white/50 dark:bg-primary/10 border border-white dark:border-primary/30' : 'hover:bg-white/20 dark:hover:bg-white/5 border border-transparent'} ${isCollapsed ? 'justify-center' : ''}`}>
            <img src={displayAvatar} className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/5 border border-white dark:border-white/10 object-cover" alt="Avatar" />
            {!isCollapsed && (<div className="flex-1 min-w-0 animate-in fade-in duration-300"><p className="text-sm font-black text-slate-700 dark:text-white truncate uppercase italic leading-none">{displayName}</p><p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1 opacity-100 leading-none">{displayRole}</p></div>)}
          </Link>
        ) : (
          <Link to="/auth/login" className={`group flex items-center gap-4 p-3 rounded-3xl transition-all no-underline bg-primary/10 border border-primary/30 hover:bg-primary/20 ${isCollapsed ? 'justify-center' : ''}`}>
            <span className="material-symbols-outlined text-2xl text-primary">login</span>
            {!isCollapsed && (<div className="flex-1 min-w-0 animate-in fade-in duration-300"><p className="text-sm font-black text-primary truncate uppercase italic leading-none">Iniciar Sesión</p><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-100 leading-none">Acceder a AI</p></div>)}
          </Link>
        )}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
const AuthenticatedApp: React.FC = () => {
  const { user, supabaseUser, isAuthenticating, loading } = useAppAuth();
  const role = user?.rol || 'Turista';
  const location = useLocation();

  const [showSplash, setShowSplash] = useState(() => !localStorage.getItem('ep_splash_seen'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSplashFinish = () => {
    setShowSplash(false);
    localStorage.setItem('ep_splash_seen', 'true'); // Changed to localStorage
  };

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  // NEW: Use supabaseUser OR appUser for auth checks to prevent race condition
  const isAuthenticated = !!(supabaseUser || user);

  // NOTE: We no longer block on profile loading. The app proceeds with fallback data
  // and the sidebar/profile will update when the data arrives.

  // Sidebar visible on main app pages (Map, Directory, etc) even for guests
  const isAuthPage = location.pathname === '/' || location.pathname === '/auth/login' || location.pathname === '/auth/register' || location.pathname === '/auth/callback';
  const shouldShowSidebar = !isAuthPage;

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-body selection:bg-primary/30 overflow-hidden transition-colors duration-300">
      {shouldShowSidebar && (<NavigationSidebar isCollapsed={sidebarCollapsed} toggle={() => setSidebarCollapsed(!sidebarCollapsed)} />)}
      <main className="flex-1 relative h-screen overflow-y-auto no-scrollbar transition-all duration-300">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* Pantalla de bienvenida */}
          <Route path="/welcome" element={<WelcomeScreen />} />
          {/* Rutas de Supabase Auth */}
          <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/map" /> : <LoginScreen />} />
          <Route path="/auth/register" element={isAuthenticated ? <Navigate to="/map" /> : <RegisterScreen />} />
          <Route path="/auth/callback" element={<AuthCallbackScreen />} />

          {/* Rutas Públicas (Modo Invitado) */}
          <Route path="/map" element={<TouristMapScreen />} />
          <Route path="/discover" element={<DiscoveryScreen />} />
          <Route path="/highlights" element={<HighlightsScreen />} />
          <Route path="/directory" element={<BusinessDirectoryScreen />} />
          <Route path="/details/:id" element={<BusinessDetailsScreen />} />
          <Route path="/attraction/:id" element={<AttractionDetailsScreen />} />

          {/* Rutas Privadas (Requieren Login) */}
          <Route path="/planner" element={isAuthenticated ? <PlannerScreen /> : <Navigate to="/auth/login" />} />
          <Route path="/itinerary" element={isAuthenticated ? <ItineraryScreen /> : <Navigate to="/auth/login" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfileScreen role={role} /> : <Navigate to="/auth/login" />} />
          <Route path="/chat" element={isAuthenticated ? <ChatBotScreen /> : <Navigate to="/auth/login" />} />

          {/* Rutas Administrativas */}
          <Route path="/portal" element={user && (role === 'DueñoEmpresa' || role === 'SuperAdmin') ? <BusinessPortalScreen /> : <Navigate to="/profile" />} />
          <Route path="/admin" element={user && role === 'SuperAdmin' ? <AdminDashboardScreen /> : <Navigate to="/profile" />} />
          <Route path="/field" element={user && (role === 'EasyColaborador' || role === 'SuperAdmin') ? <EasyAdminFieldScreen /> : <Navigate to="/profile" />} />
          <Route path="/admin/users" element={user && user.rol === 'SuperAdmin' ? <UserAdminScreen /> : <Navigate to="/" />} />
          <Route path="/admin/landing" element={user && user.rol === 'SuperAdmin' ? <LandingAdminScreen /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SupabaseAuthProvider>
      <AppAuthProvider>
        <HashRouter>
          <AuthenticatedApp />
        </HashRouter>
      </AppAuthProvider>
    </SupabaseAuthProvider>
  );
};
export default App;
