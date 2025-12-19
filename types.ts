export type Role = 'SuperAdmin' | 'DueñoEmpresa' | 'EasyColaborador' | 'Turista';

export interface User {
  uid: string;
  name: string;
  email: string;
  rol: Role;
  avatar?: string;
  savedItineraries?: SavedItinerary[];
}

export type MapTheme = 'light' | 'dark' | 'satellite';
export type Currency = 'CLP' | 'USD' | 'BRL';

// --- MODELOS DE BASE DE DATOS (Supabase) ---

export interface Locality {
  id: string;
  name: string;
  image_url?: string;
  is_active: boolean;
}

export interface Attraction {
  id: string;
  locality_id: string;
  name: string;
  description?: string;
  image_url?: string;
  // Campos opcionales para UI
  locality_name?: string; 
}

export interface Company {
  id: string;
  owner_id?: string; // ID del dueño en user_profiles
  name: string;
  description?: string;
  logo_url?: string;
  gallery_urls?: string[];
  is_active: boolean;
  // Relaciones
  owner_email?: string; // Para mostrar en el admin
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

// Interfaz legacy para compatibilidad con componentes viejos (si quedan)
export interface Business extends Company {
  category?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  services?: Service[];
}

export interface SavedItinerary {
  id: string;
  name: string;
  date: string;
  items: any[];
}
