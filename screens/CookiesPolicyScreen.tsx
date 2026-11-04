import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getStoredPreferences,
  savePreferences,
  resetPreferences,
  CookiePreferences
} from '../src/utils/cookieConsent';
import { initGA, initMetaPixel } from '../src/analytics/analytics';

const CookiesPolicyScreen: React.FC = () => {
  const [prefs, setPrefs] = useState<CookiePreferences | null>(null);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const current = getStoredPreferences();
    if (current) {
      setPrefs(current);
      setAnalytics(current.analytics);
      setMarketing(current.marketing);
    }
  }, []);

  const handleUpdate = () => {
    const updated = savePreferences({ analytics, marketing });
    setPrefs(updated);
    if (updated.analytics) initGA();
    if (updated.marketing) initMetaPixel();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    resetPreferences();
    setPrefs(null);
    setAnalytics(false);
    setMarketing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#eaeaea] dark:bg-[#1a2a30] text-[#1a2a30] dark:text-slate-100 font-body py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#243339] rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">

        {/* Encabezado */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-3xl">cookie</span>
              <span className="text-xs uppercase font-black tracking-widest text-primary">Ley 21.719</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
              Política de Cookies y Tecnologías de Rastreo
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Transparencia total sobre las cookies utilizadas en EasyPatagonia
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al inicio
          </Link>
        </div>

        {/* ¿Qué son las cookies? */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">
            ¿Qué son las cookies?
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Una cookie es un pequeño archivo de texto que un sitio web almacena en tu dispositivo (ordenador, tablet o teléfono móvil) cuando lo visitas. Permiten que la plataforma recuerde tus acciones y preferencias (como inicio de sesión, idioma, estilo de mapa y otras opciones de visualización) durante un tiempo determinado.
          </p>
        </section>

        {/* Tabla detallada de cookies */}
        <section className="space-y-4">
          <h2 className="text-xl font-black uppercase italic text-primary">
            Tipos de Cookies que utilizamos y su Duración
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse border border-slate-200 dark:border-white/10">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200">
                  <th className="p-3 border border-slate-200 dark:border-white/10">Categoría</th>
                  <th className="p-3 border border-slate-200 dark:border-white/10">Finalidad</th>
                  <th className="p-3 border border-slate-200 dark:border-white/10">Proveedor</th>
                  <th className="p-3 border border-slate-200 dark:border-white/10">Duración</th>
                  <th className="p-3 border border-slate-200 dark:border-white/10">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">Técnicas / Esenciales</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Mantener la sesión autenticada, preferencias de tema visual y registrar el consentimiento de cookies.</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">EasyPatagonia / Supabase</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Sesión / 6 meses</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10"><span className="text-[10px] uppercase font-bold text-emerald-500">Siempre activa</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">Analíticas (GA4)</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Estadísticas agregadas de visitas, secciones de atractivos más consultadas y rendimiento.</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Google LLC (GA4)</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Hasta 14 meses</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10"><span className="text-[10px] uppercase font-bold text-primary">Requiere Opt-in</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10">Marketing y Redes</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Medir efectividad de campañas en Meta/Instagram para atraer turismo a la región.</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">Meta Platforms</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10">90 días</td>
                  <td className="p-3 border border-slate-200 dark:border-white/10"><span className="text-[10px] uppercase font-bold text-primary">Requiere Opt-in</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel Permanente de Retiro y Configuración de Consentimiento */}
        <section className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-200 dark:border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
            <div>
              <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white">
                Gestionar o Retirar Consentimiento en Cualquier Momento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La Ley 21.719 te garantiza revocar o modificar tu consentimiento cuando lo desees de manera sencilla.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Cookies Técnicas</p>
                <p className="text-xs text-slate-500">Necesarias para el uso del mapa y la plataforma.</p>
              </div>
              <span className="text-xs font-bold text-emerald-500">Obligatorias</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Cookies Analíticas (Google Analytics 4)</p>
                <p className="text-xs text-slate-500">Métricas anónimas de navegación.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Cookies de Marketing (Meta Pixel)</p>
                <p className="text-xs text-slate-500">Campañas y anuncios relevantes en redes sociales.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl text-center">
              Tus preferencias han sido actualizadas exitosamente.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReset}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider underline"
            >
              Restablecer todo (volver a ver banner)
            </button>
            <button
              onClick={handleUpdate}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-orange-600 text-white shadow-lg active:scale-95 transition-all"
            >
              Guardar preferencias
            </button>
          </div>
        </section>

        {/* Enlace complementario */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
          <span>Contacto de privacidad: <a href="mailto:contacto@easypatagonia.com" className="text-primary underline">contacto@easypatagonia.com</a></span>
          <Link to="/privacidad" className="text-primary font-bold hover:underline uppercase">
            Ver Política de Privacidad →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default CookiesPolicyScreen;

