import React from 'react';
import { Link } from 'react-router-dom';

const TermsScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#eaeaea] dark:bg-[#1a2a30] text-[#1a2a30] dark:text-slate-100 font-body py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#243339] rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
        
        {/* Encabezado */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
              <span className="text-xs uppercase font-black tracking-widest text-primary">Términos de Servicio</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Condiciones generales de uso de la plataforma EasyPatagonia • Actualizado Noviembre 2026
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

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">1. Aceptación de las Condiciones</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            El acceso y utilización de la plataforma digital EasyPatagonia (sitio web, aplicación web progresiva y herramientas vinculadas) atribuye la condición de usuario e implica la aceptación plena de los presentes Términos y Condiciones. Si no estás de acuerdo con ellos, debes abstenerte de hacer uso de la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">2. Objeto de la Plataforma</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            EasyPatagonia es una plataforma tecnológica de información turística y comunitaria orientada a conectar a viajeros con atractivos naturales, servicios, rutas e información verificada de la Región de Aysén y Patagonia. EasyPatagonia opera como facilitador informativo y de contacto directo, no siendo responsable directo de las transacciones comerciales particulares convenidas entre usuarios y los prestadores de servicios independientes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">3. Registro de Cuenta y Veracidad de la Información</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            El usuario se compromete a ingresar información veraz, exacta y actualizada durante el registro. Cada usuario es responsable de salvaguardar sus credenciales de acceso. Queda prohibida la creación de cuentas suplantando la identidad de terceros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">4. Protección de Datos y Privacidad Separada</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            El tratamiento de datos personales se rige de forma expresa e independiente por nuestra{' '}
            <Link to="/privacidad" className="text-primary underline font-bold">
              Política de Privacidad (Ley 21.719)
            </Link>. La aceptación de los Términos y Condiciones no supone el consentimiento automático a finalidades secundarias ni al uso de cookies de seguimiento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">5. Conducta y Mural Comunitario</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Los usuarios que compartan fotografías, rutas o comentarios en el mural se comprometen a respetar los derechos de autor, el orden público y los principios de conservación medioambiental de la Patagonia. Nos reservamos el derecho de moderar o suspender aportes que infrinjan normativas legales o atenten contra la seguridad y respeto en la comunidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary">6. Legislación Aplicable y Jurisdicción</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Estos términos se rigen íntegramente por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales ordinarios de justicia competentes en el territorio de la República de Chile.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>EASY PATAGONIA TECHNOLOGIES SPA (RUT: 78.327.806-5) • Monjitas 527 Of. 1207, Santiago, Chile</span>
          <div className="flex gap-4">
            <Link to="/privacidad" className="text-primary font-bold hover:underline uppercase">Política de Privacidad</Link>
            <Link to="/cookies" className="text-primary font-bold hover:underline uppercase">Política de Cookies</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TermsScreen;

