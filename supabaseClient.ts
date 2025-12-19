import { createClient } from '@supabase/supabase-js';
import { Database } from './types_db'; // (Opcional, por ahora usaremos any)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- FUNCIONES DE AYUDA ---

// 1. Cargar Negocios
export const fetchBusinesses = async () => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*');
  if (error) console.error('Error cargando negocios:', error);
  return data || [];
};

// 2. Guardar Itinerario
export const saveItineraryToCloud = async (itinerary: any, userId: string) => {
  const { data, error } = await supabase
    .from('saved_itineraries')
    .insert([{ ...itinerary, user_id: userId }]);
  return { data, error };
};

// 3. Obtener Itinerarios de un Usuario
export const fetchUserItineraries = async (userId: string) => {
  const { data, error } = await supabase
    .from('saved_itineraries')
    .select('*')
    .eq('user_id', userId);
  return data || [];
};
