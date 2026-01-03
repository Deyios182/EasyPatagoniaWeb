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
  description?: string;
  image_url?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Attraction {
  id: string;
  locality_id: string;
  name: string;
  short_description?: string;
  long_description?: string;
  main_image_url?: string;
  gallery_urls?: string[];
  keywords?: string[];
  tips?: string[];
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  description?: string; // Mapped from long_description or short_description
}

export interface Company {
  id: string;
  owner_id?: string; // ID del dueño en users (auth)
  name: string;
  description?: string;
  logo_url?: string;
  gallery_urls?: string[];
  is_active: boolean;
  // Campos nuevos del esquema SQL
  category?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  whatsapp?: string;
  locality_id?: string;
  // Relaciones
  owner_email?: string;
  services?: Service[];
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  price: string; // Changed from number to text as per SQL
  image_url?: string;
  description?: string;
  attraction_id?: string;
}

// Interfaz legacy para compatibilidad con componentes viejos (si quedan)
export interface Business extends Company {
  nombre: string; // Legacy support
  locality_name?: string; // Nombre de localidad para UI
  categoria?: string;
  priority?: any;
  gps?: { lat: number, lng: number };
  contacto?: any;
  info?: any;
  media?: any;
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  offlineReady?: boolean;
  lat?: number;
  lng?: number;
  services?: any[]; // Loose type for services to match constants.ts
  servicios?: any[]; // Legacy alias for Spanish code support
}

// Category definition
export type Category = 'Restaurante' | 'Hospedaje' | 'Actividad' | 'Transporte' | 'Natural';

export interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  businessName?: string;
  category?: string;
  // Others?
}

export interface ItineraryDay {
  day: number;
  activities: ItineraryActivity[];
}

export interface SavedItinerary {
  id: string;
  createdAt: string;
  days: number;
  budget: string;
  categories: string[];
  plan: ItineraryDay[];
}

// Galería personal de usuario
export interface UserImage {
  id: string;
  owner_id: string;
  image_url: string;
  image_type: 'logo' | 'gallery' | 'service';
  name?: string;
  uploaded_at: string;
}
