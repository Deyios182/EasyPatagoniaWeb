// Administrador de consentimiento de Cookies para dar cumplimiento a la Ley 21.719 (Chile)
// y estándares internacionales de protección de datos (Opt-In previo y bloqueo por defecto).

export interface CookiePreferences {
  necessary: boolean; // Siempre true (técnicas, autenticación, sesión)
  analytics: boolean; // GA4
  marketing: boolean; // Meta Pixel / Redes
  decidedAt: string;  // Timestamp ISO
}

const STORAGE_KEY = 'ep_cookie_consent_v1';

export const getStoredPreferences = (): CookiePreferences | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const savePreferences = (prefs: { analytics: boolean; marketing: boolean }): CookiePreferences => {
  const fullPrefs: CookiePreferences = {
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    decidedAt: new Date().toISOString()
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullPrefs));
    // Disparar evento para que los listeners y analytics reaccionen inmediatamente
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: fullPrefs }));
  }
  return fullPrefs;
};

export const acceptAllCookies = (): CookiePreferences => {
  return savePreferences({ analytics: true, marketing: true });
};

export const rejectAllCookies = (): CookiePreferences => {
  return savePreferences({ analytics: false, marketing: false });
};

export const resetPreferences = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cookieConsentReset'));
  }
};

