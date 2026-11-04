import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getStoredPreferences,
  acceptAllCookies,
  rejectAllCookies,
  savePreferences,
  CookiePreferences
} from '../src/utils/cookieConsent';
import { initGA, initMetaPixel } from '../src/analytics/analytics';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    const prefs = getStoredPreferences();
    if (!prefs) {
      setVisible(true);
    } else {
      // Si ya existen preferencias aprobadas, inicializar los scripts permitidos
      if (prefs.analytics) initGA();
      if (prefs.marketing) initMetaPixel();
    }

    const handleConsentReset = () => {
      setVisible(true);
      setShowConfig(false);
    };

    window.addEventListener('cookieConsentReset', handleConsentReset);
    return () => window.removeEventListener('cookieConsentReset', handleConsentReset);
  }, []);

  const handleAcceptAll = () => {
    const prefs = acceptAllCookies();
    initGA();
    initMetaPixel();
    setVisible(false);
  };

  const handleRejectAll = () => {
    rejectAllCookies();
    setVisible(false);
  };

  const handleSaveConfig = () => {
    const prefs = savePreferences({
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
    });
    if (prefs.analytics) initGA();
    if (prefs.marketing) initMetaPixel();
    setVisible(false);
    setShowConfig(false);
  };

  if (!visible) return null;

  return (
    <aside aria-label="Consentimiento de Cookies" className="fixed bottom-0 inset-x-0 z-[9999] p-4 md:p-6 bg-slate-950/95 text-white backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] font-body">
      <div className="max-w-6xl mx-auto">
        {!showConfig ? (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">cookie</span>
                <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
                  Tu privacidad es tu decisión (Ley 21.719)
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
                En <strong>EasyPatagonia</strong> respetamos tus datos personales. Conforme a la normativa chilena,
                no activamos cookies de analítica ni de marketing sin tu consentimiento explícito previo. Navegar o continuar en el sitio no constituye aceptación.
                Puedes aceptar todas, rechazarlas o configurar tus preferencias.
                Conoce más en nuestra{' '}
                <Link to="/cookies" className="text-primary underline hover:text-orange-400 font-bold">
                  Política de Cookies
                </Link>{' '}
                y en nuestra{' '}
                <Link to="/privacidad" className="text-primary underline hover:text-orange-400 font-bold">
                  Política de Privacidad
                </Link>.
              </p>
            </div>

            {/* Botones con exactamente el mismo peso visual exigido por la ley */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all text-center shadow-md active:scale-95"
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-all text-center shadow-md active:scale-95"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto flex-1 sm:flex-initial px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-primary hover:bg-orange-600 text-white border border-primary transition-all text-center shadow-lg active:scale-95"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Panel de Preferencias de Cookies
              </h4>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Volver"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Necesarias */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Técnicas / Necesarias</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Siempre activas
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Imprescindibles para que la plataforma funcione, mantener la sesión y recordar tus elecciones básicas. No recopilan datos para marketing.
                </p>
              </div>

              {/* Analíticas */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Analíticas (GA4)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permiten medir de forma agregada cómo los viajeros usan el mapa e interactúan con los destinos para mejorar la experiencia.
                </p>
              </div>

              {/* Marketing */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Publicidad y Redes</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingAllowed}
                      onChange={(e) => setMarketingAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Píxeles como Meta Pixel que permiten evaluar el impacto de campañas de difusión turística regional en redes sociales.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-orange-600 text-white shadow-lg active:scale-95"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CookieBanner;

