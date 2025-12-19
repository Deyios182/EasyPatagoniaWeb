"use client";
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useUser, useClerk, SignInButton } from '@clerk/clerk-react';
import { supabase } from './supabaseClient'; // IMPORTANTE: Tu cliente de base de datos

// Importación de pantallas
import WelcomeScreen from './screens/WelcomeScreen';
import TouristMapScreen from './screens/TouristMapScreen';
import BusinessDetailsScreen from './screens/BusinessDetailsScreen';
import PlannerScreen from './screens/PlannerScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatBotScreen from './screens/ChatBotScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import BusinessPortalScreen from './screens/BusinessPortalScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import EasyAdminFieldScreen from './screens/EasyAdminFieldScreen';
import BusinessDirectoryScreen from './screens/BusinessDirectoryScreen';
import { Role, User, Business, MapTheme, Currency, SavedItinerary } from './types';
import { getLocalizedBusinesses } from './constants';

// --- CONFIGURACIÓN DE IDIOMAS ---
type Language = 'ES' | 'EN' | 'PT';

const translations: Record<Language, Record<string, string>> = {
  ES: {
    welcome: "Bienvenido",
    map: "Mapa",
    list: "Lista",
    discover: "Aysén",
    ai: "EasyAI",
    profile: "Perfil",
    how_to_get: "Cómo llegar / Traslado Local",
    search_placeholder: "¿Qué buscas hoy en Aysén?...",
    all: "Todos",
    restaurant: "Restaurante",
    hotel: "Hospedaje",
    activity: "Actividad",
    transport: "Transporte",
    natural: "Natural",
    my_account: "Mi Cuenta",
    settings: "Configuración",
    language: "Idioma",
    map_style: "Estilo del Mapa",
    currency_label: "Divisa",
    apply_changes: "Aplicar y Guardar",
    logout: "Cerrar Sesión",
    hero_title: "Aysén te espera.",
    hero_subtitle: "Tú disfruta, nosotros resolvemos.",
    start_btn: "Comenzar Exploración",
    chat_placeholder: "Pregunta sobre rutas, precios...",
    directory_title: "DIRECTORIO",
    ai_guide_title: "Guía Inteligente",
    ai_status: "Sincronizado",
    itinerary_title: "PLANIFICADOR AI",
    back: "Volver",
    verified_ops: "Operadores Verificados",
    view_profile: "Ver Perfil",
    explore_place: "Explorar Lugar",
    discovery_title: "DESCUBRE AYSÉN",
    discovery_subtitle: "Guía de Imperdibles",
    business_status_open: "Abierto",
    business_status_closed: "Cerrado",
    business_description_label: "Descripción del local",
    business_offer: "Nuestra Oferta",
    contact_direct: "Mensaje Directo al Local",
    consult_service: "Consultar Servicio",
    schedule_label: "Horarios",
    location_label: "Ubicación",
    save_trip: "Guardar en Perfil",
    my_trips: "Mis Viajes",
    no_trips: "Aún no tienes rutas guardadas",
  },
  EN: {
    welcome: "Welcome",
    map: "Map",
    list: "List",
    discover: "Explore",
    ai: "EasyAI",
    profile: "Profile",
    how_to_get: "How to get / Local Transfers",
    search_placeholder: "Search for services...",
    all: "All",
    restaurant: "Restaurant",
    hotel: "Hotel",
    activity: "Activity",
    transport: "Transport",
    natural: "Natural",
    my_account: "My Account",
    settings: "Settings",
    language: "Language",
    map_style: "Map Style",
    currency_label: "Currency",
    apply_changes: "Apply and Save",
    logout: "Log Out",
    hero_title: "Aysén awaits.",
    hero_subtitle: "You enjoy, we solve.",
    start_btn: "Start Exploration",
    chat_placeholder: "Ask about routes, prices...",
    directory_title: "DIRECTORY",
    ai_guide_title: "Smart Guide",
    ai_status: "Synced",
    itinerary_title: "AI PLANNER",
    back: "Back",
    verified_ops: "Verified Operators",
    view_profile: "View Profile",
    explore_place: "Explore Place",
    discovery_title: "DISCOVER AYSÉN",
    discovery_subtitle: "Unmissable Guide",
    business_status_open: "Open",
    business_status_closed: "Closed",
    business_description_label: "Business description",
    business_offer: "Our Services",
    contact_direct: "Direct Message to Shop",
    consult_service: "Enquire Now",
    schedule_label: "Schedule",
    location_label: "Location",
    save_trip: "Save to Profile",
    my_trips: "My Trips",
    no_trips: "No saved trips yet",
  },
  PT: {
    welcome: "Bem-vindo",
    map: "Mapa",
    list: "Lista",
    discover: "Descobrir",
    ai: "EasyAI",
    profile: "Perfil",
    how_to_get: "Como chegar / Traslado",
    search_placeholder: "O que você procura?...",
    all: "Todos",
    restaurant: "Restaurante",
    hotel: "Hospedagem",
    activity: "Atividade",
    transport: "Transporte",
    natural: "Natural",
    my_account: "Minha Conta",
    settings: "Configuração",
    language: "Idioma",
    map_style: "Estilo do Mapa",
    currency_label: "Moeda",
    apply_changes: "Aplicar e Salvar",
    logout: "Sair",
    hero_title: "Aysén te espera.",
    hero_subtitle: "Você aproveita, nós resolvemos.",
    start_btn: "Iniciar Exploração",
    chat_placeholder: "Pergunte sobre rotas, preços...",
    directory_title: "DIRETÓRIO",
    ai_guide_title: "Guia Inteligente",
    ai_status: "Sincronizado",
    itinerary_title: "PLANEJADOR AI",
    back: "Voltar",
    verified_ops: "Operadores Verificados",
    view_profile: "Ver Perfil",
    explore_place: "Explorar Lugar",
    discovery_title: "DESCUBRA AYSÉN",
    discovery_subtitle: "Guia Imperdível",
    business_status_open: "Aberto",
    business_status_closed: "Fechado",
    business_description_label: "Descrição do local",
    business_offer: "Nossa Oferta",
    contact_direct: "Mensagem Direta ao Local",
    consult_service: "Consultar Serviço",
    schedule_label: "Horário",
    location_label: "Localização",
    save_trip: "Salvar no Perfil",
    my_trips: "Minhas Viagens",
    no_trips: "Nenhuma viagem salva ainda",
  }
};

