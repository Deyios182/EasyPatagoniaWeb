import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

// Datos simulados
const LOCALITIES = [
  { id: 'tran', name: 'Pto. Río Tranquilo', active: true },
  { id: 'coy', name: 'Coyhaique', active: false },
  { id: 'coc', name: 'Cochrane', active: false },
  { id: 'tort', name: 'Caleta Tortel', active: false },
];

const HIGHLIGHTS = [
  { 
    id: 1, 
    title: "Capillas de Mármol", 
    desc: "Santuario de la naturaleza esculpido por el agua.", 
    img: "https://images.unsplash.com/photo-1517748975545-35696f174b0c",
    tags: ["Navegación", "Icono"] 
  },
  { 
    id: 2, 
    title: "Glaciar Exploradores", 
    desc: "Caminata sobre hielo milenario en Campos de Hielo Norte.", 
    img: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
    tags: ["Trekking", "Hielo"] 
  },
  { 
    id: 3, 
    title: "Bahía Mansa", 
    desc: "El puerto de salida hacia la aventura del mármol.", 
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    tags: ["Fotografía", "Relax"] 
  }
];

const LandingPage: React.FC = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [selectedLocality, setSelectedLocality] = useState('tran');
  const [logoError, setLogoError] = useState(false);

  const handleEnterApp = () => {
    if (isSignedIn) navigate('/map');
    else navigate('/login');
  };

  const openLink = (url: string) => window.open(url, '_blank');
  
  const handleWhatsApp = () => {
      const telefono = "56956425005";
      const mensaje = "¡Hola! Escribo desde la web EasyPatagonia.";
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = isMobile ? `whatsapp://send?phone=${telefono}&text=${encodeURIComponent(mensaje)}` : `https://web.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
  };

  const handleEmail = () => {
      window.location.href = `mailto:infoeasypatagonia@gmail.com`;
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#eaeaea] font-body text-[#1a2a30] overflow-x-hidden">
      
      {/* HERO SECTION */}
      <div className="relative h-screen w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
           <img src="https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070" className="w-full h-full object-cover opacity-60 animate-[pulse_10s_infinite]" alt="Patagonia Background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30] via-transparent to-black/30"></div>

        <nav className="absolute top-0 left-0 right-0 p-6 flex flex-col md:flex-row justify-between items-center z-50">
          <div className="mb-4 md:mb-0 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
             {!logoError ? (
                 <img src="/logo_easy.png" className="h-24 w-auto object-contain hover:scale-105 transition-transform" alt="Easy Patagonia" onError={() => setLogoError(true)} />
             ) : (
                 <div className="flex flex-col"><h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">Easy Patagonia</h1><span className="text-[10px] text-[#dd6e42] tracking-[0.3em] font-bold uppercase">Austral Experience</span></div>
             )}
          </div>
          <div className="flex gap-6 mb-4 md:mb-0 bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
             <button onClick={() => scrollToSection('destinos')} className="text-white text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Destinos</button>
             <button onClick={() => scrollToSection('vision')} className="text-white text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Visión</button>
             <button onClick={() => scrollToSection('contacto')} className="text-white text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Contacto</button>
          </div>
          <button onClick={handleEnterApp} className="bg-[#dd6e42] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-transform border-2 border-transparent hover:border-white">{isSignedIn ? 'Ir al Mapa' : 'Ingresar'}</button>
        </nav>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-40">
          <motion.h1 initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">Patagonia <br /> <span className="text-[#dd6e42]">Sin Límites</span></motion.h1>
          <p className="mt-6 text-[#e8dab2] text-lg md:text-xl max-w-2xl font-medium drop-shadow-md italic">"Tú Disfruta, Nosotros Resolvemos."</p>
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce"><span className="material-symbols-outlined text-white text-4xl">keyboard_arrow_down</span></div>
      </div>

      {/* DESTINOS */}
      <section id="destinos" className="py-20 px-6 md:px-20 bg-[#eaeaea]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div><h2 className="text-[#4f6d7a] text-sm font-black uppercase tracking-[0.4em] mb-2">Explora la Región</h2><h3 className="text-4xl md:text-6xl font-black text-[#1a2a30] uppercase italic tracking-tighter">Localidades</h3></div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">{LOCALITIES.map(loc => (<button key={loc.id} disabled={!loc.active} onClick={() => setSelectedLocality(loc.id)} className={`whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === loc.id ? 'bg-[#4f6d7a] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}>{loc.name} {!loc.active && '(Pronto)'}</button>))}</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl border border-[#4f6d7a]/10 h-full flex flex-col justify-between"><div><h4 className="text-3xl font-black text-[#dd6e42] uppercase italic leading-none mb-4">Puerto Río Tranquilo</h4><p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium">El corazón turístico de la cuenca del Lago General Carrera.</p></div><div className="p-6 bg-[#eaeaea] rounded-3xl"><p className="text-xs font-bold text-[#4f6d7a] uppercase tracking-widest mb-2">Gestión Local</p><p className="text-[10px] text-gray-500 font-bold">Datos actualizados por nuestros embajadores en terreno.</p></div></div>
             <div className="lg:col-span-2"><div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x">{HIGHLIGHTS.map(place => (<div key={place.id} className="min-w-[280px] md:min-w-[320px] group relative h-96 rounded-[3rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all snap-center" onClick={handleEnterApp}><img src={place.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.title} /><div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/90 via-transparent to-transparent"></div><div className="absolute bottom-8 left-8 right-8"><h5 className="text-2xl font-black text-white uppercase italic mb-1 leading-none">{place.title}</h5><div className="flex gap-2 mt-3">{place.tags.map(tag => (<span key={tag} className="text-[9px] bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full uppercase font-black">{tag}</span>))}</div></div></div>))}</div></div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN NUESTRA VISIÓN (CORREGIDA) --- */}
      <section id="vision" className="py-24 bg-[#1a2a30] text-white rounded-t-[4rem] -mt-10 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
            
            {/* Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                    <span className="text-3xl mb-4 block">🧭</span>
                    <h3 className="text-lg font-black uppercase mb-3">Conexión y Autenticidad</h3>
                    <p className="text-sm text-slate-300 leading-relaxed text-left">Ser la plataforma líder que conecta a los viajeros con experiencias auténticas.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                    <span className="text-3xl mb-4 block">💡</span>
                    <h3 className="text-lg font-black uppercase mb-3">Planificación Simple</h3>
                    <p className="text-sm text-slate-300 leading-relaxed text-left">Soluciones innovadoras para simplificar tu viaje: hospedaje, gastronomía y tours.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                    <span className="text-3xl mb-4 block">💚</span>
                    <h3 className="text-lg font-black uppercase mb-3">Turismo Sostenible</h3>
                    <p className="text-sm text-slate-300 leading-relaxed text-left">Promover un turismo responsable que respeta la riqueza natural de la Patagonia.</p>
                </div>
            </div>

            {/* Misión y Visión + Imagen (DISEÑO ARREGLADO) */}
            <div className="flex flex-col lg:flex-row gap-16 items-center">
                
                {/* Columna Texto */}
                <div className="flex-1 space-y-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-[#dd6e42]">rocket_launch</span>
                            <h2 className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em]">Nuestra Misión</h2>
                        </div>
                        <p className="text-[#c0d6df]/90 text-base leading-relaxed font-light text-left pl-9 border-l-2 border-[#dd6e42]/30">
                            Impulsar el desarrollo turístico de la Región de Aysén mediante una plataforma innovadora que conecta a viajeros con experiencias auténticas, la naturaleza y las comunidades locales.
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-[#dd6e42]">visibility</span>
                            <h2 className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em]">Nuestra Visión</h2>
                        </div>
                        <p className="text-[#c0d6df]/90 text-base leading-relaxed font-light text-left pl-9 border-l-2 border-[#dd6e42]/30">
                            Convertirnos en la plataforma turística líder de toda la Patagonia —chilena y argentina— integrando tecnología, sostenibilidad y desarrollo comunitario.
                        </p>
                    </div>
                    
                    <button onClick={handleEnterApp} className="bg-white text-[#1a2a30] px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[#dd6e42] hover:text-white transition-all shadow-xl w-full md:w-auto mt-4">
                        EXPLORAR LA PATAGONIA AHORA
                    </button>
                </div>
                
                {/* Columna Imagen (CORREGIDA: Eliminado el cuadro oscuro fantasma) */}
                <div className="flex-1 relative w-full h-[500px]">
                    {/* Imagen principal: Usamos una URL más segura y object-cover */}
                    <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-all duration-700 z-10">
                        <img 
                            src="https://images.unsplash.com/photo-1518182170546-0766be6f5a56?q=80&w=800&auto=format&fit=crop" 
                            className="w-full h-full object-cover"
                            alt="Patagonia Vision"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/60 to-transparent"></div>
                    </div>

                    {/* Decoración de fondo */}
                    <div className="absolute top-4 -right-4 bottom-[-10px] left-4 bg-[#dd6e42] rounded-[3rem] -rotate-2 opacity-20 z-0"></div>
                    
                    {/* Tarjeta Flotante (Posicionada correctamente sobre la imagen) */}
                    <div className="absolute -bottom-6 left-6 bg-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20 max-w-[280px] border border-gray-100 flex flex-col gap-3 animate-in slide-in-from-bottom duration-1000">
                       <p className="text-[#1a2a30] font-black uppercase italic text-xs tracking-wider">¿Dudas sobre tu viaje?</p>
                       <div className="flex gap-3">
                          <button onClick={handleWhatsApp} className="flex-1 bg-[#25D366] py-3 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform group">
                             <span className="material-symbols-outlined text-xl group-hover:animate-bounce">call</span>
                          </button>
                          <button onClick={handleEmail} className="flex-1 bg-[#3498DB] py-3 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform group">
                             <span className="material-symbols-outlined text-xl group-hover:animate-bounce">mail</span>
                          </button>
                       </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-20 bg-[#eaeaea]">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-[#1a2a30] text-2xl font-black uppercase italic mb-2">¡Únete a la Aventura EasyPatagonia!</h2>
            <p className="text-gray-500 mb-10">Síguenos en nuestras plataformas para no perderte ninguna novedad.</p>
            <div className="flex flex-wrap justify-center gap-6">
                <button onClick={() => openLink("https://www.instagram.com/easy.patagonia")} className="flex items-center gap-3 px-8 py-4 bg-[#E1306C] text-white rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"><span className="font-black uppercase tracking-widest text-xs">Instagram</span></button>
                <button onClick={() => openLink("https://www.tiktok.com/@easy.patagonia?_t=ZM-8srRmTRFV1q&_r=1")} className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"><span className="font-black uppercase tracking-widest text-xs">TikTok</span></button>
                <button onClick={handleWhatsApp} className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"><span className="font-black uppercase tracking-widest text-xs">Soporte WhatsApp</span></button>
            </div>
            <div className="mt-12 pt-12 border-t border-gray-300">
               <p className="text-gray-500 mb-2">¿Prefieres Contacto Directo?</p>
               <button onClick={handleEmail} className="text-[#3498DB] font-bold text-lg underline hover:text-[#2980b9]">infoeasypatagonia@gmail.com</button>
            </div>
         </div>
      </section>

      <footer className="bg-[#152024] py-12 text-center text-slate-500 text-xs">
        <img src="/logo_easy.png" className="h-10 w-auto mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" alt="Logo Footer" onError={(e) => e.currentTarget.style.display = 'none'} />
        <p className="uppercase tracking-widest font-black mb-4">Easy Patagonia © 2024</p>
        <p>Desarrollado con ❤️ en la Región de Aysén</p>
      </footer>
    </div>
  );
};

export default LandingPage;
