import React, { useState } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Datos simulados (Esto vendría de tu base de datos en el futuro)
const LOCALITIES = [
  { id: 'tran', name: 'Pto. Río Tranquilo', image: 'https://images.unsplash.com/photo-1517748975545-35696f174b0c?auto=format&fit=crop&q=80&w=800', active: true },
  { id: 'coy', name: 'Coyhaique', image: 'https://images.unsplash.com/photo-1596489376174-29b4317c8046?auto=format&fit=crop&q=80&w=800', active: false }, // Próximamente
  { id: 'coc', name: 'Cochrane', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800', active: false }, // Próximamente
];

const HIGHLIGHTS = [
  { 
    id: 1, 
    title: "Capillas de Mármol", 
    desc: "Santuario de la naturaleza esculpido por el agua.", 
    img: "https://images.unsplash.com/photo-1517748975545-35696f174b0c",
    tags: ["Navegación", "Kayak"] 
  },
  { 
    id: 2, 
    title: "Glaciar Exploradores", 
    desc: "Caminata sobre hielo milenario en Campos de Hielo Norte.", 
    img: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda",
    tags: ["Trekking", "Aventura"] 
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

  const handleEnterApp = () => {
    if (isSignedIn) navigate('/map');
  };

  return (
    <div className="min-h-screen bg-[#eaeaea] font-body text-[#1a2a30] overflow-x-hidden">
      
      {/* --- HERO SECTION CON VIDEO --- */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Video de fondo (Simulado con imagen por ahora, cambia el src por un .mp4 real) */}
        <div className="absolute inset-0 bg-black">
           <img 
             src="https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-60"
             alt="Patagonia Background"
           />
           {/* Descomenta esto cuando tengas el video en la carpeta public */}
           {/* <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60">
              <source src="/patagonia_intro.mp4" type="video/mp4" />
           </video> */}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30] via-transparent to-black/30"></div>

        {/* Navbar Transparente */}
        <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
          <img src="/logo_easy.png" className="h-16 w-auto drop-shadow-lg" alt="Logo" />
          <div className="hidden md:flex gap-8 text-white font-bold uppercase tracking-widest text-xs">
            <a href="#destinos" className="hover:text-[#dd6e42] transition-colors">Destinos</a>
            <a href="#nosotros" className="hover:text-[#dd6e42] transition-colors">Nosotros</a>
            <a href="#vision" className="hover:text-[#dd6e42] transition-colors">Visión</a>
          </div>
          {isSignedIn ? (
            <button onClick={() => navigate('/map')} className="bg-[#dd6e42] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-transform">
              Ir al Mapa
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white hover:text-[#dd6e42] transition-all">
                Login
              </button>
            </SignInButton>
          )}
        </nav>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-40">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none"
          >
            Patagonia <br /> <span className="text-[#dd6e42]">Sin Límites</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-6 text-[#e8dab2] text-lg md:text-xl max-w-2xl font-medium"
          >
            Tu ecosistema digital para descubrir, conectar y vivir la Región de Aysén como nunca antes.
          </motion.p>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-12"
          >
            {!isSignedIn ? (
                <SignInButton mode="modal">
                    <button className="bg-[#dd6e42] text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(221,110,66,0.5)] hover:shadow-[0_0_60px_rgba(221,110,66,0.8)] hover:scale-105 transition-all">
                    Ingresar a la App
                    </button>
                </SignInButton>
            ) : (
                <button onClick={() => navigate('/map')} className="bg-[#dd6e42] text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(221,110,66,0.5)] hover:shadow-[0_0_60px_rgba(221,110,66,0.8)] hover:scale-105 transition-all">
                    Continuar Aventura
                </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* --- SECCIÓN DESTINOS (SCALABLE) --- */}
      <section id="destinos" className="py-20 px-6 md:px-20 bg-[#eaeaea]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
                <h2 className="text-[#4f6d7a] text-sm font-black uppercase tracking-[0.4em] mb-2">Explora la Región</h2>
                <h3 className="text-4xl md:text-6xl font-black text-[#1a2a30] uppercase italic tracking-tighter">Localidades</h3>
            </div>
            {/* Selector de Localidades */}
            <div className="hidden md:flex gap-4">
                {LOCALITIES.map(loc => (
                    <button 
                        key={loc.id}
                        disabled={!loc.active}
                        onClick={() => setSelectedLocality(loc.id)}
                        className={`px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === loc.id ? 'bg-[#4f6d7a] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                    >
                        {loc.name} {!loc.active && '(Pronto)'}
                    </button>
                ))}
            </div>
          </div>

          {/* Carrusel de Localidades (Mobile) */}
          <div className="md:hidden flex overflow-x-auto gap-4 pb-6 mb-8 no-scrollbar">
             {LOCALITIES.map(loc => (
                <button 
                    key={loc.id}
                    disabled={!loc.active}
                    onClick={() => setSelectedLocality(loc.id)}
                    className={`whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all flex-shrink-0 ${selectedLocality === loc.id ? 'bg-[#4f6d7a] text-white' : 'bg-white text-gray-400'}`}
                >
                    {loc.name}
                </button>
             ))}
          </div>

          {/* Contenido de la Localidad Seleccionada */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Info de la localidad */}
             <div className="lg:col-span-4 bg-white p-8 rounded-[3rem] shadow-xl border border-[#4f6d7a]/10 h-full flex flex-col justify-between">
                <div>
                    <h4 className="text-3xl font-black text-[#dd6e42] uppercase italic leading-none mb-4">Puerto Río Tranquilo</h4>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        El corazón turístico de la cuenca del Lago General Carrera. Famoso mundialmente por sus Catedrales de Mármol y su cercanía al Glaciar Exploradores.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-8">
                        <span className="px-3 py-1 bg-[#c0d6df] text-[#4f6d7a] rounded-full text-[10px] font-black uppercase">Naturaleza</span>
                        <span className="px-3 py-1 bg-[#c0d6df] text-[#4f6d7a] rounded-full text-[10px] font-black uppercase">Glaciares</span>
                        <span className="px-3 py-1 bg-[#c0d6df] text-[#4f6d7a] rounded-full text-[10px] font-black uppercase">Aventura</span>
                    </div>
                </div>
                <div className="p-6 bg-[#eaeaea] rounded-3xl">
                    <p className="text-xs font-bold text-[#4f6d7a] uppercase tracking-widest mb-2">Gestión Local</p>
                    <p className="text-sm text-gray-500">
                        Cada atractivo está verificado por nuestro Admin local para asegurar calidad y seguridad.
                    </p>
                </div>
             </div>

             {/* Galería de Lugares Hermosos */}
             <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {HIGHLIGHTS.map(place => (
                        <div key={place.id} className="group relative h-80 rounded-[3rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all" onClick={handleEnterApp}>
                            <img src={place.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/90 via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8">
                                <h5 className="text-2xl font-black text-white uppercase italic mb-1">{place.title}</h5>
                                <p className="text-white/80 text-sm mb-4 line-clamp-2">{place.desc}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {place.tags.map(tag => (
                                            <span key={tag} className="text-[9px] bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-lg uppercase font-bold">{tag}</span>
                                        ))}
                                    </div>
                                    <span className="w-10 h-10 bg-[#dd6e42] rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN MISIÓN / VISIÓN --- */}
      <section id="vision" className="py-20 bg-[#1a2a30] text-white rounded-t-[4rem] -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-[#dd6e42] text-sm font-black uppercase tracking-[0.4em] mb-2">Nuestra Esencia</h2>
                        <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Conectando la Patagonia</h3>
                    </div>
                    <div className="space-y-6 text-[#c0d6df]/80 text-lg leading-relaxed">
                        <p>
                            <strong className="text-white">Misión:</strong> Digitalizar y democratizar el acceso a las maravillas de Aysén, empoderando a los emprendedores locales con tecnología de punta y brindando a los viajeros una experiencia segura y sin fricciones.
                        </p>
                        <p>
                            <strong className="text-white">Visión:</strong> Ser el ecosistema digital líder del turismo austral, donde cada rincón hermoso de nuestra región tenga un nombre, una historia y un anfitrión responsable.
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute -inset-4 bg-[#dd6e42] rounded-[3rem] rotate-3 opacity-20"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1518182170546-0766be6f5a56?q=80&w=1000" 
                        className="relative rounded-[3rem] shadow-2xl border border-white/10 rotate-[-3deg] hover:rotate-0 transition-all duration-500"
                        alt="Vision"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#152024] py-12 text-center text-slate-500 text-sm">
        <img src="/logo_easy.png" className="h-12 w-auto mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
        <p className="uppercase tracking-widest font-bold mb-4">Easy Patagonia © 2024</p>
        <div className="flex justify-center gap-6 font-bold">
            <a href="#" className="hover:text-white">Instagram</a>
            <a href="#" className="hover:text-white">Contacto</a>
            <a href="#" className="hover:text-white">Soporte Empresas</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
