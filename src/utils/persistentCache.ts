/**
 * Sistema de Caché Persistente en localStorage con TTL (Time To Live).
 * Evita consultas redundantes a Supabase en recargas de página (F5) o nuevas sesiones.
 */

interface CachePayload<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 Horas por defecto

export const persistentCache = {
  /**
   * Guarda un valor en localStorage con timestamp
   */
  set: <T>(key: string, data: T): void => {
    try {
      const payload: CachePayload<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`ep_cache_${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[persistentCache] No se pudo guardar ${key} en localStorage (posible límite de cuota)`, e);
    }
  },

  /**
   * Obtiene un valor de localStorage si aún no ha expirado
   */
  get: <T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null => {
    try {
      const raw = localStorage.getItem(`ep_cache_${key}`);
      if (!raw) return null;

      const payload: CachePayload<T> = JSON.parse(raw);
      const isExpired = Date.now() - payload.timestamp > ttlMs;

      if (isExpired) {
        localStorage.removeItem(`ep_cache_${key}`);
        return null;
      }

      return payload.data;
    } catch (e) {
      console.warn(`[persistentCache] Error leyendo ${key}`, e);
      return null;
    }
  },

  /**
   * Invalida una clave específica o todas las de la app
   */
  invalidate: (key?: string): void => {
    try {
      if (key) {
        localStorage.removeItem(`ep_cache_${key}`);
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('ep_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('[persistentCache] Error invalidando caché', e);
    }
  }
};