// --- CONTEXTO DE AUTENTICACIÓN ---
interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User>) => void;
  logout: () => void;
  allBusinesses: Business[];
  updateBusiness: (biz: Business) => void;
  usersRegistry: User[];
  registerUser: (user: User) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  mapTheme: MapTheme;
  setMapTheme: (t: MapTheme) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  saveItinerary: (itinerary: SavedItinerary) => void;
  deleteItinerary: (id: string) => void;
  t: (key: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // CLERK HOOKS
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [appUser, setAppUser] = useState<User | null>(null);

  // CONFIGURACIÓN PERSISTENTE
  const [language, setLanguage] = useState<Language>(() => 
    (localStorage.getItem('ep_language') as Language) || 'ES'
  );
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => 
    (localStorage.getItem('ep_map_theme') as MapTheme) || 'dark'
  );
  const [currency, setCurrency] = useState<Currency>(() => 
    (localStorage.getItem('ep_currency') as Currency) || 'CLP'
  );

  // CARGA DE DATOS LOCALES (Fallback)
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(() => {
    return getLocalizedBusinesses(language);
  });
  const [usersRegistry, setUsersRegistry] = useState<User[]>([]);

  // --- SINCRONIZACIÓN DE ROLES CON SUPABASE ---
  useEffect(() => {
    const syncUserRole = async () => {
      if (isLoaded && clerkUser) {
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        const clerkId = clerkUser.id;
        
        // 1. Verificar si el perfil ya existe en DB
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('clerk_user_id', clerkId)
          .single();

        let assignedRole: Role = 'Turista';

        if (profile) {
            // Existe en BD -> Usamos su rol
            const dbRole = profile.role;
            if (dbRole === 'super_admin') assignedRole = 'SuperAdmin';
            else if (dbRole === 'admin') assignedRole = 'SuperAdmin'; // Mapping simple por ahora
            else if (dbRole === 'empresa') assignedRole = 'DueñoEmpresa';
            else assignedRole = 'Turista';
        } else {
            // No existe -> Lo creamos
            // 🔥 PON AQUÍ TU CORREO DE SUPER ADMIN
            const isSuperAdminEmail = email === 'thejozx.182@gmail.com'; 
            const newRoleDB = isSuperAdminEmail ? 'super_admin' : 'turista';
            assignedRole = isSuperAdminEmail ? 'SuperAdmin' : 'Turista';

            await supabase.from('user_profiles').insert([{
                clerk_user_id: clerkId,
                email: email,
                role: newRoleDB
            }]);
        }

        const newUser: User = {
          uid: clerkId,
          name: clerkUser.fullName || 'Viajero',
          email: email,
          rol: assignedRole,
          avatar: clerkUser.imageUrl,
          savedItineraries: []
        };
        setAppUser(newUser);
      } else if (isLoaded && !clerkUser) {
        setAppUser(null);
      }
    };

    syncUserRole();
  }, [isLoaded, clerkUser]);

  // Persistencia de configs
  useEffect(() => {
    localStorage.setItem('ep_language', language);
    localStorage.setItem('ep_map_theme', mapTheme);
    localStorage.setItem('ep_currency', currency);
  }, [language, mapTheme, currency]);

  // Refrescar negocios al cambiar idioma
  useEffect(() => {
     setAllBusinesses(getLocalizedBusinesses(language));
  }, [language]);

  const t = (key: string) => translations[language][key] || key;

  const registerUser = (newUser: User) => {
    // (Deprecated con Supabase, pero mantenemos para evitar errores de TS)
    setUsersRegistry(prev => [...prev, newUser]);
  };

  const updateBusiness = (updatedBiz: Business) => {
    setAllBusinesses(prev => {
      const newList = prev.map(b => b.id === updatedBiz.id ? updatedBiz : b);
      if (!prev.find(b => b.id === updatedBiz.id)) newList.push(updatedBiz);
      return newList;
    });
  };

  const logout = async () => {
    await signOut();
    setAppUser(null);
  };

  const saveItinerary = (itinerary: SavedItinerary) => {
    if (!appUser) return;
    setAppUser(prev => prev ? ({
      ...prev,
      savedItineraries: [...(prev.savedItineraries || []), itinerary]
    }) : null);
  };

  const deleteItinerary = (id: string) => {
    if (!appUser) return;
    setAppUser(prev => prev ? ({
      ...prev,
      savedItineraries: (prev.savedItineraries || []).filter(i => i.id !== id)
    }) : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user: appUser, 
      login: () => {}, 
      logout, 
      allBusinesses, updateBusiness, usersRegistry, registerUser,
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

// --- SIDEBAR ---
const NavigationSidebar: React.FC = () => {
  const location = useLocation();
  const { user, t } = useAppAuth();
  if (!user) return null;

  const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 no-underline'}`}>
        <span className="material-symbols-outlined">{icon}</span>
        <span className="font-bold text-sm uppercase tracking-widest leading-none">{label}</span>
      </Link>
    );
  };

  return (
    <div className="hidden md:flex flex-col w-72 h-screen bg-surface-dark border-r border-white/5 p-6 shrink-0 z-[100] overflow-hidden">
      <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
        <span className="material-symbols-outlined text-primary text-3xl">landscape</span>
        <span className="text-white font-black tracking-tighter text-xl leading-none">EasyPatagonia</span>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 mb-2 leading-none">Navegación</p>
        <NavItem to="/map" icon="map" label={t('map')} />
        <NavItem to="/discover" icon="explore" label={t('discover')} />
        <NavItem to="/directory" icon="list_alt" label={t('list')} />
        
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 mt-6 mb-2 leading-none">Inteligencia</p>
        <NavItem to="/planner" icon="auto_awesome" label={t('ai')} />
        <NavItem to="/chat" icon="smart_toy" label={t('ai_guide_title')} />
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
        <Link to="/profile" className={`group flex items-center gap-4 p-4 rounded-3xl transition-all no-underline ${location.pathname === '/profile' ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}>
          <img src={user.avatar} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10" alt="Avatar" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate uppercase italic leading-none">{user.name}</p>
            <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1 opacity-70 leading-none">{user.rol}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL CON RUTAS PROTEGIDAS ---
const AuthenticatedApp: React.FC = () => {
  const { user } = useAppAuth();
  const { isLoaded } = useUser();
  const role = user?.rol || 'Turista';

  // Pantalla de carga mientras Clerk y Supabase verifican sesión
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
         <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-body selection:bg-primary/30 overflow-hidden">
      {user && <NavigationSidebar />}
      <main className="flex-1 relative h-screen overflow-y-auto no-scrollbar">
        <Routes>
          {/* Ruta Pública */}
          <Route path="/" element={!user ? <WelcomeScreen /> : <Navigate to="/map" />} />
          
          {/* Rutas Protegidas (Turista y todos) */}
          <Route path="/map" element={user ? <TouristMapScreen /> : <Navigate to="/" />} />
          <Route path="/discover" element={user ? <DiscoveryScreen /> : <Navigate to="/" />} />
          <Route path="/directory" element={user ? <BusinessDirectoryScreen /> : <Navigate to="/" />} />
          <Route path="/details/:id" element={user ? <BusinessDetailsScreen /> : <Navigate to="/" />} />
          <Route path="/planner" element={user ? <PlannerScreen /> : <Navigate to="/" />} />
          <Route path="/itinerary" element={user ? <ItineraryScreen /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <ProfileScreen role={role} /> : <Navigate to="/" />} />
          <Route path="/chat" element={user ? <ChatBotScreen /> : <Navigate to="/" />} />
          
          {/* Rutas de Admin/Dueño */}
          <Route path="/portal" element={user && (role === 'DueñoEmpresa' || role === 'SuperAdmin') ? <BusinessPortalScreen /> : <Navigate to="/profile" />} />
          <Route path="/admin" element={user && role === 'SuperAdmin' ? <AdminDashboardScreen /> : <Navigate to="/profile" />} />
          <Route path="/field" element={user && (role === 'EasyColaborador' || role === 'SuperAdmin') ? <EasyAdminFieldScreen /> : <Navigate to="/profile" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AuthenticatedApp />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
