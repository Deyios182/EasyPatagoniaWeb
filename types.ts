
export type Category = 'Restaurante' | 'Hospedaje' | 'Actividad' | 'Natural' | 'Transporte';

export type MapTheme = 'dark' | 'light' | 'satellite';

export type Currency = 'CLP' | 'USD' | 'EUR';

export interface Service {
  id: string;
  nombre: string;
  precio: string;
  descripcion: string;
  foto_url: string;
}

export interface Business {
  id: string;
  nombre: string;
  categoria: Category;
  priority: 1 | 2 | 3;
  gps: {
    lat: number;
    lng: number;
  };
  contacto: {
    whatsapp: string;
    email: string;
    web: string;
  };
  info: {
    descripcion: string;
    horario: string;
    direccion: string;
  };
  media: {
    logo_url: string;
    fotos_url: string[];
  };
  servicios: Service[];
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  offlineReady: boolean;
}

export type Role = 'SuperAdmin' | 'DueñoEmpresa' | 'EasyColaborador' | 'Turista';

export interface ItineraryDay {
  day: number;
  activities: {
    time: string;
    title: string;
    description: string;
    businessName?: string;
    category?: Category;
  }[];
}

export interface SavedItinerary {
  id: string;
  createdAt: string;
  days: number;
  budget: string;
  categories: Category[];
  plan: ItineraryDay[];
}

export interface User {
  uid: string;
  email: string;
  rol: Role;
  name: string;
  avatar?: string;
  savedItineraries?: SavedItinerary[];
}
