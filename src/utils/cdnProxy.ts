/**
 * CDN Proxy & Image Optimizer
 * 
 * Enruta las imágenes pesadas de Supabase Storage a través del CDN global de Cloudflare/Weserv (images.weserv.nl).
 * - Transforma imágenes gigantes (3MB - 8MB) a WebP ligero (~60KB - 120KB) al vuelo.
 * - Cachea la imagen en los edge servers globales: Supabase entrega la foto 1 sola vez y nunca más.
 * - Reduce el consumo de Cached Egress de Supabase en más de un 98%.
 */

interface CdnOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'inside' | 'outside';
}

export const getOptimizedImageUrl = (
  rawUrl: string | undefined | null,
  options: CdnOptions = {}
): string => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://placehold.co/600x400?text=Sin+Imagen';
  }

  const trimmed = rawUrl.trim();

  // Si no es URL válida o ya es un data URI/blob/placeholder, devolver tal cual
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('placehold.co')
  ) {
    return trimmed;
  }

  // Verificar si es una imagen servida desde Supabase Storage
  const isSupabaseStorage = trimmed.includes('.supabase.co/storage/v1/object/public/');

  // Si no es de Supabase y ya viene optimizada o es externa que no queremos tocar
  if (!isSupabaseStorage && !trimmed.includes('supabase.co')) {
    return trimmed;
  }

  const {
    width = 1200,
    quality = 75,
    fit = 'inside'
  } = options;

  // Limpiar parámetros previos si los tuviera
  const cleanUrl = trimmed.split('?')[0];

  // Construir la URL del CDN proxy (images.weserv.nl)
  // Parámetros:
  // url: URL de origen codificada
  // w: Ancho máximo
  // q: Calidad (1-100)
  // output: Forzar formato webp
  // il: Interlace / progresivo
  // af: Auto-filter (mejora nitidez tras reducir)
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&q=${quality}&output=webp&fit=${fit}&il&af`;

  return proxyUrl;
};

/**
 * Optimiza un arreglo de URLs (ej: galerías de empresas)
 */
export const getOptimizedImageUrls = (
  urls: string[] | undefined | null,
  options: CdnOptions = {}
): string[] => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => getOptimizedImageUrl(url, options));
};

