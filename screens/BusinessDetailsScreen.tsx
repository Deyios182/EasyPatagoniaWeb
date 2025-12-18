
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';
import { Service } from '../types';

const BusinessDetailsScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { allBusinesses, t } = useAppAuth();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  const business = allBusinesses.find(b => b.id === id) || allBusinesses[0];

  const handleServiceContact = (service: Service) => {
    const phone = business.contacto.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${business.nombre}, me gustaría consultar por el servicio "${service.nombre}" que vi en EasyPatagonia. (Precio: ${service.precio})`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleGeneralContact = () => {
    const phone = business.contacto.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${business.nombre}, vi su perfil en EasyPatagonia y me gustaría solicitar más información.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const allPhotos = useMemo(() => {
    return business.media.fotos_url.length > 0 ? business.media.fotos_url : [business.media.logo_url];
  }, [business]);

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar">
      
      {/* Botón Volver Sticky (Relativo al área de contenido, no al viewport total) */}
      <div className="sticky top-6 left-6 z-[60] h-0 overflow-visible pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-black/40 backdrop-blur-xl rounded-2xl w-14 h-14 flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all shadow-2xl hover:bg-primary pointer-events-auto"
        >
          <span className="material-symbols-outlined text-3xl leading-none">arrow_back</span>
        </button>
      </div>

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300 pointer-events-auto"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" 
            alt="Full view"
          />
          <button className="absolute top-6 right-6 text-white w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}

      {/* Contenedor de Imagen */}
      <div className="w-full h-[50vh] md:h-[70vh] bg-slate-900 overflow-hidden relative shrink-0 z-10 shadow-2xl">
        <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
          {allPhotos.map((url, i) => (
            <div key={i} className="w-full h-full shrink-0 snap-center relative group">
              <img 
                src={url} 
                className="w-full h-full object-cover cursor-zoom-in group-hover:brightness-110 transition-all duration-500" 
                onClick={() => setFullscreenImage(url)}
                alt={`${business.nombre} ${i}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 bg-white dark:bg-background-dark p-6 md:p-16 lg:p-24 space-y-16 pb-48">
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-6 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20 uppercase tracking-[0.25em] leading-none">
              {t(business.categoria.toLowerCase())}
            </span>
            <div className="flex items-center gap-2 text-primary font-black bg-slate-50 dark:bg-white/5 px-5 py-2.5 rounded-full border border-slate-100 dark:border-white/5 leading-none">
              <span className="material-symbols-outlined text-sm">star</span>
              {business.rating}
              <span className="text-slate-400 text-[10px] font-bold ml-1">({business.reviewCount})</span>
            </div>
            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${business.isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
               {business.isOpen ? t('business_status_open') : t('business_status_closed')}
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black dark:text-white tracking-tighter leading-tight uppercase italic break-words">
            {business.nombre}
          </h1>
          
          <div className="space-y-4 max-w-4xl">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('business_description_label')}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg md:text-2xl font-medium border-l-4 border-primary/30 pl-8 italic">
              {business.info.descripcion}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-50 dark:bg-surface-dark p-8 rounded-[3rem] flex items-center gap-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 leading-none">{t('schedule_label')}</p>
              <p className="text-lg font-bold dark:text-white leading-tight">{business.info.horario}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-surface-dark p-8 rounded-[3rem] flex items-center gap-6 border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
              <span className="material-symbols-outlined text-3xl">location_on</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 leading-none">{t('location_label')}</p>
              <p className="text-lg font-bold dark:text-white leading-tight break-words">{business.info.direccion}</p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="flex items-center gap-6">
             <div className="w-14 h-1.5 bg-primary rounded-full"></div>
             <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic">{t('business_offer')}</h2>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {business.servicios.map((s, idx) => (
              <div 
                key={s.id} 
                className="bg-white dark:bg-surface-dark rounded-[3.5rem] border border-slate-200 dark:border-white/5 flex flex-col gap-8 p-8 shadow-sm hover:shadow-2xl transition-all group h-auto"
              >
                <div className="w-full h-72 rounded-[2.5rem] overflow-hidden shadow-xl relative cursor-zoom-in group/img" onClick={() => setFullscreenImage(s.foto_url)}>
                  <img src={s.foto_url} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-[3s]" alt={s.nombre} />
                  <div className="absolute top-6 right-6 bg-primary text-white font-black text-xs px-6 py-3 rounded-full shadow-2xl border-2 border-white/20 leading-none">
                    {s.precio}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black dark:text-white leading-tight tracking-tight uppercase italic break-words">{s.nombre}</h3>
                    <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {s.descripcion}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleServiceContact(s)}
                    className="w-full bg-[#25D366] text-white px-10 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-xl leading-none"
                  >
                    <span className="material-symbols-outlined text-2xl">whatsapp</span>
                    {t('consult_service')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 md:p-12 z-[120] flex justify-center pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto">
          <button 
            onClick={handleGeneralContact}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-background-dark font-black h-20 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-5 uppercase tracking-[0.25em] text-xs border-4 border-white dark:border-background-dark group px-6 leading-tight text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <span className="material-symbols-outlined text-white text-xl">forum</span>
            </div>
            {t('contact_direct')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsScreen;
