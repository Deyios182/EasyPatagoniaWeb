import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useAppAuth } from '../App';  // Dynamic Data Link
import { supabase } from '../supabaseClient';
import LogoTicker from '../components/LogoTicker';

interface LandingContent {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
}

interface LandingSettings {
  key: string;
  value: string;
}

interface CarouselImage {
  id: string;
  image_url: string;
  order_position: number;
  alt_text?: string;
}

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // Fetch Real Data
  const { allLocalities, allAttractions, allBusinesses } = useAppAuth();

  // Default to first active locality or 'tran' if none
  const [selectedLocality, setSelectedLocality] = useState<string>('loc-tranquilo');

  // Dynamic Landing Data
  const [content, setContent] = useState<Record<string, LandingContent>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update state when data loads
  useEffect(() => {
    if (allLocalities.length > 0 && !allLocalities.find(l => l.id === selectedLocality)) {
      setSelectedLocality(allLocalities[0].id);
    }
  }, [allLocalities]);

  // FETCH LANDING DATA FROM SUPABASE
  useEffect(() => {
    const fetchLandingData = async () => {
      setLoading(true);

      // Fetch content
      const { data: contentData } = await supabase
        .from('landing_content')
        .select('*');

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('landing_settings')
        .select('*');

      // Fetch carousel images
      const { data: carouselData } = await supabase
        .from('landing_carousel')
        .select('*')
        .eq('is_active', true)
        .order('order_position');

      // Transform content to object with key as index
      const contentObj: Record<string, LandingContent> = {};
      contentData?.forEach(item => {
        contentObj[item.key] = item;
      });

      // Transform settings to object with key as index
      const settingsObj: Record<string, string> = {};
      settingsData?.forEach(item => {
        settingsObj[item.key] = item.value;
      });

      setContent(contentObj);
      setSettings(settingsObj);
      setCarouselImages(carouselData || []);
      setLoading(false);
    };

    fetchLandingData();
  }, []);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentCarouselIndex((prev) => (prev + 1) % carouselImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselImages.length]);

  const [logoError, setLogoError] = useState(false);

  // Ref for horizontal scroll
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Ref for localities scroll
  const localitiesScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollLeftLocs = () => {
    if (localitiesScrollRef.current) {
      localitiesScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRightLocs = () => {
    if (localitiesScrollRef.current) {
      localitiesScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Filter Highlights based on selection
  const visibleHighlights = React.useMemo(() => {
    return allAttractions.filter(a => a.locality_id === selectedLocality);
  }, [allAttractions, selectedLocality]);

  const selectedLocalityDetails = allLocalities.find(l => l.id === selectedLocality);

  const handleEnterApp = () => {
    if (isAuthenticated) navigate('/map');
    else navigate('/welcome');
  };

  const openLink = (url: string) => window.open(url, '_blank');

  const handleWhatsApp = () => {
    const telefono = settings['contact_whatsapp'] || "56956425005";
    const mensaje = "¡Hola! Escribo desde la web EasyPatagonia.";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?phone=${telefono}&text=${encodeURIComponent(mensaje)}` : `https://web.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const email = settings['contact_email'] || 'contacto@easypatagonia.com';
    const subject = "Consulta desde EasyPatagonia";
    const body = "Hola, me gustaría recibir más información.";

    // Attempt standard mailto
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };




  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const openInGoogleMaps = (lat?: number, lng?: number, name?: string) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name || '')}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="min-h-screen bg-[#eaeaea] font-body text-[#1a2a30] overflow-x-hidden">

        {/* HERO SECTION WITH CAROUSEL */}
        <div className="relative h-screen w-full overflow-hidden bg-black">
          {/* Carousel Background */}
          <div className="absolute inset-0">
            {loading ? (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                </div>
              </div>
            ) : carouselImages.length > 0 ? (
              carouselImages.map((img, index) => (
                <div
                  key={img.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentCarouselIndex ? 'opacity-60' : 'opacity-0'
                    }`}
                >
                  <img
                    src={img.image_url}
                    className="w-full h-full object-cover"
                    alt={img.alt_text || `Patagonia ${index + 1}`}
                  />
                </div>
              ))
            ) : (
              <img
                src={content['hero']?.image_url || "https://images.unsplash.com/photo-1534234828563-0aa7c6d1b7e5?q=80&w=2070"}
                className="w-full h-full object-cover opacity-60"
                alt="Patagonia Background"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30] via-transparent to-black/30"></div>

          {/* Carousel Indicators */}
          {carouselImages.length > 1 && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-40">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentCarouselIndex
                    ? 'bg-[#dd6e42] w-8'
                    : 'bg-white/50 hover:bg-white/80'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1a2a30]/90 backdrop-blur-md py-2 shadow-lg' : 'bg-transparent py-2 md:py-6'}`}>
            <nav className="max-w-7xl mx-auto px-4 md:px-6 flex flex-row justify-between items-center h-full">
              <div className="cursor-pointer flex items-center gap-2" onClick={() => window.scrollTo(0, 0)}>
                {!logoError ? (
                  <img
                    src={settings['logo_url'] || "/logo_easy.png"}
                    className={`${scrolled ? 'h-8 md:h-10' : 'h-12 md:h-24'} w-auto object-contain hover:scale-105 transition-all duration-300`}
                    alt={settings['site_name'] || "Easy Patagonia"}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex flex-col">
                    <h1 className={`font-black italic tracking-tighter uppercase transition-all duration-300 ${scrolled ? 'text-sm md:text-lg' : 'text-lg md:text-2xl'}`}>
                      <span className="text-white">Easy</span>
                      <span className="text-[#dd6e42]">Patagonia</span>
                    </h1>
                    {!scrolled && (
                      <span className="hidden md:block text-[10px] text-[#dd6e42] tracking-[0.3em] font-bold uppercase">
                        {settings['site_tagline'] || 'Austral Experience'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Nav Links - Visible on Mobile (Compact) */}
              <div className={`flex gap-2 md:gap-6 px-2 py-1 md:px-6 md:py-2 rounded-full transition-all duration-300 ${scrolled ? 'bg-transparent' : 'bg-black/30 backdrop-blur-md border border-white/10'}`}>
                <button onClick={() => scrollToSection('destinos')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Destinos</button>
                <button onClick={() => scrollToSection('vision')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Visión</button>
                <button onClick={() => scrollToSection('contacto')} className="text-white text-[9px] md:text-xs font-black uppercase tracking-widest hover:text-[#dd6e42] transition-colors">Contacto</button>
              </div>

              <button
                onClick={handleEnterApp}
                className={`bg-[#dd6e42] text-white rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs shadow-lg hover:scale-105 transition-transform border-2 border-transparent hover:border-white ${scrolled ? 'px-4 py-1.5 md:px-6 md:py-2' : 'px-5 py-2 md:px-8 md:py-3'}`}
              >
                {isAuthenticated ? 'Ir al Mapa' : 'Ingresar'}
              </button>
            </nav>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-40">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none"
              dangerouslySetInnerHTML={{ __html: (content['hero']?.title || 'Patagonia <br /> <span class="text-[#dd6e42]">Sin Límites</span>').replace(/\n/g, '<br />').replace(/Patagonia/g, '<span class="text-[#dd6e42]">Patagonia</span>') }}
            ></motion.h1>
            <p className="mt-6 text-[#e8dab2] text-lg md:text-xl max-w-2xl font-medium drop-shadow-md italic">
              "{content['hero']?.subtitle || 'Menos planificación. Más Patagonia.'}"
            </p>
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce"><span className="material-symbols-outlined text-white text-4xl">keyboard_arrow_down</span></div>
        </div>

        {/* DESTINOS */}
        <section id="destinos" className="min-h-screen flex flex-col justify-center py-16 px-4 md:px-20 bg-[#eaeaea]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div><h2 className="text-[#4f6d7a] text-sm font-black uppercase tracking-[0.4em] mb-2">Explora la Región</h2><h3 className="text-4xl md:text-6xl font-black text-[#1a2a30] uppercase italic tracking-tighter">Localidades</h3></div>
              <div className="relative group/locs flex-1 w-full max-w-full md:max-w-2xl overflow-hidden">
                {/* Scroll Buttons for Localities */}
                <button
                  onClick={scrollLeftLocs}
                  className="hidden md:flex absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white text-[#1a2a30] rounded-full shadow-lg items-center justify-center hover:scale-110 hover:bg-[#4f6d7a] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Left"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <button
                  onClick={scrollRightLocs}
                  className="hidden md:flex absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white text-[#1a2a30] rounded-full shadow-lg items-center justify-center hover:scale-110 hover:bg-[#4f6d7a] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Right"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>

                <div
                  ref={localitiesScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-2 touch-pan-x w-full"
                >
                  {allLocalities.filter(l => l.is_active).map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocality(loc.id)}
                      className={`whitespace-nowrap px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all ${selectedLocality === loc.id ? 'bg-[#4f6d7a] text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200'}`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 min-h-[auto] lg:min-h-[400px]">
              <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-[#4f6d7a]/10 flex flex-col justify-between w-full max-w-full h-auto lg:h-full">
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-[#dd6e42] uppercase italic leading-none mb-4 break-words hyphens-auto">{selectedLocalityDetails?.name || 'Seleccione'}</h4>
                  <p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium break-words text-justify">{selectedLocalityDetails?.description || 'Descubre los tesoros de esta localidad.'}</p>
                </div>
                <div className="p-5 bg-[#eaeaea] rounded-2xl w-full">
                  <p className="text-[10px] font-bold text-[#4f6d7a] uppercase tracking-widest mb-1">Gestión Local</p>
                  <p className="text-[9px] text-gray-500 font-bold break-words">Datos actualizados por nuestros embajadores en terreno.</p>
                </div>
              </div>
              <div className="lg:col-span-2 relative group-hover/section">

                {/* Scroll Buttons (Visible on Desktop) */}
                <button
                  onClick={scrollLeft}
                  className="hidden md:flex absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white text-[#1a2a30] rounded-full shadow-xl items-center justify-center hover:scale-110 hover:bg-[#dd6e42] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Left"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>

                <button
                  onClick={scrollRight}
                  className="hidden md:flex absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white text-[#1a2a30] rounded-full shadow-xl items-center justify-center hover:scale-110 hover:bg-[#dd6e42] hover:text-white transition-all border border-gray-100"
                  aria-label="Scroll Right"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x px-2"
                >
                  {visibleHighlights.length > 0 ? visibleHighlights.map(place => (
                    <div key={place.id} className="min-w-[280px] md:min-w-[320px] group relative h-[500px] rounded-[3rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all snap-center">
                      <img src={place.main_image_url || 'https://via.placeholder.com/400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/90 via-transparent to-transparent"></div>

                      {/* Detail Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAuthenticated) {
                            navigate(`/attraction/${place.id}`);
                          } else {
                            navigate('/auth/login');
                          }
                        }}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white backdrop-blur-md p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10 group/maps"
                        title="Ver Detalles"
                      >
                        <span className="material-symbols-outlined text-[#dd6e42] text-xl">visibility</span>
                      </button>

                      <div className="absolute bottom-8 left-8 right-8 cursor-pointer" onClick={handleEnterApp}>
                        <h5 className="text-2xl font-black text-white uppercase italic mb-1 leading-none text-left">{place.name}</h5>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {place.keywords?.map(tag => (
                            <span key={tag} className="text-[9px] bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full uppercase font-black">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="w-full flex items-center justify-center p-12 text-gray-400 font-bold border-2 border-dashed rounded-[3rem]">
                      Pronto agregaremos atractivos aquí.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN NUESTRA VISIÓN (LIMPIA) --- */}
        <section id="vision" className="min-h-0 md:min-h-screen flex items-center py-20 bg-[#1a2a30] text-white rounded-t-[4rem] mt-0 md:-mt-10 relative z-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">

            {/* Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">🧭</span>
                <h3 className="text-base font-black uppercase mb-2">Conexión y Autenticidad</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">Ser la plataforma líder que conecta a los viajeros con experiencias auténticas.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">💡</span>
                <h3 className="text-base font-black uppercase mb-2">Planificación Simple</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">Soluciones innovadoras para simplificar tu viaje: hospedaje, gastronomía y tours.</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors">
                <span className="text-2xl mb-3 block">💚</span>
                <h3 className="text-base font-black uppercase mb-2">Turismo Sostenible</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">Promover un turismo responsable que respeta la riqueza natural de la Patagonia.</p>
              </div>
            </div>

            {/* Misión y Visión + Imagen */}
            <div className="flex flex-col lg:flex-row gap-10 items-center">

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

              {/* Columna Imagen (SIN TARJETA BLANCA) */}
              <div className="flex-1 relative w-full h-[300px] md:h-[500px]">
                {/* Imagen principal */}
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-all duration-700 z-10 bg-gray-800">
                  <img
                    src={content['vision']?.image_url || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover"
                    alt={content['vision']?.title || "Patagonia Vision"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a30]/40 to-transparent"></div>
                </div>

                {/* Decoración de fondo */}
                <div className="absolute top-4 -right-4 bottom-[-10px] left-4 bg-[#dd6e42] rounded-[3rem] -rotate-2 opacity-20 z-0"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        {/* CONTACTO REDESÑADO - WIDER & PREMIUM */}
        {/* CONTACTO */}
        <section id="contacto" className="relative py-24 bg-[#1a2a30] overflow-hidden z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#dd6e42] rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#4f6d7a] rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
              ¡Únete a la <span className="text-[#dd6e42]">Aventura</span>!
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-light mb-16 max-w-2xl mx-auto">
              Síguenos para descubrir rincones secretos, ofertas exclusivas y la magia de la Patagonia al instante.
            </p>

            {/* Social Grid - Wider & Prettier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
              <button onClick={() => openLink("https://www.instagram.com/easy.patagonia")} className="group bg-gradient-to-br from-[#833ab4]/10 to-[#E1306C]/10 border border-white/5 hover:border-[#E1306C]/50 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/5">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-[#833ab4] to-[#E1306C] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(225,48,108,0.4)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">Instagram</h3>
                <p className="text-xs text-slate-400">Inspiración visual diaria</p>
              </button>

              <button onClick={() => openLink("https://www.tiktok.com/@easy.patagonia?_t=ZM-8srRmTRFV1q&_r=1")} className="group bg-white/5 border border-white/5 hover:border-white/20 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/10">
                <div className="w-16 h-16 mx-auto mb-4 bg-black border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">movie</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">TikTok</h3>
                <p className="text-xs text-slate-400">Videos y tendencias</p>
              </button>

              <button onClick={handleWhatsApp} className="group bg-[#25D366]/5 border border-white/5 hover:border-[#25D366]/50 p-8 rounded-[2rem] transition-all hover:scale-105 hover:bg-white/5">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">chat</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-1">WhatsApp</h3>
                <p className="text-xs text-slate-400">Soporte directo 24/7</p>
              </button>
            </div>

            {/* Bottom Actions - Reordered as requested */}
            <div className="flex flex-col items-center gap-12">

              {/* 1. Contact Info (Now First) */}
              <div className="space-y-4">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">¿Prefieres escribirnos un correo?</p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contacto@easypatagonia.com&su=Consulta%20desde%20EasyPatagonia&body=Hola%2C%20me%20gustar%C3%ADa%20recibir%20m%C3%A1s%20informaci%C3%B3n."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-50 inline-block text-white text-2xl md:text-3xl font-black tracking-tight hover:text-[#dd6e42] transition-colors border-b-2 border-[#dd6e42]/30 hover:border-[#dd6e42] pb-1 cursor-pointer"
                >
                  contacto@easypatagonia.com
                </a>
              </div>

              {/* 2. Map Call to Action (Pushed down) */}
              <div className="w-full max-w-2xl border-t border-white/10 pt-12 mt-60">
                <button
                  onClick={handleEnterApp}
                  className="w-full relative group overflow-hidden bg-[#dd6e42] text-white px-10 py-8 rounded-[2rem] shadow-[0_20px_50px_rgba(221,110,66,0.3)] hover:shadow-[0_30px_60px_rgba(221,110,66,0.5)] transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className="text-2xl font-black uppercase tracking-[0.2em] italic group-hover:translate-y-[-2px] transition-transform">Explorar Mapa Interactivo</span>
                    <span className="text-xs font-bold bg-white/20 px-4 py-1 rounded-full uppercase tracking-widest group-hover:bg-white group-hover:text-[#dd6e42] transition-all">Acceso Inmediato</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-[#dd6e42] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* LOGO TICKER BANNER */}
        <section className="relative z-30 bg-[#1a2a30] pb-10 -mt-10 pt-10 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Empresas que confían en nosotros</h3>
          <LogoTicker businesses={allBusinesses} speed={60} />
        </section>

        <footer className="relative z-40 bg-[#152024] py-12 text-center text-slate-500 text-xs">
          <img src="/logo_easy.png" className="h-10 w-auto mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" alt="Logo Footer" onError={(e) => e.currentTarget.style.display = 'none'} />
          <p className="uppercase tracking-widest font-black mb-4">Easy Patagonia © 2024</p>
          <p>Desarrollado con ❤️ en la Región de Aysén</p>
        </footer>
      </div >
    </>
  );
};

export default LandingPage;
