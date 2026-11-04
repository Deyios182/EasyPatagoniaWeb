import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#eaeaea] dark:bg-[#1a2a30] text-[#1a2a30] dark:text-slate-100 font-body py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#243339] rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
        
        {/* Encabezado */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
              <span className="text-xs uppercase font-black tracking-widest text-primary">Cumplimiento Legal Chile</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
              Política de Privacidad y Tratamiento de Datos
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Conforme a la <strong>Ley N° 21.719</strong> sobre Protección de Datos Personales de la República de Chile • Última actualización: Noviembre 2026
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

        {/* Declaración de consentimiento expreso */}
        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-2xl">
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
            <strong>Principio Fundamental de Consentimiento:</strong> En EasyPatagonia no asumimos tu autorización por el mero hecho de navegar. Todo tratamiento de tus datos personales requiere de tu manifestación de voluntad previa, libre, expresa, informada e inequívoca mediante una acción afirmativa clara.
          </p>
        </div>

        {/* 1. Identidad del responsable */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>1.</span> Identidad y Datos del Responsable del Tratamiento
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            El responsable del tratamiento de los datos recabados en este sitio web y plataforma digital es:
          </p>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 space-y-1 text-sm border border-slate-200 dark:border-white/5">
            <p><strong>Razón Social:</strong> EASY PATAGONIA TECHNOLOGIES SPA</p>
            <p><strong>Tipo Jurídico:</strong> Sociedad por Acciones (SpA)</p>
            <p><strong>RUT:</strong> 78.327.806-5</p>
            <p><strong>Domicilio Legal / Tributario:</strong> Calle Monjitas N° 527, Oficina 1207, Edificio Galaxy Center, Comuna de Santiago, Región Metropolitana, Chile (Rol SII: 177-129)</p>
            <p><strong>Zona de Operación Turística:</strong> Región de Aysén del General Carlos Ibáñez del Campo y Patagonia</p>
            <p><strong>Actividad Oficial SII:</strong> Desarrollo y operación de plataforma digital turística (Actividades de operadores turísticos, portales web, edición y consultoría informática)</p>
            <p><strong>Correo electrónico de privacidad:</strong> <a href="mailto:privacidad@easypatagonia.cl" className="text-primary underline font-bold">privacidad@easypatagonia.cl</a></p>
            <p><strong>Teléfono de contacto / WhatsApp:</strong> +56 9 8456 1234</p>
          </div>
        </section>

        {/* 2. Finalidad del tratamiento */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>2.</span> Finalidades Específicas del Tratamiento
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            En estricto apego al principio de limitación de la finalidad, <strong>no solicitamos ni almacenamos datos "por si acaso"</strong>. Tus datos personales se tratan exclusivamente para:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Gestión de Cuentas y Autenticación:</strong> Crear, verificar y administrar tu perfil de viajero, colaborador o dueño de negocio.</li>
            <li><strong>Servicios Turísticos y Rutas:</strong> Guardar tus itinerarios de viaje, puntos favoritos y pasaporte digital en la plataforma.</li>
            <li><strong>Comunidad y Mural Global:</strong> Publicar con tu autorización aportes, fotos y reseñas de atractivos turísticos.</li>
            <li><strong>Atención y Soporte:</strong> Responder solicitudes enviadas por correo o formularios de contacto.</li>
            <li><strong>Comunicaciones y Difusión (Opcional):</strong> Remitir noticias o sugerencias turísticas solo si diste consentimiento separado y explícito.</li>
          </ul>
        </section>

        {/* 3. Base de licitud */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>3.</span> Bases de Licitud
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Tratamos tus datos bajo las siguientes bases jurídicas contempladas en el marco normativo chileno:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Ejecución contractual y prestación de servicios:</strong> Necesaria para operar tu cuenta, entregar los mapas y almacenar tus rutas.</li>
            <li><strong>Consentimiento expreso e informado:</strong> Para el uso de cookies no esenciales (analítica GA4 y píxel publicitario Meta) y recepción de boletines informativos.</li>
            <li><strong>Cumplimiento de obligaciones legales:</strong> En caso de requerimientos formales de autoridades administrativas o judiciales competentes en Chile.</li>
          </ul>
        </section>

        {/* 4. Plazos de conservación */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>4.</span> Plazo de Conservación de la Información
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Tus datos se conservarán únicamente durante el tiempo estrictamente necesario para cumplir las finalidades informadas:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Datos de perfil y cuenta:</strong> Se mantienen mientras tu cuenta permanezca activa. Si solicitas el cierre o eliminación, se suprimen en un plazo no mayor a 30 días corridos, salvo retención obligatoria por ley.</li>
            <li><strong>Datos de analítica web:</strong> Retención máxima agregada de 14 meses (según la configuración de Google Analytics 4).</li>
            <li><strong>Consentimientos de cookies:</strong> Se conservan en tu navegador local por un período de 6 meses, tras el cual se te volverá a consultar.</li>
          </ul>
        </section>

        {/* 5. Derechos ARSOP */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>5.</span> Derechos del Titular (Derechos ARSOP)
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Como titular de tus datos en Chile, tienes derecho a ejercer en cualquier momento las siguientes facultades:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <strong className="text-primary block mb-1">Acceso (A)</strong>
              Conocer qué datos personales tuyos tenemos y cómo están siendo tratados.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <strong className="text-primary block mb-1">Rectificación (R)</strong>
              Solicitar la corrección de datos inexactos, desactualizados o incompletos.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <strong className="text-primary block mb-1">Supresión / Eliminación (S)</strong>
              Exigir el borrado total de tus datos personales cuando ya no sean pertinentes.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <strong className="text-primary block mb-1">Oposición (O)</strong>
              Oponerte a que tus datos se utilicen para finalidades específicas (ej. comunicaciones).
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 md:col-span-2">
              <strong className="text-primary block mb-1">Portabilidad (P)</strong>
              Obtener tus datos en un formato digital estructurado, transparente e interoperable para trasladarlos a otro proveedor.
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 pt-2">
            Para ejercer cualquiera de estos derechos sin costo alguno, escribe directamente a nuestro canal oficial: <a href="mailto:privacidad@easypatagonia.cl" className="text-primary underline font-bold">privacidad@easypatagonia.cl</a> acompañando antecedentes que acrediten tu identidad. Daremos respuesta en los plazos fijados por la Ley 21.719.
          </p>
        </section>

        {/* 6. Transferencia y destinatarios externos */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>6.</span> Proveedores y Transferencia Internacional de Datos
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Para la provisión técnica de EasyPatagonia contratamos proveedores de infraestructura de primer nivel que pueden operar servidores fuera del territorio chileno:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li><strong>Supabase Inc. (EE.UU. / AWS):</strong> Servicio de base de datos segura y autenticación con encriptación en tránsito y en reposo.</li>
            <li><strong>Google Ireland Ltd. / Google LLC:</strong> Google Analytics 4 (solo activado con tu consentimiento) para métricas de navegación.</li>
            <li><strong>Meta Platforms Ireland Ltd.:</strong> Meta Pixel (solo activado con tu consentimiento) para medición de campañas publicitarias.</li>
          </ul>
        </section>

        {/* 7. Protección de menores de edad */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>7.</span> Protección Especial de Niñas, Niños y Adolescentes
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            EasyPatagonia no dirige sus servicios comerciales ni recopila deliberadamente datos personales de menores de 14 años sin la debida autorización de sus padres o representantes legales. Para registrarse en la plataforma, todo usuario debe declarar expresamente ser mayor de 18 años o contar con autorización legal.
          </p>
        </section>

        {/* 8. Protocolo de gestión de incidentes y seguridad */}
        <section className="space-y-3">
          <h2 className="text-xl font-black uppercase italic text-primary flex items-center gap-2">
            <span>8.</span> Seguridad y Notificación de Brechas de Seguridad
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Implementamos salvaguardas técnicas, administrativas y físicas idóneas para resguardar la confidencialidad de la información. En caso de producirse un incidente de seguridad que afecte datos personales de nuestros usuarios, EasyPatagonia activará su protocolo interno y notificará de forma diligente a la Agencia de Protección de Datos Personales de Chile y a los titulares afectados, conforme lo instruye la Ley 21.719.
          </p>
        </section>

        {/* Canal permanente */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Canal de Privacidad: <a href="mailto:privacidad@easypatagonia.cl" className="text-primary underline">privacidad@easypatagonia.cl</a>
          </p>
          <Link
            to="/cookies"
            className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
          >
            Revisar Política de Cookies →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;

